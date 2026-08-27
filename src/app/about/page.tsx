import type { Metadata } from "next";
import { AboutContent } from "../../components/static/about-content";
import { APP_NAME } from "../../config/brand";

export const metadata: Metadata = {
  title: "About this prototype",
  description: `What the independent ${APP_NAME} prototype represents.`,
};

export default function AboutPage() {
  return <AboutContent />;
}
