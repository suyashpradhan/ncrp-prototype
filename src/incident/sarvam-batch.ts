import { createHmac, timingSafeEqual } from "node:crypto";
import { TranscriptionResultSchema, type TranscriptionResult } from "./schema";

const SARVAM_BATCH_BASE = "https://api.sarvam.ai/speech-to-text/job/v1";
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

type BatchMode = "transcribe" | "translate";

type BatchJobTokenPayload = {
  transcribeJobId: string;
  translateJobId: string;
  createdAt: number;
};

type BatchJobStatus = {
  job_state?: string;
  error_message?: string;
  job_details?: Array<{
    state?: string;
    outputs?: Array<{ file_name?: string }>;
  }>;
};

type BatchJobCreated = { job_id?: string };
type BatchLinks = {
  upload_urls?: Record<string, { file_url?: string }>;
  download_urls?: Record<string, { file_url?: string }>;
};
type BatchOutput = { transcript?: string; language_code?: string | null };

async function sarvamJson<T>(
  url: string,
  apiKey: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "api-subscription-key": apiKey,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Sarvam batch request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

function safeFileName(audio: File): string {
  const extensionByType: Record<string, string> = {
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/flac": "flac",
  };
  const type = audio.type.split(";", 1)[0].toLowerCase();
  return `statement.${extensionByType[type] ?? "webm"}`;
}

async function startModeJob(
  audio: File,
  apiKey: string,
  mode: BatchMode,
): Promise<string> {
  const created = await sarvamJson<BatchJobCreated>(SARVAM_BATCH_BASE, apiKey, {
    method: "POST",
    body: JSON.stringify({
      job_parameters: {
        model: "saaras:v3",
        mode,
        language_code: "unknown",
      },
    }),
  });
  if (!created.job_id) throw new Error("Sarvam did not return a batch job ID.");

  const fileName = safeFileName(audio);
  const uploadLinks = await sarvamJson<BatchLinks>(
    `${SARVAM_BATCH_BASE}/upload-files`,
    apiKey,
    {
      method: "POST",
      body: JSON.stringify({ job_id: created.job_id, files: [fileName] }),
    },
  );
  const uploadUrl = uploadLinks.upload_urls?.[fileName]?.file_url;
  if (!uploadUrl) throw new Error("Sarvam did not return an audio upload URL.");

  const uploadHeaders: HeadersInit = {
    "Content-Type": audio.type.split(";", 1)[0] || "audio/webm",
  };
  if (uploadUrl.includes("blob.core.windows.net")) {
    uploadHeaders["x-ms-blob-type"] = "BlockBlob";
  }
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: Buffer.from(await audio.arrayBuffer()),
    cache: "no-store",
  });
  if (!uploadResponse.ok) {
    throw new Error(`Sarvam audio upload failed with status ${uploadResponse.status}.`);
  }

  await sarvamJson<BatchJobStatus>(
    `${SARVAM_BATCH_BASE}/${encodeURIComponent(created.job_id)}/start`,
    apiKey,
    { method: "POST", body: "{}" },
  );
  return created.job_id;
}

export async function startSarvamLongTranscription(
  audio: File,
  apiKey: string,
): Promise<BatchJobTokenPayload> {
  const [transcribeJobId, translateJobId] = await Promise.all([
    startModeJob(audio, apiKey, "transcribe"),
    startModeJob(audio, apiKey, "translate"),
  ]);
  return { transcribeJobId, translateJobId, createdAt: Date.now() };
}

function signature(payload: string, apiKey: string): string {
  return createHmac("sha256", apiKey).update(payload).digest("base64url");
}

export function encodeBatchJobToken(payload: BatchJobTokenPayload, apiKey: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, apiKey)}`;
}

export function decodeBatchJobToken(token: string, apiKey: string): BatchJobTokenPayload {
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) throw new Error("Invalid transcription job token.");
  const expected = signature(encoded, apiKey);
  const suppliedBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expected);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  ) {
    throw new Error("Invalid transcription job token.");
  }

  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as BatchJobTokenPayload;
  if (
    !parsed.transcribeJobId ||
    !parsed.translateJobId ||
    !Number.isFinite(parsed.createdAt) ||
    Date.now() - parsed.createdAt > TOKEN_MAX_AGE_MS
  ) {
    throw new Error("Expired transcription job token.");
  }
  return parsed;
}

export async function getSarvamBatchStatus(jobId: string, apiKey: string): Promise<BatchJobStatus> {
  return sarvamJson<BatchJobStatus>(
    `${SARVAM_BATCH_BASE}/${encodeURIComponent(jobId)}/status`,
    apiKey,
  );
}

export function safeCombinedBatchState(
  original: BatchJobStatus,
  translation: BatchJobStatus,
): "PROCESSING" | "COMPLETED" | "FAILED" {
  const states = [original.job_state, translation.job_state];
  if (states.some((state) => state === "Failed")) return "FAILED";
  if (states.every((state) => state === "Completed" || state === "PartiallyCompleted")) {
    return "COMPLETED";
  }
  return "PROCESSING";
}

function outputFileName(status: BatchJobStatus): string {
  const successful = status.job_details?.find(
    (detail) => detail.state === "Success" && detail.outputs?.[0]?.file_name,
  );
  const fileName = successful?.outputs?.[0]?.file_name;
  if (!fileName) throw new Error("Sarvam batch output is unavailable.");
  return fileName;
}

async function downloadBatchOutput(
  jobId: string,
  status: BatchJobStatus,
  apiKey: string,
): Promise<BatchOutput> {
  const fileName = outputFileName(status);
  const links = await sarvamJson<BatchLinks>(
    `${SARVAM_BATCH_BASE}/download-files`,
    apiKey,
    {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, files: [fileName] }),
    },
  );
  const downloadUrl = links.download_urls?.[fileName]?.file_url;
  if (!downloadUrl) throw new Error("Sarvam did not return a result URL.");
  const response = await fetch(downloadUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Sarvam result download failed.");
  return response.json() as Promise<BatchOutput>;
}

export async function readSarvamLongTranscription(
  payload: BatchJobTokenPayload,
  apiKey: string,
): Promise<TranscriptionResult> {
  const [originalStatus, translationStatus] = await Promise.all([
    getSarvamBatchStatus(payload.transcribeJobId, apiKey),
    getSarvamBatchStatus(payload.translateJobId, apiKey),
  ]);
  if (safeCombinedBatchState(originalStatus, translationStatus) !== "COMPLETED") {
    throw new Error("Transcription is not complete.");
  }
  const [original, translation] = await Promise.all([
    downloadBatchOutput(payload.transcribeJobId, originalStatus, apiKey),
    downloadBatchOutput(payload.translateJobId, translationStatus, apiKey),
  ]);
  if (!original.transcript) throw new Error("Sarvam returned no transcript.");

  return TranscriptionResultSchema.parse({
    originalTranscript: original.transcript,
    englishTranscript: translation.transcript ?? original.transcript,
    languageCode: original.language_code ?? "unknown",
  });
}
