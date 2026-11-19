import type { Role } from "@/app/_lib/constants/roles";

/** 에러 응답 형식 (API 요청서 공통 규칙) */
export interface ApiErrorBody {
  message: string;
}

/** 로그인·내 정보 응답. 토큰은 본문이 아니라 쿠키로 받는다 */
export interface AuthUser {
  role: Role;
  id: number;
  name: string;
  /** 점주만: 가게가 없으면 null → 가게 등록 화면으로 */
  restaurant_id?: number | null;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  /** 손님·라이더만 */
  phone?: string;
}
