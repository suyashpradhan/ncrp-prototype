"use client";

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
  deriveCurrentOwner,
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
  getActorLabel,
  formatProcessRoute,
} from "../../presentation/format";
import { SopClockView } from "../sop-clock/sop-clock";
import { EventHistory } from "../event-history/event-history";
import { ProvenanceView } from "../provenance/provenance";
import { JourneyProgress } from "../demo-journey/journey-progress";
import { useI18n } from "../../i18n/i18n-provider";
import type { Message } from "../../domain/messages";

function institutionName(path: MoneyPath): string | null {
  return path.beneficiaryInstitution?.name.replace(" (synthetic)", "") ?? null;
}

function primaryExplanation(
  path: MoneyPath,
  t: (key: string, values?: Record<string, string | number>) => string,
  m: (message: Message) => string,
): string {
  const stage = deriveCurrentStage(path);
  const presentation = deriveCitizenAmountPresentation(path);

  if (stage === "EXITED_FINANCIAL_SYSTEM") {
    return t("detail.primaryCash");
  }

  if (stage === "NOT_CURRENTLY_HELD") {
    return t("detail.primaryNotHeld");
  }

  if (stage === "INTERIM_CUSTODY_CONFIRMED") {
    return t("detail.primaryReceived");
  }

  if (stage === "BANK_INTERIM_CUSTODY") {
    return t("detail.primaryBank");
  }

  return (
    m(presentation.detailExplanation ?? presentation.explanation)
  );
}

function OfficialProcessDetails({ path }: { path: MoneyPath }) {
  const { locale, m } = useI18n();
  const financial = deriveFinancialOutcome(path);
  const legal = deriveLegalOutcome(path);
  const process = explainRecordedProcess(path);

  return (
    <details className="detail-disclosure official-process-details">
      <summary>{m(CITIZEN_MESSAGES.detail.officialSummary)}</summary>
      <div className="detail-disclosure-content official-process-content">
        <p className="route-guardrail">{m(UI_MESSAGES.detail.routeGuardrail)}</p>
        <dl className="official-process-facts">
          <div>
            <dt>{m(UI_MESSAGES.common.recordedProcess)}</dt>
            <dd>{locale === "hi" ? m({ key: path.selectedProcess ? `processRoute.${path.selectedProcess.toLowerCase().replace("_", "")}` : "detail.noRecordedProcess", defaultMessage: formatProcessRoute(path.selectedProcess) }) : formatProcessRoute(path.selectedProcess)}</dd>
          </div>
          <div>
            <dt>{m(UI_MESSAGES.common.financialOutcome)}</dt>
            <dd>{m(FINANCIAL_STATE_MESSAGES[financial.state])}</dd>
          </div>
          <div>
            <dt>{m(UI_MESSAGES.common.legalOutcome)}</dt>
            <dd>{m(LEGAL_OUTCOME_MESSAGES[legal.state])}</dd>
          </div>
        </dl>
        {process.facts.length > 0 ? (
          <div className="recorded-facts">
            <h3>{m(CITIZEN_MESSAGES.detail.recordedFacts)}</h3>
            <ul>{process.facts.map((fact) => <li key={fact.key}>{m(fact)}</li>)}</ul>
          </div>
        ) : null}
        <ProvenanceView path={path} collapsible={false} />
      </div>
    </details>
  );
}

