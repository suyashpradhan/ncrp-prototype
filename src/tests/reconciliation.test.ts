import { describe, expect, it } from "vitest";
import { syntheticCase } from "../data/synthetic-case";
import { reconcileCaseAmounts } from "../domain/reconciliation";
import { simulateNextCaseUpdate } from "../domain/money-path";

describe("case reconciliation", () => {
  it("reconciles all money paths exactly to the reported amount", () => {
    const result = reconcileCaseAmounts(syntheticCase);

    expect(result).toMatchObject({
      reportedAmount: 200_000,
      allocatedAmount: 200_000,
      difference: 0,
      isReconciled: true,
    });
  });

  it("keeps confirmed interim-custody money inside the same case total", () => {
    const updated = simulateNextCaseUpdate(
      syntheticCase,
      "path-bank-interim-custody",
      "2026-08-25T10:00:00.000Z",
    );
    const result = reconcileCaseAmounts(updated);

    expect(result.allocatedAmount).toBe(200_000);
    expect(result.byFinancialState.INTERIM_CUSTODY).toBe(42_000);
    expect(result.isReconciled).toBe(true);
  });
});
