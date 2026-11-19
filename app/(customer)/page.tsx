import { AppHeader } from "@/app/_components/AppHeader";
import { HeaderActions } from "./_components/HeaderActions";
import { RestaurantList } from "./_components/RestaurantList";

/** 가게 목록 — 로그인 없이 볼 수 있다 */
export default function Page() {
  return (
    <>
      <AppHeader title="동네배달" right={<HeaderActions />} />
      <main className="flex flex-1 flex-col pb-2">
        <RestaurantList />
      </main>
    </>
  );
}
