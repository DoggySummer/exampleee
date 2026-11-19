import { HttpResponse } from "msw";
import { TOKEN_COOKIE, type Role } from "@/app/_lib/constants/roles";
import type { AuthUser } from "@/app/_lib/types/api";

/** 가짜 API에서 쿠키의 토큰을 읽어 로그인한 사용자를 알아낸다 */
export function readTokenUser(): AuthUser | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOKEN_COOKIE}=`))
    ?.split("=")[1];
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

/** 해당 역할로 로그인했으면 사용자, 아니면 401·403 응답 */
export function requireRole(role: Role): AuthUser | Response {
  const user = readTokenUser();
  if (!user) return HttpResponse.json({ message: "로그인이 필요해요" }, { status: 401 });
  if (user.role !== role) return HttpResponse.json({ message: "이 기능을 쓸 권한이 없어요" }, { status: 403 });
  return user;
}
