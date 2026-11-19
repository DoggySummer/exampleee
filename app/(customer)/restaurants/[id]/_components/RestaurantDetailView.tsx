"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/app/_components/AppHeader";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { FixedBottom } from "@/app/_components/FixedBottom";
import { FoodImage } from "@/app/_components/FoodImage";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useRestaurant } from "@/app/_hooks/queries/customer";
import { useMe } from "@/app/_hooks/queries/useMe";
import { ApiError } from "@/app/_lib/api/client";
import { RESTAURANT_STATUS } from "@/app/_lib/constants/status";
import type { Menu } from "@/app/_lib/types/db";
import { formatFee, formatWon } from "@/app/_lib/utils/format";
import { cartCount, useCart } from "@/app/_stores/cartStore";
import { MenuRow } from "./MenuRow";

export function RestaurantDetailView({ id }: { id: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: r, isPending, isError, error, refetch } = useRestaurant(id);
  const { data: me } = useMe();
  const cart = useCart();
  const [conflict, setConflict] = useState<Menu | null>(null);

  if (isPending) {
    return (
      <>
        <AppHeader title="" back="/" />
        <div className="aspect-[16/9] animate-pulse bg-field" />
        <LoadingRows rows={3} thumb={false} />
      </>
    );
  }
  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <>
        <AppHeader title="가게" back="/" />
        <ErrorState message={notFound ? "가게를 찾지 못했어요" : "가게 정보를 불러오지 못했어요"} onRetry={notFound ? undefined : () => refetch()} />
      </>
    );
  }

  const open = r.status === RESTAURANT_STATUS.OPEN;
  const info = { restaurant_id: r.restaurant_id, name: r.name };
  const sameStoreInCart = cart.restaurant?.restaurant_id === r.restaurant_id;
  const otherStoreInCart = !!cart.restaurant && !sameStoreInCart && cart.lines.length > 0;

  function add(menu: Menu) {
    // 담기부터 로그인 필요 → 로그인 후 이 화면으로 돌아온다
    if (me?.role !== "customer") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (cart.add(info, menu) === "conflict") setConflict(menu);
  }

  const lines = sameStoreInCart ? cart.lines : [];
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <>
      <AppHeader title={r.name} back="/" />
      <main className="flex flex-1 flex-col">
        <FoodImage src={r.image_url} alt={`${r.name} 대표 사진`} className={`aspect-[16/9] w-full ${open ? "" : "grayscale"}`} />
        <section className="border-b-8 border-tray px-4 pt-4 pb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">{r.name}</h2>
            {!open && <span className="rounded-md bg-field px-1.5 py-0.5 text-xs font-bold text-muted">준비중</span>}
          </div>
          <p className="mt-1 text-caption text-muted">{r.address}</p>
          <p className="mt-2 text-caption">
            배달비 <b className="font-bold tabular-nums">{formatFee(r.delivery_fee)}</b>
          </p>
          {!open && (
            <p className="mt-3 rounded-[10px] bg-field px-3.5 py-3 text-sm text-muted">
              지금은 영업을 하지 않아요. 메뉴는 볼 수 있지만 담을 수는 없어요.
            </p>
          )}
        </section>

        <h3 className="px-4 pt-5 pb-1 font-extrabold">메뉴</h3>
        <ul>
          {r.menus.map((menu) => (
            <MenuRow
              key={menu.menu_id}
              menu={menu}
              disabled={!open}
              quantity={lines.find((l) => l.menu_id === menu.menu_id)?.quantity ?? 0}
              onAdd={() => add(menu)}
              onChange={(q) => cart.setQuantity(menu.menu_id, q)}
            />
          ))}
        </ul>

        {lines.length > 0 && (
          <FixedBottom>
            <Link
              href="/cart"
              className="flex h-[54px] items-center justify-between rounded-xl bg-brand px-5 text-white active:bg-brand-press"
            >
              <span className="flex items-center gap-2 font-bold">
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-brand tabular-nums">
                  {cartCount(lines)}
                </span>
                장바구니 보기
              </span>
              <span className="text-[17px] font-extrabold tabular-nums">{formatWon(total)}</span>
            </Link>
          </FixedBottom>
        )}
        {otherStoreInCart && (
          // 다른 가게 금액이 이 가게 금액처럼 보이지 않도록 금액 대신 안내만
          <FixedBottom>
            <Link href="/cart" className="flex h-12 items-center justify-center rounded-[10px] bg-field text-sm font-bold">
              {cart.restaurant!.name} 메뉴가 장바구니에 담겨 있어요
            </Link>
          </FixedBottom>
        )}
      </main>

      <ConfirmDialog
        open={!!conflict}
        title="장바구니를 비울까요?"
        message={
          <>
            장바구니에 <b className="text-ink">{cart.restaurant?.name}</b> 메뉴가 있어요. 한 번에 한 가게만 주문할 수 있어서, 비우고{" "}
            <b className="text-ink">{conflict?.name}</b>을(를) 담을게요.
          </>
        }
        confirmLabel="비우고 담기"
        onCancel={() => setConflict(null)}
        onConfirm={() => {
          if (conflict) cart.replaceWith(info, conflict);
          setConflict(null);
        }}
      />
    </>
  );
}
