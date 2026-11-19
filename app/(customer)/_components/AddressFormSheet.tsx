"use client";

import { useState } from "react";
import { Button } from "@/app/_components/Button";
import { FormField } from "@/app/_components/auth/FormField";
import { Modal } from "@/app/_components/Modal";
import { useSaveAddress } from "@/app/_hooks/queries/customer";
import { ApiError } from "@/app/_lib/api/client";
import type { Address } from "@/app/_lib/types/db";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 수정이면 기존 배송지 */
  editing?: Address | null;
  onSaved?: (a: Address) => void;
}

/** 배송지 등록·수정 시트 — 장바구니와 배송지 관리 화면이 같이 쓴다 */
export function AddressFormSheet({ open, onClose, editing, onSaved }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? "배송지 수정" : "새 배송지"}>
      {/* key로 열 때마다 입력값을 새로 채운다 */}
      {open && <AddressForm key={editing?.address_id ?? "new"} editing={editing} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function AddressForm({ editing, onClose, onSaved }: Omit<Props, "open">) {
  const save = useSaveAddress();
  const [address, setAddress] = useState(editing?.address ?? "");
  const [detail, setDetail] = useState(editing?.address_detail ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return setError("주소를 입력해 주세요");
    try {
      const saved = await save.mutateAsync({ id: editing?.address_id, body: { address, address_detail: detail || null } });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "배송지를 저장하지 못했어요");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <FormField
        id="addr"
        label="주소"
        placeholder="도로명 주소 (예: 수원시 영통구 광교중앙로 145)"
        autoComplete="street-address"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setError(null);
        }}
        error={error ?? undefined}
        autoFocus
      />
      <FormField
        id="addr-detail"
        label="상세 주소"
        placeholder="동·호수 (선택)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <Button type="submit" disabled={save.isPending} className="mt-1">
        {save.isPending ? "저장하는 중…" : editing ? "수정하기" : "등록하기"}
      </Button>
    </form>
  );
}
