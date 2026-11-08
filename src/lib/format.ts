// Number and time formatting. Wall-clock strings (YYYY-MM-DDTHH:mm) describe datasets with a
// fixed zone (weather in UTC, eddy covariance in EET) and are never shifted by the browser zone.
import { getLang } from "./lang";

export const locale = () => (getLang() === "ro" ? "ro-RO" : "en-GB");

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(digits: number) {
  const key = `${locale()}:${digits}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
    nfCache.set(key, f);
  }
  return f;
}

const isMissing = (v: number | null | undefined): v is null | undefined => v === null || v === undefined || Number.isNaN(v);

export function fmtNum(value: number | null | undefined, digits = 1) {
  return isMissing(value) ? "n/d" : nf(digits).format(value);
}

export function fmtAuto(value: number | null | undefined) {
  if (isMissing(value)) return "n/d";
  const a = Math.abs(value);
  const digits = a === 0 ? 0 : a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
  return fmtNum(value, digits);
}

export const fmtInt = (value: number | null | undefined) => fmtNum(value, 0);

export function fmtCompact(value: number) {
  return new Intl.NumberFormat(locale(), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// Wall clock ---------------------------------------------------------------------------
export function wallToMs(wall: string) {
  const [d, t = "00:00"] = wall.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [H, M] = t.split(":").map(Number);
  return Date.UTC(y, m - 1, day, H || 0, M || 0);
}

export const msToWall = (ms: number) => new Date(ms).toISOString().slice(0, 16);
export const addMinutes = (wall: string, minutes: number) => msToWall(wallToMs(wall) + minutes * 60000);
export const wallDate = (wall: string) => wall.slice(0, 10);
export const wallTime = (wall: string) => (wall.length > 10 ? wall.slice(11, 16) : "00:00");

export function clampWall(wall: string, min?: string | null, max?: string | null) {
  if (min && wall < min) return min;
  if (max && wall > max) return max;
  return wall;
}

export function fmtWall(wall: string, { time = true } = {}) {
  const opts: Intl.DateTimeFormatOptions = { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" };
  if (time) Object.assign(opts, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return new Intl.DateTimeFormat(locale(), opts).format(wallToMs(wall));
}

export function fmtWallMs(ms: number, { time = true, year = true } = {}) {
  const opts: Intl.DateTimeFormatOptions = { timeZone: "UTC", day: "2-digit", month: "short" };
  if (year) opts.year = "numeric";
  if (time) Object.assign(opts, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return new Intl.DateTimeFormat(locale(), opts).format(ms);
}

export function fmtMonth(isoDate: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale(), { timeZone: "UTC", month: style, year: "numeric" }).format(wallToMs(isoDate.slice(0, 10)));
}

/** Axis tick for a time domain: picks the granularity from the span. */
export function tickFormatter(spanMs: number) {
  const day = 86400000;
  const opts: Intl.DateTimeFormatOptions =
    spanMs > 60 * day ? { timeZone: "UTC", month: "short", year: "2-digit" }
      : spanMs > 3 * day ? { timeZone: "UTC", day: "2-digit", month: "short" }
        : { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  const f = new Intl.DateTimeFormat(locale(), opts);
  return (ms: number) => f.format(ms);
}

// Instants (the LifeWatch API returns timezone-aware ISO strings) ----------------------
export const RO_TZ = "Europe/Bucharest";

export function fmtInstant(ms: number, { seconds = false } = {}) {
  const opts: Intl.DateTimeFormatOptions = { timeZone: RO_TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  if (seconds) opts.second = "2-digit";
  return new Intl.DateTimeFormat(locale(), opts).format(ms);
}

const offsetCache = new Map<number, number>();
const offsetFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: RO_TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

/** Offset of Europe/Bucharest from UTC at an instant, in milliseconds. */
export function bucharestOffset(ms: number) {
  const hourKey = Math.floor(ms / 3600000);
  const hit = offsetCache.get(hourKey);
  if (hit !== undefined) return hit;
  const parts = offsetFmt.formatToParts(ms);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = asUtc - Math.floor(ms / 1000) * 1000;
  offsetCache.set(hourKey, offset);
  return offset;
}

export const instantToBucharestWall = (ms: number) => msToWall(ms + bucharestOffset(ms));

export function bucharestWallToInstant(wall: string) {
  const guess = wallToMs(wall);
  const offset = bucharestOffset(guess - bucharestOffset(guess));
  return guess - offset;
}

export function fmtDuration(ms: number) {
  const h = Math.round(ms / 3600000);
  if (h < 48) return `${h} h`;
  const d = Math.round(h / 24);
  return getLang() === "ro" ? `${d} zile` : `${d} days`;
}

// Units ----------------------------------------------------------------------------------
const SUB: Record<string, string> = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉", "-": "₋", "+": "₊" };
const SUP: Record<string, string> = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻", "+": "⁺" };
const mapChars = (s: string, table: Record<string, string>) => [...s].map((c) => table[c] ?? c).join("");

/** Typesets the LaTeX-like unit notation of the LifeWatch API ("mmol H_{2}O m^{-3}", "C"). */
export function prettyUnit(unit?: string | null) {
  if (!unit) return "";
  if (unit === "C") return "°C";
  return unit
    .replace(/_\{([^}]*)\}/g, (_, x: string) => mapChars(x, SUB))
    .replace(/\^\{([^}]*)\}/g, (_, x: string) => mapChars(x, SUP))
    .replace(/\^(-?\d+)/g, (_, x: string) => mapChars(x, SUP))
    .replace(/\bumol\b/g, "µmol")
    .replace(/\bCO2\b/g, "CO₂")
    .replace(/\bCH4\b/g, "CH₄")
    .replace(/\bH2O\b/g, "H₂O");
}
