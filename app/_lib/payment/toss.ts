/**
 * 토스페이먼츠 결제창 (SDK v2, API 개별 연동 키 test_ck_...).
 * 결제창에서 인증이 끝나면 토스가 successUrl / failUrl로 이동시킨다.
 *   성공: /checkout/success?paymentType&orderId&paymentKey&amount → 서버가 승인 API 호출
 *   실패·취소: /checkout/fail?code&message&orderId → 승인 API를 부르지 않음
 * 클라이언트 키가 없으면(NEXT_PUBLIC_TOSS_CLIENT_KEY 비어 있음) 장바구니가 테스트 결제창을 대신 띄운다.
 */
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
export const TOSS_ENABLED = TOSS_CLIENT_KEY.startsWith("test_ck_") || TOSS_CLIENT_KEY.startsWith("live_ck_");

interface Params {
  /** 6~64자, 영문·숫자·-_= (UUID 사용) */
  orderId: string;
  amount: number;
  orderName: string;
  customerName?: string;
}

export async function requestTossPayment({ orderId, amount, orderName, customerName }: Params) {
  const toss = await loadTossPayments(TOSS_CLIENT_KEY);
  // 손님 계정과 토스 회원을 연결하지 않으므로 비회원 결제
  const payment = toss.payment({ customerKey: ANONYMOUS });
  await payment.requestPayment({
    method: "CARD", // 카드 결제창 안에서 토스페이·카카오페이 등 간편결제도 고를 수 있다
    amount: { currency: "KRW", value: amount },
    orderId,
    orderName,
    customerName,
    successUrl: `${window.location.origin}/checkout/success`,
    failUrl: `${window.location.origin}/checkout/fail`,
    card: { flowMode: "DEFAULT" },
  });
}
