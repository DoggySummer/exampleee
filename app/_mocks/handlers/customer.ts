import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import type {
  AddressBody,
  CreateOrderBody,
  CreateOrderResult,
  CustomerOrderSummary,
  OrderDetail,
  RestaurantDetail,
} from "@/app/_lib/types/api";
import type { Order } from "@/app/_lib/types/db";
import { db, seq } from "../data";
import { advance, trackOrder } from "../progress";
import { requireRole } from "../session";

const base = `${API_URL}/api`;
const err = (status: number, message: string) => HttpResponse.json({ message }, { status });

function toDetail(order: Order): OrderDetail {
  advance(order);
  const restaurant = db.restaurants.find((r) => r.restaurant_id === order.restaurant_id)!;
  const payment = db.payments.find((p) => p.order_id === order.order_id)!;
  const delivery = db.deliveries.find((d) => d.order_id === order.order_id);
  return {
    ...order,
    restaurant_name: restaurant.name,
    items: db.orderItems
      .filter((i) => i.order_id === order.order_id)
      .map((i) => ({ ...i, menu_name: db.menus.find((m) => m.menu_id === i.menu_id)?.name ?? "삭제된 메뉴" })),
    payment: { amount: payment.amount, status: payment.status, method: payment.method, canceled_at: payment.canceled_at },
    delivery: delivery
      ? {
          status: delivery.status,
          history: db.deliveryHistory
            .filter((h) => h.delivery_id === delivery.delivery_id)
            .map(({ status, changed_at }) => ({ status, changed_at })),
        }
      : null,
  };
}

