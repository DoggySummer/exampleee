import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default async function Page({ params }: PageProps<"/owner/settlements/[id]">) {
  const { id } = await params;
  return (
    <>
      <AppHeader title={`정산 상세 #${id}`} back="/owner/settlements" />
      <PagePlaceholder
        summary="정산 상세 (라이더와 같은 컴포넌트)"
        items={[
          "그 주에 배달완료된 주문별 금액과 합계",
          "점주 몫 = 주문금액 (수수료 없음)"
        ]}
      />
    </>
  );
}
