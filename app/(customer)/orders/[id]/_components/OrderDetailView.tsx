"use client";

import { LuCircleX, LuMapPin } from "react-icons/lu";
import { AppHeader } from "@/app/_components/AppHeader";
import { PriceSummary } from "@/app/_components/PriceSummary";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { OrderTicket, TicketPerforation, TicketSection } from "@/app/_components/ticket/OrderTicket";
import { useOrder } from "@/app/_hooks/queries/customer";
import { ApiError } from "@/app/_lib/api/client";
import { DELIVERY_STATUS, ORDER_STATUS } from "@/app/_lib/constants/status";
import type { OrderDetail } from "@/app/_lib/types/api";
import { formatDateTime, formatOrderNo, formatTime } from "@/app/_lib/utils/format";
import { CUSTOMER_STEPS, customerStatusName, toCustomerStep } from "@/app/_lib/utils/orderStep";

export function OrderDetailView({ id }: { id: number }) {
  const { data: o, isPending, isError, error, refetch } = useOrder(id);

  if (isPending) {
    return (
      <>
        <AppHeader title="주문 상세" back="/orders" />
        <LoadingRows rows={3} thumb={false} />
      </>
    );
  }
  if (isError) {
    const msg =
      error instanceof ApiError && (error.status === 404 || error.status === 403) ? error.message : "주문을 불러오지 못했어요";
    return (
      <>
        <AppHeader title="주문 상세" back="/orders" />
        <ErrorState message={msg} onRetry={() => refetch()} />
      </>
    );
  }

  const step = toCustomerStep(o);
  const ended = step.index === null;
  const tone = ended ? "bg-danger-soft text-danger before:bg-danger" : "bg-brand-soft text-brand-ink before:bg-brand";

  return (
    <>
      <AppHeader title={`주문 ${formatOrderNo(o.order_id)}`} back="/orders" />
      <main className="flex flex-1 flex-col gap-3 bg-tray p-4">
        <div className="flex items-center gap-3 rounded-xl bg-brand px-4 py-3.5 text-white">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/20">
            <LuMapPin size={20} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs opacity-85">배달 주소</span>
            <span className="block truncate font-bold">{o.order_address}</span>
          </span>
        </div>

        <OrderTicket
          orderId={o.order_id}
          meta={
            <>
              {o.restaurant_name}
              <br />
              {formatDateTime(o.ordered_time)} 주문
            </>
          }
          badge={
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold before:size-[7px] before:rounded-full ${tone}`}>
              {customerStatusName(o)}
            </span>
          }
        >
          <TicketPerforation />
          <TicketSection>
            <ul className="flex flex-col">
              {o.items.map((it) => (
                <li key={it.order_item_id} className="flex justify-between py-1.5">
                  <b className="font-semibold">{it.menu_name}</b>
                  <span className="text-muted tabular-nums">{it.quantity}개</span>
                </li>
              ))}
            </ul>
          </TicketSection>
          <TicketPerforation />
          <TicketSection className="pb-4">
            <PriceSummary total={o.total_amount} fee={o.delivery_fee} label={`결제금액 · ${o.payment.method}`} />
          </TicketSection>
        </OrderTicket>

        {ended ? <EndedNotice order={o} /> : <Timeline order={o} current={step.index!} label={step.label} />}
      </main>
    </>
  );
}

/** 5단계 진행 상황. 시각은 기록이 있는 단계만 */
function Timeline({ order, current, label }: { order: OrderDetail; current: number; label: string }) {
  const at = (s: string) => order.delivery?.history.find((h) => h.status === s)?.changed_at;
  const times = [
    order.ordered_time,
    undefined,
    at(DELIVERY_STATUS.ASSIGNED),
    at(DELIVERY_STATUS.DELIVERING),
    at(DELIVERY_STATUS.DELIVERED),
  ];
  return (
    <section className="rounded-xl bg-paper px-[18px] py-4" aria-label="진행 상황">
      <h2 className="font-bold">진행 상황</h2>
      <p className="mt-0.5 text-caption text-muted" aria-live="polite">
        {label}
      </p>
      <ol className="mt-3 flex flex-col">
        {CUSTOMER_STEPS.map((name, i) => {
          const done = i < current || (i === current && current === 4);
          const now = i === current && current !== 4;
          return (
            <li key={name} className={`flex items-center gap-3 py-[5px] ${done || now ? "text-ink" : "text-faint"} ${now ? "font-extrabold" : ""}`}>
              <span
                aria-hidden
                className={`size-3 shrink-0 rounded-full border-2 ${
                  done ? "border-brand bg-brand" : now ? "border-brand shadow-[0_0_0_4px_rgba(31,122,85,.18)]" : "border-[#C3CAD2]"
                }`}
              />
              <span>
                {name}
                {now && <span className="sr-only"> (지금 단계)</span>}
              </span>
              {times[i] && (done || now) && <small className="ml-auto text-caption font-medium text-muted tabular-nums">{formatTime(times[i]!)}</small>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 거절·결제실패는 타임라인 대신 안내 */
function EndedNotice({ order }: { order: OrderDetail }) {
  const rejected = order.status === ORDER_STATUS.REJECTED;
  return (
    <section className="flex gap-3 rounded-xl bg-paper px-[18px] py-4" role="status">
      <LuCircleX size={22} className="mt-0.5 shrink-0 text-danger" aria-hidden />
      <div>
        <p className="font-bold">{rejected ? "가게 사정으로 주문이 취소됐어요" : "결제가 완료되지 않았어요"}</p>
        <p className="mt-1 text-caption text-muted">
          {rejected
            ? `결제는 자동으로 취소됐어요${order.payment.canceled_at ? ` (${formatDateTime(order.payment.canceled_at)})` : ""}.`
            : "돈은 빠져나가지 않았어요. 다시 주문해 주세요."}
        </p>
      </div>
    </section>
  );
}
