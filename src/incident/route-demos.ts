import type { NcrpReportType, ReportTabId } from "./report-types";

export type RouteField = { labelKey: string; valueEn: string; valueHi: string };
export type RouteSpecificDraft = {
  id: string;
  reportType: Exclude<NcrpReportType, "FINANCIAL_FRAUD" | "OUT_OF_SCOPE_OR_UNCLEAR">;
  reference: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  anonymous: boolean;
  evidenceKind: "ACCOUNT" | "REDACTED";
  fields: Partial<Record<ReportTabId, RouteField[]>>;
};

export const OTHER_CYBER_DEMO: RouteSpecificDraft = {
  id: "instagram-takeover",
  reportType: "OTHER_CYBER_CRIME",
  reference: "CYBER-DEMO-2026-00125",
  titleEn: "Instagram account takeover",
  titleHi: "इंस्टाग्राम अकाउंट पर कब्ज़ा",
  descriptionEn: "Suyash Pradhan can no longer access the synthetic Instagram account after its recovery email was changed.",
  descriptionHi: "रिकवरी ईमेल बदल दिए जाने के बाद सुयश प्रधान काल्पनिक इंस्टाग्राम अकाउंट में प्रवेश नहीं कर पा रहे हैं।",
  anonymous: false,
  evidenceKind: "ACCOUNT",
  fields: {
    INCIDENT: [
      { labelKey: "route.category", valueEn: "Other Cyber Crime", valueHi: "अन्य साइबर अपराध" },
      { labelKey: "route.subCategory", valueEn: "Online and Social Media Related Crime", valueHi: "ऑनलाइन और सोशल मीडिया से जुड़ा अपराध" },
      { labelKey: "route.incidentDate", valueEn: "24 August 2026 · 21:10", valueHi: "24 अगस्त 2026 · रात 9:10" },
      { labelKey: "route.accessLost", valueEn: "Yes", valueHi: "हाँ" },
    ],
    ACCOUNT_PLATFORM: [
      { labelKey: "route.platform", valueEn: "Instagram", valueHi: "इंस्टाग्राम" },
      { labelKey: "route.affectedAccount", valueEn: "@suyash.demo", valueHi: "@suyash.demo" },
      { labelKey: "route.accessStatus", valueEn: "Cannot access account", valueHi: "अकाउंट में प्रवेश नहीं हो रहा" },
      { labelKey: "route.recoveryChanged", valueEn: "Yes", valueHi: "हाँ" },
      { labelKey: "route.recoveryContact", valueEn: "s•••••@example.invalid", valueHi: "s•••••@example.invalid" },
    ],
    EVIDENCE_SUSPECT: [
      { labelKey: "route.evidence", valueEn: "Synthetic login alert and recovery-change screenshot", valueHi: "काल्पनिक लॉगिन अलर्ट और रिकवरी-बदलाव स्क्रीनशॉट" },
      { labelKey: "route.suspect", valueEn: "Not provided", valueHi: "नहीं दिया गया" },
    ],
    YOUR_DETAILS: [
      { labelKey: "route.name", valueEn: "Suyash Pradhan", valueHi: "सुयश प्रधान" },
      { labelKey: "route.mobile", valueEn: "••••••0024", valueHi: "••••••0024" },
      { labelKey: "route.location", valueEn: "Karnataka · Bengaluru Urban", valueHi: "कर्नाटक · बेंगलुरु अर्बन" },
    ],
  },
};

export const WOMEN_CHILDREN_DEMO: RouteSpecificDraft = {
  id: "online-abusive-content",
  reportType: "WOMEN_CHILDREN_RELATED_CRIME",
  reference: "WC-DEMO-2026-00126",
  titleEn: "Online abusive-content report",
  titleHi: "ऑनलाइन अपमानजनक सामग्री की रिपोर्ट",
  descriptionEn: "A woman reports a non-graphic threat to share intimate content online without consent. No explicit content is included in this demo.",
  descriptionHi: "एक महिला बिना सहमति निजी सामग्री ऑनलाइन साझा करने की धमकी की रिपोर्ट करती है। इस डेमो में कोई स्पष्ट सामग्री शामिल नहीं है।",
  anonymous: true,
  evidenceKind: "REDACTED",
  fields: {
    INCIDENT: [
      { labelKey: "route.category", valueEn: "Women / Children Related Crime", valueHi: "महिला / बच्चों से जुड़ा अपराध" },
      { labelKey: "route.subCategory", valueEn: "Sexually abusive content", valueHi: "यौन उत्पीड़न से जुड़ी सामग्री" },
      { labelKey: "route.incidentDate", valueEn: "25 August 2026 · 18:30", valueHi: "25 अगस्त 2026 · शाम 6:30" },
      { labelKey: "route.occurredOn", valueEn: "Online messaging platform", valueHi: "ऑनलाइन संदेश मंच" },
    ],
    SENSITIVE_EVIDENCE: [
      { labelKey: "route.evidence", valueEn: "REDACTED DEMO EVIDENCE", valueHi: "डेमो सबूत छिपाया गया है" },
      { labelKey: "route.safety", valueEn: "No explicit content is included in this prototype.", valueHi: "इस प्रोटोटाइप में कोई स्पष्ट सामग्री शामिल नहीं है।" },
    ],
    SUSPECT: [
      { labelKey: "route.platform", valueEn: "Online messaging platform", valueHi: "ऑनलाइन संदेश मंच" },
      { labelKey: "route.suspect", valueEn: "Synthetic handle · @redacted.demo", valueHi: "काल्पनिक हैंडल · @redacted.demo" },
      { labelKey: "route.url", valueEn: "redacted-demo.invalid", valueHi: "redacted-demo.invalid" },
    ],
    REPORTING_PREFERENCE: [
      { labelKey: "route.preference", valueEn: "Anonymous report", valueHi: "गुमनाम रिपोर्ट" },
      { labelKey: "route.identity", valueEn: "No citizen identity loaded", valueHi: "नागरिक की पहचान लोड नहीं की गई" },
    ],
  },
};
