"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI_MESSAGES } from "../content/en";

export function CaseNavigation() {
  const pathname = usePathname();
  const overviewCurrent = pathname === "/case"
    ? "page"
    : pathname.startsWith("/money-path/")
      ? "location"
      : undefined;
  const howCurrent = pathname === "/how-it-works" ? "page" : undefined;
  const aboutCurrent = pathname === "/about" ? "page" : undefined;

  return (
    <nav className="case-nav" aria-label={UI_MESSAGES.navigation.label.defaultMessage}>
      <div className="shell nav-inner">
        <Link href="/case" aria-current={overviewCurrent}>
          {UI_MESSAGES.navigation.overview.defaultMessage}
        </Link>
        <Link href="/how-it-works" aria-current={howCurrent}>
          {UI_MESSAGES.navigation.ledger.defaultMessage}
        </Link>
        <Link href="/about" aria-current={aboutCurrent}>
          {UI_MESSAGES.navigation.about.defaultMessage}
        </Link>
      </div>
    </nav>
  );
}
