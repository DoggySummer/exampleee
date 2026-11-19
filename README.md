# 동네배달(가칭) 프론트엔드 — 3조

손님이 주문하면 사장님이 조리하고, 라이더가 배달하고, 정산까지 이어지는 배달앱의 프론트엔드입니다.
**모든 화면은 모바일 기준**(최대 480px)이고, 영상으로 제출하기 때문에 배포는 하지 않습니다.

- 백엔드(Express + MySQL)는 따로 개발 중 → 그 전까지 **MSW 가짜 API**로 개발
- 기준 문서: `확인사항.txt`(DB 최종 규칙), 테이블 정의서, API 요청서, 화면 시나리오 (2026-11-19 확정)

---

## 실행

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run dev                    # http://localhost:3000
```

브라우저 개발자도구에서 모바일 화면(예: iPhone 14, 390px)으로 보세요.

### 테스트 계정 (MSW, 비밀번호 모두 `test1234`)

| 역할 | 이메일 | 로그인 후 |
|---|---|---|
| 손님 | `customer@test.com` | `/` 가게 목록 |
| 사장님 (가게 있음) | `owner@test.com` | `/owner` 주문 관리 |
| 사장님 (가게 없음) | `newowner@test.com` | `/owner/restaurant/new` 가게 등록 |
| 라이더 | `rider@test.com` | `/rider` 라이더 홈 |

- 회원가입에서 `taken@test.com`을 쓰면 이메일 중복 오류(409)를 볼 수 있어요.
- 가짜 DB는 메모리에 있어서 **새로고침하면 새로 가입한 계정·새 주문은 사라져요.** 로그인 쿠키와 장바구니는 남습니다.

### 손님 데모 (MSW)

- `customer@test.com`에는 예시 주문 3건이 있어요: `#0042` 배달중, `#0041` 거절(결제 취소), `#0040` 배달완료.
- 결제는 **테스트 결제창**(토스 결제창 대신)에서 해요. "카드사 승인 실패로 테스트하기"를 체크하면 승인 실패 화면, [닫기]를 누르면 결제 취소 화면이 나와요.
- 새로 한 주문은 **사장님 화면에서 수락·조리완료**해야 넘어가요. 라이더 화면이 아직 없어서 조리완료 뒤에는 **12초마다 자동으로** 배정 → 배달중 → 배달완료가 돼요. `app/_mocks/progress.ts`의 `AUTO_RIDER`로 끕니다.
- 품절 메뉴: 김밥천국 "돈까스김밥", 하루돈까스 "냉모밀". 영업종료 가게: 할매순대국. 배달비 무료: 바삭치킨.
- 주문에 쓴 배송지(`광교중앙로 145`)를 지우면 409 오류가 나요.
- 가게·메뉴 사진은 `public/mock/`의 임시 그림이에요.

### 사장님 데모 (MSW)

- `owner@test.com`(김밥천국 광교점): 신규 `#0044`, 조리중 `#0045`, 완료 탭에 배달중·배달완료·거절 주문, 정산 2주치가 있어요.
- 주문 관리 화면을 켜 두면 **25초 뒤부터 60초마다 손님 이수아의 새 주문**이 들어와요 (최대 3건) → 알림음 + "새 주문 n건" 팝업 확인용.
  알림음은 브라우저 정책 때문에 화면을 한 번 누른 뒤부터 나요.
- 손님 창과 사장님 창을 같이 띄우면 손님 주문이 10초 안에 사장님 신규 탭에 떠요. **같은 브라우저의 다른 탭은 MSW 메모리를 공유하지 않으니** 시연할 때는 실제 백엔드를 쓰거나, 한 탭 안에서 로그아웃·로그인으로 역할을 바꿔 주세요.
- `newowner@test.com`: 로그인하면 가게 등록 → 메뉴 등록 → 영업 시작 순서를 볼 수 있어요. 메뉴가 없으면 영업을 켤 수 없어요.

### 환경변수 (`.env.local`)

