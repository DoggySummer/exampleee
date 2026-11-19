import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import { fromApiRole } from "@/app/_lib/constants/roles";
import type { ApiUser, LoginBody, LoginResponse, SignupBody } from "@/app/_lib/types/api";
import { db, findUser, nextId, type MockUser } from "../data";
import { makeToken, readTokenUser, toApiRole } from "../session";

const base = `${API_URL}/api`;
const err = (status: number, message: string) => HttpResponse.json({ message }, { status });

/** API 명세서의 사용자 객체: 점주는 phone 없음, 라이더는 status 추가, 비밀번호는 빼고 */
function toApiUser(u: MockUser): ApiUser {
  return {
    id: u.id,
    role: toApiRole(u.role),
    name: u.name,
    email: u.email,
    ...(u.role !== "owner" ? { phone: u.phone } : {}),
    ...(u.role === "rider" ? { status: db.riderStatus[u.id] ?? "운행종료" } : {}),
  };
}

export const authHandlers = [
  // API 01 회원가입
  http.post(`${base}/auth/register`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as SignupBody & { role: string };
    const role = fromApiRole(body.role);
    if (!role || !body.email || !body.password || !body.name) return err(400, "가입 정보를 확인해 주세요");
    if (role !== "owner" && !body.phone) return err(400, "가입 정보를 확인해 주세요");
    if (findUser(role, body.email)) return err(409, "이미 가입된 이메일이에요");
    const user: MockUser = {
      id: nextId(role),
      role,
      name: body.name,
      email: body.email,
      password: body.password,
      phone: role === "owner" ? undefined : body.phone,
      ...(role === "owner" ? { restaurant_id: null } : {}),
    };
    db.users.push(user);
    if (role === "rider") db.riderStatus[user.id] = "운행종료";
    return HttpResponse.json(toApiUser(user), { status: 201 });
  }),

  // API 02 로그인 — 토큰은 응답 본문으로
  http.post(`${base}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as LoginBody & { role: string };
    const role = fromApiRole(body.role);
    const user = role ? findUser(role, body.email) : undefined;
    if (!user || user.password !== body.password) {
      return err(401, "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.");
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res: LoginResponse = {
      token: makeToken({ role: user.role, id: user.id, name: user.name }),
      tokenType: "Bearer",
      expiresAt,
      user: toApiUser(user),
    };
    return HttpResponse.json(res);
  }),

  // API 03 로그아웃
  http.post(`${base}/auth/logout`, ({ request }) => {
    if (!readTokenUser(request)) return err(401, "로그인이 필요해요");
    return new HttpResponse(null, { status: 204 });
  }),

  // API 04 내 정보
  http.get(`${base}/me`, ({ request }) => {
    const t = readTokenUser(request);
    const user = t && db.users.find((u) => u.role === t.role && u.id === t.id);
    if (!user) return err(401, "로그인이 필요해요");
    return HttpResponse.json(toApiUser(user));
  }),
];
