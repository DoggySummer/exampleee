import { decodeJwt } from "jose";
import { ROLES, type Role } from "@/app/_lib/constants/roles";

/**
 * 토큰에서 역할만 꺼낸다 (서명 검증은 하지 않음).
 * 프론트는 "어느 화면에 들여보낼지"만 판단하고, 진짜 검증은 Express가 매 요청마다 한다.
 */
export function readRole(token: string | undefined): Role | null {
  if (!token) return null;
  try {
    const { role, exp } = decodeJwt(token);
    if (typeof exp === "number" && exp * 1000 < Date.now()) return null;
    return ROLES.includes(role as Role) ? (role as Role) : null;
  } catch {
    return null;
  }
}
