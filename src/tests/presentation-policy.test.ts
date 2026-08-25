import { describe, expect, it } from "vitest";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import { simulateNextMoneyPathEvent } from "../domain/money-path";
import {
  deriveCitizenOverviewMeta,
  deriveDetailPresentationPolicy,
} from "../presentation/citizen-case";

function demoPath(id: string) {
  return syntheticCase.moneyPaths.find((path) => path.id === id)!;
}

describe("citizen detail presentation policy", () => {
  it("shows active-process questions for the police and bank states", () => {
    for (const path of [
      demoPath("path-held-io-verification"),
      demoPath("path-bank-interim-custody"),
    ]) {
      expect(deriveDetailPresentationPolicy(path)).toMatchObject({
        kind: "ACTIVE_PROCESS",
        showCurrentActor: false,
        showCitizenAction: true,
        showProcessClock: true,
        showNextStep: true,
        showHistory: true,
        showOfficialProcess: true,
        showDemoControl: true,
        showOutcomes: false,
      });
    }
  });

  it("hides empty process concepts for exited and not-held states", () => {
    const exited = deriveDetailPresentationPolicy(
      demoPath("path-exited-cash-withdrawal"),
    );
    const notHeld = deriveDetailPresentationPolicy(
      demoPath("path-not-currently-held"),
    );

    expect(exited.kind).toBe("EXITED_FINANCIAL_SYSTEM");
    expect(notHeld.kind).toBe("NOT_CURRENTLY_HELD");

    for (const policy of [exited, notHeld]) {
      expect(policy).toMatchObject({
        showCurrentActor: false,
        showCitizenAction: true,
        showProcessClock: false,
        showNextStep: false,
        showHistory: true,
        showOfficialProcess: false,
        showDemoControl: false,
        showOutcomes: false,
      });
    }
  });

  it("switches to an outcome-focused layout after interim custody is confirmed", () => {
    const bankPath = demoPath("path-bank-interim-custody");
    const received = simulateNextMoneyPathEvent(
      bankPath,
      "2026-08-25T10:00:00.000Z",
    );

    expect(deriveDetailPresentationPolicy(received)).toMatchObject({
      kind: "INTERIM_CUSTODY_CONFIRMED",
      showCurrentActor: false,
      showCitizenAction: true,
      showProcessClock: false,
      showNextStep: false,
      showHistory: true,
      showOfficialProcess: true,
      showDemoControl: false,
      showOutcomes: true,
    });
  });

  it("compresses overview rows into state-specific summary lines", () => {
    expect(
      deriveCitizenOverviewMeta(demoPath("path-held-io-verification"), DEMO_NOW)
        ?.defaultMessage,
    ).toBe("Nothing required · 2 days beyond recorded window");
    expect(
      deriveCitizenOverviewMeta(demoPath("path-bank-interim-custody"), DEMO_NOW)
        ?.defaultMessage,
    ).toBe("Nothing required · Day 4 of 15");
    expect(
      deriveCitizenOverviewMeta(demoPath("path-exited-cash-withdrawal"), DEMO_NOW)
        ?.defaultMessage,
    ).toBe("Cash withdrawal recorded");
    expect(
      deriveCitizenOverviewMeta(demoPath("path-not-currently-held"), DEMO_NOW),
    ).toBeNull();
  });
});
