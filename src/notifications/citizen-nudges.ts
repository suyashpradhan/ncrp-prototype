import type { IncidentDraft } from "../incident/schema";
import type { UiLocale } from "../i18n/i18n-provider";
import { getIncidentCapabilities } from "../incident/capabilities";

export type NotificationChannel = "EMAIL" | "WHATSAPP";
export type CitizenNudgeReason =
  | "FINANCIAL_SAFETY"
  | "ACCOUNT_SECURITY"
  | "MISSING_INFORMATION"
  | "EVIDENCE_PRESERVATION"
  | "RECOVERY_SCAM_WARNING"
  | "SENSITIVE_INFORMATION"
  | "PERSONAL_SAFETY";
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
  const capabilities = getIncidentCapabilities(draft);
  const accountCompromise = capabilities.accountCompromise;
  const threatOrExtortion = capabilities.threatOrExtortion;
  const financialLoss =
    draft.incident.financialLossState === "YES" && draft.transactions.length > 0;
  const missingReference = draft.transactions.some(
    (transaction) =>
      !transaction.transactionIdOrUtr ||
      transaction.transactionIdOrUtr === "__CITIZEN_DOES_NOT_HAVE__",
  );

  if (financialLoss) {
    return [
      {
        id: "transaction-details-today",
        title: hi
          ? "लेन-देन के संदर्भ तैयार रखें"
          : "Keep your transaction references ready",
        body: hi
          ? "अपनी शिकायत, भुगतान रिकॉर्ड और उपलब्ध लेन-देन संदर्भ एक साथ रखें।"
          : "Keep your complaint, payment records and available transaction references together.",
        reason: missingReference
          ? "MISSING_INFORMATION"
          : "FINANCIAL_SAFETY",
        schedule: "TODAY",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
      {
        id: "recovery-scam-tomorrow",
        title: hi
          ? "रिकवरी शुल्क मांगने वालों से सावधान रहें"
          : "Be cautious of recovery-fee requests",
        body: hi
          ? "गारंटी के साथ पैसे वापस दिलाने के बदले शुल्क मांगने वाले को भुगतान न करें।"
          : "Do not pay someone who promises guaranteed recovery in exchange for a fee.",
        reason: "RECOVERY_SCAM_WARNING",
        schedule: "TOMORROW",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
    ];
  }

  if (accountCompromise) {
    return [
      {
        id: "account-security-today",
        title: hi ? "अपने रिकवरी विवरण जाँचें" : "Check your recovery details",
        body: hi
          ? "रिकवरी ईमेल और फ़ोन नंबर जाँचें। सक्रिय सत्र देखें और अपना मुख्य ईमेल सुरक्षित करें।"
          : "Check your recovery email and phone number. Review active sessions and secure your primary email account.",
        reason: "ACCOUNT_SECURITY",
        schedule: "TODAY",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
      {
        id: "review-active-sessions-tomorrow",
        title: hi ? "अनजान सक्रिय सत्र हटाएँ" : "Sign out unfamiliar active sessions",
        body: hi
          ? "अकाउंट की आधिकारिक सुरक्षा सेटिंग में सक्रिय सत्र देखें और अनजान डिवाइस से साइन आउट करें।"
          : "Review active sessions in the account's official security settings and sign out unfamiliar devices.",
        reason: "ACCOUNT_SECURITY",
        schedule: "TOMORROW",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
    ];
  }

  if (threatOrExtortion) {
    return [
      {
        id: "preserve-threat-evidence-today",
        title: hi ? "धमकी वाले संदेश सुरक्षित रखें" : "Preserve the threatening messages",
        body: hi
          ? "मूल संदेश, भेजने वाले की जानकारी और उपलब्ध स्क्रीनशॉट सुरक्षित रखें।"
          : "Keep the original messages, sender details and available screenshots.",
        reason: "EVIDENCE_PRESERVATION",
        schedule: "TODAY",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
      {
        id: "extortion-safety-tomorrow",
        title: hi ? "दबाव में पैसे न भेजें" : "Do not send money solely because of the threat",
        body: hi
          ? "धमकी जारी रहे या तत्काल खतरा हो तो आधिकारिक पुलिस या सहायता माध्यम का उपयोग करें।"
          : "Use official police or support channels if the threat continues or there is immediate danger.",
        reason: "PERSONAL_SAFETY",
        schedule: "TOMORROW",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
    ];
  }

  if (
    draft.classification.reportFamily === "FINANCIAL_FRAUD" &&
    draft.incident.financialLossState === "NO"
  ) {
    return [
      {
        id: "avoid-payment-today",
        title: hi ? "कोई शुल्क या भुगतान न भेजें" : "Do not pay a processing or release fee",
        body: hi
          ? "आधार, बैंक विवरण, OTP, PIN या दूसरी संवेदनशील जानकारी साझा न करें।"
          : "Do not share Aadhaar, bank details, OTPs, PINs or other sensitive information.",
        reason: "SENSITIVE_INFORMATION",
        schedule: "TODAY",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
      {
        id: "preserve-contact-tomorrow",
        title: hi ? "संदेश और संपर्क की जानकारी रखें" : "Preserve the messages and contact details",
        body: hi
          ? "संपर्क में इस्तेमाल फोन नंबर, प्रोफ़ाइल, लिंक और स्क्रीनशॉट सुरक्षित रखें।"
          : "Keep the phone number, profile, links and screenshots used to contact you.",
        reason: "EVIDENCE_PRESERVATION",
        schedule: "TOMORROW",
        channel,
        deliveryState: "PROTOTYPE_PREVIEW",
      },
    ];
  }

  return [
    {
      id: "preserve-evidence-today",
      title: hi ? "सबूत सुरक्षित रखें" : "Preserve the evidence",
      body: hi
        ? "संदेश, स्क्रीनशॉट और अकाउंट सूचना सुरक्षित रखें। संदिग्ध संदेश अभी न मिटाएँ।"
        : "Keep messages, screenshots and account notifications. Do not delete suspicious messages yet.",
      reason: "EVIDENCE_PRESERVATION",
      schedule: "TODAY",
      channel,
      deliveryState: "PROTOTYPE_PREVIEW",
    },
  ];
}
