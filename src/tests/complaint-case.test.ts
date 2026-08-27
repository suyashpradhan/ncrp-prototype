import { describe, expect, it } from "vitest";
import {
  allocateSyntheticMoneyPaths,
  buildSyntheticCaseFromComplaint,
  resolveReportedAmount,
} from "../incident/complaint-case";
import { DEMO_INCIDENT_DRAFT } from "../incident/demo-incident";
import { IncidentDraftSchema } from "../incident/schema";
import { reconcileCaseAmounts } from "../domain/reconciliation";
import { deriveJourneyFinancialSummary } from "../presentation/demo-journey";

function liveDraft(amount: number) {
  return IncidentDraftSchema.parse({
    ...DEMO_INCIDENT_DRAFT,
    citizenSummary: {
      incidentLabel: "KYC-related banking fraud",
      shortSummary: "A banking fraud was reported after a KYC message.",
    },
    officialMapping: {
      category: "FINANCIAL_FRAUD",
      categoryLabel: "Online Financial Fraud",
      subCategoryLabel: "Internet Banking Related Fraud",
      mappingConfidence: "HIGH",
    },
    incident: {
      ...DEMO_INCIDENT_DRAFT.incident,
      reportedAmount: amount,
      incidentDate: "2026-08-22",
      incidentDateWithoutYear: null,
      approximateTime: "07:00",
    },
    transactions: [{
      ...DEMO_INCIDENT_DRAFT.transactions[0],
      amount,
      transactionDate: "2026-08-22",
      transactionIdOrUtr: "__CITIZEN_DOES_NOT_HAVE__",
    }],
  });
}

describe("complaint-to-resolution continuity", () => {
  it.each([
    [40_000, [14_600, 8_400, 5_000, 12_000]],
    [25_000, [9_100, 5_300, 3_100, 7_500]],
  ])("allocates every rupee of ₹%i deterministically", (amount, expected) => {
    const portions = allocateSyntheticMoneyPaths(amount);
    expect(portions).toEqual(expected);
    expect(portions.reduce((total, portion) => total + portion, 0)).toBe(amount);
  });

  it.each([40_000, 25_000])(
    "hydrates one coherent ₹%i complaint through the four process paths",
    (amount) => {
      const submittedAt = "2026-08-26T10:00:00.000Z";
      const built = buildSyntheticCaseFromComplaint({
        incidentDraft: liveDraft(amount),
        syntheticCitizen: { displayName: "Asha Verma" },
        acknowledgementId: "NCRP-DEMO-2026-00124",
        submittedAt,
        caseOrigin: "LIVE_TEST",
      });
      const reconciliation = reconcileCaseAmounts(built.caseData);
      const summary = deriveJourneyFinancialSummary(built.caseData);

      expect(built.caseData.caseOrigin).toBe("LIVE_TEST");
      expect(built.caseData.complaint.reportedAmount).toBe(amount);
      expect(built.caseData.reportedIncident.citizenLabel).toBe(
        "KYC-related banking fraud",
      );
      expect(built.caseData.reportedIncident.officialSubCategoryLabel).toBe(
        "Internet Banking Related Fraud",
      );
      expect(built.caseData.moneyPaths).toHaveLength(4);
      expect(reconciliation.allocatedAmount).toBe(amount);
      expect(summary.activeAmount).toBeLessThanOrEqual(amount);
      for (const path of built.caseData.moneyPaths) {
        for (const event of path.events) {
          expect(new Date(event.occurredAt).getTime()).toBeGreaterThanOrEqual(
            new Date(submittedAt).getTime(),
          );
        }
      }
    },
  );

  it("requires an explicit choice when statement and transactions materially disagree", () => {
    const conflicting = IncidentDraftSchema.parse({
      ...liveDraft(40_000),
      incident: { ...liveDraft(40_000).incident, reportedAmount: 25_000 },
    });
    expect(resolveReportedAmount(conflicting)).toMatchObject({
      statementAmount: 25_000,
      transactionAmount: 40_000,
      selectedAmount: null,
      hasConflict: true,
    });
    expect(resolveReportedAmount(conflicting, 40_000).selectedAmount).toBe(40_000);
  });
});