export const customerHandlers = [
  // C7 가게 목록 (로그인 없이)
  http.get(`${base}/restaurants`, async () => {
    await delay(250);
    return HttpResponse.json(db.restaurants);
  }),

  // C8 가게 상세 + 메뉴
  http.get(`${base}/restaurants/:id`, async ({ params }) => {
    await delay(250);
    const r = db.restaurants.find((x) => x.restaurant_id === Number(params.id));
    if (!r) return err(404, "가게를 찾지 못했어요");
    const body: RestaurantDetail = { ...r, menus: db.menus.filter((m) => m.restaurant_id === r.restaurant_id) };
    return HttpResponse.json(body);
  }),

  // C3 배송지 목록
  http.get(`${base}/customers/me/addresses`, async ({ request }) => {
    await delay(200);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    return HttpResponse.json(db.addresses.filter((a) => a.customer_id === user.id));
  }),

  // C4 배송지 등록
  http.post(`${base}/customers/me/addresses`, async ({ request }) => {
    await delay(300);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const body = (await request.json()) as AddressBody;
    if (!body.address?.trim()) return err(400, "주소를 입력해 주세요");
    const row = {
      address_id: seq(db.addresses, "address_id"),
      customer_id: user.id,
      address: body.address.trim(),
      address_detail: body.address_detail?.trim() || null,
    };
    db.addresses.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),

  // C5 배송지 수정
  http.patch(`${base}/customers/me/addresses/:id`, async ({ params, request }) => {
    await delay(300);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const row = db.addresses.find((a) => a.address_id === Number(params.id));
    if (!row) return err(404, "배송지를 찾지 못했어요");
    if (row.customer_id !== user.id) return err(403, "내 배송지만 바꿀 수 있어요");
    const body = (await request.json()) as AddressBody;
    row.address = body.address.trim();
    row.address_detail = body.address_detail?.trim() || null;
    return HttpResponse.json(row);
  }),

  // C6 배송지 삭제 — 주문에 쓴 배송지는 409
  http.delete(`${base}/customers/me/addresses/:id`, async ({ params, request }) => {
    await delay(300);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const id = Number(params.id);
    const row = db.addresses.find((a) => a.address_id === id);
    if (!row) return err(404, "배송지를 찾지 못했어요");
    if (row.customer_id !== user.id) return err(403, "내 배송지만 지울 수 있어요");
    if (db.orders.some((o) => o.address_id === id)) return err(409, "주문에 사용한 배송지는 삭제할 수 없어요");
    db.addresses.splice(db.addresses.indexOf(row), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // C9 주문하기: 토스 승인 → 주문·주문상세·결제를 한 번에 저장
  http.post(`${base}/orders`, async ({ request }) => {
    await delay(900);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const body = (await request.json()) as CreateOrderBody;

    // 같은 결제로 두 번 요청하면(성공 페이지 새로고침 등) 이미 만든 주문을 돌려준다
    const existing = db.payments.find((p) => p.toss_order_id === body.toss_order_id);
    if (existing) {
      const o = db.orders.find((x) => x.order_id === existing.order_id)!;
      const result: CreateOrderResult = {
        order_id: o.order_id,
        status: o.status,
        total_amount: o.total_amount,
        delivery_fee: o.delivery_fee,
        payment: { amount: existing.amount, status: existing.status, method: existing.method },
      };
      return HttpResponse.json(result);
    }

    // 토스 승인 전 검사
    const restaurant = db.restaurants.find((r) => r.restaurant_id === body.restaurant_id);
    if (!restaurant) return err(404, "가게를 찾지 못했어요");
    if (restaurant.status !== "영업중") return err(409, "가게가 영업을 마쳤어요. 장바구니를 다시 확인해 주세요.");
    const address = db.addresses.find((a) => a.address_id === body.address_id);
    if (!address || address.customer_id !== user.id) return err(403, "내 배송지로만 주문할 수 있어요");
    if (!body.items?.length) return err(400, "담은 메뉴가 없어요");

    const lines = [];
    for (const it of body.items) {
      const menu = db.menus.find((m) => m.menu_id === it.menu_id);
      if (!menu || menu.restaurant_id !== restaurant.restaurant_id) return err(400, "다른 가게 메뉴가 섞여 있어요");
      if (menu.is_sold_out) return err(409, `${menu.name}이(가) 품절됐어요. 장바구니에서 빼 주세요.`);
      if (it.quantity < 1) return err(400, "수량은 1개 이상이어야 해요");
      lines.push({ menu, quantity: it.quantity });
    }
    const total = lines.reduce((s, l) => s + l.menu.price * l.quantity, 0);
    const amount = total + restaurant.delivery_fee;
    if (amount !== body.amount) {
      return err(400, "결제 금액이 주문 금액과 달라요. 장바구니를 다시 확인해 주세요.");
    }

    // 토스 승인
    //  - 테스트 결제창(paymentKey가 mock_로 시작): 가짜 승인. mock_fail이면 승인 실패
    //  - 진짜 토스 결제창: 백엔드 대신 Next 라우트(/api/toss/confirm)가 토스 승인 API를 부른다
    let approved: boolean;
    let method: "카드" | "간편결제";
    let failMessage = "카드사에서 결제를 승인하지 않았어요. 다른 결제수단으로 다시 시도해 주세요.";
    if (body.paymentKey.startsWith("mock_")) {
      approved = !body.paymentKey.startsWith("mock_fail");
      method = body.paymentKey.startsWith("mock_easy") ? "간편결제" : "카드";
    } else {
      const res = await fetch("/api/toss/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey: body.paymentKey, orderId: body.toss_order_id, amount }),
      });
      const toss = (await res.json()) as { method?: string; message?: string };
      approved = res.ok;
      method = toss.method === "간편결제" ? "간편결제" : "카드";
      if (!res.ok && toss.message) failMessage = toss.message;
    }

    const order: Order = {
      order_id: seq(db.orders, "order_id"),
      customer_id: user.id,
      restaurant_id: restaurant.restaurant_id,
      ordered_time: new Date().toISOString(),
      status: approved ? "접수대기" : "결제실패",
      address_id: address.address_id,
      order_address: [address.address, address.address_detail].filter(Boolean).join(" "),
      total_amount: total,
      delivery_fee: restaurant.delivery_fee,
    };
    db.orders.push(order);
    for (const l of lines) {
      db.orderItems.push({
        order_item_id: seq(db.orderItems, "order_item_id"),
        order_id: order.order_id,
        menu_id: l.menu.menu_id,
        quantity: l.quantity,
        unit_price: l.menu.price,
      });
    }
    db.payments.push({
      payment_id: seq(db.payments, "payment_id"),
      order_id: order.order_id,
      method,
      amount,
      status: approved ? "완료" : "실패",
      canceled_at: null,
      payment_key: body.paymentKey,
      toss_order_id: body.toss_order_id,
    });

    if (!approved) {
      return err(402, failMessage);
    }
    trackOrder(order);
    const result: CreateOrderResult = {
      order_id: order.order_id,
      status: order.status,
      total_amount: total,
      delivery_fee: order.delivery_fee,
      payment: { amount, status: "완료", method },
    };
    return HttpResponse.json(result, { status: 201 });
  }),

  // C10 내 주문 목록 (최신순, 결제실패 주문은 빼고)
  http.get(`${base}/customers/me/orders`, async ({ request }) => {
    await delay(250);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const rows: CustomerOrderSummary[] = db.orders
      .filter((o) => o.customer_id === user.id && o.status !== "결제실패")
      .sort((a, b) => b.ordered_time.localeCompare(a.ordered_time))
      .map((o) => {
        const d = toDetail(o);
        return {
          order_id: o.order_id,
          restaurant_name: d.restaurant_name,
          ordered_time: o.ordered_time,
          status: o.status,
          delivery_status: d.delivery?.status ?? null,
          first_item_name: d.items[0]?.menu_name ?? "",
          item_count: d.items.length,
          payment_amount: d.payment.amount,
        };
      });
    return HttpResponse.json(rows);
  }),

  // C11 주문 상세
  http.get(`${base}/orders/:id`, async ({ params, request }) => {
    await delay(250);
    const user = requireRole(request, "customer");
    if (user instanceof Response) return user;
    const order = db.orders.find((o) => o.order_id === Number(params.id));
    if (!order) return err(404, "주문을 찾지 못했어요");
    if (order.customer_id !== user.id) return err(403, "내 주문만 볼 수 있어요");
    return HttpResponse.json(toDetail(order));
  }),
];
