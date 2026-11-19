import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import { ROLE_CONFIG, ROLES, TOKEN_COOKIE, type Role } from "@/app/_lib/constants/roles";
import type { AuthUser, LoginBody, SignupBody } from "@/app/_lib/types/api";
import { db, findUser, nextId, type MockUser } from "../data";

const base = `${API_URL}/api`;

/** 서명 없는 가짜 JWT. proxy.ts는 payload의 role만 읽는다 */
function fakeJwt(user: AuthUser) {
  const enc = (obj: object) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ ...user, exp })}.mock`;
}

/**
 * 실제 서버는 Set-Cookie(httpOnly)로 토큰을 심는다.
 * MSW는 httpOnly 쿠키를 만들 수 없어서 브라우저 쿠키에 직접 넣는다 (가짜 API에서만).
 */
function setTokenCookie(token: string | null) {
  document.cookie = token
    ? `${TOKEN_COOKIE}=${token}; path=/; max-age=86400; samesite=lax`
    : `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

function toAuthUser(u: MockUser): AuthUser {
  return {
    role: u.role,
    id: u.id,
    name: u.name,
    ...(u.role === "owner" ? { restaurant_id: u.restaurant_id ?? null } : {}),
  };
}

function readTokenUser(): AuthUser | null {
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`))?.split("=")[1];
  if (!raw) return null;
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
    );
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

const roleHandlers = (role: Role) => {
  const seg = ROLE_CONFIG[role].apiSegment;
  return [
    // C1·O1·R1 회원가입
    http.post(`${base}/${seg}/signup`, async ({ request }) => {
      await delay(500);
      const body = (await request.json()) as SignupBody;
      if (findUser(role, body.email)) {
        return HttpResponse.json({ message: "이미 가입된 이메일이에요" }, { status: 409 });
      }
      db.users.push({
        id: nextId(role),
        role,
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        ...(role === "owner" ? { restaurant_id: null } : {}),
      });
      return new HttpResponse(null, { status: 201 });
    }),

    // C2·O2·R2 로그인
    http.post(`${base}/${seg}/login`, async ({ request }) => {
      await delay(500);
      const body = (await request.json()) as LoginBody;
      const user = findUser(role, body.email);
      if (!user || user.password !== body.password) {
        return HttpResponse.json(
          { message: "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요." },
          { status: 401 },
        );
      }
      const authUser = toAuthUser(user);
      setTokenCookie(fakeJwt(authUser));
      return HttpResponse.json(authUser);
    }),
  ];
};

export const authHandlers = [
  ...ROLES.flatMap(roleHandlers),

  // A1 로그아웃
  http.post(`${base}/auth/logout`, () => {
    setTokenCookie(null);
    return new HttpResponse(null, { status: 204 });
  }),

  // A2 내 정보
  http.get(`${base}/auth/me`, () => {
    const user = readTokenUser();
    if (!user) return HttpResponse.json({ message: "로그인이 필요해요" }, { status: 401 });
    return HttpResponse.json(user);
  }),
];
