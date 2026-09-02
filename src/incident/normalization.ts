import type {
  FinancialExposure,
  FinancialLossState,
  IncidentDraft,
} from "./schema";

const EMPTY_FINANCIAL_EXPOSURE: FinancialExposure = {
  bankDetailsRequested: null,
  identityDocumentRequested: null,
  otpRequested: null,
  paymentLinkReceived: null,
  upiCollectRequestReceived: null,
};

const INSTITUTION_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\bindian bank\b/i, "Indian Bank"],
  [/\bstate bank of india\b|\bsbi\b/i, "SBI"],
  [/\bhdfc(?: bank)?\b/i, "HDFC Bank"],
  [/\bicici(?: bank)?\b/i, "ICICI Bank"],
  [/\baxis(?: bank)?\b/i, "Axis Bank"],
  [/\bkotak(?: mahindra)?(?: bank)?\b/i, "Kotak Mahindra Bank"],
  [/\bpaytm\b/i, "Paytm"],
  [/\bphonepe\b/i, "PhonePe"],
  [/\bgoogle pay\b|\bgpay\b/i, "Google Pay"],
];

type ExtractedAmount = {
  amount: number;
  index: number;
  context: string;
  prizeAmount: boolean;
};

export type DeterministicFinancialFacts = {
  financialLossState: FinancialLossState;
  financialExposure: FinancialExposure;
  mentionedInstitutions: string[];
  transactionAmounts: number[];
  reportedAmount: number | null;
};

