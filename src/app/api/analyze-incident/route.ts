import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { IncidentDraftSchema } from "../../../incident/schema";
import { normalizeIncidentDraft } from "../../../incident/normalization";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_SCREENSHOTS = 2;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const INCIDENT_EXTRACTION_INSTRUCTIONS = `You organise supplied evidence into a draft cybercrime complaint.

Rules:
1. Extract only information supported by the supplied screenshots or transcript.
2. Never invent missing details. Use null for every unknown value.
3. Do not infer a bank, account, wallet or person unless it is visible or explicitly stated.
4. Do not determine guilt or claim that a crime legally occurred.
5. Do not provide legal conclusions, predict recovery or promise a refund date.
6. officialMapping is a suggested NCRP mapping for citizen confirmation, not an authoritative legal decision.
7. Keep the citizen's description separate from the suggested official category and sub-category.
8. Never extract OTPs, CVVs, UPI PINs or passwords as complaint data. Add a warning if such credentials are visible.
9. List only genuinely missing required information in missingRequiredFields.
10. Keep citizen-facing summaries plain, concise and neutral.
11. Put the total amount the citizen says was lost in incident.reportedAmount, even when a transaction reference is unknown. Keep individual known payments in transactions.
12. Never infer a year. If the citizen says a day and month without a year, set incidentDate to null and incidentDateWithoutYear to MM-DD. Set incidentDateWithoutYear to null when a complete YYYY-MM-DD date is supported.
13. incident.occurredOn must be one concise supported channel: SMS / text message, WhatsApp, Telegram, Website, Mobile app, Email, Other, or null. Put contextual wording in the narrative, not this field.
14. Keep evidence files and facts extracted from evidence distinct: evidence.type identifies the supplied item; evidence.extractedFacts contains only concise supported facts.
15. When visibly supported, preserve safe suspect identifiers such as masked phone numbers, email addresses, URLs, UPI IDs, names or social handles in suspectIdentifiers. Do not unmask or complete partial identifiers.
16. Identity documents are outside this incident-understanding feature. Never extract, reproduce or expose Aadhaar, PAN, passport, driving-licence, voter-ID or other government identity numbers.`;

type InputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "auto" };

async function toDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Live evidence analysis is not configured. Use the demo incident instead." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const narrative = String(formData.get("narrative") ?? "").trim().slice(0, 8_000);
    const englishTranscript = String(formData.get("englishTranscript") ?? "").trim().slice(0, 8_000);
    const reportingFor = String(formData.get("reportingFor") ?? "SELF").slice(0, 40);
    const screenshots = formData.getAll("screenshots").filter((item): item is File => item instanceof File);

    if (!narrative && !englishTranscript && screenshots.length === 0) {
      return Response.json({ error: "Add a statement, description or screenshot to continue." }, { status: 400 });
    }
    if (screenshots.length > MAX_SCREENSHOTS) {
      return Response.json({ error: "Add no more than two screenshots." }, { status: 400 });
    }
    for (const screenshot of screenshots) {
      if (!ACCEPTED_IMAGE_TYPES.has(screenshot.type)) {
        return Response.json({ error: "Screenshots must be PNG, JPEG or WebP images." }, { status: 415 });
      }
      if (screenshot.size === 0 || screenshot.size > MAX_IMAGE_BYTES) {
        return Response.json({ error: "Each screenshot must be under 4 MB." }, { status: 413 });
      }
    }

    const evidenceDescription = [
      `Reporting for: ${reportingFor === "HELPING" ? "another affected person" : "self"}.`,
      englishTranscript ? `English voice transcript:\n${englishTranscript}` : "No voice transcript supplied.",
      narrative ? `Typed account:\n${narrative}` : "No typed account supplied.",
      `${screenshots.length} screenshot(s) supplied.`,
    ].join("\n\n");

    const content: InputContent[] = [{ type: "input_text", text: evidenceDescription }];
    for (const screenshot of screenshots) {
      content.push({ type: "input_image", image_url: await toDataUrl(screenshot), detail: "auto" });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.parse({
      model: "gpt-5.6",
      instructions: INCIDENT_EXTRACTION_INSTRUCTIONS,
      input: [{ role: "user", content }],
      text: {
        format: zodTextFormat(
          IncidentDraftSchema,
          "incident_draft",
          { description: "Evidence-grounded structured incident draft for citizen review." },
        ),
      },
    });

    if (!response.output_parsed) throw new Error("No structured incident draft returned.");
    const normalizedDraft = normalizeIncidentDraft(response.output_parsed);
    return Response.json(normalizedDraft, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "We couldn't analyse this evidence. Try again or use the demo incident." },
      { status: 502 },
    );
  }
}
