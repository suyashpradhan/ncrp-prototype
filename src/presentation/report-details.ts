import type { MissingQuestion } from "../incident/missing-information";
import { deriveMissingQuestions } from "../incident/missing-information";
import type { IncidentDraft } from "../incident/schema";
import { formatCurrency } from "./format";

export type ReportGroupId =
  | "INCIDENT"
  | "TRANSACTIONS"
  | "EVIDENCE_SUSPECT"
  | "REPORTER";

export type ReportFieldState =
  | "READY"
  | "MISSING_REQUIRED"
  | "CITIZEN_UNAVAILABLE"
  | "OPTIONAL_UNKNOWN";

export type ReportFieldView = {
  id: string;
  label: string;
  value: string;
  state: ReportFieldState;
  source?: string;
  helpText?: string;
  missingQuestion?: MissingQuestion;
  kind?: "CATEGORY" | "NARRATIVE";
};

export type ReportFieldSection = {
  id: string;
  title?: string;
  fields: ReportFieldView[];
};

export type ReportGroupView = {
  id: ReportGroupId;
  label: string;
  missingCount: number;
  sections: ReportFieldSection[];
};

export type ReportCompletion = {
  ready: number;
  total: number;
  missing: number;
};

const GROUP_LABELS: Record<ReportGroupId, string> = {
  INCIDENT: "Incident",
  TRANSACTIONS: "Transactions",
  EVIDENCE_SUSPECT: "Evidence & suspect",
  REPORTER: "Your details",
};

const MISSING_GROUP: Record<MissingQuestion["field"], ReportGroupId> = {
  incidentDate: "INCIDENT",
  incidentDateYear: "INCIDENT",
  incidentApproximateTime: "INCIDENT",
  occurredOn: "INCIDENT",
  institution: "TRANSACTIONS",
  transactionIdOrUtr: "TRANSACTIONS",
};

export const CITIZEN_DOES_NOT_HAVE = "__CITIZEN_DOES_NOT_HAVE__";

