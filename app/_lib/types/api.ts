import type { DeliveryStatus, PaymentMethod } from "@/app/_lib/constants/status";
import type { Role } from "@/app/_lib/constants/roles";
import type { Address, DeliveryHistory, Menu, Order, OrderItem, Payment, Restaurant, Settlement, SettlementItem } from "./db";

/** 에러 응답 형식 (API 요청서 공통 규칙) */
export interface ApiErrorBody {
  message: string;
}

/** 로그인·내 정보 응답. 토큰은 본문이 아니라 쿠키로 받는다 */
export interface AuthUser {
  role: Role;
  id: number;
  name: string;
  /** 점주만: 가게가 없으면 null → 가게 등록 화면으로 */
  restaurant_id?: number | null;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  /** 손님·라이더만 */
  phone?: string;
}

/* ───────── 손님 화면 응답 (API 요청서 C3~C11) ───────── */

/** C7 가게 목록 */
export type RestaurantSummary = Restaurant;

/** C8 가게 상세 + 메뉴 */
export interface RestaurantDetail extends Restaurant {
  menus: Menu[];
}

export type AddressBody = Pick<Address, "address" | "address_detail">;

/** C9 주문하기 (토스 승인 + 주문 저장). 금액은 서버가 다시 계산해서 amount와 비교한다 */
export interface CreateOrderBody {
  restaurant_id: number;
  address_id: number;
  items: { menu_id: number; quantity: number }[];
  paymentKey: string;
  toss_order_id: string;
  amount: number;
}

/** C9 응답 */
export interface CreateOrderResult {
  order_id: number;
  status: Order["status"];
  total_amount: number;
  delivery_fee: number;
  payment: Pick<Payment, "amount" | "status" | "method">;
}

/** C10 내 주문 목록 한 줄 */
export interface CustomerOrderSummary {
  order_id: number;
  restaurant_name: string;
  ordered_time: string;
  status: Order["status"];
  delivery_status: DeliveryStatus | null;
  first_item_name: string;
  item_count: number;
  payment_amount: number;
}

/** C11 주문 상세 */
export interface OrderDetail extends Order {
  restaurant_name: string;
  items: (OrderItem & { menu_name: string })[];
  payment: Pick<Payment, "amount" | "status" | "method" | "canceled_at">;
  delivery: { status: DeliveryStatus; history: Pick<DeliveryHistory, "status" | "changed_at">[] } | null;
}

export type { PaymentMethod };

/* ───────── 사장님 화면 응답 (API 요청서 O3~O11, S2·S4) ───────── */

/** O3 내 가게 + 메뉴 */
export type OwnerRestaurant = RestaurantDetail;

/** O4 가게 등록 / O5 가게 수정 */
export interface RestaurantBody {
  name: string;
  address: string;
  delivery_fee: number;
  image_url: string;
}

/** O6 메뉴 등록 / O7 메뉴 수정 */
export interface MenuBody {
  name: string;
  price: number;
  image_url: string | null;
  is_sold_out?: boolean;
}

/** O8 사장님 주문 목록 한 건 */
export interface OwnerOrder {
  order_id: number;
  ordered_time: string;
  status: Order["status"];
  order_address: string;
  total_amount: number;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  items: { menu_name: string; quantity: number }[];
  /** 조리완료 뒤 배달 진행 (읽기 전용) */
  delivery: { status: DeliveryStatus; rider_name: string } | null;
}

/** S4 정산 상세 */
export interface SettlementDetail extends Settlement {
  items: (SettlementItem & { delivered_at: string | null })[];
}

/** 이미지 업로드 응답 */
export interface UploadResult {
  url: string;
}
