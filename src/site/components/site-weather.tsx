// Weather at a place of the network: the last 24 hours at the closest ANM weather station, the ALARO-4 forecast of
// ANM for the place itself and the ANM warnings in force there.
//   - Observations: EUMETNET MeteoGate (OGC API EDR), read in the browser; the station of each of our points is
//     chosen in public/data/anm-hourly-stations.json (scripts/meteo_stations.py), other places take the closest.
//   - Forecast: GET /api/meteo on Netlify (netlify/functions/meteo.mts with src/site/meteo/alaro.ts), shared by
//     every copy of the site, because the ANM portal does not let browsers read the model files.
//   - Warnings: the ANM feed of warnings in force, as GeoJSON polygons of counties and zones.
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt, type LwPoint } from "../content/lw";
import { pick } from "../i18n/core";
import type { PointForecast } from "../meteo/alaro";
import { HoverChart, type TipRow } from "./chart-hover";
import { H3, KeyValues } from "./lw-ui";

export const METEO_API = "https://lifewatchromania.netlify.app/api/meteo";
const EDR =
  "https://api.meteogate.eu/eu-eumetnet-surface-observations/collections/observations/locations";
export const WARNINGS_URL = "https://opendata.geo.meteoromania.ro/data/warnings/current.geojson";
const ALARO_URL = "https://opendata.geo.meteoromania.ro/catalog/ro.anm.nwp.alaro4/";
const WARNINGS_PAGE = "https://opendata.geo.meteoromania.ro/catalog/ro.anm.warnings/";
const TZ = "Europe/Bucharest";
const HOUR = 3600_000;

/** Places the forecast function serves: Romania and its borders. */
export const inRomania = (p: { lat: number; lon: number }) =>
  p.lat > 43.5 && p.lat < 48.5 && p.lon > 20 && p.lon < 30;

/* ---------------------------------------------------------------- loading */
function once<T>(load: () => Promise<T>, ttl: number) {
  let cache: { at: number; value: Promise<T> } | null = null;
  return () => {
    if (!cache || Date.now() - cache.at > ttl) cache = { at: Date.now(), value: load() };
    return cache.value;
  };
}
const json = async <T,>(url: string, ms = 20000): Promise<T | null> => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

interface Stations {
  stations: [string, string, number, number, number][];
  points: Record<string, string>;
}
const loadStations = once(
  () => json<Stations>(`${import.meta.env.BASE_URL}data/anm-hourly-stations.json`),
  Infinity,
);

export interface WarningProps {
  id: string;
  feed: string;
  area_name: string;
  level: number;
  level_name: string;
  type_name?: string;
  onset: string;
  expires: string;
  interval_text?: string;
  phenomena?: string;
  message_text?: string;
}
type Ring = [number, number][];
export interface WarningFeature {
  type: "Feature";
  geometry:
    | { type: "Polygon"; coordinates: Ring[] }
    | { type: "MultiPolygon"; coordinates: Ring[][] }
    | null;
  properties: WarningProps;
}
export interface WarningCollection {
  type: "FeatureCollection";
  features: WarningFeature[];
}
export const loadWarnings = once(() => json<WarningCollection>(WARNINGS_URL), 5 * 60_000);

/** Warnings whose validity has not ended. */
export const activeWarnings = (fc: WarningCollection | null, now = Date.now()) =>
  (fc?.features ?? []).filter((f) => f.geometry && Date.parse(f.properties.expires) > now);

