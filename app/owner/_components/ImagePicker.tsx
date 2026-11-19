"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { LuCircleAlert, LuImagePlus } from "react-icons/lu";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png"];

interface Props {
  label: string;
  /** 지금 저장된 사진 주소 */
  current: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  error?: string;
  aspect?: "wide" | "square";
}

/** 사진 고르기 + 미리보기. 업로드는 저장할 때 부모가 한다 */
export function ImagePicker({ label, current, file, onChange, required, error, aspect = "wide" }: Props) {
  const id = useId();
  const [local, setLocal] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocal(url); // eslint-disable-line react-hooks/set-state-in-effect -- 파일이 바뀔 때 미리보기 주소를 만든다
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = file ? local : current;
  const shown = typeError ?? error;

  return (
    <div>
      <p className="mb-[7px] text-sm font-bold">
        {label}
        {!required && <span className="ml-1 font-medium text-muted">(선택)</span>}
      </p>
      <label
        htmlFor={id}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border-[1.5px] border-dashed bg-field has-focus-visible:outline-2 has-focus-visible:outline-brand ${
          shown ? "border-danger" : "border-line"
        } ${aspect === "wide" ? "aspect-[16/9]" : "aspect-square w-32"}`}
      >
        {preview ? (
          <Image src={preview} alt={`${label} 미리보기`} fill unoptimized className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-caption font-semibold text-muted">
            <LuImagePlus size={26} aria-hidden />
            사진 고르기
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (!TYPES.includes(f.type)) return setTypeError("jpg·png 사진만 올릴 수 있어요");
            if (f.size > MAX) return setTypeError("5MB 이하 사진만 올릴 수 있어요");
            setTypeError(null);
            onChange(f);
          }}
        />
      </label>
      {preview && <p className="mt-1.5 text-caption text-muted">사진을 누르면 바꿀 수 있어요</p>}
      {shown && (
        <p className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <LuCircleAlert size={16} aria-hidden /> {shown}
        </p>
      )}
    </div>
  );
}
