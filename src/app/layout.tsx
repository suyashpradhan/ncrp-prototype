import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "../components/app-shell";
import { DemoCaseProvider } from "../components/demo-case/demo-case-provider";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Money Path · Synthetic financial-resolution prototype",
    template: "%s · Money Path",
  },
  description: "A synthetic citizen view of concurrent NCRP/CFCFRMS financial-resolution processes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15283d",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <AppShell>
          <DemoCaseProvider initialCase={syntheticCase} initialNow={DEMO_NOW}>
            {children}
          </DemoCaseProvider>
        </AppShell>
      </body>
    </html>
  );
}
