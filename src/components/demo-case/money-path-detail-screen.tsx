"use client";

import { MoneyPathDetail } from "../process-detail/money-path-detail";
import { DemoCasePlayer } from "./demo-case-player";
import { useDemoCase } from "./demo-case-provider";

export function MoneyPathDetailScreen({ moneyPathId }: { moneyPathId: string }) {
  const { caseData, now } = useDemoCase();
  const path = caseData.moneyPaths.find((item) => item.id === moneyPathId);
  if (!path) return null;

  return (
    <MoneyPathDetail
      path={path}
      now={now}
      demoControl={<DemoCasePlayer moneyPathId={moneyPathId} />}
    />
  );
}
