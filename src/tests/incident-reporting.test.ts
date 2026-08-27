import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_INCIDENT_DRAFT, DEMO_NARRATIONS, createUnknownIncidentDraft } from "../incident/demo-incident";
import { buildSyntheticCaseFromComplaint } from "../incident/complaint-case";
import { SYNTHETIC_NCRP_PROFILE } from "../experience/profile";
import { textForLocale } from "../i18n/i18n-provider";
import { applyMissingAnswer, deriveMissingQuestions } from "../incident/missing-information";
import { generateNcrpFields, totalIncidentTransactionAmount } from "../incident/ncrp-mapping";
import { IncidentDraftSchema } from "../incident/schema";
import { CITIZEN_DOES_NOT_HAVE } from "../presentation/report-details";
import { normalizeIncidentChannel } from "../incident/normalization";
import {
  NCRP_COMPATIBLE_SCHEMA_VERSION,
  NCRP_FIELD_DEFINITIONS,
  NcrpCompatibleComplaintSchema,
  buildNcrpCompatibleComplaint,
  requiredComplaintFieldsReady,
} from "../incident/ncrp-compatible-complaint";
import { deriveReportCompletion, deriveReportGroups } from "../presentation/report-details";

describe("AI-assisted incident reporting boundary", () => {
  it("validates the precomputed demo incident against the strict schema", () => {
    expect(IncidentDraftSchema.parse(DEMO_INCIDENT_DRAFT)).toEqual(DEMO_INCIDENT_DRAFT);
  });

  it("maps the incident into every required generated NCRP field", () => {
    const labels = generateNcrpFields(DEMO_INCIDENT_DRAFT).map((field) => field.label);

    expect(labels).toEqual([
      "Category of complaint",
      "Sub-category",
      "Have you lost money?",
      "Approximate incident date/time",
      "Delay in reporting",
      "Reason for delay",
      "Where incident occurred",
      "Incident narrative",
      "Victim bank/wallet/merchant",
      "Account / wallet / merchant / UPI ID",
      "Transaction ID / UTR",
      "Amount",
      "Transaction date",
      "Approximate transaction time",
      "Reference number",
      "Supporting evidence",
      "Suspect identifiers",
      "Complainant information",
    ]);
  });

  it("keeps unsupported extraction values null", () => {
    const unknown = createUnknownIncidentDraft();

    expect(unknown.officialMapping.category).toBeNull();
    expect(unknown.incident.moneyLost).toBeNull();
    expect(unknown.incident.incidentDate).toBeNull();
    expect(unknown.incident.occurredOn).toBeNull();
    expect(unknown.incident.narrative).toBeNull();
  });

  it("asks only for information that is actually missing", () => {
    const partial = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      incident: { ...DEMO_INCIDENT_DRAFT.incident, incidentDate: null },
      transactions: [
        { ...DEMO_INCIDENT_DRAFT.transactions[0], transactionIdOrUtr: null },
      ],
    });

    expect(deriveMissingQuestions(partial).map((question) => question.field)).toEqual([
      "incidentDate",
      "transactionIdOrUtr",
    ]);
  });

  it("keeps the canonical judge demo complete", () => {
    expect(deriveMissingQuestions(DEMO_INCIDENT_DRAFT)).toEqual([]);

    const completion = deriveReportCompletion(DEMO_INCIDENT_DRAFT);
    expect(completion).toEqual({ ready: 4, total: 4, missing: 0 });
  });

  it("keeps a day and month unresolved until the citizen confirms the year", () => {
    const partial = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      incident: {
        ...DEMO_INCIDENT_DRAFT.incident,
        incidentDate: null,
        incidentDateWithoutYear: "08-22",
        approximateTime: "07:00",
      },
    });

    expect(deriveMissingQuestions(partial).map((question) => question.field)).toContain(
      "incidentDateYear",
    );
    const confirmed = applyMissingAnswer(partial, "incidentDateYear", "2026");
    expect(confirmed.incident.incidentDate).toBe("2026-08-22");
    expect(confirmed.incident.incidentDateWithoutYear).toBeNull();
  });

  it("treats a citizen's unavailable transaction reference as resolved", () => {
    const missing = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      transactions: [
        { ...DEMO_INCIDENT_DRAFT.transactions[0], transactionIdOrUtr: null },
      ],
    });
    const resolved = applyMissingAnswer(
      missing,
      "transactionIdOrUtr",
      CITIZEN_DOES_NOT_HAVE,
    );

    expect(deriveMissingQuestions(resolved)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "transactionIdOrUtr" })]),
    );
    const transactionGroup = deriveReportGroups(resolved).find(
      (group) => group.id === "TRANSACTIONS",
    );
    expect(transactionGroup?.sections.flatMap((section) => section.fields)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "transaction-0-utr", value: "Not available" }),
      ]),
    );
  });

  it("renders a focusable missing editor for a missing transaction date", () => {
    const missingDate = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      transactions: [
        { ...DEMO_INCIDENT_DRAFT.transactions[0], transactionDate: null },
      ],
    });
    const dateField = deriveReportGroups(missingDate)
      .find((group) => group.id === "TRANSACTIONS")
      ?.sections.flatMap((section) => section.fields)
      .find((field) => field.id === "transaction-0-date");

    expect(deriveMissingQuestions(missingDate).map((question) => question.field)).toContain("transactionDate");
    expect(dateField?.missingQuestion?.field).toBe("transactionDate");
  });

  it("normalizes the structured incident channel without copying long evidence text", () => {
    const draft = IncidentDraftSchema.parse({
      ...DEMO_INCIDENT_DRAFT,
      incident: {
        ...DEMO_INCIDENT_DRAFT.incident,
        occurredOn: "Text message, download link, and an app identified in the transcript",
      },
    });
    expect(normalizeIncidentChannel(draft)).toBe("SMS / text message");
  });

  it("presents the structured incident, transactions, evidence and profile from one draft", () => {
    const groups = deriveReportGroups(DEMO_INCIDENT_DRAFT);
    const visibleValues = groups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.fields)
      .map((field) => field.value);

    expect(groups.map((group) => group.label)).toEqual([
      "Incident",
      "Transaction",
      "Evidence & suspect",
      "Your details",
    ]);
    expect(visibleValues).toEqual(expect.arrayContaining([
      "Financial Fraud",
      "Internet Banking Related Fraud",
      "₹40,000",
      "SMS / chat message",
      "DEMO-UTR-40000-220826",
      "98XX XX1234",
      "https://kyc-demo.invalid/update",
      "Asha Verma",
    ]));
  });

  it("reconciles the canonical demo transaction to the same downstream ₹40,000 case", () => {
    const built = buildSyntheticCaseFromComplaint({
      incidentDraft: DEMO_INCIDENT_DRAFT,
      syntheticCitizen: { displayName: SYNTHETIC_NCRP_PROFILE.displayName },
      acknowledgementId: "NCRP-DEMO-2026-00124",
      submittedAt: "2026-08-22T02:30:00.000Z",
      caseOrigin: "DEMO_INCIDENT",
    });

    expect(totalIncidentTransactionAmount(DEMO_INCIDENT_DRAFT)).toBe(40_000);
    expect(built.caseData.complaint.reportedAmount).toBe(40_000);
    expect(built.caseData.moneyPaths.reduce((sum, path) => sum + path.amount, 0)).toBe(40_000);
  });

  it("keeps Hindi and English sample narration on one canonical incident", () => {
    expect(Object.keys(DEMO_NARRATIONS)).toEqual(["hi-IN", "en-IN"]);
    expect(new Set(Object.values(DEMO_NARRATIONS).map((item) => item.englishTranscript)).size).toBe(1);
    expect(DEMO_INCIDENT_DRAFT.incident.reportedAmount).toBe(40_000);

    for (const narration of Object.values(DEMO_NARRATIONS)) {
      expect(narration.audioPath.startsWith("/demo/audio/")).toBe(true);
      expect(existsSync(new URL(`../../public${narration.audioPath}`, import.meta.url))).toBe(true);
    }
  });

  it("keeps reporter identity separate from the narrated incident", () => {
    const testProfile = {
      ...SYNTHETIC_NCRP_PROFILE,
      displayName: "Synthetic Tester",
      state: "Goa",
      registeredMobile: "••••••1122",
      source: "TEST_INPUT" as const,
    };
    const reporterFields = deriveReportGroups(DEMO_INCIDENT_DRAFT, { profile: testProfile })
      .find((group) => group.id === "REPORTER")
      ?.sections.flatMap((section) => section.fields);

    expect(reporterFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "reporter-name", value: "Synthetic Tester" }),
      expect.objectContaining({ id: "reporter-state", value: "Goa" }),
      expect.objectContaining({ id: "reporter-mobile", value: "••••••1122" }),
    ]));
    expect(DEMO_INCIDENT_DRAFT.incident.narrative).not.toContain("Synthetic Tester");
  });

  it("maps the demo into the versioned NCRP-compatible complaint contract", () => {
    const complaint = buildNcrpCompatibleComplaint({
      draft: DEMO_INCIDENT_DRAFT,
      profile: SYNTHETIC_NCRP_PROFILE,
      transcription: DEMO_NARRATIONS["hi-IN"],
      typedNarrative: "",
      isDemoIncident: true,
      screenshotNames: ["Synthetic KYC message screenshot", "Synthetic bank transaction screenshot"],
      identityDocumentProvided: true,
    });

    expect(NcrpCompatibleComplaintSchema.parse(complaint)).toEqual(complaint);
    expect(complaint.schemaVersion).toBe(NCRP_COMPATIBLE_SCHEMA_VERSION);
    expect(complaint.structureLabel).toBe("NCRP-compatible prototype complaint structure");
    expect(complaint.groups.transactions[0].amount.value).toBe(40_000);
    expect(complaint.groups.suspect.mobileNumber.value).toBe("98XX XX1234");
    expect(complaint.groups.suspect.url.value).toBe("https://kyc-demo.invalid/update");
    expect(complaint.groups.identityDocument.attachment?.localPath).toBe("/demo/profile/synthetic-national-id.png");
    expect(requiredComplaintFieldsReady(complaint)).toBe(true);
  });

  it("centralizes requiredness and keeps optional suspect fields non-blocking", () => {
    expect(NCRP_FIELD_DEFINITIONS.find((item) => item.id === "identityDocument.provided")?.required).toBe(true);
    expect(NCRP_FIELD_DEFINITIONS.find((item) => item.id === "suspect.mobileNumber")?.required).toBe(false);
    expect(NCRP_FIELD_DEFINITIONS.find((item) => item.id === "incident.reasonForDelay")?.conditionalRequired).toBe("WHEN_REPORTING_DELAYED");
  });

  it("does not treat a missing synthetic identity document as complete", () => {
    const complaint = buildNcrpCompatibleComplaint({
      draft: DEMO_INCIDENT_DRAFT,
      profile: SYNTHETIC_NCRP_PROFILE,
      transcription: DEMO_NARRATIONS["en-IN"],
      typedNarrative: "",
      isDemoIncident: false,
      screenshotNames: ["message.png", "transaction.png"],
      identityDocumentProvided: false,
    });

    expect(complaint.groups.identityDocument.provided.status).toBe("NEEDS_INPUT");
    expect(requiredComplaintFieldsReady(complaint)).toBe(false);
  });

  it("renders important interface copy independently in English and Hindi", () => {
    expect(textForLocale("en", "entry.demo")).toBe("Try demo");
    expect(textForLocale("hi", "entry.demo")).toBe("डेमो देखें");
    expect(textForLocale("hi", "workspace.reviewContinue")).toBe("जाँचें और आगे बढ़ें");
  });

  it("keeps the local demo fallback visible and API secrets out of the client component", () => {
    const clientSource = readFileSync(
      new URL("../components/demo-journey/demo-journey.tsx", import.meta.url),
      "utf8",
    );

    expect(clientSource).toContain("ReportWorkspace");
    expect(clientSource).not.toContain("Suggested official NCRP mapping");
    expect(clientSource).not.toContain("OPENAI_API_KEY");
    expect(clientSource).not.toContain("SARVAM_API_KEY");
    expect(clientSource).not.toContain("process.env");

    const demoHandler = clientSource.slice(
      clientSource.indexOf("function useDemoIncident()"),
      clientSource.indexOf("function chooseDemoNarration"),
    );
    expect(demoHandler).not.toContain("fetch(");
    expect(demoHandler).not.toContain("getUserMedia");

    const workspaceSource = readFileSync(
      new URL("../components/demo-journey/report-workspace.tsx", import.meta.url),
      "utf8",
    );
    expect(workspaceSource).toContain('t("workspace.reportInfo")');
    expect(workspaceSource).toContain('t("workspace.useDemo")');
    expect(workspaceSource).toContain('t("field.needsInput")');
    expect(workspaceSource).not.toContain("AI analysis");
    expect(workspaceSource).not.toContain("fraud probability");
  });
});
