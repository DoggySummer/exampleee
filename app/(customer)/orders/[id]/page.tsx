import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default async function Page({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return (
    <>
      <AppHeader title={`주문 상세 #${id}`} back="/orders" />
      <PagePlaceholder
        summary="주문 티켓 + 5단계 진행 상황 (10초 폴링)"
        items={[
          "상단 초록 배너: 배달 주소",
          "티켓: 주문번호, 가게명, 메뉴·수량, 결제금액",
          "타임라인: 주문접수 → 조리중 → 배달준비 → 배달중 → 배달완료",
          "거절이면 타임라인 대신 \"가게 사정으로 주문이 취소됐어요. 결제는 자동으로 취소됐어요\"",
          "라이더 정보는 보여 주지 않음 (결정 사항)"
        ]}
      />
    </>
  );
}
