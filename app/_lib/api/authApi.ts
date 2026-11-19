import { apiClient } from "@/app/_lib/api/client";
import { clearSession, saveSession } from "@/app/_lib/auth/session";
import { API_ROLE, fromApiRole, type Role } from "@/app/_lib/constants/roles";
import type { ApiUser, AuthUser, LoginBody, LoginResponse, SignupBody } from "@/app/_lib/types/api";

/** API 응답의 사용자 → 화면에서 쓰는 모양 */
function toAuthUser(u: ApiUser): AuthUser {
  return { role: fromApiRole(u.role) ?? "customer", id: u.id, name: u.name, riderStatus: u.status };
}

/** API 02 로그인 — 토큰을 받아 쿠키에 보관한다 */
export async function login(role: Role, body: LoginBody) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", { role: API_ROLE[role], ...body });
  saveSession(data.token, role, data.expiresAt);
  return toAuthUser(data.user);
}

/** API 01 회원가입 — 이메일 중복이면 409. 점주는 phone 없음 */
export async function signup(role: Role, body: SignupBody) {
  await apiClient.post("/auth/register", { role: API_ROLE[role], ...body });
}

/** API 03 로그아웃 — 서버 요청이 실패해도 브라우저의 토큰은 지운다 */
export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearSession();
  }
}

/** API 04 내 정보 (라이더는 운행상태 status 포함) */
export async function getMe() {
  const { data } = await apiClient.get<ApiUser>("/me");
  return toAuthUser(data);
}
