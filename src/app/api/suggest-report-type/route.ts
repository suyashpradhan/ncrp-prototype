import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { classifyReportDescription } from "../../../incident/report-types";

export const runtime = "nodejs";

const SuggestionSchema = z.object({
  reportType: z.enum([
    "WOMEN_CHILDREN_RELATED_CRIME",
    "FINANCIAL_FRAUD",
    "OTHER_CYBER_CRIME",
    "OUT_OF_SCOPE_OR_UNCLEAR",
  ]),
  suggestedSubCategory: z.string().nullable(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  signals: z.array(z.string()).max(4),
  plausibleReportTypes: z.array(z.enum([
    "WOMEN_CHILDREN_RELATED_CRIME",
    "FINANCIAL_FRAUD",
    "OTHER_CYBER_CRIME",
  ])).max(3),
});

const INSTRUCTIONS = `Classify a citizen's description into an NCRP prototype reporting scope.
Use primary harm, financial loss, abusive activity, and account/system compromise—not a platform keyword alone.
If sensitive intimate-image abuse and a financial demand/loss are both plausible, return OUT_OF_SCOPE_OR_UNCLEAR and include both plausible report types.
If there is no online or digital element, return OUT_OF_SCOPE_OR_UNCLEAR.
Do not provide legal conclusions.`;

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const description = typeof payload === "object" && payload && "description" in payload
    ? String(payload.description).trim().slice(0, 2_000)
    : "";
  if (!description) return Response.json({ error: "Describe what happened." }, { status: 400 });

  const fallback = classifyReportDescription(description);
  // Keep ambiguous and clearly non-cyber cases deterministic so a model can
  // never silently force them into one reporting path.
  if (fallback.reportType === "OUT_OF_SCOPE_OR_UNCLEAR") {
    return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json(fallback);

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.parse({
      model: "gpt-5.6",
      instructions: INSTRUCTIONS,
      input: description,
      text: { format: zodTextFormat(SuggestionSchema, "report_type_suggestion") },
    });
    return Response.json(response.output_parsed ?? fallback, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(fallback, { headers: { "Cache-Control": "no-store" } });
  }
}
