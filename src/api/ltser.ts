// Client for the LTSER data service (docs/API_CONTRACT.md). Views always talk to this module;
// it routes to the HTTP service or to the demo implementation.
import { CONFIG } from "@/lib/config";
import type { MeteoGroup, Resolution } from "@/lib/catalog";
import { buildUrl, getJSON, createCache } from "./http";
import { resolveBackend } from "./status";
import type { DateValue, Grid, IdValue, MeteoRow, RsGridBody, RsIndicatorDates, RsPoint, SocialParams, TimeRange, TimeValue, UatValue, YearValue } from "./types";

interface Impl {
  rsIndicators(): Promise<RsIndicatorDates[]>;
  rsGrid(indicator: string, date: string): Promise<RsGridBody>;
  rsPoint(indicator: string, lon: number, lat: number): Promise<RsPoint>;
  adminValues(unit: string, indicator: string, date: string): Promise<IdValue[]>;
  adminSeries(unit: string, indicator: string, id: string): Promise<DateValue[]>;
  meteoRange(resolution: Resolution, variable: string): Promise<TimeRange>;
  meteoSnapshot(resolution: Resolution, variable: string, time: string): Promise<IdValue[]>;
  meteoSeries(resolution: Resolution, station: string, groups: MeteoGroup[], since: string, until: string): Promise<MeteoRow[]>;
  ecRange(variable: string): Promise<TimeRange>;
  ecSnapshot(variable: string, time: string): Promise<IdValue[]>;
  ecSeries(station: string, variable: string, since: string, until: string): Promise<TimeValue[]>;
  socialValues(indicator: string, params: SocialParams): Promise<UatValue[]>;
  socialSeries(indicator: string, params: SocialParams, years: number[]): Promise<YearValue[]>;
}

const get = <T,>(path: string, params?: Record<string, string | number | undefined>) => getJSON<T>(buildUrl(CONFIG.ltser.baseUrl, path, params));

const live: Impl = {
  rsIndicators: () => get("/remote-sensing/indicators"),
  rsGrid: (indicator, date) => get(`/remote-sensing/${indicator}/grid`, { date }),
  rsPoint: (indicator, lon, lat) => get(`/remote-sensing/${indicator}/point`, { lon, lat }),
  adminValues: (unit, indicator, date) => get(`/admin/${unit}/${indicator}`, { date }),
  adminSeries: (unit, indicator, id) => get(`/admin/${unit}/${indicator}/series`, { id }),
  meteoRange: (resolution, variable) => get(`/meteo/${resolution}/range`, { variable }),
  meteoSnapshot: (resolution, variable, time) => get(`/meteo/${resolution}/snapshot`, { variable, time }),
  meteoSeries: (resolution, station, groups, since, until) => get(`/meteo/${resolution}/series`, { station, groups: groups.join(","), since, until }),
  ecRange: (variable) => get("/eddy-covariance/halfhourly/range", { variable }),
  ecSnapshot: (variable, time) => get("/eddy-covariance/halfhourly/snapshot", { variable, time }),
  ecSeries: (station, variable, since, until) => get("/eddy-covariance/halfhourly/series", { station, variable, since, until }),
  socialValues: (indicator, { year, sex, age }) => get(`/social/${indicator}`, { year, sex, age }),
  socialSeries: (indicator, { uat, sex, age }) => get(`/social/${indicator}/series`, { uat, sex, age }),
};

let mock: Impl | null = null;
async function impl() {
  const mode = await resolveBackend("ltser");
  if (mode === "live") return { api: live, mode };
  mock ??= (await import("./mock/ltser-mock")).ltserMock;
  return { api: mock, mode };
}

const cache = createCache(10 * 60 * 1000, 240);

// Meteo times are UTC (`...Z`, or YYYY-MM-DD for daily data); eddy covariance times are naive
// EET wall clock, like the `time_eet` column of the source data.
const toWall = (s: string) => (s.length === 10 ? `${s}T00:00` : s.replace("Z", "").slice(0, 16));
const meteoParam = (wall: string, resolution: Resolution) => (resolution === "daily" ? wall.slice(0, 10) : `${wall}:00Z`);
const ecParam = (wall: string) => `${wall}:00`;

function decodeGrid(body: RsGridBody): Grid {
  const n = body.width * body.height;
  let values: Float32Array;
  if (body.values_b64) {
    const bin = atob(body.values_b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    values = new Float32Array(bytes.buffer);
  } else {
    values = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = body.values?.[i];
      values[i] = v === null || v === undefined ? Number.NaN : v;
    }
  }
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return {
    indicator: body.indicator, date: body.date,
    west: body.west, south: body.south, east: body.east, north: body.north, width: body.width, height: body.height,
    dx: (body.east - body.west) / body.width, dy: (body.north - body.south) / body.height,
    values, domain: Number.isFinite(min) ? [min, max] : null,
  };
}

