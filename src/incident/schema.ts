import { z } from "zod";

export const IncidentDraftSchema = z.object({
  citizenSummary: z.object({
    incidentLabel: z.string(),
    shortSummary: z.string(),
  }),
  officialMapping: z.object({
    category: z.enum([
      "WOMEN_CHILDREN_RELATED_CRIME",
      "FINANCIAL_FRAUD",
      "OTHER_CYBER_CRIME",
    ]).nullable(),
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
