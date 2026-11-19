import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import type { MenuBody, OwnerOrder, RestaurantBody, SettlementDetail } from "@/app/_lib/types/api";
import type { Order, Restaurant } from "@/app/_lib/types/db";
import { db, seq } from "../data";
import { advance, trackCooked } from "../progress";
import { readTokenUser, requireRole } from "../session";

const base = `${API_URL}/api`;
const err = (status: number, message: string) => HttpResponse.json({ message }, { status });

/** 토큰의 점주 → 그 점주의 가게 (토큰을 만든 뒤 가게를 등록했을 수 있어서 DB에서 찾는다) */
function myRestaurant(ownerId: number) {
  const user = db.users.find((u) => u.role === "owner" && u.id === ownerId);
  return db.restaurants.find((r) => r.restaurant_id === user?.restaurant_id);
}

function ownerContext(): { restaurant: Restaurant } | Response {
  const user = requireRole("owner");
  if (user instanceof Response) return user;
  const restaurant = myRestaurant(user.id);
  if (!restaurant) return err(404, "등록한 가게가 없어요");
  return { restaurant };
}

function toOwnerOrder(o: Order): OwnerOrder {
  advance(o);
  const customer = db.users.find((u) => u.role === "customer" && u.id === o.customer_id);
  const d = db.deliveries.find((x) => x.order_id === o.order_id);
  const rider = d && db.users.find((u) => u.role === "rider" && u.id === d.rider_id);
  return {
    order_id: o.order_id,
    ordered_time: o.ordered_time,
    status: o.status,
    order_address: o.order_address,
    total_amount: o.total_amount,
    delivery_fee: o.delivery_fee,
    customer_name: customer?.name ?? "손님",
    customer_phone: customer?.phone ?? "",
    items: db.orderItems
      .filter((i) => i.order_id === o.order_id)
      .map((i) => ({ menu_name: db.menus.find((m) => m.menu_id === i.menu_id)?.name ?? "", quantity: i.quantity })),
    delivery: d ? { status: d.status, rider_name: rider?.name ?? "라이더" } : null,
  };
}

/* ───── 데모: 사장님 화면을 켜 두면 손님 이수아가 주문을 넣는다 (알림음·팝업 확인용) ───── */
const DEMO_FIRST_SEC = 25;
const DEMO_EVERY_SEC = 60;
let demoStartedAt: number | null = null;
let demoCount = 0;

function maybeDemoOrder(restaurant: Restaurant) {
  if (restaurant.restaurant_id !== 1 || restaurant.status !== "영업중") return;
  demoStartedAt ??= Date.now();
  const due = Math.floor(((Date.now() - demoStartedAt) / 1000 - DEMO_FIRST_SEC) / DEMO_EVERY_SEC) + 1;
  if (due <= demoCount || demoCount >= 3) return;
  demoCount++;
  const picks = db.menus.filter((m) => m.restaurant_id === 1 && !m.is_sold_out);
  const lines = [picks[demoCount % picks.length], picks[(demoCount + 2) % picks.length]].map((menu, i) => ({ menu, q: i + 1 }));
  const total = lines.reduce((s, l) => s + l.menu.price * l.q, 0);
  const order: Order = {
    order_id: seq(db.orders, "order_id"),
    customer_id: 2,
    restaurant_id: 1,
    ordered_time: new Date().toISOString(),
    status: "접수대기",
    address_id: 3,
    order_address: "수원시 영통구 광교호수로 277 1102동 903호",
    total_amount: total,
    delivery_fee: restaurant.delivery_fee,
  };
  db.orders.push(order);
  for (const l of lines) {
    db.orderItems.push({ order_item_id: seq(db.orderItems, "order_item_id"), order_id: order.order_id, menu_id: l.menu.menu_id, quantity: l.q, unit_price: l.menu.price });
  }
  db.payments.push({ payment_id: seq(db.payments, "payment_id"), order_id: order.order_id, method: "간편결제", amount: total + restaurant.delivery_fee, status: "완료", canceled_at: null, payment_key: `mock_demo_${order.order_id}`, toss_order_id: `demo-${order.order_id}` });
}

