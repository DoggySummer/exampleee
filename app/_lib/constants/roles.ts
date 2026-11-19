/**
 * 역할별 설정. 로그인·회원가입 화면과 proxy.ts가 같이 쓴다.
 * proxy.ts에서도 import하므로 브라우저 전용 코드를 넣지 않는다.
 */
export type Role = "customer" | "owner" | "rider";

export const ROLES: Role[] = ["customer", "owner", "rider"];

export const ROLE_CONFIG = {
  customer: {
    label: "손님",
    /** 상단에 붙는 역할 라벨. 손님은 붙이지 않음 */
    badge: null,
    /** API 경로: /api/customers/login */
    apiSegment: "customers",
    home: "/",
    loginPath: "/login",
    signupPath: "/signup",
    loginLead: "주문하려면 로그인해 주세요.",
    signupTitle: "회원가입",
    signupLead: "가입하면 바로 주문할 수 있어요.",
  },
  owner: {
    label: "사장님",
    badge: "사장님",
    apiSegment: "owners",
    home: "/owner",
    loginPath: "/owner/login",
    signupPath: "/owner/signup",
    loginLead: "가게 주문을 받으려면 로그인해 주세요.",
    signupTitle: "사장님 회원가입",
    signupLead: "가입한 뒤 가게를 등록하면 영업을 시작할 수 있어요.",
  },
  rider: {
    label: "라이더",
    badge: "라이더",
    apiSegment: "riders",
    home: "/rider",
    loginPath: "/rider/login",
    signupPath: "/rider/signup",
    loginLead: "배달을 시작하려면 로그인해 주세요.",
    signupTitle: "라이더 회원가입",
    signupLead: "가입한 뒤 출근하면 배달할 주문이 보여요.",
  },
} as const satisfies Record<Role, unknown>;

/**
 * 로그인 토큰을 담는 쿠키 이름.
 * 토큰은 API 응답 본문으로 받아 Authorization: Bearer 헤더로 보낸다 (API 명세서 02).
 * 쿠키에도 넣어 두는 이유는 proxy.ts(서버)가 페이지 접근을 막을 때 읽기 위해서다.
 */
export const TOKEN_COOKIE = "token";
/** 로그인한 역할 (proxy.ts가 역할별 화면을 나눌 때 읽음) */
export const ROLE_COOKIE = "role";

/** API 명세서의 역할 값 */
export const API_ROLE = { customer: "CUSTOMER", owner: "OWNER", rider: "RIDER" } as const satisfies Record<Role, string>;
export type ApiRole = (typeof API_ROLE)[Role];

export function fromApiRole(r: string): Role | null {
  const found = (Object.entries(API_ROLE) as [Role, string][]).find(([, v]) => v === r);
  return found ? found[0] : null;
}
