import { CITIZEN_MESSAGES } from "../content/en";
import type { MoneyPath } from "../domain/case";
import type { Message } from "../domain/messages";
import type { ProcessStage } from "../sop/processes";
import { deriveCitizenAction, deriveCurrentOwner, deriveCurrentStage } from "../sop/selectors";

export type CitizenAmountPresentation = {
  title: Message;
  explanation: Message;
  nextStep: Message;
  detailExplanation?: Message;
};

const STAGE_PRESENTATION: Record<ProcessStage, CitizenAmountPresentation> = {
  MONEY_PATH_IDENTIFIED: {
    title: CITIZEN_MESSAGES.amount.genericTitle,
    explanation: CITIZEN_MESSAGES.amount.genericExplanation,
    nextStep: CITIZEN_MESSAGES.detail.genericNext,
  },
  ACCOUNT_HOLDER_NOTICE: {
    title: CITIZEN_MESSAGES.amount.ioTitle,
    explanation: CITIZEN_MESSAGES.amount.ioExplanation,
    detailExplanation: CITIZEN_MESSAGES.detail.ioDetail,
    nextStep: CITIZEN_MESSAGES.detail.ioNext,
  },
  ACCOUNT_HOLDER_RESPONSE: {
    title: { key: "amount.accountHolderTitle", defaultMessage: "Waiting for account-holder verification" },
    explanation: {
      key: "amount.accountHolderExplanation",
      defaultMessage: "The recorded account holder has been asked to respond before the police approval step.",
    },
    nextStep: CITIZEN_MESSAGES.detail.genericNext,
  },
  SP_DCP_APPROVAL: {
    title: { key: "amount.approvalTitle", defaultMessage: "Waiting on police approval" },
    explanation: {
      key: "amount.approvalExplanation",
      defaultMessage: "The recorded verification is complete and the next police approval is pending.",
    },
    nextStep: {
      key: "amount.approvalNext",
      defaultMessage: "After approval, the recorded indemnity-bond step can be completed before a bank direction is issued.",
    },
  },
  INDEMNITY_BOND_REQUIRED: {
    title: { key: "amount.bondTitle", defaultMessage: "An indemnity bond is needed" },
    explanation: {
      key: "amount.bondExplanation",
      defaultMessage: "The recorded process needs an indemnity bond before the bank direction can be issued.",
    },
    nextStep: {
      key: "amount.bondNext",
      defaultMessage: "After the bond is recorded, the Investigating Officer can issue the direction to the bank.",
    },
  },
  BANK_DIRECTION: {
    title: CITIZEN_MESSAGES.amount.ioTitle,
    explanation: {
      key: "amount.directionExplanation",
      defaultMessage: "Police approval and the indemnity bond are recorded. The bank direction is waiting to be issued.",
    },
    nextStep: {
      key: "amount.directionNext",
      defaultMessage: "The issued direction must be received by the bank before the bank’s process window begins.",
    },
  },
  BANK_DIRECTION_RECEIPT: {
    title: CITIZEN_MESSAGES.amount.bankTitle,
    explanation: {
      key: "amount.receiptExplanation",
      defaultMessage: "The direction has been issued and is waiting to be recorded as received by the bank.",
    },
    nextStep: {
      key: "amount.receiptNext",
      defaultMessage: "The bank’s 15-day process window begins only after it records receipt of the direction.",
    },
  },
  BANK_INTERIM_CUSTODY: {
    title: CITIZEN_MESSAGES.amount.bankTitle,
    explanation: CITIZEN_MESSAGES.amount.bankExplanation,
    detailExplanation: {
      key: "amount.bankDetailExplanation",
      defaultMessage: "The required direction has already been received by the bank.",
    },
    nextStep: CITIZEN_MESSAGES.detail.bankNext,
  },
  INTERIM_CUSTODY_CONFIRMED: {
    title: CITIZEN_MESSAGES.amount.receivedTitle,
    explanation: CITIZEN_MESSAGES.amount.receivedExplanation,
    nextStep: CITIZEN_MESSAGES.detail.receivedNext,
  },
  EXITED_FINANCIAL_SYSTEM: {
    title: CITIZEN_MESSAGES.amount.exitedTitle,
    explanation: CITIZEN_MESSAGES.amount.exitedExplanation,
    nextStep: {
      key: "amount.exitedNext",
      defaultMessage: "No banking-process step is currently recorded for this amount.",
    },
  },
  NOT_CURRENTLY_HELD: {
    title: CITIZEN_MESSAGES.amount.notHeldTitle,
    explanation: CITIZEN_MESSAGES.amount.notHeldExplanation,
    nextStep: CITIZEN_MESSAGES.detail.genericNext,
  },
  COURT_ROUTE: {
    title: { key: "amount.courtTitle", defaultMessage: "A court step is recorded" },
    explanation: {
      key: "amount.courtExplanation",
      defaultMessage: "The synthetic case records a court route for this amount.",
    },
    nextStep: CITIZEN_MESSAGES.detail.genericNext,
  },
};

export function deriveCitizenAmountPresentation(path: MoneyPath): CitizenAmountPresentation {
  return STAGE_PRESENTATION[deriveCurrentStage(path)];
}

export function deriveCitizenDetailTitle(path: MoneyPath): Message {
  if (deriveCurrentStage(path) === "BANK_INTERIM_CUSTODY" && path.beneficiaryInstitution) {
    return {
      key: "amount.bankTitle.named",
      defaultMessage: `Waiting on ${path.beneficiaryInstitution.name.replace(" (synthetic)", "")}`,
    };
  }

  return deriveCitizenAmountPresentation(path).title;
}

export function deriveCitizenCurrentHistoryLabel(path: MoneyPath): Message {
  const stage = deriveCurrentStage(path);

  if (stage === "ACCOUNT_HOLDER_NOTICE") {
    return {
      key: "history.current.accountHolderVerification",
      defaultMessage: "Account-holder verification step",
    };
  }

  if (stage === "BANK_INTERIM_CUSTODY") {
    return {
      key: "history.current.bankProcessing",
      defaultMessage: "Bank processing step",
    };
  }

  return deriveCitizenDetailTitle(path);
}

export type CitizenCaseActionPresentation = {
  actionRequired: boolean;
  heading: Message;
  explanation: Message;
};

function numberWord(value: number): string {
  if (value === 1) return "One";
  if (value === 2) return "Two";
  if (value === 3) return "Three";
  return String(value);
}

export function deriveCitizenCaseActionPresentation(
  paths: MoneyPath[],
): CitizenCaseActionPresentation {
  const actionPaths = paths.filter((path) => deriveCitizenAction(path).code !== "NONE");
  const responsibleActors = new Set(
    paths
      .map(deriveCurrentOwner)
      .filter((owner) => owner !== "NONE" && owner !== "CITIZEN" && owner !== "SYSTEM"),
  );

  if (actionPaths.length > 0) {
    return {
      actionRequired: true,
      heading: CITIZEN_MESSAGES.case.actionRequired,
      explanation: {
        key: "case.actionRequiredExplanation",
        defaultMessage: "Open the relevant amount below to see the recorded action.",
      },
    };
  }

  return {
    actionRequired: false,
    heading: CITIZEN_MESSAGES.case.noAction,
    explanation: {
      key: "case.noActionExplanation",
      defaultMessage: `${numberWord(responsibleActors.size)} institutions currently need to act on different parts of your case.`,
    },
  };
}
