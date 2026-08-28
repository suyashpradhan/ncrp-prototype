import { describe, expect, it } from "vitest";
import { resolveReportedAmount } from "../incident/complaint-case";
import { DEMO_INCIDENT_DRAFT, DEMO_NARRATIONS } from "../incident/demo-incident";
import { buildNcrpCompatibleComplaint } from "../incident/ncrp-compatible-complaint";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import { IncidentDraftSchema } from "../incident/schema";
import { SYNTHETIC_NCRP_PROFILE } from "../experience/profile";
import { buildCallBrief, getNextActions } from "../presentation/report-handoff";

describe("immediate handoff and sensitive detail safety", () => {
  it("builds the canonical financial call brief from current report facts", () => {
    const brief = buildCallBrief(DEMO_INCIDENT_DRAFT, {
      locale: "en",
      amountResolution: resolveReportedAmount(DEMO_INCIDENT_DRAFT),
    });

    expect(brief).toContain("₹40,000");
    expect(brief).toContain("SBI");
    expect(brief).toContain("22 Aug 2026");
    expect(brief).toContain("DEMO-UTR-40000-220826");
    expect(brief).not.toMatch(/guarantee|recover your money|refund/i);
  });

  it("hides the financial call brief for a non-financial account compromise", () => {
    const accountIncident = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      classification: {
        ...DEMO_INCIDENT_DRAFT.classification,
        reportFamily: "OTHER_CYBER_CRIME",
        category: "Other Cyber Crime",
        subCategory: "Profile Hacking",
        moneyLost: false,
      },
      officialMapping: {
        ...DEMO_INCIDENT_DRAFT.officialMapping,
        category: "OTHER_CYBER_CRIME",
        categoryLabel: "Other Cyber Crime",
        subCategoryLabel: "Profile Hacking",
      },
      incident: {
        ...DEMO_INCIDENT_DRAFT.incident,
        moneyLost: false,
        reportedAmount: null,
      },
      transactions: [],
    });

    expect(
      buildCallBrief(accountIncident, {
        locale: "en",
        amountResolution: null,
      }),
    ).toBeNull();
    expect(getNextActions(accountIncident, "en").map((item) => item.id)).toEqual([
      "account-recovery",
      "secure-credentials",
      "preserve-account-evidence",
    ]);
  });

  it("does not present a disputed amount as confirmed", () => {
    const conflict = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      transactions: [
        { ...DEMO_INCIDENT_DRAFT.transactions[0], amount: 42_000 },
      ],
    });
    const brief = buildCallBrief(conflict, {
      locale: "en",
      amountResolution: resolveReportedAmount(conflict),
    });

    expect(brief).toContain("amount still needs confirmation");
    expect(brief).not.toContain("₹40,000");
    expect(brief).not.toContain("₹42,000");
  });

  it("redacts strongly associated secrets without changing normal references", () => {
    expect(
      sanitizeSensitiveText("My OTP was 483201 and ₹40,000 was debited.").text,
    ).toBe("My OTP was [redacted] and ₹40,000 was debited.");
    expect(sanitizeSensitiveText("My UPI PIN is 1234.").text).toBe(
      "My UPI PIN is [redacted].",
    );
    expect(sanitizeSensitiveText("My CVV is 456.").text).toBe(
      "My CVV is [redacted].",
    );
    expect(sanitizeSensitiveText("My password is abc123.").text).toBe(
      "My password is [redacted].",
    );
    expect(sanitizeSensitiveText("Transaction reference 123456789012.").text).toBe(
      "Transaction reference 123456789012.",
    );
  });

  it("sanitizes reusable complaint text while preserving the original draft", () => {
    const narrative = "My OTP was 483201 and ₹40,000 was debited.";
    const sensitiveDraft = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      incident: { ...DEMO_INCIDENT_DRAFT.incident, narrative },
    });
    const complaint = buildNcrpCompatibleComplaint({
      draft: sensitiveDraft,
      profile: SYNTHETIC_NCRP_PROFILE,
      transcription: {
        ...DEMO_NARRATIONS["en-IN"],
        originalTranscript: narrative,
        englishTranscript: narrative,
      },
      typedNarrative: "",
      isDemoIncident: false,
      screenshotNames: ["message.png", "transaction.png"],
      identityDocumentProvided: true,
    });

    expect(complaint.groups.incident.description.value).toContain("[redacted]");
    expect(complaint.groups.evidence.citizenStatement.value).toContain("[redacted]");
    expect(sensitiveDraft.incident.narrative).toContain("483201");
  });
});
