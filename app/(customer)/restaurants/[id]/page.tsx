import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default async function Page({ params }: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  return (
    <>
      <AppHeader title={`가게 상세 #${id}`} back="/" />
      <PagePlaceholder
        summary="가게 정보 + 메뉴 + 장바구니 담기"
        items={[
          "메뉴: 사진(선택), 이름, 가격. 품절 메뉴는 회색 + 담기 불가",
          "다른 가게 메뉴를 담으면 \"장바구니를 비울까요?\" 확인",
          "영업종료면 담기 버튼 비활성",
          "하단 고정 바: 장바구니 n개 · 금액 보기",
          "담기부터 로그인 필요 → 로그인 후 이 화면으로 돌아옴"
        ]}
      />
    </>
  );
}
