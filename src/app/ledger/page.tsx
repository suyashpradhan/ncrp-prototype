import type { Metadata } from "next";
import { MoneyLedgerScreen } from "../../components/demo-case/money-ledger-screen";

export const metadata: Metadata = {
  title: "Money ledger",
};

export default function LedgerPage() {
  return <MoneyLedgerScreen />;
}
