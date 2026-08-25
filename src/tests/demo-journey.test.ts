import { describe, expect, it } from "vitest";
import { syntheticCase } from "../data/synthetic-case";
import { simulateNextCaseUpdate } from "../domain/money-path";
import {
  DEMO_RESTORATION_REQUEST_ID,
  deriveJourneyFinancialSummary,
  deriveJourneyTrail,
} from "../presentation/demo-journey";
import { DEMO_CASE_ACCESS } from "../components/demo-case/demo-case-provider";

describe("continuous synthetic citizen journey", () => {
  it("uses the same complaint and restoration identifiers throughout", () => {
    expect(syntheticCase.complaint.acknowledgementId).toBe(
      DEMO_CASE_ACCESS.acknowledgementNumber,
    );
    expect(DEMO_RESTORATION_REQUEST_ID).toBe("MRM-DEMO-2026-00182");
  });

  it("derives the financial trail from the same four money paths as the case", () => {
    const trail = deriveJourneyTrail(syntheticCase);

    expect(trail.map(({ amount, state, institutionName }) => ({
      amount,
      state,
      institutionName,
    }))).toEqual([
      { amount: 73_000, state: "HELD", institutionName: "Bank B" },
      { amount: 42_000, state: "HELD", institutionName: "Bank A" },
      { amount: 25_000, state: "EXITED", institutionName: "Synthetic cash-withdrawal trail" },
      { amount: 60_000, state: "NOT_SECURED", institutionName: null },
    ]);

    expect(trail.reduce((total, item) => total + item.amount, 0)).toBe(200_000);
  });

  it("keeps the restoration amount aligned with active case reconciliation", () => {
    expect(deriveJourneyFinancialSummary(syntheticCase)).toEqual({
      reportedAmount: 200_000,
      activeAmount: 115_000,
      receivedAmount: 0,
      exitedAmount: 25_000,
      notSecuredAmount: 60_000,
    });
  });

  it("leaves the original case unchanged after synthetic process updates", () => {
    let updatedCase = syntheticCase;
    for (const day of [25, 26, 27, 28, 29, 30, 31]) {
      updatedCase = simulateNextCaseUpdate(
        updatedCase,
        "path-held-io-verification",
        `2026-08-${day}T10:00:00.000Z`,
      );
    }

    expect(deriveJourneyFinancialSummary(updatedCase).receivedAmount).toBe(73_000);
    expect(deriveJourneyFinancialSummary(syntheticCase)).toMatchObject({
      activeAmount: 115_000,
      receivedAmount: 0,
    });
    expect(syntheticCase.moneyPaths[0].events).toHaveLength(4);
  });
});
