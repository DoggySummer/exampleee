import { apiClient } from "@/app/_lib/api/client";
import type { Address } from "@/app/_lib/types/db";
import type {
  AddressBody,
  CreateOrderBody,
  CreateOrderResult,
  CustomerOrderSummary,
  OrderDetail,
  RestaurantDetail,
  RestaurantSummary,
} from "@/app/_lib/types/api";

/** C7 */
export const getRestaurants = () =>
  apiClient.get<RestaurantSummary[]>("/restaurants").then((r) => r.data);
/** C8 */
export const getRestaurant = (id: number) =>
  apiClient.get<RestaurantDetail>(`/restaurants/${id}`).then((r) => r.data);

/** C3 */
export const getAddresses = () =>
  apiClient.get<Address[]>("/customers/me/addresses").then((r) => r.data);
/** C4 */
export const createAddress = (body: AddressBody) =>
  apiClient.post<Address>("/customers/me/addresses", body).then((r) => r.data);
/** C5 */
export const updateAddress = (id: number, body: AddressBody) =>
  apiClient.patch<Address>(`/customers/me/addresses/${id}`, body).then((r) => r.data);
/** C6 — 주문에 쓴 배송지는 409 */
export const deleteAddress = (id: number) => apiClient.delete(`/customers/me/addresses/${id}`);

/** C9 토스 승인 + 주문 저장 */
export const createOrder = (body: CreateOrderBody) =>
  apiClient.post<CreateOrderResult>("/orders", body).then((r) => r.data);
/** C10 */
export const getMyOrders = () =>
  apiClient.get<CustomerOrderSummary[]>("/customers/me/orders").then((r) => r.data);
/** C11 */
export const getOrder = (id: number) => apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data);
