import type { Metadata } from "next";
import { HowContent } from "../../components/static/how-content";

export const metadata: Metadata = {
  title: "How this works",
};

export default function HowItWorksPage() {
  return <HowContent />;
}
