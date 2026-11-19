"use client";

import { useState } from "react";
import { Button } from "@/app/_components/Button";
import { FormField } from "@/app/_components/auth/FormField";
import { Modal } from "@/app/_components/Modal";
import { useSaveMenu } from "@/app/_hooks/queries/owner";
import { ApiError } from "@/app/_lib/api/client";
import { uploadImage } from "@/app/_lib/api/ownerApi";
import type { Menu } from "@/app/_lib/types/db";
import { toast } from "@/app/_stores/toastStore";
import { ImagePicker } from "../../../_components/ImagePicker";

interface Props {
  open: boolean;
  menu: Menu | null;
  onClose: () => void;
}

/** 메뉴 등록·수정 시트. 사진은 선택 */
export function MenuFormSheet({ open, menu, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={menu ? "메뉴 수정" : "메뉴 추가"}>
      {open && <MenuForm key={menu?.menu_id ?? "new"} menu={menu} onClose={onClose} />}
    </Modal>
  );
}

function MenuForm({ menu, onClose }: Omit<Props, "open">) {
  const save = useSaveMenu();
  const [name, setName] = useState(menu?.name ?? "");
  const [price, setPrice] = useState(menu ? String(menu.price) : "");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "메뉴 이름을 입력해 주세요";
    if (price === "") next.price = "가격을 입력해 주세요";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      const image_url = file ? await uploadImage(file) : (menu?.image_url ?? null);
      await save.mutateAsync({ id: menu?.menu_id, body: { name: name.trim(), price: Number(price), image_url } });
      toast(menu ? "메뉴를 수정했어요" : `${name.trim()}을(를) 추가했어요`);
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : "저장하지 못했어요" });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto pb-1">
      {errors.form && <p role="alert" className="rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger">{errors.form}</p>}
      <FormField id="m-name" label="메뉴 이름" placeholder="예: 참치김밥" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={50} autoFocus />
      <FormField
        id="m-price"
        label="가격 (원)"
        inputMode="numeric"
        placeholder="0"
        value={price ? Number(price).toLocaleString("ko-KR") : ""}
        onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))}
        error={errors.price}
        help={menu ? "바꿔도 이미 들어온 주문 금액은 그대로예요" : undefined}
      />
      <ImagePicker label="메뉴 사진" aspect="square" current={menu?.image_url ?? null} file={file} onChange={setFile} />
      <Button type="submit" disabled={pending}>
        {pending ? "저장하는 중…" : menu ? "수정하기" : "추가하기"}
      </Button>
    </form>
  );
}
