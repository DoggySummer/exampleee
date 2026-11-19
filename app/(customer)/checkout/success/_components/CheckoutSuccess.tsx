"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuCircleAlert } from "react-icons/lu";
import { createOrder } from "@/app/_lib/api/customerApi";
import { ApiError } from "@/app/_lib/api/client";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import { clearPendingCheckout, readPendingCheckout } from "@/app/_lib/utils/pendingCheckout";
import { useCart } from "@/app/_stores/cartStore";

/** 결제창에 다녀오는 사이 주문 정보가 없어진 경우 */
class MissingCheckout extends Error {}

interface Props {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/** 결제 확인 → 서버가 토스 승인 후 주문 저장 → 주문 상세로 이동 */
export function CheckoutSuccess({ paymentKey, orderId, amount }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    // 개발 모드에서 effect가 두 번 실행돼도 한 번만 보낸다 (서버도 같은 결제는 한 번만 저장)
    if (sent.current) return;
    sent.current = true;

    const pending = readPendingCheckout();
    const valid = !!paymentKey && !!pending && pending.toss_order_id === orderId && pending.amount === amount;

    (valid
      ? createOrder({
          restaurant_id: pending.restaurant_id,
          address_id: pending.address_id,
          items: pending.items,
          paymentKey,
          toss_order_id: orderId,
          amount,
        })
      : Promise.reject(new MissingCheckout())
    )
      .then((res) => {
        const cart = useCart.getState();
        cart.clear();
        cart.setLastAddress(pending!.address_id);
        clearPendingCheckout();
        qc.invalidateQueries({ queryKey: queryKeys.myOrders });
        router.replace(`/orders/${res.order_id}`);
      })
      .catch((e) => {
        if (e instanceof MissingCheckout) {
          setError({ title: "주문 정보를 찾지 못했어요", message: "주문 내역에서 결제가 됐는지 확인해 주세요." });
          return;
        }
        setError({
          title: e instanceof ApiError && e.status === 402 ? "결제가 완료되지 않았어요" : "주문하지 못했어요",
          message: e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.",
        });
      });
  }, [paymentKey, orderId, amount, router, qc]);

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center" role="alert">
        <LuCircleAlert size={32} className="text-danger" aria-hidden />
        <h2 className="mt-4 text-lg font-extrabold">{error.title}</h2>
        <p className="mt-1.5 text-muted">{error.message}</p>
        <p className="mt-1 text-caption text-muted">장바구니는 그대로 있어요.</p>
        <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2">
          <Link href="/cart" className="flex h-12 items-center justify-center rounded-[10px] bg-brand font-extrabold text-white">
            장바구니로 돌아가기
          </Link>
          <Link href="/orders" className="flex h-12 items-center justify-center rounded-[10px] bg-field font-bold">
            주문 내역 보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 text-center" aria-busy="true">
      <span className="size-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" aria-hidden />
      <h2 className="mt-5 text-lg font-extrabold">결제를 확인하고 있어요</h2>
      <p className="mt-1 text-muted">잠시만 기다려 주세요. 창을 닫지 마세요.</p>
    </main>
  );
}
