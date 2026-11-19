import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="결제 취소" back="/cart" />
      <PagePlaceholder
        summary="결제창을 닫았거나 인증에 실패한 경우"
        items={[
          "\"결제가 취소됐어요\" 안내",
          "[장바구니로 돌아가기]. 장바구니는 그대로"
        ]}
      />
    </>
  );
}
