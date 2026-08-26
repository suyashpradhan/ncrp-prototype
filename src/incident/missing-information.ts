import type { IncidentDraft } from "./schema";

export type MissingQuestion = {
  field:
    | "incidentDate"
    | "incidentApproximateTime"
    | "institution"
    | "transactionIdOrUtr"
    | "occurredOn";
  question: string;
  inputType: "text" | "date" | "time";
};

const QUESTIONS: Record<MissingQuestion["field"], MissingQuestion> = {
  incidentDate: {
    field: "incidentDate",
    question: "When did this happen?",
    inputType: "date",
  },
  incidentApproximateTime: {
    field: "incidentApproximateTime",
    question: "About what time did this happen?",
    inputType: "time",
  },
  institution: {
    field: "institution",
    question: "Which bank or payment app did you use?",
    inputType: "text",
  },
  transactionIdOrUtr: {
    field: "transactionIdOrUtr",
    question: "Do you have the transaction reference number?",
    inputType: "text",
  },
  occurredOn: {
    field: "occurredOn",
    question: "Where did the conversation or incident happen?",
    inputType: "text",
  },
};

export function deriveMissingQuestions(draft: IncidentDraft): MissingQuestion[] {
  const missing: MissingQuestion[] = [];
  const primaryTransaction = draft.transactions[0];

  if (!draft.incident.incidentDate) missing.push(QUESTIONS.incidentDate);
  if (!draft.incident.approximateTime) missing.push(QUESTIONS.incidentApproximateTime);
  if (!draft.incident.occurredOn) missing.push(QUESTIONS.occurredOn);
  if (primaryTransaction && !primaryTransaction.institution) missing.push(QUESTIONS.institution);
  if (primaryTransaction && !primaryTransaction.transactionIdOrUtr) {
    missing.push(QUESTIONS.transactionIdOrUtr);
  }

  return missing;
}

export function applyMissingAnswer(
  draft: IncidentDraft,
  field: MissingQuestion["field"],
  value: string,
): IncidentDraft {
  const answer = value.trim();
  if (!answer) return draft;

  if (field === "incidentDate" || field === "occurredOn") {
    return {
      ...draft,
      incident: { ...draft.incident, [field]: answer },
      missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
    };
  }

  if (field === "incidentApproximateTime") {
    return {
      ...draft,
      incident: { ...draft.incident, approximateTime: answer },
      missingRequiredFields: draft.missingRequiredFields.filter(
        (item) => item !== "approximateTime" && item !== field,
      ),
    };
  }

  const firstTransaction = draft.transactions[0];
  if (!firstTransaction) return draft;

  return {
    ...draft,
    transactions: [
      { ...firstTransaction, [field]: answer },
      ...draft.transactions.slice(1),
    ],
    missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
  };
}
