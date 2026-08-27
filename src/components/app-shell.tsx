"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { appName } from "../config/brand";
import { useI18n } from "../i18n/i18n-provider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t("skip.main")}
      </a>
      <header className="site-header">
        <div className="shell header-inner">
            <Link className="brand" href="/" aria-label={appName(locale)}>
              {appName(locale)}
            </Link>
            <div className="header-actions">
              <Link className="header-about-link" href="/about">
                {locale === "hi" ? "परिचय" : "About"}
              </Link>
              <div
                className="language-switch"
                role="group"
                aria-label={t("header.languageLabel")}
              >
                <button
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                >
                  {t("language.english")}
                </button>
                <span aria-hidden="true">|</span>
                <button
                  type="button"
                  aria-pressed={locale === "hi"}
                  onClick={() => setLocale("hi")}
                >
                  {t("language.hindi")}
                </button>
              </div>
            </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <p>
            <span>{locale === "hi" ? "स्वतंत्र हैकाथॉन प्रोटोटाइप।" : "Independent hackathon prototype."}</span>
            <span>{locale === "hi" ? "कोई वास्तविक शिकायत जमा नहीं होती।" : "No real complaint is submitted."}</span>
          </p>
          <nav className="footer-links" aria-label={locale === "hi" ? "फुटर लिंक" : "Footer links"}>
            <Link className="footer-link" href="/about">
              {locale === "hi" ? "परिचय" : "About"}
            </Link>
            <Link className="footer-link" href="/how-it-works">
              {locale === "hi" ? "यह कैसे काम करता है" : "How it works"}
            </Link>
            <Link className="footer-link" href="/about#sources">
              {locale === "hi" ? "स्रोत" : "Sources"}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
