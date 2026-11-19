import { MobileShell } from "@/app/_components/MobileShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
