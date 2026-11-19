import { AppHeader } from "@/app/_components/AppHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader title="결제 확인" />
      {children}
    </>
  );
}
