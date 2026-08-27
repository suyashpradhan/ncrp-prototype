import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "../components/app-shell";
import { APP_NAME } from "../config/brand";
import { DemoCaseProvider } from "../components/demo-case/demo-case-provider";
import { DEMO_NOW, syntheticCase } from "../data/synthetic-case";
import { I18nProvider } from "../i18n/i18n-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ncrp-recovery-prototype.vercel.app"),
  title: {
    default: `${APP_NAME} · Financial cyber-fraud reporting`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Tell Sachet what happened by voice, text or evidence, then review structured financial cyber-fraud reporting information.",
  openGraph: {
    title: APP_NAME,
    description: "From a citizen's story to complete structured financial cyber-fraud reporting information",
    images: [{ url: "/og.jpg", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: "From a citizen's story to complete structured financial cyber-fraud reporting information",
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
    <html
      lang="en"
      className={`${manrope.variable} ${notoDevanagari.variable}`}
      data-scroll-behavior="smooth"
    >
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
