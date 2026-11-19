"use client";

import { LuMinus, LuPlus, LuTrash2 } from "react-icons/lu";

interface Props {
  value: number;
  onChange: (n: number) => void;
  label: string;
}

/** 수량 조절. 1개에서 −를 누르면 빼기(휴지통) */
export function QuantityStepper({ value, onChange, label }: Props) {
  return (
    <div className="flex h-10 items-center rounded-[10px] border border-line" role="group" aria-label={`${label} 수량`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={value === 1 ? `${label} 빼기` : `${label} 하나 줄이기`}
        className="flex size-10 items-center justify-center text-muted active:bg-field"
      >
        {value === 1 ? <LuTrash2 size={17} aria-hidden /> : <LuMinus size={17} aria-hidden />}
      </button>
      <span className="w-7 text-center font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`${label} 하나 더`}
        className="flex size-10 items-center justify-center text-brand active:bg-field"
      >
        <LuPlus size={17} aria-hidden />
      </button>
    </div>
  );
}