function inRing(lon: number, lat: number, ring: Ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function covers(f: WarningFeature, lat: number, lon: number) {
  const g = f.geometry;
  if (!g) return false;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.some(
    (rings) => inRing(lon, lat, rings[0]) && !rings.slice(1).some((r) => inRing(lon, lat, r)),
  );
}

/* ---------------------------------------------------------------- warnings */
export const LEVELS: Record<number, { ro: string; en: string; color: string }> = {
  1: { ro: "Cod galben", en: "Yellow warning", color: "#e5b700" },
  2: { ro: "Cod portocaliu", en: "Orange warning", color: "#e8730c" },
  3: { ro: "Cod roșu", en: "Red warning", color: "#c8102e" },
};
export const levelOf = (n: number) => LEVELS[n] ?? LEVELS[1];

/** The phenomena named in the text of a warning ("Fenomene vizate: …"), or the phenomena field. */
export const phenomenaOf = (w: WarningProps) =>
  w.message_text?.match(/Fenomene vizate:\s*([^\n]+)/i)?.[1]?.trim() ||
  (w.phenomena && !/conform textelor/i.test(w.phenomena) ? w.phenomena : null);

export const whenText = (iso: string) =>
  new Date(iso).toLocaleString(pick("ro-RO", "en-GB"), {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** "until …" for a warning in force, "from … until …" for one that starts later. */
export const validity = (w: WarningProps, now = Date.now()) =>
  Date.parse(w.onset) > now
    ? `${pick("de la", "from")} ${whenText(w.onset)} ${pick("până la", "until")} ${whenText(w.expires)}`
    : `${pick("până", "until")} ${whenText(w.expires)}`;

function WarningCard({ w }: { w: WarningProps }) {
  const [open, setOpen] = useState(false);
  const lv = levelOf(w.level);
  const what = phenomenaOf(w);
  return (
    <div
      className="rounded-[10px] border border-border bg-surface p-3 pl-3.5 shadow-card"
      style={{ borderLeft: `5px solid ${lv.color}` }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <AlertTriangle
          className="size-4 shrink-0"
          style={{ color: lv.color }}
          strokeWidth={2.2}
          aria-hidden
        />
        <b className="text-[14.5px]">{pick(lv.ro, lv.en)}</b>
        <span className="text-[13.5px] text-muted">
          {w.feed === "nowcasting"
            ? pick("avertizare imediată", "nowcasting warning")
            : pick("avertizare ANM", "ANM warning")}{" "}
          · {w.area_name}
        </span>
      </div>
      {what ? <p className="mt-1 text-[14px]">{what}</p> : null}
      <p className="mt-0.5 text-[13px] text-subtle">
        {pick("Valabilă", "Valid")} {whenText(w.onset)} – {whenText(w.expires)}
      </p>
      {w.message_text ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
          >
            {open
              ? pick("Ascunde textul", "Hide the text")
              : pick("Textul avertizării", "Warning text")}
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
          {open ? (
            <p className="mt-1.5 max-w-[820px] text-[13.5px] leading-[1.55] whitespace-pre-line text-muted">
              {w.message_text.trim()}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** One line per warning, for the head of a sheet; the button opens the weather tab. */
function WarningLine({ w, onOpen }: { w: WarningProps; onOpen?: () => void }) {
  const lv = levelOf(w.level);
  const what = phenomenaOf(w);
  return (
    <div
      className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[10px] border border-border bg-surface px-3 py-2 text-[14px] shadow-card"
      style={{ borderLeft: `5px solid ${lv.color}` }}
    >
      <AlertTriangle
        className="size-4 shrink-0"
        style={{ color: lv.color }}
        strokeWidth={2.2}
        aria-hidden
      />
      <span>
        <b>{pick(`${lv.ro} ANM aici`, `${lv.en} from ANM here`)}</b>
        {what ? `: ${what}` : ""}
        <span className="text-subtle"> · {validity(w)}</span>
      </span>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="ml-auto text-[13px] font-semibold text-accent hover:underline"
        >
          {pick("Vremea și prognoza", "Weather and forecast")}
        </button>
      ) : null}
    </div>
  );
}

/** The ANM warnings in force at a place; nothing when there are none. */
export function WarningsAt({
  p,
  compact,
  onOpen,
  className,
}: {
  p: { lat: number; lon: number };
  compact?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  const [list, setList] = useState<WarningProps[]>([]);
  useEffect(() => {
    let on = true;
    void loadWarnings().then((fc) => {
      if (!on) return;
      // A place can lie in a county and in its mountain zone; each warning keeps its highest level here.
      const best = new Map<string, WarningProps>();
      for (const f of activeWarnings(fc)) {
        if (!covers(f, p.lat, p.lon)) continue;
        const w = f.properties;
        const key = `${w.feed}/${w.id}`;
        if (!best.has(key) || best.get(key)!.level < w.level) best.set(key, w);
      }
      const here = [...best.values()].sort((a, b) => b.level - a.level);
      setList(here);
    });
    return () => {
      on = false;
    };
  }, [p.lat, p.lon]);
  if (!list.length) return null;
  return (
    <div
      className={cn("grid gap-2", className)}
      role="region"
      aria-label={pick("Avertizări meteorologice ANM", "ANM weather warnings")}
    >
      {list.map((w) =>
        compact ? (
          <WarningLine key={`${w.id}/${w.level}/${w.area_name}`} w={w} onOpen={onOpen} />
        ) : (
          <WarningCard key={`${w.id}/${w.level}/${w.area_name}`} w={w} />
        ),
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- observations */
interface Coverage {
  domain: { axes: { t: { values: string[] } } };
  ranges: Record<string, { values: (number | null)[] }>;
}
interface Sample {
  t: number;
  temp: number | null;
  rain: number | null;
  /** Hours the precipitation was summed over. */
  hours: number;
  wind: number | null;
  dir: number | null;
  cloud: number | null;
  obs: boolean;
}

async function observations(wsi: string): Promise<Sample[] | null> {
  const to = new Date(Math.floor(Date.now() / HOUR) * HOUR + HOUR);
  const from = new Date(to.getTime() - 26 * HOUR);
  const d = await json<{ coverages: Coverage[] }>(
    `${EDR}/${wsi}?datetime=${from.toISOString().slice(0, 19)}Z/${to.toISOString().slice(0, 19)}Z`,
  );
  if (!d?.coverages) return null;
  const at = new Map<number, Sample>();
  const sample = (t: number) => {
    if (!at.has(t))
      at.set(t, {
        t,
        temp: null,
        rain: null,
        hours: 1,
        wind: null,
        dir: null,
        cloud: null,
        obs: true,
      });
    return at.get(t)!;
  };
  for (const c of d.coverages) {
    const times = c.domain.axes.t.values.map((s) => Date.parse(s));
    const r = c.ranges;
    // Parameter names carry the sensor height, which differs between stations: "air_temperature:2.1:point:PT0S".
    const key = (name: string, tail: string) =>
      Object.keys(r).find((k) => k.startsWith(`${name}:`) && k.endsWith(tail));
    const val = (k: string | undefined, i: number) => {
      const v = k ? r[k]?.values[i] : null;
      return v == null || !Number.isFinite(v) ? null : v;
    };
    const temp = key("air_temperature", ":point:PT0S"),
      wind = key("wind_speed", ":point:PT10M"),
      dir = key("wind_from_direction", ":point:PT10M"),
      rain = key("precipitation_amount", ":sum:PT1H");
    times.forEach((t, i) => {
      if (t % HOUR) return;
      if (temp) {
        const s = sample(t);
        s.temp = val(temp, i);
        s.wind = val(wind, i);
        s.dir = val(dir, i);
      }
      if (rain) sample(t).rain = val(rain, i);
    });
  }
  return [...at.values()].filter((s) => s.temp != null).sort((a, b) => a.t - b.t);
}

/* ---------------------------------------------------------------- sun */
// Sunrise and sunset (sun 0.833° below the horizon), after the formulas of the Astronomical Almanac.
const RAD = Math.PI / 180;
function sunTimes(day: number, lat: number, lon: number): [number, number] | null {
  const d = day / 86400_000 - 0.5 + 2440588 - 2451545;
  const lw = -lon * RAD;
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = RAD * (357.5291 + 0.98560028 * ds);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(RAD * 23.4397) * Math.sin(L));
  const noon = 2451545 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const cosH =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(dec)) /
    (Math.cos(lat * RAD) * Math.cos(dec));
  if (Math.abs(cosH) > 1) return null;
  const half = Math.acos(cosH) / (2 * Math.PI);
  const ms = (j: number) => (j + 0.5 - 2440588) * 86400_000;
  return [ms(noon - half), ms(noon + half)];
}

/* ---------------------------------------------------------------- meteogram */
const compass = (deg: number) =>
  pick("N NE E SE S SV V NV", "N NE E SE S SW W NW").split(" ")[Math.round(deg / 45) % 8];
const kmh = (ms: number) => Math.round(ms * 3.6);
const local = (t: number, o: Intl.DateTimeFormatOptions) =>
  new Date(t).toLocaleString(pick("ro-RO", "en-GB"), { timeZone: TZ, ...o });
const localHour = (t: number) => Number(local(t, { hour: "2-digit", hourCycle: "h23" }));
/** Local midnights between two instants. */
function midnights(t0: number, t1: number) {
  const out: number[] = [];
  for (let t = Math.ceil(t0 / HOUR) * HOUR; t <= t1; t += HOUR) if (localHour(t) === 0) out.push(t);
  return out;
}
const niceStep = (span: number) => (span > 24 ? 10 : span > 12 ? 5 : span > 6 ? 2 : 1);

function Meteogram({
  samples,
  now,
  lat,
  lon,
  station,
}: {
  samples: Sample[];
  now: number;
  lat: number;
  lon: number;
  station: string | null;
}) {
  const W = 920,
    L = 46,
    R = 12;
  const top = 26,
    tH = 132,
    gap = 16,
    pH = 58,
    wY = top + tH + gap + pH + 22,
    cY = wY + 30,
    H = cY + 12 + 26;
  // An observed hour of precipitation is drawn over the hour before its time.
  const t0 = samples[0].t - (samples[0].obs ? 1 : samples[0].hours) * HOUR;
  const t1 = samples[samples.length - 1].t;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const temps = samples.map((s) => s.temp).filter((v): v is number => v != null);
  const step = niceStep(Math.max(...temps) - Math.min(...temps));
  const lo = Math.floor((Math.min(...temps) - 0.5) / step) * step;
  const hi = Math.ceil((Math.max(...temps) + 0.5) / step) * step;
  const yT = (v: number) => top + ((hi - v) / (hi - lo)) * tH;
  const rates = samples.map((s) => (s.rain ?? 0) / s.hours);
  const pMax = Math.max(1, Math.ceil(Math.max(...rates)));
  const pTop = top + tH + gap;
  const yP = (v: number) => pTop + pH - (v / pMax) * pH;
  const days = midnights(t0, t1);
  // Columns for hover: each sample reaches halfway to its neighbours.
  const xs = samples.map((s) => x(s.t));
  const cols = xs.map((xi, i) => {
    const a = i ? (xs[i - 1] + xi) / 2 : L;
    const b = i < xs.length - 1 ? (xi + xs[i + 1]) / 2 : W - R;
    return { x: a, w: Math.max(b - a, 1) };
  });
  const nights: [number, number][] = [];
  for (let d = Math.floor(t0 / 86400_000) * 86400_000 - 86400_000; d < t1; d += 86400_000) {
    const today = sunTimes(d + 43200_000, lat, lon);
    const next = sunTimes(d + 86400_000 + 43200_000, lat, lon);
    if (today && next) nights.push([Math.max(today[1], t0), Math.min(next[0], t1)]);
  }
  const line = (part: Sample[]) =>
    part
      .filter((s) => s.temp != null)
      .map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)},${yT(s.temp!).toFixed(1)}`)
      .join("");
  const obs = samples.filter((s) => s.obs);
  const fc = samples.filter((s) => !s.obs);
  // The forecast line starts at the last observation, so the two lines meet.
  const fcLine = line(obs.length ? [obs[obs.length - 1], ...fc] : fc);
  let lastArrow = -Infinity;
  const arrows = samples.filter((s) => {
    if (s.wind == null || s.dir == null || x(s.t) - lastArrow < 28) return false;
    lastArrow = x(s.t);
    return true;
  });
  const tempTicks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) tempTicks.push(+v.toFixed(1));
  // Local hours 00, 06, 12 and 18 along the bottom.
  const hourTicks: number[] = [];
  for (let t = Math.ceil(t0 / HOUR) * HOUR; t <= t1; t += HOUR)
    if (localHour(t) % 6 === 0) hourTicks.push(t);

  const tip = (i: number) => {
    const s = samples[i];
    const rows: TipRow[] = [];
    if (s.temp != null)
      rows.push({
        value: `${fmt(s.temp, 1)} °C`,
        label: pick("temperatura", "temperature"),
        color: "var(--an-warm)",
      });
    if (s.rain != null)
      rows.push({
        value: `${fmt(s.rain, 1)} mm`,
        label:
          s.hours === 1
            ? pick("în ora dinainte", "in the hour before")
            : pick(`în ${s.hours} ore`, `in ${s.hours} hours`),
        color: "var(--an-wet)",
      });
    if (s.wind != null)
      rows.push({
        value: `${kmh(s.wind)} km/h`,
        label:
          s.dir != null
            ? pick(`vânt din ${compass(s.dir)}`, `wind from ${compass(s.dir)}`)
            : pick("vânt", "wind"),
      });
    if (s.cloud != null)
      rows.push({ value: `${s.cloud} %`, label: pick("cer acoperit", "cloud cover") });
    rows.push({
      value: s.obs ? pick("observat", "observed") : pick("prognoză", "forecast"),
      label: s.obs ? (station ?? undefined) : "ALARO-4",
    });
    return {
      title: local(s.t, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rows,
    };
  };

  return (
    <HoverChart
      W={W}
      H={H}
      n={samples.length}
      cols={cols}
      label={pick(
        "Temperatura, precipitațiile, vântul și norii: ultimele 24 de ore și prognoza",
        "Temperature, precipitation, wind and clouds: the last 24 hours and the forecast",
      )}
      tip={tip}
      anchorY={(i) => (samples[i].temp != null ? yT(samples[i].temp!) : top)}
    >
      {(active) => (
        <>
          {nights.map(([a, b], i) =>
            b > a ? (
              <rect
                key={i}
                x={x(a)}
                y={top}
                width={x(b) - x(a)}
                height={cY + 12 - top}
                fill="var(--chart-axis)"
                opacity={0.07}
              />
            ) : null,
          )}
          {days.map((d) => (
            <line
              key={d}
              x1={x(d)}
              x2={x(d)}
              y1={top - 18}
              y2={cY + 12}
              stroke="var(--chart-grid)"
              strokeWidth={1.5}
            />
          ))}
          {[t0, ...days].map((d, i, all) => {
            const end = all[i + 1] ?? t1;
            if (x(end) - x(d) < 70) return null;
            return (
              <text
                key={d}
                x={x(d) + 6}
                y={top - 8}
                fontSize="12"
                fontWeight={600}
                fill="var(--chart-axis)"
              >
                {local(d + 3600_000, { weekday: "long", day: "numeric" })}
              </text>
            );
          })}
          {tempTicks.map((v) => (
            <g key={v}>
              <line
                x1={L}
                x2={W - R}
                y1={yT(v)}
                y2={yT(v)}
                stroke={v === 0 ? "var(--an-cold)" : "var(--chart-grid)"}
                strokeOpacity={v === 0 ? 0.55 : 1}
              />
              <text x={L - 6} y={yT(v) + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
                {`${fmt(v)}°`}
              </text>
            </g>
          ))}
          <path
            d={line(obs)}
            fill="none"
            stroke="var(--an-warm)"
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={fcLine}
            fill="none"
            stroke="var(--an-warm)"
            strokeWidth={2.2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {active != null && samples[active].temp != null ? (
            <circle
              cx={x(samples[active].t)}
              cy={yT(samples[active].temp!)}
              r={4.5}
              fill="var(--an-warm)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ) : null}

          <line
            x1={L}
            x2={W - R}
            y1={pTop + pH}
            y2={pTop + pH}
            stroke="var(--chart-axis)"
            strokeOpacity={0.5}
          />
          <line x1={L} x2={W - R} y1={pTop} y2={pTop} stroke="var(--chart-grid)" />
          <text x={L - 6} y={pTop + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
            {pMax}
          </text>
          <text x={L - 6} y={pTop + pH + 4} fontSize="11" textAnchor="end" fill="var(--chart-axis)">
            0
          </text>
          <text
            x={L - 6}
            y={pTop + pH / 2 + 4}
            fontSize="10"
            textAnchor="end"
            fill="var(--chart-axis)"
          >
            {pick("mm/h", "mm/h")}
          </text>
          {samples.map((s, i) =>
            s.rain ? (
              <rect
                key={i}
                x={x(s.t - s.hours * HOUR) + 1}
                y={yP(rates[i])}
                width={Math.max(x(s.t) - x(s.t - s.hours * HOUR) - 2, 1.5)}
                height={Math.max(pTop + pH - yP(rates[i]), 1)}
                rx={1.5}
                fill="var(--an-wet)"
                opacity={s.obs ? 1 : 0.6}
                stroke={i === active ? "var(--chart-axis)" : undefined}
              />
            ) : null,
          )}

          <text x={L - 6} y={wY + 4} fontSize="10" textAnchor="end" fill="var(--chart-axis)">
            km/h
          </text>
          {arrows.map((s) => (
            <g key={s.t} transform={`translate(${x(s.t)},${wY - 4})`}>
              <path
                d="M0,-7 L4,3 L0,1 L-4,3 Z"
                fill="var(--chart-axis)"
                transform={`rotate(${(s.dir! + 180) % 360})`}
              />
              <text
                y={18}
                fontSize="10.5"
                textAnchor="middle"
                fill="var(--chart-axis)"
                fontWeight={kmh(s.wind!) >= 40 ? 700 : 400}
              >
                {kmh(s.wind!)}
              </text>
            </g>
          ))}
          <text x={L - 6} y={cY + 9} fontSize="10" textAnchor="end" fill="var(--chart-axis)">
            {pick("nori", "cloud")}
          </text>
          {fc.map((s) =>
            s.cloud != null ? (
              <rect
                key={s.t}
                x={x(s.t - s.hours * HOUR)}
                y={cY}
                width={Math.max(x(s.t) - x(s.t - s.hours * HOUR), 1)}
                height={12}
                fill="var(--chart-axis)"
                opacity={(s.cloud / 100) * 0.55}
              />
            ) : null,
          )}

          {hourTicks
            .filter((t) => Math.abs(x(t) - x(now)) > 22)
            .map((t) => (
              <text
                key={t}
                x={x(t)}
                y={H - 8}
                fontSize="10.5"
                textAnchor="middle"
                fill="var(--chart-axis)"
              >
                {String(localHour(t)).padStart(2, "0")}
              </text>
            ))}
          {now > t0 && now < t1 ? (
            <g>
              <line
                x1={x(now)}
                x2={x(now)}
                y1={top}
                y2={cY + 12}
                stroke="var(--foreground)"
                strokeOpacity={0.55}
                strokeDasharray="2 3"
              />
              <text
                x={x(now)}
                y={H - 8}
                fontSize="10.5"
                fontWeight={700}
                textAnchor="middle"
                fill="var(--foreground)"
              >
                {pick("acum", "now")}
              </text>
            </g>
          ) : null}
        </>
      )}
    </HoverChart>
  );
}

/* ---------------------------------------------------------------- tab */
const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  6371 *
  Math.hypot((b.lon - a.lon) * RAD * Math.cos(((a.lat + b.lat) / 2) * RAD), (b.lat - a.lat) * RAD);

interface Station {
  wsi: string;
  name: string;
  lat: number;
  lon: number;
  elev: number;
  km: number;
}

export function SiteWeather({ p }: { p: LwPoint }) {
  const [station, setStation] = useState<Station | null | undefined>(undefined);
  const [obs, setObs] = useState<Sample[] | null | undefined>(undefined);
  const [fc, setFc] = useState<PointForecast | null | undefined>(undefined);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let on = true;
    const lat = Math.round(p.lat * 1000) / 1000,
      lon = Math.round(p.lon * 1000) / 1000;
    void json<PointForecast>(`${METEO_API}?lat=${lat}&lon=${lon}`, 30000).then(
      (d) => on && setFc(d?.steps?.length ? d : null),
    );
    void loadStations().then(async (list) => {
      if (!on) return;
      const rows = (list?.stations ?? []).map(([wsi, name, la, lo, elev]) => ({
        wsi,
        name,
        lat: la,
        lon: lo,
        elev,
        km: km(p, { lat: la, lon: lo }),
      }));
      const chosen =
        rows.find((s) => s.wsi === list?.points[p.key]) ?? rows.sort((a, b) => a.km - b.km)[0];
      const s = chosen && chosen.km <= 60 ? chosen : null;
      setStation(s);
      setObs(s ? await observations(s.wsi) : null);
    });
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      on = false;
      clearInterval(tick);
    };
  }, [p]);

  const samples = useMemo(() => {
    const past = (obs ?? []).filter((s) => s.t <= now);
    const last = past.length ? past[past.length - 1].t : now - HOUR;
    const future: Sample[] = (fc?.steps ?? [])
      .map((s) => ({
        t: Date.parse(s.time),
        temp: s.temp,
        rain: s.rain,
        hours: s.hours,
        wind: s.wind,
        dir: s.dir,
        cloud: s.cloud,
        obs: false,
      }))
      .filter((s) => s.t > last);
    return [...past, ...future];
  }, [obs, fc, now]);

  const loading = station === undefined || fc === undefined || (station && obs === undefined);
  const scroller = useRef<HTMLDivElement>(null);
  const shown = !loading && samples.length > 1;
  useEffect(() => {
    const el = scroller.current;
    if (!el || !shown || el.scrollWidth <= el.clientWidth) return;
    const t0 = samples[0].t,
      t1 = samples[samples.length - 1].t;
    el.scrollLeft = ((now - t0) / (t1 - t0)) * el.scrollWidth - el.clientWidth * 0.3;
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = obs?.length ? obs[obs.length - 1] : null;
  const next24 = (fc?.steps ?? []).filter(
    (s) => Date.parse(s.time) > now && Date.parse(s.time) - s.hours * HOUR < now + 24 * HOUR,
  );
  const runText = fc
    ? local(Date.parse(fc.run), {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div>
      <H3>{pick(`Vremea la ${p.ro}`, `Weather at ${p.ro}`)}</H3>
      <p className="mb-4 max-w-[860px] text-muted">
        {pick(
          "Ultimele 24 de ore măsurate la cea mai apropiată stație meteorologică ANM și prognoza modelului ALARO-4 al ANM pentru acest loc, cu avertizările ANM în vigoare aici.",
          "The last 24 hours measured at the closest ANM weather station and the forecast of the ANM ALARO-4 model for this place, with the ANM warnings in force here.",
        )}
      </p>
      <WarningsAt p={p} className="mb-5" />
      {loading ? (
        <p className="text-subtle">
          {pick("Se încarcă observațiile și prognoza…", "Loading observations and forecast…")}
        </p>
      ) : null}
      {!loading ? (
        <>
          <KeyValues
            className="mb-4"
            rows={[
              [
                station
                  ? pick(
                      `Ultima observație, ${station.name}`,
                      `Latest observation, ${station.name}`,
                    )
                  : pick("Ultima observație", "Latest observation"),
                latest
                  ? `${fmt(latest.temp, 1)} °C${latest.wind != null ? ` · ${pick("vânt", "wind")} ${kmh(latest.wind)} km/h${latest.dir != null ? ` ${pick("din", "from")} ${compass(latest.dir)}` : ""}` : ""} · ${pick("ora", "at")} ${local(latest.t, { hour: "2-digit", minute: "2-digit" })}`
                  : station
                    ? pick(
                        "stația nu a transmis date în ultimele ore",
                        "the station sent no data in the last hours",
                      )
                    : pick("nicio stație ANM la mai puțin de 60 km", "no ANM station within 60 km"),
              ],
              [
                pick("Următoarele 24 de ore", "Next 24 hours"),
                next24.length
                  ? `${pick("între", "between")} ${fmt(Math.min(...next24.map((s) => s.temp)), 0)} ${pick("și", "and")} ${fmt(Math.max(...next24.map((s) => s.temp)), 0)} °C · ${fmt(
                      next24.reduce((a, s) => a + s.rain, 0),
                      1,
                    )} mm · ${pick("vânt până la", "wind up to")} ${kmh(Math.max(...next24.map((s) => s.wind)))} km/h`
                  : null,
              ],
              [
                pick("Stația ANM", "ANM station"),
                station
                  ? `${station.name}, ${fmt(station.km, 1)} km, ${fmt(station.elev)} m`
                  : null,
              ],
              [
                pick("Prognoza", "Forecast"),
                fc
                  ? pick(
                      `ALARO-4, rularea din ${runText}; terenul modelului aici: ${fmt(fc.modelElev)} m`,
                      `ALARO-4, run of ${runText}; model terrain here: ${fmt(fc.modelElev)} m`,
                    )
                  : null,
              ],
            ]}
          />
          {samples.length > 1 ? (
            <>
              <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="22" height="6" aria-hidden>
                    <line
                      x1="1"
                      x2="21"
                      y1="3"
                      y2="3"
                      stroke="var(--an-warm)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {pick("observat", "observed")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="22" height="6" aria-hidden>
                    <line
                      x1="1"
                      x2="21"
                      y1="3"
                      y2="3"
                      stroke="var(--an-warm)"
                      strokeWidth="2.2"
                      strokeDasharray="5 4"
                    />
                  </svg>
                  {pick("prognoză", "forecast")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i
                    className="inline-block h-2.5 w-3.5 rounded-[2px]"
                    style={{ background: "var(--an-wet)" }}
                  />
                  {pick("precipitații", "precipitation")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="inline-block h-2.5 w-3.5 rounded-[2px] bg-[var(--chart-axis)] opacity-25" />
                  {pick("noapte", "night")}
                </span>
              </div>
              {/* On phones the chart keeps a readable size and scrolls sideways, starting a little before now. */}
              <div ref={scroller} className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <div className="min-w-[720px]">
                  <Meteogram
                    samples={samples}
                    now={now}
                    lat={p.lat}
                    lon={p.lon}
                    station={station?.name ?? null}
                  />
                </div>
              </div>
              <p className="mt-1 text-[13px] text-subtle">
                {pick(
                  "Săgețile arată încotro bate vântul, cifrele viteza lui în km/h. Precipitațiile prognozate sunt pe intervale de 1, 3 sau 6 ore, ca în model; barele arată intensitatea medie pe interval.",
                  "Arrows show where the wind blows to, numbers its speed in km/h. Forecast precipitation comes in steps of 1, 3 or 6 hours, as in the model; bars show the mean rate over the step.",
                )}
              </p>
            </>
          ) : (
            <p className="text-subtle">
              {pick(
                "Nu am putut încărca acum observațiile și prognoza. Încercați din nou peste câteva minute.",
                "Observations and forecast could not be loaded now. Please try again in a few minutes.",
              )}
            </p>
          )}
          {!fc && samples.length > 1 ? (
            <p className="mt-2 text-[13px] text-subtle">
              {pick(
                "Prognoza nu este disponibilă acum; graficul arată doar observațiile.",
                "The forecast is not available now; the chart shows observations only.",
              )}
            </p>
          ) : null}
        </>
      ) : null}
      <p className="mt-3 text-[13px] text-subtle">
        {pick(
          "Surse: Administrația Națională de Meteorologie, licență CC BY 4.0: observații orare prin EUMETNET MeteoGate, ",
          "Sources: Romanian National Meteorological Administration (ANM), CC BY 4.0 licence: hourly observations through EUMETNET MeteoGate, ",
        )}
        <a
          href={ALARO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {pick("modelul ALARO-4", "the ALARO-4 model")}
        </a>
        {", "}
        <a
          href={WARNINGS_PAGE}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {pick("avertizările meteorologice", "weather warnings")}
        </a>
        {pick(". Ora României.", ". Romanian time.")}
      </p>
    </div>
  );
}
