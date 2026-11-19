/**
 * 결제창으로 가기 직전의 주문 정보.
 * 토스 결제창은 다른 페이지로 갔다가 successUrl로 돌아오므로 sessionStorage에 잠깐 보관한다.
 */
export interface PendingCheckout {
  toss_order_id: string;
  restaurant_id: number;
  address_id: number;
  items: { menu_id: number; quantity: number }[];
  amount: number;
}

const KEY = "pending-checkout";

export function savePendingCheckout(p: PendingCheckout) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 저장 못 해도 결제 흐름은 계속 */
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingCheckout) : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