function formatDate(value: string | null): string {
  if (!value) return "Not provided";
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function display(value: string | null | undefined): string {
  if (value === CITIZEN_DOES_NOT_HAVE) return "Not available";
  return value?.trim() || "Not provided";
}

function field(
  id: string,
  label: string,
  value: string | null | undefined,
  options: {
    source?: string;
    helpText?: string;
    missingQuestion?: MissingQuestion;
    kind?: ReportFieldView["kind"];
  } = {},
): ReportFieldView {
  const displayed = display(value);
  return {
    id,
    label,
    value: displayed,
    state: value === CITIZEN_DOES_NOT_HAVE
      ? "CITIZEN_UNAVAILABLE"
      : options.missingQuestion
      ? "MISSING_REQUIRED"
      : displayed === "Not provided"
        ? "OPTIONAL_UNKNOWN"
        : "READY",
    ...options,
  };
}

function evidenceLabel(type: IncidentDraft["evidence"][number]["type"]): string {
  switch (type) {
    case "CHAT_SCREENSHOT": return "Chat screenshot";
    case "TRANSACTION_SCREENSHOT": return "Payment confirmation";
    case "VOICE_STATEMENT": return "Voice statement";
    case "OTHER": return "Other evidence";
  }
}

function identifierLabel(type: IncidentDraft["suspectIdentifiers"][number]["type"]): string {
  switch (type) {
    case "PHONE": return "Phone number";
    case "EMAIL": return "Email address";
    case "URL": return "Website";
    case "UPI_ID": return "UPI ID";
    case "SOCIAL_HANDLE": return "Social handle";
    case "NAME": return "Claimed name";
    case "OTHER": return "Other detail";
  }
}

export function deriveReportCompletion(draft: IncidentDraft): ReportCompletion {
  const total = 4;
  const missing = deriveMissingQuestions(draft).length;
  return { ready: total - missing, total, missing };
}

function formatPartialDate(value: string | null): string {
  if (!value) return "Not provided";
  const [month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(2020, month - 1, day, 12));
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

export function deriveReportGroups(draft: IncidentDraft): ReportGroupView[] {
  const missingQuestions = deriveMissingQuestions(draft);
  const missingByField = new Map(missingQuestions.map((question) => [question.field, question]));
  const missingCount = (group: ReportGroupId) => missingQuestions
    .filter((question) => MISSING_GROUP[question.field] === group).length;

  const incidentFields: ReportFieldView[] = [
    field("category", "Category of complaint", draft.officialMapping.categoryLabel, {
      source: "Suggested from your information",
      kind: "CATEGORY",
    }),
    field("subcategory", "Sub-category", draft.officialMapping.subCategoryLabel, {
      source: "Suggested from your information",
      kind: "CATEGORY",
    }),
    field(
      "money-lost",
      "Money lost?",
      draft.incident.moneyLost === null ? null : draft.incident.moneyLost ? "Yes" : "No",
    ),
    field(
      "incident-date",
      "Incident date",
      draft.incident.incidentDate
        ? formatDate(draft.incident.incidentDate)
        : formatPartialDate(draft.incident.incidentDateWithoutYear),
      {
      missingQuestion:
        missingByField.get("incidentDateYear") ?? missingByField.get("incidentDate"),
    }),
    field("incident-time", "Approximate time", draft.incident.approximateTime, {
      missingQuestion: missingByField.get("incidentApproximateTime"),
    }),
    field(
      "reporting-delay",
      "Delay in reporting",
      draft.incident.delayInReporting === null
        ? null
        : draft.incident.delayInReporting ? "Yes" : "No",
    ),
    ...(draft.incident.delayInReporting
      ? [field("delay-reason", "Reason for delay", draft.incident.delayReason)]
      : []),
    field("occurred-on", "Where the conversation happened", draft.incident.occurredOn, {
      source: "From what you shared",
      missingQuestion: missingByField.get("occurredOn"),
    }),
    field("incident-description", "Incident description", draft.incident.narrative, {
      source: "From what you shared",
      kind: "NARRATIVE",
    }),
  ];

  const transactionSections: ReportFieldSection[] = draft.transactions.length > 0
    ? draft.transactions.map((transaction, index) => ({
        id: `transaction-${index + 1}`,
        title: `Transaction ${index + 1}`,
        fields: [
          field(`transaction-${index}-amount`, "Amount", transaction.amount === null ? null : formatCurrency(transaction.amount), {
            source: "From what you shared",
          }),
          field(`transaction-${index}-institution`, "Bank or payment app", transaction.institution, {
            missingQuestion: index === 0 ? missingByField.get("institution") : undefined,
          }),
          field(`transaction-${index}-account`, "Account, wallet or UPI ID", transaction.accountOrUpiId),
          field(`transaction-${index}-utr`, "Transaction reference", transaction.transactionIdOrUtr, {
            source:
              transaction.transactionIdOrUtr &&
              transaction.transactionIdOrUtr !== CITIZEN_DOES_NOT_HAVE
                ? "From what you shared"
                : undefined,
            helpText: "Also called UTR on many bank receipts.",
            missingQuestion: index === 0 ? missingByField.get("transactionIdOrUtr") : undefined,
          }),
          field(`transaction-${index}-date`, "Transaction date", formatDate(transaction.transactionDate)),
          field(`transaction-${index}-time`, "Approximate time", transaction.approximateTime),
          field(`transaction-${index}-reference`, "Reference number", transaction.referenceNumber),
        ],
      }))
    : [{
        id: "no-transactions",
        fields: [field("transactions-empty", "Transactions", null)],
      }];

  const transactionTotal = draft.transactions.reduce(
    (total, transaction) => total + (transaction.amount ?? 0),
    0,
  );
  const displayedReportedAmount = transactionTotal > 0
    ? transactionTotal
    : draft.incident.reportedAmount;

  const evidenceFields = draft.evidence.length > 0
    ? draft.evidence.map((item, index) => field(
        `evidence-${index}`,
        evidenceLabel(item.type),
        "Provided",
        { source: "From uploaded evidence" },
      ))
    : [field("evidence-empty", "Evidence", null)];

  const suspectFields = draft.suspectIdentifiers.length > 0
    ? draft.suspectIdentifiers.map((item, index) => field(
        `suspect-${index}`,
        identifierLabel(item.type),
        item.value,
        { source: "From what you shared" },
      ))
    : [field("suspect-empty", "Suspect details", null)];

  return [
    {
      id: "INCIDENT",
      label: GROUP_LABELS.INCIDENT,
      missingCount: missingCount("INCIDENT"),
      sections: [{ id: "incident", fields: incidentFields }],
    },
    {
      id: "TRANSACTIONS",
      label: GROUP_LABELS.TRANSACTIONS,
      missingCount: missingCount("TRANSACTIONS"),
      sections: [
        {
          id: "transaction-summary",
          fields: [field(
            "transaction-total",
            "Total money reported lost",
            displayedReportedAmount ? formatCurrency(displayedReportedAmount) : null,
          )],
        },
        ...transactionSections,
      ],
    },
    {
      id: "EVIDENCE_SUSPECT",
      label: GROUP_LABELS.EVIDENCE_SUSPECT,
      missingCount: 0,
      sections: [
        { id: "evidence", title: "Evidence supplied", fields: evidenceFields },
        { id: "suspect", title: "Suspect details found", fields: suspectFields },
      ],
    },
    {
      id: "REPORTER",
      label: GROUP_LABELS.REPORTER,
      missingCount: 0,
      sections: [{
        id: "reporter",
        fields: [
          field("reporter-name", "Name", "Asha Verma", { source: "From your profile" }),
          field("reporter-state", "State", "Karnataka", { source: "From your profile" }),
          field("reporter-mobile", "Registered mobile", "••••••0024", { source: "From your profile" }),
        ],
      }],
    },
  ];
}
