"use client";

import { AppHeader } from "@/app/_components/AppHeader";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useSettlement } from "@/app/_hooks/queries/owner";
import { ApiError } from "@/app/_lib/api/client";
import { SETTLEMENT_LABEL, SETTLEMENT_STATUS } from "@/app/_lib/constants/status";
import { formatDateTime, formatOrderNo, formatPeriod, formatWon } from "@/app/_lib/utils/format";

/** 정산 상세 (사장님·라이더 공통) — 주문별 지급 근거와 합계 */
export function SettlementDetailView({ id, back }: { id: number; back: string }) {
  const { data: s, isPending, isError, error, refetch } = useSettlement(id);

  if (isPending) {
    return (
      <>
        <AppHeader title="정산 상세" back={back} />
        <LoadingRows thumb={false} />
      </>
    );
  }
  if (isError) {
    return (
      <>
        <AppHeader title="정산 상세" back={back} />
        <ErrorState message={error instanceof ApiError ? error.message : "정산을 불러오지 못했어요"} onRetry={() => refetch()} />
      </>
    );
  }

  const isRider = s.rider_id !== null;
  return (
    <>
      <AppHeader title="정산 상세" back={back} />
      <main className="flex flex-1 flex-col bg-tray">
        <section className="bg-paper px-4 pt-5 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{formatPeriod(s.start_date, s.end_date)}</p>
            <StatusBadge status={s.status} label={SETTLEMENT_LABEL[s.status]} />
          </div>
          <p className="mt-2 text-[32px] leading-tight font-black tracking-tight tabular-nums">{formatWon(s.amount)}</p>
          <p className="mt-1 text-caption text-muted">
            {s.status === SETTLEMENT_STATUS.PAID ? "지급이 끝났어요" : "정해진 지급일에 자동으로 지급돼요"} · 배달완료 {s.items.length}건
          </p>
        </section>

        <section className="mt-2 flex-1 bg-paper">
          <h2 className="px-4 pt-4 pb-2 font-extrabold">주문별 내역</h2>
          <ul>
            {s.items.map((it) => (
              <li key={it.settlement_item_id} className="flex items-center justify-between border-t border-line px-4 py-3.5">
                <span>
                  <span className="block font-bold tabular-nums">{formatOrderNo(it.order_id)}</span>
                  <span className="text-caption text-muted">{it.delivered_at ? `${formatDateTime(it.delivered_at)} 배달완료` : "배달완료"}</span>
                </span>
                <span className="text-right">
                  <b className="block font-bold tabular-nums">{formatWon(it.pay_amount)}</b>
                  <span className="text-caption text-muted">{isRider ? "배달비" : "주문금액"}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-ink/10 px-4 py-4">
            <span className="font-bold">합계</span>
            <b className="text-xl font-extrabold tabular-nums">{formatWon(s.amount)}</b>
          </div>
        </section>
      </main>
    </>
  );
}
