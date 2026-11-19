/**
 * 데모용 주문 자동 진행.
 * 아직 만들지 않은 역할의 일을 시간이 지나면 저절로 해 준다.
 * - 사장님 화면 있음 → 접수·조리는 사장님이 직접 (AUTO_OWNER = false)
 * - 라이더 화면 있음 → 배정·픽업·배달완료도 라이더가 직접 (AUTO_RIDER = false)
 * 한 역할만 시연할 때 나머지 역할을 자동으로 돌리고 싶으면 true로 바꾼다.
 */
import type { DeliveryStatus } from "@/app/_lib/constants/status";
import type { Order } from "@/app/_lib/types/db";
import { db, seq } from "./data";

export const AUTO_OWNER = false;
export const AUTO_RIDER = false;
/** 한 단계가 넘어가는 간격 (초) */
const STEP_SEC = 12;

const orderedAt = new Map<number, number>(); // 손님이 주문한 시각 (AUTO_OWNER용)
const cookedAt = new Map<number, number>(); // 조리완료된 시각 (AUTO_RIDER용)

/** 손님이 새로 주문했을 때 */
export function trackOrder(order: Order) {
  if (AUTO_OWNER) orderedAt.set(order.order_id, Date.now());
}

/** 사장님이 조리완료를 눌렀을 때 */
export function trackCooked(order: Order) {
  if (AUTO_RIDER) cookedAt.set(order.order_id, Date.now());
}

function addHistory(delivery_id: number, status: DeliveryStatus) {
  db.deliveryHistory.push({
    history_id: seq(db.deliveryHistory, "history_id"),
    delivery_id,
    status,
    changed_at: new Date().toISOString(),
  });
}

const stepsSince = (t: number) => Math.floor((Date.now() - t) / 1000 / STEP_SEC);

/** 지난 시간만큼 상태를 진행시킨다 (조회할 때마다 호출) */
export function advance(order: Order) {
  if (order.status === "거절" || order.status === "결제실패") return;

  const o = orderedAt.get(order.order_id);
  if (o !== undefined) {
    const step = stepsSince(o);
    if (step >= 1 && order.status === "접수대기") order.status = "조리중";
    if (step >= 2 && order.status === "조리중") {
      order.status = "조리완료";
      orderedAt.delete(order.order_id);
      trackCooked(order);
    }
  }

  const c = cookedAt.get(order.order_id);
  if (c === undefined || order.status !== "조리완료") return;
  const step = stepsSince(c);

  let delivery = db.deliveries.find((d) => d.order_id === order.order_id);
  if (step >= 1 && !delivery) {
    delivery = { delivery_id: seq(db.deliveries, "delivery_id"), order_id: order.order_id, rider_id: 1, status: "배정완료" };
    db.deliveries.push(delivery);
    addHistory(delivery.delivery_id, "배정완료");
  }
  if (!delivery) return;
  if (step >= 2 && delivery.status === "배정완료") {
    // [픽업 완료] 한 번에 픽업완료·배달중 두 이력
    addHistory(delivery.delivery_id, "픽업완료");
    addHistory(delivery.delivery_id, "배달중");
    delivery.status = "배달중";
  }
  if (step >= 3 && delivery.status === "배달중") {
    addHistory(delivery.delivery_id, "배달완료");
    delivery.status = "배달완료";
    cookedAt.delete(order.order_id);
  }
}
