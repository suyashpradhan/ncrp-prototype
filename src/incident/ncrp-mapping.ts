import type { IncidentDraft } from "./schema";

export type GeneratedNcrpField = {
  label: string;
  value: string;
};

function display(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function transactionValues(
  draft: IncidentDraft,
  selector: (transaction: IncidentDraft["transactions"][number]) => string | number | null,
): string {
  if (draft.transactions.length === 0) return "Not provided";
  return draft.transactions.map((transaction) => display(selector(transaction))).join("; ");
}

function transactionAmounts(draft: IncidentDraft): string {
  if (draft.transactions.length === 0) return "Not provided";
  return draft.transactions
    .map((transaction) => transaction.amount === null
      ? "Not provided"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(transaction.amount))
    .join("; ");
}

export function totalIncidentTransactionAmount(draft: IncidentDraft): number {
  return draft.transactions.reduce((total, transaction) => total + (transaction.amount ?? 0), 0);
}

export function generateNcrpFields(draft: IncidentDraft): GeneratedNcrpField[] {
  if (draft.classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR") return [];
  const common: GeneratedNcrpField[] = [
    { label: "Category of complaint", value: display(draft.officialMapping.categoryLabel) },
    { label: "Sub-category", value: display(draft.officialMapping.subCategoryLabel) },
    {
      label: "Approximate incident date/time",
      value: [draft.incident.incidentDate, draft.incident.approximateTime].filter(Boolean).join(" · ") || "Not provided",
    },
    { label: "Delay in reporting", value: display(draft.incident.delayInReporting) },
    { label: "Reason for delay", value: display(draft.incident.delayReason) },
    { label: "Where incident occurred", value: display(draft.incident.occurredOn) },
    { label: "Incident narrative", value: display(draft.incident.narrative) },
  ];
  const familyFields: GeneratedNcrpField[] = draft.classification.reportFamily === "FINANCIAL_FRAUD"
    ? [
        { label: "Have you lost money?", value: display(draft.incident.moneyLost) },
        { label: "Victim bank/wallet/merchant", value: transactionValues(draft, (item) => item.institution) },
        { label: "Account / wallet / merchant / UPI ID", value: transactionValues(draft, (item) => item.accountOrUpiId) },
        { label: "Transaction ID / UTR", value: transactionValues(draft, (item) => item.transactionIdOrUtr) },
        { label: "Amount", value: transactionAmounts(draft) },
        { label: "Transaction date", value: transactionValues(draft, (item) => item.transactionDate) },
        { label: "Approximate transaction time", value: transactionValues(draft, (item) => item.approximateTime) },
        { label: "Reference number", value: transactionValues(draft, (item) => item.referenceNumber) },
      ]
    : draft.classification.reportFamily === "OTHER_CYBER_CRIME"
      ? [
          { label: "Platform / service", value: display(draft.adaptiveFacts.platform) },
          { label: "Affected account", value: display(draft.adaptiveFacts.affectedAccount) },
          { label: "Account access", value: display(draft.adaptiveFacts.accountAccessStatus) },
          { label: "Recovery information changed", value: display(draft.adaptiveFacts.recoveryInformationChanged) },
          { label: "Affected system", value: display(draft.adaptiveFacts.affectedSystem) },
          { label: "Files encrypted", value: display(draft.adaptiveFacts.filesEncrypted) },
        ]
      : draft.classification.reportFamily === "WOMEN_CHILDREN_RELATED_CRIME"
        ? [
            { label: "Platform / service", value: display(draft.adaptiveFacts.platform) },
            {
              label: "Evidence",
              value: draft.evidence.length > 0 ? "Sensitive evidence — redacted" : "Not provided",
            },
          ]
        : [];

  return [
    ...common.slice(0, 2),
    ...familyFields.slice(0, draft.classification.reportFamily === "FINANCIAL_FRAUD" ? 1 : familyFields.length),
    ...common.slice(2),
    ...(draft.classification.reportFamily === "FINANCIAL_FRAUD" ? familyFields.slice(1) : []),
    { label: "Supporting evidence", value: draft.evidence.map((item) => item.type).join("; ") || "Not provided" },
    {
      label: "Suspect identifiers",
      value: draft.suspectIdentifiers.map((item) => `${item.type}: ${item.value}`).join("; ") || "Not provided",
    },
    { label: "Complainant information", value: "Asha Verma · Karnataka · ••••••0024" },
  ];
}
