import type { Case, MoneyPath } from "../domain/case";
import { reconcileCaseAmounts } from "../domain/reconciliation";
import { deriveFinancialOutcome } from "../sop/selectors";

export const DEMO_RESTORATION_REQUEST_ID = "MRM-DEMO-2026-00182";
export const DEMO_REFUND_ACCOUNT = "•••• 4821";

export type JourneyStage =
  | "FRAUD"
  | "NCRP_REPORT"
  | "COMPLAINT_REGISTERED"
  | "POST_REPORT_HANDOFF"
  | "MRM_REQUEST"
  | "MRM_SUBMITTED"
  | "FINANCIAL_RESOLUTION";

export type JourneyTrailState =
  | "HELD"
  | "RECEIVED"
  | "EXITED"
  | "NOT_SECURED"
  | "ATTRIBUTION_PENDING";

export type JourneyTrailItem = {
  id: string;
  amount: number;
  institutionName: string | null;
  state: JourneyTrailState;
};

export type JourneyFinancialSummary = {
  reportedAmount: number;
  activeAmount: number;
  receivedAmount: number;
  exitedAmount: number;
  notSecuredAmount: number;
};

function institutionName(path: MoneyPath): string | null {
  return path.beneficiaryInstitution?.name.replace(" (synthetic)", "") ?? null;
}

export function deriveJourneyTrail(caseData: Case): JourneyTrailItem[] {
  return caseData.moneyPaths.map((path) => {
    const state = deriveFinancialOutcome(path).state;
    let journeyState: JourneyTrailState;

    switch (state) {
      case "HELD":
      case "RESTORATION_PROCESSING":
        journeyState = "HELD";
        break;
      case "INTERIM_CUSTODY":
        journeyState = "RECEIVED";
        break;
      case "EXITED_FINANCIAL_SYSTEM":
        journeyState = "EXITED";
        break;
      case "NOT_CURRENTLY_HELD":
        journeyState = "NOT_SECURED";
        break;
      case "MULTI_VICTIM_ATTRIBUTION":
        journeyState = "ATTRIBUTION_PENDING";
        break;
    }

    return {
      id: path.id,
      amount: path.amount,
      institutionName: institutionName(path),
      state: journeyState,
    };
  });
}

export function deriveJourneyFinancialSummary(caseData: Case): JourneyFinancialSummary {
  const reconciliation = reconcileCaseAmounts(caseData);

  return {
    reportedAmount: reconciliation.reportedAmount,
    activeAmount:
      reconciliation.byFinancialState.HELD +
      reconciliation.byFinancialState.RESTORATION_PROCESSING,
    receivedAmount: reconciliation.byFinancialState.INTERIM_CUSTODY,
    exitedAmount: reconciliation.byFinancialState.EXITED_FINANCIAL_SYSTEM,
    notSecuredAmount: reconciliation.byFinancialState.NOT_CURRENTLY_HELD,
  };
}
