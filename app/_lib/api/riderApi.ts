import { apiClient } from "@/app/_lib/api/client";
import type { DeliveryStatus } from "@/app/_lib/constants/status";
import type { AvailableOrder, RiderDelivery, RiderMe } from "@/app/_lib/types/api";
import type { Settlement } from "@/app/_lib/types/db";

/** R8(추가 요청) 내 운행상태 */
export const getRiderMe = () => apiClient.get<RiderMe>("/riders/me").then((r) => r.data);
/** R3 출근(운행가능)·퇴근(운행종료). 배달 중이면 409 */
export const setRiderStatus = (status: "운행가능" | "운행종료") =>
  apiClient.patch<RiderMe>("/riders/me/status", { status }).then((r) => r.data);
/** R4 */
export const getAvailableOrders = () =>
  apiClient.get<AvailableOrder[]>("/deliveries/available").then((r) => r.data);
/** R5 수락 (선착순 — 늦으면 409) */
export const acceptDelivery = (order_id: number) =>
  apiClient.post<RiderDelivery>("/deliveries", { order_id }).then((r) => r.data);
/** R6 */
export const getMyDeliveries = () =>
  apiClient.get<RiderDelivery[]>("/riders/me/deliveries").then((r) => r.data);
/** R7 — [픽업 완료]는 "배달중", [배달 완료]는 "배달완료" */
export const updateDeliveryStatus = (id: number, status: DeliveryStatus) =>
  apiClient.patch<RiderDelivery>(`/deliveries/${id}/status`, { status }).then((r) => r.data);
/** S3 */
export const getRiderSettlements = () =>
  apiClient.get<Settlement[]>("/riders/me/settlements").then((r) => r.data);
