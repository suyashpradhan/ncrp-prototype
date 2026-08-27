import type { IncidentDraft, ReportFamily } from "./schema";

export type ReportRequirementKey =
  | "moneyLost"
  | "incidentDate"
  | "incidentApproximateTime"
  | "delayInReporting"
  | "delayReason"
  | "occurredOn"
  | "institution"
  | "accountOrUpiId"
  | "transactionAmount"
  | "transactionIdOrUtr"
  | "transactionDate"
  | "transactionApproximateTime"
  | "platform"
  | "affectedAccount"
  | "accountAccessStatus"
  | "recoveryInformationChanged"
  | "affectedSystem";

export type ReportRequirement = {
  key: ReportRequirementKey;
  group: "INCIDENT" | "TRANSACTIONS" | "ACCOUNT_SYSTEM";
};

const COMMON_INCIDENT_REQUIREMENTS: readonly ReportRequirement[] = [
  { key: "incidentDate", group: "INCIDENT" },
  { key: "incidentApproximateTime", group: "INCIDENT" },
  { key: "occurredOn", group: "INCIDENT" },
];

const FINANCIAL_FRAUD_REQUIREMENTS: readonly ReportRequirement[] = [
  { key: "moneyLost", group: "INCIDENT" },
  ...COMMON_INCIDENT_REQUIREMENTS,
  { key: "delayInReporting", group: "INCIDENT" },
  { key: "institution", group: "TRANSACTIONS" },
  { key: "accountOrUpiId", group: "TRANSACTIONS" },
  { key: "transactionAmount", group: "TRANSACTIONS" },
  { key: "transactionIdOrUtr", group: "TRANSACTIONS" },
  { key: "transactionDate", group: "TRANSACTIONS" },
  { key: "transactionApproximateTime", group: "TRANSACTIONS" },
];

const SOCIAL_ACCOUNT_REQUIREMENTS: readonly ReportRequirement[] = [
  ...COMMON_INCIDENT_REQUIREMENTS,
  { key: "platform", group: "ACCOUNT_SYSTEM" },
  { key: "affectedAccount", group: "ACCOUNT_SYSTEM" },
  { key: "accountAccessStatus", group: "ACCOUNT_SYSTEM" },
  { key: "recoveryInformationChanged", group: "ACCOUNT_SYSTEM" },
];

const RANSOMWARE_REQUIREMENTS: readonly ReportRequirement[] = [
  ...COMMON_INCIDENT_REQUIREMENTS,
  { key: "affectedSystem", group: "ACCOUNT_SYSTEM" },
];
const GENERIC_OTHER_CYBER_REQUIREMENTS: readonly ReportRequirement[] = [
  ...COMMON_INCIDENT_REQUIREMENTS,
  { key: "platform", group: "ACCOUNT_SYSTEM" },
];

const SENSITIVE_REQUIREMENTS: readonly ReportRequirement[] = [
  ...COMMON_INCIDENT_REQUIREMENTS,
  { key: "platform", group: "INCIDENT" },
];

export const requirementsByReportFamily: Record<
  Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">,
  readonly ReportRequirement[]
> = {
  FINANCIAL_FRAUD: FINANCIAL_FRAUD_REQUIREMENTS,
  OTHER_CYBER_CRIME: SOCIAL_ACCOUNT_REQUIREMENTS,
  WOMEN_CHILDREN_RELATED_CRIME: SENSITIVE_REQUIREMENTS,
};

export function requirementsForIncident(draft: IncidentDraft): readonly ReportRequirement[] {
  const { reportFamily, subCategory } = draft.classification;
  if (reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR") return [];
  if (reportFamily === "OTHER_CYBER_CRIME" && /ransomware/i.test(subCategory ?? "")) {
    return RANSOMWARE_REQUIREMENTS;
  }
  if (reportFamily === "OTHER_CYBER_CRIME" && !/profile hacking/i.test(subCategory ?? "")) {
    return GENERIC_OTHER_CYBER_REQUIREMENTS;
  }
  const requirements = requirementsByReportFamily[reportFamily];
  if (reportFamily === "FINANCIAL_FRAUD" && draft.incident.delayInReporting === true) {
    return requirements.flatMap((requirement) =>
      requirement.key === "delayInReporting"
        ? [requirement, { key: "delayReason", group: "INCIDENT" as const }]
        : [requirement],
    );
  }
  return requirements;
}

export function reportRequiresFinancialFields(draft: IncidentDraft): boolean {
  return draft.classification.reportFamily === "FINANCIAL_FRAUD";
}
