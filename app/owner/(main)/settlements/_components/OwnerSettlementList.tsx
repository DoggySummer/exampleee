"use client";

import { SettlementList } from "@/app/_components/settlement/SettlementList";
import { useOwnerSettlements } from "@/app/_hooks/queries/owner";

export function OwnerSettlementList() {
  const q = useOwnerSettlements();
  return (
    <SettlementList
      data={q.data}
      isPending={q.isPending}
      isError={q.isError}
      onRetry={() => q.refetch()}
      basePath="/owner/settlements"
      amountLabel="주문금액 합계"
    />
  );
}
