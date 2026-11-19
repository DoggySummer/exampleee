"use client";

import { useState } from "react";
import { LuCircleAlert, LuMapPin, LuPlus } from "react-icons/lu";
import { Button } from "@/app/_components/Button";
import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { EmptyState } from "@/app/_components/EmptyState";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { useAddresses, useDeleteAddress } from "@/app/_hooks/queries/customer";
import { useMe } from "@/app/_hooks/queries/useMe";
import { ApiError } from "@/app/_lib/api/client";
import type { Address } from "@/app/_lib/types/db";
import { useCart } from "@/app/_stores/cartStore";
import { AddressFormSheet } from "../../../_components/AddressFormSheet";

export function AddressManager() {
  const { data: me } = useMe();
  const { data, isPending, isError, refetch } = useAddresses();
  const del = useDeleteAddress();
  const lastId = useCart((s) => s.lastAddressId);
  const [sheet, setSheet] = useState<{ open: boolean; editing: Address | null }>({ open: false, editing: null });
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex flex-1 flex-col bg-tray">
      <section className="bg-paper px-4 py-5">
        <p className="text-caption text-muted">안녕하세요</p>
        <p className="text-xl font-extrabold tracking-tight">{me ? `${me.name}님` : " "}</p>
      </section>

      <section className="mt-2 flex flex-1 flex-col bg-paper">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-extrabold">배송지</h2>
          <button
            type="button"
            onClick={() => setSheet({ open: true, editing: null })}
            className="flex h-9 items-center gap-1 px-1 text-sm font-bold text-brand"
          >
            <LuPlus size={16} aria-hidden /> 새 배송지
          </button>
        </div>

        {error && (
          <p role="alert" className="mx-4 mb-2 flex gap-2 rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger">
            <LuCircleAlert size={20} aria-hidden className="shrink-0" />
            {error}
          </p>
        )}

        {isPending ? (
          <LoadingRows rows={2} thumb={false} />
        ) : isError ? (
          <ErrorState message="배송지를 불러오지 못했어요" onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={LuMapPin}
            title="등록한 배송지가 없어요"
            desc="주문하려면 배송지가 하나 이상 있어야 해요"
            action={<Button size="md" onClick={() => setSheet({ open: true, editing: null })}>배송지 등록하기</Button>}
          />
        ) : (
          <ul>
            {data.map((a) => (
              <li key={a.address_id} className="flex items-start gap-3 border-t border-line px-4 py-4">
                <LuMapPin size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {a.address}
                    {a.address_id === lastId && (
                      <span className="ml-2 inline-block rounded-md bg-brand-soft px-1.5 py-0.5 align-middle text-xs font-bold whitespace-nowrap text-brand">최근 사용</span>
                    )}
                  </p>
                  {a.address_detail && <p className="text-caption text-muted">{a.address_detail}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setSheet({ open: true, editing: a })} className="h-9 rounded-md px-2 text-caption font-bold text-muted active:bg-field">
                    수정
                  </button>
                  <button type="button" onClick={() => { setError(null); setDeleting(a); }} className="h-9 rounded-md px-2 text-caption font-bold text-danger active:bg-danger-soft">
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddressFormSheet open={sheet.open} editing={sheet.editing} onClose={() => setSheet({ open: false, editing: null })} />
      <ConfirmDialog
        open={!!deleting}
        title="배송지를 삭제할까요?"
        message={deleting ? [deleting.address, deleting.address_detail].filter(Boolean).join(" ") : ""}
        confirmLabel="삭제"
        pending={del.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await del.mutateAsync(deleting.address_id);
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "배송지를 삭제하지 못했어요");
          }
          setDeleting(null);
        }}
      />
    </main>
  );
}
