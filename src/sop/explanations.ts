import type { MoneyPath } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessRoute, ProcessRouteFact, Provenance } from "./processes";

const RECORDED_FACT_MESSAGES = {
  SINGLE_VICTIM_RECORDED: {
    key: "recordedFact.singleVictim",
    defaultMessage: "A single victim is recorded for this amount.",
  },
  AMOUNT_HELD_AT_BENEFICIARY_ACCOUNT: {
    key: "recordedFact.amountHeld",
    defaultMessage: "The amount is recorded as held at this beneficiary account.",
  },
  FIR_REGISTERED: {
    key: "recordedFact.firRegistered",
    defaultMessage: "An FIR is recorded as registered.",
  },
  SECTION_106_3_ROUTE_RECORDED: {
    key: "recordedFact.section1063",
    defaultMessage: "The IO is recorded as proceeding under Section 106(3) BNSS.",
  },
  MULTIPLE_OR_COMPETING_CLAIMS_RECORDED: {
    key: "recordedFact.competingClaims",
    defaultMessage: "Multiple or competing claims are recorded for this amount.",
  },
  COURT_DIRECTION_RECORDED: {
    key: "recordedFact.courtDirection",
    defaultMessage: "A court direction is recorded for this money path.",
  },
} satisfies Record<ProcessRouteFact, Message>;

const PROCESS_ROUTE_MESSAGES = {
  PROCESS_1: { key: "processRoute.process1", defaultMessage: "Process 1" },
  PROCESS_2: { key: "processRoute.process2", defaultMessage: "Process 2" },
  PROCESS_3: { key: "processRoute.process3", defaultMessage: "Process 3" },
  PROCESS_4: { key: "processRoute.process4", defaultMessage: "Process 4" },
  PROCESS_5: { key: "processRoute.process5", defaultMessage: "Process 5" },
} satisfies Record<ProcessRoute, Message>;

export type RecordedProcessExplanation = {
  recordedProcess: ProcessRoute | null;
  heading: Message;
  factsHeading: Message;
  facts: Message[];
  provenance: Provenance[];
};

/** Explains authoritative recorded data. It never selects or recommends a route. */
export function explainRecordedProcess(path: MoneyPath): RecordedProcessExplanation {
  return {
    recordedProcess: path.selectedProcess,
    heading: path.selectedProcess
      ? {
          key: "recordedProcess.heading",
          defaultMessage: `Recorded process: ${PROCESS_ROUTE_MESSAGES[path.selectedProcess].defaultMessage}`,
        }
      : {
          key: "recordedProcess.none",
          defaultMessage: "No restoration process is currently recorded.",
        },
    factsHeading: {
      key: "recordedProcess.factsHeading",
      defaultMessage: "Recorded case facts",
    },
    facts: path.recordedRouteFacts.map((fact) => RECORDED_FACT_MESSAGES[fact]),
    provenance: path.provenance,
  };
}
