"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/app/_components/AppHeader";
import { Button } from "@/app/_components/Button";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { FixedBottom } from "@/app/_components/FixedBottom";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { OrderTicket, TicketPerforation, TicketSection } from "@/app/_components/ticket/OrderTicket";
import { useMyDeliveries, useUpdateDelivery } from "@/app/_hooks/queries/rider";
import { ApiError } from "@/app/_lib/api/client";
import { DELIVERY_STATUS } from "@/app/_lib/constants/status";
import { formatFee, formatOrderNo, formatTime, formatWon } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";

/** 상태별 안내 문구와 다음 버튼. [픽업 완료]는 픽업완료·배달중을 한 번에 기록한다 */
const STEP = {
  [DELIVERY_STATUS.ASSIGNED]: { hint: "가게로 가서 음식을 받아 주세요", button: "픽업 완료", next: DELIVERY_STATUS.DELIVERING },
  [DELIVERY_STATUS.PICKED_UP]: { hint: "손님에게 가는 중이에요", button: "배달 완료", next: DELIVERY_STATUS.DELIVERED },
  [DELIVERY_STATUS.DELIVERING]: { hint: "손님에게 가는 중이에요", button: "배달 완료", next: DELIVERY_STATUS.DELIVERED },
  [DELIVERY_STATUS.DELIVERED]: { hint: "배달을 마쳤어요", button: null, next: null },
} as const;

/** 배달 전표 — 하단 버튼 하나로 다음 단계 */
export function DeliveryDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useMyDeliveries();
  const update = useUpdateDelivery();
  const [confirmDone, setConfirmDone] = useState(false);

  const d = data?.find((x) => x.delivery_id === id);

  if (isPending) {
    return (
      <>
        <AppHeader title="배달 상세" back="/rider/deliveries" />
        <LoadingRows rows={3} thumb={false} />
      </>
    );
  }
  if (isError || !d) {
    return (
      <>
        <AppHeader title="배달 상세" back="/rider/deliveries" />
        <ErrorState message={isError ? "배달을 불러오지 못했어요" : "배달을 찾지 못했어요"} onRetry={isError ? () => refetch() : undefined} />
      </>
    );
  }

  const step = STEP[d.status];
  const assignedAt = d.history.find((h) => h.status === DELIVERY_STATUS.ASSIGNED)?.changed_at;

  async function advance() {
    if (!step.next) return;
    try {
      await update.mutateAsync({ id: d!.delivery_id, status: step.next });
      if (step.next === DELIVERY_STATUS.DELIVERED) {
        toast(`배달 완료! +${formatWon(d!.delivery_fee)}`);
        router.replace("/rider");
      } else {
        toast("픽업했어요. 손님에게 가 주세요.");
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "상태를 바꾸지 못했어요", "error");
    } finally {
      setConfirmDone(false);
    }
  }

  return (
    <>
      <AppHeader title={`배달 ${formatOrderNo(d.order_id)}`} back="/rider/deliveries" />
      <main className="flex flex-1 flex-col gap-3 bg-tray p-4">
        <OrderTicket
          orderId={d.order_id}
          meta={assignedAt ? `${formatTime(assignedAt)} 배정` : undefined}
          badge={<StatusBadge status={d.status} />}
        >
          <TicketPerforation />
          <TicketSection className="flex flex-col gap-3 py-2">
            <div>
              <p className="text-caption text-muted">픽업</p>
              <p className="font-bold">{d.restaurant_name}</p>
              <p className="text-sm">{d.restaurant_address}</p>
            </div>
            <div>
              <p className="text-caption text-muted">배달</p>
              <p className="text-sm">{d.order_address}</p>
            </div>
          </TicketSection>
          <TicketPerforation />
          <TicketSection>
            <ul>
              {d.items.map((it) => (
                <li key={it.menu_name} className="flex justify-between py-1.5">
                  <b className="font-semibold">{it.menu_name}</b>
                  <span className="text-muted tabular-nums">{it.quantity}개</span>
                </li>
              ))}
            </ul>
          </TicketSection>
          <TicketPerforation />
          <TicketSection className="flex items-baseline justify-between pb-4">
            <span className="text-sm text-muted">배달비</span>
            <span className="text-[22px] font-extrabold tracking-tight tabular-nums">{formatFee(d.delivery_fee)}</span>
          </TicketSection>
        </OrderTicket>
        <p className="px-1 text-sm text-muted" aria-live="polite">
          {step.hint}
        </p>
      </main>

      {step.button && (
        <FixedBottom>
          <Button
            onClick={() => (step.next === DELIVERY_STATUS.DELIVERED ? setConfirmDone(true) : advance())}
            disabled={update.isPending}
          >
            {update.isPending ? "처리하는 중…" : step.button}
          </Button>
        </FixedBottom>
      )}

      <ConfirmDialog
        open={confirmDone}
        title="배달을 완료할까요?"
        message="손님에게 음식을 전달했을 때만 눌러 주세요. 완료하면 되돌릴 수 없어요."
        confirmLabel="배달 완료"
        pending={update.isPending}
        onCancel={() => setConfirmDone(false)}
        onConfirm={advance}
      />
    </>
  );
}
