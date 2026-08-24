import { describe, expect, it } from "vitest";
import { syntheticCase } from "../data/synthetic-case";
import { simulateNextMoneyPathEvent } from "../domain/money-path";
import {
  deriveCitizenAction,
  deriveCurrentOwner,
  deriveCurrentStage,
  deriveFinancialOutcome,
  deriveLegalOutcome,
} from "../sop/selectors";

describe("synthetic case-player transitions", () => {
  it("moves the ₹73,000 path by appending events and deriving each new state", () => {
    const original = syntheticCase.moneyPaths.find((path) => path.id === "path-held-io-verification")!;
    const response = simulateNextMoneyPathEvent(original, "2026-08-25T10:00:00.000Z");
    const approval = simulateNextMoneyPathEvent(response, "2026-08-26T10:00:00.000Z");
    const bondRequired = simulateNextMoneyPathEvent(approval, "2026-08-27T10:00:00.000Z");
    const direction = simulateNextMoneyPathEvent(bondRequired, "2026-08-28T10:00:00.000Z");
    const bank = simulateNextMoneyPathEvent(direction, "2026-08-29T10:00:00.000Z");
    const confirmed = simulateNextMoneyPathEvent(bank, "2026-08-30T10:00:00.000Z");

    expect(original.events).toHaveLength(4);
    expect(response.events).toHaveLength(5);
    expect(deriveCurrentStage(response)).toBe("ACCOUNT_HOLDER_RESPONSE");
    expect(deriveCurrentOwner(response)).toBe("ACCOUNT_HOLDER");
    expect(deriveCurrentStage(approval)).toBe("SP_DCP_APPROVAL");
    expect(deriveCurrentStage(bondRequired)).toBe("INDEMNITY_BOND_REQUIRED");
    expect(deriveCitizenAction(bondRequired).code).toBe("SUBMIT_INDEMNITY_BOND");
    expect(deriveCurrentStage(direction)).toBe("BANK_DIRECTION");
    expect(deriveCurrentStage(bank)).toBe("BANK_INTERIM_CUSTODY");
    expect(deriveCurrentOwner(bank)).toBe("BANK");
    expect(deriveCurrentStage(confirmed)).toBe("INTERIM_CUSTODY_CONFIRMED");
    expect(deriveFinancialOutcome(confirmed).state).toBe("INTERIM_CUSTODY");
    expect(deriveLegalOutcome(confirmed).state).toBe(
      "INTERIM_CUSTODY_UNDER_RECORDED_PROCESS",
    );
  });

  it("does not transition a terminal financial state", () => {
    const exited = syntheticCase.moneyPaths.find((path) => path.id === "path-exited-cash-withdrawal")!;
    expect(simulateNextMoneyPathEvent(exited, "2026-08-25T10:00:00.000Z")).toBe(exited);
  });
});
