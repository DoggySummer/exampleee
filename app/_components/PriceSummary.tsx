import { formatFee, formatWon } from "@/app/_lib/utils/format";

/** 금액 3줄: 메뉴 합계 / 배달비 / 결제금액 */
export function PriceSummary({ total, fee, label = "총 결제금액" }: { total: number; fee: number; label?: string }) {
  return (
    <dl className="flex flex-col gap-2">
      <div className="flex justify-between text-muted">
        <dt>메뉴 합계</dt>
        <dd className="tabular-nums">{formatWon(total)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>배달비</dt>
        <dd className="tabular-nums">{formatFee(fee)}</dd>
      </div>
      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-bold">{label}</dt>
        <dd className="text-[22px] font-extrabold tracking-tight tabular-nums">{formatWon(total + fee)}</dd>
      </div>
    </dl>
  );
}
