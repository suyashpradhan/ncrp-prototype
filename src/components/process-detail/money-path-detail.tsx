import Link from "next/link";
import type { ReactNode } from "react";
import type { MoneyPath } from "../../domain/case";
import {
  CITIZEN_MESSAGES,
  FINANCIAL_STATE_MESSAGES,
  LEGAL_OUTCOME_MESSAGES,
  UI_MESSAGES,
} from "../../content/en";
import {
  deriveCitizenAction,
  deriveCurrentOwner,
  deriveCurrentStage,
  deriveFinancialOutcome,
  deriveLegalOutcome,
} from "../../sop/selectors";
import { explainRecordedProcess } from "../../sop/explanations";
import {
  deriveCitizenAmountPresentation,
  deriveCitizenDetailTitle,
} from "../../presentation/citizen-case";
import { formatCurrency, formatProcessRoute, getActorLabel } from "../../presentation/format";
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
  const action = deriveCitizenAction(path);
  const presentation = deriveCitizenAmountPresentation(path);
  const detailTitle = deriveCitizenDetailTitle(path);
  const financial = deriveFinancialOutcome(path);
  const legal = deriveLegalOutcome(path);
  const process = explainRecordedProcess(path);

  return (
    <>
      <section className="citizen-detail-hero section-pad">
        <div className="shell narrow-shell">
          <Link className="back-link" href="/case#money-status">← {UI_MESSAGES.common.backToOverview.defaultMessage}</Link>
          <h1>
            {formatCurrency(path.amount)}{stage === "INTERIM_CUSTODY_CONFIRMED" ? " received" : ""}
          </h1>
          {path.beneficiaryInstitution ? (
            <p className="detail-institution">
              {path.beneficiaryInstitution.name.replace(" (synthetic)", "")} — synthetic
            </p>
          ) : null}
        </div>
      </section>

      <div className="shell narrow-shell citizen-detail-layout section-pad">
        <section className="citizen-detail-section" aria-labelledby="whats-happening-heading">
          <h2 id="whats-happening-heading">
            {stage === "INTERIM_CUSTODY_CONFIRMED"
              ? CITIZEN_MESSAGES.detail.receivedQuestion.defaultMessage
              : CITIZEN_MESSAGES.detail.whatsHappening.defaultMessage}
          </h2>
          <div className="citizen-status-answer">
            <h3>{detailTitle.defaultMessage}</h3>
            <p>{presentation.detailExplanation?.defaultMessage ?? presentation.explanation.defaultMessage}</p>
          </div>
          {owner !== "NONE" ? (
            <dl className="citizen-detail-facts">
              <div>
                <dt>{UI_MESSAGES.common.waitingOn.defaultMessage}</dt>
                <dd>{getActorLabel(owner, path)}</dd>
              </div>
            </dl>
          ) : null}
          {stage === "INTERIM_CUSTODY_CONFIRMED" ? (
            <div className="received-outcomes">
              <div>
                <span>{UI_MESSAGES.common.financialOutcome.defaultMessage}</span>
                <strong>{formatCurrency(path.amount)} received</strong>
              </div>
              <div>
                <span>{UI_MESSAGES.common.legalOutcome.defaultMessage}</span>
                <strong>{CITIZEN_MESSAGES.detail.interimStatus.defaultMessage}</strong>
                <p>{CITIZEN_MESSAGES.detail.interimExplanation.defaultMessage}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="citizen-detail-section action-answer" aria-labelledby="action-heading">
          <h2 id="action-heading">{CITIZEN_MESSAGES.detail.actionTitle.defaultMessage}</h2>
          <p className="action-answer-word">
            {action.code === "NONE"
              ? CITIZEN_MESSAGES.detail.no.defaultMessage
              : CITIZEN_MESSAGES.detail.yes.defaultMessage}
          </p>
          <p>
            {action.code === "NONE"
              ? CITIZEN_MESSAGES.detail.noAction.defaultMessage
              : action.instruction.defaultMessage}
          </p>
        </section>

        <section className="citizen-detail-section" aria-labelledby="clock-heading">
          <h2 id="clock-heading">{CITIZEN_MESSAGES.detail.clockTitle.defaultMessage}</h2>
          <SopClockView path={path} now={now} />
        </section>

        <section className="citizen-detail-section" aria-labelledby="next-heading">
          <h2 id="next-heading">{CITIZEN_MESSAGES.detail.nextTitle.defaultMessage}</h2>
          <p>{presentation.nextStep.defaultMessage}</p>
        </section>

        <EventHistory path={path} />

        <details className="official-process-details">
          <summary>{CITIZEN_MESSAGES.detail.officialSummary.defaultMessage}</summary>
          <div className="official-process-content">
            <h2>{CITIZEN_MESSAGES.detail.officialTitle.defaultMessage}</h2>
            <p className="route-guardrail">{UI_MESSAGES.detail.routeGuardrail.defaultMessage}</p>
            <dl className="official-process-facts">
              <div>
                <dt>{UI_MESSAGES.common.recordedProcess.defaultMessage}</dt>
                <dd>{formatProcessRoute(path.selectedProcess)}</dd>
              </div>
              <div>
                <dt>{UI_MESSAGES.common.financialOutcome.defaultMessage}</dt>
                <dd>{FINANCIAL_STATE_MESSAGES[financial.state].defaultMessage}</dd>
              </div>
              <div>
                <dt>{UI_MESSAGES.common.legalOutcome.defaultMessage}</dt>
                <dd>{LEGAL_OUTCOME_MESSAGES[legal.state].defaultMessage}</dd>
              </div>
            </dl>
            {process.facts.length > 0 ? (
              <div className="recorded-facts">
                <h3>{CITIZEN_MESSAGES.detail.recordedFacts.defaultMessage}</h3>
                <ul>{process.facts.map((fact) => <li key={fact.key}>{fact.defaultMessage}</li>)}</ul>
              </div>
            ) : null}
            <ProvenanceView path={path} collapsible={false} />
          </div>
        </details>

        {demoControl}
      </div>
    </>
  );
}