/** 상태를 바꾸기 전 공통 검사 */
function findMyOrder(id: number): { order: Order } | Response {
  const ctx = ownerContext();
  if (ctx instanceof Response) return ctx;
  const order = db.orders.find((o) => o.order_id === id);
  if (!order) return err(404, "주문을 찾지 못했어요");
  if (order.restaurant_id !== ctx.restaurant.restaurant_id) return err(403, "우리 가게 주문만 처리할 수 있어요");
  return { order };
}

const conflict = (order: Order) => err(409, `이미 ${order.status} 상태인 주문이에요. 목록을 새로고침했어요.`);

export const ownerHandlers = [
  // 이미지 업로드 (가게·메뉴 사진). 실제 서버는 uploads/ 폴더에 저장하고 주소를 준다
  http.post(`${base}/uploads`, async ({ request }) => {
    await delay(500);
    if (!readTokenUser()) return err(401, "로그인이 필요해요");
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return err(400, "사진 파일을 골라 주세요");
    if (!["image/jpeg", "image/png"].includes(file.type)) return err(400, "jpg·png 사진만 올릴 수 있어요");
    if (file.size > 5 * 1024 * 1024) return err(400, "5MB 이하 사진만 올릴 수 있어요");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return HttpResponse.json({ url: `data:${file.type};base64,${btoa(bin)}` }, { status: 201 });
  }),

  // O3 내 가게 + 메뉴
  http.get(`${base}/owners/me/restaurant`, async () => {
    await delay(250);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    return HttpResponse.json({ ...ctx.restaurant, menus: db.menus.filter((m) => m.restaurant_id === ctx.restaurant.restaurant_id) });
  }),

  // O4 가게 등록 (점주 1명당 1개, 영업종료로 시작)
  http.post(`${base}/owners/me/restaurant`, async ({ request }) => {
    await delay(500);
    const user = requireRole("owner");
    if (user instanceof Response) return user;
    if (myRestaurant(user.id)) return err(409, "이미 등록한 가게가 있어요");
    const body = (await request.json()) as RestaurantBody;
    if (!body.image_url) return err(400, "대표 사진을 올려 주세요");
    const r: Restaurant = {
      restaurant_id: seq(db.restaurants, "restaurant_id"),
      name: body.name,
      address: body.address,
      status: "영업종료",
      owner_id: user.id,
      delivery_fee: body.delivery_fee,
      image_url: body.image_url,
    };
    db.restaurants.push(r);
    db.users.find((u) => u.role === "owner" && u.id === user.id)!.restaurant_id = r.restaurant_id;
    return HttpResponse.json(r, { status: 201 });
  }),

  // O5 가게 수정 · 영업상태 변경
  http.patch(`${base}/owners/me/restaurant`, async ({ request }) => {
    await delay(300);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    const body = (await request.json()) as Partial<RestaurantBody> & { status?: Restaurant["status"] };
    const r = ctx.restaurant;
    if (body.status === "영업중") {
      const sellable = db.menus.some((m) => m.restaurant_id === r.restaurant_id && !m.is_sold_out);
      if (!sellable) return err(409, "판매할 수 있는 메뉴가 없어요. 메뉴를 1개 이상 등록해 주세요.");
    }
    Object.assign(r, body);
    return HttpResponse.json(r);
  }),

  // O6 메뉴 등록
  http.post(`${base}/owners/me/restaurant/menus`, async ({ request }) => {
    await delay(300);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    const body = (await request.json()) as MenuBody;
    const menu = {
      menu_id: seq(db.menus, "menu_id"),
      restaurant_id: ctx.restaurant.restaurant_id,
      name: body.name,
      price: body.price,
      image_url: body.image_url,
      is_sold_out: false,
    };
    db.menus.push(menu);
    return HttpResponse.json(menu, { status: 201 });
  }),

  // O7 메뉴 수정 · 품절 (삭제는 없음)
  http.patch(`${base}/menus/:id`, async ({ params, request }) => {
    await delay(250);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    const menu = db.menus.find((m) => m.menu_id === Number(params.id));
    if (!menu) return err(404, "메뉴를 찾지 못했어요");
    if (menu.restaurant_id !== ctx.restaurant.restaurant_id) return err(403, "우리 가게 메뉴만 바꿀 수 있어요");
    Object.assign(menu, (await request.json()) as Partial<MenuBody>);
    return HttpResponse.json(menu);
  }),

  // O8 들어온 주문 목록 (결제실패 제외, 최신순)
  http.get(`${base}/owners/me/orders`, async () => {
    await delay(250);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    maybeDemoOrder(ctx.restaurant);
    const rows = db.orders
      .filter((o) => o.restaurant_id === ctx.restaurant.restaurant_id && o.status !== "결제실패")
      .sort((a, b) => b.ordered_time.localeCompare(a.ordered_time))
      .map(toOwnerOrder);
    return HttpResponse.json(rows);
  }),

  // O9 수락: 접수대기 → 조리중
  http.patch(`${base}/orders/:id/accept`, async ({ params }) => {
    await delay(300);
    const r = findMyOrder(Number(params.id));
    if (r instanceof Response) return r;
    if (r.order.status !== "접수대기") return conflict(r.order);
    r.order.status = "조리중";
    return HttpResponse.json(toOwnerOrder(r.order));
  }),

  // O10 거절: 접수대기 → 거절 + 토스 결제 취소 + 결제 취소완료 (한 트랜잭션)
  http.patch(`${base}/orders/:id/reject`, async ({ params }) => {
    await delay(500);
    const r = findMyOrder(Number(params.id));
    if (r instanceof Response) return r;
    if (r.order.status !== "접수대기") return conflict(r.order);
    r.order.status = "거절";
    const pay = db.payments.find((p) => p.order_id === r.order.order_id)!;
    pay.status = "취소완료";
    pay.canceled_at = new Date().toISOString();
    return HttpResponse.json(toOwnerOrder(r.order));
  }),

  // O11 조리완료: 조리중 → 조리완료 (라이더 수락 목록에 뜸)
  http.patch(`${base}/orders/:id/cooked`, async ({ params }) => {
    await delay(300);
    const r = findMyOrder(Number(params.id));
    if (r instanceof Response) return r;
    if (r.order.status !== "조리중") return conflict(r.order);
    r.order.status = "조리완료";
    trackCooked(r.order);
    return HttpResponse.json(toOwnerOrder(r.order));
  }),

  // S2 내 가게 정산 목록
  http.get(`${base}/owners/me/settlements`, async () => {
    await delay(250);
    const ctx = ownerContext();
    if (ctx instanceof Response) return ctx;
    const rows = db.settlements
      .filter((s) => s.restaurant_id === ctx.restaurant.restaurant_id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return HttpResponse.json(rows);
  }),

  // S4 정산 상세 (사장님·라이더 공통, 본인 정산만)
  http.get(`${base}/settlements/:id`, async ({ params }) => {
    await delay(250);
    const user = readTokenUser();
    if (!user) return err(401, "로그인이 필요해요");
    const s = db.settlements.find((x) => x.settlement_id === Number(params.id));
    if (!s) return err(404, "정산을 찾지 못했어요");
    const mine =
      (user.role === "owner" && s.restaurant_id === myRestaurant(user.id)?.restaurant_id) ||
      (user.role === "rider" && s.rider_id === user.id);
    if (!mine) return err(403, "내 정산만 볼 수 있어요");
    const body: SettlementDetail = {
      ...s,
      items: db.settlementItems
        .filter((i) => i.settlement_id === s.settlement_id)
        .map((i) => {
          const d = db.deliveries.find((x) => x.order_id === i.order_id);
          const done = d && db.deliveryHistory.find((h) => h.delivery_id === d.delivery_id && h.status === "배달완료");
          return { ...i, delivered_at: done?.changed_at ?? null };
        }),
    };
    return HttpResponse.json(body);
  }),
];
