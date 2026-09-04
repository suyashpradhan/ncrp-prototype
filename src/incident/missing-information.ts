import type { IncidentDraft } from "./schema";
import { deriveFinancialFactsFromText } from "./normalization";
import {
  requirementsForIncident,
  type ReportRequirementKey,
} from "./report-requirements";

export type MissingQuestion = {
  field: ReportRequirementKey | "incidentDateYear";
  question: string;
  questionHi: string;
  inputType: "text" | "date" | "time" | "number";
  transactionIndex?: number;
};

const QUESTIONS: Record<MissingQuestion["field"], MissingQuestion> = {
  moneyLost: {
    field: "moneyLost",
    question: "Did any money leave your account or did you make a payment?",
    questionHi: "क्या आपके खाते से पैसे गए या आपने कोई भुगतान किया?",
    inputType: "text",
  },
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
  delayInReporting: {
    field: "delayInReporting",
    question: "Was this report delayed after the incident?",
    questionHi: "क्या घटना के बाद यह रिपोर्ट देर से की गई?",
    inputType: "text",
  },
  delayReason: {
    field: "delayReason",
    question: "Why was the report delayed?",
    questionHi: "रिपोर्ट करने में देरी क्यों हुई?",
    inputType: "text",
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
  accountCompromiseBasis: {
    field: "accountCompromiseBasis",
    question: "What makes you think someone else may have accessed the account?",
    questionHi: "आपको क्यों लगता है कि किसी और ने खाते में प्रवेश किया होगा?",
    inputType: "text",
  },
  affectedSystem: {
    field: "affectedSystem",
    question: "Which device or system was affected?",
    questionHi: "कौन-सा उपकरण या सिस्टम प्रभावित हुआ?",
    inputType: "text",
  },
};

const FINANCIAL_QUESTION_PRIORITY: readonly MissingQuestion["field"][] = [
  "moneyLost",
  "incidentDateYear",
  "incidentDate",
  "incidentApproximateTime",
  "delayInReporting",
  "delayReason",
  "occurredOn",
];

const TRANSACTION_REQUIREMENT_KEYS = new Set<ReportRequirementKey>([
  "institution",
  "accountOrUpiId",
  "transactionAmount",
  "transactionIdOrUtr",
  "transactionDate",
  "transactionApproximateTime",
]);

const TRANSACTION_QUESTION_PRIORITY: readonly ReportRequirementKey[] = [
  "transactionIdOrUtr",
  "institution",
  "transactionDate",
  "accountOrUpiId",
  "transactionAmount",
];

function transactionValueMissing(
  draft: IncidentDraft,
  index: number,
  field: ReportRequirementKey,
): boolean {
  const transaction = draft.transactions[index];
  if (!transaction) return false;
  switch (field) {
    case "institution": return !transaction.institution;
    case "accountOrUpiId": return !transaction.accountOrUpiId;
    case "transactionAmount": return !(transaction.amount && transaction.amount > 0);
    case "transactionIdOrUtr": return !(transaction.transactionIdOrUtr ?? transaction.referenceNumber);
    case "transactionDate": return !transaction.transactionDate;
    case "transactionApproximateTime": return !transaction.approximateTime;
    default: return false;
  }
}

function transactionQuestion(
  field: ReportRequirementKey,
  transactionIndex: number,
  amount: number | null,
  institution: string | null,
): MissingQuestion {
  const base = QUESTIONS[field];
  const number = transactionIndex + 1;
  const amountEn = amount ? `₹${amount.toLocaleString("en-IN")}` : `transaction ${number}`;
  const amountHi = amount ? `₹${amount.toLocaleString("en-IN")}` : `लेन-देन ${number}`;
  const paymentEn = institution ? `${amountEn} ${institution}` : amountEn;
  const paymentHi = institution ? `${amountHi} ${institution}` : amountHi;
  const questions: Partial<Record<ReportRequirementKey, [string, string]>> = {
    institution: [
      `For the ${amountEn} payment, which bank or payment app did you use?`,
      `${amountHi} के भुगतान के लिए आपने किस बैंक या भुगतान ऐप का उपयोग किया?`,
    ],
    transactionIdOrUtr: [
      `For the ${amountEn} payment, do you have the transaction reference?`,
      `${amountHi} के भुगतान का लेन-देन संदर्भ क्या आपके पास है?`,
    ],
    transactionDate: [
      `When did the ${amountEn} payment happen?`,
      `${amountHi} का भुगतान कब हुआ?`,
    ],
    accountOrUpiId: [
      `For the ${paymentEn} payment, do you know the UPI ID or account identifier?`,
      `${paymentHi} भुगतान के लिए क्या आपको UPI ID या खाता पहचान मालूम है?`,
    ],
    transactionAmount: [
      `How much was paid in transaction ${number}?`,
      `लेन-देन ${number} में कितनी राशि दी गई?`,
    ],
  };
  const copy = questions[field];
  return {
    ...base,
    question: copy?.[0] ?? base.question,
    questionHi: copy?.[1] ?? base.questionHi,
    transactionIndex,
  };
}

function requirementMissing(draft: IncidentDraft, field: ReportRequirementKey): boolean {
  const primaryTransaction = draft.transactions[0];
  switch (field) {
    case "moneyLost": return draft.incident.financialLossState === "UNKNOWN";
    case "incidentDate": return !draft.incident.incidentDate;
    case "incidentApproximateTime": return !draft.incident.approximateTime && !(
      draft.transactions.length > 0 &&
      draft.transactions.every((transaction) => Boolean(transaction.approximateTime))
    );
    case "delayInReporting": return draft.incident.delayInReporting === null;
    case "delayReason": return draft.incident.delayInReporting === true && !draft.incident.delayReason;
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
    case "accountCompromiseBasis": return !draft.adaptiveFacts.accountCompromiseBasis;
    case "affectedSystem": return !draft.adaptiveFacts.affectedSystem;
  }
}

export function deriveMissingQuestions(draft: IncidentDraft): MissingQuestion[] {
  if (draft.classification.ambiguity !== "NONE") return [];
  const requirements = requirementsForIncident(draft);
  const missing: MissingQuestion[] = [];
  const financialFacts = deriveFinancialFactsFromText(
    draft.incident.narrative ?? draft.citizenSummary.shortSummary,
  );

  if (requirements.some((item) => item.key === "incidentDate") && !draft.incident.incidentDate && draft.incident.incidentDateWithoutYear) {
    missing.push(QUESTIONS.incidentDateYear);
  }
  for (const requirement of requirements) {
    if (TRANSACTION_REQUIREMENT_KEYS.has(requirement.key)) continue;
    if (requirement.key === "incidentDate" && draft.incident.incidentDateWithoutYear) continue;
    if (requirement.key === "moneyLost" && financialFacts.lossUncertaintyExplicit) continue;
    if (requirementMissing(draft, requirement.key)) missing.push(QUESTIONS[requirement.key]);
  }

  if (draft.incident.financialLossState === "YES" && draft.transactions.length > 0) {
    const requiredTransactionFields = new Set(
      requirements
        .filter((item) => TRANSACTION_REQUIREMENT_KEYS.has(item.key))
        .map((item) => item.key),
    );
    outer: for (let index = 0; index < draft.transactions.length; index += 1) {
      for (const field of TRANSACTION_QUESTION_PRIORITY) {
        if (!requiredTransactionFields.has(field)) continue;
        if (transactionValueMissing(draft, index, field)) {
          missing.push(transactionQuestion(
            field,
            index,
            draft.transactions[index]?.amount ?? null,
            draft.transactions[index]?.institution ?? null,
          ));
          break outer;
        }
      }
    }
  }

  if (draft.classification.reportFamily === "FINANCIAL_FRAUD") {
    return [...missing].sort((left, right) => {
      const leftIndex = FINANCIAL_QUESTION_PRIORITY.indexOf(left.field);
      const rightIndex = FINANCIAL_QUESTION_PRIORITY.indexOf(right.field);
      return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    });
  }

  return missing;
}

export function applyMissingAnswer(
  draft: IncidentDraft,
  field: MissingQuestion["field"],
  value: string,
  transactionIndex = 0,
): IncidentDraft {
  const answer = value.trim();
  if (!answer) return draft;

  if (field === "moneyLost" || field === "delayInReporting") {
    const normalized = answer.toLowerCase();
    const selected = /^(yes|y|true|हाँ|हां)$/.test(normalized)
      ? true
      : /^(no|n|false|नहीं)$/.test(normalized)
        ? false
        : null;
    if (selected === null) return draft;

    if (field === "moneyLost") {
      const financialLossState = selected ? "YES" as const : "NO" as const;
      return {
        ...draft,
        classification: { ...draft.classification, moneyLost: selected },
        incident: {
          ...draft.incident,
          financialLossState,
          moneyLost: selected,
          statedTotalLoss: selected ? draft.incident.statedTotalLoss : null,
          citizenConfirmedLoss: null,
          reportedAmount: selected ? draft.incident.reportedAmount : null,
        },
        transactions: selected ? draft.transactions : [],
        missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
      };
    }

    return {
      ...draft,
      incident: {
        ...draft.incident,
        delayInReporting: selected,
        delayReason: selected ? draft.incident.delayReason : null,
      },
      missingRequiredFields: draft.missingRequiredFields.filter(
        (item) => item !== field && (selected || item !== "delayReason"),
      ),
    };
  }

  if (field === "delayReason") {
    return {
      ...draft,
      incident: { ...draft.incident, delayReason: answer },
      missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
    };
  }

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
    field === "accountCompromiseBasis" ||
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

  const targetTransaction = draft.transactions[transactionIndex] ?? {
    id: "transaction-1",
    institution: null,
    currency: "INR",
    paymentMethod: null,
    accountOrUpiId: null,
    transactionIdOrUtr: null,
    amount: draft.incident.reportedAmount,
    transactionDate: null,
    approximateTime: null,
    referenceNumber: null,
    status: "MISSING" as const,
  };

  const parsedTransactionAmount = Number(answer);
  if (field === "transactionAmount" && (!Number.isFinite(parsedTransactionAmount) || parsedTransactionAmount <= 0)) {
    return draft;
  }
  const updatedTransaction = field === "institution"
    ? { ...targetTransaction, institution: answer }
    : field === "accountOrUpiId"
      ? { ...targetTransaction, accountOrUpiId: answer }
      : field === "transactionAmount"
        ? { ...targetTransaction, amount: parsedTransactionAmount }
        : field === "transactionIdOrUtr"
          ? { ...targetTransaction, transactionIdOrUtr: answer }
          : field === "transactionDate"
            ? { ...targetTransaction, transactionDate: answer }
            : { ...targetTransaction, approximateTime: answer };
  const confirmedTransactionField = field === "institution"
    ? "institution"
    : field === "accountOrUpiId"
      ? "accountOrUpiId"
      : field === "transactionAmount"
        ? "amount"
        : field === "transactionIdOrUtr"
          ? "transactionIdOrUtr"
          : field === "transactionDate"
            ? "transactionDate"
            : "approximateTime";

  return {
    ...draft,
    incident: { ...draft.incident, citizenConfirmedLoss: null },
    transactions: draft.transactions.length > 0
      ? draft.transactions.map((transaction, index) =>
          index === transactionIndex
            ? { ...updatedTransaction, status: "KNOWN" as const }
            : transaction,
        )
      : [{ ...updatedTransaction, status: "KNOWN" as const }],
    citizenConfirmedFields: Array.from(new Set([
      ...draft.citizenConfirmedFields,
      `transactions.${transactionIndex}.${confirmedTransactionField}`,
    ])),
    missingRequiredFields: draft.missingRequiredFields.filter((item) => item !== field),
  };
}
