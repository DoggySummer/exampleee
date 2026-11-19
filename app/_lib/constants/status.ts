/**
 * DB에 저장되는 상태값 (확인사항.txt 2. 상태값 최종)
 * 화면에서 "접수대기" 같은 문자열을 직접 쓰지 말고 여기서 가져다 쓴다.
 */
export const ORDER_STATUS = {
  PAYMENT_FAILED: "결제실패",
  PENDING: "접수대기",
  COOKING: "조리중",
  COOKED: "조리완료",
  REJECTED: "거절",
} as const;

export const PAYMENT_STATUS = {
  DONE: "완료",
  FAILED: "실패",
  CANCELED: "취소완료",
} as const;

export const PAYMENT_METHOD = {
  CARD: "카드",
  EASY_PAY: "간편결제",
} as const;

/** 배정완료 → 픽업완료 → 배달중 → 배달완료 (라이더의 [픽업 완료] 버튼은 픽업완료·배달중을 한 번에 기록) */
export const DELIVERY_STATUS = {
  ASSIGNED: "배정완료",
  PICKED_UP: "픽업완료",
  DELIVERING: "배달중",
  DELIVERED: "배달완료",
} as const;

export const RIDER_STATUS = {
  AVAILABLE: "운행가능",
  BUSY: "배달중",
  OFF: "운행종료",
} as const;

export const RESTAURANT_STATUS = {
  OPEN: "영업중",
  CLOSED: "영업종료",
} as const;

export const SETTLEMENT_STATUS = {
  CREATED: "생성완료",
  PAID: "지급완료",
} as const;

type ValueOf<T> = T[keyof T];
export type OrderStatus = ValueOf<typeof ORDER_STATUS>;
export type PaymentStatus = ValueOf<typeof PAYMENT_STATUS>;
export type PaymentMethod = ValueOf<typeof PAYMENT_METHOD>;
export type DeliveryStatus = ValueOf<typeof DELIVERY_STATUS>;
export type RiderStatus = ValueOf<typeof RIDER_STATUS>;
export type RestaurantStatus = ValueOf<typeof RESTAURANT_STATUS>;
export type SettlementStatus = ValueOf<typeof SETTLEMENT_STATUS>;

/**
 * 배지 톤. 강조색은 초록 하나라서 톤은 세 가지뿐이다.
 * - active: 진행 중이거나 끝난 정상 상태 (초록)
 * - waiting: 누군가의 행동을 기다리는 상태 (회색)
 * - danger: 거절·실패 (빨강)
 */
export type StatusTone = "active" | "waiting" | "danger";

export const STATUS_TONE: Record<string, StatusTone> = {
  [ORDER_STATUS.PENDING]: "waiting",
  [ORDER_STATUS.COOKING]: "active",
  [ORDER_STATUS.COOKED]: "active",
  [ORDER_STATUS.REJECTED]: "danger",
  [ORDER_STATUS.PAYMENT_FAILED]: "danger",
  [DELIVERY_STATUS.ASSIGNED]: "active",
  [DELIVERY_STATUS.PICKED_UP]: "active",
  [DELIVERY_STATUS.DELIVERING]: "active",
  [DELIVERY_STATUS.DELIVERED]: "active",
  [RESTAURANT_STATUS.OPEN]: "active",
  [RESTAURANT_STATUS.CLOSED]: "waiting",
  [RIDER_STATUS.AVAILABLE]: "active",
  [RIDER_STATUS.OFF]: "waiting",
  [SETTLEMENT_STATUS.CREATED]: "waiting",
  [SETTLEMENT_STATUS.PAID]: "active",
};

/** 정산 상태는 화면에서 이렇게 바꿔 보여 준다 */
export const SETTLEMENT_LABEL: Record<SettlementStatus, string> = {
  [SETTLEMENT_STATUS.CREATED]: "지급 예정",
  [SETTLEMENT_STATUS.PAID]: "지급 완료",
};
