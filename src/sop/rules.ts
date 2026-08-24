import type { Actor } from "../domain/actors";
import { CITIZEN_ACTIONS, type CitizenAction } from "../domain/actions";
import type { Message } from "../domain/messages";
import type { ProcessStage, Provenance } from "./processes";

export type SopRule = {
  stage: ProcessStage;
  owner: Actor;
  durationDays: number | null;
  clockSemantics: "WITHIN" | "UP_TO" | null;
  citizenAction: CitizenAction;
  clockLabel: Message | null;
  provenance: Provenance | null;
};

const PROCESS_1_PROVENANCE: Provenance = {
  source: "JAN_2026_NCRP_CFCFRMS_SOP",
  process: "PROCESS_1",
  section: "Process 1 (synthetic encoding)",
  note: "Procedural rule encoded for this synthetic Process 1 demonstration.",
};

export const SOP_RULES: Readonly<Record<ProcessStage, SopRule>> = {
  MONEY_PATH_IDENTIFIED: {
    stage: "MONEY_PATH_IDENTIFIED",
    owner: "INVESTIGATING_OFFICER",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: null,
  },
  ACCOUNT_HOLDER_NOTICE: {
    stage: "ACCOUNT_HOLDER_NOTICE",
    owner: "INVESTIGATING_OFFICER",
    durationDays: 7,
    clockSemantics: "WITHIN",
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: {
      key: "clock.accountHolderNotice",
      defaultMessage: "Notice within 7 calendar days",
    },
    provenance: PROCESS_1_PROVENANCE,
  },
  ACCOUNT_HOLDER_RESPONSE: {
    stage: "ACCOUNT_HOLDER_RESPONSE",
    owner: "ACCOUNT_HOLDER",
    durationDays: 15,
    clockSemantics: "UP_TO",
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: {
      key: "clock.accountHolderResponse",
      defaultMessage: "Account holder may respond for up to 15 calendar days",
    },
    provenance: PROCESS_1_PROVENANCE,
  },
  SP_DCP_APPROVAL: {
    stage: "SP_DCP_APPROVAL",
    owner: "SP_DCP",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: PROCESS_1_PROVENANCE,
  },
  INDEMNITY_BOND_REQUIRED: {
    stage: "INDEMNITY_BOND_REQUIRED",
    owner: "CITIZEN",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.SUBMIT_INDEMNITY_BOND,
    clockLabel: null,
    provenance: PROCESS_1_PROVENANCE,
  },
  BANK_DIRECTION: {
    stage: "BANK_DIRECTION",
    owner: "INVESTIGATING_OFFICER",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: PROCESS_1_PROVENANCE,
  },
  BANK_DIRECTION_RECEIPT: {
    stage: "BANK_DIRECTION_RECEIPT",
    owner: "BANK",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: PROCESS_1_PROVENANCE,
  },
  BANK_INTERIM_CUSTODY: {
    stage: "BANK_INTERIM_CUSTODY",
    owner: "BANK",
    durationDays: 15,
    clockSemantics: "UP_TO",
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: {
      key: "clock.bankInterimCustody",
      defaultMessage: "Bank action may take up to 15 calendar days from recorded receipt",
    },
    provenance: PROCESS_1_PROVENANCE,
  },
  INTERIM_CUSTODY_CONFIRMED: {
    stage: "INTERIM_CUSTODY_CONFIRMED",
    owner: "NONE",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: PROCESS_1_PROVENANCE,
  },
  EXITED_FINANCIAL_SYSTEM: {
    stage: "EXITED_FINANCIAL_SYSTEM",
    owner: "NONE",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: null,
  },
  NOT_CURRENTLY_HELD: {
    stage: "NOT_CURRENTLY_HELD",
    owner: "INVESTIGATING_OFFICER",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: null,
  },
  COURT_ROUTE: {
    stage: "COURT_ROUTE",
    owner: "COURT",
    durationDays: null,
    clockSemantics: null,
    citizenAction: CITIZEN_ACTIONS.NONE,
    clockLabel: null,
    provenance: {
      source: "JAN_2026_NCRP_CFCFRMS_SOP",
      note: "A court route is recorded in the synthetic event history; no deadline is inferred.",
    },
  },
};

export function getSopRule(stage: ProcessStage): SopRule {
  return SOP_RULES[stage];
}
