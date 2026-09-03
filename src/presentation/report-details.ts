import type { MissingQuestion } from "../incident/missing-information";
import { deriveMissingQuestions } from "../incident/missing-information";
import { CITIZEN_DOES_NOT_HAVE, type IncidentDraft } from "../incident/schema";
import type { ReporterProfile } from "../experience/profile";
import { SYNTHETIC_NCRP_PROFILE } from "../experience/profile";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import { textForLocale, type UiLocale } from "../i18n/i18n-provider";
import { formatCurrency } from "./format";

export type ReportGroupId =
  | "INCIDENT"
  | "TRANSACTIONS"
  | "ACCOUNT_SYSTEM"
  | "EVIDENCE_SUSPECT"
  | "REPORTER";

export type ReportFieldState =
  | "READY"
  | "NEEDS_INPUT"
  | "NOT_PROVIDED_OPTIONAL"
  | "CITIZEN_DOES_NOT_HAVE"
  | "NEEDS_CONFIRMATION"
  | "CONFIRMED";

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
  ACCOUNT_SYSTEM: "Affected account or system",
  EVIDENCE_SUSPECT: "Evidence & suspect",
  REPORTER: "Your details",
};

const MISSING_GROUP: Record<MissingQuestion["field"], ReportGroupId> = {
  moneyLost: "INCIDENT",
  incidentDate: "INCIDENT",
  incidentDateYear: "INCIDENT",
  incidentApproximateTime: "INCIDENT",
  delayInReporting: "INCIDENT",
  delayReason: "INCIDENT",
  occurredOn: "INCIDENT",
  institution: "TRANSACTIONS",
  accountOrUpiId: "TRANSACTIONS",
  transactionAmount: "TRANSACTIONS",
  transactionIdOrUtr: "TRANSACTIONS",
  transactionDate: "TRANSACTIONS",
  transactionApproximateTime: "TRANSACTIONS",
  platform: "ACCOUNT_SYSTEM",
  affectedAccount: "ACCOUNT_SYSTEM",
  accountAccessStatus: "ACCOUNT_SYSTEM",
  recoveryInformationChanged: "ACCOUNT_SYSTEM",
  accountCompromiseBasis: "ACCOUNT_SYSTEM",
  affectedSystem: "ACCOUNT_SYSTEM",
};

export { CITIZEN_DOES_NOT_HAVE } from "../incident/schema";

