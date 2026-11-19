/**
 * 브라우저에 로그인 토큰을 보관한다.
 * - API 호출: Authorization: Bearer <token> (client.ts 인터셉터)
 * - 페이지 접근 제어: proxy.ts가 token·role 쿠키를 읽음
 * 서버가 아니라 프론트가 쿠키를 쓰므로 httpOnly가 아니다 (과제 범위에서 허용).
 */
import { ROLE_COOKIE, TOKEN_COOKIE, type Role } from "@/app/_lib/constants/roles";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

export function getToken() {
  return readCookie(TOKEN_COOKIE);
}

/** 로그인 성공 시. 만료 시각(expiresAt)이 지나면 쿠키도 같이 사라진다 */
export function saveSession(token: string, role: Role, expiresAt?: string) {
  const exp = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const attrs = `path=/; expires=${exp.toUTCString()}; samesite=lax`;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; ${attrs}`;
  document.cookie = `${ROLE_COOKIE}=${role}; ${attrs}`;
}

export function clearSession() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}
