import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default async function Page({ params }: PageProps<"/rider/settlements/[id]">) {
  const { id } = await params;
  return (
    <>
      <AppHeader title={`정산 상세 #${id}`} back="/rider/settlements" />
      <PagePlaceholder
        summary="정산 상세 (점주와 같은 컴포넌트)"
        items={[
          "주문별 배달비와 합계"
        ]}
      />
    </>
  );
}
