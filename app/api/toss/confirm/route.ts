import { confirmPayment, hasSecretKey } from "@/app/_lib/payment/tossServer";

/**
 * [개발용] 백엔드 대신 토스 결제 승인. MSW 가짜 API의 주문 생성(API 19)이 부른다.
 * 실제 백엔드를 쓰면(NEXT_PUBLIC_API_MOCKING=disabled) 404.
 */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return Response.json({ message: "Not Found" }, { status: 404 });
  if (!hasSecretKey()) return Response.json({ code: "NO_SECRET_KEY", message: "TOSS_SECRET_KEY를 .env.local에 넣어 주세요" }, { status: 500 });
  const { paymentKey, orderId, amount } = await request.json();
  const r = await confirmPayment({ paymentKey, orderId, amount: Number(amount) });
  return Response.json(r.body, { status: r.status });
}
