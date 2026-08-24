import type { Actor } from "../domain/actors";
import type { CitizenAction } from "../domain/actions";
import type { MoneyPath } from "../domain/case";
import type { ProcessEvent } from "../domain/events";
import type { Message } from "../domain/messages";
import type { FinancialOutcome, FinancialState, LegalOutcome } from "../domain/outcomes";
import type { ProcessStage, Provenance } from "./processes";
import { getSopRule } from "./rules";

const EVENT_STAGE: Partial<Record<ProcessEvent["type"], ProcessStage>> = {
  MONEY_PATH_IDENTIFIED: "MONEY_PATH_IDENTIFIED",
  AMOUNT_HELD: "MONEY_PATH_IDENTIFIED",
  ACCOUNT_HOLDER_NOTICE_REQUIRED: "ACCOUNT_HOLDER_NOTICE",
  ACCOUNT_HOLDER_NOTICE_ISSUED: "ACCOUNT_HOLDER_RESPONSE",
  ACCOUNT_HOLDER_RESPONDED: "SP_DCP_APPROVAL",
  ACCOUNT_HOLDER_NON_RESPONSE_RECORDED: "SP_DCP_APPROVAL",
  SP_DCP_APPROVAL_RECORDED: "INDEMNITY_BOND_REQUIRED",
  INDEMNITY_BOND_RECORDED: "BANK_DIRECTION",
  BANK_DIRECTION_ISSUED: "BANK_INTERIM_CUSTODY",
  INTERIM_CUSTODY_CONFIRMED: "INTERIM_CUSTODY_CONFIRMED",
  AMOUNT_EXITED_FINANCIAL_SYSTEM: "EXITED_FINANCIAL_SYSTEM",
  AMOUNT_NOT_CURRENTLY_HELD: "NOT_CURRENTLY_HELD",
  ACCOUNT_HOLDER_CONTESTED: "COURT_ROUTE",
  COURT_ROUTE_RECORDED: "COURT_ROUTE",
};

const STAGE_MESSAGES = {
  MONEY_PATH_IDENTIFIED: {
    key: "stage.moneyPathIdentified",
    defaultMessage: "Money path identified; next process step is being recorded.",
  },
  ACCOUNT_HOLDER_NOTICE: {
    key: "stage.accountHolderNotice",
    defaultMessage: "Waiting for the Investigating Officer to issue account-holder notice.",
  },
  ACCOUNT_HOLDER_RESPONSE: {
    key: "stage.accountHolderResponse",
    defaultMessage: "Waiting for the beneficiary account holder's response.",
  },
  SP_DCP_APPROVAL: {
    key: "stage.spDcpApproval",
    defaultMessage: "Waiting for recorded SP / DCP approval.",
  },
  INDEMNITY_BOND_REQUIRED: {
    key: "stage.indemnityBondRequired",
    defaultMessage: "An indemnity bond is required for the recorded process.",
  },
  BANK_DIRECTION: {
    key: "stage.bankDirection",
    defaultMessage: "Waiting for the Investigating Officer to issue the bank direction.",
  },
  BANK_INTERIM_CUSTODY: {
    key: "stage.bankInterimCustody",
    defaultMessage: "The bank has received the interim-custody direction.",
  },
  INTERIM_CUSTODY_CONFIRMED: {
    key: "stage.interimCustodyConfirmed",
    defaultMessage: "Interim custody has been confirmed for this amount.",
  },
  EXITED_FINANCIAL_SYSTEM: {
    key: "stage.exitedFinancialSystem",
    defaultMessage: "This amount is recorded as having exited the financial system.",
  },
  NOT_CURRENTLY_HELD: {
    key: "stage.notCurrentlyHeld",
    defaultMessage: "This amount is not currently recorded as held.",
  },
  COURT_ROUTE: {
    key: "stage.courtRoute",
    defaultMessage: "A court route is recorded for this amount.",
  },
} satisfies Record<ProcessStage, Message>;

export type SopClock = {
  stage: ProcessStage;
  durationDays: number;
  startedAt: string;
  label: Message;
  provenance: Provenance;
};

export type OverdueState = {
  elapsedDays: number;
  durationDays: number;
  isOverdue: boolean;
  daysOverdue: number;
};

