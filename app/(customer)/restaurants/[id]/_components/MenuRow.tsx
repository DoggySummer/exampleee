"use client";

import { FoodImage } from "@/app/_components/FoodImage";
import { QuantityStepper } from "@/app/_components/QuantityStepper";
import type { Menu } from "@/app/_lib/types/db";
import { formatWon } from "@/app/_lib/utils/format";

interface Props {
  menu: Menu;
  /** 가게가 영업종료면 담기 불가 */
  disabled: boolean;
  quantity: number;
  onAdd: () => void;
  onChange: (q: number) => void;
}

export function MenuRow({ menu, disabled, quantity, onAdd, onChange }: Props) {
  const soldOut = menu.is_sold_out;
  return (
    <li className="flex gap-3 border-b border-line px-4 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className={`font-bold ${soldOut ? "text-faint" : ""}`}>{menu.name}</p>
        <p className={`mt-1 tabular-nums ${soldOut ? "text-faint line-through" : ""}`}>{formatWon(menu.price)}</p>
        <div className="mt-3">
          {soldOut ? (
            <span className="inline-flex h-10 items-center rounded-[10px] bg-field px-3.5 text-caption font-bold text-muted">품절</span>
          ) : quantity > 0 ? (
            <QuantityStepper value={quantity} onChange={onChange} label={menu.name} />
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={disabled}
              className="h-10 rounded-[10px] border border-brand px-4 text-sm font-bold text-brand active:bg-brand-soft disabled:border-line disabled:text-faint"
            >
              담기
            </button>
          )}
        </div>
      </div>
      {menu.image_url && (
        <FoodImage src={menu.image_url} alt="" className={`size-[92px] shrink-0 rounded-lg ${soldOut ? "opacity-40 grayscale" : ""}`} />
      )}
    </li>
  );
}
