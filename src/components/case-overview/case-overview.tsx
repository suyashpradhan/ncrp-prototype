import type { ReactNode } from "react";
import type { Case } from "../../domain/case";
import { CITIZEN_MESSAGES, UI_MESSAGES } from "../../content/en";
import { reconcileCaseAmounts } from "../../domain/reconciliation";
import { deriveCitizenCaseActionPresentation } from "../../presentation/citizen-case";
import { formatCurrency } from "../../presentation/format";
import { rankMoneyPathsForOverview } from "../../presentation/money-paths";
import { DEMO_RESTORATION_REQUEST_ID } from "../../presentation/demo-journey";
import { JourneyProgress } from "../demo-journey/journey-progress";
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
            <JourneyProgress current="RESOLUTION" />
            <p className="service-stage-label">
              {CITIZEN_MESSAGES.case.proposedView.defaultMessage}
            </p>
            <h1>{CITIZEN_MESSAGES.case.eyebrow.defaultMessage}</h1>
            <h2 className="case-resolution-question">
              Where does your {formatCurrency(caseData.complaint.reportedAmount)} stand?
            </h2>

            <section
              className="case-action-summary"
              aria-labelledby="case-action-heading"
            >
              <h2 id="case-action-heading">{CITIZEN_MESSAGES.case.actionQuestion.defaultMessage}</h2>
              <p className="case-action-answer">{caseAction.heading.defaultMessage}</p>
              <p>{caseAction.explanation.defaultMessage}</p>
            </section>

            <div className="case-reference-context">
              <p className="case-summary-line">
                <strong>{caseData.reportedIncident.citizenLabel}</strong>
              </p>
              <p className="case-acknowledgement">{caseData.complaint.acknowledgementId}</p>
              <p className="case-acknowledgement">
                {CITIZEN_MESSAGES.case.restorationRequest.defaultMessage} · {DEMO_RESTORATION_REQUEST_ID}
              </p>
              <p className="case-context">{CITIZEN_MESSAGES.case.context.defaultMessage}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="money-status" className="money-status section-pad" aria-labelledby="current-status-heading">
        <div className="shell reading-shell">
          <div className="citizen-section-heading">
            <h2 id="current-status-heading">{CITIZEN_MESSAGES.case.standingTitle.defaultMessage}</h2>
            <p>{CITIZEN_MESSAGES.case.nowIntro.defaultMessage}</p>
          </div>
          <div className="citizen-amount-list">
            {rankedPaths.map((path) => <MoneyPathCard key={path.id} path={path} now={now} />)}
          </div>

          <section className="amount-summary" aria-labelledby="amount-summary-heading">
            <h3 id="amount-summary-heading">Amount summary</h3>
            <details className="detail-disclosure">
              <summary>View summary</summary>
              <div className="detail-disclosure-content">
                <dl className="citizen-reconciliation" aria-label={CITIZEN_MESSAGES.case.reconciliationLabel.defaultMessage}>
                  <div><dt>Reported</dt><dd>{formatCurrency(reconciliation.reportedAmount)}</dd></div>
                  <div><dt>Currently recorded in active held/restoration processes</dt><dd>{formatCurrency(activeAmount)}</dd></div>
                  {reconciliation.byFinancialState.INTERIM_CUSTODY > 0 ? (
                    <div><dt>{CITIZEN_MESSAGES.case.received.defaultMessage}</dt><dd>{formatCurrency(reconciliation.byFinancialState.INTERIM_CUSTODY)}</dd></div>
                  ) : null}
                  <div><dt>Cash withdrawal recorded</dt><dd>{formatCurrency(reconciliation.byFinancialState.EXITED_FINANCIAL_SYSTEM)}</dd></div>
                  <div><dt>Not currently secured</dt><dd>{formatCurrency(reconciliation.byFinancialState.NOT_CURRENTLY_HELD)}</dd></div>
                  <div className="citizen-reconciliation-total"><dt>{CITIZEN_MESSAGES.case.total.defaultMessage}</dt><dd>{formatCurrency(reconciliation.allocatedAmount)}</dd></div>
                </dl>
              </div>
            </details>
          </section>

          <details className="detail-disclosure case-history-details">
            <summary>{CITIZEN_MESSAGES.case.historyDisclosure.defaultMessage}</summary>
            <div className="detail-disclosure-content history-context">
              <h3>{CITIZEN_MESSAGES.case.historyTitle.defaultMessage}</h3>
              <ul>
                {CITIZEN_MESSAGES.case.historyItems.map((item) => (
                  <li key={item.key}><span aria-hidden="true">✓</span>{item.defaultMessage}</li>
                ))}
              </ul>
            </div>
          </details>

          {demoControl}
        </div>
      </section>
    </>
  );
}
