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
