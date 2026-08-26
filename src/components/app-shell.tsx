"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { UI_MESSAGES } from "../content/en";
import { useI18n } from "../i18n/i18n-provider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { locale, setLocale, m, t } = useI18n();

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t("skip.main")}
      </a>
      <header className="site-header">
        <div className="top-accent" aria-hidden="true" />
        <div className="utility-bar">
          <div className="shell utility-inner">
            <span>Independent public-service prototype</span>
            <div className="utility-actions">
              <div className="language-switch" role="group" aria-label={t("header.languageLabel")}>
                <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
                  {t("language.english")}
                </button>
                <span aria-hidden="true">|</span>
                <button type="button" aria-pressed={locale === "hi"} onClick={() => setLocale("hi")}>
                  {t("language.hindi")}
                </button>
              </div>
              <span className="utility-accessibility" aria-label="Accessibility options">A- &nbsp;A&nbsp; A+</span>
            </div>
          </div>
        </div>
        <div className="shell service-header-inner">
          <div className="header-inner">
            <Link
              className="brand"
              href="/"
              aria-label={m(UI_MESSAGES.brand.name)}
            >
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span>
                <span className="brand-name">Financial Cyber Fraud Reporting</span>
                <span className="brand-description">NCRP experience prototype</span>
                <span className="brand-support">A citizen-first exploration of reporting and financial resolution</span>
              </span>
            </Link>
            <a className="helpline-block" href="tel:1930" aria-label="Call 1930, the cyber fraud helpline">
              <span className="helpline-icon" aria-hidden="true">☎</span>
              <span><strong>1930</strong><small>Cyber fraud helpline<br />Official helpline</small></span>
            </a>
          </div>
        </div>
        <div className="prototype-strip">
          <div className="shell">Prototype only · No government system is connected · All case data is synthetic</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="footer-disclosure">
            <p>Independent hackathon prototype. Not affiliated with an official government service. All case information is synthetic.</p>
            <nav className="footer-links" aria-label={t("header.secondaryNavigation")}>
              <Link className="footer-link" href="/about">
                {m(UI_MESSAGES.footer.aboutLink)}
              </Link>
              <Link className="footer-link" href="/how-it-works">
                {m(UI_MESSAGES.footer.howLink)}
              </Link>
              <Link className="footer-link" href="/about#sources">
                {m(UI_MESSAGES.footer.sourcesLink)}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
