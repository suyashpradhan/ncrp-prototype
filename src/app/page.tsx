import type { Metadata } from "next";
import { DemoJourney } from "../components/demo-journey/demo-journey";
import { JourneyInformation } from "../components/demo-journey/journey-information";

export const metadata: Metadata = {
  title: "Report and understand a financial cyber-fraud case",
};

export default function HomePage() {
  return (
    <>
      <DemoJourney />
      <JourneyInformation />
    </>
  );
}
