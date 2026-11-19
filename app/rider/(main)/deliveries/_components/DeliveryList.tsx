"use client";

import Link from "next/link";
import { useState } from "react";
import { LuBike } from "react-icons/lu";
import { EmptyState } from "@/app/_components/EmptyState";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useMyDeliveries } from "@/app/_hooks/queries/rider";
import { DELIVERY_STATUS } from "@/app/_lib/constants/status";
import { formatDateTime, formatFee, formatOrderNo } from "@/app/_lib/utils/format";

/** 내 배달 — 진행중 / 완료 탭 */
export function DeliveryList() {
  const { data, isPending, isError, refetch } = useMyDeliveries();
  const [tab, setTab] = useState<"active" | "done">("active");

  const rows = data?.filter((d) => (tab === "done") === (d.status === DELIVERY_STATUS.DELIVERED)) ?? [];

  return (
    <>
      <div role="tablist" aria-label="배달 상태" className="sticky top-[52px] z-10 flex border-b border-line bg-paper">
        {(["active", "done"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-12 flex-1 border-b-[3px] text-[15px] ${tab === t ? "border-brand font-extrabold text-brand" : "border-transparent font-semibold text-muted"}`}
          >
            {t === "active" ? "진행중" : "완료"}
          </button>
        ))}
      </div>
      <main className="flex-1">
        {isPending ? (
          <LoadingRows thumb={false} />
        ) : isError ? (
          <ErrorState message="배달 내역을 불러오지 못했어요" onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={LuBike} title={tab === "active" ? "진행 중인 배달이 없어요" : "완료한 배달이 없어요"} />
        ) : (
          <ul>
            {rows.map((d) => {
              const last = d.history.at(-1)?.changed_at;
              return (
                <li key={d.delivery_id} className="border-b border-line">
                  <Link href={`/rider/deliveries/${d.delivery_id}`} className="flex items-center justify-between gap-3 px-4 py-4 active:bg-tray">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <b className="font-bold tabular-nums">{formatOrderNo(d.order_id)}</b>
                        <span className="truncate text-muted">{d.restaurant_name}</span>
                      </span>
                      <span className="text-caption text-muted">{last ? formatDateTime(last) : ""}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <b className="font-bold tabular-nums">{formatFee(d.delivery_fee)}</b>
                      {tab === "active" && <StatusBadge status={d.status} />}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
