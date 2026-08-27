import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadLocalEnvironment() {
  try {
    const source = await readFile(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // The caller may already provide the environment variable.
  }
}

const narrations = [
  {
    file: "kyc-fraud-hi.mp3",
    languageCode: "hi-IN",
    speaker: "priya",
    text: "मुझे एसबीआई केवाईसी अपडेट करने का एक मैसेज आया था। मैंने उसमें दिए लिंक को खोला और ऐप के निर्देश माने। इसके बाद 22 अगस्त की सुबह लगभग सात बजे मेरे खाते से चालीस हजार रुपये निकल गए। बाद में मैंने उस नंबर पर संपर्क करने की कोशिश की, लेकिन कोई जवाब नहीं मिला।",
  },
  {
    file: "kyc-fraud-en.mp3",
    languageCode: "en-IN",
    speaker: "priya",
    text: "I received a message asking me to update my SBI KYC. I opened the link and followed the app instructions. At about seven in the morning on 22 August, forty thousand rupees was transferred from my account. I tried contacting the number afterward but received no response.",
  },
];

await loadLocalEnvironment();
const apiKey = process.env.SARVAM_API_KEY;
if (!apiKey) throw new Error("SARVAM_API_KEY is required to generate demo audio.");

const outputDirectory = resolve(process.cwd(), "public/demo/audio");
await mkdir(outputDirectory, { recursive: true });

for (const narration of narrations) {
  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: narration.text,
      language_code: narration.languageCode,
      model: "bulbul:v3",
      speaker: narration.speaker,
      pace: 0.92,
      output_audio_codec: "mp3",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sarvam TTS failed for ${narration.file}: ${response.status} ${message}`);
  }

  const result = await response.json();
  const encoded = result?.audios?.[0];
  if (typeof encoded !== "string") throw new Error(`Sarvam TTS returned no audio for ${narration.file}.`);
  await writeFile(resolve(outputDirectory, narration.file), Buffer.from(encoded, "base64"));
}

console.log(`Generated ${narrations.length} local demo narration files.`);
