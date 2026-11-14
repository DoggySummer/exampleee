import { MobileShell } from "@/app/_components/MobileShell";
import { OwnerHeader } from "./_components/OwnerHeader";
import { OwnerTabBar } from "./_components/OwnerTabBar";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell tone="canvas">
      <OwnerHeader />
      {children}
      <OwnerTabBar />
    </MobileShell>
  );
}
