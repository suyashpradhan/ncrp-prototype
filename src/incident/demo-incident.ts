import type { IncidentDraft } from "./schema";

export const DEMO_INCIDENT_DRAFT = {
  citizenSummary: {
    incidentLabel: "Investment scam",
    shortSummary:
      "Asha was contacted on WhatsApp about an investment opportunity and made two payments before realising the offer was not genuine.",
  },
  officialMapping: {
    category: "FINANCIAL_FRAUD",
    categoryLabel: "Online Financial Fraud",
    subCategoryLabel: "UPI Related Frauds",
    mappingConfidence: "HIGH",
  },
  incident: {
    moneyLost: true,
    incidentDate: "2026-08-12",
    approximateTime: null,
    delayInReporting: false,
    delayReason: null,
    occurredOn: "WhatsApp",
    narrative:
      "Asha received WhatsApp messages offering an investment opportunity. She made two payments of ₹1,00,000 using UPI / bank transfer. After the payments, the contact stopped responding.",
  },
  transactions: [
    {
      institution: "Demo Bank",
      accountOrUpiId: "asha.demo@upi",
      transactionIdOrUtr: "UTR-DEMO-120826-01",
      amount: 100_000,
      transactionDate: "2026-08-12",
      approximateTime: "09:18",
      referenceNumber: "REF-DEMO-001",
    },
    {
      institution: "Demo Bank",
      accountOrUpiId: "asha.demo@upi",
      transactionIdOrUtr: "UTR-DEMO-120826-02",
      amount: 100_000,
      transactionDate: "2026-08-12",
      approximateTime: "09:42",
      referenceNumber: "REF-DEMO-002",
    },
  ],
  suspectIdentifiers: [
    { type: "PHONE", value: "+91 90000 00124" },
  ],
  evidence: [
    {
      type: "CHAT_SCREENSHOT",
      extractedFacts: [
        "WhatsApp conversation",
        "Investment opportunity was discussed",
        "Contact number +91 90000 00124",
      ],
    },
    {
      type: "TRANSACTION_SCREENSHOT",
      extractedFacts: [
        "Two payments of ₹1,00,000",
        "Payments dated 12 August 2026",
        "Transaction references are visible",
      ],
    },
  ],
  missingRequiredFields: [],
  warnings: [],
} as const satisfies IncidentDraft;

export function createUnknownIncidentDraft(): IncidentDraft {
  return {
    citizenSummary: { incidentLabel: "Incident details not yet known", shortSummary: "" },
    officialMapping: {
      category: null,
      categoryLabel: null,
      subCategoryLabel: null,
      mappingConfidence: "LOW",
    },
    incident: {
      moneyLost: null,
      incidentDate: null,
      approximateTime: null,
      delayInReporting: null,
      delayReason: null,
      occurredOn: null,
      narrative: null,
    },
    transactions: [],
    suspectIdentifiers: [],
    evidence: [],
    missingRequiredFields: [],
    warnings: [],
  };
}
