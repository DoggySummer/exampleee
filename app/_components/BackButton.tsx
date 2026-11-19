"use client";

import { useRouter } from "next/navigation";
import { LuChevronLeft } from "react-icons/lu";

/** 앱 안 이동 기록이 없으면(링크로 바로 들어온 경우) fallback으로 이동 */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="뒤로 가기"
      onClick={() => (window.history.length > 1 ? router.back() : router.replace(fallback))}
      className="flex size-11 items-center justify-center rounded-md active:bg-field"
    >
      <LuChevronLeft size={24} aria-hidden />
    </button>
  );
}
