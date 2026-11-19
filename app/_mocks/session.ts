import { HttpResponse } from "msw";
import { API_ROLE, type Role } from "@/app/_lib/constants/roles";
import type { AuthUser } from "@/app/_lib/types/api";

/**
 * 가짜 토큰: 사용자 정보를 base64로 담은 문자열 (새로고침해도 해석 가능하게).
 * 실제 서버의 토큰 형식과는 상관없다. 프론트는 토큰 내용을 읽지 않는다.
 */
export function makeToken(user: AuthUser) {
  const bytes = new TextEncoder().encode(JSON.stringify(user));
  return `mock.${btoa(String.fromCharCode(...bytes))}`;
}

/** Authorization: Bearer <token> 헤더로 로그인한 사용자를 알아낸다 */
export function readTokenUser(request: Request): AuthUser | null {
  const auth = request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token?.startsWith("mock.")) return null;
  try {
    const json = new TextDecoder().decode(Uint8Array.from(atob(token.slice(5)), (c) => c.charCodeAt(0)));
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

/** 해당 역할로 로그인했으면 사용자, 아니면 401·403 응답 */
export function requireRole(request: Request, role: Role): AuthUser | Response {
  const user = readTokenUser(request);
  if (!user) return HttpResponse.json({ message: "로그인이 필요해요" }, { status: 401 });
  if (user.role !== role) return HttpResponse.json({ message: "이 기능을 쓸 권한이 없어요" }, { status: 403 });
  return user;
}

export const toApiRole = (r: Role) => API_ROLE[r];
