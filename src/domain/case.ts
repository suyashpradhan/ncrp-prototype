import type { ProcessEvent } from "./events";
import type { ProcessRoute, ProcessRouteReason, Provenance } from "../sop/processes";

export type FraudType =
  | "INVESTMENT_SCAM"
  | "UPI_FRAUD"
  | "DIGITAL_ARREST"
  | "TASK_SCAM"
  | "IMPERSONATION"
  | "CARD_FRAUD"
  | "MARKETPLACE_SCAM"
  | "BETTING_LINKED"
  | "OTHER_FINANCIAL_FRAUD";

export type Complaint = {
  id: string;
  acknowledgementId: string;
  reportedAmount: number;
  reportedAt: string;
  firStatus: "REGISTERED" | "NOT_REGISTERED";
  jurisdiction: string;
};

export type BeneficiaryInstitution = {
  name: string;
  maskedAccount?: string;
};

export type MoneyPath = {
  id: string;
  amount: number;
  beneficiaryInstitution?: BeneficiaryInstitution;
  /** Authoritative mocked backend state; selectors never choose this route. */
  selectedProcess: ProcessRoute | null;
  /** Authoritative explanation facts attached to the recorded route. */
  recordedRouteReasons: ProcessRouteReason[];
  events: ProcessEvent[];
  provenance: Provenance[];
};

export type Case = {
  id: string;
  syntheticCitizen: {
    displayName: string;
  };
  fraudType: FraudType;
  complaint: Complaint;
  moneyPaths: MoneyPath[];
};
