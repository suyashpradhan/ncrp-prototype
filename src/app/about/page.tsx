import type { Metadata } from "next";
import { AboutContent } from "../../components/static/about-content";

export const metadata: Metadata = {
  title: "About this prototype",
  description: "What the independent Financial Cyber Fraud Reporting prototype represents.",
};

export default function AboutPage() {
  return <AboutContent />;
}
