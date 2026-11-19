"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  getMyOrders,
  getOrder,
  getRestaurant,
  getRestaurants,
  updateAddress,
} from "@/app/_lib/api/customerApi";
import { POLLING } from "@/app/_lib/constants/polling";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import type { AddressBody } from "@/app/_lib/types/api";
import { isFinalOrder } from "@/app/_lib/utils/orderStep";

export const useRestaurants = () =>
  useQuery({ queryKey: queryKeys.restaurants, queryFn: getRestaurants });

export const useRestaurant = (id: number) =>
  useQuery({ queryKey: queryKeys.restaurant(id), queryFn: () => getRestaurant(id) });

export const useAddresses = (enabled = true) =>
  useQuery({ queryKey: queryKeys.addresses, queryFn: getAddresses, enabled });

export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: AddressBody }) =>
      id ? updateAddress(id, body) : createAddress(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export const useMyOrders = () => useQuery({ queryKey: queryKeys.myOrders, queryFn: getMyOrders });

/** 주문 상세. 끝난 주문(배달완료·거절·결제실패)이 되면 폴링을 멈춘다 */
export const useOrder = (id: number) =>
  useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    refetchInterval: (q) => (q.state.data && isFinalOrder(q.state.data) ? false : POLLING.CUSTOMER_ORDER),
  });
