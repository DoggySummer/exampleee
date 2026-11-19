import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { NewRestaurant } from "./_components/NewRestaurant";

export default function Page() {
  return (
    <>
      <AppHeader title="가게 등록" badge="사장님" right={<LogoutButton role="owner" />} />
      <NewRestaurant />
    </>
  );
}
