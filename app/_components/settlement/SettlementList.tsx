"use client";

import Link from "next/link";
import { LuWallet } from "react-icons/lu";
import { EmptyState } from "@/app/_components/EmptyState";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { ErrorState, LoadingRows } from "@/app/_components/StateViews";
import { SETTLEMENT_LABEL } from "@/app/_lib/constants/status";
import type { Settlement } from "@/app/_lib/types/db";
import { formatPeriod, formatWon } from "@/app/_lib/utils/format";

interface Props {
  data: Settlement[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  /** 상세 주소 앞부분: /owner/settlements, /rider/settlements */
  basePath: string;
  /** 금액 설명: "주문금액 합계", "배달비 합계" */
  amountLabel: string;
}

/** 주별 정산 목록 (사장님·라이더 공통). 정산은 서버가 매주 월요일 자동으로 만든다 */
export function SettlementList({ data, isPending, isError, onRetry, basePath, amountLabel }: Props) {
  if (isPending) return <LoadingRows thumb={false} />;
  if (isError) return <ErrorState message="정산 내역을 불러오지 못했어요" onRetry={onRetry} />;
  if (!data?.length) {
    return <EmptyState icon={LuWallet} title="아직 정산이 없어요" desc="첫 정산은 다음 주 월요일에 만들어져요" />;
  }

  return (
    <main className="flex-1">
      <p className="border-b border-line px-4 py-3 text-caption text-muted">
        매주 월요일에 지난주(월~일) 배달완료 주문으로 정산을 만들어요. 수수료는 없어요.
      </p>
      <ul>
        {data.map((s) => (
          <li key={s.settlement_id} className="border-b border-line">
            <Link href={`${basePath}/${s.settlement_id}`} className="flex items-center justify-between gap-3 px-4 py-4 active:bg-tray">
              <span>
                <span className="block font-bold">{formatPeriod(s.start_date, s.end_date)}</span>
                <span className="text-caption text-muted">{amountLabel}</span>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <b className="text-lg font-extrabold tabular-nums">{formatWon(s.amount)}</b>
                <StatusBadge status={s.status} label={SETTLEMENT_LABEL[s.status]} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
