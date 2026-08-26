import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "../components/app-shell";
import { DemoCaseProvider } from "../components/demo-case/demo-case-provider";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import { I18nProvider } from "../i18n/i18n-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ncrp-recovery-prototype.vercel.app"),
  title: {
    default: "Financial Cyber Fraud Reporting · NCRP experience prototype",
    template: "%s · Financial Cyber Fraud Reporting",
  },
  description:
    "A synthetic citizen journey from plain-language NCRP reporting through the existing restoration stage to a proposed Financial Resolution experience.",
  openGraph: {
    title: "Financial Cyber Fraud Reporting",
    description: "From a citizen's story to structured reporting and clear financial resolution",
    images: [{ url: "/og.jpg", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Cyber Fraud Reporting",
    description: "From a citizen's story to structured reporting and clear financial resolution",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <I18nProvider>
          <AppShell>
            <DemoCaseProvider initialCase={syntheticCase} initialNow={DEMO_NOW}>
              {children}
            </DemoCaseProvider>
          </AppShell>
        </I18nProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
