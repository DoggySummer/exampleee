import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { RestaurantSettings } from "./_components/RestaurantSettings";

export default function Page() {
  return (
    <>
      <AppHeader title="가게" badge="사장님" right={<LogoutButton role="owner" />} />
      <RestaurantSettings />
    </>
  );
}
