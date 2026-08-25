import type { Metadata } from "next";
import { DemoJourney } from "../components/demo-journey/demo-journey";

export const metadata: Metadata = {
  title: "Report and understand a financial cyber-fraud case",
};

export default function HomePage() {
  return <DemoJourney />;
}
