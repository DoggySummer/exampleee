"use client";

import Link from "next/link";
import { LuShoppingBag } from "react-icons/lu";
import { useMe } from "@/app/_hooks/queries/useMe";
import { cartCount, useCart } from "@/app/_stores/cartStore";

/** 손님 홈 헤더 오른쪽: 로그인 전에는 로그인, 로그인 후에는 장바구니 */
export function HeaderActions() {
  const { data: me, isPending } = useMe();
  const count = useCart((s) => cartCount(s.lines));

  if (isPending) return null;
  if (!me || me.role !== "customer") {
    return (
      <Link href="/login" className="flex h-11 items-center px-1 text-caption font-bold text-brand">
        로그인
      </Link>
    );
  }
  return (
    <Link href="/cart" aria-label={`장바구니 ${count}개`} className="relative flex size-11 items-center justify-center rounded-md active:bg-field">
      <LuShoppingBag size={23} aria-hidden />
      {count > 0 && (
        <span className="absolute top-1 right-0.5 min-w-[18px] rounded-full bg-brand px-1 text-center text-[11px] leading-[18px] font-extrabold text-white tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
