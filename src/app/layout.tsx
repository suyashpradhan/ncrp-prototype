import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "../components/app-shell";
import { DemoCaseProvider } from "../components/demo-case/demo-case-provider";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NCRP Recovery · Independent hackathon prototype",
    template: "%s · NCRP Recovery",
  },
  description:
    "A synthetic citizen view of what is happening to money after a financial cyber fraud is reported.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15283d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppShell>
          <DemoCaseProvider initialCase={syntheticCase} initialNow={DEMO_NOW}>
            {children}
          </DemoCaseProvider>
        </AppShell>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
