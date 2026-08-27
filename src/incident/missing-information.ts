import type { IncidentDraft } from "./schema";
import {
  requirementsForIncident,
  type ReportRequirementKey,
} from "./report-requirements";

export type MissingQuestion = {
  field: ReportRequirementKey | "incidentDateYear";
  question: string;
  questionHi: string;
  inputType: "text" | "date" | "time" | "number";
};

const QUESTIONS: Record<MissingQuestion["field"], MissingQuestion> = {
  incidentDate: {
    field: "incidentDate",
    question: "When did this happen?",
    questionHi: "यह कब हुआ?",
    inputType: "date",
  },
  incidentDateYear: {
    field: "incidentDateYear",
    question: "Confirm the year for this incident date",
    questionHi: "घटना की तारीख का साल पक्का करें",
    inputType: "text",
  },
  incidentApproximateTime: {
    field: "incidentApproximateTime",
    question: "About what time did this happen?",
    questionHi: "यह लगभग किस समय हुआ?",
    inputType: "time",
  },
  institution: {
    field: "institution",
    question: "Which bank or payment app did you use?",
    questionHi: "आपने किस बैंक या भुगतान ऐप का उपयोग किया?",
    inputType: "text",
  },
  transactionIdOrUtr: {
    field: "transactionIdOrUtr",
    question: "Do you have the transaction reference number?",
    questionHi: "क्या आपके पास लेन-देन संदर्भ संख्या है?",
    inputType: "text",
  },
  accountOrUpiId: {
    field: "accountOrUpiId",
    question: "Which account or payment ID was used?",
    questionHi: "कौन-सा खाता या भुगतान आईडी उपयोग किया गया?",
    inputType: "text",
  },
  transactionAmount: {
    field: "transactionAmount",
    question: "How much was transferred or debited?",
    questionHi: "कितनी राशि ट्रांसफर या डेबिट हुई?",
    inputType: "number",
  },
  transactionDate: {
    field: "transactionDate",
    question: "When did the transaction happen?",
    questionHi: "लेन-देन कब हुआ?",
    inputType: "date",
  },
  transactionApproximateTime: {
    field: "transactionApproximateTime",
    question: "About what time did the transaction happen?",
    questionHi: "लेन-देन लगभग किस समय हुआ?",
    inputType: "time",
  },
  occurredOn: {
    field: "occurredOn",
    question: "Where did the conversation or incident happen?",
    questionHi: "बातचीत या घटना कहाँ हुई?",
    inputType: "text",
  },
  platform: {
    field: "platform",
    question: "Which app, website or service was involved?",
    questionHi: "कौन-सा ऐप, वेबसाइट या सेवा इसमें शामिल थी?",
    inputType: "text",
  },
  affectedAccount: {
    field: "affectedAccount",
    question: "Which account or profile was affected?",
    questionHi: "कौन-सा खाता या प्रोफ़ाइल प्रभावित हुआ?",
    inputType: "text",
  },
  accountAccessStatus: {
    field: "accountAccessStatus",
    question: "Can you still access this account?",
    questionHi: "क्या आप अभी भी इस खाते में प्रवेश कर सकते हैं?",
    inputType: "text",
  },
  recoveryInformationChanged: {
    field: "recoveryInformationChanged",
    question: "Was the recovery email or phone changed?",
    questionHi: "क्या रिकवरी ईमेल या फ़ोन बदला गया था?",
    inputType: "text",
  },
  affectedSystem: {
    field: "affectedSystem",
    question: "Which device or system was affected?",
    questionHi: "कौन-सा उपकरण या सिस्टम प्रभावित हुआ?",
    inputType: "text",
  },
};

