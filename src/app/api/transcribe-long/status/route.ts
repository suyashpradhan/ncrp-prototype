import {
  decodeBatchJobToken,
  getSarvamBatchStatus,
  safeCombinedBatchState,
} from "../../../../incident/sarvam-batch";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return Response.json({ status: "FAILED" }, { status: 503 });
    const jobToken = new URL(request.url).searchParams.get("jobId") ?? "";
    const jobs = decodeBatchJobToken(jobToken, apiKey);
    const [original, translation] = await Promise.all([
      getSarvamBatchStatus(jobs.transcribeJobId, apiKey),
      getSarvamBatchStatus(jobs.translateJobId, apiKey),
    ]);
    return Response.json(
      { status: safeCombinedBatchState(original, translation) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "FAILED" }, { status: 502 });
  }
}
