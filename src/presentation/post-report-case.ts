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
  title: string;
  description: string;
  href?: string;
};

export type ProcessExplainerStage = {
  id: string;
  title: string;
  description: string;
};

export type ProcessExplainer = {
  currentKnownState: {
    title: string;
    description: string;
  };
  possibleNextStagesHeading: string;
  possibleNextStages: ProcessExplainerStage[];
  importantBoundaries: string[];
  keepReady?: string[];
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
  const story = draft.incident.narrative ?? "";
  const explicitlyShared = (subject: RegExp) => {
    return story
      .split(/(?:[.!?;\n]+|\bbut\b|लेकिन|परंतु)/i)
      .some(
        (clause) =>
          subject.test(clause) &&
          /(shared|gave|sent|provided|बताया|दिया|भेजा|साझा)/i.test(clause) &&
          !/(did not|didn't|never|नहीं)\s+(share|give|send|provide|बताया|दिया|भेजा|साझा)/i.test(
            clause,
          ),
      );
  };
  const bankDetailsShared = explicitlyShared(/bank details|account details|बैंक विवरण|खाते? का विवरण/i);
  const identityShared = explicitlyShared(/aadhaar|identity|id document|आधार|पहचान/i);
  const otpShared = explicitlyShared(/otp|one[ -]?time password|ओटीपी/i);
  const hasFinancialLoss =
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "YES";
  const isAccountCompromise =
    /profile hacking|account takeover|account compromise/i.test(
      `${draft.classification.subCategory ?? ""} ${draft.citizenSummary.incidentLabel}`,
    ) ||
    Boolean(draft.adaptiveFacts.affectedAccount) ||
    Boolean(draft.adaptiveFacts.accountAccessStatus);
  const isRansomware = /ransomware/i.test(
    `${draft.classification.subCategory ?? ""} ${draft.citizenSummary.incidentLabel}`,
  ) || Boolean(draft.adaptiveFacts.ransomMessagePresent);
  const isSensitiveAbuse =
    draft.classification.reportFamily === "WOMEN_CHILDREN_RELATED_CRIME";
  const hasEvidence = draft.evidence.some(
    (item) => item.type !== "VOICE_STATEMENT",
  );

  if (draft.classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR") {
    return [
      {
        id: "use-appropriate-service",
        title: hi ? "सही सहायता सेवा से संपर्क करें" : "Use the appropriate support service",
        description: hi
          ? "यह घटना साइबर अपराध रिपोर्टिंग के दायरे से बाहर मानी गई थी। तत्काल खतरे में स्थानीय आपातकालीन या पुलिस सहायता लें।"
          : "This incident was considered outside the cyber-reporting scope. Use local emergency or police support if there is immediate danger.",
      },
      {
        id: "preserve-record",
        title: hi ? "घटना का रिकॉर्ड सुरक्षित रखें" : "Preserve a record of the incident",
        description: hi
          ? "संबंधित संदेश, तस्वीरें या अन्य जानकारी सुरक्षित रखें।"
          : "Keep relevant messages, images or other information available.",
      },
    ];
  }

  if (isSensitiveAbuse) {
    const actions: PostReportAction[] = [
      {
        id: "preserve-threatening-evidence",
        title: hi ? "धमकी वाले संदेश और सबूत सुरक्षित रखें" : "Preserve threatening messages and evidence",
        description: hi
          ? "मूल संदेश, प्रोफ़ाइल, URL और उपलब्ध स्क्रीनशॉट सुरक्षित रखें।"
          : "Keep the original messages, profiles, URLs and available screenshots.",
      },
      {
        id: "avoid-engagement",
        title: hi ? "अनावश्यक बातचीत जारी न रखें" : "Avoid unnecessary continued engagement",
        description: hi
          ? "सबूत सुरक्षित करने के बाद भेजने वाले से संपर्क सीमित या बंद करें।"
          : "After preserving evidence, limit or stop contact with the sender.",
      },
      {
        id: "official-safety-path",
        title: hi ? "संबंधित आधिकारिक रिपोर्टिंग रास्ते का उपयोग करें" : "Use the relevant official reporting path",
        description: hi
          ? "यदि तत्काल शारीरिक खतरा है, तो तुरंत पुलिस या आपातकालीन सहायता लें।"
          : "Seek immediate police or emergency assistance if there is immediate physical danger.",
      },
    ];
    if (draft.incident.financialLossState === "YES") {
      actions.push({
        id: "call-1930",
        title: hi ? "वित्तीय नुकसान के लिए 1930 पर कॉल करें" : "Call 1930 for the financial loss",
        description: hi
          ? "यदि आपने अभी तक नहीं किया है, तो वित्तीय धोखाधड़ी की तत्काल रिपोर्टिंग के लिए राष्ट्रीय हेल्पलाइन का उपयोग करें।"
          : "If you have not already, use the national helpline for urgent financial-fraud reporting.",
        href: "tel:1930",
      });
    }
    return actions;
  }

  if (hasFinancialLoss) {
    const totalLoss = totalReportedLoss(draft);
    const transactionCount = draft.transactions.length;
    const knownReferences = draft.transactions.filter(
      (transaction) =>
        transaction.transactionIdOrUtr &&
        transaction.transactionIdOrUtr !== "__CITIZEN_DOES_NOT_HAVE__",
    ).length;
    return [
      {
        id: "call-1930",
        title: hi ? "यदि अभी तक नहीं किया है, तो तुरंत 1930 पर कॉल करें" : "Call 1930 promptly if you have not already",
        description: hi
          ? "तत्काल वित्तीय धोखाधड़ी रिपोर्टिंग के लिए राष्ट्रीय साइबर-धोखाधड़ी हेल्पलाइन का उपयोग करें।"
          : "Use the national cyber-fraud helpline for urgent financial-fraud reporting.",
        href: "tel:1930",
      },
      {
        id: "keep-transactions",
        title: knownReferences > 0
          ? hi
            ? "लेन-देन के सभी उपलब्ध संदर्भ तैयार रखें"
            : "Keep all available transaction references ready"
          : hi
            ? "लेन-देन की उपलब्ध जानकारी तैयार रखें"
            : "Keep the transaction details you have available",
        description: transactionCount > 0 && totalLoss
          ? hi
            ? `आपने ${transactionCount} लेन-देन में कुल ${formatCurrency(totalLoss)} का नुकसान बताया है।`
            : `You reported ${transactionCount} ${transactionCount === 1 ? "transaction" : "transactions"} totalling ${formatCurrency(totalLoss)}.`
          : hi
            ? "बैंक से हुई बातचीत और आपके पास मौजूद भुगतान विवरण सुरक्षित रखें।"
            : "Keep bank communication and the payment details you have available.",
      },
      {
        id: "contact-bank",
        title: hi ? "अपने बैंक से उसके आधिकारिक माध्यम से संपर्क करें" : "Contact your bank through its official channel",
        description: hi
          ? "उन्हें बताएं कि लेन-देन संदिग्ध साइबर धोखाधड़ी से जुड़ा है।"
          : `Tell them the ${transactionCount === 1 ? "transaction is" : "transactions are"} connected to suspected cyber fraud.`,
      },
      {
        id: "preserve-evidence",
        title: hi ? "भुगतान से जुड़े सबूत सुरक्षित रखें" : "Preserve the evidence connected to the payment",
        description: hasEvidence
          ? hi
            ? "संदेश, लिंक, फोन नंबर, स्क्रीनशॉट और लेन-देन रिकॉर्ड की मूल प्रतियाँ रखें।"
            : "Keep the original messages, links, phone numbers, screenshots and transaction records."
          : hi
            ? "संदेश, लिंक, फोन नंबर और उपलब्ध लेन-देन रिकॉर्ड सुरक्षित रखें।"
            : "Keep messages, links, phone numbers and available transaction records.",
      },
    ];
  }

  if (
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "NO"
  ) {
    const actions: PostReportAction[] = [];
    if (bankDetailsShared || otpShared) {
      actions.push({
        id: "contact-bank-security",
        title: hi ? "संबंधित बैंक से उसके आधिकारिक माध्यम से संपर्क करें" : "Contact the relevant bank through its official channel",
        description: hi
          ? `${otpShared ? "OTP" : "बैंक विवरण"} साझा होने की जानकारी दें और खाते की सुरक्षा की समीक्षा करें।`
          : `Explain that ${otpShared ? "an OTP" : "bank details"} was shared and review your account security.`,
      });
    } else {
      const requestedDetails = [
        draft.financialExposure.bankDetailsRequested ? (hi ? "बैंक विवरण" : "bank details") : null,
        draft.financialExposure.identityDocumentRequested ? (hi ? "पहचान दस्तावेज़" : "identity documents") : null,
        draft.financialExposure.otpRequested ? "OTP" : null,
      ].filter((item): item is string => Boolean(item));
      actions.push({
        id: "do-not-share",
        title: hi ? "पैसे या संवेदनशील बैंकिंग जानकारी न भेजें" : "Do not send money or sensitive banking information",
        description: requestedDetails.length > 0
          ? hi
            ? `इस मामले में कोई वित्तीय नुकसान दर्ज नहीं हुआ। मांगी गई जानकारी (${requestedDetails.join(", ")}) साझा न करें।`
            : `No financial loss was reported. Do not share the requested ${requestedDetails.join(", ")}.`
          : hi
            ? "इस मामले में कोई वित्तीय नुकसान दर्ज नहीं हुआ। आगे पैसे या बैंकिंग जानकारी साझा न करें।"
            : "No financial loss was reported. Do not send money or banking information in further contact.",
      });
    }
    if (identityShared) {
      actions.push({
        id: "record-identity-share",
        title: hi ? "साझा की गई पहचान जानकारी का रिकॉर्ड रखें" : "Keep a record of the identity information shared",
        description: hi
          ? "संदिग्ध आगे के संपर्क पर नज़र रखें, लेकिन पहचान चोरी का अनुमान न लगाएं।"
          : "Watch for suspicious follow-up contact without assuming identity theft has occurred.",
      });
    }
    actions.push(
      {
        id: "block-contact",
        title: hi ? "भेजने वाले से आगे का संपर्क बंद करें" : "Stop further contact with the sender",
        description: hi
          ? "संपर्क में उपयोग किए गए नंबर, प्रोफ़ाइल या खाते को ब्लॉक करें।"
          : "Block the number, profile or account used to contact you.",
      },
      {
        id: "preserve-contact",
        title: hi ? "संदेश और भेजने वाले की जानकारी सुरक्षित रखें" : "Preserve the message and sender details",
        description: hi
          ? "उपलब्ध संदेश, फोन नंबर, प्रोफ़ाइल, URL या स्क्रीनशॉट रखें।"
          : "Keep the message, phone number, profile, URL or screenshot if available.",
      },
    );
    return actions.slice(0, 4);
  }

  if (isRansomware) {
    return [
      {
        id: "disconnect-device",
        title: hi ? "प्रभावित उपकरण को नेटवर्क से अलग करें" : "Disconnect the affected device from networks",
        description: hi
          ? "यदि उपकरण अभी भी प्रभावित है, तो उसे इंटरनेट और साझा नेटवर्क से अलग करें।"
          : "If it is still actively compromised, disconnect it from the internet and shared networks.",
      },
      {
        id: "preserve-ransom-message",
        title: hi ? "फिरौती का संदेश और स्क्रीनशॉट सुरक्षित रखें" : "Preserve the ransom message and screenshots",
        description: hi
          ? "सबूत सुरक्षित होने से पहले संबंधित फ़ाइलें या संदेश न हटाएं।"
          : "Do not delete relevant files or messages before the evidence is safely preserved.",
      },
      {
        id: "official-ransomware-path",
        title: hi ? "संबंधित आधिकारिक रिपोर्टिंग रास्ते का उपयोग करें" : "Use the relevant official reporting path",
        description: hi
          ? "फिरौती न दें और इस पेज की सलाह को विस्तृत मालवेयर हटाने के निर्देश न मानें।"
          : "Do not pay the ransom or treat this guidance as detailed malware-removal instructions.",
      },
    ];
  }

  if (isAccountCompromise) {
    const platform = draft.adaptiveFacts.platform ?? draft.classification.platform;
    return [
      {
        id: "account-recovery",
        title: hi
          ? `${platform ?? "प्रभावित प्लेटफ़ॉर्म"} की आधिकारिक खाता-रिकवरी प्रक्रिया का उपयोग करें`
          : `Use ${platform ? `${platform}'s` : "the affected platform's"} official account-recovery process`,
        description: hi
          ? "रिकवरी सीधे प्रभावित प्लेटफ़ॉर्म की आधिकारिक सेटिंग या सहायता से शुरू करें।"
          : "Start recovery directly through the affected platform's official settings or support.",
      },
      {
        id: "secure-email",
        title: hi ? "इससे जुड़े ईमेल खाते को सुरक्षित करें" : "Secure the email account connected to it",
        description: hi
          ? "आधिकारिक सेटिंग से संदिग्ध क्रेडेंशियल बदलें और खाते की सुरक्षा जाँचें।"
          : "Change compromised credentials and review account security using official settings.",
      },
      {
        id: "review-security",
        title: hi ? "हाल की लॉगिन और सुरक्षा गतिविधि देखें" : "Review recent login and security activity",
        description: hi
          ? "अनजान सत्र, रिकवरी बदलाव या सुरक्षा चेतावनियाँ देखें।"
          : "Look for unfamiliar sessions, recovery changes or security alerts.",
      },
      {
        id: "preserve-account-evidence",
        title: hi ? "खाते से जुड़े सबूत सुरक्षित रखें" : "Preserve account evidence",
        description: hi
          ? "संदिग्ध संदेश, प्रोफ़ाइल URL, ईमेल और सुरक्षा सूचनाएँ रखें।"
          : "Keep suspicious messages, profile URLs, emails and security notifications.",
      },
    ];
  }

  return [
    {
      id: "secure-service",
      title: hi ? "प्रभावित सेवा या उपकरण को सुरक्षित करें" : "Secure the affected service or device",
      description: hi
        ? "संबंधित आधिकारिक सेवा की सुरक्षा या रिकवरी सेटिंग का उपयोग करें।"
        : "Use the relevant official service's security or recovery settings.",
    },
    {
      id: "preserve-records",
      title: hi ? "उपलब्ध सबूत सुरक्षित रखें" : "Preserve the available evidence",
      description: hi
        ? "मूल संदेश, सूचनाएँ और अन्य संबंधित रिकॉर्ड रखें।"
        : "Keep the original messages, notifications and other relevant records.",
    },
  ];
}

