"use client";

import Link from "next/link";
import { LuMapPin, LuStore } from "react-icons/lu";
import { EmptyState } from "@/app/_components/EmptyState";
import { FoodImage } from "@/app/_components/FoodImage";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useAddresses, useRestaurants } from "@/app/_hooks/queries/customer";
import { useMe } from "@/app/_hooks/queries/useMe";
import { RESTAURANT_STATUS } from "@/app/_lib/constants/status";
import { formatFee } from "@/app/_lib/utils/format";
import { useCart } from "@/app/_stores/cartStore";

export function RestaurantList() {
  const { data, isPending, isError, refetch } = useRestaurants();

  if (isPending) return <LoadingRows />;
  if (isError) return <ErrorState message="가게 목록을 불러오지 못했어요" onRetry={() => refetch()} />;
  if (data.length === 0) return <EmptyState icon={LuStore} title="아직 등록된 가게가 없어요" />;

  // 영업중인 가게가 위로 (검색·정렬 기능은 없음)
  const sorted = [...data].sort(
    (a, b) => Number(b.status === RESTAURANT_STATUS.OPEN) - Number(a.status === RESTAURANT_STATUS.OPEN),
  );

  return (
    <>
      <AddressBanner />
      <h2 className="px-4 pt-5 pb-1 text-lg font-extrabold tracking-tight">우리 동네 가게</h2>
      <ul>
        {sorted.map((r) => {
          const closed = r.status !== RESTAURANT_STATUS.OPEN;
          return (
            <li key={r.restaurant_id} className="border-b border-line last:border-0">
              <Link href={`/restaurants/${r.restaurant_id}`} className="flex gap-3.5 px-4 py-4 active:bg-tray">
                <FoodImage src={r.image_url} alt="" className={`size-[76px] shrink-0 rounded-lg ${closed ? "opacity-45 grayscale" : ""}`} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className={`truncate font-bold ${closed ? "text-muted" : ""}`}>{r.name}</p>
                    {closed && (
                      <span className="shrink-0 rounded-md bg-field px-1.5 py-0.5 text-xs font-bold text-muted">준비중</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-caption text-muted">{r.address}</p>
                  <p className="mt-1.5 text-caption">
                    배달비 <b className={`font-bold tabular-nums ${r.delivery_fee === 0 ? "text-brand" : ""}`}>{formatFee(r.delivery_fee)}</b>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** 로그인한 손님에게 기본 배송지를 보여 준다 (참고 이미지의 "Delivery to Home" 카드) */
function AddressBanner() {
  const { data: me } = useMe();
  const isCustomer = me?.role === "customer";
  const { data: addresses } = useAddresses(isCustomer);
  const lastId = useCart((s) => s.lastAddressId);
  if (!isCustomer || !addresses) return null;

  const addr = addresses.find((a) => a.address_id === lastId) ?? addresses[0];
  return (
    <Link href="/my/addresses" className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-brand px-4 py-3.5 text-white active:bg-brand-press">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/20">
        <LuMapPin size={20} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs opacity-85">배달 주소</span>
        <span className="block truncate font-bold">
          {addr ? [addr.address, addr.address_detail].filter(Boolean).join(" ") : "배송지를 등록해 주세요"}
        </span>
      </span>
    </Link>
  );
}
