// 응답 모양 (명세의 "응답 본문 예시" 그대로)
import {
  Address, Customer, Menu, Owner, Payment, Restaurant, Rider, Settlement, SettlementItem,
} from '../entities';
import { Role } from './constants';
import { toDateString, toKstIso } from './time';

/** 회원: 고객 = 기본, 점주 = phone 생략, 라이더 = status 추가 */
export function userView(role: Role, u: Customer | Owner | Rider) {
  if (role === 'OWNER') return { id: u.id, role, name: u.name, email: u.email };
  const base = { id: u.id, role, name: u.name, email: u.email, phone: (u as Customer).phone };
  return role === 'RIDER' ? { ...base, status: (u as Rider).status } : base;
}

export const addressView = (a: Address) => ({
  id: a.id,
  customerId: a.customerId,
  address: a.address,
  detailAddress: a.detailAddress,
});

export const storeView = (r: Restaurant) => ({
  id: r.id,
  ownerId: r.ownerId,
  name: r.name,
  address: r.address,
  status: r.status,
  deliveryFee: r.deliveryFee,
});

export const menuView = (m: Menu) => ({
  id: m.id,
  storeId: m.restaurantId,
  name: m.name,
  price: m.price,
});

export const paymentView = (p: Payment) => ({
  id: p.id,
  orderId: p.orderId,
  method: p.method,
  amount: p.amount,
  status: p.status,
  canceledAt: toKstIso(p.canceledAt),
});

export const settlementView = (s: Settlement) => ({
  id: s.id,
  storeId: s.restaurantId,
  riderId: s.riderId,
  startDate: toDateString(s.startDate),
  endDate: toDateString(s.endDate),
  amount: s.amount,
  status: s.status,
});

export const settlementItemView = (i: SettlementItem) => ({
  id: i.id,
  settlementId: i.settlementId,
  orderId: i.orderId,
  payTarget: i.payTarget,
  payAmount: i.payAmount,
});

/** MySQL 중복 키 오류인지 (UNIQUE 위반) */
export const isDuplicateError = (e: unknown) =>
  (e as { code?: string })?.code === 'ER_DUP_ENTRY' ||
  (e as { driverError?: { code?: string } })?.driverError?.code === 'ER_DUP_ENTRY';
