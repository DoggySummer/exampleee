import { AppHeader } from "@/app/_components/AppHeader";
import { ROLE_CONFIG, type Role } from "@/app/_lib/constants/roles";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 역할별 로그인 페이지. /login, /owner/login, /rider/login 이 같이 쓴다 */
export async function LoginPage({ role, searchParams }: { role: Role; searchParams: SearchParams }) {
  const sp = await searchParams;
  return <LoginForm role={role} next={one(sp.next)} joinedEmail={one(sp.joined)} />;
}

/** 역할별 회원가입 페이지 */
export function SignupPage({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <>
      <AppHeader title={cfg.signupTitle} back={cfg.loginPath} />
      <SignupForm role={role} />
    </>
  );
}
