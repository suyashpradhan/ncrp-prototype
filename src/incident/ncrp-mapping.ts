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
  return [
    { label: "Category of complaint", value: display(draft.officialMapping.categoryLabel) },
    { label: "Sub-category", value: display(draft.officialMapping.subCategoryLabel) },
    { label: "Have you lost money?", value: display(draft.incident.moneyLost) },
    {
      label: "Approximate incident date/time",
      value: [draft.incident.incidentDate, draft.incident.approximateTime].filter(Boolean).join(" · ") || "Not provided",
    },
    { label: "Delay in reporting", value: display(draft.incident.delayInReporting) },
    { label: "Reason for delay", value: display(draft.incident.delayReason) },
    { label: "Where incident occurred", value: display(draft.incident.occurredOn) },
    { label: "Incident narrative", value: display(draft.incident.narrative) },
    { label: "Victim bank/wallet/merchant", value: transactionValues(draft, (item) => item.institution) },
    { label: "Account / wallet / merchant / UPI ID", value: transactionValues(draft, (item) => item.accountOrUpiId) },
    { label: "Transaction ID / UTR", value: transactionValues(draft, (item) => item.transactionIdOrUtr) },
    { label: "Amount", value: transactionAmounts(draft) },
    { label: "Transaction date", value: transactionValues(draft, (item) => item.transactionDate) },
    { label: "Approximate transaction time", value: transactionValues(draft, (item) => item.approximateTime) },
    { label: "Reference number", value: transactionValues(draft, (item) => item.referenceNumber) },
    { label: "Supporting evidence", value: draft.evidence.map((item) => item.type).join("; ") || "Not provided" },
    {
      label: "Suspect identifiers",
      value: draft.suspectIdentifiers.map((item) => `${item.type}: ${item.value}`).join("; ") || "Not provided",
    },
    { label: "Complainant information", value: "Asha Verma · Karnataka · ••••••0024" },
  ];
}
