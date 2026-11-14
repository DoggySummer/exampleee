import { MobileShell } from "@/app/_components/MobileShell";
import { CustomerTabBar } from "./_components/CustomerTabBar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      {children}
      <CustomerTabBar />
    </MobileShell>
  );
}
