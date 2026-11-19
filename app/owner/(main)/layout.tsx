import { BottomTabBar } from "@/app/_components/BottomTabBar";
import { OwnerShell } from "../_components/OwnerShell";

/** 로그인한 사장님 화면 공통: 가게 확인, 새 주문 감시, 하단 탭 */
export default function OwnerMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <OwnerShell>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar role="owner" />
    </OwnerShell>
  );
}
