import type { Metadata } from "next";
import { CaseOverviewScreen } from "../components/demo-case/case-overview-screen";

export const metadata: Metadata = {
  title: "Case overview",
};

export default function HomePage() {
  return <CaseOverviewScreen />;
}