function toTimestamp(value: string | Date): number {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid date: ${String(value)}`);
  }

  return timestamp;
}

function latestStageEvent(path: MoneyPath): ProcessEvent {
  const event = path.events
    .map((item, index) => ({ item, index, timestamp: toTimestamp(item.occurredAt) }))
    .filter(({ item }) => EVENT_STAGE[item.type] !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp || b.index - a.index)[0]?.item;

  if (!event) {
    throw new Error(`Money path ${path.id} has no event from which a stage can be derived.`);
  }

  return event;
}

export function deriveCurrentStage(path: MoneyPath): ProcessStage {
  const event = latestStageEvent(path);
  const stage = EVENT_STAGE[event.type];

  if (!stage) {
    throw new Error(`No stage mapping exists for ${event.type}.`);
  }

  return stage;
}

export function deriveCurrentOwner(path: MoneyPath): Actor {
  return getSopRule(deriveCurrentStage(path)).owner;
}

export function deriveCitizenAction(path: MoneyPath): CitizenAction {
  return getSopRule(deriveCurrentStage(path)).citizenAction;
}

export function deriveApplicableSopClock(path: MoneyPath): SopClock | null {
  const event = latestStageEvent(path);
  const stage = deriveCurrentStage(path);
  const rule = getSopRule(stage);

  if (rule.durationDays === null || rule.clockLabel === null || rule.provenance === null) {
    return null;
  }

  return {
    stage,
    durationDays: rule.durationDays,
    startedAt: event.occurredAt,
    label: rule.clockLabel,
    provenance: rule.provenance,
  };
}

function utcCalendarDay(timestamp: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function deriveElapsedDays(path: MoneyPath, now: string | Date): number | null {
  const clock = deriveApplicableSopClock(path);

  if (!clock) {
    return null;
  }

  const elapsed =
    (utcCalendarDay(toTimestamp(now)) - utcCalendarDay(toTimestamp(clock.startedAt))) /
    86_400_000;

  return Math.max(0, Math.floor(elapsed));
}

export function deriveOverdueState(path: MoneyPath, now: string | Date): OverdueState | null {
  const clock = deriveApplicableSopClock(path);
  const elapsedDays = deriveElapsedDays(path, now);

  if (!clock || elapsedDays === null) {
    return null;
  }

  const daysOverdue = Math.max(0, elapsedDays - clock.durationDays);

  return {
    elapsedDays,
    durationDays: clock.durationDays,
    isOverdue: daysOverdue > 0,
    daysOverdue,
  };
}

function hasEvent(path: MoneyPath, type: ProcessEvent["type"]): boolean {
  return path.events.some((event) => event.type === type);
}

export function deriveFinancialState(path: MoneyPath): FinancialState {
  if (hasEvent(path, "INTERIM_CUSTODY_CONFIRMED")) return "INTERIM_CUSTODY";
  if (hasEvent(path, "AMOUNT_EXITED_FINANCIAL_SYSTEM")) return "EXITED_FINANCIAL_SYSTEM";
  if (hasEvent(path, "AMOUNT_NOT_CURRENTLY_HELD")) return "NOT_CURRENTLY_HELD";
  if (path.selectedProcess === "PROCESS_2") return "MULTI_VICTIM_ATTRIBUTION";
  if (hasEvent(path, "ACCOUNT_HOLDER_NOTICE_REQUIRED") || hasEvent(path, "BANK_DIRECTION_ISSUED")) {
    return "RESTORATION_PROCESSING";
  }
  return "HELD";
}

const FINANCIAL_MESSAGES = {
  HELD: { key: "financial.held", defaultMessage: "Amount recorded as held." },
  RESTORATION_PROCESSING: {
    key: "financial.restorationProcessing",
    defaultMessage: "Held amount is moving through the recorded restoration process.",
  },
  INTERIM_CUSTODY: {
    key: "financial.interimCustody",
    defaultMessage: "Interim custody is confirmed; this is not labelled permanent recovery.",
  },
  EXITED_FINANCIAL_SYSTEM: {
    key: "financial.exited",
    defaultMessage: "Amount recorded as having exited the financial system.",
  },
  NOT_CURRENTLY_HELD: {
    key: "financial.notHeld",
    defaultMessage: "Amount is not currently recorded as held.",
  },
  MULTI_VICTIM_ATTRIBUTION: {
    key: "financial.multiVictimAttribution",
    defaultMessage: "Amount requires attribution across recorded competing claims.",
  },
} satisfies Record<FinancialState, Message>;

export function deriveFinancialOutcome(path: MoneyPath): FinancialOutcome {
  const state = deriveFinancialState(path);
  return { state, amount: path.amount, explanation: FINANCIAL_MESSAGES[state] };
}

export function deriveLegalOutcome(path: MoneyPath): LegalOutcome {
  if (hasEvent(path, "INTERIM_CUSTODY_CONFIRMED")) {
    return {
      state: "INTERIM_CUSTODY_UNDER_RECORDED_PROCESS",
      recordedProcess: path.selectedProcess,
      explanation: {
        key: "legal.interimCustody",
        defaultMessage: "Interim custody under the recorded process; final legal ownership is not declared.",
      },
    };
  }

  if (hasEvent(path, "COURT_ROUTE_RECORDED") || hasEvent(path, "ACCOUNT_HOLDER_CONTESTED")) {
    return {
      state: "COURT_ROUTE_RECORDED",
      recordedProcess: path.selectedProcess,
      explanation: {
        key: "legal.courtRoute",
        defaultMessage: "A court route is recorded; no court outcome is inferred.",
      },
    };
  }

  if (path.selectedProcess) {
    return {
      state: "RECORDED_PROCESS_ACTIVE",
      recordedProcess: path.selectedProcess,
      explanation: {
        key: "legal.processActive",
        defaultMessage: "The recorded process is active; no final legal outcome is claimed.",
      },
    };
  }

  return {
    state: "NO_RECORDED_RESTORATION_PROCESS",
    recordedProcess: null,
    explanation: {
      key: "legal.noProcess",
      defaultMessage: "No restoration process or final legal outcome is currently recorded.",
    },
  };
}

export function derivePlainLanguageStatus(path: MoneyPath): Message {
  return STAGE_MESSAGES[deriveCurrentStage(path)];
}
