import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="주문내역" />
      <PagePlaceholder
        summary="내 주문 목록 (최신순)"
        items={[
          "카드: 가게명, 주문일시, 대표 메뉴 외 n개, 결제금액, 현재 상태",
          "누르면 주문 상세로"
        ]}
      />
    </>
  );
}
