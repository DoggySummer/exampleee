import { cancelPayment, hasSecretKey } from "@/app/_lib/payment/tossServer";

/**
 * [개발용] 백엔드 대신 토스 결제 취소. MSW 가짜 API의 주문 거절(API 22)이 부른다.
 */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return Response.json({ message: "Not Found" }, { status: 404 });
  if (!hasSecretKey()) return Response.json({ code: "NO_SECRET_KEY", message: "TOSS_SECRET_KEY를 .env.local에 넣어 주세요" }, { status: 500 });
  const { paymentKey, cancelReason } = await request.json();
  const r = await cancelPayment(paymentKey, cancelReason ?? "가게 사정으로 주문 거절");
  return Response.json(r.body, { status: r.status });
}
