/**
 * 토스페이먼츠 서버 API (승인·취소). 시크릿 키를 쓰므로 서버에서만 실행한다.
 *
 * ⚠️ 원래는 Express 백엔드가 할 일이다. 백엔드 없이 MSW로 개발·시연할 때만
 *    Next.js 라우트(/api/toss/*)가 백엔드 대신 이 함수를 부른다. 백엔드 구현 예시는 README 참고.
 */
const TOSS_API = "https://api.tosspayments.com/v1";

function authHeader() {
  const secret = process.env.TOSS_SECRET_KEY ?? "";
  // Basic base64("시크릿키:") — 콜론 뒤 비밀번호는 비워 둔다
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export const hasSecretKey = () => /^(test|live)_sk_/.test(process.env.TOSS_SECRET_KEY ?? "");

export interface TossResult {
  ok: boolean;
  status: number;
  /** 성공: 토스 Payment 객체 / 실패: { code, message } */
  body: Record<string, unknown>;
}

async function call(path: string, body: unknown, idempotencyKey?: string): Promise<TossResult> {
  try {
    const res = await fetch(`${TOSS_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status, body: await res.json() };
  } catch {
    return { ok: false, status: 502, body: { code: "NETWORK_ERROR", message: "토스페이먼츠에 연결하지 못했어요" } };
  }
}

/** 결제 승인: successUrl로 받은 paymentKey·orderId·amount를 그대로 보낸다 */
export const confirmPayment = (p: { paymentKey: string; orderId: string; amount: number }) =>
  call("/payments/confirm", p, `confirm-${p.orderId}`);

/** 결제 취소 (사장님 거절) */
export const cancelPayment = (paymentKey: string, cancelReason: string) =>
  call(`/payments/${paymentKey}/cancel`, { cancelReason }, `cancel-${paymentKey}`);
