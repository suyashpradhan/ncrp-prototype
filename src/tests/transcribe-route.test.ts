import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/transcribe/route";

describe("transcription route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes a browser WebM codec MIME type before sending audio to Sarvam", async () => {
    vi.stubEnv("SARVAM_API_KEY", "test-sarvam-key");

    const sarvamFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(FormData);

      const forwardedAudio = (init?.body as FormData).get("file");
      expect(forwardedAudio).toBeInstanceOf(File);
      expect((forwardedAudio as File).type).toBe("audio/webm");
      expect((forwardedAudio as File).name).toBe("statement.webm");

      return Response.json({
        transcript: "I lost two thousand rupees.",
        language_code: "en-IN",
      });
    });
    vi.stubGlobal("fetch", sarvamFetch);

    const formData = new FormData();
    formData.append(
      "audio",
      new File([new Uint8Array([1, 2, 3])], "statement.webm", {
        type: "audio/webm;codecs=opus",
      }),
    );

    const response = await POST(new Request("http://localhost/api/transcribe", {
      method: "POST",
      body: formData,
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      originalTranscript: "I lost two thousand rupees.",
      englishTranscript: "I lost two thousand rupees.",
      languageCode: "en-IN",
    });
    expect(sarvamFetch).toHaveBeenCalledTimes(1);
  });
});
