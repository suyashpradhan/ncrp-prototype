import {
  encodeBatchJobToken,
  startSarvamLongTranscription,
} from "../../../../incident/sarvam-batch";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
]);

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Live transcription is not configured." }, { status: 503 });
    }
    const formData = await request.formData();
    const audio = formData.get("audio");
    const durationSeconds = Number(formData.get("durationSeconds"));
    if (!(audio instanceof File)) {
      return Response.json({ error: "Add an audio recording to continue." }, { status: 400 });
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 30 || durationSeconds > 120) {
      return Response.json({ error: "Long recordings must be between 31 and 120 seconds." }, { status: 400 });
    }
    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ error: "The recording is too large to transcribe." }, { status: 413 });
    }
    const audioType = audio.type.split(";", 1)[0].toLowerCase();
    if (audioType && !SUPPORTED_AUDIO_TYPES.has(audioType)) {
      return Response.json({ error: "Use a supported audio recording." }, { status: 415 });
    }

    const jobs = await startSarvamLongTranscription(audio, apiKey);
    return Response.json(
      { jobId: encodeBatchJobToken(jobs, apiKey) },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Long transcription could not start.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "We couldn't transcribe this recording." }, { status: 502 });
  }
}
