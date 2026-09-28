// Admins enter dates/times as UK wall-clock time; the server runs in UTC, so
// convert explicitly (handles GMT/BST switchovers).
const TZ = "Europe/London";

function londonOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

export function ukTimeToDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let ts = wallClock - londonOffsetMs(wallClock);
  ts = wallClock - londonOffsetMs(ts);
  return new Date(ts);
}

/** Parses a `datetime-local` value ("YYYY-MM-DDTHH:mm") as UK time. */
export function parseUkDateTimeLocal(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return ukTimeToDate(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}
