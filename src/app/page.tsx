import type { Metadata } from "next";
import { DemoJourney } from "../components/demo-journey/demo-journey";

export const metadata: Metadata = {
  title: "Prepare a financial cyber-fraud report",
};

export default function HomePage() {
  return <DemoJourney />;
}
