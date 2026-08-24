import type { Metadata } from "next";
import { CaseOverviewScreen } from "../../components/demo-case/case-overview-screen";

export const metadata: Metadata = {
  title: "My case",
};

export default function CasePage() {
  return <CaseOverviewScreen />;
}
