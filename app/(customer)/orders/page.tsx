import { AppHeader } from "@/app/_components/AppHeader";
import { OrderList } from "./_components/OrderList";

export default function Page() {
  return (
    <>
      <AppHeader title="주문내역" />
      <OrderList />
    </>
  );
}
