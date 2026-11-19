import { MobileShell } from "@/app/_components/MobileShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
