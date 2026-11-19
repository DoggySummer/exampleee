"use client";

import { useState } from "react";
import { Button } from "@/app/_components/Button";
import { Modal } from "@/app/_components/Modal";
import { PAYMENT_METHOD, type PaymentMethod } from "@/app/_lib/constants/status";
import { formatWon } from "@/app/_lib/utils/format";

interface Props {
  open: boolean;
  amount: number;
  orderName: string;
  /** 결제창의 결과를 토스와 같은 모양(successUrl / failUrl)으로 넘긴다 */
  onResult: (url: string) => void;
}

/**
 * 가짜 토스 결제창 (MSW 모드 전용).
 * 실제로는 토스 SDK의 requestPayment()가 결제창을 띄우고 successUrl·failUrl로 이동한다.
 * 토스 클라이언트 키를 받으면 CartView의 requestPayment에서 SDK 호출로 바꾼다.
 */
export function MockPaymentSheet({ open, amount, orderName, onResult }: Props) {
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CARD);
  const [failTest, setFailTest] = useState(false);

  function pay() {
    const prefix = failTest ? "mock_fail" : method === PAYMENT_METHOD.EASY_PAY ? "mock_easy" : "mock_card";
    onResult(`?paymentKey=${prefix}_${crypto.randomUUID().slice(0, 8)}`);
  }

  return (
    <Modal open={open} onClose={() => onResult("cancel")} title="테스트 결제">
      <p className="text-caption text-muted">실제 돈은 나가지 않아요. 토스 결제창 대신 띄우는 테스트 화면이에요.</p>
      <div className="mt-4 flex items-baseline justify-between rounded-[10px] bg-field px-4 py-3">
        <span className="truncate text-sm text-muted">{orderName}</span>
        <b className="shrink-0 text-lg font-extrabold tabular-nums">{formatWon(amount)}</b>
      </div>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-bold">결제수단</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(PAYMENT_METHOD).map((m) => (
            <label
              key={m}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] font-bold has-focus-visible:outline-2 has-focus-visible:outline-brand ${
                method === m ? "border-brand bg-brand-soft text-brand-ink" : "border-line"
              }`}
            >
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
              {m}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex items-center gap-2 text-caption text-muted">
        <input type="checkbox" checked={failTest} onChange={(e) => setFailTest(e.target.checked)} className="size-4 accent-brand" />
        카드사 승인 실패로 테스트하기
      </label>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" size="md" onClick={() => onResult("cancel")} className="flex-1">
          닫기
        </Button>
        <Button size="md" onClick={pay} className="flex-[1.6]">
          {formatWon(amount)} 결제
        </Button>
      </div>
    </Modal>
  );
}
