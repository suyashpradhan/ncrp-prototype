import type { Actor } from "./actors";

export type ProcessEventType =
  | "COMPLAINT_REGISTERED"
  | "FIR_REGISTERED"
  | "MONEY_PATH_IDENTIFIED"
  | "AMOUNT_HELD"
  | "AMOUNT_EXITED_FINANCIAL_SYSTEM"
  | "AMOUNT_NOT_CURRENTLY_HELD"
  | "MRM_REQUEST_RAISED"
  | "REQUEST_ASSIGNED_TO_IO"
  | "ACCOUNT_HOLDER_NOTICE_REQUIRED"
  | "ACCOUNT_HOLDER_NOTICE_ISSUED"
  | "ACCOUNT_HOLDER_RESPONDED"
  | "ACCOUNT_HOLDER_NON_RESPONSE_RECORDED"
  | "SP_DCP_APPROVAL_RECORDED"
  | "INDEMNITY_BOND_RECORDED"
  | "BANK_DIRECTION_ISSUED"
  | "INTERIM_CUSTODY_CONFIRMED"
  | "ACCOUNT_HOLDER_CONTESTED"
  | "COURT_ROUTE_RECORDED";

export type ProcessEvent = {
  id: string;
  type: ProcessEventType;
  occurredAt: string;
  actor: Actor;
  metadata?: Readonly<Record<string, string | number | boolean>>;
};
