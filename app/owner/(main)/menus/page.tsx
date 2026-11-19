import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="메뉴" badge="사장님" />
      <PagePlaceholder
        summary="메뉴 목록 · 추가 · 수정 · 품절"
        items={[
          "목록: 사진, 이름, 가격, 품절 토글 (삭제 없음)",
          "추가·수정은 모달 폼: 이름, 가격, 사진(선택)",
          "사진은 5MB 이하 jpg·png"
        ]}
      />
    </>
  );
}
