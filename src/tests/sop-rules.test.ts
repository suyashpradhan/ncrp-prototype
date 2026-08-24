import { describe, expect, it } from "vitest";
import type { MoneyPath } from "../domain/case";
import type { ProcessEventType } from "../domain/events";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import {
  deriveApplicableSopClock,
  deriveCitizenAction,
  deriveCurrentOwner,
  deriveCurrentStage,
  deriveElapsedDays,
  deriveOverdueState,
} from "../sop/selectors";
import { explainRecordedProcess } from "../sop/explanations";

function pathAt(eventType: ProcessEventType): MoneyPath {
  return {
    id: `test-${eventType}`,
    amount: 1,
    selectedProcess: "PROCESS_1",
    recordedRouteReasons: [],
    provenance: [],
    events: [
      {
        id: `event-${eventType}`,
        type: eventType,
        occurredAt: "2026-08-01T00:00:00.000Z",
        actor: "SYSTEM",
      },
    ],
  };
}

describe("SOP selectors", () => {
  it.each([
    ["MONEY_PATH_IDENTIFIED", "MONEY_PATH_IDENTIFIED", "INVESTIGATING_OFFICER"],
    ["ACCOUNT_HOLDER_NOTICE_REQUIRED", "ACCOUNT_HOLDER_NOTICE", "INVESTIGATING_OFFICER"],
    ["ACCOUNT_HOLDER_NOTICE_ISSUED", "ACCOUNT_HOLDER_RESPONSE", "ACCOUNT_HOLDER"],
    ["ACCOUNT_HOLDER_RESPONDED", "SP_DCP_APPROVAL", "SP_DCP"],
    ["SP_DCP_APPROVAL_RECORDED", "INDEMNITY_BOND_REQUIRED", "CITIZEN"],
    ["INDEMNITY_BOND_RECORDED", "BANK_DIRECTION", "INVESTIGATING_OFFICER"],
    ["BANK_DIRECTION_ISSUED", "BANK_INTERIM_CUSTODY", "BANK"],
    ["INTERIM_CUSTODY_CONFIRMED", "INTERIM_CUSTODY_CONFIRMED", "NONE"],
    ["AMOUNT_EXITED_FINANCIAL_SYSTEM", "EXITED_FINANCIAL_SYSTEM", "NONE"],
    ["AMOUNT_NOT_CURRENTLY_HELD", "NOT_CURRENTLY_HELD", "INVESTIGATING_OFFICER"],
    ["COURT_ROUTE_RECORDED", "COURT_ROUTE", "COURT"],
  ] as const)("derives %s as stage %s owned by %s", (event, stage, owner) => {
    const path = pathAt(event);
    expect(deriveCurrentStage(path)).toBe(stage);
    expect(deriveCurrentOwner(path)).toBe(owner);
  });

  it("derives the 7-day IO clock as day 9 and 2 days overdue", () => {
    const path = syntheticCase.moneyPaths.find((item) => item.id === "path-held-io-verification")!;

    expect(deriveApplicableSopClock(path)?.durationDays).toBe(7);
    expect(deriveElapsedDays(path, DEMO_NOW)).toBe(9);
    expect(deriveOverdueState(path, DEMO_NOW)).toEqual({
      elapsedDays: 9,
      durationDays: 7,
      isOverdue: true,
      daysOverdue: 2,
    });
  });

  it("derives the bank clock as day 4 and not overdue", () => {
    const path = syntheticCase.moneyPaths.find((item) => item.id === "path-bank-interim-custody")!;

    expect(deriveApplicableSopClock(path)?.durationDays).toBe(15);
    expect(deriveOverdueState(path, DEMO_NOW)).toEqual({
      elapsedDays: 4,
      durationDays: 15,
      isOverdue: false,
      daysOverdue: 0,
    });
  });

  it("returns no invented clock where the encoded rule has no duration", () => {
    expect(deriveApplicableSopClock(pathAt("SP_DCP_APPROVAL_RECORDED"))).toBeNull();
  });

  it("derives citizen action from the stage rule", () => {
    const noActionPath = pathAt("ACCOUNT_HOLDER_NOTICE_REQUIRED");
    const bondPath = pathAt("SP_DCP_APPROVAL_RECORDED");

    expect(deriveCitizenAction(noActionPath).code).toBe("NONE");
    expect(deriveCitizenAction(bondPath).code).toBe("SUBMIT_INDEMNITY_BOND");
  });

  it("explains the authoritative recorded route without selecting one", () => {
    const recorded = syntheticCase.moneyPaths[0]!;
    const unrecorded = syntheticCase.moneyPaths[2]!;

    expect(explainRecordedProcess(recorded).recordedProcess).toBe("PROCESS_1");
    expect(explainRecordedProcess(recorded).reasons).toHaveLength(4);
    expect(explainRecordedProcess(unrecorded).recordedProcess).toBeNull();
    expect(explainRecordedProcess(unrecorded).reasons).toEqual([]);
  });
});
