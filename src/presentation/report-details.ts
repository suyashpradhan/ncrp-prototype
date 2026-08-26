import type { MissingQuestion } from "../incident/missing-information";
import { deriveMissingQuestions } from "../incident/missing-information";
import type { IncidentDraft } from "../incident/schema";
import type { ReporterProfile } from "../experience/profile";
import { SYNTHETIC_NCRP_PROFILE } from "../experience/profile";
import { textForLocale, type UiLocale } from "../i18n/i18n-provider";
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

function formatDate(value: string | null, locale: UiLocale): string {
  if (!value) return textForLocale(locale, "field.notProvided");
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function display(value: string | null | undefined, locale: UiLocale): string {
  if (value === CITIZEN_DOES_NOT_HAVE) return textForLocale(locale, "field.notAvailable");
  return value?.trim() || textForLocale(locale, "field.notProvided");
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
    locale?: UiLocale;
  } = {},
): ReportFieldView {
  const locale = options.locale ?? "en";
  const displayed = display(value, locale);
  return {
    id,
    label,
    value: displayed,
    state: value === CITIZEN_DOES_NOT_HAVE
      ? "CITIZEN_UNAVAILABLE"
      : options.missingQuestion
      ? "MISSING_REQUIRED"
      : displayed === textForLocale(locale, "field.notProvided")
        ? "OPTIONAL_UNKNOWN"
        : "READY",
    ...options,
  };
}

function evidenceLabel(type: IncidentDraft["evidence"][number]["type"], locale: UiLocale): string {
  switch (type) {
    case "CHAT_SCREENSHOT": return textForLocale(locale, "field.chatScreenshot");
    case "TRANSACTION_SCREENSHOT": return textForLocale(locale, "field.paymentConfirmation");
    case "VOICE_STATEMENT": return textForLocale(locale, "field.voiceStatement");
    case "OTHER": return textForLocale(locale, "field.otherEvidence");
  }
}

