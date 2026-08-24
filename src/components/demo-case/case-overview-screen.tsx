"use client";

import { CaseOverview } from "../case-overview/case-overview";
import { DemoCasePlayer } from "./demo-case-player";
import { useDemoCase } from "./demo-case-provider";

const PRIMARY_DEMO_PATH_ID = "path-held-io-verification";

export function CaseOverviewScreen() {
  const { caseData, now } = useDemoCase();
  return (
    <CaseOverview
      caseData={caseData}
      now={now}
      demoControl={<DemoCasePlayer moneyPathId={PRIMARY_DEMO_PATH_ID} />}
    />
  );
}
