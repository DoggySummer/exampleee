"use client";

import { LuCircleAlert } from "react-icons/lu";
import { Button } from "./Button";

/** 목록을 불러오는 동안의 회색 줄 */
export function LoadingRows({ rows = 4, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <ul aria-busy="true" aria-label="불러오는 중" className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex gap-3.5 border-b border-line px-4 py-4">
          {thumb && <div className="size-[76px] shrink-0 animate-pulse rounded-lg bg-field" />}
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-4 w-2/5 animate-pulse rounded bg-field" />
            <div className="h-3.5 w-3/5 animate-pulse rounded bg-field" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 불러오기 실패 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <LuCircleAlert size={28} className="text-danger" aria-hidden />
      <p className="mt-3 font-bold">{message}</p>
      {onRetry && (
        <div className="mt-5 w-full max-w-[200px]">
          <Button variant="ghost" size="md" onClick={onRetry}>
            다시 불러오기
          </Button>
        </div>
      )}
    </div>
  );
}
