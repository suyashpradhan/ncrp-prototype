import { describe, expect, it } from "vitest";
import {
  applyReportFamily,
  interpretIncidentText,
} from "../incident/classification";
import { createUnknownIncidentDraft } from "../incident/demo-incident";
import { requirementsForIncident } from "../incident/report-requirements";
import type { IncidentDraft } from "../incident/schema";
import { generateNcrpFields } from "../incident/ncrp-mapping";
import { deriveReportGroups } from "../presentation/report-details";
import { deriveFinancialFactsFromText, normalizeIncidentDraft } from "../incident/normalization";

function draftFor(input: string): IncidentDraft {
  const base = createUnknownIncidentDraft();
  const interpreted = interpretIncidentText(input);
  const financialFacts = deriveFinancialFactsFromText(input);
  return normalizeIncidentDraft({
    ...base,
    classification: interpreted.classification,
    adaptiveFacts: interpreted.adaptiveFacts,
    officialMapping: {
      category: interpreted.classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR"
        ? null
        : interpreted.classification.reportFamily,
      categoryLabel: interpreted.classification.category,
      subCategoryLabel: interpreted.classification.subCategory,
      mappingConfidence: interpreted.classification.ambiguity === "NONE" ? "HIGH" : "LOW",
    },
    citizenSummary: {
      incidentLabel: interpreted.classification.subCategory ?? "Incident details not yet known",
      shortSummary: input,
    },
    incident: {
      ...base.incident,
      financialLossState: financialFacts.financialLossState,
      moneyLost: interpreted.classification.moneyLost,
      reportedAmount: interpreted.reportedAmount,
      occurredOn: interpreted.adaptiveFacts.platform,
      narrative: input,
    },
    financialExposure: financialFacts.financialExposure,
    mentionedInstitutions: financialFacts.mentionedInstitutions,
    transactions: financialFacts.transactionAmounts.map((amount, index) => ({
          id: `transaction-${index + 1}`,
          institution: /sbi/i.test(input) ? "SBI" : null,
          currency: "INR",
          paymentMethod: null,
          accountOrUpiId: null,
          transactionIdOrUtr: null,
          amount,
          transactionDate: null,
          approximateTime: null,
          referenceNumber: null,
          status: "KNOWN",
        })),
  });
}

describe("adaptive incident understanding", () => {
  it("routes Instagram account compromise by primary account harm", () => {
    const draft = draftFor("My Instagram account was hacked and the recovery email was changed.");

    expect(draft.classification).toMatchObject({
      reportFamily: "OTHER_CYBER_CRIME",
      category: "Online and Social Media Related Crime",
      subCategory: "Profile Hacking",
      moneyLost: false,
    });
    expect(deriveReportGroups(draft).map((group) => group.id)).not.toContain("TRANSACTIONS");
    expect(requirementsForIncident(draft).map((item) => item.key)).not.toContain("institution");
    expect(generateNcrpFields(draft).map((field) => field.label)).not.toContain("Transaction ID / UTR");
  });

  it("routes an Instagram investment loss to financial fraud and keeps the platform as context", () => {
    const draft = draftFor("I saw an investment offer on Instagram, transferred ₹25,000 and now the person has disappeared.");

    expect(draft.classification.reportFamily).toBe("FINANCIAL_FRAUD");
    expect(draft.incident.reportedAmount).toBe(25_000);
    expect(draft.adaptiveFacts.platform).toBe("Instagram");
    expect(deriveReportGroups(draft).map((group) => group.id)).toContain("TRANSACTIONS");
    expect(requirementsForIncident(draft).map((item) => item.key)).toContain("transactionIdOrUtr");
  });

  it("uses the safe sensitive online path without financial requirements", () => {
    const draft = draftFor("Someone is threatening to share intimate images of a woman online.");

    expect(draft.classification.reportFamily).toBe("WOMEN_CHILDREN_RELATED_CRIME");
    expect(draft.adaptiveFacts.sensitiveEvidenceRedacted).toBe(true);
    expect(deriveReportGroups(draft).map((group) => group.id)).not.toContain("TRANSACTIONS");
    expect(generateNcrpFields(draft).map((field) => field.label)).not.toContain("Amount");
  });

  it("recognises ransomware without showing transaction requirements", () => {
    const draft = draftFor("My laptop files were encrypted and I got a ransom message.");

    expect(draft.classification).toMatchObject({
      reportFamily: "OTHER_CYBER_CRIME",
      subCategory: "Ransomware",
    });
    expect(draft.adaptiveFacts.affectedSystem).toBe("Laptop");
    expect(requirementsForIncident(draft).map((item) => item.key)).not.toContain("transactionIdOrUtr");
    expect(generateNcrpFields(draft).map((field) => field.label)).not.toContain("Victim bank/wallet/merchant");
  });

  it("preserves the existing SBI KYC financial structure", () => {
    const draft = draftFor("I received an SBI KYC message and ₹40,000 was debited.");

    expect(draft.classification.reportFamily).toBe("FINANCIAL_FRAUD");
    expect(draft.classification.subCategory).toBe("Internet Banking Related Fraud");
    expect(draft.incident.reportedAmount).toBe(40_000);
    expect(deriveReportGroups(draft).map((group) => group.id)).toContain("TRANSACTIONS");
  });

  it("does not force a physical offline incident into a cyber form", () => {
    const draft = draftFor("I saw someone physically molesting a girl on the street.");

    expect(draft.classification).toMatchObject({
      reportFamily: "OUT_OF_SCOPE_OR_UNCLEAR",
      ambiguity: "OUT_OF_CYBER_SCOPE",
      cyberElementPresent: false,
    });
    expect(deriveReportGroups(draft)).toEqual([]);
    expect(generateNcrpFields(draft)).toEqual([]);
  });

  it("asks for context instead of guessing from an unfinished sentence", () => {
    const draft = draftFor("Someone was asking for my");

    expect(draft.classification).toMatchObject({
      reportFamily: "OUT_OF_SCOPE_OR_UNCLEAR",
      ambiguity: "INSUFFICIENT_INFORMATION",
    });
  });

  it("requires citizen confirmation when sensitive harm and a financial demand overlap", () => {
    const draft = draftFor("Someone is threatening me with intimate images and demanding ₹20,000.");

    expect(draft.classification).toMatchObject({
      ambiguity: "MULTIPLE_PLAUSIBLE_PATHS",
      requiresCitizenConfirmation: true,
    });
  });

  it("changes deterministic requirements without erasing the shared story", () => {
    const financial = draftFor("I received an SBI KYC message and ₹40,000 was debited.");
    const changed: IncidentDraft = {
      ...financial,
      classification: applyReportFamily("OTHER_CYBER_CRIME", financial.classification),
    };

    expect(changed.incident.narrative).toBe(financial.incident.narrative);
    expect(deriveReportGroups(changed).map((group) => group.id)).not.toContain("TRANSACTIONS");
    expect(requirementsForIncident(changed).map((item) => item.key)).not.toContain("institution");
  });
});
