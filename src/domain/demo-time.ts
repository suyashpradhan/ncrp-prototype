const ONE_DAY_MS = 86_400_000;

/** India has no daylight-saving transition, so one synthetic calendar day is 24 hours. */
export function advanceSyntheticDateByOneDay(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new Error(`Invalid synthetic date: ${value}`);
  return new Date(timestamp + ONE_DAY_MS).toISOString();
}
