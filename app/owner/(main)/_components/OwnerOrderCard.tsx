"use client";

import { useState } from "react";
import { Button } from "@/app/_components/Button";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { OrderTicket, TicketPerforation, TicketSection } from "@/app/_components/ticket/OrderTicket";
import { useOrderAction } from "@/app/_hooks/queries/owner";
import { ApiError } from "@/app/_lib/api/client";
import { DELIVERY_STATUS, ORDER_STATUS } from "@/app/_lib/constants/status";
import type { OwnerOrder } from "@/app/_lib/types/api";
import { formatOrderNo, formatTime, formatWon } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";

/** 조리완료 뒤 배달 진행 (읽기 전용) */
function deliveryText(o: OwnerOrder) {
  if (!o.delivery) return "라이더 배정을 기다리고 있어요";
  switch (o.delivery.status) {
    case DELIVERY_STATUS.ASSIGNED:
      return `${o.delivery.rider_name} 라이더가 가게로 오고 있어요`;
    case DELIVERY_STATUS.DELIVERED:
      return "배달이 완료됐어요";
    default:
      return `${o.delivery.rider_name} 라이더가 배달 중이에요`;
  }
}

export function OwnerOrderCard({ order: o }: { order: OwnerOrder }) {
  const action = useOrderAction();
  const [confirmReject, setConfirmReject] = useState(false);
  const rejected = o.status === ORDER_STATUS.REJECTED;

  async function run(kind: "accept" | "reject" | "cooked") {
    try {
      await action.mutateAsync({ id: o.order_id, action: kind });
      toast(
        kind === "accept"
          ? `${formatOrderNo(o.order_id)} 주문을 수락했어요`
          : kind === "reject"
            ? `${formatOrderNo(o.order_id)} 주문을 거절했어요. 결제는 자동으로 취소돼요.`
            : `${formatOrderNo(o.order_id)} 조리를 완료했어요. 라이더를 찾고 있어요.`,
      );
    } catch (e) {
      // 다른 창에서 이미 처리한 경우 등 → 서버 문구를 그대로 보여 주고 목록은 새로고침됨
      toast(e instanceof ApiError ? e.message : "처리하지 못했어요. 다시 시도해 주세요.", "error");
    } finally {
      setConfirmReject(false);
    }
  }

  return (
    <div className={rejected ? "opacity-60" : ""}>
      <OrderTicket
        orderId={o.order_id}
        badge={<StatusBadge status={o.status} />}
        meta={
          <>
            {formatTime(o.ordered_time)} 주문
            <br />
            {o.customer_name}{" "}
            {o.customer_phone && (
              <a href={`tel:${o.customer_phone}`} className="font-semibold text-ink underline-offset-2 active:underline">
                {o.customer_phone}
              </a>
            )}
          </>
        }
      >
        <TicketPerforation />
        <TicketSection>
          <ul>
            {o.items.map((it) => (
              <li key={it.menu_name} className="flex justify-between py-1.5 text-base">
                <b className="font-semibold">{it.menu_name}</b>
                <span className="text-muted tabular-nums">{it.quantity}개</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-muted">배달 주소</p>
          <p className="text-sm">{o.order_address}</p>
        </TicketSection>
        <TicketPerforation />
        <TicketSection className="flex items-baseline justify-between pb-4">
          <span className="text-sm text-muted">주문금액 (배달비 제외)</span>
          <span className="text-[22px] font-extrabold tracking-tight tabular-nums">{formatWon(o.total_amount)}</span>
        </TicketSection>

        {o.status === ORDER_STATUS.PENDING && (
          <div className="flex gap-2 px-[18px] pb-4">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setConfirmReject(true)} disabled={action.isPending}>
              거절
            </Button>
            <Button size="md" className="flex-[2]" onClick={() => run("accept")} disabled={action.isPending}>
              수락
            </Button>
          </div>
        )}
        {o.status === ORDER_STATUS.COOKING && (
          <div className="px-[18px] pb-4">
            <Button size="md" onClick={() => run("cooked")} disabled={action.isPending}>
              조리 완료
            </Button>
          </div>
        )}
        {o.status === ORDER_STATUS.COOKED && (
          <p className="mx-[18px] mb-4 rounded-[10px] bg-field px-3.5 py-3 text-sm font-semibold">{deliveryText(o)}</p>
        )}
        {rejected && <p className="mx-[18px] mb-4 rounded-[10px] bg-field px-3.5 py-3 text-sm text-muted">거절한 주문이에요. 결제는 취소됐어요.</p>}
      </OrderTicket>

      <ConfirmDialog
        open={confirmReject}
        title={`${formatOrderNo(o.order_id)} 주문을 거절할까요?`}
        message={`거절하면 손님 결제 ${formatWon(o.total_amount + o.delivery_fee)}이 자동으로 취소돼요. 되돌릴 수 없어요.`}
        confirmLabel="거절하기"
        pending={action.isPending}
        onCancel={() => setConfirmReject(false)}
        onConfirm={() => run("reject")}
      />
    </div>
  );
}
