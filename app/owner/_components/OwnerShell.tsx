"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LuBell } from "react-icons/lu";
import { Toaster } from "@/app/_components/Toaster";
import { useMyRestaurant, useOwnerOrders } from "@/app/_hooks/queries/owner";
import { ORDER_STATUS } from "@/app/_lib/constants/status";
import { playNewOrderSound, unlockSound } from "@/app/_lib/utils/alertSound";
import { useOwnerUi } from "@/app/_stores/ownerUiStore";

const NEW_RESTAURANT = "/owner/restaurant/new";

/**
 * 로그인한 사장님 화면 공통
 * - 가게가 없으면 가게 등록으로 보낸다
 * - 어느 화면에 있든 새 주문을 감시한다 (10초 폴링 + 알림음 + 팝업)
 */
export function OwnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: restaurant, isSuccess, isFetching } = useMyRestaurant();

  useEffect(() => {
    if (isSuccess && !isFetching && restaurant === null && pathname !== NEW_RESTAURANT) router.replace(NEW_RESTAURANT);
  }, [isSuccess, isFetching, restaurant, pathname, router]);

  // 브라우저는 첫 클릭 전에는 소리를 막는다 → 화면을 한 번이라도 누르면 알림음을 켠다
  useEffect(() => {
    const onDown = () => unlockSound();
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <>
      {children}
      {restaurant && <NewOrderWatcher />}
      <Toaster />
    </>
  );
}

function NewOrderWatcher() {
  const router = useRouter();
  const { data } = useOwnerOrders();
  const { newCount, addNew, clearNew, setTab } = useOwnerUi();
  const seen = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!data) return;
    const pending = data.filter((o) => o.status === ORDER_STATUS.PENDING).map((o) => o.order_id);
    // 처음 불러온 주문은 "새 주문"이 아니다
    if (seen.current === null) {
      seen.current = new Set(pending);
      return;
    }
    const fresh = pending.filter((id) => !seen.current!.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.current!.add(id));
    addNew(fresh.length);
    playNewOrderSound();
    navigator.vibrate?.(200);
  }, [data, addNew]);

  if (newCount === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-[80px] z-40 flex justify-center px-4" role="alert">
      <div className="flex w-full max-w-[448px] items-center justify-between gap-3 rounded-xl bg-ink py-3 pr-3 pl-4 text-white shadow-[0_8px_24px_rgba(16,21,28,.3)]">
        <span className="flex items-center gap-2.5 font-bold">
          <LuBell size={20} aria-hidden />새 주문 {newCount}건이 들어왔어요
        </span>
        <button
          type="button"
          onClick={() => {
            clearNew();
            setTab("new");
            router.push("/owner");
          }}
          className="h-10 shrink-0 rounded-lg bg-brand px-4 text-sm font-extrabold"
        >
          확인
        </button>
      </div>
    </div>
  );
}
