import Link from "next/link";
import type { ReactNode } from "react";
import type { Case } from "../../domain/case";
import { UI_MESSAGES } from "../../content/en";
import { rankMoneyPathsForOverview } from "../../presentation/money-paths";
import { CaseSummary } from "../shared/case-summary";
import { MoneyPathCard } from "./money-path-card";

export function CaseOverview({
  caseData,
  now,
  demoControl,
}: {
  caseData: Case;
  now: string;
  demoControl?: ReactNode;
}) {
  const rankedPaths = rankMoneyPathsForOverview(caseData.moneyPaths, now);

  return (
    <>
      <section className="hero section-pad">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{UI_MESSAGES.overview.eyebrow.defaultMessage}</p>
            <h1>{UI_MESSAGES.overview.title.defaultMessage}</h1>
            <p className="lede">{UI_MESSAGES.overview.intro.defaultMessage}</p>
          </div>
          <CaseSummary caseData={caseData} />
        </div>
      </section>

      <section className="section-pad process-section" aria-labelledby="current-status-heading">
        <div className="shell">
          {demoControl}
          <div className="section-heading">
            <div>
              <p className="eyebrow">{UI_MESSAGES.overview.pathCount.defaultMessage}</p>
              <h2 id="current-status-heading">{UI_MESSAGES.overview.sectionTitle.defaultMessage}</h2>
            </div>
            <p>{UI_MESSAGES.overview.sectionIntro.defaultMessage}</p>
          </div>
          <div className="money-path-grid">
            {rankedPaths.map((path) => <MoneyPathCard key={path.id} path={path} now={now} />)}
          </div>
        </div>
      </section>

      <section className="section-pad ledger-callout-section">
        <div className="shell">
          <div className="ledger-callout">
            <div>
              <p className="eyebrow">{UI_MESSAGES.navigation.ledger.defaultMessage}</p>
              <h2>{UI_MESSAGES.overview.ledgerCtaTitle.defaultMessage}</h2>
              <p>{UI_MESSAGES.overview.ledgerCtaBody.defaultMessage}</p>
            </div>
            <Link className="button-link" href="/ledger">{UI_MESSAGES.overview.ledgerCta.defaultMessage}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
