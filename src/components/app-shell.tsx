import Link from "next/link";
import type { ReactNode } from "react";
import { UI_MESSAGES } from "../content/en";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <header className="site-header">
        <div className="shell">
          <div className="header-inner">
            <Link
              className="brand"
              href="/"
              aria-label={UI_MESSAGES.brand.name.defaultMessage}
            >
              <span className="brand-name">
                {UI_MESSAGES.brand.name.defaultMessage}
              </span>
              <span className="prototype-label">
                {UI_MESSAGES.prototype.label.defaultMessage}
              </span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div className="footer-disclosure">
            <p>{UI_MESSAGES.prototype.shortDisclosure.defaultMessage}</p>
            <nav className="footer-links" aria-label="Secondary navigation">
              <Link className="footer-link" href="/how-it-works">
                {UI_MESSAGES.footer.howLink.defaultMessage}
              </Link>
              <Link className="footer-link" href="/about">
                {UI_MESSAGES.footer.aboutLink.defaultMessage}
              </Link>
              <Link className="footer-link" href="/about#provenance">
                {UI_MESSAGES.footer.sourcesLink.defaultMessage}
              </Link>
            </nav>
          </div>
          <p>{UI_MESSAGES.footer.guardrail.defaultMessage}</p>
        </div>
      </footer>
    </>
  );
}
