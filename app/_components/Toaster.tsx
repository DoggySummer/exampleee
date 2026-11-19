"use client";

import { useToast } from "@/app/_stores/toastStore";

/** 하단 탭 바로 위에 잠깐 뜨는 안내 */
export function Toaster() {
  const { message, tone } = useToast();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-40 flex justify-center px-4">
      {message && (
        <p
          role={tone === "error" ? "alert" : "status"}
          className={`max-w-[440px] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,21,28,.25)] ${
            tone === "error" ? "bg-danger" : "bg-ink"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
