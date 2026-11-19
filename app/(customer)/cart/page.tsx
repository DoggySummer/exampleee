import { AppHeader } from "@/app/_components/AppHeader";
import { CartView } from "./_components/CartView";

export default function Page() {
  return (
    <>
      <AppHeader title="장바구니" back="/" />
      <CartView />
    </>
  );
}
