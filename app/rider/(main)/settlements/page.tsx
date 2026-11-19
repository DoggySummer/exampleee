import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { RiderSettlementList } from "./_components/RiderSettlementList";

export default function Page() {
  return (
    <>
      <AppHeader title="정산" badge="라이더" right={<LogoutButton role="rider" />} />
      <RiderSettlementList />
    </>
  );
}
