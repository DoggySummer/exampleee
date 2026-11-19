"use client";

import { useState, type InputHTMLAttributes, type Ref } from "react";
import { LuCircleAlert, LuEye, LuEyeOff } from "react-icons/lu";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: string;
  ref?: Ref<HTMLInputElement>;
}

/** 라벨 + 회색 입력칸 + 오류/도움말. 비밀번호면 보기·숨기기 버튼이 붙는다 */
export function FormField({ label, error, help, id, type, ref, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const errId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-[7px] block text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={`h-[50px] w-full rounded-[10px] border-[1.5px] px-3.5 outline-none transition-colors placeholder:text-faint focus:border-brand focus:bg-paper ${
            error ? "border-danger bg-paper" : "border-transparent bg-field"
          } ${isPassword ? "pr-12" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute top-1 right-1 flex size-[42px] items-center justify-center rounded-lg text-muted"
          >
            {show ? <LuEyeOff size={20} aria-hidden /> : <LuEye size={20} aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={errId} className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <LuCircleAlert size={16} aria-hidden className="shrink-0" />
          {error}
        </p>
      ) : (
        help && <p className="mt-1.5 text-caption text-muted">{help}</p>
      )}
    </div>
  );
}
