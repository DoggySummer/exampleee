import { apiClient } from "@/app/_lib/api/client";
import { ROLE_CONFIG, type Role } from "@/app/_lib/constants/roles";
import type { AuthUser, LoginBody, SignupBody } from "@/app/_lib/types/api";

/** C2·O2·R2 로그인. 성공하면 서버가 token 쿠키를 심는다 */
export async function login(role: Role, body: LoginBody) {
  const { data } = await apiClient.post<AuthUser>(`/${ROLE_CONFIG[role].apiSegment}/login`, body);
  return data;
}

/** C1·O1·R1 회원가입. 이메일 중복이면 409 */
export async function signup(role: Role, body: SignupBody) {
  await apiClient.post(`/${ROLE_CONFIG[role].apiSegment}/signup`, body);
}

/** A1 로그아웃. httpOnly 쿠키는 프론트가 지울 수 없어서 서버가 지운다 */
export async function logout() {
  await apiClient.post("/auth/logout");
}

/** A2 내 정보 (새로고침 후 이름 표시용) */
export async function getMe() {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}
