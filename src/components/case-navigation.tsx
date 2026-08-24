"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_MESSAGES } from "../content/en";

export function CaseNavigation() {
  const pathname = usePathname();
  const overviewCurrent = pathname === "/"
    ? "page"
    : pathname.startsWith("/money-path/")
      ? "location"
      : undefined;
  const ledgerCurrent = pathname === "/ledger" ? "page" : undefined;
  const aboutCurrent = pathname === "/about" ? "page" : undefined;

  return (
    <nav className="case-nav" aria-label={UI_MESSAGES.navigation.label.defaultMessage}>
      <div className="shell nav-inner">
        <Link href="/" aria-current={overviewCurrent}>
          {UI_MESSAGES.navigation.overview.defaultMessage}
        </Link>
        <Link href="/ledger" aria-current={ledgerCurrent}>
          {UI_MESSAGES.navigation.ledger.defaultMessage}
        </Link>
        <Link href="/about" aria-current={aboutCurrent}>
          {UI_MESSAGES.navigation.about.defaultMessage}
        </Link>
      </div>
    </nav>
  );
}
