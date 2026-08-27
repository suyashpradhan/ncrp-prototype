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
    </>
  );
}
