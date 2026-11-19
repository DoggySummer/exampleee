/**
 * MSW 가짜 DB (메모리). 새로고침하면 처음 상태로 돌아간다.
 * 테스트 계정 비밀번호는 모두 test1234
 */
import type { Role } from "@/app/_lib/constants/roles";
import type {
  Address,
  Delivery,
  DeliveryHistory,
  Menu,
  Order,
  OrderItem,
  Payment,
  Restaurant,
} from "@/app/_lib/types/db";

export interface MockUser {
  id: number;
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  /** 점주만: 가게가 없으면 null */
  restaurant_id?: number | null;
}

/** 지금부터 minutes분 전 시각 (ISO) */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const restaurants: Restaurant[] = [
  { restaurant_id: 1, name: "김밥천국 광교점", address: "수원시 영통구 광교로 12", status: "영업중", owner_id: 1, delivery_fee: 3000, image_url: "/mock/r1.svg" },
  { restaurant_id: 2, name: "홍콩반점 광교중앙역점", address: "수원시 영통구 광교중앙로 140", status: "영업중", owner_id: 3, delivery_fee: 3000, image_url: "/mock/r2.svg" },
  { restaurant_id: 3, name: "하루돈까스", address: "수원시 영통구 도청로 89", status: "영업중", owner_id: 4, delivery_fee: 2500, image_url: "/mock/r3.svg" },
  { restaurant_id: 4, name: "바삭치킨 광교점", address: "수원시 영통구 광교호수로 58", status: "영업중", owner_id: 5, delivery_fee: 0, image_url: "/mock/r4.svg" },
  { restaurant_id: 5, name: "할매순대국", address: "수원시 영통구 이의동 1235", status: "영업종료", owner_id: 6, delivery_fee: 2000, image_url: "/mock/r5.svg" },
  { restaurant_id: 6, name: "달콤한오후", address: "수원시 영통구 광교중앙로 248", status: "영업중", owner_id: 7, delivery_fee: 3500, image_url: "/mock/r6.svg" },
];

let menuSeq = 0;
const m = (restaurant_id: number, name: string, price: number, image_url: string | null = null, is_sold_out = false): Menu => ({
  menu_id: ++menuSeq,
  restaurant_id,
  name,
  price,
  image_url,
  is_sold_out,
});

const menus: Menu[] = [
  m(1, "참치김밥", 4500, "/mock/m1.svg"),
  m(1, "치즈김밥", 4000),
  m(1, "라볶이", 6500, "/mock/m2.svg"),
  m(1, "돈까스김밥", 5000, null, true),
  m(1, "쫄면", 7000),
  m(2, "짜장면", 7000, "/mock/m4.svg"),
  m(2, "짬뽕", 8500, "/mock/m2.svg"),
  m(2, "탕수육 (소)", 15000),
  m(2, "볶음밥", 8000),
  m(3, "등심돈까스", 11000, "/mock/m3.svg"),
  m(3, "치즈돈까스", 12500),
  m(3, "냉모밀", 8000, null, true),
  m(4, "후라이드치킨", 19000, "/mock/m4.svg"),
  m(4, "양념치킨", 20000),
  m(4, "반반치킨", 20000),
  m(5, "순대국", 9000, "/mock/m5.svg"),
  m(5, "모듬순대", 13000),
  m(6, "딸기 크로플", 7500, "/mock/m6.svg"),
  m(6, "아메리카노", 3500),
  m(6, "바닐라 라떼", 4800),
];

const addresses: Address[] = [
  { address_id: 1, customer_id: 1, address: "수원시 영통구 광교중앙로 145", address_detail: "302호" },
  { address_id: 2, customer_id: 1, address: "수원시 영통구 월드컵로 206", address_detail: "아주대 팔달관 4층" },
];

/** 예시 주문 3건 (손님 1): 배달중 / 배달완료 / 거절 */
const orders: Order[] = [
  { order_id: 41, customer_id: 1, restaurant_id: 2, ordered_time: ago(60 * 26), status: "거절", address_id: 1, order_address: "수원시 영통구 광교중앙로 145 302호", total_amount: 15500, delivery_fee: 3000 },
  { order_id: 40, customer_id: 1, restaurant_id: 3, ordered_time: ago(60 * 24 * 3), status: "조리완료", address_id: 2, order_address: "수원시 영통구 월드컵로 206 아주대 팔달관 4층", total_amount: 23500, delivery_fee: 2500 },
  { order_id: 42, customer_id: 1, restaurant_id: 1, ordered_time: ago(26), status: "조리완료", address_id: 1, order_address: "수원시 영통구 광교중앙로 145 302호", total_amount: 15500, delivery_fee: 3000 },
];

