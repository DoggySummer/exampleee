"use client";

import { ToggleSwitch } from "@/app/_components/ToggleSwitch";
import { useMyRestaurant, useUpdateRestaurant } from "@/app/_hooks/queries/owner";
import { ApiError } from "@/app/_lib/api/client";
import { RESTAURANT_STATUS } from "@/app/_lib/constants/status";
import { unlockSound } from "@/app/_lib/utils/alertSound";
import { toast } from "@/app/_stores/toastStore";

/** 헤더의 영업 토글. 판매할 수 있는 메뉴가 0개면 켤 수 없다 */
export function OpenToggle() {
  const { data: r } = useMyRestaurant();
  const update = useUpdateRestaurant();
  if (!r) return null;

  const open = r.status === RESTAURANT_STATUS.OPEN;
  const sellable = r.menus.some((m) => !m.is_sold_out);

  async function change(next: boolean) {
    if (next && !sellable) {
      toast("판매할 수 있는 메뉴가 없어요. 메뉴를 1개 이상 등록해 주세요.", "error");
      return;
    }
    // 영업을 켜는 클릭에 알림음도 같이 켠다
    if (next) unlockSound();
    try {
      await update.mutateAsync({ status: next ? RESTAURANT_STATUS.OPEN : RESTAURANT_STATUS.CLOSED });
      toast(next ? "영업을 시작했어요. 새 주문이 오면 알려 드릴게요." : "영업을 마쳤어요. 들어온 주문은 계속 처리할 수 있어요.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "영업 상태를 바꾸지 못했어요", "error");
    }
  }

  return (
    <ToggleSwitch
      checked={open}
      onChange={change}
      label="영업 상태"
      text={open ? "영업중" : "영업종료"}
      disabled={update.isPending}
    />
  );
}
