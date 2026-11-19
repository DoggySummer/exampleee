import axios, { AxiosError } from "axios";
import { clearSession, getToken } from "@/app/_lib/auth/session";
import type { ApiErrorBody } from "@/app/_lib/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10_000,
});

/**
 * MSW를 쓸 때는 워커가 준비될 때까지 요청을 잠깐 붙잡아 둔다.
 * (준비 전에 나간 요청은 MSW를 거치지 않고 실제 서버로 가서 실패하기 때문)
 */
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
let resolveMockReady: (() => void) | undefined;
const mockReady: Promise<void> =
  MOCKING_ENABLED && typeof window !== "undefined"
    ? new Promise((resolve) => (resolveMockReady = resolve))
    : Promise.resolve();

/** MswStarter에서 워커 시작 후 호출 */
export function markMockReady() {
  resolveMockReady?.();
}

apiClient.interceptors.request.use(async (config) => {
  await mockReady;
  // 로그인 토큰은 Authorization: Bearer 헤더로 보낸다 (API 명세서 공통)
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** 화면에서 쓰기 쉬운 형태로 정리한 에러. message는 그대로 화면에 띄운다 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    // 토큰이 만료·폐기됐으면 쿠키를 지운다 → 다음 화면 이동 때 proxy.ts가 로그인 화면으로 보냄
    if (status === 401 && getToken() && !error.config?.url?.startsWith("/auth/login")) clearSession();
    const message =
      error.response?.data?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
    return Promise.reject(new ApiError(status, message));
  },
);
