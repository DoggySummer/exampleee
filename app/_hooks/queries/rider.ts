"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptDelivery,
  getAvailableOrders,
  getMyDeliveries,
  getRiderMe,
  getRiderSettlements,
  setRiderStatus,
  updateDeliveryStatus,
} from "@/app/_lib/api/riderApi";
import { POLLING } from "@/app/_lib/constants/polling";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import { RIDER_STATUS, type DeliveryStatus } from "@/app/_lib/constants/status";

export const useRiderMe = () => useQuery({ queryKey: queryKeys.riderMe, queryFn: getRiderMe });

/** 수락 가능한 주문 — 출근(운행가능)일 때만 10초 폴링 */
export const useAvailableOrders = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.available,
    queryFn: getAvailableOrders,
    enabled,
    refetchInterval: enabled ? POLLING.RIDER_AVAILABLE : false,
  });

export const useMyDeliveries = () => useQuery({ queryKey: queryKeys.myDeliveries, queryFn: getMyDeliveries });

/** 상태가 바뀌면 운행상태·수락 목록·내 배달을 같이 새로 불러온다 */
function useRefreshRider() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.riderMe });
    qc.invalidateQueries({ queryKey: queryKeys.available });
    qc.invalidateQueries({ queryKey: queryKeys.myDeliveries });
  };
}

export function useSetRiderStatus() {
  const refresh = useRefreshRider();
  return useMutation({ mutationFn: (on: boolean) => setRiderStatus(on ? RIDER_STATUS.AVAILABLE : RIDER_STATUS.OFF), onSettled: refresh });
}

export function useAcceptDelivery() {
  const refresh = useRefreshRider();
  return useMutation({ mutationFn: acceptDelivery, onSettled: refresh });
}

export function useUpdateDelivery() {
  const refresh = useRefreshRider();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: DeliveryStatus }) => updateDeliveryStatus(id, status),
    onSettled: refresh,
  });
}

export const useRiderSettlements = () =>
  useQuery({ queryKey: queryKeys.riderSettlements, queryFn: getRiderSettlements });
