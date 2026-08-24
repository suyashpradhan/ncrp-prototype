import type { Message } from "./messages";
import type { ProcessRoute } from "../sop/processes";

export type FinancialState =
  | "HELD"
  | "RESTORATION_PROCESSING"
  | "INTERIM_CUSTODY"
  | "EXITED_FINANCIAL_SYSTEM"
  | "NOT_CURRENTLY_HELD"
  | "MULTI_VICTIM_ATTRIBUTION";

export type FinancialOutcome = {
  state: FinancialState;
  amount: number;
  explanation: Message;
};

export type LegalOutcomeState =
  | "RECORDED_PROCESS_ACTIVE"
  | "INTERIM_CUSTODY_UNDER_RECORDED_PROCESS"
  | "COURT_ROUTE_RECORDED"
  | "NO_RECORDED_RESTORATION_PROCESS";

export type LegalOutcome = {
  state: LegalOutcomeState;
  recordedProcess: ProcessRoute | null;
  explanation: Message;
};
