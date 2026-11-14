import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "@/app/_lib/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_URL,
  // JWT를 httpOnly 쿠키로 받는 경우를 대비 (인증 방식 합의 후 확정)
  withCredentials: true,
  timeout: 10_000,
});

/** 화면에서 쓰기 쉬운 형태로 정리한 에러 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    return Promise.reject(
      new ApiError(
        status,
        body?.code ?? "UNKNOWN",
        body?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      ),
    );
  },
);