function CitizenAction({ path }: { path: MoneyPath }) {
  const { m } = useI18n();
  const action = deriveCitizenAction(path);
  const noAction = action.code === "NONE";

  return (
    <section className="compact-detail-section" aria-labelledby={`action-${path.id}`}>
      <h2 id={`action-${path.id}`}>{m(CITIZEN_MESSAGES.detail.actionTitle)}</h2>
      <p className="detail-yes-no">{noAction ? m(CITIZEN_MESSAGES.detail.no) : m(CITIZEN_MESSAGES.detail.yes)}</p>
      <p>{noAction ? m(CITIZEN_MESSAGES.detail.noAction) : m(action.instruction)}</p>
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
  const { locale, m, t } = useI18n();
  const policy = deriveDetailPresentationPolicy(path);
  const detailTitle = deriveCitizenDetailTitle(path);
  const bankName = institutionName(path);
  const displayedBankName = locale === "hi"
    ? bankName?.replace("Bank A", "बैंक A").replace("Bank B", "बैंक B") ?? null
    : bankName;

  return (
    <div className="shell narrow-shell money-detail-page section-pad">
      <JourneyProgress current="RESOLUTION" />
      <p className="service-stage-label">
        {m(CITIZEN_MESSAGES.case.proposedView)}
      </p>
      <Link className="back-link" href="/case#money-status">
        ← {m(UI_MESSAGES.common.backToOverview)}
      </Link>

      <header className="citizen-detail-header">
        <h1>{formatCurrency(path.amount)}</h1>
        {displayedBankName ? <p className="detail-institution">{displayedBankName}</p> : null}
        {path.beneficiaryInstitution?.maskedAccount ? (
          <p className="detail-account">{t("detail.account")} {path.beneficiaryInstitution.maskedAccount}</p>
        ) : null}
      </header>

      {policy.kind === "ACTIVE_PROCESS" ? (
        <section className="compact-detail-section" aria-labelledby={`waiting-${path.id}`}>
          <h2 id={`waiting-${path.id}`}>{m(CITIZEN_MESSAGES.detail.whatsHappening)}</h2>
          <p className="detail-status">{m(detailTitle)}</p>
          <p>{primaryExplanation(path, t, m)}</p>
        </section>
      ) : policy.kind === "INTERIM_CUSTODY_CONFIRMED" ? (
        <section className="compact-detail-section" aria-labelledby={`received-${path.id}`}>
          <h2 id={`received-${path.id}`}>{m(CITIZEN_MESSAGES.detail.receivedQuestion)}</h2>
          <p className="detail-status">{t("detail.received", { amount: formatCurrency(path.amount) })}</p>
          <p>{primaryExplanation(path, t, m)}</p>
        </section>
      ) : null}

      {policy.showCurrentActor ? (
        <section className="compact-detail-section" aria-labelledby={`actor-${path.id}`}>
          <h2 id={`actor-${path.id}`}>{m(UI_MESSAGES.common.waitingOn)}</h2>
          <p className="detail-status">
            {locale === "hi"
              ? getActorLabel(deriveCurrentOwner(path), path)
                  .replace("Bank A", "बैंक A")
                  .replace("Bank B", "बैंक B")
                  .replace("Investigating Officer", t("detail.currentActorIo"))
                  .replace(" (synthetic)", "")
              : getActorLabel(deriveCurrentOwner(path), path).replace(" (synthetic)", "")}
          </p>
        </section>
      ) : null}

      {policy.kind === "EXITED_FINANCIAL_SYSTEM" || policy.kind === "NOT_CURRENTLY_HELD" ? (
        <section className="compact-detail-section" aria-labelledby={`meaning-${path.id}`}>
          <h2 id={`meaning-${path.id}`}>{m(CITIZEN_MESSAGES.detail.meaningTitle)}</h2>
          <p>
            {policy.kind === "EXITED_FINANCIAL_SYSTEM"
              ? m(CITIZEN_MESSAGES.detail.exitedMeaning)
              : m(CITIZEN_MESSAGES.detail.notHeldMeaning)}
          </p>
        </section>
      ) : null}

      {policy.showCitizenAction ? <CitizenAction path={path} /> : null}

      {policy.showProcessClock ? (
        <section className="compact-detail-section" aria-labelledby={`clock-${path.id}`}>
          <h2 id={`clock-${path.id}`}>{m(CITIZEN_MESSAGES.detail.clockTitle)}</h2>
          <SopClockView path={path} now={now} />
        </section>
      ) : null}

      {policy.showNextStep ? (
        <section className="compact-detail-section" aria-labelledby={`next-${path.id}`}>
          <h2 id={`next-${path.id}`}>{m(CITIZEN_MESSAGES.detail.nextTitle)}</h2>
          <p>{m(deriveCitizenAmountPresentation(path).nextStep)}</p>
        </section>
      ) : null}

      {policy.showOutcomes ? (
        <section className="received-outcomes" aria-label={t("detail.outcomes")}>
          <div>
            <h2>{m(UI_MESSAGES.common.financialOutcome)}</h2>
            <p className="compact-answer">{t("detail.received", { amount: formatCurrency(path.amount) })}</p>
          </div>
          <div>
            <h2>{m(UI_MESSAGES.common.legalOutcome)}</h2>
            <p className="compact-answer">{m(CITIZEN_MESSAGES.detail.interimStatus)}</p>
            <details className="inline-disclosure">
              <summary>{m(CITIZEN_MESSAGES.detail.interimHelp)}</summary>
              <p>{m(CITIZEN_MESSAGES.detail.interimExplanation)}</p>
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
