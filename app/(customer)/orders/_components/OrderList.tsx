"use client";

import Link from "next/link";
import { LuReceiptText } from "react-icons/lu";
import { EmptyState } from "@/app/_components/EmptyState";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useMyOrders } from "@/app/_hooks/queries/customer";
import { formatDateTime, formatWon } from "@/app/_lib/utils/format";
import { customerStatusName, toCustomerStep } from "@/app/_lib/utils/orderStep";

export function OrderList() {
  const { data, isPending, isError, refetch } = useMyOrders();

  if (isPending) return <LoadingRows thumb={false} />;
  if (isError) return <ErrorState message="주문 내역을 불러오지 못했어요" onRetry={() => refetch()} />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={LuReceiptText}
        title="아직 주문한 적이 없어요"
        action={
          <Link href="/" className="flex h-12 items-center justify-center rounded-[10px] bg-brand font-extrabold text-white">
            가게 보러 가기
          </Link>
        }
      />
    );
  }

  return (
    <main className="flex-1">
      <ul>
        {data.map((o) => {
          const step = toCustomerStep(o);
          const name = customerStatusName(o);
          const tone = step.index === null ? "bg-danger-soft text-danger" : step.index === 4 ? "bg-field text-muted" : "bg-brand-soft text-brand-ink";
          return (
            <li key={o.order_id} className="border-b border-line">
              <Link href={`/orders/${o.order_id}`} className="block px-4 py-4 active:bg-tray">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold">{o.restaurant_name}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{name}</span>
                </div>
                <p className="mt-1 text-caption text-muted">
                  {o.item_count > 1 ? `${o.first_item_name} 외 ${o.item_count - 1}개` : o.first_item_name}
                </p>
                <div className="mt-2 flex items-center justify-between text-caption">
                  <span className="text-muted">{formatDateTime(o.ordered_time)}</span>
                  <b className="font-bold tabular-nums">{formatWon(o.payment_amount)}</b>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
