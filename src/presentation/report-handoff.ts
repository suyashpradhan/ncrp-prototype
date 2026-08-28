import type { ReportedAmountResolution } from "../incident/complaint-case";
import { CITIZEN_DOES_NOT_HAVE } from "./report-details";
import type { IncidentDraft } from "../incident/schema";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import type { UiLocale } from "../i18n/i18n-provider";
import { formatCurrency } from "./format";

export type NextAction = {
  id: string;
  title: string;
  description: string;
};

type HandoffOptions = {
  locale: UiLocale;
  amountResolution: ReportedAmountResolution | null;
};

function formatDate(value: string | null, locale: UiLocale) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTime(value: string | null, locale: UiLocale) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2020, 0, 1, hours, minutes)));
}

function financialContext(draft: IncidentDraft, locale: UiLocale) {
  const context = [
    draft.citizenSummary.incidentLabel,
    draft.officialMapping.subCategoryLabel,
    draft.incident.occurredOn,
  ].join(" ");
  if (/kyc/i.test(context)) {
    return locale === "hi"
      ? "केवाईसी से जुड़े संदेश के बाद"
      : "after a KYC-related message";
  }
  if (/investment|trading/i.test(context)) {
    return locale === "hi"
      ? "ऑनलाइन निवेश प्रस्ताव के बाद"
      : "after an online investment offer";
  }
  return null;
}

export function buildCallBrief(
  draft: IncidentDraft,
  { locale, amountResolution }: HandoffOptions,
): string | null {
  if (
    draft.classification.reportFamily !== "FINANCIAL_FRAUD" ||
    draft.incident.moneyLost !== true
  ) {
    return null;
  }

  const hi = locale === "hi";
  const transaction = draft.transactions[0];
  const hasUnresolvedConflict = Boolean(
    amountResolution?.hasConflict && !amountResolution.selectedAmount,
  );
  const confirmedAmount = hasUnresolvedConflict
    ? null
    : amountResolution?.selectedAmount ??
      transaction?.amount ??
      draft.incident.reportedAmount;
  const date = formatDate(
    draft.incident.incidentDate ?? transaction?.transactionDate ?? null,
    locale,
  );
  const time = formatTime(
    draft.incident.approximateTime ?? transaction?.approximateTime ?? null,
    locale,
  );
  const institution = transaction?.institution?.trim() || null;
  const context = financialContext(draft, locale);
  const reference = transaction?.transactionIdOrUtr;
  const evidence = draft.evidence.filter(
    (item) => item.type !== "VOICE_STATEMENT",
  );
  const lines: string[] = [
    hi
      ? "मुझे वित्तीय साइबर धोखाधड़ी की रिपोर्ट करनी है।"
      : "I want to report a cyber financial fraud.",
  ];

  if (hasUnresolvedConflict) {
    lines.push(
      hi
        ? "लेन-देन की राशि की पुष्टि अभी बाकी है।"
        : "The transaction amount still needs confirmation.",
    );
  } else if (confirmedAmount) {
    const when = [
      date ? (hi ? `${date} को` : `On ${date}`) : null,
      time ? (hi ? `लगभग ${time}` : `at around ${time}`) : null,
    ]
      .filter(Boolean)
      .join(" ");
    const event = hi
      ? `${formatCurrency(confirmedAmount)}${institution ? ` मेरे ${institution} खाते से` : ""} डेबिट हुए${context ? `, ${context}` : ""}।`
      : `${formatCurrency(confirmedAmount)} was debited${institution ? ` from my ${institution} account` : ""}${context ? ` ${context}` : ""}.`;
    lines.push([when, event].filter(Boolean).join(hi ? " " : ", "));
  }

  if (reference && reference !== CITIZEN_DOES_NOT_HAVE) {
    lines.push(
      hi
        ? `लेन-देन संदर्भ: ${reference}।`
        : `Transaction reference: ${reference}.`,
    );
  }

  if (evidence.length > 0) {
    const hasMessage = evidence.some((item) => item.type === "CHAT_SCREENSHOT");
    const hasTransaction = evidence.some(
      (item) => item.type === "TRANSACTION_SCREENSHOT",
    );
    const evidenceLabel = hasMessage && hasTransaction
      ? hi
        ? "संदेश और लेन-देन के सबूत"
        : "message and transaction evidence"
      : hi
        ? "सहायक सबूत"
        : "supporting evidence";
    lines.push(
      hi
        ? `मेरे पास ${evidenceLabel} उपलब्ध हैं।`
        : `I have the ${evidenceLabel} available.`,
    );
  }

  return sanitizeSensitiveText(lines.join("\n\n")).text;
}

