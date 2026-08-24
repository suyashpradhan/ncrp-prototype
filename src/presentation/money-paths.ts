import type { MoneyPath } from "../domain/case";
import { deriveCitizenAction, deriveCurrentStage, deriveOverdueState } from "../sop/selectors";

const STAGE_RELEVANCE = {
  INDEMNITY_BOND_REQUIRED: 1,
  ACCOUNT_HOLDER_NOTICE: 2,
  ACCOUNT_HOLDER_RESPONSE: 3,
  SP_DCP_APPROVAL: 4,
  BANK_DIRECTION: 5,
  BANK_DIRECTION_RECEIPT: 6,
  BANK_INTERIM_CUSTODY: 7,
  MONEY_PATH_IDENTIFIED: 8,
  NOT_CURRENTLY_HELD: 9,
  COURT_ROUTE: 10,
  EXITED_FINANCIAL_SYSTEM: 11,
  INTERIM_CUSTODY_CONFIRMED: 12,
} as const;

export function rankMoneyPathsForOverview(paths: MoneyPath[], now: string): MoneyPath[] {
  return [...paths].sort((a, b) => {
    const actionA = deriveCitizenAction(a).code === "NONE" ? 1 : 0;
    const actionB = deriveCitizenAction(b).code === "NONE" ? 1 : 0;
    if (actionA !== actionB) return actionA - actionB;

    const overdueA = deriveOverdueState(a, now)?.isOverdue ? 0 : 1;
    const overdueB = deriveOverdueState(b, now)?.isOverdue ? 0 : 1;
    if (overdueA !== overdueB) return overdueA - overdueB;

    return STAGE_RELEVANCE[deriveCurrentStage(a)] - STAGE_RELEVANCE[deriveCurrentStage(b)];
  });
}
