import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_INCIDENT_DRAFT } from "../incident/demo-incident";
import { JOURNEY_STEPS } from "../components/demo-journey/journey-progress";

describe("frozen Sachet reporting journey", () => {
  it("uses only Tell us, Review and Submit progress labels", () => {
    expect(JOURNEY_STEPS).toEqual([
      { id: "REPORT", labelKey: "journey.report" },
      { id: "RESTORE", labelKey: "journey.restoration" },
      { id: "RESOLUTION", labelKey: "journey.resolution" },
    ]);
  });

  it("keeps the canonical demo financial, deterministic and precomputed", () => {
    expect(DEMO_INCIDENT_DRAFT.classification).toMatchObject({
      reportFamily: "FINANCIAL_FRAUD",
      subCategory: "Internet Banking Related Fraud",
      ambiguity: "NONE",
    });
    expect(DEMO_INCIDENT_DRAFT.incident.reportedAmount).toBe(40_000);

    const source = readFileSync(
      new URL("../components/demo-journey/demo-journey.tsx", import.meta.url),
      "utf8",
    );
    const demoHandler = source.slice(
      source.indexOf("function useDemoIncident()"),
      source.indexOf("function chooseDemoNarration"),
    );
    expect(demoHandler).toContain("DEMO_INCIDENT_DRAFT");
    expect(demoHandler).not.toContain("fetch(");
  });

  it("does not expose restoration or tracking after synthetic submission", () => {
    const source = readFileSync(
      new URL("../components/demo-journey/demo-journey.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("Continue to Money Restoration");
    expect(source).not.toContain("Track progress");
    expect(source).toContain("Report prepared successfully");
  });

  it("asks for a test name on live reports while keeping Asha in the demo", () => {
    const source = readFileSync(
      new URL("../components/demo-journey/demo-journey.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('beginExperience("LIVE_TEST", createEmptyTestProfile())');
    expect(source).toContain('beginExperience("DEMO_CASE", SYNTHETIC_NCRP_PROFILE)');
    expect(source).toContain("reporterName={reporterName}");
  });

  it("redirects retired public routes to the reporting entry", () => {
    for (const path of [
      "../app/case/page.tsx",
      "../app/ledger/page.tsx",
      "../app/login/page.tsx",
      "../app/how-it-works/page.tsx",
    ]) {
      expect(readFileSync(new URL(path, import.meta.url), "utf8")).toContain('redirect("/")');
    }
  });
});
