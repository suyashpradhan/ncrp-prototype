import type { Message } from "./messages";

export type CitizenActionCode = "NONE" | "SUBMIT_INDEMNITY_BOND";

export type CitizenAction = {
  code: CitizenActionCode;
  instruction: Message;
};

export const CITIZEN_ACTIONS = {
  NONE: {
    code: "NONE",
    instruction: {
      key: "citizenAction.none",
      defaultMessage: "Nothing right now.",
    },
  },
  SUBMIT_INDEMNITY_BOND: {
    code: "SUBMIT_INDEMNITY_BOND",
    instruction: {
      key: "citizenAction.submitIndemnityBond",
      defaultMessage: "Submit the requested indemnity bond.",
    },
  },
} as const satisfies Record<CitizenActionCode, CitizenAction>;