function formatDate(value: string | null, locale: UiLocale): string {
  if (!value) return textForLocale(locale, "field.notProvided");
  if (value === CITIZEN_DOES_NOT_HAVE) return textForLocale(locale, "field.notAvailable");
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
  return value?.trim()
    ? sanitizeSensitiveText(value.trim()).text
    : textForLocale(locale, "field.notProvided");
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
      ? "CITIZEN_DOES_NOT_HAVE"
      : options.missingQuestion
      ? options.missingQuestion.field === "incidentDateYear"
        ? "NEEDS_CONFIRMATION"
        : "NEEDS_INPUT"
      : displayed === textForLocale(locale, "field.notProvided")
        ? "NOT_PROVIDED_OPTIONAL"
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

function localizedEvidenceFact(value: string, locale: UiLocale): string {
  if (locale !== "hi") return value;
  const translations: Record<string, string> = {
    "Synthetic KYC message": "काल्पनिक केवाईसी संदेश",
    "SBI KYC update was claimed": "एसबीआई केवाईसी अपडेट करने का दावा",
    "Sender shown as 98XX XX1234": "भेजने वाले का नंबर 98XX XX1234 दिखा",
    "Safe non-resolving link kyc-demo.invalid": "सुरक्षित, न खुलने वाला लिंक kyc-demo.invalid",
    "One synthetic transaction of ₹40,000": "₹40,000 का एक काल्पनिक लेन-देन",
    "Transaction dated 22 August 2026 at about 7:05 AM": "लेन-देन 22 अगस्त 2026 को सुबह लगभग 7:05 बजे हुआ",
    "Synthetic transaction reference is visible": "काल्पनिक लेन-देन संदर्भ दिखाई दिया",
  };
  return translations[value] ?? value;
}

export function deriveReportCompletion(draft: IncidentDraft): ReportCompletion {
  const total = draft.classification.reportFamily === "FINANCIAL_FRAUD"
    ? 4
    : draft.classification.reportFamily === "OTHER_CYBER_CRIME"
      ? 4
      : draft.classification.reportFamily === "WOMEN_CHILDREN_RELATED_CRIME"
        ? 3
        : 0;
  const missing = deriveMissingQuestions(draft).length;
  return { ready: Math.max(0, total - missing), total, missing };
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
  options: {
    locale?: UiLocale;
    profile?: ReporterProfile;
    identityDocumentProvided?: boolean;
  } = {},
): ReportGroupView[] {
  const locale = options.locale ?? "en";
  const profile = options.profile ?? SYNTHETIC_NCRP_PROFILE;
  const identityDocumentProvided = options.identityDocumentProvided ?? true;
  const copy = (key: string, values?: Record<string, string | number>) =>
    textForLocale(
      locale,
      key === "field.fromProfile" && profile.source === "TEST_INPUT"
        ? "profile.fromTest"
        : key,
      values,
    );
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
  const localizedCategory = locale === "hi"
    ? ({
        "Financial Fraud": "वित्तीय धोखाधड़ी",
        "Women / Children Related Crime": "महिला / बच्चों से संबंधित अपराध",
        "Other Cyber Crime": "अन्य साइबर अपराध",
        "Online and Social Media Related Crime": "ऑनलाइन और सोशल मीडिया से संबंधित अपराध",
      } as Record<string, string>)[draft.officialMapping.categoryLabel ?? ""] ?? draft.officialMapping.categoryLabel
    : draft.officialMapping.categoryLabel;
  const localizedSubCategory = locale === "hi"
    ? ({
        "Internet Banking Related Fraud": "इंटरनेट बैंकिंग से जुड़ी धोखाधड़ी",
        "Investment / Trading Fraud": "निवेश / ट्रेडिंग धोखाधड़ी",
        "Online Financial Fraud": "ऑनलाइन वित्तीय धोखाधड़ी",
        "Profile Hacking": "प्रोफ़ाइल हैकिंग",
        "Ransomware": "रैनसमवेयर",
        "Online abusive-content report": "ऑनलाइन अपमानजनक सामग्री की रिपोर्ट",
        "Other supported cyber incident": "अन्य समर्थित साइबर घटना",
      } as Record<string, string>)[draft.officialMapping.subCategoryLabel ?? ""] ?? draft.officialMapping.subCategoryLabel
    : draft.officialMapping.subCategoryLabel;

  const incidentFields: ReportFieldView[] = [
    makeField("category", copy("field.category"), localizedCategory, {
      source: copy("field.suggested"),
      kind: "CATEGORY",
    }),
    makeField("subcategory", copy("field.subcategory"), localizedSubCategory, {
      source: copy("field.suggested"),
      kind: "CATEGORY",
    }),
    makeField(
      "money-lost",
      copy("field.moneyLost"),
      draft.incident.financialLossState === "UNKNOWN"
        ? null
        : draft.incident.financialLossState === "YES" ? copy("field.yes") : copy("field.no"),
      { missingQuestion: missingByField.get("moneyLost") },
    ),
    ...(draft.incident.financialLossState !== "YES" && draft.mentionedInstitutions.length > 0
      ? [makeField(
          "mentioned-institutions",
          locale === "hi" ? "बताया गया बैंक" : "Bank mentioned",
          draft.mentionedInstitutions.join(", "),
          { source: copy("field.fromShared") },
        )]
      : []),
    ...([
      ["bank-details-requested", locale === "hi" ? "बैंक विवरण मांगा गया" : "Bank details requested", draft.financialExposure.bankDetailsRequested],
      ["identity-requested", locale === "hi" ? "पहचान दस्तावेज़ मांगा गया" : "Identity document requested", draft.financialExposure.identityDocumentRequested],
      ["otp-requested", locale === "hi" ? "OTP मांगा गया" : "OTP requested", draft.financialExposure.otpRequested],
      ["payment-link-received", locale === "hi" ? "भुगतान लिंक मिला" : "Payment link received", draft.financialExposure.paymentLinkReceived],
      ["upi-collect-received", locale === "hi" ? "UPI कलेक्ट अनुरोध मिला" : "UPI collect request received", draft.financialExposure.upiCollectRequestReceived],
    ] as const)
      .filter(([, , supported]) => supported === true)
      .map(([id, label]) => makeField(id, label, copy("field.yes"), {
        source: copy("field.fromShared"),
      })),
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
      helpText: copy("field.approxTimeHelp"),
      missingQuestion: missingByField.get("incidentApproximateTime"),
    }),
    makeField(
      "reporting-delay",
      copy("field.reportingDelay"),
      draft.incident.delayInReporting === null
        ? null
        : draft.incident.delayInReporting ? copy("field.yes") : copy("field.no"),
      { missingQuestion: missingByField.get("delayInReporting") },
    ),
    ...(draft.incident.delayInReporting
      ? [makeField("delay-reason", copy("field.delayReason"), draft.incident.delayReason, {
          missingQuestion: missingByField.get("delayReason"),
        })]
      : []),
    makeField("occurred-on", copy("field.occurredOn"), locale === "hi" && draft.incident.occurredOn === "SMS / chat message" ? "एसएमएस / चैट संदेश" : draft.incident.occurredOn, {
      source: draft.evidence.length > 0 ? copy("field.fromEvidence") : copy("field.fromShared"),
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

  const commonIncidentIds = new Set([
    "category",
    "subcategory",
    "incident-date",
    "incident-time",
    "occurred-on",
    "incident-description",
  ]);
  const relevantIncidentFields = draft.classification.reportFamily === "FINANCIAL_FRAUD"
    ? incidentFields
    : incidentFields.filter((item) => commonIncidentIds.has(item.id));

  const transactionSections: ReportFieldSection[] = draft.transactions.map((transaction, index) => ({
        id: `transaction-${index + 1}`,
        title: copy("field.transaction", { number: index + 1 }),
        fields: [
          makeField(`transaction-${index}-amount`, copy("field.amount"), transaction.amount === null ? null : formatCurrency(transaction.amount), {
            source: copy("field.fromShared"),
            missingQuestion: index === 0 ? missingByField.get("transactionAmount") : undefined,
          }),
          makeField(`transaction-${index}-institution`, copy("field.institution"), transaction.institution === "SBI" && locale === "hi" ? "एसबीआई" : transaction.institution, {
            missingQuestion: index === 0 ? missingByField.get("institution") : undefined,
          }),
          makeField(`transaction-${index}-account`, copy("field.account"), transaction.accountOrUpiId === "Synthetic SBI account ending 0024" ? copy("field.syntheticSbiAccount") : transaction.accountOrUpiId, {
            missingQuestion: index === 0 ? missingByField.get("accountOrUpiId") : undefined,
          }),
          makeField(`transaction-${index}-utr`, copy("field.transactionReference"), transaction.transactionIdOrUtr, {
            source:
              transaction.transactionIdOrUtr &&
              transaction.transactionIdOrUtr !== CITIZEN_DOES_NOT_HAVE
                ? copy("field.fromShared")
                : undefined,
            helpText: copy("field.transactionReferenceHelp"),
            missingQuestion: index === 0 ? missingByField.get("transactionIdOrUtr") : undefined,
          }),
          makeField(`transaction-${index}-date`, copy("field.transactionDate"), formatDate(transaction.transactionDate, locale), {
            missingQuestion: index === 0 ? missingByField.get("transactionDate") : undefined,
          }),
          makeField(`transaction-${index}-time`, copy("field.approxTime"), transaction.approximateTime, {
            helpText: copy("field.approxTimeHelp"),
            missingQuestion: index === 0 ? missingByField.get("transactionApproximateTime") : undefined,
          }),
          makeField(`transaction-${index}-reference`, copy("field.reference"), transaction.referenceNumber),
        ],
      }));

  const transactionTotal = draft.transactions.reduce(
    (total, transaction) => total + (transaction.amount ?? 0),
    0,
  );
  const displayedReportedAmount = transactionTotal > 0
    ? transactionTotal
    : draft.incident.reportedAmount;

  const evidenceFields = draft.classification.reportFamily === "WOMEN_CHILDREN_RELATED_CRIME" && draft.evidence.length > 0
    ? [makeField(
        "sensitive-evidence-redacted",
        copy("field.evidenceSupplied"),
        locale === "hi" ? "संवेदनशील सबूत — छिपाया गया" : "Sensitive evidence — redacted",
        { source: copy("field.fromEvidence") },
      )]
    : draft.evidence.length > 0
    ? draft.evidence.map((item, index) => makeField(
        `evidence-${index}`,
        evidenceLabel(item.type, locale),
        copy("field.attached"),
        { source: draft.evidence.length > 0 ? copy("field.fromEvidence") : copy("field.fromShared") },
      ))
    : [makeField("evidence-empty", copy("workspace.evidence"), null)];

  const suspectFields = draft.suspectIdentifiers.map((item, index) => makeField(
        `suspect-${index}`,
        identifierLabel(item.type, locale),
        item.value,
        { source: draft.evidence.length > 0 ? copy("field.fromEvidence") : copy("field.fromShared") },
      ));
  for (const [id, label] of [
    ["suspect-name", copy("field.name")],
    ["suspect-email", copy("field.email")],
  ] as const) {
    if (!suspectFields.some((item) => item.label === label)) {
      suspectFields.push(makeField(id, label, null));
    }
  }
  const evidenceFactFields = draft.evidence.flatMap((item, evidenceIndex) =>
    item.extractedFacts.map((fact, factIndex) => makeField(
      `evidence-fact-${evidenceIndex}-${factIndex}`,
      copy("field.extractedFact"),
      localizedEvidenceFact(fact, locale),
      { source: copy("field.fromEvidence") },
    )),
  );

  const incidentGroup: ReportGroupView = {
    id: "INCIDENT",
    label: copy("field.incident"),
    missingCount: missingCount("INCIDENT"),
    sections: [{ id: "incident", fields: relevantIncidentFields }],
  };
  const transactionGroup: ReportGroupView = {
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
  };
  const accountSystemFields: ReportFieldView[] = /ransomware/i.test(draft.classification.subCategory ?? "")
    ? [
        makeField(
          "affected-system",
          locale === "hi" ? "प्रभावित उपकरण या सिस्टम" : "Affected system",
          locale === "hi" && draft.adaptiveFacts.affectedSystem === "Laptop"
            ? "लैपटॉप"
            : draft.adaptiveFacts.affectedSystem,
          { missingQuestion: missingByField.get("affectedSystem") },
        ),
        makeField(
          "files-encrypted",
          locale === "hi" ? "फ़ाइलें एन्क्रिप्ट हुईं" : "Files encrypted",
          draft.adaptiveFacts.filesEncrypted === null
            ? null
            : draft.adaptiveFacts.filesEncrypted ? copy("field.yes") : copy("field.no"),
        ),
        makeField(
          "ransom-message",
          locale === "hi" ? "फिरौती का संदेश" : "Ransom message",
          draft.adaptiveFacts.ransomMessagePresent === null
            ? null
            : draft.adaptiveFacts.ransomMessagePresent
              ? (locale === "hi" ? "सबूत में दिया गया" : "Provided as evidence")
              : copy("field.no"),
        ),
      ]
    : /profile hacking/i.test(draft.classification.subCategory ?? "")
      ? [
        makeField(
          "platform",
          locale === "hi" ? "प्लेटफ़ॉर्म या सेवा" : "Platform or service",
          draft.adaptiveFacts.platform ?? draft.classification.platform,
          { missingQuestion: missingByField.get("platform") },
        ),
        makeField(
          "affected-account",
          locale === "hi" ? "प्रभावित खाता" : "Affected account",
          draft.adaptiveFacts.affectedAccount,
          { missingQuestion: missingByField.get("affectedAccount") },
        ),
        makeField(
          "account-access",
          locale === "hi" ? "खाते तक पहुँच" : "Account access",
          locale === "hi" && draft.adaptiveFacts.accountAccessStatus === "Lost"
            ? "प्रवेश नहीं है"
            : draft.adaptiveFacts.accountAccessStatus,
          { missingQuestion: missingByField.get("accountAccessStatus") },
        ),
        makeField(
          "recovery-information",
          locale === "hi" ? "रिकवरी जानकारी बदली" : "Recovery information changed",
          draft.adaptiveFacts.recoveryInformationChanged === null
            ? null
            : draft.adaptiveFacts.recoveryInformationChanged ? copy("field.yes") : copy("field.no"),
          { missingQuestion: missingByField.get("recoveryInformationChanged") },
        ),
        makeField(
          "account-compromise-basis",
          locale === "hi" ? "खाता किसी और के उपयोग में होने का संकेत" : "Sign of possible account access",
          draft.adaptiveFacts.accountCompromiseBasis,
          { missingQuestion: missingByField.get("accountCompromiseBasis") },
        ),
        ]
      : [
          makeField(
            "platform",
            locale === "hi" ? "प्लेटफ़ॉर्म या सेवा" : "Platform or service",
            draft.adaptiveFacts.platform ?? draft.classification.platform,
            { missingQuestion: missingByField.get("platform") },
          ),
        ];
  const accountSystemGroup: ReportGroupView = {
    id: "ACCOUNT_SYSTEM",
    label: locale === "hi" ? "प्रभावित खाता या सिस्टम" : "Affected account or system",
    missingCount: missingCount("ACCOUNT_SYSTEM"),
    sections: [{ id: "account-system", fields: accountSystemFields }],
  };
  const evidenceGroup: ReportGroupView = {
    id: "EVIDENCE_SUSPECT",
    label: copy("field.evidenceSuspect"),
    missingCount: 0,
    sections: [
      { id: "evidence", title: copy("field.evidenceSupplied"), fields: evidenceFields },
      { id: "evidence-facts", title: copy("field.factsExtracted"), fields: evidenceFactFields },
      { id: "suspect", title: copy("field.suspectFound"), fields: suspectFields },
    ],
  };
  const reporterGroup: ReportGroupView =
    {
      id: "REPORTER",
      label: copy("field.reporter"),
      missingCount: 0,
      sections: [
        {
          id: "personal-details",
          title: copy("field.personalDetails"),
          fields: [
            makeField("reporter-name", copy("field.name"), profile.displayName, { source: copy("field.fromProfile") }),
            makeField("reporter-mobile", copy("field.registeredMobile"), profile.registeredMobile, { source: copy("field.fromProfile") }),
            makeField("reporter-gender", copy("field.gender"), locale === "hi" && profile.gender === "Female" ? "महिला" : profile.gender, { source: copy("field.fromProfile") }),
            makeField("reporter-dob", copy("field.dateOfBirth"), formatDate(profile.dateOfBirth, locale), { source: copy("field.fromProfile") }),
            makeField("reporter-victim-relationship", copy("field.relationshipWithVictim"), locale === "hi" && profile.relationshipWithVictim === "Self" ? "स्वयं" : profile.relationshipWithVictim, { source: copy("field.fromProfile") }),
            makeField("reporter-parent", copy("field.parentOrSpouse"), profile.parentOrSpouseName, { source: copy("field.fromProfile") }),
            makeField("reporter-email", copy("field.email"), profile.email, { source: copy("field.fromProfile") }),
          ],
        },
        {
          id: "address",
          title: copy("field.address"),
          fields: [
            makeField("reporter-state", copy("field.state"), locale === "hi" && profile.state === "Karnataka" ? "कर्नाटक" : profile.state, { source: copy("field.fromProfile") }),
            makeField("reporter-district", copy("field.district"), profile.district, { source: copy("field.fromProfile") }),
            makeField("reporter-city", copy("field.city"), profile.city, { source: copy("field.fromProfile") }),
            makeField("reporter-pin", copy("field.pinCode"), profile.pinCode, { source: copy("field.fromProfile") }),
          ],
        },
        {
          id: "secondary-address",
          title: copy("field.otherAddressDetails"),
          fields: [
            makeField("reporter-house", copy("field.houseNumber"), profile.houseNumber, { source: copy("field.fromProfile") }),
            makeField("reporter-street", copy("field.street"), profile.street, { source: copy("field.fromProfile") }),
            makeField("reporter-colony", copy("field.colony"), profile.colony, { source: copy("field.fromProfile") }),
            makeField("reporter-country", copy("field.country"), profile.country, { source: copy("field.fromProfile") }),
            makeField("reporter-tehsil", copy("field.tehsil"), profile.tehsil, { source: copy("field.fromProfile") }),
            makeField("reporter-police", copy("field.policeStation"), profile.policeStation, { source: copy("field.fromProfile") }),
          ],
        },
        {
          id: "identity-document",
          title: copy("field.identity"),
          fields: [makeField(
            "reporter-identity-document",
            copy("field.identityDocument"),
            identityDocumentProvided ? copy("field.syntheticIdentity") : null,
            { source: identityDocumentProvided ? copy("field.fromProfile") : undefined },
          )],
        },
      ],
    };

  if (draft.classification.reportFamily === "FINANCIAL_FRAUD") {
    return [
      incidentGroup,
      ...(draft.incident.financialLossState === "YES" && draft.transactions.length > 0
        ? [transactionGroup]
        : []),
      evidenceGroup,
      reporterGroup,
    ];
  }
  if (draft.classification.reportFamily === "OTHER_CYBER_CRIME") {
    return [incidentGroup, accountSystemGroup, evidenceGroup, reporterGroup];
  }
  if (draft.classification.reportFamily === "WOMEN_CHILDREN_RELATED_CRIME") {
    return [incidentGroup, evidenceGroup, reporterGroup];
  }
  return [];
}
