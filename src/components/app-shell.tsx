"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { appName } from "../config/brand";
import { useI18n } from "../i18n/i18n-provider";
import { useJourneyNavigation } from "../navigation/journey-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { controls } = useJourneyNavigation();
  const isJourneyPage = pathname === "/";
  const showBack = !isJourneyPage || Boolean(controls);

  function goBack() {
    if (isJourneyPage && controls) {
      controls.onBack();
      return;
    }
    router.back();
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t("skip.main")}
      </a>
      <header className="site-header">
        <div className="shell header-inner">
          <Link
            className="brand"
            href="/"
            aria-label={
              locale === "hi"
                ? `${appName(locale)} के मुख्य पेज पर जाएँ`
                : `Go to the ${appName(locale)} home page`
            }
            onClick={(event) => {
              if (!controls) return;
              controls.onHome();
              if (isJourneyPage) event.preventDefault();
            }}
          >
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
      {showBack ? (
        <nav
          className="journey-back-nav"
          aria-label={locale === "hi" ? "पेज नेविगेशन" : "Page navigation"}
        >
          <div className="shell">
            <button
              className="journey-back-button"
              type="button"
              onClick={goBack}
              aria-label={locale === "hi" ? "पिछले पेज पर वापस जाएँ" : "Go back to the previous page"}
            >
              <span aria-hidden="true">←</span>
              {locale === "hi" ? "वापस" : "Back"}
            </button>
          </div>
        </nav>
      ) : null}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