function identifierLabel(type: IncidentDraft["suspectIdentifiers"][number]["type"], locale: UiLocale): string {
  switch (type) {
    case "PHONE": return textForLocale(locale, "field.phone");
    case "EMAIL": return "Email address";
    case "URL": return textForLocale(locale, "field.website");
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

function formatPartialDate(value: string | null, locale: UiLocale): string {
  if (!value) return textForLocale(locale, "field.notProvided");
  const [month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(2020, month - 1, day, 12));
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

export function deriveReportGroups(
  draft: IncidentDraft,
  options: { locale?: UiLocale; profile?: ReporterProfile } = {},
): ReportGroupView[] {
  const locale = options.locale ?? "en";
  const profile = options.profile ?? SYNTHETIC_NCRP_PROFILE;
  const copy = (key: string, values?: Record<string, string | number>) =>
    textForLocale(locale, key, values);
  const makeField = (
    id: string,
    label: string,
    value: string | null | undefined,
    fieldOptions: Parameters<typeof field>[3] = {},
  ) => field(id, label, value, { ...fieldOptions, locale });
  const missingQuestions = deriveMissingQuestions(draft);
  const missingByField = new Map(missingQuestions.map((question) => [question.field, question]));
  const missingCount = (group: ReportGroupId) => missingQuestions
    .filter((question) => MISSING_GROUP[question.field] === group).length;

  const incidentFields: ReportFieldView[] = [
    makeField("category", copy("field.category"), locale === "hi" && draft.officialMapping.categoryLabel === "Financial Fraud" ? "वित्तीय धोखाधड़ी" : draft.officialMapping.categoryLabel, {
      source: copy("field.suggested"),
      kind: "CATEGORY",
    }),
    makeField("subcategory", copy("field.subcategory"), locale === "hi" && draft.officialMapping.subCategoryLabel === "Internet Banking Related Fraud" ? "इंटरनेट बैंकिंग से जुड़ी धोखाधड़ी" : draft.officialMapping.subCategoryLabel, {
      source: copy("field.suggested"),
      kind: "CATEGORY",
    }),
    makeField(
      "money-lost",
      copy("field.moneyLost"),
      draft.incident.moneyLost === null ? null : draft.incident.moneyLost ? copy("field.yes") : copy("field.no"),
    ),
    makeField(
      "incident-date",
      copy("field.incidentDate"),
      draft.incident.incidentDate
        ? formatDate(draft.incident.incidentDate, locale)
        : formatPartialDate(draft.incident.incidentDateWithoutYear, locale),
      {
      missingQuestion:
        missingByField.get("incidentDateYear") ?? missingByField.get("incidentDate"),
    }),
    makeField("incident-time", copy("field.approxTime"), draft.incident.approximateTime, {
      missingQuestion: missingByField.get("incidentApproximateTime"),
    }),
    makeField(
      "reporting-delay",
      copy("field.reportingDelay"),
      draft.incident.delayInReporting === null
        ? null
        : draft.incident.delayInReporting ? copy("field.yes") : copy("field.no"),
    ),
    ...(draft.incident.delayInReporting
      ? [makeField("delay-reason", copy("field.delayReason"), draft.incident.delayReason)]
      : []),
    makeField("occurred-on", copy("field.occurredOn"), locale === "hi" && draft.incident.occurredOn === "SMS / chat message" ? "एसएमएस / चैट संदेश" : draft.incident.occurredOn, {
      source: copy("field.fromShared"),
      missingQuestion: missingByField.get("occurredOn"),
    }),
    makeField(
      "incident-description",
      copy("field.description"),
      draft.citizenSummary.incidentLabel === "KYC-related banking fraud"
        ? copy("field.demoNarrative")
        : draft.incident.narrative,
      {
      source: copy("field.fromShared"),
      kind: "NARRATIVE",
      },
    ),
  ];

  const transactionSections: ReportFieldSection[] = draft.transactions.length > 0
    ? draft.transactions.map((transaction, index) => ({
        id: `transaction-${index + 1}`,
        title: copy("field.transaction", { number: index + 1 }),
        fields: [
          makeField(`transaction-${index}-amount`, copy("field.amount"), transaction.amount === null ? null : formatCurrency(transaction.amount), {
            source: copy("field.fromShared"),
          }),
          makeField(`transaction-${index}-institution`, copy("field.institution"), transaction.institution === "SBI" && locale === "hi" ? "एसबीआई" : transaction.institution, {
            missingQuestion: index === 0 ? missingByField.get("institution") : undefined,
          }),
          makeField(`transaction-${index}-account`, copy("field.account"), transaction.accountOrUpiId === "Synthetic SBI account ending 0024" ? copy("field.syntheticSbiAccount") : transaction.accountOrUpiId),
          makeField(`transaction-${index}-utr`, copy("field.transactionReference"), transaction.transactionIdOrUtr, {
            source:
              transaction.transactionIdOrUtr &&
              transaction.transactionIdOrUtr !== CITIZEN_DOES_NOT_HAVE
                ? copy("field.fromShared")
                : undefined,
            helpText: copy("field.transactionReferenceHelp"),
            missingQuestion: index === 0 ? missingByField.get("transactionIdOrUtr") : undefined,
          }),
          makeField(`transaction-${index}-date`, copy("field.transactionDate"), formatDate(transaction.transactionDate, locale)),
          makeField(`transaction-${index}-time`, copy("field.approxTime"), transaction.approximateTime),
          makeField(`transaction-${index}-reference`, copy("field.reference"), transaction.referenceNumber),
        ],
      }))
    : [{
        id: "no-transactions",
        fields: [makeField("transactions-empty", copy("field.transactions"), null)],
      }];

  const transactionTotal = draft.transactions.reduce(
    (total, transaction) => total + (transaction.amount ?? 0),
    0,
  );
  const displayedReportedAmount = transactionTotal > 0
    ? transactionTotal
    : draft.incident.reportedAmount;

  const evidenceFields = draft.evidence.length > 0
    ? draft.evidence.map((item, index) => makeField(
        `evidence-${index}`,
        evidenceLabel(item.type, locale),
        copy("field.provided"),
        { source: copy("field.fromEvidence") },
      ))
    : [makeField("evidence-empty", copy("workspace.evidence"), null)];

  const suspectFields = draft.suspectIdentifiers.length > 0
    ? draft.suspectIdentifiers.map((item, index) => makeField(
        `suspect-${index}`,
        identifierLabel(item.type, locale),
        item.value,
        { source: copy("field.fromShared") },
      ))
    : [makeField("suspect-empty", copy("field.suspectFound"), null)];

  return [
    {
      id: "INCIDENT",
      label: copy("field.incident"),
      missingCount: missingCount("INCIDENT"),
      sections: [{ id: "incident", fields: incidentFields }],
    },
    {
      id: "TRANSACTIONS",
      label: copy("field.transactions"),
      missingCount: missingCount("TRANSACTIONS"),
      sections: [
        {
          id: "transaction-summary",
          fields: [makeField(
            "transaction-total",
            copy("field.totalLost"),
            displayedReportedAmount ? formatCurrency(displayedReportedAmount) : null,
          )],
        },
        ...transactionSections,
      ],
    },
    {
      id: "EVIDENCE_SUSPECT",
      label: copy("field.evidenceSuspect"),
      missingCount: 0,
      sections: [
        { id: "evidence", title: copy("field.evidenceSupplied"), fields: evidenceFields },
        { id: "suspect", title: copy("field.suspectFound"), fields: suspectFields },
      ],
    },
    {
      id: "REPORTER",
      label: copy("field.reporter"),
      missingCount: 0,
      sections: [{
        id: "reporter",
        fields: [
          makeField("reporter-name", copy("field.name"), locale === "hi" && profile.displayName === "Asha Verma" ? "आशा वर्मा" : profile.displayName, { source: copy("field.fromProfile") }),
          makeField("reporter-state", copy("field.state"), locale === "hi" && profile.state === "Karnataka" ? "कर्नाटक" : profile.state, { source: copy("field.fromProfile") }),
          makeField("reporter-mobile", copy("field.registeredMobile"), profile.registeredMobile, { source: copy("field.fromProfile") }),
        ],
      }],
    },
  ];
}
