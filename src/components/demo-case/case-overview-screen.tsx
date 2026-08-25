"use client";

import Link from "next/link";
import { CITIZEN_MESSAGES } from "../../content/en";
import { CaseOverview } from "../case-overview/case-overview";
import { PrototypeDemoControl } from "./prototype-demo-control";
import { useDemoCase } from "./demo-case-provider";

const PRIMARY_DEMO_PATH_ID = "path-held-io-verification";

export function CaseOverviewScreen() {
  const { caseData, now, isDemoAuthenticated } = useDemoCase();

  if (!isDemoAuthenticated) {
    return (
      <section className="access-prompt section-pad">
        <div className="shell narrow-shell">
          <h1>{CITIZEN_MESSAGES.case.signInPrompt.defaultMessage}</h1>
          <Link className="button-link" href="/">
            {CITIZEN_MESSAGES.case.signInAction.defaultMessage}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <CaseOverview
      caseData={caseData}
      now={now}
      demoControl={<PrototypeDemoControl moneyPathId={PRIMARY_DEMO_PATH_ID} />}
    />
  );
}
