import type { Actor } from "../domain/actors";
import { ACTOR_MESSAGES } from "../domain/actors";
import type { MoneyPath } from "../domain/case";
import type { ProcessRoute } from "../sop/processes";
import { PROCESS_ROUTE_MESSAGES, UI_MESSAGES } from "../content/en";
import type { UiLocale } from "../i18n/i18n-provider";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INDIA_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const INDIA_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
});

const INDIA_DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
});

const INDIA_SHORT_DATE_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatIndiaDate(value: string, locale: UiLocale = "en"): string {
  if (locale === "en") return INDIA_DATE_FORMATTER.format(new Date(value));
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatIndiaShortDate(value: string, locale: UiLocale = "en"): string {
  if (locale === "en") return INDIA_SHORT_DATE_FORMATTER.format(new Date(value));
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function formatIndiaDayMonth(value: string, locale: UiLocale = "en"): string {
  if (locale === "en") return INDIA_DAY_MONTH_FORMATTER.format(new Date(value));
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export function formatIndiaShortDateWithYear(value: string, locale: UiLocale = "en"): string {
  if (locale === "en") return INDIA_SHORT_DATE_WITH_YEAR_FORMATTER.format(new Date(value));
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatProcessRoute(route: ProcessRoute | null): string {
  return route
    ? PROCESS_ROUTE_MESSAGES[route].defaultMessage
    : UI_MESSAGES.detail.noRecordedProcess.defaultMessage;
}

export function getActorLabel(actor: Actor, path?: MoneyPath): string {
  if (actor === "BANK" && path?.beneficiaryInstitution) {
    return path.beneficiaryInstitution.name;
  }

  return ACTOR_MESSAGES[actor].defaultMessage;
}
