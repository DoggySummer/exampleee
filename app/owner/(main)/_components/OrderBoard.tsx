"use client";

import { LuClipboardList } from "react-icons/lu";
import { AppHeader } from "@/app/_components/AppHeader";
import { EmptyState } from "@/app/_components/EmptyState";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useMyRestaurant, useOwnerOrders } from "@/app/_hooks/queries/owner";
import { ORDER_STATUS, RESTAURANT_STATUS } from "@/app/_lib/constants/status";
import type { OwnerOrder } from "@/app/_lib/types/api";
import { useOwnerUi, type OwnerTab } from "@/app/_stores/ownerUiStore";
import { OpenToggle } from "../../_components/OpenToggle";
import { OwnerOrderCard } from "./OwnerOrderCard";

const TABS: { key: OwnerTab; label: string; match: (o: OwnerOrder) => boolean }[] = [
  { key: "new", label: "신규", match: (o) => o.status === ORDER_STATUS.PENDING },
  { key: "cooking", label: "조리중", match: (o) => o.status === ORDER_STATUS.COOKING },
  { key: "done", label: "완료", match: (o) => o.status === ORDER_STATUS.COOKED || o.status === ORDER_STATUS.REJECTED },
];

const EMPTY: Record<OwnerTab, string> = {
  new: "새로 들어온 주문이 없어요",
  cooking: "조리 중인 주문이 없어요",
  done: "완료된 주문이 없어요",
};

/** 주문 관리 — 신규 / 조리중 / 완료 탭 */
export function OrderBoard() {
  const { data: restaurant } = useMyRestaurant();
  const { data, isPending, isError, refetch } = useOwnerOrders(!!restaurant);
  const { tab, setTab } = useOwnerUi();

  const current = TABS.find((t) => t.key === tab)!;
  const rows = data?.filter(current.match) ?? [];
  const closed = restaurant?.status === RESTAURANT_STATUS.CLOSED;

  return (
    <>
      <AppHeader title={restaurant?.name ?? "주문"} badge="사장님" right={<OpenToggle />} />
      <div role="tablist" aria-label="주문 상태" className="sticky top-[52px] z-10 flex border-b border-line bg-paper">
        {TABS.map((t) => {
          const on = t.key === tab;
          const count = data?.filter(t.match).length ?? 0;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`flex h-12 flex-1 items-center justify-center gap-1.5 border-b-[3px] text-[15px] ${
                on ? "border-brand font-extrabold text-brand" : "border-transparent font-semibold text-muted"
              }`}
            >
              {t.label}
              {t.key !== "done" && count > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 text-xs leading-5 font-extrabold text-white tabular-nums ${on ? "bg-brand" : "bg-faint"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <main className="flex flex-1 flex-col gap-3 bg-tray p-4">
        {isPending ? (
          <LoadingRows rows={2} thumb={false} />
        ) : isError ? (
          <ErrorState message="주문을 불러오지 못했어요" onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LuClipboardList}
            title={EMPTY[tab]}
            desc={tab === "new" ? (closed ? "영업을 시작하면 주문이 들어와요" : "새 주문이 오면 알림음과 함께 알려 드릴게요") : undefined}
          />
        ) : (
          rows.map((o) => <OwnerOrderCard key={o.order_id} order={o} />)
        )}
      </main>
    </>
  );
}
