import { AppHeader } from "@/app/_components/AppHeader";
import { OwnerSettlementList } from "./_components/OwnerSettlementList";

export default function Page() {
  return (
    <>
      <AppHeader title="정산" badge="사장님" />
      <OwnerSettlementList />
    </>
  );
}
