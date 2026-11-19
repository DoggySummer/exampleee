import { BottomTabBar } from "@/app/_components/BottomTabBar";
import { MobileShell } from "@/app/_components/MobileShell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar role="customer" />
    </MobileShell>
  );
}
