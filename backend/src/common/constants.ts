// 확인사항.txt "2. 상태값 (최종)" 그대로

export type Role = 'CUSTOMER' | 'OWNER' | 'RIDER';
export const ROLES: Role[] = ['CUSTOMER', 'OWNER', 'RIDER'];

export const ORDER_STATUS = {
  PAYMENT_FAILED: '결제실패',
  WAITING: '접수대기',
  COOKING: '조리중',
  COOKED: '조리완료',
  REJECTED: '거절',
} as const;
export const ORDER_STATUSES = Object.values(ORDER_STATUS) as string[];

export const PAYMENT_STATUS = {
  DONE: '완료',
  FAILED: '실패',
  CANCELED: '취소완료',
} as const;

export const PAYMENT_METHODS = ['카드', '간편결제'];

// 배정완료 → 픽업완료 → 배달중 → 배달완료 (순서대로만)
export const DELIVERY_FLOW = ['배정완료', '픽업완료', '배달중', '배달완료'];
export const DELIVERY_STATUS = {
  ASSIGNED: '배정완료',
  PICKED_UP: '픽업완료',
  ON_THE_WAY: '배달중',
  DONE: '배달완료',
} as const;

export const RIDER_STATUS = {
  AVAILABLE: '운행가능',
  DELIVERING: '배달중',
  OFF: '운행종료',
} as const;

export const STORE_STATUS = {
  OPEN: '영업중',
  CLOSED: '영업종료',
} as const;
export const STORE_STATUSES = Object.values(STORE_STATUS) as string[];

export const SETTLEMENT_STATUS = {
  CREATED: '생성완료',
  PAID: '지급완료',
} as const;

export const PAY_TARGET = {
  STORE: '음식점',
  RIDER: '라이더',
} as const;

// 금액·수량 상한 (명세: 0~2,147,483,647)
export const INT_MAX = 2147483647;
