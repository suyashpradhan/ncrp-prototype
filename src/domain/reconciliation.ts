import type { Case } from "./case";
import type { FinancialState } from "./outcomes";
import { deriveFinancialState } from "../sop/selectors";

export type CaseReconciliation = {
  reportedAmount: number;
  allocatedAmount: number;
  difference: number;
  isReconciled: boolean;
  byFinancialState: Record<FinancialState, number>;
};

const EMPTY_STATE_TOTALS: Record<FinancialState, number> = {
  HELD: 0,
  RESTORATION_PROCESSING: 0,
  INTERIM_CUSTODY: 0,
  EXITED_FINANCIAL_SYSTEM: 0,
  NOT_CURRENTLY_HELD: 0,
  MULTI_VICTIM_ATTRIBUTION: 0,
};

export function reconcileCaseAmounts(caseData: Case): CaseReconciliation {
  const byFinancialState = { ...EMPTY_STATE_TOTALS };
  let allocatedAmount = 0;

  for (const path of caseData.moneyPaths) {
    if (!Number.isSafeInteger(path.amount) || path.amount < 0) {
      throw new Error(`Money path ${path.id} must use a non-negative whole-rupee amount.`);
    }

    allocatedAmount += path.amount;
    byFinancialState[deriveFinancialState(path)] += path.amount;
  }

  const reportedAmount = caseData.complaint.reportedAmount;
  const difference = reportedAmount - allocatedAmount;

  return {
    reportedAmount,
    allocatedAmount,
    difference,
    isReconciled: difference === 0,
    byFinancialState,
  };
}

export function assertCaseReconciles(caseData: Case): void {
  if (!Number.isSafeInteger(caseData.complaint.reportedAmount) || caseData.complaint.reportedAmount < 0) {
    throw new Error("Reported amount must be a non-negative whole-rupee amount.");
  }

  const pathIds = new Set(caseData.moneyPaths.map((path) => path.id));
  if (pathIds.size !== caseData.moneyPaths.length) {
    throw new Error("Money path IDs must be unique.");
  }

  const result = reconcileCaseAmounts(caseData);
  if (!result.isReconciled) {
    throw new Error(
      `Case ${caseData.id} does not reconcile: reported ${result.reportedAmount}, allocated ${result.allocatedAmount}.`,
    );
  }
}
