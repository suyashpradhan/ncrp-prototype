import type {
  AdaptiveIncidentFacts,
  IncidentClassification,
  ReportFamily,
} from "./schema";
import { deriveFinancialFactsFromText } from "./normalization";

export type DeterministicIncidentInterpretation = {
  classification: IncidentClassification;
  adaptiveFacts: AdaptiveIncidentFacts;
  reportedAmount: number | null;
};

const EMPTY_ADAPTIVE_FACTS: AdaptiveIncidentFacts = {
  platform: null,
  affectedAccount: null,
  accountAccessStatus: null,
  recoveryInformationChanged: null,
  affectedSystem: null,
  filesEncrypted: null,
  ransomMessagePresent: null,
  accountCompromiseBasis: null,
  sensitiveEvidenceRedacted: null,
};

const FAMILY_LABELS: Record<Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">, string> = {
  FINANCIAL_FRAUD: "Financial Fraud",
  WOMEN_CHILDREN_RELATED_CRIME: "Women / Children Related Crime",
  OTHER_CYBER_CRIME: "Other Cyber Crime",
};

export function reportFamilyLabel(reportFamily: ReportFamily): string | null {
  return reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR"
    ? null
    : FAMILY_LABELS[reportFamily];
}

function amountFromText(text: string): number | null {
  const match = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)|([\d,]+)\s*(?:rupees?|रुपये)/i);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) return null;
  const amount = Number(raw.replaceAll(",", ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function platformFromText(text: string): string | null {
  if (/instagram/i.test(text)) return "Instagram";
  if (/whats?app/i.test(text)) return "WhatsApp";
  if (/telegram/i.test(text)) return "Telegram";
  if (/facebook/i.test(text)) return "Facebook";
  if (/e-?mail/i.test(text)) return "Email";
  if (/\b(?:sms|text message)\b/i.test(text)) return "SMS / text message";
  return null;
}

function classification(
  reportFamily: ReportFamily,
  values: Partial<Omit<IncidentClassification, "reportFamily">>,
): IncidentClassification {
  return {
    reportFamily,
    category: reportFamilyLabel(reportFamily),
    subCategory: null,
    cyberElementPresent: null,
    moneyLost: null,
    platform: null,
    ambiguity: "NONE",
    explanation: null,
    requiresCitizenConfirmation: false,
    ...values,
  };
}

/**
 * A conservative deterministic baseline for the representative prototype cases.
 * Live interpretation still uses one structured OpenAI response; this function
 * makes routing policy testable and provides a safe, non-legal fallback boundary.
 */
export function interpretIncidentText(input: string): DeterministicIncidentInterpretation {
  const text = input.trim();
  const lower = text.toLowerCase();
  const financialFacts = deriveFinancialFactsFromText(text);
  const mentionedAmount = amountFromText(text);
  const reportedAmount = financialFacts.reportedAmount;
  const platform = platformFromText(text);
  const cyberTerms = /online|cyber|digital|internet|account|profile|instagram|whats?app|telegram|facebook|email|message|link|website|app|laptop|computer|files?|ransom/i;
  const sensitiveTerms = /intimate images?|private images?|nude|sexual|woman|girl/i;
  const paymentDemand = /demand(?:ing|ed)?|asking.*(?:pay|₹|rs\.?|rupees?)|blackmail/i.test(lower) && mentionedAmount !== null;
  const financialHarm = financialFacts.financialLossState === "YES";
  const financialTargeting = /lottery|prize|won\b|bank details?|aadhaar|aadhar|otp|upi collect|payment link|kyc/i.test(lower);

  if (text.split(/\s+/).length < 5 || /\b(?:asking for my|someone was asking for my)\s*$/i.test(text)) {
    return {
      classification: classification("OUT_OF_SCOPE_OR_UNCLEAR", {
        ambiguity: "INSUFFICIENT_INFORMATION",
        explanation: "There is not enough incident context to suggest a reporting path.",
      }),
      adaptiveFacts: { ...EMPTY_ADAPTIVE_FACTS, platform },
      reportedAmount,
    };
  }

  if (sensitiveTerms.test(lower) && paymentDemand) {
    return {
      classification: classification("OUT_OF_SCOPE_OR_UNCLEAR", {
        cyberElementPresent: true,
        moneyLost: false,
        platform,
        ambiguity: "MULTIPLE_PLAUSIBLE_PATHS",
        explanation: "The account includes both sensitive online harm and a financial demand.",
        requiresCitizenConfirmation: true,
      }),
      adaptiveFacts: {
        ...EMPTY_ADAPTIVE_FACTS,
        platform,
        sensitiveEvidenceRedacted: true,
      },
      reportedAmount,
    };
  }

  if (/molest|assault|attacked|harassed/.test(lower) && /street|physically|offline/.test(lower) && !cyberTerms.test(lower)) {
    return {
      classification: classification("OUT_OF_SCOPE_OR_UNCLEAR", {
        cyberElementPresent: false,
        ambiguity: "OUT_OF_CYBER_SCOPE",
        explanation: "No online, cyber or digital element was described.",
      }),
      adaptiveFacts: { ...EMPTY_ADAPTIVE_FACTS },
      reportedAmount,
    };
  }

  // Primary financial harm wins over the platform used to make contact.
  if (financialHarm || financialTargeting) {
    const subCategory = /lottery|prize|won\b/.test(lower)
      ? "Online Lottery Scam"
      : /investment|trading/.test(lower)
      ? "Investment / Trading Fraud"
      : /kyc|bank|debited|transferred/.test(lower)
        ? "Internet Banking Related Fraud"
        : "Online Financial Fraud";
    return {
      classification: classification("FINANCIAL_FRAUD", {
        category: "Financial Fraud",
        subCategory,
        cyberElementPresent: true,
        moneyLost: financialFacts.financialLossState === "UNKNOWN"
          ? null
          : financialFacts.financialLossState === "YES",
        platform,
        explanation: financialHarm
          ? "The primary reported harm is a financial loss through a digital interaction."
          : "The account describes a financial scam or request for sensitive financial information.",
      }),
      adaptiveFacts: { ...EMPTY_ADAPTIVE_FACTS, platform },
      reportedAmount,
    };
  }

  if (sensitiveTerms.test(lower) && cyberTerms.test(lower)) {
    return {
      classification: classification("WOMEN_CHILDREN_RELATED_CRIME", {
        category: "Women / Children Related Crime",
        subCategory: "Online abusive-content report",
        cyberElementPresent: true,
        moneyLost: false,
        platform,
        explanation: "The primary reported harm concerns sensitive content shared or threatened online.",
      }),
      adaptiveFacts: {
        ...EMPTY_ADAPTIVE_FACTS,
        platform,
        sensitiveEvidenceRedacted: true,
      },
      reportedAmount,
    };
  }

  if (/encrypt(?:ed|ion)|ransom(?:ware)?/.test(lower)) {
    return {
      classification: classification("OTHER_CYBER_CRIME", {
        category: "Other Cyber Crime",
        subCategory: "Ransomware",
        cyberElementPresent: true,
        moneyLost: false,
        platform,
        explanation: "The shared account describes files or a device affected by ransomware.",
      }),
      adaptiveFacts: {
        ...EMPTY_ADAPTIVE_FACTS,
        platform,
        affectedSystem: /laptop/i.test(text) ? "Laptop" : /computer/i.test(text) ? "Computer" : null,
        filesEncrypted: /encrypt(?:ed|ion)/i.test(text) ? true : null,
        ransomMessagePresent: /ransom message|ransomware/i.test(text) ? true : null,
      },
      reportedAmount,
    };
  }

  if (/hack(?:ed|ing)|account takeover|lost access|cannot access|can't access/.test(lower) && /account|profile|instagram|facebook|social|gmail|email/.test(lower)) {
    const handle = text.match(/@[a-z0-9._]+/i)?.[0] ?? null;
    return {
      classification: classification("OTHER_CYBER_CRIME", {
        category: "Online and Social Media Related Crime",
        subCategory: "Profile Hacking",
        cyberElementPresent: true,
        moneyLost: false,
        platform,
        explanation: "The primary reported harm is loss of access to an online account.",
      }),
      adaptiveFacts: {
        ...EMPTY_ADAPTIVE_FACTS,
        platform,
        affectedAccount: handle,
        accountAccessStatus: /lost access|cannot access|can't access|hacked/i.test(text) ? "Lost" : null,
        recoveryInformationChanged: /recovery (?:email|phone|information).*(?:changed|removed)|changed.*recovery/i.test(text) ? true : null,
        accountCompromiseBasis: /recovery (?:email|phone|information).*(?:changed|removed)|changed.*recovery/i.test(text)
          ? "Recovery details changed"
          : /unfamiliar (?:login|security alert)|security alert/i.test(text)
            ? "Unfamiliar login or security alert"
            : /messages?|settings?.*(?:changed|sent)|changed.*(?:messages?|settings?)/i.test(text)
              ? "Messages or settings changed without me"
              : /forgot.*password|password.*forgot/i.test(text)
                ? "I simply forgot the password"
                : null,
      },
      reportedAmount,
    };
  }

  return {
    classification: classification("OUT_OF_SCOPE_OR_UNCLEAR", {
      cyberElementPresent: cyberTerms.test(lower) ? true : null,
      platform,
      ambiguity: "INSUFFICIENT_INFORMATION",
      explanation: "More incident context is needed before suggesting a reporting path.",
    }),
    adaptiveFacts: { ...EMPTY_ADAPTIVE_FACTS, platform },
    reportedAmount,
  };
}

export function applyReportFamily(
  reportFamily: Exclude<ReportFamily, "OUT_OF_SCOPE_OR_UNCLEAR">,
  current: IncidentClassification,
): IncidentClassification {
  return {
    ...current,
    reportFamily,
    category: reportFamilyLabel(reportFamily),
    subCategory: reportFamily === current.reportFamily
      ? current.subCategory
      : reportFamily === "FINANCIAL_FRAUD"
        ? "Online Financial Fraud"
        : reportFamily === "WOMEN_CHILDREN_RELATED_CRIME"
          ? "Online abusive-content report"
          : "Other supported cyber incident",
    ambiguity: "NONE",
    requiresCitizenConfirmation: false,
    explanation: "Reporting path confirmed by the citizen.",
  };
}
