import { getCaseConsistencyIssues } from "../incident/case-consistency";
import { CITIZEN_DOES_NOT_HAVE, type IncidentDraft } from "../incident/schema";
import { resolveFinancialLoss } from "../incident/financial-summary";
import type { UiLocale } from "../i18n/i18n-provider";
import { deriveEvidenceContributions } from "./evidence-contributions";
import { formatCurrency, formatIndiaShortDateWithYear } from "./format";

export type CaseIntegritySummary = {
  transactionCount: number;
  importantFactsLinkedToEvidence: number;
  unresolvedConflictCount: number;
  unavailableImportantDetails: string[];
  stillUnknown: string[];
  knownFacts: string[];
  status: "HEALTHY" | "NEEDS_CONFIRMATION";
};

function totalLoss(draft: IncidentDraft) {
  return resolveFinancialLoss(draft).resolvedLoss;
}

export function getCaseIntegritySummary(
  draft: IncidentDraft,
  options: {
    locale: UiLocale;
    isDemoIncident: boolean;
    screenshotNames: string[];
    demoEvidence?: readonly { id: string; label: string; labelHi: string }[];
  },
): CaseIntegritySummary {
  const { locale, isDemoIncident, screenshotNames, demoEvidence } = options;
  const hi = locale === "hi";
  const knownFacts: string[] = [];
  const stillUnknown: string[] = [];
  const unavailableImportantDetails: string[] = [];
  const amount = totalLoss(draft);

  if (draft.incident.financialLossState === "NO") {
    knownFacts.push(hi ? "कोई वित्तीय नुकसान रिपोर्ट नहीं किया गया" : "No financial loss reported");
  } else if (draft.incident.financialLossState === "YES" && amount) {
    knownFacts.push(hi ? `कुल रिपोर्ट किया गया नुकसान ${formatCurrency(amount)}` : `${formatCurrency(amount)} total reported loss`);
  }
  if (draft.transactions.length > 0) {
    knownFacts.push(hi ? `${draft.transactions.length} लेन-देन` : `${draft.transactions.length} ${draft.transactions.length === 1 ? "transaction" : "transactions"}`);
  }
  if (draft.incident.occurredOn) {
    knownFacts.push(hi ? `संपर्क माध्यम: ${draft.incident.occurredOn}` : `${draft.incident.occurredOn} was the contact channel`);
  }
  if (draft.incident.incidentDate) {
    knownFacts.push(hi ? `घटना की तारीख: ${formatIndiaShortDateWithYear(draft.incident.incidentDate, locale)}` : `Incident date: ${formatIndiaShortDateWithYear(draft.incident.incidentDate, locale)}`);
  } else {
    stillUnknown.push(hi ? "घटना की तारीख" : "Incident date");
  }
  const affected = draft.adaptiveFacts.affectedPlatforms.join(", ") ||
    (draft.adaptiveFacts.affectedAccount ?? draft.adaptiveFacts.platform ?? draft.classification.platform);
  if (affected) knownFacts.push(hi ? `प्रभावित खाता या प्लेटफ़ॉर्म: ${affected}` : `Affected account or platform: ${affected}`);

  draft.transactions.forEach((transaction, index) => {
    const prefix = hi ? `लेन-देन ${index + 1}` : `Transaction ${index + 1}`;
    if (transaction.transactionIdOrUtr === CITIZEN_DOES_NOT_HAVE) {
      unavailableImportantDetails.push(`${prefix} ${hi ? "संदर्भ" : "reference"}`);
    } else if (!transaction.transactionIdOrUtr) {
      stillUnknown.push(`${prefix} ${hi ? "संदर्भ" : "reference"}`);
    }
    if (transaction.approximateTime === CITIZEN_DOES_NOT_HAVE) {
      unavailableImportantDetails.push(`${prefix} ${hi ? "का सही समय" : "exact time"}`);
    } else if (!transaction.approximateTime) {
      stillUnknown.push(`${prefix} ${hi ? "का सही समय" : "exact time"}`);
    }
  });

  const importantFactsLinkedToEvidence = deriveEvidenceContributions(draft, {
    locale,
    isDemoIncident,
    screenshotNames,
    demoEvidence,
  }).reduce((sum, item) => sum + item.contributions.length, 0);
  const unresolvedConflictCount = getCaseConsistencyIssues(draft)
    .filter((issue) => issue.severity === "BLOCKING").length;

  return {
    transactionCount: draft.transactions.length,
    importantFactsLinkedToEvidence,
    unresolvedConflictCount,
    unavailableImportantDetails,
    stillUnknown,
    knownFacts: knownFacts.slice(0, 5),
    status: unresolvedConflictCount > 0 ? "NEEDS_CONFIRMATION" : "HEALTHY",
  };
}
