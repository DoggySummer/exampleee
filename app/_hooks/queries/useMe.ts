"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/app/_lib/api/authApi";
import { ApiError } from "@/app/_lib/api/client";
import { queryKeys } from "@/app/_lib/constants/queryKeys";

/** 로그인한 사용자. 로그인 안 했으면 data가 null */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await getMe();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}
