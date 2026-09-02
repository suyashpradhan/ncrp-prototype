import { describe, expect, it } from "vitest";
import { interpretIncidentText } from "../incident/classification";
import { createUnknownIncidentDraft } from "../incident/demo-incident";
import { deriveMissingQuestions } from "../incident/missing-information";
import {
  deriveFinancialFactsFromText,
  normalizeIncidentDraft,
} from "../incident/normalization";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import type { IncidentDraft } from "../incident/schema";
import { createEmptyTestProfile } from "../experience/profile";
import { deriveReportGroups } from "../presentation/report-details";

type ScenarioExpectation = {
  expectedFacts: (draft: IncidentDraft) => void;
  expectedAbsence: (draft: IncidentDraft) => void;
  expectedQuestions: string[];
  forbiddenInferences: string[];
};

function draftFor(text: string): IncidentDraft {
  const base = createUnknownIncidentDraft();
  const interpretation = interpretIncidentText(text);
  const financial = deriveFinancialFactsFromText(text);
  return normalizeIncidentDraft({
    ...base,
    classification: interpretation.classification,
    adaptiveFacts: interpretation.adaptiveFacts,
    citizenSummary: {
      incidentLabel: interpretation.classification.subCategory ?? "Reported cyber incident",
      shortSummary: text,
    },
    officialMapping: {
      category: interpretation.classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR"
        ? null
        : interpretation.classification.reportFamily,
      categoryLabel: interpretation.classification.category,
      subCategoryLabel: interpretation.classification.subCategory,
      mappingConfidence: interpretation.classification.ambiguity === "NONE" ? "HIGH" : "LOW",
    },
    incident: {
      ...base.incident,
      financialLossState: financial.financialLossState,
      moneyLost: interpretation.classification.moneyLost,
      reportedAmount: financial.reportedAmount,
      narrative: text,
    },
    financialExposure: financial.financialExposure,
    mentionedInstitutions: financial.mentionedInstitutions,
    transactions: financial.transactionAmounts.map((amount, index) => ({
      id: `transaction-${index + 1}`,
      institution: null,
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

function validateScenario(input: string, expectation: ScenarioExpectation) {
  const draft = draftFor(input);
  expectation.expectedFacts(draft);
  expectation.expectedAbsence(draft);
  expect(deriveMissingQuestions(draft).map((question) => question.field)).toEqual(
    expect.arrayContaining(expectation.expectedQuestions),
  );
  const serialized = JSON.stringify(draft);
  for (const forbidden of expectation.forbiddenInferences) {
    expect(serialized).not.toContain(forbidden);
  }
  return draft;
}

describe("incident reliability invariants", () => {
  it("A: lottery targeting without loss has no transaction requirements", () => {
    const draft = validateScenario(
      "Caller says I won ₹25 lakh and asks for bank details and Aadhaar. I have not paid anything.",
      {
        expectedFacts: (result) => {
          expect(result.classification).toMatchObject({
            reportFamily: "FINANCIAL_FRAUD",
            subCategory: "Online Lottery Scam",
          });
          expect(result.incident.financialLossState).toBe("NO");
          expect(result.financialExposure).toMatchObject({
            bankDetailsRequested: true,
            identityDocumentRequested: true,
          });
        },
        expectedAbsence: (result) => {
          expect(result.transactions).toEqual([]);
          expect(deriveReportGroups(result).map((group) => group.id)).not.toContain("TRANSACTIONS");
        },
        expectedQuestions: [],
        forbiddenInferences: ["HDFC", "current system time"],
      },
    );
    expect(deriveMissingQuestions(draft).map((question) => question.field)).not.toEqual(
      expect.arrayContaining(["transactionAmount", "transactionDate", "institution"]),
    );
  });

  it("B: unknown lottery loss asks only the loss clarification before transaction details", () => {
    const draft = draftFor("Caller says I won ₹25 lakh and asked for my bank details.");
    expect(draft.incident.financialLossState).toBe("UNKNOWN");
    expect(draft.transactions).toEqual([]);
    expect(deriveMissingQuestions(draft)[0]).toMatchObject({
      field: "moneyLost",
      question: "Did any money leave your account or did you make a payment?",
    });
    expect(deriveMissingQuestions(draft).map((question) => question.field)).not.toContain("transactionAmount");
  });

  it("C: a paid lottery processing fee becomes one transaction", () => {
    const draft = draftFor("They said I won ₹25 lakh and asked me to pay ₹10,000 processing fees. I transferred it.");
    expect(draft.incident.financialLossState).toBe("YES");
    expect(draft.transactions.map((transaction) => transaction.amount)).toEqual([10_000]);
    expect(draft.incident.reportedAmount).toBe(10_000);
  });

  it("D/E: preserves component transactions and never adds the stated total twice", () => {
    const twoPayments = draftFor("I paid ₹5,000 and then ₹15,000 because they said the first payment failed.");
    expect(twoPayments.transactions.map((transaction) => transaction.amount)).toEqual([5_000, 15_000]);
    expect(twoPayments.incident.reportedAmount).toBe(20_000);

    const totalAndComponents = draftFor("I lost ₹20,000. First ₹5,000, then ₹15,000.");
    expect(totalAndComponents.transactions.map((transaction) => transaction.amount)).toEqual([5_000, 15_000]);
    expect(totalAndComponents.incident.reportedAmount).toBe(20_000);
  });

  it("F/G: distinguishes an attempted OTP scam from an OTP debit", () => {
    const attempted = draftFor("Caller asked for my OTP but I did not share it and no money was lost.");
    expect(attempted.incident.financialLossState).toBe("NO");
    expect(attempted.financialExposure.otpRequested).toBe(true);
    expect(attempted.transactions).toEqual([]);

    const debit = draftFor("I shared the OTP and ₹5,000 was debited.");
    expect(debit.incident.financialLossState).toBe("YES");
    expect(debit.transactions).toHaveLength(1);
    expect(debit.transactions[0].amount).toBe(5_000);
  });

  it("H: keeps an institution mentioned in the story out of transactions", () => {
    const draft = draftFor("They asked where I wanted the prize deposited. I said Indian Bank. I did not pay anything.");
    expect(draft.mentionedInstitutions).toEqual(["Indian Bank"]);
    expect(draft.transactions).toEqual([]);
    const incidentFields = deriveReportGroups(draft)[0].sections.flatMap((section) => section.fields);
    expect(incidentFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Bank mentioned", value: "Indian Bank" }),
    ]));
  });

  it("I: a Live profile contains no demo identity or location fallbacks", () => {
    const profile = { ...createEmptyTestProfile(), displayName: "Suyash" };
    expect(profile).toMatchObject({ displayName: "Suyash", source: "TEST_INPUT" });
    expect(JSON.stringify(profile)).not.toMatch(/demo|synthetic|test state|test city|0000|example\.invalid/i);
  });

  it("J: redacts assigned secrets but preserves ordinary password language", () => {
    expect(sanitizeSensitiveText("My Instagram password was incorrect after I used the reset link.").text)
      .toBe("My Instagram password was incorrect after I used the reset link.");
    expect(sanitizeSensitiveText("I changed my password during password recovery.").text)
      .toBe("I changed my password during password recovery.");
    expect(sanitizeSensitiveText("My password is hello123.").text)
      .toBe("My password is [redacted].");
    expect(sanitizeSensitiveText("PIN: 1234, CVV = 456, passcode: 9876").text)
      .toBe("PIN: [redacted], CVV = [redacted], passcode: [redacted]");
    expect(sanitizeSensitiveText("transaction reference 123456789012").text)
      .toBe("transaction reference 123456789012");
  });

  it("K: missing transaction time remains null and is not copied from report metadata", () => {
    const draft = draftFor("₹5,000 was debited from my account.");
    expect(draft.transactions[0].approximateTime).toBeNull();
    expect(draft.incident.approximateTime).toBeNull();
    expect(JSON.stringify(draft)).not.toContain("reportGeneratedAt");
  });
});
