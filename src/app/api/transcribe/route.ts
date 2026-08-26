import { TranscriptionResultSchema } from "../../../incident/schema";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
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

type SarvamTranscription = {
  transcript?: string;
  language_code?: string | null;
};

type SarvamErrorPayload = {
  error?: {
    code?: unknown;
    request_id?: unknown;
  };
};

function normalizeAudioForSarvam(audio: File): File {
  const normalizedType = audio.type.split(";", 1)[0].trim().toLowerCase();
  if (!normalizedType || normalizedType === audio.type) return audio;

  return new File([audio], audio.name || "statement.webm", {
    type: normalizedType,
    lastModified: audio.lastModified,
  });
}

async function transcribeWithSarvam(
  audio: File,
  apiKey: string,
  mode: "transcribe" | "translate",
): Promise<SarvamTranscription> {
  const body = new FormData();
  const normalizedAudio = normalizeAudioForSarvam(audio);
  body.append("file", normalizedAudio, normalizedAudio.name);
  body.append("model", "saaras:v3");
  body.append("mode", mode);
  body.append("language_code", "unknown");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    let providerCode: string | undefined;
    let requestId: string | undefined;

    try {
      const payload = await response.json() as SarvamErrorPayload;
      providerCode = typeof payload.error?.code === "string" ? payload.error.code : undefined;
      requestId = typeof payload.error?.request_id === "string" ? payload.error.request_id : undefined;
    } catch {
      // Keep provider response bodies out of logs if they are not valid JSON.
    }

    console.error("Sarvam speech-to-text request failed.", {
      status: response.status,
      providerCode,
      requestId,
    });
    throw new Error(`Sarvam request failed with status ${response.status}.`);
  }

  return response.json() as Promise<SarvamTranscription>;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Live transcription is not configured. Use the demo incident instead." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return Response.json({ error: "Add an audio recording to continue." }, { status: 400 });
    }
    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return Response.json({ error: "Audio must be shorter than 30 seconds and under 8 MB." }, { status: 413 });
    }
    const baseAudioType = audio.type.split(";")[0];
    if (baseAudioType && !SUPPORTED_AUDIO_TYPES.has(baseAudioType)) {
      return Response.json({ error: "Use a WebM, WAV, MP3, MP4, OGG, AAC or FLAC recording." }, { status: 415 });
    }

    const original = await transcribeWithSarvam(audio, apiKey, "transcribe");
    if (!original.transcript) throw new Error("Sarvam returned no transcript.");

    const languageCode = original.language_code ?? "unknown";
    const english = languageCode.startsWith("en")
      ? original
      : await transcribeWithSarvam(audio, apiKey, "translate");

    const result = TranscriptionResultSchema.parse({
      originalTranscript: original.transcript,
      englishTranscript: english.transcript ?? original.transcript,
      languageCode,
    });

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "We couldn't transcribe this recording. Try again or use the demo incident." },
      { status: 502 },
    );
  }
}
