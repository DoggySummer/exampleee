import { CheckoutSuccess } from "./_components/CheckoutSuccess";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** 토스 결제창이 인증에 성공하면 이 주소로 돌아온다: ?paymentKey&orderId&amount */
export default async function Page({ searchParams }: PageProps<"/checkout/success">) {
  const sp = await searchParams;
  return <CheckoutSuccess paymentKey={one(sp.paymentKey)} orderId={one(sp.orderId)} amount={Number(one(sp.amount))} />;
}