export function gridValueAt(grid: Grid, lon: number, lat: number) {
  const j = Math.floor((lon - grid.west) / grid.dx);
  const i = Math.floor((grid.north - lat) / grid.dy);
  if (i < 0 || j < 0 || i >= grid.height || j >= grid.width) return null;
  const v = grid.values[i * grid.width + j];
  return Number.isNaN(v) ? null : { value: v, lon: grid.west + (j + 0.5) * grid.dx, lat: grid.north - (i + 0.5) * grid.dy };
}

export const ltser = {
  mode: async () => (await impl()).mode,
  rsIndicators: async () => cache("rs:ind", async () => (await impl()).api.rsIndicators()),
  rsGrid: async (indicator: string, date: string) => cache(`rs:grid:${indicator}:${date}`, async () => decodeGrid(await (await impl()).api.rsGrid(indicator, date))),
  rsPoint: async (indicator: string, lon: number, lat: number) => cache(`rs:pt:${indicator}:${lon.toFixed(4)}:${lat.toFixed(4)}`, async () => (await impl()).api.rsPoint(indicator, lon, lat)),
  adminValues: async (unit: string, indicator: string, date: string) => cache(`ad:v:${unit}:${indicator}:${date}`, async () => (await impl()).api.adminValues(unit, indicator, date)),
  adminSeries: async (unit: string, indicator: string, id: string) => cache(`ad:s:${unit}:${indicator}:${id}`, async () => (await impl()).api.adminSeries(unit, indicator, id)),
  meteoRange: async (resolution: Resolution, variable: string) =>
    cache(`me:r:${resolution}:${variable}`, async () => {
      const r = await (await impl()).api.meteoRange(resolution, variable);
      return { min: toWall(r.min), max: toWall(r.max), latest: toWall(r.latest || r.max) };
    }),
  meteoSnapshot: async (resolution: Resolution, variable: string, wall: string) =>
    cache(`me:s:${resolution}:${variable}:${wall}`, async () => (await impl()).api.meteoSnapshot(resolution, variable, meteoParam(wall, resolution))),
  meteoSeries: async (resolution: Resolution, station: string, groups: MeteoGroup[], sinceWall: string, untilWall: string) =>
    cache(`me:t:${resolution}:${station}:${groups}:${sinceWall}:${untilWall}`, async () => {
      const rows = await (await impl()).api.meteoSeries(resolution, station, groups, meteoParam(sinceWall, resolution), meteoParam(untilWall, resolution));
      return rows.map((r) => ({ ...r, time: toWall(r.time) }));
    }),
  ecRange: async (variable: string) =>
    cache(`ec:r:${variable}`, async () => {
      const r = await (await impl()).api.ecRange(variable);
      return { min: toWall(r.min), max: toWall(r.max), latest: toWall(r.latest || r.max) };
    }),
  ecSnapshot: async (variable: string, wall: string) => cache(`ec:s:${variable}:${wall}`, async () => (await impl()).api.ecSnapshot(variable, ecParam(wall))),
  ecSeries: async (station: string, variable: string, sinceWall: string, untilWall: string) =>
    cache(`ec:t:${station}:${variable}:${sinceWall}:${untilWall}`, async () => {
      const rows = await (await impl()).api.ecSeries(station, variable, ecParam(sinceWall), ecParam(untilWall));
      return rows.map((r) => ({ ...r, time: toWall(r.time) }));
    }),
  socialValues: async (indicator: string, params: SocialParams) =>
    cache(`so:v:${indicator}:${params.year}:${params.sex}:${params.age}`, async () => (await impl()).api.socialValues(indicator, params)),
  socialSeries: async (indicator: string, params: SocialParams, years: number[]) =>
    cache(`so:s:${indicator}:${params.uat}:${params.sex}:${params.age}`, async () => (await impl()).api.socialSeries(indicator, params, years)),

  /** Mirrors ltser www/data/img/ec/{id}/{YYYY/MM/DD}/{id}_{YYYY-MM-DD-HHMM}.jpg */
  cameraUrl: async (station: string, wall: string) => {
    if ((await impl()).mode !== "live") return null;
    const [d, tm] = wall.split("T");
    const [y, m, day] = d.split("-");
    return `${CONFIG.mediaBaseUrl}/ec/${station}/${y}/${m}/${day}/${station}_${d}-${tm.replace(":", "")}.jpg`;
  },
  /** Mirrors ltser www/data/img/meta/{network}/{Name}.png */
  photoUrl: async (network: string, name: string) => {
    if ((await impl()).mode !== "live") return null;
    return `${CONFIG.mediaBaseUrl}/meta/${network}/${encodeURIComponent(name)}.png`;
  },
};
