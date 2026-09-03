import type { IncidentDraft } from "../incident/schema";
import type { UiLocale } from "../i18n/i18n-provider";
import { deriveIncidentTimeline, type IncidentTimelineEvent } from "./incident-timeline";
import {
  formatCurrency,
  formatIndiaShortDateWithYear,
} from "./format";

export type PostReportMilestones = {
  preparedAt: string;
  reviewedAt: string;
  submittedAt: string;
};

export type CaseSummaryItem = {
  id: string;
  label: string;
  value: string;
};

export type PostReportAction = {
  id: string;
  text: string;
  href?: string;
};

export type PostReportProcessExplanation = {
  knownNow: string[];
  possibleNextSteps: string[];
};

function formatApplicationTime(value: string, locale: UiLocale): string {
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatKnownTime(value: string | null, locale: UiLocale): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || hours > 23 || minutes > 59) return value;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2020, 0, 1, hours, minutes)));
}

function factTimeLabel(
  date: string | null,
  time: string | null,
  locale: UiLocale,
): string | null {
  const parts = [
    date ? formatIndiaShortDateWithYear(date, locale) : null,
    formatKnownTime(time, locale),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function incidentPathLabel(draft: IncidentDraft, locale: UiLocale): string {
  const label =
    draft.officialMapping.subCategoryLabel ??
    draft.officialMapping.categoryLabel ??
    draft.classification.subCategory ??
    draft.classification.category;
  if (locale !== "hi") return label ?? "Supported cyber incident";
  const translations: Record<string, string> = {
    "Financial Fraud": "वित्तीय धोखाधड़ी",
    "Online Financial Fraud": "ऑनलाइन वित्तीय धोखाधड़ी",
    "Internet Banking Related Fraud": "इंटरनेट बैंकिंग से जुड़ी धोखाधड़ी",
    "Investment / Trading Fraud": "निवेश / ट्रेडिंग धोखाधड़ी",
    "Online Lottery Scam": "ऑनलाइन लॉटरी धोखाधड़ी",
    "Profile Hacking": "प्रोफ़ाइल हैकिंग",
    Ransomware: "रैनसमवेयर",
    "Other Cyber Crime": "अन्य साइबर अपराध",
  };
  return label ? translations[label] ?? label : "समर्थित साइबर घटना";
}

function totalReportedLoss(draft: IncidentDraft): number | null {
  const transactionTotal = draft.transactions.reduce(
    (total, transaction) => total + (transaction.amount ?? 0),
    0,
  );
  if (transactionTotal > 0) return transactionTotal;
  return draft.incident.financialLossState === "YES"
    ? draft.incident.reportedAmount
    : null;
}

export function getCaseSummary(
  draft: IncidentDraft,
  locale: UiLocale,
): CaseSummaryItem[] {
  const hi = locale === "hi";
  const items: CaseSummaryItem[] = [
    {
      id: "reporting-path",
      label: hi ? "रिपोर्टिंग रास्ता" : "Reporting path",
      value: incidentPathLabel(draft, locale),
    },
  ];
  const totalLoss = totalReportedLoss(draft);
  if (totalLoss) {
    items.push({
      id: "reported-loss",
      label: hi ? "रिपोर्ट किया गया नुकसान" : "Reported loss",
      value: formatCurrency(totalLoss),
    });
  }
  if (draft.transactions.length > 0) {
    items.push({
      id: "transactions",
      label: hi ? "लेन-देन" : "Transactions",
      value: String(draft.transactions.length),
    });
  } else if (draft.incident.financialLossState === "NO") {
    items.push({
      id: "money-lost",
      label: hi ? "पैसे गए" : "Money lost",
      value: hi ? "नहीं" : "No",
    });
  }
  if (draft.incident.incidentDate) {
    items.push({
      id: "incident-date",
      label: hi ? "घटना" : "Incident",
      value: formatIndiaShortDateWithYear(draft.incident.incidentDate, locale),
    });
  }
  if (draft.incident.occurredOn) {
    items.push({
      id: "channel",
      label: hi ? "माध्यम" : "Channel",
      value: draft.incident.occurredOn,
    });
  }
  const affectedAccount = draft.adaptiveFacts.affectedAccount;
  const affectedPlatform = draft.adaptiveFacts.platform ?? draft.classification.platform;
  if (affectedAccount) {
    items.push({
      id: "affected-account",
      label: hi ? "प्रभावित खाता" : "Affected account",
      value: affectedAccount,
    });
  } else if (affectedPlatform) {
    items.push({
      id: "affected-platform",
      label: hi ? "प्रभावित प्लेटफ़ॉर्म" : "Affected platform",
      value: affectedPlatform,
    });
  }
  if (
    draft.transactions.length === 0 &&
    draft.mentionedInstitutions.length > 0
  ) {
    items.push({
      id: "bank-mentioned",
      label: hi ? "बताया गया बैंक" : "Bank mentioned",
      value: draft.mentionedInstitutions.join(", "),
    });
  }
  return items;
}

export function getPostReportActions(
  draft: IncidentDraft,
  locale: UiLocale,
): PostReportAction[] {
  const hi = locale === "hi";
  const hasFinancialLoss =
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "YES";
  const isAccountCompromise =
    /profile hacking|account takeover|account compromise/i.test(
      `${draft.classification.subCategory ?? ""} ${draft.citizenSummary.incidentLabel}`,
    ) ||
    Boolean(draft.adaptiveFacts.affectedAccount) ||
    Boolean(draft.adaptiveFacts.accountAccessStatus);

  if (hasFinancialLoss) {
    return [
      {
        id: "call-1930",
        text: hi
          ? "यदि आपने अभी तक नहीं किया है, तो तुरंत 1930 पर कॉल करें।"
          : "Call 1930 promptly if you have not already.",
        href: "tel:1930",
      },
      {
        id: "keep-transactions",
        text: draft.transactions.length > 1
          ? hi
            ? "रिपोर्ट किए गए सभी लेन-देन के संदर्भ और बैंक से हुई बातचीत तैयार रखें।"
            : "Keep the references for all reported transactions and bank communication available."
          : hi
            ? "लेन-देन संदर्भ और बैंक से हुई बातचीत तैयार रखें।"
            : "Keep the transaction reference and bank communication available.",
      },
      {
        id: "preserve-evidence",
        text: hi
          ? "धोखाधड़ी से जुड़े संदेश, लिंक, फोन नंबर और स्क्रीनशॉट सुरक्षित रखें।"
          : "Preserve the messages, links, phone numbers and screenshots connected to the fraud.",
      },
    ];
  }

  if (isAccountCompromise) {
    const platform = draft.adaptiveFacts.platform ?? draft.classification.platform;
    return [
      {
        id: "account-recovery",
        text: hi
          ? `${platform ?? "प्रभावित प्लेटफ़ॉर्म"} की आधिकारिक खाता-रिकवरी प्रक्रिया शुरू करें।`
          : `Start ${platform ? `${platform}'s` : "the affected platform's"} official account-recovery process.`,
      },
      {
        id: "secure-email",
        text: hi
          ? "प्रभावित खाते से जुड़े ईमेल खाते को सुरक्षित करें।"
          : "Secure the email account connected to the compromised account.",
      },
      {
        id: "review-security",
        text: hi
          ? "हाल की लॉगिन या सुरक्षा गतिविधि देखें और संदिग्ध सूचनाएँ सुरक्षित रखें।"
          : "Review recent security or login activity and preserve suspicious notifications.",
      },
    ];
  }

  if (
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "NO"
  ) {
    return [
      {
        id: "do-not-share",
        text: hi
          ? "बैंक विवरण, पहचान दस्तावेज़, OTP या भुगतान साझा न करें।"
          : "Do not send bank details, identity documents, OTPs or payment.",
      },
      {
        id: "block-contact",
        text: hi
          ? "भेजने वाले से आगे का संपर्क ब्लॉक करें।"
          : "Block further contact from the sender.",
      },
      {
        id: "preserve-contact",
        text: hi
          ? "रिपोर्टिंग के लिए संदेश, फोन नंबर या प्रोफ़ाइल सुरक्षित रखें।"
          : "Preserve the message, phone number or profile if you need it for reporting.",
      },
    ];
  }

  return [
    {
      id: "secure-service",
      text: hi
        ? "प्रभावित खाते, उपकरण या जानकारी को संबंधित आधिकारिक सेवा से सुरक्षित करें।"
        : "Secure the affected account, device or information through the relevant official service.",
    },
    {
      id: "preserve-records",
      text: hi
        ? "मूल संदेश, सूचनाएँ और अन्य सबूत सुरक्षित रखें।"
        : "Preserve the original messages, notifications and other evidence.",
    },
  ];
}

export function getPostReportProcessExplanation(
  draft: IncidentDraft,
  locale: UiLocale,
): PostReportProcessExplanation {
  const hi = locale === "hi";
  const possibleNextSteps = [
    hi
      ? "यदि आधिकारिक NCRP प्रक्रिया के माध्यम से जमा किया जाए, तो ट्रैक की जा सकने वाली शिकायत को पावती या संदर्भ मिल सकता है।"
      : "If submitted through the official NCRP process, a trackable complaint can receive an acknowledgement or reference.",
    hi
      ? "शिकायत को संबंधित राज्य या केंद्रशासित प्रदेश की कानून-प्रवर्तन एजेंसी संभाल सकती है।"
      : "The complaint may then be handled by the relevant State or UT law-enforcement agency.",
  ];
  if (
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "YES"
  ) {
    possibleNextSteps.push(
      hi
        ? "वित्तीय धोखाधड़ी की शिकायत में आधिकारिक धोखाधड़ी-प्रतिक्रिया प्रणाली के माध्यम से वित्तीय संस्थाएँ भी शामिल हो सकती हैं।"
        : "A financial-fraud complaint may also involve financial institutions through the official fraud-response system.",
    );
  }
  return {
    knownNow: [
      hi
        ? "आपकी रिपोर्ट इस प्रोटोटाइप में दर्ज की गई है।"
        : "Your report has been recorded in this prototype.",
    ],
    possibleNextSteps,
  };
}

export function getPostSubmissionTimeline(
  draft: IncidentDraft,
  locale: UiLocale,
  isDemoIncident: boolean,
  milestones: PostReportMilestones,
): IncidentTimelineEvent[] {
  const hi = locale === "hi";
  const baseEvents = deriveIncidentTimeline(draft, { locale, isDemoIncident })
    .filter((event) => !/transaction/.test(event.id))
    .map((event) => ({
      ...event,
      sourceRefs: event.sourceRefs.map((source) => ({
        ...source,
        label: /^(Source:|स्रोत:)/.test(source.label)
          ? source.label
          : locale === "hi"
            ? `स्रोत: ${source.label}`
            : `Source: ${source.label}`,
      })),
    }));
  const incidentEvent: IncidentTimelineEvent = {
    id: "case-incident-occurred",
    timeLabel: factTimeLabel(
      draft.incident.incidentDate,
      draft.incident.approximateTime,
      locale,
    ),
    title: hi ? "घटना हुई" : "Incident occurred",
    sourceRefs: [
      {
        type: "STATEMENT",
        label: hi ? "स्रोत: नागरिक का बयान" : "Source: Citizen statement",
      },
    ],
  };
  const transactionEvents: IncidentTimelineEvent[] = draft.transactions.map(
    (transaction, index) => ({
      id: `case-transaction-${transaction.id || index}`,
      timeLabel: factTimeLabel(
        transaction.transactionDate,
        transaction.approximateTime,
        locale,
      ),
      title: transaction.amount
        ? hi
          ? `${formatCurrency(transaction.amount)} का लेन-देन`
          : `${formatCurrency(transaction.amount)} transaction`
        : hi
          ? `लेन-देन ${index + 1}`
          : `Transaction ${index + 1}`,
      sourceRefs: [
        {
          type: "TRANSACTION",
          label: hi ? "स्रोत: लेन-देन की जानकारी" : "Source: Transaction information",
        },
      ],
    }),
  );
  const applicationEvents: IncidentTimelineEvent[] = [
    {
      id: "report-prepared",
      timeLabel: formatApplicationTime(milestones.preparedAt, locale),
      title: hi ? "रिपोर्ट तैयार हुई" : "Report prepared",
      sourceRefs: [{ type: "SYSTEM", label: hi ? "स्रोत: सचेत" : "Source: Sachet" }],
    },
    {
      id: "report-reviewed",
      timeLabel: formatApplicationTime(milestones.reviewedAt, locale),
      title: hi ? "रिपोर्ट की जाँच हुई" : "Report reviewed",
      sourceRefs: [{ type: "USER_CONFIRMED", label: hi ? "स्रोत: नागरिक की पुष्टि" : "Source: Citizen confirmation" }],
    },
    {
      id: "report-submitted",
      timeLabel: formatApplicationTime(milestones.submittedAt, locale),
      title: hi ? "रिपोर्ट जमा हुई" : "Report submitted",
      sourceRefs: [{ type: "PROTOTYPE", label: hi ? "स्रोत: प्रोटोटाइप सबमिशन" : "Source: Prototype submission" }],
    },
  ];
  return [incidentEvent, ...baseEvents, ...transactionEvents, ...applicationEvents];
}
