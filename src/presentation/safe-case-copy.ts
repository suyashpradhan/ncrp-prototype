import type { IncidentDraft } from "../incident/schema";
import { sanitizeSensitiveText } from "../incident/sensitive-text";
import type { UiLocale } from "../i18n/i18n-provider";
import { formatCurrency } from "./format";

function line(label: string, value: string | null | undefined) {
  return value ? `${label}: ${sanitizeSensitiveText(value).text}` : null;
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
    line(hi ? "घटना की तारीख" : "Incident date", draft.incident.incidentDate),
    line(hi ? "संदर्भ" : "Reference", reference),
  ].filter((item): item is string => Boolean(item)).join("\n");
}

export function downloadCitizenReport(
  draft: IncidentDraft,
  reference: string,
  locale: UiLocale,
  submittedAt?: string,
) {
  const hi = locale === "hi";
  const transactionLines = draft.transactions.flatMap((transaction, index) => [
    `\n${hi ? "लेन-देन" : "Transaction"} ${index + 1}`,
    transaction.amount ? `${hi ? "राशि" : "Amount"}: ${formatCurrency(transaction.amount)}` : null,
    line(hi ? "बैंक या भुगतान ऐप" : "Bank / payment institution", transaction.institution),
    line(hi ? "लेन-देन संदर्भ" : "Transaction reference", transaction.transactionIdOrUtr),
    line(hi ? "तारीख" : "Date", transaction.transactionDate),
    line(hi ? "लगभग समय" : "Approximate time", transaction.approximateTime),
  ]).filter((item): item is string => Boolean(item));
  const evidence = draft.evidence.map((item, index) =>
    `${index + 1}. ${item.type.replaceAll("_", " ").toLowerCase()}`,
  );
  const content = [
    "Sachet",
    hi ? "नागरिक के लिए रिपोर्ट की प्रति" : "Citizen-readable report copy",
    "",
    getSafeCaseSummary(draft, reference, locale),
    submittedAt
      ? line(
          hi ? "जमा करने का समय" : "Submitted",
          new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          }).format(new Date(submittedAt)),
        )
      : null,
    line(hi ? "घटना का सार" : "Incident summary", draft.citizenSummary.shortSummary),
    ...transactionLines,
    evidence.length ? `\n${hi ? "सबूत" : "Evidence"}\n${evidence.join("\n")}` : null,
    "",
    hi
      ? "प्रोटोटाइप प्रति — यह आधिकारिक NCRP पावती या सरकारी सबमिशन रसीद नहीं है।"
      : "Prototype copy — not an official NCRP acknowledgement or government submission receipt.",
  ].filter((item): item is string => item !== null).join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sachet-${reference.replace(/[^a-z0-9-]/gi, "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
