import type { IncidentDraft } from "../incident/schema";
import type { UiLocale } from "../i18n/i18n-provider";
import { formatCurrency } from "./format";

export type TimelineSourceRef = {
  type: "STATEMENT" | "EVIDENCE" | "TRANSACTION" | "USER_CONFIRMED";
  label: string;
  evidenceId?: string;
};

export type IncidentTimelineEvent = {
  id: string;
  timeLabel: string | null;
  title: string;
  sourceRefs: TimelineSourceRef[];
};

type TimelineOptions = {
  locale: UiLocale;
  isDemoIncident: boolean;
};

function displayTime(value: string | null, locale: UiLocale, approximate = false) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  const date = new Date(Date.UTC(2020, 0, 1, hours, minutes));
  const formatted = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    hour: "numeric",
    minute: minutes === 0 ? undefined : "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  if (!approximate) return formatted;
  return locale === "hi" ? `लगभग ${formatted}` : `Around ${formatted}`;
}

function statementSupportsInstructionStep(draft: IncidentDraft) {
  return /opened|followed|clicked|instructions|खोला|निर्देश/i.test(
    draft.incident.narrative ?? "",
  );
}

function uploadedScreenshotId(draft: IncidentDraft, evidenceIndex: number) {
  const screenshotIndex = draft.evidence
    .slice(0, evidenceIndex)
    .filter((item) => item.type !== "VOICE_STATEMENT").length;
  return `uploaded-${screenshotIndex}`;
}

export function deriveIncidentTimeline(
  draft: IncidentDraft,
  { locale, isDemoIncident }: TimelineOptions,
): IncidentTimelineEvent[] {
  if (draft.classification.ambiguity !== "NONE") return [];

  if (isDemoIncident) {
    return [
      {
        id: "message-received",
        timeLabel: locale === "hi" ? "पहले" : "Earlier",
        title:
          locale === "hi"
            ? "एसबीआई केवाईसी अपडेट संदेश मिला"
            : "Received an SBI KYC update message",
        sourceRefs: [
          {
            type: "EVIDENCE",
            label: locale === "hi" ? "संदेश का स्क्रीनशॉट" : "Message screenshot",
            evidenceId: "demo-message",
          },
        ],
      },
      {
        id: "instructions-followed",
        timeLabel: locale === "hi" ? "बाद में" : "Later",
        title:
          locale === "hi"
            ? "केवाईसी निर्देश खोले और उनका पालन किया"
            : "Opened and followed the KYC instructions",
        sourceRefs: [
          {
            type: "STATEMENT",
            label: locale === "hi" ? "बयान" : "Statement",
          },
        ],
      },
      {
        id: "transaction-recorded",
        timeLabel: locale === "hi" ? "सुबह 7:05 बजे" : "7:05 AM",
        title:
          locale === "hi"
            ? "एसबीआई खाते से ₹40,000 डेबिट हुए"
            : "₹40,000 was debited from the SBI account",
        sourceRefs: [
          {
            type: "TRANSACTION",
            label: locale === "hi" ? "बैंक लेन-देन" : "Bank transaction",
            evidenceId: "demo-transaction",
          },
        ],
      },
    ];
  }

  const events: IncidentTimelineEvent[] = [];
  const messageEvidenceIndex = draft.evidence.findIndex(
    (item) => item.type === "CHAT_SCREENSHOT",
  );
  if (messageEvidenceIndex >= 0) {
    const facts = draft.evidence[messageEvidenceIndex]?.extractedFacts.join(" ") ?? "";
    const kyc = /KYC|केवाईसी/i.test(facts);
    events.push({
      id: "message-evidence",
      timeLabel: displayTime(draft.incident.approximateTime, locale, true),
      title: kyc
        ? locale === "hi"
          ? "केवाईसी अपडेट संदेश मिला"
          : "Received a KYC update message"
        : locale === "hi"
          ? "संदेश या चैट मिली"
          : "Received a message or chat",
      sourceRefs: [
        {
          type: "EVIDENCE",
          label: locale === "hi" ? "संदेश का स्क्रीनशॉट" : "Message screenshot",
          evidenceId: uploadedScreenshotId(draft, messageEvidenceIndex),
        },
      ],
    });
  }

  if (statementSupportsInstructionStep(draft)) {
    events.push({
      id: "statement-action",
      timeLabel: locale === "hi" ? "बाद में" : "Later",
      title:
        locale === "hi"
          ? "संदेश में दिए निर्देश खोले या उनका पालन किया"
          : "Opened or followed the instructions in the message",
      sourceRefs: [
        {
          type: "STATEMENT",
          label: locale === "hi" ? "बयान" : "Statement",
        },
      ],
    });
  }

  const transaction = draft.transactions[0];
  if (transaction?.amount) {
    const institution = transaction.institution?.trim();
    const transactionEvidenceIndex = draft.evidence.findIndex(
      (item) => item.type === "TRANSACTION_SCREENSHOT",
    );
    events.push({
      id: "transaction",
      timeLabel: displayTime(transaction.approximateTime, locale),
      title:
        locale === "hi"
          ? `${formatCurrency(transaction.amount)}${institution ? ` का ${institution} लेन-देन` : " का लेन-देन"} दर्ज हुआ`
          : `${formatCurrency(transaction.amount)} transaction${institution ? ` with ${institution}` : ""} was recorded`,
      sourceRefs: [
        transactionEvidenceIndex >= 0
          ? {
              type: "TRANSACTION",
              label: locale === "hi" ? "बैंक लेन-देन" : "Bank transaction",
              evidenceId: uploadedScreenshotId(draft, transactionEvidenceIndex),
            }
          : {
              type: "STATEMENT",
              label: locale === "hi" ? "बयान" : "Statement",
            },
      ],
    });
  }

  return events.length >= 2 ? events : [];
}
