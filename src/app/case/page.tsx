import type { Metadata } from "next";
import { CaseOverviewScreen } from "../../components/demo-case/case-overview-screen";

export const metadata: Metadata = {
  title: "Your reported financial fraud",
};

export default function CasePage() {
  return <CaseOverviewScreen />;
}
