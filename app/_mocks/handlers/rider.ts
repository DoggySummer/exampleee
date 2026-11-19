import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import type { DeliveryStatus } from "@/app/_lib/constants/status";
import type { AvailableOrder, RiderDelivery, RiderMe } from "@/app/_lib/types/api";
import type { Delivery, Order } from "@/app/_lib/types/db";
import { db, seq } from "../data";
import { requireRole } from "../session";

const base = `${API_URL}/api`;
const err = (status: number, message: string) => HttpResponse.json({ message }, { status });

const restaurantOf = (o: Order) => db.restaurants.find((r) => r.restaurant_id === o.restaurant_id)!;
const statusOf = (riderId: number) => db.riderStatus[riderId] ?? "운행종료";

function addHistory(delivery_id: number, status: DeliveryStatus) {
  db.deliveryHistory.push({ history_id: seq(db.deliveryHistory, "history_id"), delivery_id, status, changed_at: new Date().toISOString() });
}

function toRiderDelivery(d: Delivery): RiderDelivery {
  const o = db.orders.find((x) => x.order_id === d.order_id)!;
  const r = restaurantOf(o);
  return {
    delivery_id: d.delivery_id,
    order_id: o.order_id,
    status: d.status,
    restaurant_name: r.name,
    restaurant_address: r.address,
    order_address: o.order_address,
    delivery_fee: o.delivery_fee,
    items: db.orderItems
      .filter((i) => i.order_id === o.order_id)
      .map((i) => ({ menu_name: db.menus.find((m) => m.menu_id === i.menu_id)?.name ?? "", quantity: i.quantity })),
    history: db.deliveryHistory
      .filter((h) => h.delivery_id === d.delivery_id)
      .map(({ status, changed_at }) => ({ status, changed_at })),
  };
}

const available = () => db.orders.filter((o) => o.status === "조리완료" && !db.deliveries.some((d) => d.order_id === o.order_id));

/* ───── 데모: 수락할 주문이 없으면 20초 뒤 다른 가게의 조리완료 주문이 생긴다 (최대 3건) ───── */
let emptySince: number | null = null;
let demoCount = 0;
function maybeDemoCooked() {
  if (available().length > 0 || demoCount >= 3) {
    emptySince = null;
    return;
  }
  emptySince ??= Date.now();
  if (Date.now() - emptySince < 20_000) return;
  emptySince = null;
  demoCount++;
  const r = db.restaurants.filter((x) => x.status === "영업중")[demoCount % 4];
  const menus = db.menus.filter((m) => m.restaurant_id === r.restaurant_id && !m.is_sold_out).slice(0, 2);
  const total = menus.reduce((s, m) => s + m.price, 0);
  const order: Order = {
    order_id: seq(db.orders, "order_id"),
    customer_id: 2,
    restaurant_id: r.restaurant_id,
    ordered_time: new Date(Date.now() - 15 * 60_000).toISOString(),
    status: "조리완료",
    address_id: 3,
    order_address: "수원시 영통구 광교호수로 277 1102동 903호",
    total_amount: total,
    delivery_fee: r.delivery_fee,
  };
  db.orders.push(order);
  menus.forEach((m) =>
    db.orderItems.push({ order_item_id: seq(db.orderItems, "order_item_id"), order_id: order.order_id, menu_id: m.menu_id, quantity: 1, unit_price: m.price }),
  );
  db.payments.push({ payment_id: seq(db.payments, "payment_id"), order_id: order.order_id, method: "카드", amount: total + r.delivery_fee, status: "완료", canceled_at: null, payment_key: `mock_demo_${order.order_id}`, toss_order_id: `demo-${order.order_id}` });
}

