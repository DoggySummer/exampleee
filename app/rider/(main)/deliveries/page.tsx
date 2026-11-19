import { AppHeader } from "@/app/_components/AppHeader";
import { DeliveryList } from "./_components/DeliveryList";

export default function Page() {
  return (
    <>
      <AppHeader title="내 배달" badge="라이더" />
      <DeliveryList />
    </>
  );
}
