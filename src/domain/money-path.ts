import type { Actor } from "./actors";
import type { Case, MoneyPath } from "./case";
import type { ProcessEventType } from "./events";
import type { ProcessStage } from "../sop/processes";
import { deriveCurrentStage } from "../sop/selectors";
import { assertCaseReconciles } from "./reconciliation";

type SyntheticTransition = {
  eventType: ProcessEventType;
  actor: Actor;
};

const NEXT_TRANSITION: Partial<Record<ProcessStage, SyntheticTransition>> = {
  ACCOUNT_HOLDER_NOTICE: {
    eventType: "ACCOUNT_HOLDER_NOTICE_ISSUED",
    actor: "INVESTIGATING_OFFICER",
  },
  ACCOUNT_HOLDER_RESPONSE: {
    eventType: "ACCOUNT_HOLDER_RESPONDED",
    actor: "ACCOUNT_HOLDER",
  },
  SP_DCP_APPROVAL: {
    eventType: "SP_DCP_APPROVAL_RECORDED",
    actor: "SP_DCP",
  },
  INDEMNITY_BOND_REQUIRED: {
    eventType: "INDEMNITY_BOND_RECORDED",
    actor: "CITIZEN",
  },
  BANK_DIRECTION: {
    eventType: "BANK_DIRECTION_ISSUED",
    actor: "INVESTIGATING_OFFICER",
  },
  BANK_INTERIM_CUSTODY: {
    eventType: "INTERIM_CUSTODY_CONFIRMED",
    actor: "BANK",
  },
};

function parseDate(value: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new Error(`Invalid transition date: ${value}`);
  return timestamp;
}

export function getNextSyntheticEventType(path: MoneyPath): ProcessEventType | null {
  return NEXT_TRANSITION[deriveCurrentStage(path)]?.eventType ?? null;
}

/**
 * Appends one deterministic demo event. This is a case-player helper, not a legal
 * route decision engine. Terminal or unsupported stages return the original path.
 */
export function simulateNextMoneyPathEvent(path: MoneyPath, occurredAt: string): MoneyPath {
  const transition = NEXT_TRANSITION[deriveCurrentStage(path)];
  if (!transition) return path;

  const transitionTime = parseDate(occurredAt);
  const latestTime = Math.max(...path.events.map((event) => parseDate(event.occurredAt)));
  if (transitionTime < latestTime) {
    throw new Error("A simulated event cannot occur before the current event history.");
  }

  return {
    ...path,
    events: [
      ...path.events,
      {
        id: `${path.id}:${transition.eventType}:${occurredAt}`,
        type: transition.eventType,
        occurredAt,
        actor: transition.actor,
        metadata: { syntheticSimulation: true },
      },
    ],
  };
}

export function simulateNextCaseUpdate(
  caseData: Case,
  moneyPathId: string,
  occurredAt: string,
): Case {
  if (!caseData.moneyPaths.some((path) => path.id === moneyPathId)) {
    throw new Error(`Unknown money path: ${moneyPathId}`);
  }

  const nextCase = {
    ...caseData,
    moneyPaths: caseData.moneyPaths.map((path) =>
      path.id === moneyPathId ? simulateNextMoneyPathEvent(path, occurredAt) : path,
    ),
  };

  assertCaseReconciles(nextCase);
  return nextCase;
}
