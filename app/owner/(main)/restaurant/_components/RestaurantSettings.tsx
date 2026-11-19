"use client";

import { LoadingRows } from "@/app/_components/StateViews";
import { useMyRestaurant, useUpdateRestaurant } from "@/app/_hooks/queries/owner";
import { toast } from "@/app/_stores/toastStore";
import { OpenToggle } from "../../../_components/OpenToggle";
import { RestaurantForm } from "../../../_components/RestaurantForm";

export function RestaurantSettings() {
  const { data: r, isPending } = useMyRestaurant();
  const update = useUpdateRestaurant();
  if (isPending || !r) return <LoadingRows rows={2} thumb={false} />;

  return (
    <main className="flex flex-1 flex-col bg-tray">
      <section className="flex items-center justify-between bg-paper px-4 py-2">
        <div>
          <p className="font-bold">영업 상태</p>
          <p className="text-caption text-muted">영업중일 때만 손님이 주문할 수 있어요</p>
        </div>
        <OpenToggle />
      </section>
      <section className="mt-2 bg-paper px-4 pt-5 pb-8">
        <h2 className="mb-4 font-extrabold">가게 정보</h2>
        <RestaurantForm
          key={r.restaurant_id}
          initial={r}
          submitLabel="저장하기"
          onSubmit={async (body) => {
            await update.mutateAsync(body);
            toast("가게 정보를 저장했어요");
          }}
        />
      </section>
    </main>
  );
}
