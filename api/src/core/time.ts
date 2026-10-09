/** Current day boundaries computed in Africa/Lagos, returned as UTC instants. */
export function lagosDayRange(now: Date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`);
  return { start: day, end: new Date(day.getTime() + 86_400_000) };
}