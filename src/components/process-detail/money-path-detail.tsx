import Link from "next/link";
import type { ReactNode } from "react";
import type { MoneyPath } from "../../domain/case";
import { FINANCIAL_STATE_MESSAGES, LEGAL_OUTCOME_MESSAGES, UI_MESSAGES } from "../../content/en";
import {
  deriveCurrentOwner,
  deriveCurrentStage,
  deriveFinancialOutcome,
  deriveLegalOutcome,
  derivePlainLanguageStatus,
} from "../../sop/selectors";
import { explainRecordedProcess } from "../../sop/explanations";
import { formatCurrency, formatProcessRoute, getActorLabel } from "../../presentation/format";
import { CitizenActionView } from "../citizen-action/citizen-action";
import { SopClockView } from "../sop-clock/sop-clock";
import { EventHistory } from "../event-history/event-history";
import { ProvenanceView } from "../provenance/provenance";

export function MoneyPathDetail({
  path,
  now,
  demoControl,
}: {
  path: MoneyPath;
  now: string;
  demoControl?: ReactNode;
}) {
  const stage = deriveCurrentStage(path);
  const owner = deriveCurrentOwner(path);
  const status = derivePlainLanguageStatus(path);
  const financial = deriveFinancialOutcome(path);
  const legal = deriveLegalOutcome(path);
  const process = explainRecordedProcess(path);

  return (
    <>
      <section className="detail-hero section-pad">
        <div className="shell narrow-shell">
          <Link className="back-link" href="/">← {UI_MESSAGES.common.backToOverview.defaultMessage}</Link>
          <p className="eyebrow">{UI_MESSAGES.detail.eyebrow.defaultMessage}</p>
          <div className="detail-title-row">
            <div>
              <h1>{formatCurrency(path.amount)}</h1>
              <p className="lede">{UI_MESSAGES.detail.title.defaultMessage}</p>
            </div>
            <span className="stage-code">{stage.replaceAll("_", " ")}</span>
          </div>
          <p className="detail-institution">
            {path.beneficiaryInstitution?.name ?? UI_MESSAGES.common.noBeneficiaryInstitution.defaultMessage}
            {path.beneficiaryInstitution?.maskedAccount ? ` · ${path.beneficiaryInstitution.maskedAccount}` : ""}
          </p>
        </div>
      </section>

      <div className="shell narrow-shell detail-layout section-pad">
        {demoControl}
        <section className="detail-section process-summary" aria-labelledby="process-summary-heading">
          <p className="eyebrow">{UI_MESSAGES.detail.rightNow.defaultMessage}</p>
          <h2 id="process-summary-heading">{UI_MESSAGES.detail.processSummary.defaultMessage}</h2>
          <div className="detail-status-callout">
            <span className="field-label">{UI_MESSAGES.common.currentStep.defaultMessage}</span>
            <p>{status.defaultMessage}</p>
          </div>
          <dl className="detail-facts">
            <div>
              <dt>{UI_MESSAGES.common.waitingOn.defaultMessage}</dt>
              <dd>{getActorLabel(owner, path)}</dd>
            </div>
            <div>
              <dt>{UI_MESSAGES.common.recordedProcess.defaultMessage}</dt>
              <dd>{formatProcessRoute(path.selectedProcess)}</dd>
            </div>
          </dl>
          <CitizenActionView path={path} />
          <SopClockView path={path} now={now} />
        </section>

        <section className="detail-section" aria-labelledby="outcomes-heading">
          <p className="eyebrow">{UI_MESSAGES.detail.honestOutcomes.defaultMessage}</p>
          <h2 id="outcomes-heading">{UI_MESSAGES.detail.outcomes.defaultMessage}</h2>
          <div className="outcome-grid">
            <div className="outcome-card">
              <span className="field-label">{UI_MESSAGES.common.financialOutcome.defaultMessage}</span>
              <strong>{FINANCIAL_STATE_MESSAGES[financial.state].defaultMessage}</strong>
              <p>{financial.explanation.defaultMessage}</p>
            </div>
            <div className="outcome-card">
              <span className="field-label">{UI_MESSAGES.common.legalOutcome.defaultMessage}</span>
              <strong>{LEGAL_OUTCOME_MESSAGES[legal.state].defaultMessage}</strong>
              <p>{legal.explanation.defaultMessage}</p>
            </div>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="route-heading">
          <p className="eyebrow">{UI_MESSAGES.detail.authoritativeRecord.defaultMessage}</p>
          <h2 id="route-heading">{UI_MESSAGES.detail.routeInterpreter.defaultMessage}</h2>
          <div className="route-card">
            <h3>{process.heading.defaultMessage}</h3>
            <p className="route-guardrail">{UI_MESSAGES.detail.routeGuardrail.defaultMessage}</p>
            {process.facts.length > 0 ? (
              <>
                <h4>{process.factsHeading.defaultMessage}</h4>
                <ul>{process.facts.map((fact) => <li key={fact.key}>{fact.defaultMessage}</li>)}</ul>
              </>
            ) : null}
            <ProvenanceView path={path} />
          </div>
        </section>

        <EventHistory path={path} />
      </div>
    </>
  );
}
