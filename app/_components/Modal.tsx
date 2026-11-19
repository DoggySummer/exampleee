"use client";

import { useEffect, useId, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** sheet: 아래에서 올라오는 시트 (선택·입력) / dialog: 가운데 확인창 */
  variant?: "sheet" | "dialog";
}

/** 바텀시트·확인창 공통. 바깥을 누르거나 Esc를 누르면 닫힌다 */
export function Modal({ open, onClose, title, children, variant = "sheet" }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const sheet = variant === "sheet";

  return (
    <div className={`fixed inset-0 z-50 flex justify-center ${sheet ? "items-end" : "items-center px-6"}`}>
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-[480px] bg-paper outline-none ${
          sheet ? "rounded-t-2xl px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))]" : "max-w-[360px] rounded-2xl p-5"
        }`}
      >
        {sheet && <div className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />}
        <h2 id={titleId} className="text-lg font-extrabold tracking-tight">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
