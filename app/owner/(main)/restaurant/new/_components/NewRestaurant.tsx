"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingRows } from "@/app/_components/StateViews";
import { useCreateRestaurant, useMyRestaurant } from "@/app/_hooks/queries/owner";
import { toast } from "@/app/_stores/toastStore";
import { RestaurantForm } from "../../../../_components/RestaurantForm";

/** 가게가 없는 사장님의 첫 화면. 가게는 영업종료 상태로 시작한다 */
export function NewRestaurant() {
  const router = useRouter();
  const { data: existing, isPending } = useMyRestaurant();
  const create = useCreateRestaurant();

  // 이미 가게가 있으면 가게 정보로 (방금 등록한 경우는 메뉴 관리로 가므로 제외)
  const justCreated = create.isPending || create.isSuccess;
  useEffect(() => {
    if (existing && !justCreated) router.replace("/owner/restaurant");
  }, [existing, justCreated, router]);

  if (isPending || (existing && !justCreated)) return <LoadingRows rows={2} thumb={false} />;

  return (
    <main className="flex flex-1 flex-col px-4 pt-5 pb-8">
      <h2 className="text-xl font-extrabold tracking-tight">가게 정보를 알려 주세요</h2>
      <p className="mt-1 mb-6 text-muted">등록하고 메뉴를 올리면 영업을 시작할 수 있어요.</p>
      <RestaurantForm
        submitLabel="가게 등록하기"
        onSubmit={async (body) => {
          await create.mutateAsync(body);
          toast("가게를 등록했어요. 메뉴를 등록하고 영업을 시작하세요.");
          router.replace("/owner/menus");
        }}
      />
    </main>
  );
}
