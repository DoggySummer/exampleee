import { BottomTabBar } from "@/app/_components/BottomTabBar";
import { Toaster } from "@/app/_components/Toaster";

export default function RiderMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar role="rider" />
      <Toaster />
    </>
  );
}
