"use client";

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
import { useI18n } from "../../i18n/i18n-provider";

export function CaseOverview({
  caseData,
  now,
  demoControl,
}: {
  caseData: Case;
  now: string;
  demoControl?: ReactNode;
}) {
  const { locale, m, t } = useI18n();
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
              {m(CITIZEN_MESSAGES.case.proposedView)}
            </p>
            <h1>{m(CITIZEN_MESSAGES.case.eyebrow)}</h1>
            <h2 className="case-resolution-question">
              {t("case.where", { amount: formatCurrency(caseData.complaint.reportedAmount) })}
            </h2>

            <section
              className="case-action-summary"
              aria-labelledby="case-action-heading"
            >
              <h2 id="case-action-heading">{m(CITIZEN_MESSAGES.case.actionQuestion)}</h2>
              <p className="case-action-answer">{m(caseAction.heading)}</p>
              <p>{m(caseAction.explanation)}</p>
            </section>

            <div className="case-reference-context">
              <p className="case-summary-line">
                <strong>{locale === "hi" && caseData.reportedIncident.citizenLabel === "KYC-related banking fraud" ? "केवाईसी से जुड़ी बैंकिंग धोखाधड़ी" : caseData.reportedIncident.citizenLabel}</strong>
              </p>
              <p className="case-acknowledgement">{caseData.complaint.acknowledgementId}</p>
              <p className="case-acknowledgement">
                {m(CITIZEN_MESSAGES.case.restorationRequest)} · {DEMO_RESTORATION_REQUEST_ID}
              </p>
              <p className="case-context">{m(CITIZEN_MESSAGES.case.context)}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="money-status" className="money-status section-pad" aria-labelledby="current-status-heading">
        <div className="shell reading-shell">
          <div className="citizen-section-heading">
            <h2 id="current-status-heading">{m(CITIZEN_MESSAGES.case.standingTitle)}</h2>
            <p>{m(CITIZEN_MESSAGES.case.nowIntro)}</p>
          </div>
          <div className="citizen-amount-list">
            {rankedPaths.map((path) => <MoneyPathCard key={path.id} path={path} now={now} />)}
          </div>

          <section className="amount-summary" aria-labelledby="amount-summary-heading">
            <h3 id="amount-summary-heading">{t("case.amountSummary")}</h3>
            <details className="detail-disclosure">
              <summary>{t("case.viewSummary")}</summary>
              <div className="detail-disclosure-content">
                <dl className="citizen-reconciliation" aria-label={m(CITIZEN_MESSAGES.case.reconciliationLabel)}>
                  <div><dt>{t("case.reported")}</dt><dd>{formatCurrency(reconciliation.reportedAmount)}</dd></div>
                  <div><dt>{t("case.active")}</dt><dd>{formatCurrency(activeAmount)}</dd></div>
                  {reconciliation.byFinancialState.INTERIM_CUSTODY > 0 ? (
                    <div><dt>{m(CITIZEN_MESSAGES.case.received)}</dt><dd>{formatCurrency(reconciliation.byFinancialState.INTERIM_CUSTODY)}</dd></div>
                  ) : null}
                  <div><dt>{t("case.cash")}</dt><dd>{formatCurrency(reconciliation.byFinancialState.EXITED_FINANCIAL_SYSTEM)}</dd></div>
                  <div><dt>{t("case.notSecured")}</dt><dd>{formatCurrency(reconciliation.byFinancialState.NOT_CURRENTLY_HELD)}</dd></div>
                  <div className="citizen-reconciliation-total"><dt>{m(CITIZEN_MESSAGES.case.total)}</dt><dd>{formatCurrency(reconciliation.allocatedAmount)}</dd></div>
                </dl>
              </div>
            </details>
          </section>

          <details className="detail-disclosure case-history-details">
            <summary>{m(CITIZEN_MESSAGES.case.historyDisclosure)}</summary>
            <div className="detail-disclosure-content history-context">
              <h3>{m(CITIZEN_MESSAGES.case.historyTitle)}</h3>
              <ul>
                {CITIZEN_MESSAGES.case.historyItems.map((item) => (
                  <li key={item.key}><span aria-hidden="true">✓</span>{m(item)}</li>
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
