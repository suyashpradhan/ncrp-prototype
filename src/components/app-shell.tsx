import Link from "next/link";
import type { ReactNode } from "react";
import { UI_MESSAGES } from "../content/en";
import { CaseNavigation } from "./case-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <div className="prototype-banner" role="note">
        <span className="prototype-dot" aria-hidden="true" />
        {UI_MESSAGES.prototype.shortDisclosure.defaultMessage}
      </div>
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label={UI_MESSAGES.brand.name.defaultMessage}>
            <span className="brand-mark" aria-hidden="true">NR</span>
            <span>
              <span className="brand-eyebrow">{UI_MESSAGES.brand.eyebrow.defaultMessage}</span>
              <span className="brand-name">{UI_MESSAGES.brand.name.defaultMessage}</span>
            </span>
          </Link>
          <span className="prototype-label">{UI_MESSAGES.prototype.label.defaultMessage}</span>
        </div>
        <CaseNavigation />
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="footer-disclosure">
            <p>{UI_MESSAGES.prototype.fullDisclosure.defaultMessage}</p>
            <Link className="footer-link" href="/about">
              {UI_MESSAGES.footer.aboutLink.defaultMessage}
            </Link>
          </div>
          <p>{UI_MESSAGES.footer.guardrail.defaultMessage}</p>
        </div>
      </footer>
    </>
  );
}