export function getNextActions(
  draft: IncidentDraft,
  locale: UiLocale,
): NextAction[] {
  const hi = locale === "hi";
  const family = draft.classification.reportFamily;
  if (family === "OUT_OF_SCOPE_OR_UNCLEAR") return [];

  if (family === "FINANCIAL_FRAUD") {
    const actions: NextAction[] = [];
    if (draft.incident.moneyLost === true) {
      actions.push({
        id: "call-1930",
        title: hi ? "1930 पर कॉल करें" : "Call 1930",
        description: hi
          ? "वित्तीय धोखाधड़ी की तुरंत रिपोर्ट करें।"
          : "Report the financial fraud promptly.",
      });
    }
    actions.push(
      {
        id: "contact-bank",
        title: hi ? "अपने बैंक से संपर्क करें" : "Contact your bank",
        description: hi
          ? "बैंक या भुगतान सेवा के आधिकारिक धोखाधड़ी सहायता माध्यम का उपयोग करें।"
          : "Use its official fraud-support channel and keep the transaction reference ready.",
      },
      {
        id: "preserve-evidence",
        title: hi ? "सबूत संभालकर रखें" : "Keep your evidence",
        description: hi
          ? "संदेश, लेन-देन रिकॉर्ड और संदिग्ध की उपलब्ध जानकारी सुरक्षित रखें।"
          : "Preserve messages, transaction records and available suspect details.",
      },
    );
    return actions.slice(0, 3);
  }

  if (family === "WOMEN_CHILDREN_RELATED_CRIME") {
    return [
      {
        id: "preserve-identifiers",
        title: hi ? "जरूरी जानकारी सुरक्षित रखें" : "Preserve relevant details",
        description: hi
          ? "संबंधित URL, उपयोगकर्ता नाम और संदेश की जानकारी सुरक्षित रखें।"
          : "Keep relevant URLs, usernames and message information.",
      },
      {
        id: "avoid-sharing",
        title: hi ? "सामग्री आगे न भेजें" : "Avoid redistributing material",
        description: hi
          ? "संवेदनशील सामग्री को अनावश्यक रूप से आगे साझा न करें।"
          : "Do not unnecessarily forward or redistribute sensitive material.",
      },
      {
        id: "immediate-danger",
        title: hi ? "तत्काल खतरे में मदद लें" : "Seek help for immediate danger",
        description: hi
          ? "यदि कोई तत्काल शारीरिक खतरे में है, तो उचित आपातकालीन या पुलिस सहायता लें।"
          : "If someone is in immediate physical danger, seek appropriate emergency or police help.",
      },
    ];
  }

  const categoryText = [
    draft.classification.subCategory,
    draft.officialMapping.subCategoryLabel,
    draft.citizenSummary.incidentLabel,
  ].join(" ");
  if (/ransomware|ransom|encrypted/i.test(categoryText)) {
    return [
      {
        id: "preserve-ransom",
        title: hi ? "रैनसम संदेश सुरक्षित रखें" : "Preserve the ransom message",
        description: hi ? "संबंधित सबूत सुरक्षित रखें।" : "Keep the related evidence available.",
      },
      {
        id: "avoid-deleting",
        title: hi ? "सबूत न मिटाएँ" : "Avoid deleting evidence",
        description: hi
          ? "घटना से जुड़ी फाइलों और संदेशों को न मिटाएँ।"
          : "Do not delete files or messages related to the incident.",
      },
      {
        id: "use-report",
        title: hi ? "तैयार रिपोर्ट का उपयोग करें" : "Use the prepared report",
        description: hi
          ? "साइबर घटना की रिपोर्ट करते समय तैयार जानकारी साथ रखें।"
          : "Keep the prepared information available when reporting the incident.",
      },
    ];
  }

  return [
    {
      id: "account-recovery",
      title: hi ? "आधिकारिक खाता रिकवरी का उपयोग करें" : "Use official account recovery",
      description: hi
        ? "प्लेटफ़ॉर्म की आधिकारिक खाता रिकवरी प्रक्रिया का उपयोग करें।"
        : "Use the platform’s official account-recovery process.",
    },
    {
      id: "secure-credentials",
      title: hi ? "जुड़े खाते सुरक्षित करें" : "Secure associated accounts",
      description: hi
        ? "जुड़ा ईमेल या खाता सुरक्षित करें और प्रभावित पासवर्ड बदलें।"
        : "Secure the associated email or account and change compromised credentials.",
    },
    {
      id: "preserve-account-evidence",
      title: hi ? "सबूत संभालकर रखें" : "Preserve account evidence",
      description: hi
        ? "स्क्रीनशॉट, प्रोफ़ाइल URL, उपयोगकर्ता नाम और संबंधित संदेश सुरक्षित रखें।"
        : "Keep screenshots, profile URLs, usernames and relevant messages.",
    },
  ];
}
