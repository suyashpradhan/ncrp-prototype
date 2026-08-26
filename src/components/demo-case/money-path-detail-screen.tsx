"use client";

import Link from "next/link";
import { CITIZEN_MESSAGES } from "../../content/en";
import { MoneyPathDetail } from "../process-detail/money-path-detail";
import { PrototypeDemoControl } from "./prototype-demo-control";
import { useDemoCase } from "./demo-case-provider";
import { useI18n } from "../../i18n/i18n-provider";

export function MoneyPathDetailScreen({ moneyPathId }: { moneyPathId: string }) {
  const { m } = useI18n();
  const { caseData, now, isDemoAuthenticated } = useDemoCase();

  if (!isDemoAuthenticated) {
    return (
      <section className="access-prompt section-pad">
        <div className="shell narrow-shell">
          <h1>{m(CITIZEN_MESSAGES.case.signInPrompt)}</h1>
          <Link className="button-link" href="/">
            {m(CITIZEN_MESSAGES.case.signInAction)}
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
      demoControl={<PrototypeDemoControl moneyPathId={moneyPathId} />}
    />
  );
}
