import type { Case, CaseOrigin, FraudType } from "../domain/case";
import { assertCaseReconciles } from "../domain/reconciliation";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import type { IncidentDraft } from "./schema";
import { sanitizeSensitiveText } from "./sensitive-text";

const PORTION_RATIOS = [0.365, 0.21, 0.125] as const;
const GENERIC_INCIDENT_LABELS = new Set([
  "incident details not yet known",
  "financial cyber fraud",
]);

export type ReportedAmountResolution = {
  statementAmount: number | null;
  transactionAmount: number | null;
  selectedAmount: number | null;
  hasConflict: boolean;
};

export type SyntheticCitizenProfile = {
  displayName: string;
};

export type BuildSyntheticCaseInput = {
  incidentDraft: IncidentDraft;
  syntheticCitizen: SyntheticCitizenProfile;
  acknowledgementId: string;
  submittedAt: string;
  caseOrigin: CaseOrigin;
  selectedReportedAmount?: number | null;
  processTemplate?: Case;
  templateNow?: string;
};

export type BuiltSyntheticCase = {
  caseData: Case;
  now: string;
};

function cleanAmount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

export function resolveReportedAmount(
  draft: IncidentDraft,
  selectedAmount?: number | null,
): ReportedAmountResolution {
  const statementAmount = cleanAmount(draft.incident.reportedAmount);
  const summedTransactions = draft.transactions.reduce(
    (total, transaction) => total + (cleanAmount(transaction.amount) ?? 0),
    0,
  );
  const transactionAmount = summedTransactions > 0 ? summedTransactions : null;
  const comparisonBase = Math.max(statementAmount ?? 0, transactionAmount ?? 0);
  const hasConflict = Boolean(
    statementAmount &&
      transactionAmount &&
      Math.abs(statementAmount - transactionAmount) > Math.max(100, comparisonBase * 0.01),
  );
  const confirmedSelection = cleanAmount(selectedAmount);

  return {
    statementAmount,
    transactionAmount,
    hasConflict,
    selectedAmount: hasConflict
      ? confirmedSelection
      : transactionAmount ?? statementAmount,
  };
}

function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

export function allocateSyntheticMoneyPaths(reportedAmount: number): [number, number, number, number] {
  if (!Number.isInteger(reportedAmount) || reportedAmount <= 0) {
    throw new Error("Reported amount must be a positive whole-rupee amount.");
  }

  const firstThree = PORTION_RATIOS.map((ratio) =>
    Math.max(0, roundToNearestHundred(reportedAmount * ratio)),
  ) as [number, number, number];
  const allocated = firstThree.reduce((total, amount) => total + amount, 0);
  return [...firstThree, reportedAmount - allocated];
}

function shiftTimestamp(timestamp: string, deltaMilliseconds: number): string {
  return new Date(new Date(timestamp).getTime() + deltaMilliseconds).toISOString();
}

export function rebaseSyntheticCaseTimeline(
  template: Case,
  templateNow: string,
  submittedAt: string,
): BuiltSyntheticCase {
  const deltaMilliseconds =
    new Date(submittedAt).getTime() - new Date(template.complaint.reportedAt).getTime();

  return {
    caseData: {
      ...template,
      complaint: { ...template.complaint, reportedAt: submittedAt },
      moneyPaths: template.moneyPaths.map((path) => ({
        ...path,
        events: path.events.map((event) => ({
          ...event,
          occurredAt: shiftTimestamp(event.occurredAt, deltaMilliseconds),
        })),
      })),
    },
    now: shiftTimestamp(templateNow, deltaMilliseconds),
  };
}

function deriveCitizenIncidentLabel(draft: IncidentDraft): string {
  const citizenLabel = sanitizeSensitiveText(
    draft.citizenSummary.incidentLabel.trim(),
  ).text;
  if (citizenLabel && !GENERIC_INCIDENT_LABELS.has(citizenLabel.toLowerCase())) {
    return citizenLabel;
  }
  return (
    draft.officialMapping.subCategoryLabel?.trim() ||
    draft.officialMapping.categoryLabel?.trim() ||
    "Financial cyber fraud"
  );
}

function deriveFraudType(draft: IncidentDraft): FraudType {
  const text = [
    draft.citizenSummary.incidentLabel,
    draft.officialMapping.categoryLabel,
    draft.officialMapping.subCategoryLabel,
  ].join(" ").toLowerCase();

  if (/investment|trading/.test(text)) return "INVESTMENT_SCAM";
  if (/upi/.test(text)) return "UPI_FRAUD";
  if (/digital arrest/.test(text)) return "DIGITAL_ARREST";
  if (/task/.test(text)) return "TASK_SCAM";
  if (/impersonat|kyc|internet banking|banking/.test(text)) return "IMPERSONATION";
  if (/card/.test(text)) return "CARD_FRAUD";
  if (/marketplace|shopping/.test(text)) return "MARKETPLACE_SCAM";
  if (/betting|gaming/.test(text)) return "BETTING_LINKED";
  return "OTHER_FINANCIAL_FRAUD";
}

export function buildSyntheticCaseFromComplaint({
  incidentDraft,
  syntheticCitizen,
  acknowledgementId,
  submittedAt,
  caseOrigin,
  selectedReportedAmount,
  processTemplate = syntheticCase,
  templateNow = DEMO_NOW,
}: BuildSyntheticCaseInput): BuiltSyntheticCase {
  const amountResolution = resolveReportedAmount(incidentDraft, selectedReportedAmount);
  if (!amountResolution.selectedAmount) {
    throw new Error(
      amountResolution.hasConflict
        ? "Choose which reported amount should be used."
        : "Add the amount that was reported lost before submitting.",
    );
  }

  const rebased = rebaseSyntheticCaseTimeline(processTemplate, templateNow, submittedAt);
  const portions = allocateSyntheticMoneyPaths(amountResolution.selectedAmount);
  const caseData: Case = {
    ...rebased.caseData,
    id: `case-${acknowledgementId.toLowerCase()}`,
    caseOrigin,
    syntheticCitizen,
    fraudType: deriveFraudType(incidentDraft),
    reportedIncident: {
      citizenLabel: deriveCitizenIncidentLabel(incidentDraft),
      description: incidentDraft.incident.narrative
        ? sanitizeSensitiveText(incidentDraft.incident.narrative).text
        : null,
      officialCategoryLabel: incidentDraft.officialMapping.categoryLabel,
      officialSubCategoryLabel: incidentDraft.officialMapping.subCategoryLabel,
      incidentDate: incidentDraft.incident.incidentDate,
      approximateTime: incidentDraft.incident.approximateTime,
    },
    complaint: {
      ...rebased.caseData.complaint,
      id: `complaint-${acknowledgementId.toLowerCase()}`,
      acknowledgementId,
      reportedAmount: amountResolution.selectedAmount,
    },
    moneyPaths: rebased.caseData.moneyPaths.map((path, index) => ({
      ...path,
      amount: portions[index] ?? 0,
    })),
  };

  assertCaseReconciles(caseData);
  return { caseData, now: rebased.now };
}
