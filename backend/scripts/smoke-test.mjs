// 전체 흐름 점검 스크립트: 가입 → 가게·메뉴 → 주문·결제 → 조리 → 배달 → 정산
// 사용: 서버를 켠 뒤  node scripts/smoke-test.mjs
//   API_URL (기본 http://localhost:4000/api), ADMIN_KEY (정산 수동 생성 테스트용, 없으면 정산 단계 건너뜀)
const BASE = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN_KEY = process.env.ADMIN_KEY;
const tag = Date.now().toString(36);
let pass = 0;
let fail = 0;

async function call(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✔ ${name}`); }
  else { fail++; console.log(`  ✘ ${name}`, detail !== undefined ? JSON.stringify(detail) : ''); }
}
const expect = (name, r, status, extra = () => true) =>
  check(`${name} → ${status}`, r.status === status && extra(r.body), r);

const KST_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/;

console.log(`\n[0] 서버 확인 ${BASE}`);
expect('health', await call('GET', '/health'), 200, (b) => b.status === 'ok');

console.log('\n[1] 회원');
const pw = 'Example-password!';
const acc = {
  CUSTOMER: { email: `c_${tag}@example.test`, name: '테스트 고객', phone: '010-0000-0000' },
  OWNER: { email: `o_${tag}@example.test`, name: '테스트 점주', phone: '010-1111-1111' },
  RIDER: { email: `r_${tag}@example.test`, name: '테스트 라이더', phone: '010-0000-0007' },
  RIDER2: { email: `r2_${tag}@example.test`, name: '라이더2', phone: '010-0000-0008' },
};
for (const role of ['CUSTOMER', 'OWNER', 'RIDER']) {
  const r = await call('POST', '/auth/register', { body: { role, password: pw, ...acc[role] } });
  expect(`가입 ${role}`, r, 201, (b) => b.role === role && !('password' in b) && !('passwordHash' in b));
  if (role === 'OWNER') check('점주 응답에 phone 없음', !('phone' in r.body));
  if (role === 'RIDER') check('라이더 최초 status 운행종료', r.body.status === '운행종료');
}
await call('POST', '/auth/register', { body: { role: 'RIDER', password: pw, ...acc.RIDER2 } });
expect('같은 역할 이메일 중복', await call('POST', '/auth/register', { body: { role: 'CUSTOMER', password: pw, ...acc.CUSTOMER } }), 409);
expect('다른 역할은 같은 이메일 가능', await call('POST', '/auth/register', { body: { role: 'RIDER', password: pw, ...acc.CUSTOMER } }), 201);
expect('고객 phone 누락', await call('POST', '/auth/register', { body: { role: 'CUSTOMER', password: pw, email: `x_${tag}@example.test`, name: 'x' } }), 400, (b) => b.message === '가입 정보를 확인해 주세요.');
expect('비밀번호 8자 미만', await call('POST', '/auth/register', { body: { role: 'OWNER', password: 'short', email: `y_${tag}@example.test`, name: 'y' } }), 400);

const tok = {};
for (const role of ['CUSTOMER', 'OWNER', 'RIDER', 'RIDER2']) {
  const r = await call('POST', '/auth/login', { body: { role: role === 'RIDER2' ? 'RIDER' : role, email: acc[role].email, password: pw } });
  if (role !== 'RIDER2') expect(`로그인 ${role}`, r, 200, (b) => b.tokenType === 'Bearer' && KST_ISO.test(b.expiresAt) && b.user.role === role);
  tok[role] = r.body.token;
}
expect('비밀번호 틀림', await call('POST', '/auth/login', { body: { role: 'CUSTOMER', email: acc.CUSTOMER.email, password: 'wrong-password' } }), 401, (b) => b.message === '이메일 또는 비밀번호를 확인해 주세요.');
expect('토큰 없이 /me', await call('GET', '/me'), 401);
expect('내 정보', await call('GET', '/me', { token: tok.CUSTOMER }), 200, (b) => b.email === acc.CUSTOMER.email);
expect('내 정보 수정', await call('PATCH', '/me', { token: tok.CUSTOMER, body: { name: '수정 고객' } }), 200, (b) => b.name === '수정 고객');
expect('수정값 없음', await call('PATCH', '/me', { token: tok.CUSTOMER, body: {} }), 400);
expect('점주는 phone만 보내면 수정값 없음', await call('PATCH', '/me', { token: tok.OWNER, body: { phone: '010' } }), 400);

console.log('\n[2] 음식점·메뉴');
expect('가게 등록 전 내 음식점', await call('GET', '/me/stores', { token: tok.OWNER }), 200, (b) => Array.isArray(b) && b.length === 0);
expect('고객이 가게 등록', await call('POST', '/stores', { token: tok.CUSTOMER, body: { name: 'x', address: 'y' } }), 403);
let r = await call('POST', '/stores', { token: tok.OWNER, body: { name: `홍콩반점 ${tag}`, address: '서울시 성북구 예시로 10', deliveryFee: 3000 } });
expect('가게 등록', r, 201, (b) => b.status === '영업종료' && b.deliveryFee === 3000);
const store = r.body;
expect('가게 중복 등록', await call('POST', '/stores', { token: tok.OWNER, body: { name: 'x', address: 'y' } }), 409);
expect('가게 목록 검색', await call('GET', `/stores?q=${encodeURIComponent(tag)}`), 200, (b) => b.length === 1 && b[0].id === store.id);
expect('가게 상세', await call('GET', `/stores/${store.id}`), 200);
expect('없는 가게', await call('GET', '/stores/999999'), 404, (b) => b.message === '음식점을 찾을 수 없어요.');
r = await call('POST', `/stores/${store.id}/menus`, { token: tok.OWNER, body: { name: '짜장면·탕수육 세트', price: 27000 } });
expect('메뉴 등록', r, 201, (b) => b.storeId === store.id);
const menu1 = r.body;
const menu2 = (await call('POST', `/stores/${store.id}/menus`, { token: tok.OWNER, body: { name: '짬뽕', price: 10000 } })).body;
expect('메뉴 가격 음수', await call('POST', `/stores/${store.id}/menus`, { token: tok.OWNER, body: { name: 'x', price: -1 } }), 400);
expect('메뉴 목록', await call('GET', `/stores/${store.id}/menus`), 200, (b) => b.length === 2 && b[0].id < b[1].id);
expect('메뉴 수정', await call('PATCH', `/stores/${store.id}/menus/${menu2.id}`, { token: tok.OWNER, body: { price: 10000 } }), 200);

console.log('\n[3] 배송지');
r = await call('POST', '/addresses', { token: tok.CUSTOMER, body: { address: '서울시 성북구 예시로 1', detailAddress: '101 호' } });
expect('배송지 등록', r, 201);
const addr = r.body;
expect('배송지 목록', await call('GET', '/addresses', { token: tok.CUSTOMER }), 200, (b) => b.length === 1);
expect('배송지 상세', await call('GET', `/addresses/${addr.id}`, { token: tok.CUSTOMER }), 200);
expect('점주가 배송지 조회', await call('GET', '/addresses', { token: tok.OWNER }), 403);

console.log('\n[4] 주문·결제');
const orderBody = { storeId: store.id, addressId: addr.id, items: [{ menuId: menu1.id, quantity: 1 }], payment: { method: '카드' } };
expect('영업종료 가게 주문', await call('POST', '/orders', { token: tok.CUSTOMER, body: orderBody }), 409, (b) => b.message === '주문할 수 없는 상태예요.');
expect('영업 시작', await call('PATCH', `/stores/${store.id}`, { token: tok.OWNER, body: { status: '영업중' } }), 200, (b) => b.status === '영업중');

r = await call('POST', '/orders', { token: tok.CUSTOMER, body: orderBody, headers: { 'Idempotency-Key': `k-${tag}` } });
expect('주문 생성', r, 201, (b) =>
  b.status === '접수대기' && b.totalAmount === 27000 && b.deliveryFee === 3000 &&
  b.payment.amount === 30000 && b.payment.status === '완료' && b.delivery === null &&
  b.addressSnapshot === '서울시 성북구 예시로 1 101 호' && KST_ISO.test(b.createdAt) &&
  b.items[0].lineTotal === 27000 && b.items[0].menuName === '짜장면·탕수육 세트');
const order1 = r.body;
expect('같은 키·같은 요청 재전송', await call('POST', '/orders', { token: tok.CUSTOMER, body: orderBody, headers: { 'Idempotency-Key': `k-${tag}` } }), 200, (b) => b.id === order1.id);
expect('같은 키·다른 요청', await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, items: [{ menuId: menu2.id, quantity: 1 }] }, headers: { 'Idempotency-Key': `k-${tag}` } }), 409);

r = await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, items: [{ menuId: menu2.id, quantity: 1 }, { menuId: menu2.id, quantity: 1 }] } });
expect('중복 menuId 수량 합치기', r, 201, (b) => b.items.length === 1 && b.items[0].quantity === 2 && b.totalAmount === 20000);
const order2 = r.body;
r = await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, payment: { method: '간편결제', simulateFailure: true } } });
expect('결제실패 저장(시연 옵션)', r, 201, (b) => b.status === '결제실패' && b.payment.status === '실패');
const failedOrder = r.body;
expect('없는 메뉴', await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, items: [{ menuId: 999999, quantity: 1 }] } }), 404);
expect('수량 0', await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, items: [{ menuId: menu1.id, quantity: 0 }] } }), 400);
expect('items 비어 있음', await call('POST', '/orders', { token: tok.CUSTOMER, body: { ...orderBody, items: [] } }), 400);

expect('점주 주문 목록(결제완료만)', await call('GET', '/orders', { token: tok.OWNER }), 200, (b) => b.length === 2 && !b.some((o) => o.id === failedOrder.id) && b[0].id > b[1].id);
expect('고객 주문 목록 필터', await call('GET', '/orders?status=결제실패', { token: tok.CUSTOMER }), 200, (b) => b.length === 1);
expect('잘못된 상태 필터', await call('GET', '/orders?status=abc', { token: tok.CUSTOMER }), 400);
expect('주문 상세', await call('GET', `/orders/${order1.id}`, { token: tok.CUSTOMER }), 200);
expect('관계없는 라이더 주문 상세', await call('GET', `/orders/${order1.id}`, { token: tok.RIDER }), 403);
expect('주문 결제 조회', await call('GET', `/orders/${order1.id}/payments`, { token: tok.OWNER }), 200, (b) => b.length === 1 && b[0].amount === 30000);

console.log('\n[5] 점주 주문 처리');
expect('접수대기 → 조리완료(건너뛰기)', await call('PATCH', `/orders/${order1.id}/status`, { token: tok.OWNER, body: { status: '조리완료' } }), 409);
expect('조리중', await call('PATCH', `/orders/${order1.id}/status`, { token: tok.OWNER, body: { status: '조리중' } }), 200, (b) => b.status === '조리중');
expect('같은 상태 재요청', await call('PATCH', `/orders/${order1.id}/status`, { token: tok.OWNER, body: { status: '조리중' } }), 200);
expect('조리완료', await call('PATCH', `/orders/${order1.id}/status`, { token: tok.OWNER, body: { status: '조리완료' } }), 200);
r = await call('PATCH', `/orders/${order2.id}/status`, { token: tok.OWNER, body: { status: '거절' } });
expect('거절 → 결제 취소완료', r, 200, (b) => b.status === '거절' && b.payment.status === '취소완료' && KST_ISO.test(b.payment.canceledAt));
expect('결제실패 주문 상태변경', await call('PATCH', `/orders/${failedOrder.id}/status`, { token: tok.OWNER, body: { status: '조리중' } }), 409);
expect('결제 목록(고객)', await call('GET', '/payments', { token: tok.CUSTOMER }), 200, (b) => b.length === 3 && b[0].id > b[1].id);
expect('결제 상세', await call('GET', `/payments/${order1.payment.id}`, { token: tok.CUSTOMER }), 200);
expect('라이더 결제 목록', await call('GET', '/payments', { token: tok.RIDER }), 403);

console.log('\n[6] 라이더 배달');
expect('배달 수락 전 배달 조회', await call('GET', `/orders/${order1.id}/delivery`, { token: tok.CUSTOMER }), 404);
expect('수락 가능한 주문', await call('GET', '/deliveries/available', { token: tok.RIDER }), 200, (b) => b.some((x) => x.orderId === order1.id && x.deliveryFee === 3000 && !('addressSnapshot' in x)));
expect('운행종료 상태로 수락', await call('POST', `/orders/${order1.id}/delivery/accept`, { token: tok.RIDER, body: {} }), 409);
expect('운행가능으로', await call('PATCH', '/riders/me/status', { token: tok.RIDER, body: { status: '운행가능' } }), 200, (b) => b.status === '운행가능' && b.role === 'RIDER');
await call('PATCH', '/riders/me/status', { token: tok.RIDER2, body: { status: '운행가능' } });
expect('배달중으로 직접 변경 불가', await call('PATCH', '/riders/me/status', { token: tok.RIDER, body: { status: '배달중' } }), 400);

// 동시 수락: 둘 중 하나만 성공
const [a1, a2] = await Promise.all([
  call('POST', `/orders/${order1.id}/delivery/accept`, { token: tok.RIDER, body: {} }),
  call('POST', `/orders/${order1.id}/delivery/accept`, { token: tok.RIDER2, body: {} }),
]);
check('동시 수락 → 한 명만 201, 다른 한 명 409', [a1.status, a2.status].sort().join() === '201,409', [a1, a2]);
const winner = a1.status === 201 ? 'RIDER' : 'RIDER2';
const loser = winner === 'RIDER' ? 'RIDER2' : 'RIDER';
const delivery = (a1.status === 201 ? a1 : a2).body;
check('배달 응답 형식', delivery.status === '배정완료' && delivery.addressSnapshot === order1.addressSnapshot && delivery.pickupAddress === store.address && delivery.completedAt === null, delivery);
expect('같은 라이더 재수락', await call('POST', `/orders/${order1.id}/delivery/accept`, { token: tok[winner], body: {} }), 200, (b) => b.id === delivery.id);
expect('배달 중 운행종료', await call('PATCH', '/riders/me/status', { token: tok[winner], body: { status: '운행종료' } }), 409);
expect('수락 가능 목록에서 빠짐', await call('GET', '/deliveries/available', { token: tok[loser] }), 200, (b) => !b.some((x) => x.orderId === order1.id));
expect('다른 라이더가 상태 변경', await call('PATCH', `/deliveries/${delivery.id}/status`, { token: tok[loser], body: { status: '픽업완료' } }), 403);
expect('배달완료로 건너뛰기', await call('PATCH', `/deliveries/${delivery.id}/status`, { token: tok[winner], body: { status: '배달완료' } }), 409);
for (const s of ['픽업완료', '배달중']) {
  expect(s, await call('PATCH', `/deliveries/${delivery.id}/status`, { token: tok[winner], body: { status: s } }), 200, (b) => b.status === s);
}
expect('같은 상태 재요청', await call('PATCH', `/deliveries/${delivery.id}/status`, { token: tok[winner], body: { status: '배달중' } }), 200);
expect('배달완료', await call('PATCH', `/deliveries/${delivery.id}/status`, { token: tok[winner], body: { status: '배달완료' } }), 200, (b) => KST_ISO.test(b.completedAt));
expect('라이더 운행가능 복귀', await call('GET', '/me', { token: tok[winner] }), 200, (b) => b.status === '운행가능');
expect('상태이력 4개(재요청 중복 없음)', await call('GET', `/deliveries/${delivery.id}/history`, { token: tok.CUSTOMER }), 200, (b) => b.map((h) => h.status).join() === '배정완료,픽업완료,배달중,배달완료');
expect('주문 상세에 delivery 포함·주문상태 조리완료 유지', await call('GET', `/orders/${order1.id}`, { token: tok.CUSTOMER }), 200, (b) => b.delivery?.status === '배달완료' && b.status === '조리완료');
expect('주문 배달 조회', await call('GET', `/orders/${order1.id}/delivery`, { token: tok.OWNER }), 200);
expect('배달 목록(점주)', await call('GET', '/deliveries', { token: tok.OWNER }), 200, (b) => b.length === 1);
expect('배달 상세(다른 라이더)', await call('GET', `/deliveries/${delivery.id}`, { token: tok[loser] }), 403);
expect('라이더 주문 목록', await call('GET', '/orders', { token: tok[winner] }), 200, (b) => b.length === 1 && b[0].id === order1.id);
expect('주문에 쓴 배송지 삭제', await call('DELETE', `/addresses/${addr.id}`, { token: tok.CUSTOMER }), 409, (b) => b.message === '주문에 사용된 배송지는 삭제할 수 없어요.');
const tmpAddr = (await call('POST', '/addresses', { token: tok.CUSTOMER, body: { address: '임시', detailAddress: '1층' } })).body;
expect('배송지 수정(null로 비우기)', await call('PATCH', `/addresses/${tmpAddr.id}`, { token: tok.CUSTOMER, body: { detailAddress: null } }), 200, (b) => b.detailAddress === null);
expect('배송지 삭제', await call('DELETE', `/addresses/${tmpAddr.id}`, { token: tok.CUSTOMER }), 204);

console.log('\n[7] 정산');
expect('월요일 아닌 startDate', await call('GET', '/settlements?startDate=2026-11-17', { token: tok.OWNER }), 400, (b) => b.message === '정산시작일은 월요일 날짜로 입력해 주세요.');
expect('고객 정산 조회', await call('GET', '/settlements', { token: tok.CUSTOMER }), 403);
if (ADMIN_KEY) {
  const now = new Date(Date.now() + 9 * 3600e3);
  const day = now.getUTCDay();
  now.setUTCDate(now.getUTCDate() + (day === 0 ? -6 : 1 - day));
  const monday = now.toISOString().slice(0, 10);
  expect('관리 키 틀림', await call('POST', '/admin/settlements/generate', { body: { startDate: monday }, headers: { 'X-Admin-Key': 'nope' } }), 403);
  expect(`이번 주(${monday}) 정산 생성`, await call('POST', '/admin/settlements/generate', { body: { startDate: monday }, headers: { 'X-Admin-Key': ADMIN_KEY } }), 200, (b) => b.created >= 2);
  expect('다시 생성해도 중복 없음', await call('POST', '/admin/settlements/generate', { body: { startDate: monday }, headers: { 'X-Admin-Key': ADMIN_KEY } }), 200, (b) => b.created === 0);
  r = await call('GET', `/settlements?startDate=${monday}`, { token: tok.OWNER });
  expect('점주 정산', r, 200, (b) => b.length === 1 && b[0].amount === 27000 && b[0].riderId === null && b[0].status === '생성완료');
  const sid = r.body[0].id;
  expect('정산 상세', await call('GET', `/settlements/${sid}`, { token: tok.OWNER }), 200, (b) => b.items.length === 1 && b.items[0].payTarget === '음식점' && b.items[0].orderId === order1.id);
  expect('다른 사람 정산 상세', await call('GET', `/settlements/${sid}`, { token: tok[winner] }), 403);
  expect('라이더 정산', await call('GET', `/settlements?startDate=${monday}`, { token: tok[winner] }), 200, (b) => b.length === 1 && b[0].amount === 3000 && b[0].storeId === null);
  expect('지급완료 처리', await call('POST', '/admin/settlements/pay', { body: { startDate: monday }, headers: { 'X-Admin-Key': ADMIN_KEY } }), 200);
  expect('지급완료 반영', await call('GET', `/settlements/${sid}`, { token: tok.OWNER }), 200, (b) => b.status === '지급완료');
} else {
  console.log('  (ADMIN_KEY 없음 → 정산 생성 테스트 건너뜀)');
}

console.log('\n[8] 로그아웃');
expect('로그아웃', await call('POST', '/auth/logout', { token: tok.CUSTOMER }), 204);
expect('로그아웃한 토큰', await call('GET', '/me', { token: tok.CUSTOMER }), 401);
expect('없는 경로', await call('GET', '/nope'), 404, (b) => typeof b.message === 'string');

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
