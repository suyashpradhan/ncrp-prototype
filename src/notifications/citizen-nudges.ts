import type { IncidentDraft } from "../incident/schema";
import type { UiLocale } from "../i18n/i18n-provider";

export type NotificationChannel = "EMAIL" | "WHATSAPP";
export type CitizenNudgeReason =
  | "FINANCIAL_SAFETY"
  | "ACCOUNT_SECURITY"
  | "MISSING_INFORMATION"
  | "EVIDENCE_PRESERVATION"
  | "RECOVERY_SCAM_WARNING";
export type CitizenNudgeSchedule = "TODAY" | "TOMORROW";

export type CitizenNudge = {
  id: string;
  title: string;
  body: string;
  reason: CitizenNudgeReason;
  schedule: CitizenNudgeSchedule;
  channel: NotificationChannel;
  deliveryState: "PROTOTYPE_PREVIEW";
};

export function deriveCitizenNudges(
  draft: IncidentDraft,
  locale: UiLocale,
  channel: NotificationChannel,
): CitizenNudge[] {
  const hi = locale === "hi";
  const accountCompromise = draft.adaptiveFacts.accountCompromise === true;
  const financialLoss =
    draft.incident.financialLossState === "YES" && draft.transactions.length > 0;
  const missingReference = draft.transactions.some(
    (transaction) =>
      !transaction.transactionIdOrUtr ||
      transaction.transactionIdOrUtr === "__CITIZEN_DOES_NOT_HAVE__",
  );

  const first: CitizenNudge = accountCompromise
    ? {
        id: "account-security-today",
        title: hi ? "अपने रिकवरी विवरण जाँचें" : "Check your recovery details",
        body: hi
          ? "रिकवरी ईमेल और फ़ोन नंबर जाँचें। सक्रिय सत्र देखें और अपना मुख्य ईमेल सुरक्षित करें।"
          : "Check your recovery email and phone number. Review active sessions and secure your primary email account.",
        reason: "ACCOUNT_SECURITY",
        schedule: "TODAY",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      }
    : financialLoss
      ? {
          id: "transaction-details-today",
          title: hi ? "लेन-देन के संदर्भ तैयार रखें" : "Keep your transaction references ready",
          body: hi
            ? "अपनी शिकायत, भुगतान रिकॉर्ड और उपलब्ध लेन-देन संदर्भ एक साथ रखें।"
            : "Keep your complaint, payment records and available transaction references together.",
          reason: missingReference
            ? "MISSING_INFORMATION"
            : "FINANCIAL_SAFETY",
          schedule: "TODAY",
          channel,
          deliveryState: "PROTOTYPE_PREVIEW",
        }
      : {
          id: "preserve-evidence-today",
          title: hi ? "सबूत सुरक्षित रखें" : "Preserve the evidence",
          body: hi
            ? "संदेश, स्क्रीनशॉट और अकाउंट सूचना सुरक्षित रखें। संदिग्ध संदेश अभी न मिटाएँ।"
            : "Keep messages, screenshots and account notifications. Do not delete suspicious messages yet.",
          reason: "EVIDENCE_PRESERVATION",
          schedule: "TODAY",
          channel,
          deliveryState: "PROTOTYPE_PREVIEW",
        };

  return [
    first,
    {
      id: "recovery-scam-tomorrow",
      title: hi ? "रिकवरी शुल्क मांगने वालों से सावधान रहें" : "Be cautious of recovery-fee requests",
      body: hi
        ? "यदि कोई गारंटी के साथ पैसे वापस दिलाने के लिए शुल्क मांगे, तो सावधान रहें।"
        : "Be cautious if someone promises guaranteed recovery in exchange for a fee.",
      reason: "RECOVERY_SCAM_WARNING",
      schedule: "TOMORROW",
      channel,
      deliveryState: "PROTOTYPE_PREVIEW",
    },
  ];
}
