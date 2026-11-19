import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="가게" badge="사장님" right={<LogoutButton role="owner" />} />
      <PagePlaceholder
        summary="가게 정보 수정"
        items={[
          "상호명, 주소, 배달비, 대표 사진",
          "배달비 아래 안내: \"바꿔도 이미 들어온 주문은 그대로예요\""
        ]}
      />
    </>
  );
}
