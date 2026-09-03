import type { IncidentDraft } from "./schema";

export type CaseConsistencyIssue = {
  id: string;
  type: "TOTAL_MISMATCH" | "FINANCIAL_LOSS_CONTRADICTION" | "POSSIBLE_DUPLICATE";
  severity: "BLOCKING" | "WARNING";
  affectedFieldIds: string[];
  sourceValues: Array<{ label: string; value: string | number }>;
  title: string;
  explanation: string;
};

export type DuplicateTransactionCandidate = {
  id: string;
  leftIndex: number;
  rightIndex: number;
  reason: "SAME_REFERENCE" | "MATCHING_DETAILS";
};

function normalizedReference(value: string | null): string | null {
  const normalized = value?.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return normalized || null;
}

export function getDuplicateTransactionCandidates(
  transactions: IncidentDraft["transactions"],
): DuplicateTransactionCandidate[] {
  const candidates: DuplicateTransactionCandidate[] = [];
  for (let leftIndex = 0; leftIndex < transactions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < transactions.length; rightIndex += 1) {
      const left = transactions[leftIndex];
      const right = transactions[rightIndex];
      const leftReference = normalizedReference(left.transactionIdOrUtr ?? left.referenceNumber);
      const rightReference = normalizedReference(right.transactionIdOrUtr ?? right.referenceNumber);
      const sameReference = Boolean(leftReference && leftReference === rightReference);
      const matchingDetails = Boolean(
        left.amount &&
          left.amount === right.amount &&
          left.institution &&
          left.institution.toLowerCase() === right.institution?.toLowerCase() &&
          left.transactionDate &&
          left.transactionDate === right.transactionDate &&
          left.approximateTime &&
          left.approximateTime === right.approximateTime,
      );
      if (!sameReference && !matchingDetails) continue;
      candidates.push({
        id: `duplicate-${left.id}-${right.id}`,
        leftIndex,
        rightIndex,
        reason: sameReference ? "SAME_REFERENCE" : "MATCHING_DETAILS",
      });
    }
  }
  return candidates;
}

export function getCaseConsistencyIssues(draft: IncidentDraft): CaseConsistencyIssue[] {
  const issues: CaseConsistencyIssue[] = [];
  const transactionTotal = draft.transactions.reduce(
    (total, transaction) => total + (transaction.amount ?? 0),
    0,
  );

  if (
    draft.incident.reportedAmount &&
    transactionTotal > 0 &&
    draft.incident.reportedAmount !== transactionTotal
  ) {
    issues.push({
      id: "reported-total-mismatch",
      type: "TOTAL_MISMATCH",
      severity: "BLOCKING",
      affectedFieldIds: ["reported-amount-conflict", "transaction-total"],
      sourceValues: [
        { label: "From your statement", value: draft.incident.reportedAmount },
        { label: "From your transactions", value: transactionTotal },
      ],
      title: "Check the total amount",
      explanation: "The stated loss and the transaction total are different.",
    });
  }

  if (draft.incident.financialLossState === "NO" && transactionTotal > 0) {
    issues.push({
      id: "financial-loss-contradiction",
      type: "FINANCIAL_LOSS_CONTRADICTION",
      severity: "BLOCKING",
      affectedFieldIds: ["money-lost", "transaction-total"],
      sourceValues: [
        { label: "Money lost", value: "No" },
        { label: "Payment found", value: transactionTotal },
      ],
      title: "Check whether money was lost",
      explanation: "The report says no money was lost, but it also contains a payment.",
    });
  }

  for (const duplicate of getDuplicateTransactionCandidates(draft.transactions)) {
    const transaction = draft.transactions[duplicate.leftIndex];
    issues.push({
      id: duplicate.id,
      type: "POSSIBLE_DUPLICATE",
      severity: "BLOCKING",
      affectedFieldIds: [
        `transaction-${duplicate.leftIndex}-amount`,
        `transaction-${duplicate.rightIndex}-amount`,
      ],
      sourceValues: [
        { label: "Amount", value: transaction.amount ?? "Not provided" },
        { label: "Reference", value: transaction.transactionIdOrUtr ?? "Not provided" },
      ],
      title: "This may be the same transaction",
      explanation: "We found what looks like the same payment in two places.",
    });
  }

  return issues;
}
