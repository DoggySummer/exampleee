"use client";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  /** 스위치 왼쪽에 보이는 글자 (예: 영업중) */
  text?: string;
}

/** 켜기·끄기 스위치. 완전히 둥근 모양은 스위치와 배지에만 쓴다 */
export function ToggleSwitch({ checked, onChange, label, disabled, text }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 items-center gap-2 text-caption font-bold disabled:opacity-45"
    >
      {text && <span className={checked ? "text-brand" : "text-muted"}>{text}</span>}
      <span className={`relative h-6 w-[42px] rounded-full transition-colors ${checked ? "bg-brand" : "bg-line"}`}>
        <span
          className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-[left] ${checked ? "left-[21px]" : "left-[3px]"}`}
        />
      </span>
    </button>
  );
}
