/**
 * 폴링 주기 (ms). 실시간 연결(WebSocket·SSE) 없이 주기적으로 다시 불러온다.
 * 결정: 10초 폴링 + 점주 새 주문은 알림음·팝업
 */
export const POLLING = {
  /** 점주 주문 관리 (점주 공통 레이아웃에서 신규 주문 감시) */
  OWNER_ORDERS: 10_000,
  /** 라이더 수락 가능한 주문 */
  RIDER_AVAILABLE: 10_000,
  /** 손님 주문 상세 — 끝난 주문(배달완료·거절·결제실패)이면 멈춤 */
  CUSTOMER_ORDER: 10_000,
} as const;
