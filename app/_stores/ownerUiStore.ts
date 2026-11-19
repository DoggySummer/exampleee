"use client";

import { create } from "zustand";

export type OwnerTab = "new" | "cooking" | "done";

interface OwnerUiState {
  tab: OwnerTab;
  setTab: (t: OwnerTab) => void;
  /** 아직 확인 안 한 새 주문 수 (팝업) */
  newCount: number;
  addNew: (n: number) => void;
  clearNew: () => void;
}

export const useOwnerUi = create<OwnerUiState>((set) => ({
  tab: "new",
  setTab: (tab) => set({ tab }),
  newCount: 0,
  addNew: (n) => set((s) => ({ newCount: s.newCount + n })),
  clearNew: () => set({ newCount: 0 }),
}));
