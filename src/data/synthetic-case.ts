import type { Case } from "../domain/case";
import type { Provenance } from "../sop/processes";
import { assertCaseReconciles } from "../domain/reconciliation";

export const DEMO_NOW = "2026-08-24T12:00:00.000Z";

const PROCESS_1_PROVENANCE: Provenance = {
  source: "JAN_2026_NCRP_CFCFRMS_SOP",
  process: "PROCESS_1",
  section: "Process 1 / Section 106(3) BNSS (synthetic record)",
  note: "This route and its supporting facts are mocked authoritative case data, not an app decision.",
};

export const syntheticCase: Case = {
  id: "case-synthetic-investment-001",
  syntheticCitizen: { displayName: "Asha Verma" },
  fraudType: "INVESTMENT_SCAM",
  complaint: {
    id: "complaint-synthetic-001",
    acknowledgementId: "NCRP-DEMO-2026-00124",
    reportedAmount: 200_000,
    reportedAt: "2026-08-12T09:30:00.000Z",
    firStatus: "REGISTERED",
    jurisdiction: "Synthetic Central District",
  },
  moneyPaths: [
    {
      id: "path-held-io-verification",
      amount: 73_000,
      beneficiaryInstitution: {
        name: "Bank B (synthetic)",
        maskedAccount: "•••• 1842",
      },
      selectedProcess: "PROCESS_1",
      recordedRouteFacts: [
        "SINGLE_VICTIM_RECORDED",
        "AMOUNT_HELD_AT_BENEFICIARY_ACCOUNT",
        "FIR_REGISTERED",
        "SECTION_106_3_ROUTE_RECORDED",
      ],
      provenance: [PROCESS_1_PROVENANCE],
      events: [
        {
          id: "path-73-identified",
          type: "MONEY_PATH_IDENTIFIED",
          occurredAt: "2026-08-12T10:00:00.000Z",
          actor: "SYSTEM",
        },
        {
          id: "path-73-held",
          type: "AMOUNT_HELD",
          occurredAt: "2026-08-12T10:30:00.000Z",
          actor: "BANK",
        },
        {
          id: "path-73-mrm",
          type: "MRM_REQUEST_RAISED",
          occurredAt: "2026-08-14T10:00:00.000Z",
          actor: "CITIZEN",
        },
        {
          id: "path-73-assigned-to-io",
          type: "REQUEST_ASSIGNED_TO_IO",
          occurredAt: "2026-08-15T10:00:00.000Z",
          actor: "INVESTIGATING_OFFICER",
        },
      ],
    },
    {
      id: "path-bank-interim-custody",
      amount: 42_000,
      beneficiaryInstitution: {
        name: "Bank A (synthetic)",
        maskedAccount: "•••• 7710",
      },
      selectedProcess: "PROCESS_1",
      recordedRouteFacts: [
        "SINGLE_VICTIM_RECORDED",
        "AMOUNT_HELD_AT_BENEFICIARY_ACCOUNT",
        "FIR_REGISTERED",
        "SECTION_106_3_ROUTE_RECORDED",
      ],
      provenance: [PROCESS_1_PROVENANCE],
      events: [
        {
          id: "path-42-identified",
          type: "MONEY_PATH_IDENTIFIED",
          occurredAt: "2026-08-12T10:05:00.000Z",
          actor: "SYSTEM",
        },
        {
          id: "path-42-held",
          type: "AMOUNT_HELD",
          occurredAt: "2026-08-12T11:00:00.000Z",
          actor: "BANK",
        },
        {
          id: "path-42-mrm",
          type: "MRM_REQUEST_RAISED",
          occurredAt: "2026-08-13T10:00:00.000Z",
          actor: "CITIZEN",
        },
        {
          id: "path-42-assigned-to-io",
          type: "REQUEST_ASSIGNED_TO_IO",
          occurredAt: "2026-08-14T10:00:00.000Z",
          actor: "INVESTIGATING_OFFICER",
        },
        {
          id: "path-42-notice-issued",
          type: "ACCOUNT_HOLDER_NOTICE_ISSUED",
          occurredAt: "2026-08-15T10:00:00.000Z",
          actor: "INVESTIGATING_OFFICER",
        },
        {
          id: "path-42-response",
          type: "ACCOUNT_HOLDER_RESPONDED",
          occurredAt: "2026-08-16T10:00:00.000Z",
          actor: "ACCOUNT_HOLDER",
        },
        {
          id: "path-42-approval",
          type: "SP_DCP_APPROVAL_RECORDED",
          occurredAt: "2026-08-17T10:00:00.000Z",
          actor: "SP_DCP",
        },
        {
          id: "path-42-bond",
          type: "INDEMNITY_BOND_RECORDED",
          occurredAt: "2026-08-18T10:00:00.000Z",
          actor: "CITIZEN",
        },
        {
          id: "path-42-bank-direction",
          type: "BANK_DIRECTION_ISSUED",
          occurredAt: "2026-08-19T10:00:00.000Z",
          actor: "INVESTIGATING_OFFICER",
        },
        {
          id: "path-42-bank-direction-received",
          type: "BANK_DIRECTION_RECEIVED",
          occurredAt: "2026-08-20T10:00:00.000Z",
          actor: "BANK",
        },
      ],
    },
    {
      id: "path-exited-cash-withdrawal",
      amount: 25_000,
      beneficiaryInstitution: {
        name: "Synthetic cash-withdrawal trail",
      },
      selectedProcess: null,
      recordedRouteFacts: [],
      provenance: [],
      events: [
        {
          id: "path-25-identified",
          type: "MONEY_PATH_IDENTIFIED",
          occurredAt: "2026-08-12T10:00:00.000Z",
          actor: "SYSTEM",
        },
        {
          id: "path-25-exited",
          type: "AMOUNT_EXITED_FINANCIAL_SYSTEM",
          occurredAt: "2026-08-13T10:00:00.000Z",
          actor: "SYSTEM",
          metadata: { exitMode: "CASH_WITHDRAWAL" },
        },
      ],
    },
    {
      id: "path-not-currently-held",
      amount: 60_000,
      selectedProcess: null,
      recordedRouteFacts: [],
      provenance: [],
      events: [
        {
          id: "path-60-identified",
          type: "MONEY_PATH_IDENTIFIED",
          occurredAt: "2026-08-12T10:00:00.000Z",
          actor: "SYSTEM",
        },
        {
          id: "path-60-not-held",
          type: "AMOUNT_NOT_CURRENTLY_HELD",
          occurredAt: "2026-08-13T10:00:00.000Z",
          actor: "SYSTEM",
        },
      ],
    },
  ],
};

assertCaseReconciles(syntheticCase);
