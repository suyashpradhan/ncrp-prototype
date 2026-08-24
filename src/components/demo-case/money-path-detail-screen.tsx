"use client";

import Link from "next/link";
import { CITIZEN_MESSAGES } from "../../content/en";
import { MoneyPathDetail } from "../process-detail/money-path-detail";
import { DemoCasePlayer } from "./demo-case-player";
import { useDemoCase } from "./demo-case-provider";

export function MoneyPathDetailScreen({ moneyPathId }: { moneyPathId: string }) {
  const { caseData, now, isDemoAuthenticated } = useDemoCase();

  if (!isDemoAuthenticated) {
    return (
      <section className="access-prompt section-pad">
        <div className="shell narrow-shell">
          <h1>{CITIZEN_MESSAGES.case.signInPrompt.defaultMessage}</h1>
          <Link className="button-link" href="/login">
            {CITIZEN_MESSAGES.case.signInAction.defaultMessage}
          </Link>
        </div>
      </section>
    );
  }

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
