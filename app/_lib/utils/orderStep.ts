import { DELIVERY_STATUS, ORDER_STATUS } from "@/app/_lib/constants/status";
import type { DeliveryStatus, OrderStatus } from "@/app/_lib/constants/status";

interface OrderLike {
  status: OrderStatus;
  delivery?: { status: DeliveryStatus } | null;
  delivery_status?: DeliveryStatus | null;
}

/** 손님 화면 5단계 타임라인 */
export const CUSTOMER_STEPS = ["주문접수", "조리중", "배달준비", "배달중", "배달완료"] as const;

export interface CustomerStep {
  /** 0~4. 거절·결제실패면 null */
  index: number | null;
  /** 지금 상태를 손님에게 보여 주는 문구 */
  label: string;
}

/**
 * 주문상태 + 배달상태 → 손님에게 보여 줄 단계 (화면 시나리오 "주문 상태 표시" 표)
 * 조리완료 뒤에는 주문상태가 안 바뀌어서 배달상태를 본다.
 */
export function toCustomerStep(o: OrderLike): CustomerStep {
  const d = o.delivery?.status ?? o.delivery_status ?? null;
  switch (o.status) {
    case ORDER_STATUS.PENDING:
      return { index: 0, label: "가게에서 주문을 확인하고 있어요" };
    case ORDER_STATUS.COOKING:
      return { index: 1, label: "음식을 만들고 있어요" };
    case ORDER_STATUS.REJECTED:
      return { index: null, label: "가게 사정으로 주문이 취소됐어요" };
    case ORDER_STATUS.PAYMENT_FAILED:
      return { index: null, label: "결제가 완료되지 않았어요" };
  }
  if (!d) return { index: 2, label: "라이더를 찾고 있어요" };
  if (d === DELIVERY_STATUS.ASSIGNED) return { index: 2, label: "라이더가 가게로 가고 있어요" };
  if (d === DELIVERY_STATUS.DELIVERED) return { index: 4, label: "배달이 완료됐어요" };
  return { index: 3, label: "음식이 가고 있어요" };
}

/** 짧은 상태 이름 (목록 배지용) */
export function customerStatusName(o: OrderLike) {
  const s = toCustomerStep(o);
  if (s.index === null) return o.status === ORDER_STATUS.REJECTED ? "취소됨" : "결제실패";
  return CUSTOMER_STEPS[s.index];
}

/** 더 바뀔 일이 없는 주문 → 폴링 멈춤 */
export function isFinalOrder(o: OrderLike) {
  const s = toCustomerStep(o);
  return s.index === null || s.index === 4;
}
