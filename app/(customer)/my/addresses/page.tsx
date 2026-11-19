import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="내 정보" right={<LogoutButton role="customer" />} />
      <PagePlaceholder
        summary="배송지 관리"
        items={[
          "배송지 추가·수정·삭제 (등록 폼은 모달, 장바구니와 같이 씀)",
          "주문에 쓴 배송지는 삭제 불가 안내"
        ]}
      />
    </>
  );
}
