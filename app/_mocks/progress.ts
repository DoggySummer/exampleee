/**
 * 데모용 주문 자동 진행.
 * 점주·라이더 화면이 아직 없어서, 손님이 새로 한 주문은 시간이 지나면 저절로 다음 단계로 넘어간다.
 * 점주·라이더 화면을 만들면 AUTO_PROGRESS를 false로 바꾼다.
 */
import { db, seq } from "./data";
import type { DeliveryStatus } from "@/app/_lib/constants/status";
import type { Order } from "@/app/_lib/types/db";

export const AUTO_PROGRESS = true;
/** 한 단계가 넘어가는 간격 (초) */
const STEP_SEC = 12;

const autoOrders = new Map<number, number>(); // order_id → 주문 시각(ms)

export function trackOrder(order: Order) {
  if (AUTO_PROGRESS) autoOrders.set(order.order_id, Date.now());
}

function addHistory(delivery_id: number, status: DeliveryStatus) {
  db.deliveryHistory.push({
    history_id: seq(db.deliveryHistory, "history_id"),
    delivery_id,
    status,
    changed_at: new Date().toISOString(),
  });
}

/** 지난 시간만큼 상태를 진행시킨다 (조회할 때마다 호출) */
export function advance(order: Order) {
  const startedAt = autoOrders.get(order.order_id);
  if (startedAt === undefined || order.status === "거절" || order.status === "결제실패") return;
  const step = Math.floor((Date.now() - startedAt) / 1000 / STEP_SEC);

  if (step >= 1 && order.status === "접수대기") order.status = "조리중";
  if (step >= 2 && order.status === "조리중") order.status = "조리완료";
  if (order.status !== "조리완료") return;

  let delivery = db.deliveries.find((d) => d.order_id === order.order_id);
  if (step >= 3 && !delivery) {
    delivery = { delivery_id: seq(db.deliveries, "delivery_id"), order_id: order.order_id, rider_id: 1, status: "배정완료" };
    db.deliveries.push(delivery);
    addHistory(delivery.delivery_id, "배정완료");
  }
  if (!delivery) return;
  if (step >= 4 && delivery.status === "배정완료") {
    // [픽업 완료] 한 번에 픽업완료·배달중 두 이력
    addHistory(delivery.delivery_id, "픽업완료");
    addHistory(delivery.delivery_id, "배달중");
    delivery.status = "배달중";
  }
  if (step >= 5 && delivery.status === "배달중") {
    addHistory(delivery.delivery_id, "배달완료");
    delivery.status = "배달완료";
    autoOrders.delete(order.order_id);
  }
}
