import { apiClient } from "@/app/_lib/api/client";
import type { Menu, Restaurant, Settlement } from "@/app/_lib/types/db";
import type {
  MenuBody,
  OwnerOrder,
  OwnerRestaurant,
  RestaurantBody,
  SettlementDetail,
  UploadResult,
} from "@/app/_lib/types/api";

/** 사진 업로드 → 서버가 저장한 주소. 5MB 이하 jpg·png */
export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<UploadResult>("/uploads", form);
  return data.url;
}

/** O3 — 가게가 없으면 404 */
export const getMyRestaurant = () =>
  apiClient.get<OwnerRestaurant>("/owners/me/restaurant").then((r) => r.data);
/** O4 */
export const createRestaurant = (body: RestaurantBody) =>
  apiClient.post<Restaurant>("/owners/me/restaurant", body).then((r) => r.data);
/** O5 — 영업상태도 이걸로 바꾼다 */
export const updateRestaurant = (body: Partial<RestaurantBody> & { status?: Restaurant["status"] }) =>
  apiClient.patch<Restaurant>("/owners/me/restaurant", body).then((r) => r.data);

/** O6 */
export const createMenu = (body: MenuBody) =>
  apiClient.post<Menu>("/owners/me/restaurant/menus", body).then((r) => r.data);
/** O7 — 품절도 이걸로 바꾼다 */
export const updateMenu = (id: number, body: Partial<MenuBody>) =>
  apiClient.patch<Menu>(`/menus/${id}`, body).then((r) => r.data);

/** O8 */
export const getOwnerOrders = () =>
  apiClient.get<OwnerOrder[]>("/owners/me/orders").then((r) => r.data);
/** O9 접수대기 → 조리중 */
export const acceptOrder = (id: number) => apiClient.patch<OwnerOrder>(`/orders/${id}/accept`).then((r) => r.data);
/** O10 접수대기 → 거절 (결제 자동 취소) */
export const rejectOrder = (id: number) => apiClient.patch<OwnerOrder>(`/orders/${id}/reject`).then((r) => r.data);
/** O11 조리중 → 조리완료 */
export const cookOrder = (id: number) => apiClient.patch<OwnerOrder>(`/orders/${id}/cooked`).then((r) => r.data);

/** S2 */
export const getOwnerSettlements = () =>
  apiClient.get<Settlement[]>("/owners/me/settlements").then((r) => r.data);
/** S4 (사장님·라이더 공통) */
export const getSettlement = (id: number) =>
  apiClient.get<SettlementDetail>(`/settlements/${id}`).then((r) => r.data);
