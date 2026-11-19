import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="가게 등록" badge="사장님" />
      <PagePlaceholder
        summary="가게가 없는 점주의 첫 화면"
        items={[
          "상호명, 주소, 배달비, 대표 사진(필수)",
          "등록 후 \"메뉴를 등록하고 영업을 시작하세요\" + 메뉴 관리로 이동",
          "가게는 영업종료 상태로 시작"
        ]}
      />
    </>
  );
}
