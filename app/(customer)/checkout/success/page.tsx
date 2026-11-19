import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="결제 확인" back="/cart" />
      <PagePlaceholder
        summary="토스 성공 → 서버 승인 → 주문 저장"
        items={[
          "\"결제를 확인하고 있어요\" 로딩",
          "paymentKey·orderId·amount를 C9로 전송, 성공하면 장바구니 비우고 주문 상세로",
          "새로고침해도 주문이 두 번 생기면 안 됨",
          "승인 실패 → \"결제가 완료되지 않았어요\" + 다시 시도"
        ]}
      />
    </>
  );
}
