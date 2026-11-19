import { AppHeader } from "@/app/_components/AppHeader";
import { MenuManager } from "./_components/MenuManager";

export default function Page() {
  return (
    <>
      <AppHeader title="메뉴" badge="사장님" />
      <MenuManager />
    </>
  );
}