function requirementMissing(draft: IncidentDraft, field: ReportRequirementKey): boolean {
  const primaryTransaction = draft.transactions[0];
  switch (field) {
    case "incidentDate": return !draft.incident.incidentDate;
    case "incidentApproximateTime": return !draft.incident.approximateTime;
    case "occurredOn": return !draft.incident.occurredOn;
    case "institution": return !primaryTransaction?.institution;
    case "accountOrUpiId": return !primaryTransaction?.accountOrUpiId;
    case "transactionAmount": return !(primaryTransaction?.amount && primaryTransaction.amount > 0);
    case "transactionIdOrUtr": return !primaryTransaction?.transactionIdOrUtr;
    case "transactionDate": return !primaryTransaction?.transactionDate;
    case "transactionApproximateTime": return !primaryTransaction?.approximateTime;
    case "platform": return !(draft.adaptiveFacts.platform ?? draft.classification.platform);
    case "affectedAccount": return !draft.adaptiveFacts.affectedAccount;
    case "accountAccessStatus": return !draft.adaptiveFacts.accountAccessStatus;
    case "recoveryInformationChanged": return draft.adaptiveFacts.recoveryInformationChanged === null;
    case "affectedSystem": return !draft.adaptiveFacts.affectedSystem;
  }
}

export function deriveMissingQuestions(draft: IncidentDraft): MissingQuestion[] {
  if (draft.classification.ambiguity !== "NONE") return [];
  const requirements = requirementsForIncident(draft);
  const missing: MissingQuestion[] = [];

  if (requirements.some((item) => item.key === "incidentDate") && !draft.incident.incidentDate && draft.incident.incidentDateWithoutYear) {
    missing.push(QUESTIONS.incidentDateYear);
  }
  for (const requirement of requirements) {
    if (requirement.key === "incidentDate" && draft.incident.incidentDateWithoutYear) continue;
    if (requirementMissing(draft, requirement.key)) missing.push(QUESTIONS[requirement.key]);
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

  if (field === "incidentDateYear") {
    const partialDate = draft.incident.incidentDateWithoutYear;
    const year = Number(answer);
    if (!partialDate || !Number.isInteger(year) || year < 2000 || year > 2100) {
      return draft;
    }

    return {
      ...draft,
      incident: {
        ...draft.incident,
        incidentDate: `${year}-${partialDate}`,
        incidentDateWithoutYear: null,
      },
      missingRequiredFields: draft.missingRequiredFields.filter(
        (item) => item !== "incidentDate" && item !== "incidentDateYear",
      ),
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

  if (
    field === "platform" ||
    field === "affectedAccount" ||
    field === "accountAccessStatus" ||
    field === "affectedSystem"
  ) {
    return {
      ...draft,
      classification: field === "platform"
        ? { ...draft.classification, platform: answer }
        : draft.classification,
      incident: field === "platform" && !draft.incident.occurredOn
        ? { ...draft.incident, occurredOn: answer }
        : draft.incident,
      adaptiveFacts: { ...draft.adaptiveFacts, [field]: answer },
      missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
    };
  }

  if (field === "recoveryInformationChanged") {
    const normalized = answer.toLowerCase();
    const changed = /^(yes|y|true|हाँ|हां)$/.test(normalized)
      ? true
      : /^(no|n|false|नहीं)$/.test(normalized)
        ? false
        : null;
    if (changed === null) return draft;
    return {
      ...draft,
      adaptiveFacts: { ...draft.adaptiveFacts, recoveryInformationChanged: changed },
      missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
    };
  }

  const firstTransaction = draft.transactions[0] ?? {
    institution: null,
    accountOrUpiId: null,
    transactionIdOrUtr: null,
    amount: draft.incident.reportedAmount,
    transactionDate: draft.incident.incidentDate,
    approximateTime: draft.incident.approximateTime,
    referenceNumber: null,
  };

  const parsedTransactionAmount = Number(answer);
  if (field === "transactionAmount" && (!Number.isFinite(parsedTransactionAmount) || parsedTransactionAmount <= 0)) {
    return draft;
  }
  const updatedTransaction = field === "institution"
    ? { ...firstTransaction, institution: answer }
    : field === "accountOrUpiId"
      ? { ...firstTransaction, accountOrUpiId: answer }
      : field === "transactionAmount"
        ? { ...firstTransaction, amount: parsedTransactionAmount }
        : field === "transactionIdOrUtr"
          ? { ...firstTransaction, transactionIdOrUtr: answer }
          : field === "transactionDate"
            ? { ...firstTransaction, transactionDate: answer }
            : { ...firstTransaction, approximateTime: answer };

  return {
    ...draft,
    transactions: [
      updatedTransaction,
      ...draft.transactions.slice(1),
    ],
    missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
  };
}
