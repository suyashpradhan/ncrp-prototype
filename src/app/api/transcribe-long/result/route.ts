import {
  decodeBatchJobToken,
  readSarvamLongTranscription,
} from "../../../../incident/sarvam-batch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Live transcription is not configured." }, { status: 503 });
    }
    const body = await request.json() as { jobId?: unknown };
    const jobs = decodeBatchJobToken(typeof body.jobId === "string" ? body.jobId : "", apiKey);
    const result = await readSarvamLongTranscription(jobs, apiKey);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "We couldn't transcribe this recording." }, { status: 502 });
  }
}
