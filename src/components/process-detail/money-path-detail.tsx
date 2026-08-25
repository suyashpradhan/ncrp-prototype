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
  deriveCurrentStage,
  deriveFinancialOutcome,
  deriveLegalOutcome,
} from "../../sop/selectors";
import { explainRecordedProcess } from "../../sop/explanations";
import {
  deriveCitizenAmountPresentation,
  deriveCitizenDetailTitle,
  deriveDetailPresentationPolicy,
} from "../../presentation/citizen-case";
import {
  formatCurrency,
  formatProcessRoute,
} from "../../presentation/format";
import { SopClockView } from "../sop-clock/sop-clock";
import { EventHistory } from "../event-history/event-history";
import { ProvenanceView } from "../provenance/provenance";
import { JourneyProgress } from "../demo-journey/journey-progress";

function institutionName(path: MoneyPath): string | null {
  return path.beneficiaryInstitution?.name.replace(" (synthetic)", "") ?? null;
}

function primaryExplanation(path: MoneyPath): string {
  const stage = deriveCurrentStage(path);
  const presentation = deriveCitizenAmountPresentation(path);

  if (stage === "EXITED_FINANCIAL_SYSTEM") {
    return "A cash withdrawal is recorded.";
  }

  if (stage === "NOT_CURRENTLY_HELD") {
    return "This amount is not currently recorded as held by a financial institution.";
  }

  if (stage === "INTERIM_CUSTODY_CONFIRMED") {
    return "The amount has been credited under the recorded process.";
  }

  if (stage === "BANK_INTERIM_CUSTODY") {
    return "The required direction has already been received by the bank.";
  }

  return (
    presentation.detailExplanation?.defaultMessage ??
    presentation.explanation.defaultMessage
  );
}

function OfficialProcessDetails({ path }: { path: MoneyPath }) {
  const financial = deriveFinancialOutcome(path);
  const legal = deriveLegalOutcome(path);
  const process = explainRecordedProcess(path);

  return (
    <details className="detail-disclosure official-process-details">
      <summary>{CITIZEN_MESSAGES.detail.officialSummary.defaultMessage}</summary>
      <div className="detail-disclosure-content official-process-content">
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
  );
}

function CitizenAction({ path }: { path: MoneyPath }) {
  const action = deriveCitizenAction(path);
  const noAction = action.code === "NONE";

  return (
    <section className="compact-detail-section" aria-labelledby={`action-${path.id}`}>
      <h2 id={`action-${path.id}`}>{CITIZEN_MESSAGES.detail.actionTitle.defaultMessage}</h2>
      <p className="detail-yes-no">{noAction ? CITIZEN_MESSAGES.detail.no.defaultMessage : CITIZEN_MESSAGES.detail.yes.defaultMessage}</p>
      <p>{noAction ? CITIZEN_MESSAGES.detail.noAction.defaultMessage : action.instruction.defaultMessage}</p>
    </section>
  );
}

export function MoneyPathDetail({
  path,
  now,
  demoControl,
}: {
  path: MoneyPath;
  now: string;
  demoControl?: ReactNode;
}) {
  const policy = deriveDetailPresentationPolicy(path);
  const detailTitle = deriveCitizenDetailTitle(path);
  const bankName = institutionName(path);

  return (
    <div className="shell narrow-shell money-detail-page section-pad">
      <JourneyProgress current="TRACK" />
      <Link className="back-link" href="/case#money-status">
        ← {UI_MESSAGES.common.backToOverview.defaultMessage}
      </Link>

      <header className="citizen-detail-header">
        <h1>{formatCurrency(path.amount)}</h1>
        {bankName ? <p className="detail-institution">{bankName}</p> : null}
        {path.beneficiaryInstitution?.maskedAccount ? (
          <p className="detail-account">Synthetic account {path.beneficiaryInstitution.maskedAccount}</p>
        ) : null}
      </header>

      {policy.kind === "ACTIVE_PROCESS" ? (
        <section className="compact-detail-section" aria-labelledby={`waiting-${path.id}`}>
          <h2 id={`waiting-${path.id}`}>{CITIZEN_MESSAGES.detail.whatsHappening.defaultMessage}</h2>
          <p className="detail-status">{detailTitle.defaultMessage}</p>
          <p>{primaryExplanation(path)}</p>
        </section>
      ) : policy.kind === "INTERIM_CUSTODY_CONFIRMED" ? (
        <section className="compact-detail-section" aria-labelledby={`received-${path.id}`}>
          <h2 id={`received-${path.id}`}>{CITIZEN_MESSAGES.detail.receivedQuestion.defaultMessage}</h2>
          <p className="detail-status">{formatCurrency(path.amount)} received</p>
          <p>{primaryExplanation(path)}</p>
        </section>
      ) : null}

      {policy.kind === "EXITED_FINANCIAL_SYSTEM" || policy.kind === "NOT_CURRENTLY_HELD" ? (
        <section className="compact-detail-section" aria-labelledby={`meaning-${path.id}`}>
          <h2 id={`meaning-${path.id}`}>{CITIZEN_MESSAGES.detail.meaningTitle.defaultMessage}</h2>
          <p>
            {policy.kind === "EXITED_FINANCIAL_SYSTEM"
              ? CITIZEN_MESSAGES.detail.exitedMeaning.defaultMessage
              : CITIZEN_MESSAGES.detail.notHeldMeaning.defaultMessage}
          </p>
        </section>
      ) : null}

      {policy.showCitizenAction ? <CitizenAction path={path} /> : null}

      {policy.showProcessClock ? (
        <section className="compact-detail-section" aria-labelledby={`clock-${path.id}`}>
          <h2 id={`clock-${path.id}`}>{CITIZEN_MESSAGES.detail.clockTitle.defaultMessage}</h2>
          <SopClockView path={path} now={now} />
        </section>
      ) : null}

      {policy.showNextStep ? (
        <section className="compact-detail-section" aria-labelledby={`next-${path.id}`}>
          <h2 id={`next-${path.id}`}>{CITIZEN_MESSAGES.detail.nextTitle.defaultMessage}</h2>
          <p>{deriveCitizenAmountPresentation(path).nextStep.defaultMessage}</p>
        </section>
      ) : null}

      {policy.showOutcomes ? (
        <section className="received-outcomes" aria-label="Recorded outcomes">
          <div>
            <h2>{UI_MESSAGES.common.financialOutcome.defaultMessage}</h2>
            <p className="compact-answer">{formatCurrency(path.amount)} received</p>
          </div>
          <div>
            <h2>{UI_MESSAGES.common.legalOutcome.defaultMessage}</h2>
            <p className="compact-answer">{CITIZEN_MESSAGES.detail.interimStatus.defaultMessage}</p>
            <details className="inline-disclosure">
              <summary>{CITIZEN_MESSAGES.detail.interimHelp.defaultMessage}</summary>
              <p>{CITIZEN_MESSAGES.detail.interimExplanation.defaultMessage}</p>
            </details>
          </div>
        </section>
      ) : null}

      <div className="secondary-detail-disclosures">
        {policy.showHistory ? <EventHistory path={path} /> : null}
        {policy.showOfficialProcess ? <OfficialProcessDetails path={path} /> : null}
        {policy.showDemoControl ? demoControl : null}
      </div>
    </div>
  );
}
