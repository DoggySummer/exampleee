import { BottomTabBar } from "@/app/_components/BottomTabBar";

/**
 * 로그인한 점주 화면 공통.
 * TODO: 새 주문 감시(10초 폴링 + 알림음 + "새 주문 n건" 팝업)를 여기에 둔다.
 *       메뉴·정산 화면에 있어도 알림이 와야 하기 때문.
 */
export default function OwnerMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar role="owner" />
    </>
  );
}
