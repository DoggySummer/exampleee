"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Menu, Restaurant } from "@/app/_lib/types/db";

export interface CartLine {
  menu_id: number;
  name: string;
  /** 담을 때 가격. 장바구니 화면에서는 가게 정보를 다시 불러와 최신 가격으로 계산한다 */
  price: number;
  quantity: number;
}

interface CartState {
  restaurant: Pick<Restaurant, "restaurant_id" | "name"> | null;
  lines: CartLine[];
  /** 마지막 주문에 쓴 배송지 → 장바구니에서 기본 선택 */
  lastAddressId: number | null;
  hydrated: boolean;

  /** 다른 가게 메뉴가 담겨 있으면 담지 않고 "conflict" */
  add: (restaurant: Pick<Restaurant, "restaurant_id" | "name">, menu: Menu) => "ok" | "conflict";
  /** 장바구니를 비우고 이 메뉴만 담는다 (다른 가게 확인창에서 "비우고 담기") */
  replaceWith: (restaurant: Pick<Restaurant, "restaurant_id" | "name">, menu: Menu) => void;
  setQuantity: (menuId: number, quantity: number) => void;
  remove: (menuId: number) => void;
  clear: () => void;
  setLastAddress: (id: number) => void;
}

/**
 * 장바구니 — 한 주문 = 한 가게. localStorage에 저장해서 새로고침해도 유지.
 * 서버 렌더링 결과와 어긋나지 않도록 skipHydration 후 CartHydrator에서 불러온다.
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      lines: [],
      lastAddressId: null,
      hydrated: false,

      add: (restaurant, menu) => {
        const s = get();
        if (s.restaurant && s.restaurant.restaurant_id !== restaurant.restaurant_id && s.lines.length > 0) {
          return "conflict";
        }
        const found = s.lines.find((l) => l.menu_id === menu.menu_id);
        set({
          restaurant,
          lines: found
            ? s.lines.map((l) => (l.menu_id === menu.menu_id ? { ...l, quantity: l.quantity + 1 } : l))
            : [...s.lines, { menu_id: menu.menu_id, name: menu.name, price: menu.price, quantity: 1 }],
        });
        return "ok";
      },
      replaceWith: (restaurant, menu) =>
        set({ restaurant, lines: [{ menu_id: menu.menu_id, name: menu.name, price: menu.price, quantity: 1 }] }),
      setQuantity: (menuId, quantity) => {
        if (quantity < 1) return get().remove(menuId);
        set({ lines: get().lines.map((l) => (l.menu_id === menuId ? { ...l, quantity } : l)) });
      },
      remove: (menuId) => {
        const lines = get().lines.filter((l) => l.menu_id !== menuId);
        set({ lines, restaurant: lines.length ? get().restaurant : null });
      },
      clear: () => set({ lines: [], restaurant: null }),
      setLastAddress: (id) => set({ lastAddressId: id }),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ restaurant, lines, lastAddressId }) => ({ restaurant, lines, lastAddressId }),
      onRehydrateStorage: () => () => useCart.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);
