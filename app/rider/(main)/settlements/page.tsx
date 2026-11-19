import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="정산" badge="라이더" right={<LogoutButton role="rider" />} />
      <PagePlaceholder
        summary="주별 정산 목록"
        items={[
          "점주 정산과 같은 화면. 금액은 배달비 합계"
        ]}
      />
    </>
  );
}
