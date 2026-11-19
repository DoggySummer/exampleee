"use client";

import { SettlementList } from "@/app/_components/settlement/SettlementList";
import { useRiderSettlements } from "@/app/_hooks/queries/rider";

export function RiderSettlementList() {
  const q = useRiderSettlements();
  return (
    <SettlementList
      data={q.data}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      basePath="/rider/settlements"
      amountLabel="배달비 합계"
    />
  );
}