function processKeepReadyItems(
  draft: IncidentDraft,
  locale: UiLocale,
  kind:
    | "FINANCIAL_LOSS"
    | "ATTEMPTED_SCAM"
    | "ACCOUNT_COMPROMISE"
    | "RANSOMWARE"
    | "SENSITIVE_ABUSE"
    | "GENERAL",
): string[] {
  const hi = locale === "hi";
  const hasEvidence = draft.evidence.some(
    (item) => item.type !== "VOICE_STATEMENT",
  );
  const hasTransactionReference = draft.transactions.some(
    (transaction) =>
      Boolean(
        transaction.transactionIdOrUtr &&
          transaction.transactionIdOrUtr !== "__CITIZEN_DOES_NOT_HAVE__",
      ),
  );
  const platform =
    draft.adaptiveFacts.platform ?? draft.classification.platform;

  if (kind === "FINANCIAL_LOSS") {
    return [
      hasTransactionReference
        ? hi
          ? "लेन-देन के संदर्भ और विवरण"
          : "Transaction references and details"
        : hi
          ? "आपके पास उपलब्ध लेन-देन की जानकारी"
          : "Any transaction details you have",
      hi ? "बैंक या भुगतान सेवा से हुई बातचीत" : "Bank or payment-service communication",
      hasEvidence
        ? hi
          ? "रिपोर्ट में शामिल संदेश और स्क्रीनशॉट"
          : "Messages and screenshots included with the report"
        : hi
          ? "आपके पास उपलब्ध संबंधित संदेश या स्क्रीनशॉट"
          : "Any relevant messages or screenshots you have",
      hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference",
    ];
  }

  if (kind === "ACCOUNT_COMPROMISE") {
    return [
      platform
        ? hi
          ? `${platform} खाते या प्रोफ़ाइल का विवरण`
          : `${platform} account or profile details`
        : hi
          ? "प्रभावित खाते या प्रोफ़ाइल का विवरण"
          : "Affected account or profile details",
      hi ? "सुरक्षा ईमेल या चेतावनियाँ, यदि मिली हों" : "Any security emails or alerts received",
      hasEvidence
        ? hi
          ? "रिपोर्ट में शामिल स्क्रीनशॉट और संदेश"
          : "Screenshots and messages included with the report"
        : hi
          ? "आपके पास उपलब्ध संबंधित स्क्रीनशॉट या संदेश"
          : "Any relevant screenshots or messages you have",
      hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference",
    ];
  }

  if (kind === "ATTEMPTED_SCAM") {
    const identifiers = new Set(
      draft.suspectIdentifiers.map((identifier) => identifier.type),
    );
    const items: string[] = [];
    if (identifiers.has("PHONE")) {
      items.push(hi ? "भेजने वाले का फोन नंबर" : "Sender phone number");
    }
    if (identifiers.has("SOCIAL_HANDLE")) {
      items.push(hi ? "भेजने वाले की प्रोफ़ाइल" : "Sender profile");
    }
    if (identifiers.has("URL")) {
      items.push(hi ? "संबंधित वेबसाइट या लिंक" : "Relevant website or link");
    }
    items.push(
      hasEvidence
        ? hi
          ? "रिपोर्ट में शामिल संदेश और स्क्रीनशॉट"
          : "Messages and screenshots included with the report"
        : hi
          ? "आपके पास उपलब्ध संबंधित संदेश या स्क्रीनशॉट"
          : "Any relevant messages or screenshots you have",
    );
    if (Object.values(draft.financialExposure).some(Boolean)) {
      items.push(
        hi
          ? "मांगी या साझा की गई जानकारी का रिकॉर्ड"
          : "A record of information requested or shared",
      );
    }
    items.push(hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference");
    return items.slice(0, 4);
  }

  if (kind === "RANSOMWARE") {
    return [
      draft.adaptiveFacts.affectedSystem
        ? hi
          ? `${draft.adaptiveFacts.affectedSystem} से जुड़ी जानकारी`
          : `Information about ${draft.adaptiveFacts.affectedSystem}`
        : hi
          ? "प्रभावित उपकरण या सिस्टम की जानकारी"
          : "Affected device or system information",
      hi ? "फिरौती का संदेश, यदि उपलब्ध हो" : "The ransom message, if available",
      hasEvidence
        ? hi
          ? "रिपोर्ट में शामिल संबंधित स्क्रीनशॉट"
          : "Relevant screenshots included with the report"
        : hi
          ? "आपके पास उपलब्ध संबंधित स्क्रीनशॉट"
          : "Any relevant screenshots you have",
      hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference",
    ];
  }

  if (kind === "SENSITIVE_ABUSE") {
    return [
      hi ? "संबंधित संदेश और खाता विवरण" : "Relevant messages and account details",
      hasEvidence
        ? hi
          ? "रिपोर्ट में शामिल सुरक्षित सबूत"
          : "Safely preserved evidence included with the report"
        : hi
          ? "आपके पास सुरक्षित रखे संबंधित सबूत"
          : "Any relevant evidence you have preserved",
      hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference",
    ];
  }

  return [
    hasEvidence
      ? hi
        ? "रिपोर्ट में शामिल संबंधित सबूत"
        : "Relevant evidence included with the report"
      : hi
        ? "आपके पास उपलब्ध संबंधित जानकारी या सबूत"
        : "Any relevant information or evidence you have",
    hi ? "प्रोटोटाइप रिपोर्ट और संदर्भ" : "Prototype report and reference",
  ];
}

export function getProcessExplainer(
  draft: IncidentDraft,
  locale: UiLocale,
): ProcessExplainer {
  const hi = locale === "hi";
  const family = draft.classification.reportFamily;
  const categoryText = [
    draft.classification.subCategory,
    draft.officialMapping.subCategoryLabel,
    draft.citizenSummary.incidentLabel,
  ]
    .filter(Boolean)
    .join(" ");
  const isRansomware =
    /ransomware|ransom|encrypted/i.test(categoryText) ||
    Boolean(draft.adaptiveFacts.ransomMessagePresent) ||
    Boolean(draft.adaptiveFacts.filesEncrypted);
  const isAccountCompromise =
    /profile hacking|account takeover|account compromise/i.test(categoryText) ||
    Boolean(draft.adaptiveFacts.affectedAccount) ||
    Boolean(draft.adaptiveFacts.accountAccessStatus);
  const currentKnownState = {
    title: hi ? "प्रोटोटाइप रिपोर्ट दर्ज हुई" : "Prototype report recorded",
    description: hi
      ? "आपकी रिपोर्ट इस प्रोटोटाइप में दर्ज की गई है। इसे NCRP या किसी अन्य सरकारी प्रणाली को जमा नहीं किया गया है।"
      : "Your report has been recorded in this prototype. It has not been submitted to NCRP or another government system.",
  };
  const officialHeading = hi
    ? "आधिकारिक प्रक्रिया में संभावित अगले चरण"
    : "Possible next steps in the official process";

  if (
    family === "OUT_OF_SCOPE_OR_UNCLEAR" &&
    draft.classification.ambiguity === "OUT_OF_CYBER_SCOPE"
  ) {
    return {
      currentKnownState,
      possibleNextStagesHeading: hi
        ? "इस घटना के लिए उपयुक्त अगला रास्ता"
        : "The appropriate next path for this incident",
      possibleNextStages: [
        {
          id: "outside-cyber-scope",
          title: hi
            ? "यह घटना साइबर अपराध रिपोर्टिंग प्रक्रिया से बाहर हो सकती है"
            : "This incident may fall outside the cybercrime reporting process",
          description: hi
            ? "घटना के लिए संबंधित आपातकालीन, पुलिस या सेवा माध्यम का उपयोग करें।"
            : "Use the relevant emergency, police or service channel for the incident.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह प्रोटोटाइप रिकॉर्ड इस घटना को आधिकारिक साइबर शिकायत के रूप में स्वीकार किए जाने की पुष्टि नहीं करता।"
          : "This prototype record does not confirm that the incident would be accepted as an official cyber complaint.",
        hi
          ? "यह FIR दर्ज होने या जाँच के परिणाम की पुष्टि नहीं करता।"
          : "It does not confirm FIR registration or an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "GENERAL"),
    };
  }

  if (
    family === "OUT_OF_SCOPE_OR_UNCLEAR" ||
    draft.classification.ambiguity !== "NONE"
  ) {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "सफलतापूर्वक जमा की गई आधिकारिक शिकायत को संदर्भ मिल सकता है।"
            : "A successfully submitted official complaint can receive a reference.",
        },
        {
          id: "authority-review",
          title: hi ? "शिकायत की समीक्षा" : "Complaint review",
          description: hi
            ? "रिपोर्टिंग रास्ते के अनुसार संबंधित प्राधिकरण शिकायत की समीक्षा कर सकता है और अधिक जानकारी मांग सकता है।"
            : "The relevant authority may review the complaint and request more information depending on the reporting path.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह किसी विशेष आधिकारिक रिपोर्टिंग रास्ते की पुष्टि नहीं करता।"
          : "This does not confirm a particular official reporting path.",
        hi
          ? "यह FIR दर्ज होने या जाँच के परिणाम की पुष्टि नहीं करता।"
          : "It does not confirm FIR registration or an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "GENERAL"),
    };
  }

  if (family === "WOMEN_CHILDREN_RELATED_CRIME") {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "सफलतापूर्वक जमा की गई शिकायत को संदर्भ मिल सकता है।"
            : "A successfully submitted complaint can receive a reference.",
        },
        {
          id: "relevant-authority-handling",
          title: hi ? "संबंधित प्राधिकरण द्वारा कार्रवाई" : "Relevant authority handling",
          description: hi
            ? "शिकायत संबंधित कानून-प्रवर्तन प्राधिकरण को भेजी जा सकती है।"
            : "The complaint may be routed to the appropriate law-enforcement authority.",
        },
        {
          id: "additional-information",
          title: hi ? "अतिरिक्त जानकारी" : "Additional information",
          description: hi
            ? "मामले के अनुसार आगे संदेश, खाते का विवरण या सबूत मांगा जा सकता है।"
            : "Further messages, account details or evidence may be requested depending on the case.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह FIR दर्ज होने की पुष्टि नहीं करता।"
          : "This does not confirm that an FIR has been registered.",
        hi
          ? "यह तत्काल पुलिस कार्रवाई या जाँच के परिणाम की पुष्टि नहीं करता।"
          : "It does not confirm immediate police action or an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "SENSITIVE_ABUSE"),
    };
  }

  if (isRansomware) {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "आधिकारिक रिपोर्टिंग प्रक्रिया में शिकायत को संदर्भ मिल सकता है।"
            : "The complaint can receive a reference through the official reporting process.",
        },
        {
          id: "complaint-handling",
          title: hi ? "शिकायत पर कार्रवाई" : "Complaint handling",
          description: hi
            ? "संबंधित कानून-प्रवर्तन प्राधिकरण आगे की कार्रवाई संभाल सकता है।"
            : "The relevant law-enforcement authority may handle subsequent action.",
        },
        {
          id: "technical-evidence",
          title: hi ? "अतिरिक्त तकनीकी सबूत" : "Additional technical evidence",
          description: hi
            ? "मामले के अनुसार उपकरण, फिरौती संदेश या घटना से जुड़े और सबूत मांगे जा सकते हैं।"
            : "Further device, ransom-message or incident evidence may be requested depending on the case.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह डिजिटल फॉरेंसिक जाँच शुरू होने की पुष्टि नहीं करता।"
          : "This does not confirm that digital-forensics work has begun.",
        hi
          ? "यह FIR दर्ज होने या जाँच के परिणाम की पुष्टि नहीं करता।"
          : "It does not confirm FIR registration or an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "RANSOMWARE"),
    };
  }

  if (
    family === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "YES"
  ) {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "आधिकारिक NCRP प्रक्रिया में सफलतापूर्वक जमा की गई शिकायत को पावती या संदर्भ मिल सकता है।"
            : "A complaint successfully submitted through the official NCRP process can receive an acknowledgement or reference.",
        },
        {
          id: "complaint-handling",
          title: hi ? "शिकायत पर कार्रवाई" : "Complaint handling",
          description: hi
            ? "शिकायत आगे की कार्रवाई के लिए संबंधित राज्य या केंद्रशासित प्रदेश की कानून-प्रवर्तन एजेंसी को भेजी जा सकती है।"
            : "The complaint may be routed to the relevant State or UT law-enforcement agency for further action.",
        },
        {
          id: "financial-fraud-response",
          title: hi ? "वित्तीय धोखाधड़ी प्रतिक्रिया" : "Financial-fraud response",
          description: hi
            ? "वित्तीय धोखाधड़ी की शिकायत में आधिकारिक प्रतिक्रिया प्रणाली और वित्तीय संस्थाएँ भी शामिल हो सकती हैं।"
            : "A financial-fraud complaint may also involve the official financial-fraud response system and financial institutions.",
        },
        {
          id: "restoration-or-grievance",
          title: hi ? "बहाली या शिकायत प्रक्रिया" : "Restoration or grievance processes",
          description: hi
            ? "जहाँ लागू हो, बाद में आधिकारिक सरकारी प्रणालियों के माध्यम से बहाली या शिकायत प्रक्रियाएँ प्रासंगिक हो सकती हैं।"
            : "Where applicable, later restoration or grievance processes may become relevant through official government systems.",
        },
      ],
      importantBoundaries: [
        hi
          ? "इसका अर्थ यह नहीं है कि धनराशि फ्रीज़ की गई है।"
          : "This does not mean that funds have been frozen.",
        hi
          ? "यह FIR दर्ज होने की पुष्टि नहीं करता।"
          : "This does not confirm that an FIR has been registered.",
        hi
          ? "यह धनराशि वापस मिलने की पुष्टि नहीं करता।"
          : "This does not confirm that money will be restored.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "FINANCIAL_LOSS"),
    };
  }

  if (isAccountCompromise) {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "सफलतापूर्वक जमा की गई शिकायत को पावती या संदर्भ मिल सकता है।"
            : "A successfully submitted complaint can receive an acknowledgement or reference.",
        },
        {
          id: "complaint-handling",
          title: hi ? "शिकायत पर कार्रवाई" : "Complaint handling",
          description: hi
            ? "शिकायत को संबंधित राज्य या केंद्रशासित प्रदेश की कानून-प्रवर्तन एजेंसी संभाल सकती है।"
            : "The complaint may be handled by the relevant State or UT law-enforcement agency.",
        },
        {
          id: "additional-information",
          title: hi ? "अतिरिक्त जानकारी" : "Additional information",
          description: hi
            ? "मामले के अनुसार शिकायत संभालने वाला प्राधिकरण और जानकारी या सबूत मांग सकता है।"
            : "The authority handling the complaint may require more information or evidence depending on the case.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह खाते की रिकवरी की पुष्टि नहीं करता।"
          : "This does not confirm that the account has been recovered.",
        hi
          ? "यह FIR दर्ज होने या जाँच के परिणाम की पुष्टि नहीं करता।"
          : "This does not confirm FIR registration or an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "ACCOUNT_COMPROMISE"),
    };
  }

  if (
    family === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "NO"
  ) {
    return {
      currentKnownState,
      possibleNextStagesHeading: officialHeading,
      possibleNextStages: [
        {
          id: "official-acknowledgement",
          title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
          description: hi
            ? "ट्रैक की जा सकने वाली शिकायत को पावती या संदर्भ मिल सकता है।"
            : "A trackable complaint can receive an acknowledgement or reference.",
        },
        {
          id: "complaint-handling",
          title: hi ? "शिकायत पर कार्रवाई" : "Complaint handling",
          description: hi
            ? "शिकायत की समीक्षा की जा सकती है या संबंधित राज्य या केंद्रशासित प्रदेश की कानून-प्रवर्तन एजेंसी को भेजा जा सकता है।"
            : "The complaint may be reviewed or routed by the relevant State or UT law-enforcement agency.",
        },
        {
          id: "additional-information",
          title: hi ? "अतिरिक्त जानकारी" : "Additional information",
          description: hi
            ? "ज़रूरत पड़ने पर प्राधिकरण और सबूत या घटना का विवरण मांग सकता है।"
            : "The authority may ask for further evidence or incident details if needed.",
        },
      ],
      importantBoundaries: [
        hi
          ? "यह FIR दर्ज होने की पुष्टि नहीं करता।"
          : "This does not confirm that an FIR has been registered.",
        hi
          ? "यह जाँच के परिणाम की पुष्टि नहीं करता।"
          : "This does not confirm an investigation outcome.",
      ],
      keepReady: processKeepReadyItems(draft, locale, "ATTEMPTED_SCAM"),
    };
  }

  return {
    currentKnownState,
    possibleNextStagesHeading: officialHeading,
    possibleNextStages: [
      {
        id: "official-acknowledgement",
        title: hi ? "आधिकारिक पावती" : "Official acknowledgement",
        description: hi
          ? "सफलतापूर्वक जमा की गई आधिकारिक शिकायत को संदर्भ मिल सकता है।"
          : "A successfully submitted official complaint can receive a reference.",
      },
      {
        id: "authority-review",
        title: hi ? "प्राधिकरण द्वारा समीक्षा" : "Authority review",
        description: hi
          ? "संबंधित प्राधिकरण शिकायत की समीक्षा कर सकता है और मामले के अनुसार अधिक जानकारी मांग सकता है।"
          : "The relevant authority may review the complaint and request more information depending on the case.",
      },
    ],
    importantBoundaries: [
      hi
        ? "यह FIR दर्ज होने या जाँच के परिणाम की पुष्टि नहीं करता।"
        : "This does not confirm FIR registration or an investigation outcome.",
    ],
    keepReady: processKeepReadyItems(draft, locale, "GENERAL"),
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
