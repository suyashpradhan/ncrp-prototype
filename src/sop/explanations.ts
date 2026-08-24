import type { MoneyPath } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessRoute, ProcessRouteReason, Provenance } from "./processes";

const ROUTE_REASON_MESSAGES = {
  SINGLE_VICTIM_RECORDED: {
    key: "routeReason.singleVictim",
    defaultMessage: "A single victim is recorded for this amount.",
  },
  AMOUNT_HELD_AT_BENEFICIARY_ACCOUNT: {
    key: "routeReason.amountHeld",
    defaultMessage: "The amount is recorded as held at this beneficiary account.",
  },
  FIR_REGISTERED: {
    key: "routeReason.firRegistered",
    defaultMessage: "An FIR is recorded as registered.",
  },
  SECTION_106_3_ROUTE_RECORDED: {
    key: "routeReason.section1063",
    defaultMessage: "The IO is recorded as proceeding under Section 106(3) BNSS.",
  },
  MULTIPLE_OR_COMPETING_CLAIMS_RECORDED: {
    key: "routeReason.competingClaims",
    defaultMessage: "Multiple or competing claims are recorded for this amount.",
  },
  COURT_DIRECTION_RECORDED: {
    key: "routeReason.courtDirection",
    defaultMessage: "A court direction is recorded for this money path.",
  },
} satisfies Record<ProcessRouteReason, Message>;

export type RecordedProcessExplanation = {
  recordedProcess: ProcessRoute | null;
  heading: Message;
  reasons: Message[];
  provenance: Provenance[];
};

/** Explains authoritative recorded data. It never selects or recommends a route. */
export function explainRecordedProcess(path: MoneyPath): RecordedProcessExplanation {
  return {
    recordedProcess: path.selectedProcess,
    heading: path.selectedProcess
      ? {
          key: "recordedProcess.heading",
          defaultMessage: `Recorded process: ${path.selectedProcess.replace("_", " ")}`,
        }
      : {
          key: "recordedProcess.none",
          defaultMessage: "No restoration process is currently recorded.",
        },
    reasons: path.recordedRouteReasons.map((reason) => ROUTE_REASON_MESSAGES[reason]),
    provenance: path.provenance,
  };
}
