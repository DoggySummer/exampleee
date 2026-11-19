import { STATUS_TONE } from "@/app/_lib/constants/status";

const TONE = {
  active: "bg-brand-soft text-brand-ink before:bg-brand",
  waiting: "bg-field text-ink before:bg-muted",
  danger: "bg-danger-soft text-danger before:bg-danger",
} as const;

/** 상태는 색과 글자를 같이 보여 준다 (색만으로 구분하지 않음) */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? "waiting";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold before:size-[7px] before:rounded-full ${TONE[tone]}`}
    >
      {label ?? status}
    </span>
  );
}