export const riderHandlers = [
  // R8(추가 요청) 내 라이더 정보·운행상태
  http.get(`${base}/riders/me`, async () => {
    await delay(200);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    const body: RiderMe = { rider_id: user.id, name: user.name, status: statusOf(user.id) };
    return HttpResponse.json(body);
  }),

  // R3 출근·퇴근 (배달 중이면 409)
  http.patch(`${base}/riders/me/status`, async ({ request }) => {
    await delay(300);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    const { status } = (await request.json()) as { status: "운행가능" | "운행종료" };
    if (statusOf(user.id) === "배달중") return err(409, "배달을 마친 뒤 퇴근할 수 있어요");
    db.riderStatus[user.id] = status;
    return HttpResponse.json({ rider_id: user.id, name: user.name, status });
  }),

  // R4 수락 가능한 주문 (조리완료 + 배달 없음, 오래 기다린 주문 먼저)
  http.get(`${base}/deliveries/available`, async () => {
    await delay(250);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    if (statusOf(user.id) === "운행가능") maybeDemoCooked();
    const rows: AvailableOrder[] = available()
      .sort((a, b) => a.ordered_time.localeCompare(b.ordered_time))
      .map((o) => {
        const r = restaurantOf(o);
        return {
          order_id: o.order_id,
          restaurant_name: r.name,
          restaurant_address: r.address,
          order_address: o.order_address,
          delivery_fee: o.delivery_fee,
          ordered_time: o.ordered_time,
          item_count: db.orderItems.filter((i) => i.order_id === o.order_id).reduce((s, i) => s + i.quantity, 0),
        };
      });
    return HttpResponse.json(rows);
  }),

  // R5 배달 수락 (선착순). 배달 생성 + 배정완료 이력 + 라이더 배달중 (한 트랜잭션)
  http.post(`${base}/deliveries`, async ({ request }) => {
    await delay(400);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    const { order_id } = (await request.json()) as { order_id: number };
    const st = statusOf(user.id);
    if (st === "운행종료") return err(409, "출근 후 수락할 수 있어요");
    if (st === "배달중") return err(409, "진행 중인 배달을 먼저 끝내 주세요");
    const o = db.orders.find((x) => x.order_id === order_id);
    if (!o || o.status !== "조리완료") return err(409, "수락할 수 없는 주문이에요. 목록을 새로고침했어요.");
    if (db.deliveries.some((d) => d.order_id === order_id)) {
      return err(409, "이미 다른 라이더가 수락했어요. 목록을 새로고침했어요.");
    }
    const d: Delivery = { delivery_id: seq(db.deliveries, "delivery_id"), order_id, rider_id: user.id, status: "배정완료" };
    db.deliveries.push(d);
    addHistory(d.delivery_id, "배정완료");
    db.riderStatus[user.id] = "배달중";
    return HttpResponse.json(toRiderDelivery(d), { status: 201 });
  }),

  // R6 내 배달 (?active=true 진행 중만)
  http.get(`${base}/riders/me/deliveries`, async ({ request }) => {
    await delay(250);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    const activeOnly = new URL(request.url).searchParams.get("active") === "true";
    const rows = db.deliveries
      .filter((d) => d.rider_id === user.id && (!activeOnly || d.status !== "배달완료"))
      .map(toRiderDelivery)
      .sort((a, b) => (b.history.at(-1)?.changed_at ?? "").localeCompare(a.history.at(-1)?.changed_at ?? ""));
    return HttpResponse.json(rows);
  }),

  // R7 배달 상태 변경 — 바로 다음 단계만.
  // [픽업 완료]는 status: "배달중"으로 보내고, 서버가 픽업완료·배달중 이력 두 개를 한 번에 남긴다
  http.patch(`${base}/deliveries/:id/status`, async ({ params, request }) => {
    await delay(400);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    const d = db.deliveries.find((x) => x.delivery_id === Number(params.id));
    if (!d) return err(404, "배달을 찾지 못했어요");
    if (d.rider_id !== user.id) return err(403, "내 배달만 바꿀 수 있어요");
    const { status } = (await request.json()) as { status: DeliveryStatus };

    if (status === "배달중" && d.status === "배정완료") {
      addHistory(d.delivery_id, "픽업완료");
      addHistory(d.delivery_id, "배달중");
      d.status = "배달중";
    } else if (status === "배달완료" && d.status === "배달중") {
      addHistory(d.delivery_id, "배달완료");
      d.status = "배달완료";
      db.riderStatus[user.id] = "운행가능";
    } else {
      return err(409, `지금은 ${d.status} 상태라 바꿀 수 없어요. 화면을 새로고침했어요.`);
    }
    return HttpResponse.json(toRiderDelivery(d));
  }),

  // S3 내 라이더 정산 목록
  http.get(`${base}/riders/me/settlements`, async () => {
    await delay(250);
    const user = requireRole("rider");
    if (user instanceof Response) return user;
    return HttpResponse.json(
      db.settlements.filter((s) => s.rider_id === user.id).sort((a, b) => b.start_date.localeCompare(a.start_date)),
    );
  }),
];
