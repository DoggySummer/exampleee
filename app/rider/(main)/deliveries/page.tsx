import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="내 배달" badge="라이더" />
      <PagePlaceholder
        summary="진행중 / 완료 탭"
        items={[
          "완료 카드: 날짜, 가게명, 배달비"
        ]}
      />
    </>
  );
}
