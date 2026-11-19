import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="장바구니" back="/" />
      <PagePlaceholder
        summary="장바구니 · 배송지 선택 · 결제하기"
        items={[
          "수량 +/−, 빼기. 장바구니는 localStorage에 저장 (새로고침해도 유지)",
          "배송지: 마지막 주문에 쓴 배송지 자동 선택, 없으면 바로 등록 폼",
          "금액 3줄: 메뉴 합계 / 배달비 / 총 결제금액",
          "[n원 결제하기] → 토스 결제창"
        ]}
      />
    </>
  );
}