| 이름 | 예시 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Express 서버 주소. API는 `이 주소/api/...`로 호출 |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` / `disabled` | `enabled`면 MSW 가짜 API 사용 |

`NEXT_PUBLIC_` 값을 바꾸면 `npm run dev`를 다시 켜야 합니다.

---

## 기술 스택

| 분류 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 (`@theme` 디자인 토큰) |
| 서버 상태 | TanStack Query 5 |
| 클라이언트 상태 | Zustand 5 (장바구니 등) |
| 폼 | react-hook-form + zod |
| HTTP | axios (`withCredentials: true`) |
| 가짜 API | MSW 3 (옵션 이름 `onUnhandledFrame`) |
| 아이콘 | react-icons — **Lucide 세트(`react-icons/lu`)만** |
| 글꼴 | Wanted Sans Variable (`next/font/local`) |
| 인증 | JWT를 httpOnly 쿠키로, 페이지 접근은 `proxy.ts` |

---

## 화면 (25개)

✅ 구현 / ⬜ 자리만 있음 (`PagePlaceholder`에 화면 시나리오 요약이 적혀 있음)

**손님 (10)** — 하단 탭: 홈 · 주문내역 · 내 정보

| | 주소 | 화면 |
|---|---|---|
| ✅ | `/login` · `/signup` | 로그인 · 회원가입 (하단에 사장님·라이더 링크) |
| ✅ | `/` | 가게 목록 (로그인 없이 볼 수 있음, 로그인하면 배달 주소 배너·장바구니 버튼) |
| ✅ | `/restaurants/[id]` | 가게 상세 + 메뉴 + 장바구니 담기 (품절·영업종료·다른 가게 확인창) |
| ✅ | `/cart` | 장바구니 · 배송지 선택·등록 · 결제하기 (테스트 결제창) |
| ✅ | `/checkout/success` · `/checkout/fail` | 결제 승인·주문 저장 → 주문 상세로 / 취소·실패 안내 |
| ✅ | `/orders` · `/orders/[id]` | 주문 내역 · 주문 상세 (티켓 + 5단계 타임라인, 10초 폴링) |
| ✅ | `/my/addresses` | 배송지 추가·수정·삭제 + 로그아웃 |

**사장님 (8)** — 하단 탭: 주문 · 메뉴 · 정산 · 가게

| | 주소 | 화면 |
|---|---|---|
| ✅ | `/owner/login` · `/owner/signup` | 사장님 로그인 · 회원가입 |
| ✅ | `/owner` | 주문 관리 (신규/조리중/완료 탭, 수락·거절·조리완료, 영업 토글) |
| ✅ | `/owner/restaurant/new` | 가게 등록 (가게가 없을 때, 대표 사진 필수) |
| ✅ | `/owner/restaurant` | 영업 상태 + 가게 정보 수정 + 로그아웃 |
| ✅ | `/owner/menus` | 메뉴 목록·추가·수정·품절 토글 (사진 선택) |
| ✅ | `/owner/settlements` · `/[id]` | 정산 목록 · 상세 (라이더와 같은 컴포넌트) |

**라이더 (7)** — 하단 탭: 홈 · 내 배달 · 정산

| | 주소 | 화면 |
|---|---|---|
| ✅ | `/rider/login` · `/rider/signup` | 라이더 로그인 · 회원가입 |
| ⬜ | `/rider` | 출근 토글 + 수락 가능한 주문 |
| ⬜ | `/rider/deliveries` · `/[id]` | 내 배달 · 배달 상세 ([픽업 완료] → [배달 완료]) |
| ⬜ | `/rider/settlements` · `/[id]` | 정산 목록(+ 로그아웃) · 상세 |

**영상 우선 9개**: `/`, `/restaurants/[id]`, `/cart`, `/checkout/success`, `/orders/[id]`, `/owner`, `/rider`, `/rider/deliveries/[id]`, 로그인

---

## 확정한 결정 (2026-11-19)

**범위**
- 리뷰·쿠폰·메뉴옵션 없음. 가게 검색·정렬 없음. 소셜 로그인 없음.
- 결제는 토스페이먼츠 테스트 결제. 승인은 백엔드가 하고, 승인되면 주문·주문상세·결제를 한 번에 저장 (결제대기 없음).
- 손님 직접 취소 없음. 사장님이 거절하면 결제 자동 취소.
- 정산은 서버가 매주 월요일 자동 생성·지급. 관리자 계정 없음 (시연용 수동 실행만 백엔드에 둠).

**손님**
- 로그인 없이 가게·메뉴를 볼 수 있고, 담기부터 로그인.
- 장바구니는 localStorage에 저장, 한 가게 메뉴만. 기본 배송지는 마지막 주문에 쓴 배송지.
- 주문 상세는 주문상태 + 배달상태를 합쳐 5단계 타임라인으로. 라이더 정보는 보여 주지 않음.
- 가게·메뉴 사진 있음. 품절 메뉴는 회색 + 담기 불가.

**사장님**
- 메뉴 삭제 대신 품절 토글. 판매 가능한 메뉴가 0개면 영업 시작 불가.
- 가게 대표 사진 필수, 메뉴 사진 선택.
- 주문 카드에 손님 이름·전화번호 표시.
- 새 주문: 10초 폴링 + 알림음 + "새 주문 n건" 팝업. 폴링은 `owner/(main)/layout.tsx`에서 (메뉴·정산 화면에서도 알림).
  브라우저는 첫 클릭 전에 소리를 막으므로 영업 토글을 켤 때 소리를 활성화.

**라이더**
- 수락은 확인 창 없이 바로 (선착순). 배달 상세에 손님 정보 없음.
- [픽업 완료] 한 번에 `픽업완료`·`배달중` 이력을 같이 기록 → 버튼은 [픽업 완료] → [배달 완료] 두 번.
- 오늘 건수·수입 표시 없음. 가게 전화번호 없음.

---

## 인증 흐름

1. 로그인 API(`/api/customers|owners|riders/login`)가 성공하면 서버가 `token` 쿠키(httpOnly, SameSite=Lax)를 심음. 응답 본문에는 `role`·`id`·`name`만.
2. 이후 요청은 브라우저가 쿠키를 자동으로 보냄 (`withCredentials: true`).
3. `proxy.ts`가 토큰의 `role`만 읽어서 페이지 접근을 막음. 서명 검증은 Express가 매 요청마다 함.
   - 로그인 안 했거나 다른 역할이면 → 그 역할의 로그인 화면으로, `?next=원래주소`를 붙여서.
   - 로그인·회원가입 화면, `/`, `/restaurants/*`는 누구나 들어감.
4. 로그아웃은 `POST /api/auth/logout` (httpOnly 쿠키는 프론트가 못 지움).

> MSW는 httpOnly 쿠키를 만들 수 없어서 가짜 API에서만 `document.cookie`로 넣습니다. 실제 서버에서는 `Set-Cookie`로 받습니다.

---

## 폴더 구조

`src/` 없이 `app/`에서 해결합니다. `_`로 시작하는 폴더는 라우트가 되지 않습니다.

```
proxy.ts                      # 역할별 접근 제어 (Next.js 16에서 middleware.ts → proxy.ts)
app/
├── _components/              # 공통 컴포넌트
│   ├── auth/                 # LoginForm, SignupForm, FormField, AuthPages
│   ├── AppHeader, BottomTabBar, MobileShell, Button, StatusBadge, RoleBadge, LogoutButton
│   ├── ticket/OrderTicket    # 주문 티켓 (손님·사장님·라이더 공통)
│   ├── Modal, ConfirmDialog, QuantityStepper, PriceSummary, FoodImage, EmptyState, StateViews, FixedBottom
│   ├── PagePlaceholder       # 아직 안 만든 화면의 자리
│   └── tabs.ts               # 역할별 하단 탭 (react-icons/lu)
│   ├── settlement/           # 정산 목록·상세 (사장님·라이더 공통)
│   ├── Toaster, ToggleSwitch
├── _hooks/queries/           # useMe, customer.ts, owner.ts
├── _lib/
│   ├── api/                  # client.ts(axios), authApi.ts
│   ├── auth/                 # token.ts(역할 읽기), schemas.ts(zod)
│   ├── constants/            # status.ts, polling.ts, roles.ts, queryKeys.ts
│   ├── types/                # db.ts(테이블 기준), api.ts
│   └── utils/                # format(금액·시각·주문번호), orderStep(손님 5단계), pendingCheckout
├── _stores/                  # cartStore (zustand + localStorage), toastStore, ownerUiStore
├── _mocks/                   # MSW (data.ts = 가짜 DB, handlers/, progress.ts = 데모 자동 진행)
├── _providers/               # QueryClient, MSW
├── (auth)/login, signup      # 손님 로그인·가입 (탭 없음)
├── (customer)/               # 손님 화면 (URL에 (customer) 안 붙음)
├── owner/login, signup       # 사장님 로그인·가입
├── owner/_components/        # OwnerShell(가게 확인·새 주문 감시), OpenToggle, RestaurantForm, ImagePicker
├── owner/(main)/             # 로그인한 사장님 화면 (하단 탭)
├── rider/login, signup
└── rider/(main)/
```

- 여러 화면이 같이 쓰는 것 → `app/_components`, `app/_lib`
- 한 화면에서만 쓰는 것 → 그 라우트 폴더 안 `_components`

---

## 디자인 규칙

**콘셉트: 주문 티켓.** 같은 주문이 손님(주문서) → 사장님(주방 주문표) → 라이더(배달 전표) 화면에 **같은 모양의 티켓**으로 나타납니다. 큰 주문번호(`#0042`), 절취선(점선 + 양옆 반원 홈), 메뉴·금액. 카드 모양은 주문 티켓에만 쓰고, 나머지 목록은 구분선으로 나눕니다.

### 색 토큰 (`app/globals.css`)

강조색은 **초록 하나**. 세 역할이 같은 앱처럼 보이도록 역할마다 색을 바꾸지 않고, 점주·라이더 화면 제목 앞에 `RoleBadge`("사장님", "라이더")를 붙입니다.

| 클래스 | 값 | 용도 |
|---|---|---|
| `brand` / `brand-press` | `#1F7A55` / `#19654A` | 주요 버튼, 선택된 탭, 진행 상태 |
| `brand-soft` / `brand-ink` | `#E6F2EC` / `#145A3E` | 배지·안내 배경 / 그 위 글자 |
| `ink` / `muted` / `faint` | `#1C2430` / `#7A838C` / `#A7AFB8` | 본문 / 보조 / 비활성·placeholder |
| `paper` / `tray` / `field` | `#FFFFFF` / `#F3F5F4` / `#F5F6F7` | 카드·헤더 / 페이지 배경 / 입력칸·보조 버튼 |
| `line` | `#E3E7E5` | 테두리, 구분선 |
| `danger` / `danger-soft` | `#C8372D` / `#FCEDEC` | 오류, 거절·실패 |

상태는 `<StatusBadge status="접수대기" />`로만 표시합니다. 톤은 세 가지: **active**(초록, 진행·완료) / **waiting**(회색, 누군가를 기다림) / **danger**(빨강, 거절·실패). 색과 글자를 항상 같이 씁니다.

### 글꼴·아이콘·문구

- Wanted Sans 하나. 주문번호·금액은 크고 굵게, `tabular-nums`. 금액은 `27,000원`.
- 아이콘은 `react-icons/lu`만 (예: `LuHouse`, `LuReceiptText`, `LuClipboardList`, `LuBike`). 이모지 아이콘 금지.
- 존댓말은 "~해요"체. 버튼은 동사로: "로그인", "가입하기", "픽업 완료".
- 오류는 무엇이 문제고 무엇을 하면 되는지: "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요."
- 제목 위 영문 대문자 라벨, 그라데이션, 모든 카드에 그림자 금지.

### 모바일 규칙

| 항목 | 규칙 |
|---|---|
| 화면 폭 | `MobileShell`로 최대 480px, 가운데 |
| 높이 | `min-h-dvh` (`h-screen` 금지) |
| 헤더 | 탭 화면: (역할 라벨) + 왼쪽 제목 / 하위 화면: 뒤로가기 + 가운데 제목 |
| 하단 탭 | 탭 화면에서만 보임. 하단 고정 버튼이 있는 하위 화면에서는 자동으로 숨김 |
| 주 버튼 | 화면당 하나, 하단 고정, 높이 54px |
| 터치 영역 | 최소 44px |
| 글자 | 본문 15px, 보조 13px, 12px 미만 금지. 입력칸 16px 이상 (iOS 확대 방지) |
| 안전 영역 | 하단 고정 요소에 `pb-[env(safe-area-inset-bottom)]` |
| 숫자 입력 | `type="number"` 대신 `inputMode="numeric"` |

---

## API

전체 명세는 **API 요청서**(36개)를 따릅니다. 지금 MSW로 만든 것은 인증 6개 + 손님 9개 + 사장님 11개 + 사진 업로드입니다.

| 번호 | 메서드 | 경로 | 비고 |
|---|---|---|---|
| C7 | GET | `/api/restaurants` | 로그인 없이 |
| C8 | GET | `/api/restaurants/:id` | 가게 + `menus[]` (`image_url`, `is_sold_out` 포함) |
| C3·C4 | GET·POST | `/api/customers/me/addresses` | |
| C5·C6 | PATCH·DELETE | `/api/customers/me/addresses/:id` | 주문에 쓴 배송지 삭제는 409 |
| C9 | POST | `/api/orders` | 토스 승인 + 주문 저장. 아래 참고 |
| C10 | GET | `/api/customers/me/orders` | 최신순, 결제실패 제외, `delivery_status` 포함 |
| C11 | GET | `/api/orders/:id` | `items[]`, `payment`, `delivery{status, history[]}` 포함 |
| O3 | GET | `/api/owners/me/restaurant` | 내 가게 + `menus[]`. 가게가 없으면 404 → 가게 등록으로 |
| O4·O5 | POST·PATCH | `/api/owners/me/restaurant` | 등록은 영업종료로 시작. 영업중으로 바꿀 때 판매 가능한 메뉴가 없으면 409 |
| O6 | POST | `/api/owners/me/restaurant/menus` | `{ name, price, image_url }` |
| O7 | PATCH | `/api/menus/:id` | 수정·품절(`is_sold_out`). 삭제 없음 |
| O8 | GET | `/api/owners/me/orders` | 결제실패 제외, `customer_name`·`customer_phone`·`items[]`·`delivery{status, rider_name}` 포함 |
| O9·O10·O11 | PATCH | `/api/orders/:id/accept` · `reject` · `cooked` | 상태가 안 맞으면 409 "이미 ○○ 상태인 주문이에요". 거절은 토스 결제 취소까지 |
| S2 | GET | `/api/owners/me/settlements` | 최신 주 먼저 |
| S4 | GET | `/api/settlements/:id` | `items[]`에 `delivered_at` 포함. 본인 정산만 |
| — | POST | `/api/uploads` | multipart `file` → `{ url }`. 5MB 이하 jpg·png |
| C1·O1·R1 | POST | `/api/{customers\|owners\|riders}/signup` | 이메일 중복 409. 점주는 phone 없음 |
| C2·O2·R2 | POST | `/api/{customers\|owners\|riders}/login` | 토큰은 쿠키로. 점주는 `restaurant_id`(없으면 null) |
| A1 | POST | `/api/auth/logout` | 쿠키 삭제 |
| A2 | GET | `/api/auth/me` | `{ role, id, name }` |

에러 응답은 `{ "message": "..." }` + 상태코드이고, 화면은 `message`를 그대로 보여 줍니다.

### 결제 흐름 (C9)

1. 장바구니에서 [결제하기] → `toss_order_id`(UUID)를 만들고 주문 정보를 sessionStorage에 잠깐 저장
2. 결제창 → 성공하면 `/checkout/success?paymentKey&orderId&amount`, 닫거나 실패하면 `/checkout/fail?code&message`
3. 성공 페이지가 `POST /api/orders { restaurant_id, address_id, items[{menu_id, quantity}], paymentKey, toss_order_id, amount }`
4. 서버: 영업중·품절·배송지·금액(메뉴 합계 + 배달비 = amount) 검사 → 토스 승인 → 주문·주문상세·결제를 한 트랜잭션으로 저장
   - 승인 실패: `결제실패`·`실패`로 저장하고 **402** + 사유
   - 같은 `toss_order_id`로 다시 오면(새로고침) 이미 만든 주문을 그대로 돌려줌
5. 성공하면 장바구니를 비우고 `/orders/:id`로 이동

> **토스 연동 TODO**: 지금은 `cart/_components/MockPaymentSheet.tsx`가 결제창을 흉내 냅니다. 토스 클라이언트 키를 받으면 `CartView.requestPayment()`에서 토스 SDK `requestPayment({ orderId, amount, successUrl, failUrl })`를 부르도록 바꾸면 됩니다. 나머지 흐름(성공·실패 페이지, C9)은 그대로 씁니다.

### 폴링 (`_lib/constants/polling.ts`)

| 화면 | 주기 |
|---|---|
| 사장님 새 주문 감시 | 10초 (+ 알림음·팝업) |
| 라이더 수락 가능한 주문 | 10초 |
| 손님 주문 상세 | 10초, 끝난 주문이면 멈춤 |

---

## 팀에 요청할 것

**DB 담당**
- [ ] payment에 `payment_key`, `toss_order_id` 추가 (토스 결제·취소)
- [ ] restaurant에 `image_url`(필수), menu에 `image_url`(선택) 추가
- [ ] menu에 `is_sold_out`(기본 false) 추가

**API 담당**
- [ ] 로그인 시 JWT를 httpOnly 쿠키로, CORS `origin: http://localhost:3000, credentials: true`
- [ ] 로그아웃·내 정보 API (A1·A2)
- [ ] 토스 승인 후 주문 저장(C9), 거절 시 토스 결제 취소
- [ ] 품절 메뉴 주문 거부, 점주 주문 목록에 손님 이름·전화번호 포함
- [ ] [픽업 완료] 요청 하나로 `픽업완료`·`배달중` 이력 2개를 한 트랜잭션에
- [ ] 정산 자동 생성·지급 스케줄러 + 시연용 수동 실행
- [ ] 이미지 업로드 API `POST /api/uploads` (서버 `uploads/` 폴더 저장, DB엔 주소만)
- [ ] O9~O11은 현재 상태가 맞지 않으면 409 + "이미 ○○ 상태인 주문이에요" (두 창에서 동시에 눌렀을 때)

---

## 컨벤션

**브랜치**: `main` + 작업 브랜치 `타입/범위-내용` (예: `feat/owner-order-board`)

**커밋**: `<타입>(<범위>): <제목>` — 제목은 한글 명사형, 50자 이내

| 타입 | 언제 |
|---|---|
| `feat` | 새 기능·화면 |
| `fix` | 버그 수정 |
| `ui` | 스타일만 |
| `refactor` | 구조만 |
| `mock` | MSW |
| `chore` | 패키지·설정 |
| `docs` | 문서 |

범위: `customer` `owner` `rider` `auth` `common` `api` `mock` `config`

**코드**
- 상태 문자열은 `_lib/constants/status.ts`에서만 가져다 씀 ("접수대기" 직접 타이핑 금지)
- 역할별 경로·문구는 `_lib/constants/roles.ts`의 `ROLE_CONFIG`
- 서버 컴포넌트에서 클라이언트 컴포넌트로 함수(아이콘 컴포넌트 등)를 넘기지 않음 → 이름이나 키만 넘김
- 커밋 전 `npm run lint`, `npm run build` 통과
