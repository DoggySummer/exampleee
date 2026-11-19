"use client";

import { useState } from "react";
import { LuPlus, LuUtensils } from "react-icons/lu";
import { Button } from "@/app/_components/Button";
import { EmptyState } from "@/app/_components/EmptyState";
import { FoodImage } from "@/app/_components/FoodImage";
import { LoadingRows } from "@/app/_components/StateViews";
import { ToggleSwitch } from "@/app/_components/ToggleSwitch";
import { useMyRestaurant, useSaveMenu } from "@/app/_hooks/queries/owner";
import { ApiError } from "@/app/_lib/api/client";
import type { Menu } from "@/app/_lib/types/db";
import { formatWon } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";
import { MenuFormSheet } from "./MenuFormSheet";

/** 메뉴 목록·추가·수정·품절. 팔린 메뉴는 주문상세가 참조해서 지울 수 없다 → 삭제 대신 품절 */
export function MenuManager() {
  const { data: r, isPending } = useMyRestaurant();
  const save = useSaveMenu();
  const [sheet, setSheet] = useState<{ open: boolean; menu: Menu | null }>({ open: false, menu: null });

  if (isPending || !r) return <LoadingRows thumb />;

  async function toggleSoldOut(menu: Menu, soldOut: boolean) {
    try {
      await save.mutateAsync({ id: menu.menu_id, body: { is_sold_out: soldOut } });
      toast(soldOut ? `${menu.name}을(를) 품절로 바꿨어요` : `${menu.name}을(를) 다시 팔아요`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "바꾸지 못했어요", "error");
    }
  }

  const openSheet = (menu: Menu | null) => setSheet({ open: true, menu });

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-caption text-muted">
          메뉴 {r.menus.length}개 · 판매 중 {r.menus.filter((m) => !m.is_sold_out).length}개
        </p>
        <button type="button" onClick={() => openSheet(null)} className="flex h-9 items-center gap-1 px-1 text-sm font-bold text-brand">
          <LuPlus size={16} aria-hidden /> 메뉴 추가
        </button>
      </div>

      {r.menus.length === 0 ? (
        <EmptyState
          icon={LuUtensils}
          title="등록한 메뉴가 없어요"
          desc="메뉴를 1개 이상 등록해야 영업을 시작할 수 있어요"
          action={<Button size="md" onClick={() => openSheet(null)}>첫 메뉴 등록하기</Button>}
        />
      ) : (
        <ul>
          {r.menus.map((m) => (
            <li key={m.menu_id} className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button type="button" onClick={() => openSheet(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${m.name} 수정`}>
                <FoodImage src={m.image_url} alt="" className={`size-14 shrink-0 rounded-lg ${m.is_sold_out ? "opacity-40 grayscale" : ""}`} />
                <span className="min-w-0">
                  <span className={`block truncate font-bold ${m.is_sold_out ? "text-faint" : ""}`}>{m.name}</span>
                  <span className={`text-caption tabular-nums ${m.is_sold_out ? "text-faint" : "text-muted"}`}>{formatWon(m.price)}</span>
                </span>
              </button>
              <ToggleSwitch
                checked={m.is_sold_out}
                onChange={(next) => toggleSoldOut(m, next)}
                label={`${m.name} 품절`}
                text="품절"
                disabled={save.isPending}
              />
            </li>
          ))}
        </ul>
      )}

      <MenuFormSheet open={sheet.open} menu={sheet.menu} onClose={() => setSheet({ open: false, menu: null })} />
    </main>
  );
}
