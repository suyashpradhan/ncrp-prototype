import { describe, expect, it } from "vitest";
import { syntheticCase } from "../data/synthetic-case";
import { reconcileCaseAmounts } from "../domain/reconciliation";
import { simulateNextCaseUpdate } from "../domain/money-path";

describe("case reconciliation", () => {
  it("keeps every money-path event on or after the complaint report", () => {
    const complaintTime = Date.parse(syntheticCase.complaint.reportedAt);

    for (const path of syntheticCase.moneyPaths) {
      for (const event of path.events) {
        expect(Date.parse(event.occurredAt)).toBeGreaterThanOrEqual(complaintTime);
      }
    }
  });

  it("keeps each synthetic money-path history chronological", () => {
    for (const path of syntheticCase.moneyPaths) {
      for (let index = 1; index < path.events.length; index += 1) {
        expect(Date.parse(path.events[index].occurredAt)).toBeGreaterThanOrEqual(
          Date.parse(path.events[index - 1].occurredAt),
        );
      }
    }
  });

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

  it("reconciles the ₹73,000 demo journey after every structured event", () => {
    let caseData = syntheticCase;
    const dates = [25, 26, 27, 28, 29, 30, 31];

    for (const day of dates) {
      caseData = simulateNextCaseUpdate(
        caseData,
        "path-held-io-verification",
        `2026-08-${day}T10:00:00.000Z`,
      );
      expect(reconcileCaseAmounts(caseData).isReconciled).toBe(true);
    }

    const result = reconcileCaseAmounts(caseData);
    expect(result.byFinancialState.INTERIM_CUSTODY).toBe(73_000);
    expect(result.byFinancialState.RESTORATION_PROCESSING).toBe(42_000);
    expect(result.allocatedAmount).toBe(200_000);
  });
});
