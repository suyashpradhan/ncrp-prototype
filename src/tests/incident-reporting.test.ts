import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { syntheticCase } from "../data/synthetic-case";
import { DEMO_INCIDENT_DRAFT, createUnknownIncidentDraft } from "../incident/demo-incident";
import { deriveMissingQuestions } from "../incident/missing-information";
import { generateNcrpFields, totalIncidentTransactionAmount } from "../incident/ncrp-mapping";
import { IncidentDraftSchema } from "../incident/schema";

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
        DEMO_INCIDENT_DRAFT.transactions[1],
      ],
    });

    expect(deriveMissingQuestions(partial).map((question) => question.field)).toEqual([
      "incidentDate",
      "transactionIdOrUtr",
    ]);
  });

  it("does not re-ask facts already captured from evidence", () => {
    expect(deriveMissingQuestions(DEMO_INCIDENT_DRAFT)).toEqual([]);
  });

  it("reconciles demo transactions to the same downstream ₹2,00,000 case", () => {
    expect(totalIncidentTransactionAmount(DEMO_INCIDENT_DRAFT)).toBe(200_000);
    expect(syntheticCase.complaint.reportedAmount).toBe(200_000);
  });

  it("keeps the local demo fallback visible and API secrets out of the client component", () => {
    const clientSource = readFileSync(
      new URL("../components/demo-journey/demo-journey.tsx", import.meta.url),
      "utf8",
    );

    expect(clientSource).toContain("Use demo incident");
    expect(clientSource).toContain("Speak in your language");
    expect(clientSource).toContain("One detail is still needed");
    expect(clientSource).not.toContain("Suggested official NCRP mapping");
    expect(clientSource).not.toContain("OPENAI_API_KEY");
    expect(clientSource).not.toContain("SARVAM_API_KEY");
    expect(clientSource).not.toContain("process.env");
  });
});
