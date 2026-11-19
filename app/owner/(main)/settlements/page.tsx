import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="정산" badge="사장님" />
      <PagePlaceholder
        summary="주별 정산 목록"
        items={[
          "기간(월~일), 금액, 지급 예정 / 지급 완료",
          "정산은 서버가 매주 월요일 자동 생성 · 지급",
          "없으면 \"첫 정산은 다음 주 월요일에 만들어져요\""
        ]}
      />
    </>
  );
}
