"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptOrder,
  cookOrder,
  createMenu,
  createRestaurant,
  getMyRestaurant,
  getOwnerOrders,
  getOwnerSettlements,
  getSettlement,
  rejectOrder,
  updateMenu,
  updateRestaurant,
} from "@/app/_lib/api/ownerApi";
import { ApiError } from "@/app/_lib/api/client";
import { POLLING } from "@/app/_lib/constants/polling";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import type { MenuBody, RestaurantBody } from "@/app/_lib/types/api";
import type { Restaurant } from "@/app/_lib/types/db";

/** 내 가게. 가게가 없으면(404) data가 null */
export const useMyRestaurant = () =>
  useQuery({
    queryKey: queryKeys.ownerRestaurant,
    queryFn: async () => {
      try {
        return await getMyRestaurant();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

function useInvalidateRestaurant() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.ownerRestaurant });
    // 손님 화면의 가게 목록·상세도 바뀜
    qc.invalidateQueries({ queryKey: queryKeys.restaurants });
  };
}

export function useCreateRestaurant() {
  const qc = useQueryClient();
  const done = useInvalidateRestaurant();
  return useMutation({
    mutationFn: (b: RestaurantBody) => createRestaurant(b),
    onSuccess: (r) => {
      // 다음 화면에서 "가게 없음"으로 보고 등록 화면으로 되돌리지 않도록 바로 채운다
      qc.setQueryData(queryKeys.ownerRestaurant, { ...r, menus: [] });
      done();
    },
  });
}

export function useUpdateRestaurant() {
  const done = useInvalidateRestaurant();
  return useMutation({
    mutationFn: (b: Partial<RestaurantBody> & { status?: Restaurant["status"] }) => updateRestaurant(b),
    onSuccess: done,
  });
}

export function useSaveMenu() {
  const done = useInvalidateRestaurant();
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: Partial<MenuBody> }) =>
      id ? updateMenu(id, body) : createMenu(body as MenuBody),
    onSuccess: done,
  });
}

/** 들어온 주문. 점주 레이아웃(새 주문 감시)과 주문 관리 화면이 같은 쿼리를 쓴다 → 요청은 한 번 */
export const useOwnerOrders = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.ownerOrders,
    queryFn: getOwnerOrders,
    refetchInterval: POLLING.OWNER_ORDERS,
    enabled,
  });

/** 수락·거절·조리완료. 성공·실패와 상관없이 목록을 바로 다시 불러온다 */
export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: "accept" | "reject" | "cooked" }) =>
      action === "accept" ? acceptOrder(id) : action === "reject" ? rejectOrder(id) : cookOrder(id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.ownerOrders }),
  });
}

export const useOwnerSettlements = () =>
  useQuery({ queryKey: queryKeys.ownerSettlements, queryFn: getOwnerSettlements });

export const useSettlement = (id: number) =>
  useQuery({ queryKey: queryKeys.settlement(id), queryFn: () => getSettlement(id) });
