# 3조 배달앱 백엔드 (NestJS)

`api명세서 초안` 36개 API를 그대로 구현했고, DB는 `배달플랫폼_테이블정의서` + `확인사항.txt` 규칙을 따릅니다.

- NestJS 11 · TypeORM · MySQL 8.0.16 이상
- 인증: 로그인 응답 `token`을 `Authorization: Bearer <token>`으로 보냄 (JWT)
- 요청·응답 JSON 필드는 camelCase, DB 컬럼은 정의서 그대로 snake_case
- 오류는 항상 `{ "message": "..." }` (400 입력 · 401 로그인 · 403 권한 · 404 없음 · 409 상태 충돌 · 500 서버)

## 실행

```bash
npm install
cp .env.example .env            # DB 비밀번호, JWT_SECRET 채우기

# DB 만들기 (MySQL 8.0.16+)
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql     # (선택) 테스트 계정·가게

npm run start:dev               # http://localhost:4000/api  → Swagger 문서 (상태 확인: /api/health)
```

프론트(Next.js)는 `.env.local`에서 `NEXT_PUBLIC_API_MOCKING=disabled`, `NEXT_PUBLIC_API_URL=http://localhost:4000` 으로 바꾸면 됩니다.
CORS는 기본 `http://localhost:3000` 허용 (`CORS_ORIGIN`으로 변경).

> 명세 예시 주소는 `localhost:3000`인데, 프론트가 3000을 쓰므로 백엔드는 **4000**을 기본값으로 했습니다.

### Swagger 문서

`http://localhost:4000/api` 에서 명세서 번호별로 묶인 API 문서를 볼 수 있고, 바로 호출해 볼 수도 있어요.

1. `1 회원` → `POST /api/auth/login` 실행 (시드 계정 사용)
2. 응답의 `token` 복사 → 오른쪽 위 **Authorize** 에 붙여넣기
3. 보호된 API 호출 (새로고침해도 토큰 유지)

OpenAPI JSON은 `http://localhost:4000/api-json` 이에요.

### 시드 계정 (비밀번호 모두 `test1234`)

| 역할 | 이메일 | 상태 |
|---|---|---|
| 고객 | customer@test.com | 배송지 1개 |
| 점주 | owner@test.com | 김밥천국 광교점(영업중, 배달비 3,000) · 메뉴 3개 |
| 점주 | newowner@test.com | 가게 없음 |
| 라이더 | rider@test.com | 운행종료 |

### 전체 흐름 테스트

서버를 켠 상태에서:

```bash
ADMIN_KEY=<.env의 ADMIN_KEY> node scripts/smoke-test.mjs
```

가입 → 가게·메뉴 → 주문·결제(재전송 키, 결제실패, 거절) → 조리 → 동시 수락 → 배달 → 정산 → 로그아웃까지 99개 항목을 확인합니다.
매번 새 이메일로 가입하므로 여러 번 돌려도 됩니다.

## API 목록

