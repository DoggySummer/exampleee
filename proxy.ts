import { NextResponse, type NextRequest } from "next/server";
import { readRole } from "@/app/_lib/auth/token";
import { ROLE_CONFIG, ROLE_COOKIE, TOKEN_COOKIE, type Role } from "@/app/_lib/constants/roles";

/** 로그인·회원가입 화면은 누구나 들어갈 수 있다 */
const AUTH_PAGES = new Set(
  Object.values(ROLE_CONFIG).flatMap((c) => [c.loginPath, c.signupPath] as string[]),
);

/** 이 주소가 어느 역할의 화면인지 */
function requiredRole(pathname: string): Role {
  if (pathname === "/owner" || pathname.startsWith("/owner/")) return "owner";
  if (pathname === "/rider" || pathname.startsWith("/rider/")) return "rider";
  return "customer";
}

/**
 * 역할별 접근 제어
 * - 로그인 안 했거나 다른 역할이면 그 역할의 로그인 화면으로 보낸다.
 * - 로그인 후 원래 가려던 곳으로 돌아오도록 next에 주소를 담는다.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (AUTH_PAGES.has(pathname)) return NextResponse.next();

  const need = requiredRole(pathname);
  const role = readRole(request.cookies.get(TOKEN_COOKIE)?.value, request.cookies.get(ROLE_COOKIE)?.value);
  if (role === need) return NextResponse.next();

  const url = new URL(ROLE_CONFIG[need].loginPath, request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // 손님 화면 중 가게 목록(/)과 가게 상세(/restaurants/*)는 로그인 없이 볼 수 있다
  matcher: [
    "/cart",
    "/checkout/:path*",
    "/orders/:path*",
    "/my/:path*",
    "/owner/:path*",
    "/rider/:path*",
  ],
};
