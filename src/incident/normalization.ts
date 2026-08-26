import type { IncidentDraft } from "./schema";

const CHANNEL_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\bwhats?app\b/i, "WhatsApp"],
  [/\btelegram\b/i, "Telegram"],
  [/\b(?:sms|text message)\b/i, "SMS / text message"],
  [/\b(?:e-?mail|email)\b/i, "Email"],
  [/\b(?:website|web site|webpage|web page|https?:\/\/|www\.)\b/i, "Website"],
  [/\b(?:mobile app|banking app|application|app)\b/i, "Mobile app"],
];

export function normalizeIncidentChannel(draft: IncidentDraft): string | null {
  const evidenceFacts = draft.evidence.flatMap((item) => item.extractedFacts);
  const supportedSources = [
    draft.incident.occurredOn?.trim() ?? "",
    evidenceFacts.join(" \n"),
  ].filter(Boolean);

  if (supportedSources.length === 0) return null;
  for (const source of supportedSources) {
    for (const [pattern, label] of CHANNEL_PATTERNS) {
      if (pattern.test(source)) return label;
    }
  }
  return "Other";
}

export function normalizeIncidentDraft(draft: IncidentDraft): IncidentDraft {
  return {
    ...draft,
    incident: {
      ...draft.incident,
      occurredOn: normalizeIncidentChannel(draft),
    },
  };
}
