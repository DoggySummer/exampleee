import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default async function Page({ params }: PageProps<"/rider/deliveries/[id]">) {
  const { id } = await params;
  return (
    <>
      <AppHeader title={`배달 상세 #${id}`} back="/rider/deliveries" />
      <PagePlaceholder
        summary="배달 전표 + 하단 버튼 하나"
        items={[
          "픽업지, 배달지, 메뉴·수량, 배달비 (손님 정보 없음)",
          "버튼: [픽업 완료] → [배달 완료] (픽업 완료가 픽업완료·배달중을 한 번에 기록)",
          "[배달 완료]만 확인 모달. 완료 후 \"+3,000원\" 안내 → 홈"
        ]}
      />
    </>
  );
}