function parseAmount(raw: string, unit: string | undefined): number | null {
  const numeric = Number(raw.replaceAll(",", ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const multiplier = /crore/i.test(unit ?? "")
    ? 10_000_000
    : /lakh|lac/i.test(unit ?? "")
      ? 100_000
      : /thousand|k\b/i.test(unit ?? "")
        ? 1_000
        : 1;
  return Math.round(numeric * multiplier);
}

function amountsFromText(text: string): ExtractedAmount[] {
  const pattern = /(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(crores?|lakhs?|lacs?|thousand|k)?|([\d,.]+)\s*(crores?|lakhs?|lacs?|thousand|k)?\s*(?:rupees?|रुपये)/gi;
  const matches: ExtractedAmount[] = [];
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[3];
    const amount = raw ? parseAmount(raw, match[2] ?? match[4]) : null;
    if (!amount || match.index === undefined) continue;
    matches.push({
      amount,
      index: match.index,
      context: text.slice(Math.max(0, match.index - 70), match.index + match[0].length + 45),
      prizeAmount: /\b(?:won|win|prize|lottery|reward)(?:\s+(?:of|worth))?\s*$/i.test(
        text.slice(Math.max(0, match.index - 35), match.index),
      ),
    });
  }
  return matches;
}

export function deriveFinancialFactsFromText(text: string): DeterministicFinancialFacts {
  const normalized = text.trim();
  const explicitNoLoss = /\b(?:did not|didn't|have not|haven't|no)\s+(?:pay|paid|transfer|transferred|lose|lost|make (?:a )?payment)|\bno money (?:was )?(?:lost|paid|debited|transferred)|\bwithout (?:paying|losing)\b/i.test(normalized);
  const explicitLoss = /\b(?:paid|transferred|sent|debited|deducted|lost|made (?:a )?payment)\b/i.test(normalized) && !explicitNoLoss;
  const financialLossState: FinancialLossState = explicitNoLoss
    ? "NO"
    : explicitLoss
      ? "YES"
      : "UNKNOWN";

  const financialExposure: FinancialExposure = {
    ...EMPTY_FINANCIAL_EXPOSURE,
    bankDetailsRequested: /(?:ask(?:ed|s|ing)?|request(?:ed|s|ing)?)\s+(?:me\s+)?(?:for|to share).*bank (?:details|account)|bank (?:details|account).*(?:ask(?:ed|s|ing)?|request(?:ed|s|ing)?)/i.test(normalized) ? true : null,
    identityDocumentRequested: /(?:ask(?:ed|s|ing)?|request(?:ed|s|ing)?).*(?:aadhaar|aadhar|pan|identity (?:document|proof)|id proof)/i.test(normalized) ? true : null,
    otpRequested: /(?:ask(?:ed|s|ing)?|request(?:ed|s|ing)?).*(?:otp|one[ -]?time password)/i.test(normalized) ? true : null,
    paymentLinkReceived: /(?:sent|received|opened|clicked).*(?:payment )?link|(?:payment )?link.*(?:sent|received|opened|clicked)/i.test(normalized) ? true : null,
    upiCollectRequestReceived: /upi collect request|collect request.*upi/i.test(normalized) ? true : null,
  };
  const mentionedInstitutions = INSTITUTION_PATTERNS
    .filter(([pattern]) => pattern.test(normalized))
    .map(([, label]) => label);

  const amounts = amountsFromText(normalized);
  const nonPrizeAmounts = amounts.filter(({ prizeAmount }) => !prizeAmount);
  let transactionAmounts = financialLossState === "YES"
    ? nonPrizeAmounts.map(({ amount }) => amount)
    : [];
  if (
    transactionAmounts.length > 2 &&
    transactionAmounts[0] === transactionAmounts.slice(1).reduce((sum, amount) => sum + amount, 0)
  ) {
    transactionAmounts = transactionAmounts.slice(1);
  }
  const statedTotal = amounts.find(({ context }) => /\b(?:lost|total(?: loss)?|altogether)\b/i.test(context))?.amount ?? null;
  const componentTotal = transactionAmounts.reduce((sum, amount) => sum + amount, 0);

  return {
    financialLossState,
    financialExposure,
    mentionedInstitutions,
    transactionAmounts,
    reportedAmount: financialLossState === "YES"
      ? statedTotal ?? (componentTotal > 0 ? componentTotal : null)
      : null,
  };
}

const CHANNEL_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\binstagram\b/i, "Instagram"],
  [/\bfacebook\b/i, "Facebook"],
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
    draft.classification.platform?.trim() ?? "",
    draft.adaptiveFacts.platform?.trim() ?? "",
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
  const reportCategory = draft.classification.reportFamily === "OUT_OF_SCOPE_OR_UNCLEAR"
    ? null
    : draft.classification.reportFamily;
  const platform = draft.adaptiveFacts.platform ?? draft.classification.platform;
  const supportedText = [
    draft.incident.narrative,
    draft.citizenSummary.shortSummary,
    ...draft.evidence.flatMap((item) => item.extractedFacts),
  ].filter(Boolean).join("\n");
  const extracted = deriveFinancialFactsFromText(supportedText);
  const isFinancialIncident = draft.classification.reportFamily === "FINANCIAL_FRAUD";
  const financialLossState = isFinancialIncident
    ? extracted.financialLossState !== "UNKNOWN"
      ? extracted.financialLossState
      : draft.incident.financialLossState
    : draft.classification.moneyLost === false || draft.incident.moneyLost === false
      ? "NO"
      : draft.incident.financialLossState;
  const moneyLost = isFinancialIncident
    ? financialLossState === "YES"
      ? true
      : financialLossState === "NO"
        ? false
        : null
    : draft.incident.moneyLost ?? draft.classification.moneyLost;
  const existingTransactions = financialLossState === "YES" ? draft.transactions : [];
  const transactions = existingTransactions.length > 0
    ? existingTransactions.map((transaction, index) => ({
        ...transaction,
        id: transaction.id || `transaction-${index + 1}`,
        currency: transaction.currency ?? "INR",
        status: transaction.amount || transaction.transactionIdOrUtr || transaction.referenceNumber
          ? "KNOWN" as const
          : "MISSING" as const,
      }))
    : extracted.transactionAmounts.map((amount, index) => ({
        id: `transaction-${index + 1}`,
        institution: null,
        currency: "INR",
        paymentMethod: null,
        accountOrUpiId: null,
        transactionIdOrUtr: null,
        amount,
        transactionDate: null,
        approximateTime: null,
        referenceNumber: null,
        status: "KNOWN" as const,
      }));
  const mentionedInstitutions = Array.from(new Set([
    ...draft.mentionedInstitutions,
    ...extracted.mentionedInstitutions,
  ]));
  return {
    ...draft,
    classification: {
      ...draft.classification,
      moneyLost,
    },
    officialMapping: {
      ...draft.officialMapping,
      category: reportCategory,
      categoryLabel: draft.classification.category,
      subCategoryLabel: draft.classification.subCategory,
    },
    adaptiveFacts: {
      ...draft.adaptiveFacts,
      platform,
    },
    financialExposure: Object.fromEntries(
      Object.entries(draft.financialExposure).map(([key, value]) => [
        key,
        extracted.financialExposure[key as keyof FinancialExposure] ?? value,
      ]),
    ) as FinancialExposure,
    mentionedInstitutions,
    incident: {
      ...draft.incident,
      financialLossState,
      moneyLost,
      reportedAmount: financialLossState === "YES"
        ? draft.incident.reportedAmount ?? extracted.reportedAmount
        : null,
      occurredOn: normalizeIncidentChannel(draft),
    },
    transactions,
  };
}
