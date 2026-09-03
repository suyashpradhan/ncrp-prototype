import { IncidentDraftSchema, type IncidentDraft, type TranscriptionResult } from "./schema";

export type DemoNarrationLanguage = "hi-IN" | "en-IN";

export type DemoNarration = TranscriptionResult & {
  label: string;
  nativeLabel: string;
  audioPath: string;
  durationSeconds: number;
};

export const DEMO_NARRATIONS: Record<DemoNarrationLanguage, DemoNarration> = {
  "hi-IN": {
    label: "Hindi",
    nativeLabel: "हिन्दी",
    audioPath: "/demo/audio/kyc-fraud-hi.mp3",
    durationSeconds: 25,
    languageCode: "hi-IN",
    originalTranscript:
      "मुझे एसबीआई केवाईसी अपडेट करने का एक मैसेज आया था। मैंने उसमें दिए लिंक को खोला और ऐप के निर्देश माने। इसके बाद 22 अगस्त की सुबह लगभग सात बजे मेरे खाते से चालीस हजार रुपये निकल गए। बाद में मैंने उस नंबर पर संपर्क करने की कोशिश की, लेकिन कोई जवाब नहीं मिला।",
    englishTranscript:
      "I received a message asking me to update my SBI KYC. I opened the link and followed the app instructions. At about 7 AM on 22 August, ₹40,000 was transferred from my account. I tried contacting the number afterward but received no response.",
  },
  "en-IN": {
    label: "English",
    nativeLabel: "English",
    audioPath: "/demo/audio/kyc-fraud-en.mp3",
    durationSeconds: 24,
    languageCode: "en-IN",
    originalTranscript:
      "I received a message asking me to update my SBI KYC. I opened the link and followed the app instructions. At about 7 AM on 22 August, ₹40,000 was transferred from my account. I tried contacting the number afterward but received no response.",
    englishTranscript:
      "I received a message asking me to update my SBI KYC. I opened the link and followed the app instructions. At about 7 AM on 22 August, ₹40,000 was transferred from my account. I tried contacting the number afterward but received no response.",
  },
};

export const DEMO_TYPED_DESCRIPTION =
  "I received a message claiming my SBI KYC needed to be updated. I followed the instructions and later ₹40,000 was transferred from my account.";

export const DEMO_INCIDENT_DRAFT = {
  classification: {
    reportFamily: "FINANCIAL_FRAUD",
    category: "Financial Fraud",
    subCategory: "Internet Banking Related Fraud",
    cyberElementPresent: true,
    moneyLost: true,
    platform: "SMS / chat message",
    ambiguity: "NONE",
    explanation: "The shared account describes an unauthorised bank transfer after a KYC message.",
    requiresCitizenConfirmation: false,
  },
  adaptiveFacts: {
    platform: "SMS / chat message",
    affectedAccount: null,
    accountAccessStatus: null,
    recoveryInformationChanged: null,
    affectedSystem: null,
    filesEncrypted: null,
    ransomMessagePresent: null,
    accountCompromiseBasis: null,
    sensitiveEvidenceRedacted: null,
  },
  citizenSummary: {
    incidentLabel: "KYC-related banking fraud",
    shortSummary:
      "Asha received a synthetic SBI KYC message, followed its instructions and later found that ₹40,000 had been transferred from her account.",
  },
  officialMapping: {
    category: "FINANCIAL_FRAUD",
    categoryLabel: "Financial Fraud",
    subCategoryLabel: "Internet Banking Related Fraud",
    mappingConfidence: "HIGH",
  },
  incident: {
    financialLossState: "YES",
    moneyLost: true,
    reportedAmount: 40_000,
    incidentDate: "2026-08-22",
    incidentDateWithoutYear: null,
    approximateTime: "07:00",
    delayInReporting: false,
    delayReason: null,
    occurredOn: "SMS / chat message",
    narrative:
      "Asha received a message claiming that the KYC for her SBI account needed to be updated. She opened the supplied link and followed the app instructions. At about 7:05 AM on 22 August 2026, ₹40,000 was transferred from her account. She later tried to contact the sender but received no response.",
  },
  financialExposure: {
    bankDetailsRequested: null,
    identityDocumentRequested: null,
    otpRequested: null,
    paymentLinkReceived: true,
    upiCollectRequestReceived: null,
  },
  mentionedInstitutions: ["SBI"],
  transactions: [
    {
      id: "transaction-1",
      institution: "SBI",
      currency: "INR",
      paymentMethod: "Bank transfer",
      accountOrUpiId: "Synthetic SBI account ending 0024",
      transactionIdOrUtr: "DEMO-UTR-40000-220826",
      amount: 40_000,
      transactionDate: "2026-08-22",
      approximateTime: "07:05",
      referenceNumber: "DEMO-TXN-220826-0705",
      status: "KNOWN",
    },
  ],
  suspectIdentifiers: [
    { type: "PHONE", value: "98XX XX1234" },
    { type: "URL", value: "https://kyc-demo.invalid/update" },
  ],
  evidence: [
    {
      type: "CHAT_SCREENSHOT",
      extractedFacts: [
        "Synthetic KYC message",
        "SBI KYC update was claimed",
        "Sender shown as 98XX XX1234",
        "Safe non-resolving link kyc-demo.invalid",
      ],
    },
    {
      type: "TRANSACTION_SCREENSHOT",
      extractedFacts: [
        "One synthetic transaction of ₹40,000",
        "Transaction dated 22 August 2026 at about 7:05 AM",
        "Synthetic transaction reference is visible",
      ],
    },
  ],
  citizenConfirmedFields: [],
  missingRequiredFields: [],
  warnings: [],
} as const satisfies IncidentDraft;

IncidentDraftSchema.parse(DEMO_INCIDENT_DRAFT);

export function createUnknownIncidentDraft(): IncidentDraft {
  return {
    classification: {
      reportFamily: "OUT_OF_SCOPE_OR_UNCLEAR",
      category: null,
      subCategory: null,
      cyberElementPresent: null,
      moneyLost: null,
      platform: null,
      ambiguity: "INSUFFICIENT_INFORMATION",
      explanation: null,
      requiresCitizenConfirmation: false,
    },
    adaptiveFacts: {
      platform: null,
      affectedAccount: null,
      accountAccessStatus: null,
      recoveryInformationChanged: null,
      affectedSystem: null,
      filesEncrypted: null,
      ransomMessagePresent: null,
      accountCompromiseBasis: null,
      sensitiveEvidenceRedacted: null,
    },
    citizenSummary: { incidentLabel: "Incident details not yet known", shortSummary: "" },
    officialMapping: {
      category: null,
      categoryLabel: null,
      subCategoryLabel: null,
      mappingConfidence: "LOW",
    },
    incident: {
      financialLossState: "UNKNOWN",
      moneyLost: null,
      reportedAmount: null,
      incidentDate: null,
      incidentDateWithoutYear: null,
      approximateTime: null,
      delayInReporting: null,
      delayReason: null,
      occurredOn: null,
      narrative: null,
    },
    financialExposure: {
      bankDetailsRequested: null,
      identityDocumentRequested: null,
      otpRequested: null,
      paymentLinkReceived: null,
      upiCollectRequestReceived: null,
    },
    mentionedInstitutions: [],
    transactions: [],
    suspectIdentifiers: [],
    evidence: [],
    citizenConfirmedFields: [],
    missingRequiredFields: [],
    warnings: [],
  };
}
