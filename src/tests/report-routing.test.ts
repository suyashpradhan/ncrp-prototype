import { describe, expect, it } from "vitest";
import {
  classifyReportDescription,
  requirementsByReportType,
} from "../incident/report-types";

describe("NCRP report routing", () => {
  it.each([
    [
      "My Instagram account was hacked and the recovery email was changed.",
      "OTHER_CYBER_CRIME",
    ],
    [
      "I found an investment opportunity on Instagram and transferred ₹25,000. Now the person has disappeared.",
      "FINANCIAL_FRAUD",
    ],
    [
      "Someone is threatening to share intimate images of a woman online.",
      "WOMEN_CHILDREN_RELATED_CRIME",
    ],
    [
      "I received an SBI KYC link and ₹40,000 was transferred from my account.",
      "FINANCIAL_FRAUD",
    ],
    [
      "Someone hacked my computer and encrypted my files.",
      "OTHER_CYBER_CRIME",
    ],
    [
      "I saw someone physically assaulting a woman on the street.",
      "OUT_OF_SCOPE_OR_UNCLEAR",
    ],
  ])("routes %s", (description, expected) => {
    expect(classifyReportDescription(description).reportType).toBe(expected);
  });

  it("asks the citizen to choose when sensitive extortion also demands money", () => {
    const result = classifyReportDescription(
      "I am being blackmailed with intimate images and they are also demanding ₹20,000.",
    );

    expect(result.reportType).toBe("OUT_OF_SCOPE_OR_UNCLEAR");
    expect(result.plausibleReportTypes).toEqual([
      "WOMEN_CHILDREN_RELATED_CRIME",
      "FINANCIAL_FRAUD",
    ]);
  });

  it("keeps all three requirement sets materially distinct", () => {
    expect(requirementsByReportType.FINANCIAL_FRAUD.tabs).toContain("TRANSACTION");
    expect(requirementsByReportType.OTHER_CYBER_CRIME.tabs).toContain("ACCOUNT_PLATFORM");
    expect(requirementsByReportType.WOMEN_CHILDREN_RELATED_CRIME.tabs).toContain("REPORTING_PREFERENCE");
    expect(requirementsByReportType.OTHER_CYBER_CRIME.tabs).not.toContain("TRANSACTION");
    expect(requirementsByReportType.WOMEN_CHILDREN_RELATED_CRIME.tabs).not.toContain("TRANSACTION");
  });
});
