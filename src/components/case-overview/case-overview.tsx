import type { ReactNode } from "react";
import type { Case } from "../../domain/case";
import { CITIZEN_MESSAGES, FRAUD_TYPE_MESSAGES, UI_MESSAGES } from "../../content/en";
import { reconcileCaseAmounts } from "../../domain/reconciliation";
import { deriveCitizenCaseActionPresentation } from "../../presentation/citizen-case";
import { formatCurrency, formatIndiaDate } from "../../presentation/format";
import { rankMoneyPathsForOverview } from "../../presentation/money-paths";
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
  const reconciliation = reconcileCaseAmounts(caseData);
  const activeAmount =
    reconciliation.byFinancialState.HELD +
    reconciliation.byFinancialState.RESTORATION_PROCESSING;
  const caseAction = deriveCitizenCaseActionPresentation(caseData.moneyPaths);

  return (
    <>
      <section className="case-intro section-pad">
        <div className="shell reading-shell">
          <div className="case-lead">
            <h1>{CITIZEN_MESSAGES.case.eyebrow.defaultMessage}</h1>
            <p className="case-total">{formatCurrency(caseData.complaint.reportedAmount)}</p>
            <p className="case-person"><strong>{FRAUD_TYPE_MESSAGES[caseData.fraudType].defaultMessage}</strong></p>
            <p className="case-reported-date">
              {CITIZEN_MESSAGES.case.reportedOn.defaultMessage}: {formatIndiaDate(caseData.complaint.reportedAt)}
            </p>
            <p className="synthetic-person">Synthetic case for {caseData.syntheticCitizen.displayName}</p>
            <p className="case-context">{CITIZEN_MESSAGES.case.context.defaultMessage}</p>
          </div>

          <div className="history-context" aria-labelledby="case-history-heading">
            <h2 id="case-history-heading">{CITIZEN_MESSAGES.case.historyTitle.defaultMessage}</h2>
            <ul>
              {CITIZEN_MESSAGES.case.historyItems.map((item) => (
                <li key={item.key}><span aria-hidden="true">✓</span>{item.defaultMessage}</li>
              ))}
            </ul>
          </div>

          <section
            className={`case-action-summary ${caseAction.actionRequired ? "action-required" : "no-action"}`}
            aria-labelledby="case-action-heading"
          >
            <h2 id="case-action-heading">{CITIZEN_MESSAGES.case.actionQuestion.defaultMessage}</h2>
            <p className="case-action-answer">{caseAction.heading.defaultMessage}</p>
            <p>{caseAction.explanation.defaultMessage}</p>
          </section>
        </div>
      </section>

      <section id="money-status" className="money-status section-pad" aria-labelledby="current-status-heading">
        <div className="shell reading-shell">
          <div className="citizen-section-heading">
            <h2 id="current-status-heading">{CITIZEN_MESSAGES.case.standingTitle.defaultMessage}</h2>
            <p className="lede">{CITIZEN_MESSAGES.case.nowIntro.defaultMessage}</p>
          </div>
          <div className="citizen-amount-list">
            {rankedPaths.map((path) => <MoneyPathCard key={path.id} path={path} now={now} />)}
          </div>

          <dl className="citizen-reconciliation" aria-label={CITIZEN_MESSAGES.case.reconciliationLabel.defaultMessage}>
            <div><dt>{UI_MESSAGES.common.reportedLoss.defaultMessage}</dt><dd>{formatCurrency(reconciliation.reportedAmount)}</dd></div>
            <div><dt>{CITIZEN_MESSAGES.case.active.defaultMessage}</dt><dd>{formatCurrency(activeAmount)}</dd></div>
            {reconciliation.byFinancialState.INTERIM_CUSTODY > 0 ? (
              <div><dt>{CITIZEN_MESSAGES.case.received.defaultMessage}</dt><dd>{formatCurrency(reconciliation.byFinancialState.INTERIM_CUSTODY)}</dd></div>
            ) : null}
            <div><dt>{CITIZEN_MESSAGES.case.exited.defaultMessage}</dt><dd>{formatCurrency(reconciliation.byFinancialState.EXITED_FINANCIAL_SYSTEM)}</dd></div>
            <div><dt>{CITIZEN_MESSAGES.case.notHeld.defaultMessage}</dt><dd>{formatCurrency(reconciliation.byFinancialState.NOT_CURRENTLY_HELD)}</dd></div>
          </dl>

          {demoControl}
        </div>
      </section>
    </>
  );
}
