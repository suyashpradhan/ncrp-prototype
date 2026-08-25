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
  formatIndiaDayMonth,
  formatProcessRoute,
} from "../../presentation/format";
import { SopClockView } from "../sop-clock/sop-clock";
import { EventHistory } from "../event-history/event-history";
import { ProvenanceView } from "../provenance/provenance";

function institutionName(path: MoneyPath): string | null {
  return path.beneficiaryInstitution?.name.replace(" (synthetic)", "") ?? null;
}

function primaryExplanation(path: MoneyPath): string {
  const stage = deriveCurrentStage(path);
  const presentation = deriveCitizenAmountPresentation(path);

  if (stage === "EXITED_FINANCIAL_SYSTEM") {
    const exitEvent = path.events.find(
      (event) => event.type === "AMOUNT_EXITED_FINANCIAL_SYSTEM",
    );
    const date = exitEvent ? ` on ${formatIndiaDayMonth(exitEvent.occurredAt)}` : "";
    return `The synthetic case records a cash withdrawal${date}.`;
  }

  if (stage === "NOT_CURRENTLY_HELD") {
    return "This amount is not currently recorded as held by a financial institution.";
  }

  if (stage === "INTERIM_CUSTODY_CONFIRMED") {
    return "The amount has been credited under the recorded process.";
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
  const stage = deriveCurrentStage(path);
  const usesShortNoAction =
    stage === "EXITED_FINANCIAL_SYSTEM" || stage === "NOT_CURRENTLY_HELD";
  let actionCopy = action.instruction.defaultMessage;
  if (action.code === "NONE") {
    actionCopy = usesShortNoAction
      ? CITIZEN_MESSAGES.detail.compactNoActionShort.defaultMessage
      : CITIZEN_MESSAGES.detail.compactNoAction.defaultMessage;
  }

  return (
    <section className="compact-detail-section" aria-labelledby={`action-${path.id}`}>
      <h2 id={`action-${path.id}`}>{CITIZEN_MESSAGES.detail.compactActionTitle.defaultMessage}</h2>
      <p className="compact-answer">{actionCopy}</p>
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
  const stage = deriveCurrentStage(path);
  const policy = deriveDetailPresentationPolicy(path);
  const detailTitle = deriveCitizenDetailTitle(path);
  const bankName = institutionName(path);

  return (
    <div className="shell narrow-shell money-detail-page section-pad">
      <Link className="back-link" href="/case#money-status">
        ← {UI_MESSAGES.common.backToOverview.defaultMessage}
      </Link>

      <header className="citizen-detail-header">
        <h1>{formatCurrency(path.amount)}</h1>
        <h2>{detailTitle.defaultMessage}</h2>
        {bankName && stage !== "BANK_INTERIM_CUSTODY" && policy.kind === "ACTIVE_PROCESS" ? (
          <p className="detail-institution">{bankName}</p>
        ) : null}
        <p className="detail-explanation">{primaryExplanation(path)}</p>
      </header>

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
          <h2 id={`clock-${path.id}`}>{CITIZEN_MESSAGES.detail.compactClockTitle.defaultMessage}</h2>
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
