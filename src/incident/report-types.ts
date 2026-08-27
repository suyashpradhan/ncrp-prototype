export type NcrpReportType =
  | "WOMEN_CHILDREN_RELATED_CRIME"
  | "FINANCIAL_FRAUD"
  | "OTHER_CYBER_CRIME"
  | "OUT_OF_SCOPE_OR_UNCLEAR";

export type ReportTabId =
  | "INCIDENT"
  | "TRANSACTION"
  | "ACCOUNT_PLATFORM"
  | "EVIDENCE_SUSPECT"
  | "SENSITIVE_EVIDENCE"
  | "SUSPECT"
  | "YOUR_DETAILS"
  | "REPORTING_PREFERENCE";

export type ReportDefinition = {
  id: Exclude<NcrpReportType, "OUT_OF_SCOPE_OR_UNCLEAR">;
  labelKey: string;
  descriptionKey: string;
  allowsAnonymousReporting: boolean;
  tabs: ReportTabId[];
  requirements: string[];
  supportedDemoId: string;
};

export const requirementsByReportType: Record<
  ReportDefinition["id"],
  ReportDefinition
> = {
  FINANCIAL_FRAUD: {
    id: "FINANCIAL_FRAUD",
    labelKey: "reportType.financial",
    descriptionKey: "reportType.financialDescription",
    allowsAnonymousReporting: false,
    tabs: ["INCIDENT", "TRANSACTION", "EVIDENCE_SUSPECT", "YOUR_DETAILS"],
    requirements: ["incident", "transaction", "evidence", "reporter"],
    supportedDemoId: "financial-kyc",
  },
  OTHER_CYBER_CRIME: {
    id: "OTHER_CYBER_CRIME",
    labelKey: "reportType.other",
    descriptionKey: "reportType.otherDescription",
    allowsAnonymousReporting: false,
    tabs: ["INCIDENT", "ACCOUNT_PLATFORM", "EVIDENCE_SUSPECT", "YOUR_DETAILS"],
    requirements: ["incident", "affectedAccount", "platform", "evidence", "reporter"],
    supportedDemoId: "instagram-takeover",
  },
  WOMEN_CHILDREN_RELATED_CRIME: {
    id: "WOMEN_CHILDREN_RELATED_CRIME",
    labelKey: "reportType.womenChildren",
    descriptionKey: "reportType.womenChildrenDescription",
    allowsAnonymousReporting: true,
    tabs: ["INCIDENT", "SENSITIVE_EVIDENCE", "SUSPECT", "REPORTING_PREFERENCE"],
    requirements: ["incident", "sensitiveEvidence", "suspect", "reportingPreference"],
    supportedDemoId: "online-abusive-content",
  },
};

export type RoutingSuggestion = {
  reportType: NcrpReportType;
  suggestedSubCategory: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  signals: string[];
  plausibleReportTypes: ReportDefinition["id"][];
};

const CYBER_SIGNAL = /online|internet|instagram|facebook|social media|account|email|computer|files|link|upi|bank|kyc|card|wallet|app|website|digital|hacked|encrypted|blackmail|intimate images?/i;
const FINANCIAL_SIGNAL = /₹|rs\.?|rupees?|money|payment|paid|transferred|investment|bank|upi|card|wallet|kyc|amount|demanding\s+\d/i;
const SENSITIVE_SIGNAL = /intimate|sexual|sexually|abusive content|woman|women|girl|child|images? without consent|threatening to (?:share|publish)/i;
const COMPROMISE_SIGNAL = /hack|hacked|compromis|cannot log in|can't log in|access lost|recovery email|encrypted|ransomware|account takeover/i;

export function classifyReportDescription(description: string): RoutingSuggestion {
  const text = description.trim();
  const hasCyber = CYBER_SIGNAL.test(text);
  const hasFinancial = FINANCIAL_SIGNAL.test(text);
  const hasSensitive = SENSITIVE_SIGNAL.test(text);
  const hasCompromise = COMPROMISE_SIGNAL.test(text);

  if (!hasCyber) {
    return {
      reportType: "OUT_OF_SCOPE_OR_UNCLEAR",
      suggestedSubCategory: null,
      confidence: "LOW",
      signals: ["No clear online or digital element was described"],
      plausibleReportTypes: [],
    };
  }

  if (hasSensitive && hasFinancial) {
    return {
      reportType: "OUT_OF_SCOPE_OR_UNCLEAR",
      suggestedSubCategory: null,
      confidence: "MEDIUM",
      signals: ["Sensitive online abuse", "Possible financial demand or loss"],
      plausibleReportTypes: ["WOMEN_CHILDREN_RELATED_CRIME", "FINANCIAL_FRAUD"],
    };
  }

  if (hasSensitive) {
    return {
      reportType: "WOMEN_CHILDREN_RELATED_CRIME",
      suggestedSubCategory: "Sexually abusive content",
      confidence: "HIGH",
      signals: ["Online abuse or intimate-content threat"],
      plausibleReportTypes: ["WOMEN_CHILDREN_RELATED_CRIME"],
    };
  }

  if (hasFinancial) {
    return {
      reportType: "FINANCIAL_FRAUD",
      suggestedSubCategory: "Online financial fraud",
      confidence: "HIGH",
      signals: ["Financial loss or transfer was described"],
      plausibleReportTypes: ["FINANCIAL_FRAUD"],
    };
  }

  if (hasCompromise) {
    return {
      reportType: "OTHER_CYBER_CRIME",
      suggestedSubCategory: "Online and Social Media Related Crime",
      confidence: "HIGH",
      signals: ["An online account or system compromise was described"],
      plausibleReportTypes: ["OTHER_CYBER_CRIME"],
    };
  }

  return {
    reportType: "OUT_OF_SCOPE_OR_UNCLEAR",
    suggestedSubCategory: null,
    confidence: "LOW",
    signals: ["The cyber reporting path is unclear"],
    plausibleReportTypes: [],
  };
}