| # | 메서드·경로 | 권한 |
|---|---|---|
| 01 | `POST /api/auth/register` | 공개 |
| 02 | `POST /api/auth/login` | 공개 |
| 03 | `POST /api/auth/logout` | 로그인 |
| 04 | `GET /api/me` | 로그인 |
| 05 | `PATCH /api/me` | 로그인 |
| 06–10 | `GET·POST /api/addresses`, `GET·PATCH·DELETE /api/addresses/{id}` | 고객 |
| 11 | `GET /api/stores?q=` | 공개 |
| 12 | `GET /api/stores/{storeId}` | 공개 |
| 13 | `GET /api/me/stores` | 점주 |
| 14 | `POST /api/stores` | 점주 |
| 15 | `PATCH /api/stores/{storeId}` | 해당 점주 |
| 16 | `GET /api/stores/{storeId}/menus` | 공개 |
| 17 | `POST /api/stores/{storeId}/menus` | 해당 점주 |
| 18 | `PATCH /api/stores/{storeId}/menus/{menuId}` | 해당 점주 |
| 19 | `POST /api/orders` (+ `Idempotency-Key`) | 고객 |
| 20 | `GET /api/orders?status=` | 관련 고객·점주·라이더 |
| 21 | `GET /api/orders/{orderId}` | 관련 고객·점주·라이더 |
| 22 | `PATCH /api/orders/{orderId}/status` | 해당 점주 |
| 23 | `GET /api/orders/{orderId}/payments` | 해당 고객·점주 |
| 24 | `GET /api/payments` | 고객·점주 |
| 25 | `GET /api/payments/{paymentId}` | 해당 고객·점주 |
| 26 | `PATCH /api/riders/me/status` | 라이더 |
| 27 | `GET /api/deliveries/available` | 라이더 |
| 28 | `POST /api/orders/{orderId}/delivery/accept` | 라이더 |
| 29 | `GET /api/orders/{orderId}/delivery` | 관련 고객·점주·라이더 |
| 30 | `GET /api/deliveries` | 관련 고객·점주·라이더 |
| 31 | `GET /api/deliveries/{deliveryId}` | 관련 고객·점주·라이더 |
| 32 | `GET /api/deliveries/{deliveryId}/history` | 관련 고객·점주·라이더 |
| 33 | `PATCH /api/deliveries/{deliveryId}/status` | 배정된 라이더 |
| 34 | `GET /api/settlements?startDate=` | 점주·라이더 |
| 35 | `GET /api/settlements/{settlementId}` | 해당 점주·라이더 |
| 36 | `GET /api/health` | 공개 |

## 명세에 없어서 정한 것 (팀 확인 필요)

| 항목 | 이렇게 했어요 | 이유 |
|---|---|---|
| 결제실패 재현 | 주문 요청 `payment.simulateFailure: true` 면 결제실패로 저장 (안 보내면 성공) | 외부 결제 연동이 없어 실패를 만들 방법이 없음 |
| 정산 수동 실행 | `POST /api/admin/settlements/generate`, `POST /api/admin/settlements/pay` (헤더 `X-Admin-Key`, body `{ "startDate": "월요일" }` 생략 시 지난주) | 매주 월요일 00:05 자동 생성은 있지만, 영상 찍는 날 바로 보여 주려면 필요. `ADMIN_KEY`를 비우면 꺼짐(404) |
| 지급완료 시점 | 자동 처리 없음 → 위 `pay` API로 처리 | 팀에서 아직 안 정함 |
| 경로 ID 형식 오류 | `/api/orders/abc` 같은 요청 → 400 `요청 경로의 ID를 확인해 주세요.` | |
| 남의 데이터 접근 | 있는 데이터인데 본인 것이 아니면 403, 없으면 404 | 명세 "소유 권한 오류는 403" |
| 로그아웃 | 토큰 목록을 서버 메모리에 보관 | 서버 재시작 시 초기화 (과제 범위에서 충분) |
| Idempotency-Key 기록 | 서버 메모리에 보관 | 위와 같음 |
| 주문시주소 | `배송주소 + " " + 상세주소` | 명세 예시 `"서울시 성북구 예시로 1 101 호"` |

## 구조

```
src/
  main.ts                   /api 접두사, 오류 형식, CORS
  app.module.ts             DB 연결 (timezone +09:00)
  common/                   상태값 상수, 시간(KST ISO) 변환, 오류 필터, 검증 파이프, 응답 모양
  entities/                 테이블 13개
  auth/                     01–03, JWT 가드(@Public, @Roles)
  users/                    04·05·26
  addresses/                06–10
  stores/                   11–18
  orders/                   19–23
  payments/                 24·25
  deliveries/               27–33
  settlements/              34·35 + 주간 정산 생성(크론)
  shared/                   주문·배달 응답 조립, 관련자 권한 확인
database/
  schema.sql                CHECK·UNIQUE 포함 DDL
  seed.sql                  테스트 계정
scripts/smoke-test.mjs      전체 흐름 테스트
```
