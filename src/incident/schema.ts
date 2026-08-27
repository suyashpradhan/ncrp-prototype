import { z } from "zod";

export const ReportFamilySchema = z.enum([
  "FINANCIAL_FRAUD",
  "WOMEN_CHILDREN_RELATED_CRIME",
  "OTHER_CYBER_CRIME",
  "OUT_OF_SCOPE_OR_UNCLEAR",
]);
export type ReportFamily = z.infer<typeof ReportFamilySchema>;

export const IncidentClassificationSchema = z.object({
  reportFamily: ReportFamilySchema,
  category: z.string().nullable(),
  subCategory: z.string().nullable(),
  cyberElementPresent: z.boolean().nullable(),
  moneyLost: z.boolean().nullable(),
  platform: z.string().nullable(),
  ambiguity: z.enum([
    "NONE",
    "INSUFFICIENT_INFORMATION",
    "MULTIPLE_PLAUSIBLE_PATHS",
    "OUT_OF_CYBER_SCOPE",
  ]),
  explanation: z.string().nullable(),
  requiresCitizenConfirmation: z.boolean(),
}).strict();
export type IncidentClassification = z.infer<typeof IncidentClassificationSchema>;

export const AdaptiveIncidentFactsSchema = z.object({
  platform: z.string().nullable(),
  affectedAccount: z.string().nullable(),
  accountAccessStatus: z.string().nullable(),
  recoveryInformationChanged: z.boolean().nullable(),
  affectedSystem: z.string().nullable(),
  filesEncrypted: z.boolean().nullable(),
  ransomMessagePresent: z.boolean().nullable(),
  sensitiveEvidenceRedacted: z.boolean().nullable(),
}).strict();
export type AdaptiveIncidentFacts = z.infer<typeof AdaptiveIncidentFactsSchema>;

export const IncidentDraftSchema = z.object({
  classification: IncidentClassificationSchema,
  adaptiveFacts: AdaptiveIncidentFactsSchema,
  citizenSummary: z.object({
    incidentLabel: z.string(),
    shortSummary: z.string(),
  }),
  officialMapping: z.object({
    category: ReportFamilySchema.nullable(),
    categoryLabel: z.string().nullable(),
    subCategoryLabel: z.string().nullable(),
    mappingConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  }),
  incident: z.object({
    moneyLost: z.boolean().nullable(),
    reportedAmount: z.number().positive().nullable(),
    incidentDate: z.string().nullable(),
    incidentDateWithoutYear: z.string().regex(/^\d{2}-\d{2}$/).nullable(),
    approximateTime: z.string().nullable(),
    delayInReporting: z.boolean().nullable(),
    delayReason: z.string().nullable(),
    occurredOn: z.string().nullable(),
    narrative: z.string().nullable(),
  }),
  transactions: z.array(z.object({
    institution: z.string().nullable(),
    accountOrUpiId: z.string().nullable(),
    transactionIdOrUtr: z.string().nullable(),
    amount: z.number().nullable(),
    transactionDate: z.string().nullable(),
    approximateTime: z.string().nullable(),
    referenceNumber: z.string().nullable(),
  })),
  suspectIdentifiers: z.array(z.object({
    type: z.enum([
      "PHONE",
      "EMAIL",
      "URL",
      "UPI_ID",
      "SOCIAL_HANDLE",
      "NAME",
      "OTHER",
    ]),
    value: z.string(),
  })),
  evidence: z.array(z.object({
    type: z.enum([
      "CHAT_SCREENSHOT",
      "TRANSACTION_SCREENSHOT",
      "VOICE_STATEMENT",
      "OTHER",
    ]),
    extractedFacts: z.array(z.string()),
  })),
  missingRequiredFields: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type IncidentDraft = z.infer<typeof IncidentDraftSchema>;

export const TranscriptionResultSchema = z.object({
  originalTranscript: z.string(),
  englishTranscript: z.string(),
  languageCode: z.string(),
});

export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;
