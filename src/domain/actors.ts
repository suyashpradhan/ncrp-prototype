import type { Message } from "./messages";

export type Actor =
  | "INVESTIGATING_OFFICER"
  | "ACCOUNT_HOLDER"
  | "SP_DCP"
  | "BANK"
  | "CITIZEN"
  | "COURT"
  | "SYSTEM"
  | "NONE";

export const ACTOR_MESSAGES = {
  INVESTIGATING_OFFICER: {
    key: "actor.investigatingOfficer",
    defaultMessage: "Investigating Officer",
  },
  ACCOUNT_HOLDER: {
    key: "actor.accountHolder",
    defaultMessage: "Beneficiary account holder",
  },
  SP_DCP: {
    key: "actor.spDcp",
    defaultMessage: "SP / DCP",
  },
  BANK: { key: "actor.bank", defaultMessage: "Bank" },
  CITIZEN: { key: "actor.citizen", defaultMessage: "You" },
  COURT: { key: "actor.court", defaultMessage: "Recorded court" },
  SYSTEM: { key: "actor.system", defaultMessage: "Case system" },
  NONE: { key: "actor.none", defaultMessage: "No next actor recorded" },
} satisfies Record<Actor, Message>;
