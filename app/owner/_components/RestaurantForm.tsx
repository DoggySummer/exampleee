"use client";

import { useState } from "react";
import { Button } from "@/app/_components/Button";
import { FormField } from "@/app/_components/auth/FormField";
import { ApiError } from "@/app/_lib/api/client";
import { uploadImage } from "@/app/_lib/api/ownerApi";
import type { RestaurantBody } from "@/app/_lib/types/api";
import type { Restaurant } from "@/app/_lib/types/db";
import { ImagePicker } from "./ImagePicker";

interface Props {
  initial?: Restaurant | null;
  submitLabel: string;
  onSubmit: (body: RestaurantBody) => Promise<unknown>;
}

/** 가게 등록·수정 공통 폼. 대표 사진은 필수 */
export function RestaurantForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [fee, setFee] = useState(initial ? String(initial.delivery_fee) : "");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "상호명을 입력해 주세요";
    if (!address.trim()) next.address = "가게 주소를 입력해 주세요";
    if (fee === "") next.fee = "배달비를 입력해 주세요 (무료면 0)";
    if (!file && !initial?.image_url) next.image = "대표 사진을 골라 주세요";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setServerError(null);
    try {
      const image_url = file ? await uploadImage(file) : initial!.image_url;
      await onSubmit({ name: name.trim(), address: address.trim(), delivery_fee: Number(fee), image_url });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {serverError && <p role="alert" className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger">{serverError}</p>}
      <ImagePicker label="대표 사진" required current={initial?.image_url ?? null} file={file} onChange={setFile} error={errors.image} />
      <FormField id="r-name" label="상호명" placeholder="예: 김밥천국 광교점" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={50} />
      <FormField id="r-addr" label="가게 주소" placeholder="라이더가 음식을 받으러 오는 곳" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} />
      <FormField
        id="r-fee"
        label="배달비 (원)"
        inputMode="numeric"
        placeholder="0"
        value={fee ? Number(fee).toLocaleString("ko-KR") : ""}
        onChange={(e) => setFee(e.target.value.replace(/\D/g, "").slice(0, 6))}
        error={errors.fee}
        help={initial ? "바꿔도 이미 들어온 주문의 배달비는 그대로예요" : "모든 주문에 같은 배달비가 붙어요. 무료면 0"}
      />
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "저장하는 중…" : submitLabel}
      </Button>
    </form>
  );
}
