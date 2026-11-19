import { ROLES, type Role } from "@/app/_lib/constants/roles";

/**
 * proxy.ts용: 쿠키의 토큰·역할로 어느 화면에 들여보낼지만 판단한다.
 * 토큰 내용은 해석하지 않는다 (진짜 검증은 백엔드가 매 요청마다 함).
 * 토큰이 만료되면 쿠키가 같이 만료되도록 저장하므로 쿠키가 있으면 유효한 것으로 본다.
 */
export function readRole(token: string | undefined, role: string | undefined): Role | null {
  if (!token) return null;
  return ROLES.includes(role as Role) ? (role as Role) : null;
}