const orderItems: OrderItem[] = [
  { order_item_id: 1, order_id: 42, menu_id: 1, quantity: 2, unit_price: 4500 },
  { order_item_id: 2, order_id: 42, menu_id: 3, quantity: 1, unit_price: 6500 },
  { order_item_id: 3, order_id: 41, menu_id: 6, quantity: 1, unit_price: 7000 },
  { order_item_id: 4, order_id: 41, menu_id: 7, quantity: 1, unit_price: 8500 },
  { order_item_id: 5, order_id: 40, menu_id: 10, quantity: 1, unit_price: 11000 },
  { order_item_id: 6, order_id: 40, menu_id: 11, quantity: 1, unit_price: 12500 },
];

const payments: Payment[] = [
  { payment_id: 1, order_id: 42, method: "카드", amount: 18500, status: "완료", canceled_at: null, payment_key: "mock_pk_42", toss_order_id: "seed-42" },
  { payment_id: 2, order_id: 41, method: "간편결제", amount: 18500, status: "취소완료", canceled_at: ago(60 * 26 - 2), payment_key: "mock_pk_41", toss_order_id: "seed-41" },
  { payment_id: 3, order_id: 40, method: "카드", amount: 26000, status: "완료", canceled_at: null, payment_key: "mock_pk_40", toss_order_id: "seed-40" },
];

const deliveries: Delivery[] = [
  { delivery_id: 1, order_id: 42, rider_id: 1, status: "배달중" },
  { delivery_id: 2, order_id: 40, rider_id: 1, status: "배달완료" },
];

const deliveryHistory: DeliveryHistory[] = [
  { history_id: 1, delivery_id: 1, status: "배정완료", changed_at: ago(9) },
  { history_id: 2, delivery_id: 1, status: "픽업완료", changed_at: ago(3) },
  { history_id: 3, delivery_id: 1, status: "배달중", changed_at: ago(3) },
  { history_id: 4, delivery_id: 2, status: "배정완료", changed_at: ago(60 * 24 * 3 - 18) },
  { history_id: 5, delivery_id: 2, status: "픽업완료", changed_at: ago(60 * 24 * 3 - 25) },
  { history_id: 6, delivery_id: 2, status: "배달중", changed_at: ago(60 * 24 * 3 - 25) },
  { history_id: 7, delivery_id: 2, status: "배달완료", changed_at: ago(60 * 24 * 3 - 41) },
];

export const db = {
  users: [
    { id: 1, role: "customer", name: "김지민", email: "customer@test.com", password: "test1234", phone: "010-2345-6789" },
    { id: 2, role: "customer", name: "이미 가입", email: "taken@test.com", password: "test1234", phone: "010-1111-2222" },
    { id: 1, role: "owner", name: "박사장", email: "owner@test.com", password: "test1234", restaurant_id: 1 },
    { id: 2, role: "owner", name: "최신규", email: "newowner@test.com", password: "test1234", restaurant_id: null },
    { id: 1, role: "rider", name: "정라이더", email: "rider@test.com", password: "test1234", phone: "010-3456-7890" },
  ] as MockUser[],
  restaurants,
  menus,
  addresses,
  orders,
  orderItems,
  payments,
  deliveries,
  deliveryHistory,
};

/** 같은 역할 안에서만 이메일 중복 검사 (고객·점주·라이더 테이블이 따로라서) */
export function findUser(role: Role, email: string) {
  return db.users.find((u) => u.role === role && u.email.toLowerCase() === email.toLowerCase());
}

export function nextId(role: Role) {
  return Math.max(0, ...db.users.filter((u) => u.role === role).map((u) => u.id)) + 1;
}

/** 배열에서 다음 일련번호 (AUTO_INCREMENT 흉내) */
export function seq<T>(rows: T[], key: keyof T) {
  return Math.max(0, ...rows.map((r) => Number(r[key]))) + 1;
}
