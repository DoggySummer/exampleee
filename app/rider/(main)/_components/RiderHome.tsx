"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuBike, LuChevronRight, LuMapPin, LuStore } from "react-icons/lu";
import { AppHeader } from "@/app/_components/AppHeader";
import { EmptyState } from "@/app/_components/EmptyState";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { ToggleSwitch } from "@/app/_components/ToggleSwitch";
import { useAcceptDelivery, useAvailableOrders, useMyDeliveries, useRiderMe, useSetRiderStatus } from "@/app/_hooks/queries/rider";
import { ApiError } from "@/app/_lib/api/client";
import { DELIVERY_STATUS, RIDER_STATUS } from "@/app/_lib/constants/status";
import { formatFee, formatOrderNo, formatTime } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";

/** 라이더 홈 — 출근 토글 + 수락 가능한 주문 (선착순) */
export function RiderHome() {
  const router = useRouter();
  const { data: me, isPending: mePending } = useRiderMe();
  const status = me?.status;
  const working = status === RIDER_STATUS.AVAILABLE || status === RIDER_STATUS.BUSY;
  const { data: list, isPending, isError, refetch } = useAvailableOrders(working);
  const { data: deliveries } = useMyDeliveries();
  const setStatus = useSetRiderStatus();
  const accept = useAcceptDelivery();

  const active = deliveries?.find((d) => d.status !== DELIVERY_STATUS.DELIVERED);
  const busy = status === RIDER_STATUS.BUSY;

  async function toggle(on: boolean) {
    try {
      await setStatus.mutateAsync(on);
      toast(on ? "출근했어요. 수락할 수 있는 주문을 보여 드릴게요." : "퇴근했어요. 오늘도 수고하셨어요.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "운행 상태를 바꾸지 못했어요", "error");
    }
  }

  async function take(orderId: number) {
    try {
      const d = await accept.mutateAsync(orderId);
      toast(`${formatOrderNo(orderId)} 배달을 수락했어요. 가게로 가 주세요.`);
      router.push(`/rider/deliveries/${d.delivery_id}`);
    } catch (e) {
      // 다른 라이더가 먼저 잡은 경우 등 → 안내 후 목록은 자동으로 새로고침
      toast(e instanceof ApiError ? e.message : "수락하지 못했어요", "error");
    }
  }

  return (
    <>
      <AppHeader
        title={busy ? "배달 중" : status === RIDER_STATUS.AVAILABLE ? "대기 중" : "퇴근 상태"}
        badge="라이더"
        right={
          me && (
            <ToggleSwitch
              checked={working}
              onChange={toggle}
              label="출근"
              text={working ? "출근" : "퇴근"}
              // 배달 중에는 퇴근할 수 없다
              disabled={busy || setStatus.isPending}
            />
          )
        }
      />
      <main className="flex flex-1 flex-col gap-3 bg-tray p-4">
        {active && (
          <Link
            href={`/rider/deliveries/${active.delivery_id}`}
            className="flex items-center gap-3 rounded-xl bg-brand px-4 py-3.5 text-white active:bg-brand-press"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/20">
              <LuBike size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs opacity-85">진행 중인 배달 {formatOrderNo(active.order_id)}</span>
              <span className="block truncate font-bold">
                {active.status === DELIVERY_STATUS.ASSIGNED ? `${active.restaurant_name}에서 음식 받기` : "손님에게 배달하기"}
              </span>
            </span>
            <LuChevronRight size={20} aria-hidden />
          </Link>
        )}
        {busy && <p className="px-1 text-caption text-muted">진행 중인 배달을 끝내면 다음 주문을 수락할 수 있어요.</p>}

        {mePending ? (
          <LoadingRows rows={2} thumb={false} />
        ) : !working ? (
          <EmptyState icon={LuBike} title="출근하면 배달할 주문이 보여요" desc="오른쪽 위 스위치를 켜 주세요" />
        ) : isPending ? (
          <LoadingRows rows={2} thumb={false} />
        ) : isError ? (
          <ErrorState message="주문을 불러오지 못했어요" onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon={LuBike} title="지금은 배달할 주문이 없어요" desc="10초마다 새로 확인하고 있어요" />
        ) : (
          <>
            <h2 className="px-1 pt-1 font-extrabold">수락할 수 있는 주문 {list.length}건</h2>
            {list.map((o) => (
              <article key={o.order_id} className="rounded-xl bg-paper px-[18px] py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black tracking-tight tabular-nums">{formatOrderNo(o.order_id)}</p>
                    <p className="text-caption text-muted">
                      {formatTime(o.ordered_time)} 주문 · 메뉴 {o.item_count}개
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption text-muted">배달비</p>
                    <p className="text-xl font-extrabold text-brand tabular-nums">{formatFee(o.delivery_fee)}</p>
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-2 border-t border-dashed border-line pt-3 text-sm">
                  <li className="flex gap-2">
                    <LuStore size={18} className="mt-0.5 shrink-0 text-muted" aria-label="픽업" />
                    <span>
                      <b className="font-bold">{o.restaurant_name}</b>
                      <span className="block text-muted">{o.restaurant_address}</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <LuMapPin size={18} className="mt-0.5 shrink-0 text-muted" aria-label="배달" />
                    <span>{o.order_address}</span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => take(o.order_id)}
                  disabled={busy || accept.isPending}
                  className="mt-4 h-12 w-full rounded-[10px] bg-brand text-base font-extrabold text-white active:bg-brand-press disabled:bg-field disabled:text-faint"
                >
                  {busy ? "배달 중에는 수락할 수 없어요" : "수락"}
                </button>
              </article>
            ))}
          </>
        )}
      </main>
    </>
  );
}
