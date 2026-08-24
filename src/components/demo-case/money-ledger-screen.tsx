"use client";

import { MoneyLedger } from "../money-ledger/money-ledger";
import { useDemoCase } from "./demo-case-provider";

export function MoneyLedgerScreen() {
  const { caseData } = useDemoCase();
  return <MoneyLedger caseData={caseData} />;
}
