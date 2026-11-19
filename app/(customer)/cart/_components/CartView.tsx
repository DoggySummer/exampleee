"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuCircleAlert, LuPlus, LuShoppingBag } from "react-icons/lu";
import { Button } from "@/app/_components/Button";
import { EmptyState } from "@/app/_components/EmptyState";
import { FixedBottom } from "@/app/_components/FixedBottom";
import { PriceSummary } from "@/app/_components/PriceSummary";
import { QuantityStepper } from "@/app/_components/QuantityStepper";
import { LoadingRows } from "@/app/_components/StateViews";
import { useAddresses, useRestaurant } from "@/app/_hooks/queries/customer";
import { useMe } from "@/app/_hooks/queries/useMe";
import { RESTAURANT_STATUS } from "@/app/_lib/constants/status";
import { formatWon } from "@/app/_lib/utils/format";
import { requestTossPayment, TOSS_ENABLED } from "@/app/_lib/payment/toss";
import { savePendingCheckout } from "@/app/_lib/utils/pendingCheckout";
import { toast } from "@/app/_stores/toastStore";
import { useCart } from "@/app/_stores/cartStore";
import { AddressFormSheet } from "../../_components/AddressFormSheet";
import { MockPaymentSheet } from "./MockPaymentSheet";

export function CartView() {
  const cart = useCart();
  if (!cart.hydrated) return <LoadingRows rows={2} thumb={false} />;
  if (!cart.restaurant || cart.lines.length === 0) {
    return (
      <EmptyState
        icon={LuShoppingBag}
        title="장바구니가 비어 있어요"
        desc="가게에서 메뉴를 담아 주세요"
        action={
          <Link href="/" className="flex h-12 items-center justify-center rounded-[10px] bg-brand font-extrabold text-white">
            가게 보러 가기
          </Link>
        }
      />
    );
  }
  return <CartContent restaurantId={cart.restaurant.restaurant_id} />;
}

