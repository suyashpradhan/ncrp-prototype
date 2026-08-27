export const APP_NAME = "Sachet";
export const APP_NAME_HI = "सचेत";

export function appName(locale: "en" | "hi"): string {
  return locale === "hi" ? APP_NAME_HI : APP_NAME;
}
