import { CITIZEN_DOES_NOT_HAVE, type IncidentDraft } from "../incident/schema";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import type { UiLocale } from "../i18n/i18n-provider";
import { formatCurrency } from "./format";

function line(label: string, value: string | null | undefined) {
  if (!value || value === CITIZEN_DOES_NOT_HAVE || value === "UNKNOWN") return null;
  return `${label}: ${sanitizeSensitiveText(value).text}`;
}

function citizenDate(value: string | null, locale: UiLocale): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function getSafeCaseSummary(
  draft: IncidentDraft,
  reference: string,
  locale: UiLocale,
): string {
  const hi = locale === "hi";
  const total = draft.transactions.reduce((sum, item) => sum + (item.amount ?? 0), 0) ||
    draft.incident.reportedAmount;
  return [
    hi ? "साइबर अपराध रिपोर्ट सार" : "Cybercrime report summary",
    line(hi ? "प्रकार" : "Type", draft.officialMapping.subCategoryLabel ?? draft.citizenSummary.incidentLabel),
    draft.classification.reportFamily === "FINANCIAL_FRAUD"
      ? line(hi ? "वित्तीय नुकसान" : "Financial loss", draft.incident.financialLossState === "YES" ? "Yes" : draft.incident.financialLossState === "NO" ? "No" : "Not confirmed")
      : null,
    total ? line(hi ? "रिपोर्ट की गई हानि" : "Reported loss", formatCurrency(total)) : null,
    draft.transactions.length > 0
      ? line(hi ? "लेन-देन" : "Transactions", String(draft.transactions.length))
      : null,
    line(hi ? "घटना की तारीख" : "Incident date", citizenDate(draft.incident.incidentDate, locale)),
    line(hi ? "संदर्भ" : "Reference", reference),
  ].filter((item): item is string => Boolean(item)).join("\n");
}
