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
  deriveFinancialState,
  deriveOverdueState,
} from "../sop/selectors";
import { explainRecordedProcess } from "../sop/explanations";

function pathAt(eventType: ProcessEventType): MoneyPath {
  return {
    id: `test-${eventType}`,
    amount: 1,
    selectedProcess: "PROCESS_1",
    recordedRouteFacts: [],
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
    ["REQUEST_ASSIGNED_TO_IO", "ACCOUNT_HOLDER_NOTICE", "INVESTIGATING_OFFICER"],
    ["ACCOUNT_HOLDER_NOTICE_ISSUED", "ACCOUNT_HOLDER_RESPONSE", "ACCOUNT_HOLDER"],
    ["ACCOUNT_HOLDER_RESPONDED", "SP_DCP_APPROVAL", "SP_DCP"],
    ["SP_DCP_APPROVAL_RECORDED", "INDEMNITY_BOND_REQUIRED", "CITIZEN"],
    ["INDEMNITY_BOND_RECORDED", "BANK_DIRECTION", "INVESTIGATING_OFFICER"],
    ["BANK_DIRECTION_ISSUED", "BANK_DIRECTION_RECEIPT", "BANK"],
    ["BANK_DIRECTION_RECEIVED", "BANK_INTERIM_CUSTODY", "BANK"],
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

    expect(deriveApplicableSopClock(path)).toMatchObject({
      durationDays: 7,
      semantics: "WITHIN",
      startedAt: "2026-08-15T10:00:00.000Z",
    });
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

    expect(deriveApplicableSopClock(path)).toMatchObject({
      durationDays: 15,
      semantics: "UP_TO",
      startedAt: "2026-08-20T10:00:00.000Z",
    });
    expect(deriveOverdueState(path, DEMO_NOW)).toEqual({
      elapsedDays: 4,
      durationDays: 15,
      isOverdue: false,
      daysOverdue: 0,
    });
  });

  it("returns no invented clock where the encoded rule has no duration", () => {
    expect(deriveApplicableSopClock(pathAt("SP_DCP_APPROVAL_RECORDED"))).toBeNull();
    expect(deriveApplicableSopClock(pathAt("BANK_DIRECTION_ISSUED"))).toBeNull();
  });

  it("does not start the IO clock from the notice-required marker", () => {
    const path = pathAt("MONEY_PATH_IDENTIFIED");
    path.events.push({
      id: "non-triggering-notice-marker",
      type: "ACCOUNT_HOLDER_NOTICE_REQUIRED",
      occurredAt: "2026-08-02T00:00:00.000Z",
      actor: "INVESTIGATING_OFFICER",
    });

    expect(deriveCurrentStage(path)).toBe("MONEY_PATH_IDENTIFIED");
    expect(deriveApplicableSopClock(path)).toBeNull();
  });

  it("counts calendar days using India dates", () => {
    const path = pathAt("REQUEST_ASSIGNED_TO_IO");
    path.events[0]!.occurredAt = "2026-08-15T20:30:00.000Z";

    expect(deriveElapsedDays(path, "2026-08-16T01:00:00.000Z")).toBe(0);
  });

  it("lets a later held event supersede a not-currently-held state", () => {
    const path = pathAt("AMOUNT_HELD");
    path.events = [
      {
        id: "held-later",
        type: "AMOUNT_HELD",
        occurredAt: "2026-08-02T00:00:00.000Z",
        actor: "BANK",
      },
      {
        id: "not-held-earlier",
        type: "AMOUNT_NOT_CURRENTLY_HELD",
        occurredAt: "2026-08-01T00:00:00.000Z",
        actor: "SYSTEM",
      },
    ];

    expect(deriveFinancialState(path)).toBe("HELD");
  });

  it("derives citizen action from the stage rule", () => {
    const noActionPath = pathAt("REQUEST_ASSIGNED_TO_IO");
    const bondPath = pathAt("SP_DCP_APPROVAL_RECORDED");

    expect(deriveCitizenAction(noActionPath).code).toBe("NONE");
    expect(deriveCitizenAction(bondPath).code).toBe("SUBMIT_INDEMNITY_BOND");
  });

  it("explains the authoritative recorded route without selecting one", () => {
    const recorded = syntheticCase.moneyPaths[0]!;
    const unrecorded = syntheticCase.moneyPaths[2]!;

    expect(explainRecordedProcess(recorded).recordedProcess).toBe("PROCESS_1");
    expect(explainRecordedProcess(recorded).factsHeading.defaultMessage).toBe("Recorded case facts");
    expect(explainRecordedProcess(recorded).facts).toHaveLength(4);
    expect(explainRecordedProcess(recorded).provenance).toEqual(recorded.provenance);
    expect(explainRecordedProcess(recorded).provenance[0]).toMatchObject({
      source: "JAN_2026_NCRP_CFCFRMS_SOP",
      process: "PROCESS_1",
    });
    expect(explainRecordedProcess(unrecorded).recordedProcess).toBeNull();
    expect(explainRecordedProcess(unrecorded).facts).toEqual([]);
    expect(explainRecordedProcess(unrecorded).provenance).toEqual([]);
  });
});