function CartContent({ restaurantId }: { restaurantId: number }) {
  const router = useRouter();
  const cart = useCart();
  // 담아 둔 사이 가격·품절·영업상태가 바뀌었을 수 있어서 가게 정보를 다시 불러온다
  const { data: r, isPending } = useRestaurant(restaurantId);
  const { data: addresses, isPending: addrPending } = useAddresses();
  const [picked, setPicked] = useState<number | null>(null);
  const [addrOpen, setAddrOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [tossOrderId, setTossOrderId] = useState("");
  const [opening, setOpening] = useState(false);
  const { data: me } = useMe();

  if (isPending || addrPending) return <LoadingRows rows={3} thumb={false} />;
  if (!r) return null;

  // 최신 가격으로 다시 계산
  const lines = cart.lines.map((l) => {
    const menu = r.menus.find((m) => m.menu_id === l.menu_id);
    return { ...l, price: menu?.price ?? l.price, soldOut: !menu || menu.is_sold_out, changed: !!menu && menu.price !== l.price };
  });
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const amount = total + r.delivery_fee;
  const closed = r.status !== RESTAURANT_STATUS.OPEN;
  const soldOut = lines.filter((l) => l.soldOut);

  // 배송지: 고른 것 → 마지막 주문에 쓴 것 → 첫 번째
  const list = addresses ?? [];
  const addressId =
    [picked, cart.lastAddressId].find((id) => id !== null && list.some((a) => a.address_id === id)) ??
    list[0]?.address_id ??
    null;

  const blocked = closed ? "가게가 영업을 마쳐서 주문할 수 없어요" : soldOut.length ? "품절된 메뉴를 빼 주세요" : !addressId ? "배송지를 등록해 주세요" : null;
  const orderName = lines.length > 1 ? `${lines[0].name} 외 ${lines.length - 1}개` : lines[0].name;

  async function requestPayment() {
    if (blocked || !addressId) return;
    // 토스 주문번호 = 서버의 Idempotency-Key. 결제 한 번에 하나
    const id = crypto.randomUUID();
    savePendingCheckout({
      toss_order_id: id,
      restaurant_id: r!.restaurant_id,
      address_id: addressId,
      items: lines.map((l) => ({ menu_id: l.menu_id, quantity: l.quantity })),
      amount,
    });
    setTossOrderId(id);

    if (!TOSS_ENABLED) {
      // 토스 키가 없으면 테스트 결제창 (같은 successUrl·failUrl 흐름)
      setPayOpen(true);
      return;
    }
    setOpening(true);
    try {
      await requestTossPayment({ orderId: id, amount, orderName, customerName: me?.name });
      // 성공하면 토스가 /checkout/success 로 이동시킨다
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
      setOpening(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col bg-tray">
      <section className="bg-paper">
        <Link href={`/restaurants/${r.restaurant_id}`} className="block border-b border-line px-4 py-3.5 font-extrabold">
          {r.name}
        </Link>
        <ul>
          {lines.map((l) => (
            <li key={l.menu_id} className="flex items-center gap-3 border-b border-line px-4 py-4 last:border-0">
              <div className="min-w-0 flex-1">
                <p className={`font-bold ${l.soldOut ? "text-faint line-through" : ""}`}>{l.name}</p>
                <p className="mt-0.5 text-caption text-muted tabular-nums">
                  {formatWon(l.price)}
                  {l.changed && <span className="ml-1.5 text-danger">가격이 바뀌었어요</span>}
                  {l.soldOut && <span className="ml-1.5 text-danger">품절</span>}
                </p>
              </div>
              <QuantityStepper value={l.quantity} onChange={(q) => cart.setQuantity(l.menu_id, q)} label={l.name} />
            </li>
          ))}
        </ul>
        <Link href={`/restaurants/${r.restaurant_id}`} className="flex h-12 items-center justify-center gap-1 border-t border-line text-sm font-bold text-brand">
          <LuPlus size={16} aria-hidden /> 메뉴 더 담기
        </Link>
      </section>

      <section className="mt-2 bg-paper px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">배송지</h2>
          <button type="button" onClick={() => setAddrOpen(true)} className="h-9 px-1 text-sm font-bold text-brand">
            새 배송지
          </button>
        </div>
        {list.length === 0 ? (
          <Button variant="ghost" size="md" onClick={() => setAddrOpen(true)}>
            배송지 등록하기
          </Button>
        ) : (
          <div role="radiogroup" aria-label="배송지" className="flex flex-col gap-2">
            {list.map((a) => {
              const on = a.address_id === addressId;
              return (
                <label
                  key={a.address_id}
                  className={`flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-brand ${
                    on ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <input type="radio" name="address" checked={on} onChange={() => setPicked(a.address_id)} className="mt-1 size-4 accent-brand" />
                  <span className="text-sm">
                    <span className="block font-semibold">{a.address}</span>
                    {a.address_detail && <span className="text-muted">{a.address_detail}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-2 bg-paper px-4 py-4">
        <PriceSummary total={total} fee={r.delivery_fee} />
      </section>

      <FixedBottom>
        {blocked && (
          <p role="alert" className="mb-2.5 flex items-center gap-1.5 text-caption text-danger">
            <LuCircleAlert size={16} aria-hidden /> {blocked}
          </p>
        )}
        <Button onClick={requestPayment} disabled={!!blocked || opening}>
          {opening ? "결제창을 여는 중…" : `${formatWon(amount)} 결제하기`}
        </Button>
        {TOSS_ENABLED && <p className="mt-2 text-center text-xs text-muted">토스페이먼츠 테스트 결제 · 실제 돈은 나가지 않아요</p>}
      </FixedBottom>

      <AddressFormSheet open={addrOpen} onClose={() => setAddrOpen(false)} onSaved={(a) => setPicked(a.address_id)} />
      <MockPaymentSheet
        open={payOpen}
        amount={amount}
        orderName={orderName}
        onResult={(result) => {
          setPayOpen(false);
          // 토스와 같은 모양으로 successUrl·failUrl 이동
          if (result === "cancel") {
            router.push(`/checkout/fail?code=PAY_PROCESS_CANCELED&orderId=${tossOrderId}`);
          } else {
            router.push(`/checkout/success${result}&orderId=${tossOrderId}&amount=${amount}`);
          }
        }}
      />
    </main>
  );
}
