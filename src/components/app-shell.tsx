"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { appName } from "../config/brand";
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
        <div className="shell service-header-inner">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label={appName(locale)}>
              <span className="brand-mark" aria-hidden="true">
                <span />
              </span>
              <span>
                <span className="brand-name">{appName(locale)}</span>
                <span className="brand-description">
                  {t("brand.description")}
                </span>
                <span className="brand-support">{t("brand.prototype")}</span>
              </span>
            </Link>
            <div className="header-actions">
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
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="footer-disclosure">
            <span className="footer-brand">{appName(locale)}</span>
            <p>{m(UI_MESSAGES.footer.guardrail)}</p>
            <nav
              className="footer-links"
              aria-label={t("header.secondaryNavigation")}
            >
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
