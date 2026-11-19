/**
 * DB 테이블 기준 타입 (테이블 정의서 2026.11.13 + 2026.11.19 프론트 요청 컬럼)
 * 필드명은 DB 컬럼명(snake_case) 그대로 쓴다.
 * "추가 요청" 표시가 붙은 컬럼은 아직 DB에 없고 DB 담당에게 요청한 것이다.
 */
import type {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RestaurantStatus,
  RiderStatus,
  SettlementStatus,
} from "@/app/_lib/constants/status";

export interface Customer {
  customer_id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  address_id: number;
  customer_id: number;
  address: string;
  address_detail: string | null;
}

export interface Owner {
  owner_id: number;
  email: string;
  name: string;
}

export interface Restaurant {
  restaurant_id: number;
  name: string;
  address: string;
  status: RestaurantStatus;
  owner_id: number;
  delivery_fee: number;
  /** 추가 요청: 대표 사진 (필수) */
  image_url: string;
}

export interface Menu {
  menu_id: number;
  restaurant_id: number;
  name: string;
  price: number;
  /** 추가 요청: 메뉴 사진 (선택) */
  image_url: string | null;
  /** 추가 요청: 품절 여부. 팔린 메뉴는 지울 수 없어서 삭제 대신 품절 처리 */
  is_sold_out: boolean;
}

export interface Order {
  order_id: number;
  customer_id: number;
  restaurant_id: number;
  ordered_time: string;
  status: OrderStatus;
  address_id: number;
  /** 주문 시점 주소 복사본 */
  order_address: string;
  /** 메뉴 합계 (배달비 제외) */
  total_amount: number;
  /** 주문 시점 배달비 복사본 */
  delivery_fee: number;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_id: number;
  quantity: number;
  /** 주문 시점 단가 복사본 */
  unit_price: number;
}

export interface Rider {
  rider_id: number;
  name: string;
  phone: string;
  status: RiderStatus;
  email: string;
}

export interface Delivery {
  delivery_id: number;
  order_id: number;
  rider_id: number;
  status: DeliveryStatus;
}

export interface DeliveryHistory {
  history_id: number;
  delivery_id: number;
  status: DeliveryStatus;
  changed_at: string;
}

export interface Payment {
  payment_id: number;
  order_id: number;
  method: PaymentMethod;
  /** 주문금액 + 배달비 */
  amount: number;
  status: PaymentStatus;
  canceled_at: string | null;
  /** 추가 요청: 토스 결제 키 (거절 시 결제 취소에 필요) */
  payment_key: string;
  /** 추가 요청: 결제창에 넘긴 주문 문자열 ID */
  toss_order_id: string;
}

export interface Settlement {
  settlement_id: number;
  /** 음식점 정산이면 값, 라이더 정산이면 null */
  restaurant_id: number | null;
  /** 라이더 정산이면 값, 음식점 정산이면 null */
  rider_id: number | null;
  start_date: string;
  end_date: string;
  amount: number;
  status: SettlementStatus;
}

export interface SettlementItem {
  settlement_item_id: number;
  settlement_id: number;
  order_id: number;
  pay_target: "음식점" | "라이더";
  pay_amount: number;
}
