import { AppHeader } from "@/app/_components/AppHeader";
import { LogoutButton } from "@/app/_components/LogoutButton";
import { AddressManager } from "./_components/AddressManager";

export default function Page() {
  return (
    <>
      <AppHeader title="내 정보" right={<LogoutButton role="customer" />} />
      <AddressManager />
    </>
  );
}
