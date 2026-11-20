// Point forecast from ALARO-4, the 4 km model of the Romanian National Meteorological Administration (ANM),
// read straight from the GRIB1 files of its open data portal (CC BY 4.0). Each run has 28 files (+6 h to +66 h)
// of 22 MB; for one point only a few hundred bytes of each needed field are read with HTTP Range requests: the
// header of the field, then the two grid rows around the point. The four surrounding grid points are
// interpolated bilinearly.
//
// The portal does not allow browsers to read these files (no CORS), so this runs on the server: the Netlify
// function netlify/functions/meteo.mts of the mirror repositories. It has no dependencies and no path aliases,
// so the function bundler can import it.

const PORTAL = "https://opendata.geo.meteoromania.ro";
const DIR = `${PORTAL}/nwp/alaro4/`;
const TABLE = `${PORTAL}/defs/alaro4/table_247.json`;
export const ALARO_SOURCE = `${PORTAL}/catalog/ro.anm.nwp.alaro4/`;

/** Fields read for every forecast step: GRIB1 parameter, level type and level (table 247 of ANM). */
const FIELDS = {
  temp: [11, 105, 2], // temperature at 2 m, K
  u: [33, 105, 10], // wind at 10 m, m/s
  v: [34, 105, 10],
  rain: [61, 1, 0], // total precipitation accumulated since the start of the run, mm
  cloud: [71, 1, 0], // total cloud cover
} as const;
type Field = keyof typeof FIELDS;
const OROGRAPHY: readonly [number, number, number] = [6, 1, 0]; // surface geopotential, m²/s²

export interface ForecastStep {
  /** End of the step, ISO time in UTC. */
  time: string;
  /** Length of the step in hours; precipitation is the amount over it. */
  hours: number;
  temp: number;
  rain: number;
  wind: number;
  /** Direction the wind comes from, degrees. */
  dir: number;
  cloud: number;
}
export interface PointForecast {
  model: "ALARO-4";
  /** Start of the model run, ISO time in UTC. */
  run: string;
  lat: number;
  lon: number;
  /** Elevation of the model terrain at the point, m; the 4 km grid smooths valleys and summits. */
  modelElev: number;
  steps: ForecastStep[];
}

interface IndexMessage {
  offset: number;
  length: number;
  indicatorOfParameter: number;
  levelType: number;
  level: number;
}
interface Table {
  forecastStepsHours: number[];
  gribMessagesIndex: IndexMessage[];
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

async function range(f: Fetcher, url: string, from: number, to: number): Promise<Uint8Array> {
  const r = await f(url, { headers: { Range: `bytes=${from}-${to}` } });
  // A server that ignores Range would send the whole 22 MB file.
  if (r.status !== 206) throw new Error(`ALARO-4: ${url} answered ${r.status} to a range request`);
  return new Uint8Array(await r.arrayBuffer());
}

interface Header {
  param: number;
  levelType: number;
  level: number;
  run: Date;
  /** End of the forecast step, hours after the run. */
  lead: number;
  nx: number;
  ny: number;
  la1: number;
  lo1: number;
  di: number;
  dj: number;
  scan: number;
  /** Offset of the packed values from the start of the message. */
  data: number;
  e: number;
  r: number;
  d: number;
  bits: number;
}

/** Reads the section headers of a GRIB edition 1 message (simple packing on a regular lat/lon grid). */
function header(b: Uint8Array): Header {
  const u16 = (o: number) => (b[o] << 8) | b[o + 1];
  const u24 = (o: number) => (b[o] << 16) | (b[o + 1] << 8) | b[o + 2];
  const s16 = (o: number) => (b[o] & 0x80 ? -(u16(o) & 0x7fff) : u16(o));
  const s24 = (o: number) => (b[o] & 0x80 ? -(u24(o) & 0x7fffff) : u24(o));
  const ibm = (o: number) =>
    (b[o] & 0x80 ? -1 : 1) * u24(o + 1) * 2 ** (4 * ((b[o] & 0x7f) - 64) - 24);
  if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== "GRIB" || b[7] !== 1)
    throw new Error("ALARO-4: not a GRIB1 message");
  const p = 8;
  const flags = b[p + 7];
  if (!(flags & 0x80) || flags & 0x40)
    throw new Error("ALARO-4: expected a grid section and no bitmap");
  if (b[p + 17] !== 1) throw new Error("ALARO-4: forecast time is not in hours");
  const tri = b[p + 20];
  const g = p + u24(p);
  if (b[g + 5] !== 0) throw new Error("ALARO-4: not a regular lat/lon grid");
  const s = g + u24(g);
  if (b[s + 3] & 0xc0) throw new Error("ALARO-4: not simple grid-point packing");
  return {
    param: b[p + 8],
    levelType: b[p + 9],
    level: u16(p + 10),
    run: new Date(
      Date.UTC((b[p + 24] - 1) * 100 + b[p + 12], b[p + 13] - 1, b[p + 14], b[p + 15], b[p + 16]),
    ),
    lead: tri === 4 ? b[p + 19] : b[p + 18],
    nx: u16(g + 6),
    ny: u16(g + 8),
    la1: s24(g + 10) / 1000,
    lo1: s24(g + 13) / 1000,
    di: u16(g + 23) / 1000,
    dj: u16(g + 25) / 1000,
    scan: b[g + 27],
    data: s + 11,
    e: s16(s + 4),
    r: ibm(s + 6),
    d: s16(p + 26),
    bits: b[s + 10],
  };
}

/** Grid cell of a point and the bilinear weights of its four corners. */
function corners(h: Header, lat: number, lon: number) {
  if (h.scan & 0x20) throw new Error("ALARO-4: unexpected scanning mode");
  const fi = ((lon - h.lo1) / h.di) * (h.scan & 0x80 ? -1 : 1);
  const fj = ((lat - h.la1) / h.dj) * (h.scan & 0x40 ? 1 : -1);
  const i = Math.floor(fi),
    j = Math.floor(fj);
  if (i < 0 || j < 0 || i + 1 >= h.nx || j + 1 >= h.ny)
    throw new Error("ALARO-4: point outside the model grid");
  const wx = fi - i,
    wy = fj - j;
  return {
    first: j * h.nx + i,
    last: (j + 1) * h.nx + i + 1,
    points: [
      [j * h.nx + i, (1 - wx) * (1 - wy)],
      [j * h.nx + i + 1, wx * (1 - wy)],
      [(j + 1) * h.nx + i, (1 - wx) * wy],
      [(j + 1) * h.nx + i + 1, wx * wy],
    ] as [number, number][],
  };
}

/** Byte range of the packed values, from the start of the message, that holds the points first..last. */
const dataRange = (h: Pick<Header, "data" | "bits">, first: number, last: number) =>
  [
    h.data + Math.floor((first * h.bits) / 8),
    h.data + Math.floor(((last + 1) * h.bits - 1) / 8),
  ] as const;

function unpack(h: Header, bytes: Uint8Array, from: number, index: number): number {
  let bit = (h.data + 0) * 8 + index * h.bits - from * 8,
    x = 0;
  for (let k = 0; k < h.bits; k++, bit++) x = x * 2 + ((bytes[bit >> 3] >> (7 - (bit & 7))) & 1);
  return (h.r + x * 2 ** h.e) / 10 ** h.d;
}

async function pool<T>(jobs: (() => Promise<T>)[], size: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const k = next++;
      out[k] = await jobs[k]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, jobs.length) }, worker));
  return out;
}

let tableCache: { at: number; table: Table } | null = null;
let runCache: { at: number; run: string } | null = null;

async function table(f: Fetcher): Promise<Table> {
  if (tableCache && Date.now() - tableCache.at < 6 * 3600_000) return tableCache.table;
  const r = await f(TABLE);
  if (!r.ok) throw new Error(`ALARO-4: parameter table answered ${r.status}`);
  tableCache = { at: Date.now(), table: (await r.json()) as Table };
  return tableCache.table;
}

/** The newest run whose files are all published (the directory lists every step of a complete run). */
async function latestRun(f: Fetcher, steps: number[]): Promise<string> {
  if (runCache && Date.now() - runCache.at < 5 * 60_000) return runCache.run;
  const r = await f(DIR);
  if (!r.ok) throw new Error(`ALARO-4: directory answered ${r.status}`);
  const seen = new Map<string, Set<number>>();
  for (const m of (await r.text()).matchAll(/alaro4_grib_(\d{10})_(\d{2})\b/g)) {
    if (!seen.has(m[1])) seen.set(m[1], new Set());
    seen.get(m[1])!.add(Number(m[2]));
  }
  const runs = [...seen].filter(([, s]) => steps.every((h) => s.has(h))).map(([run]) => run);
  if (!runs.length) throw new Error("ALARO-4: no complete run in the directory");
  runCache = { at: Date.now(), run: runs.sort().at(-1)! };
  return runCache.run;
}

const round = (v: number, digits = 1) => Math.round(v * 10 ** digits) / 10 ** digits;

/** Forecast for one point from the newest complete ALARO-4 run. */
export async function pointForecast(
  lat: number,
  lon: number,
  f: Fetcher = fetch,
): Promise<PointForecast> {
  const t = await table(f);
  const steps = t.forecastStepsHours;
  const run = await latestRun(f, steps);
  const find = ([param, levelType, level]: readonly [number, number, number]) => {
    const m = t.gribMessagesIndex.find(
      (x) => x.indicatorOfParameter === param && x.levelType === levelType && x.level === level,
    );
    if (!m) throw new Error(`ALARO-4: parameter ${param} is not in the files`);
    return m;
  };
  const file = (h: number) => `${DIR}alaro4_grib_${run}_${String(h).padStart(2, "0")}`;

  // The header of one field gives the grid and the length of the sections, the same in every field of the run.
  const probe = find(FIELDS.temp);
  const first = header(await range(f, file(steps[0]), probe.offset, probe.offset + 127));
  const cell = corners(first, lat, lon);

  /** Value of one field at the point; the header and the values are read at the same time. */
  const read = async (url: string, m: IndexMessage, lead: number) => {
    const guess = dataRange(
      { data: first.data, bits: m.length > 0 ? bitsOf(m) : first.bits },
      cell.first,
      cell.last,
    );
    const [head, body] = await Promise.all([
      range(f, url, m.offset, m.offset + 127),
      range(f, url, m.offset + guess[0], m.offset + guess[1]),
    ]);
    const h = header(head);
    if (
      h.param !== m.indicatorOfParameter ||
      h.level !== m.level ||
      h.lead !== lead ||
      h.nx !== first.nx
    )
      throw new Error(
        `ALARO-4: expected parameter ${m.indicatorOfParameter} at +${lead} h in ${url}, found ${h.param} at +${h.lead} h`,
      );
    const need = dataRange(h, cell.first, cell.last);
    const bytes =
      need[0] === guess[0] && need[1] === guess[1]
        ? body
        : await range(f, url, m.offset + need[0], m.offset + need[1]);
    return cell.points.reduce((s, [index, w]) => s + w * unpack(h, bytes, need[0], index), 0);
  };
  // Bits per value of a field follow from the length of its message: header sections plus packed values.
  const bitsOf = (m: IndexMessage) =>
    Math.round(((m.length - first.data - 4) * 8) / (first.nx * first.ny));

  const names = Object.keys(FIELDS) as Field[];
  const jobs = steps.flatMap((h) =>
    names.map((name) => () => read(file(h), find(FIELDS[name]), h)),
  );
  jobs.push(() => read(file(steps[0]), find(OROGRAPHY), steps[0]));
  const values = await pool(jobs, 24);
  const orography = values.pop()!;

  const t0 = first.run.getTime();
  let before = 0;
  const out: ForecastStep[] = steps.map((h, k) => {
    const [temp, u, v, rain, cloud] = values.slice(k * names.length, (k + 1) * names.length);
    const step = {
      time: new Date(t0 + h * 3600_000).toISOString(),
      hours: h - (k ? steps[k - 1] : 0),
      temp: round(temp - 273.15),
      rain: round(Math.max(rain - before, 0)),
      wind: round(Math.hypot(u, v)),
      dir: Math.round((Math.atan2(-u, -v) * 180) / Math.PI + 360) % 360,
      cloud: Math.round(Math.min(Math.max(cloud, 0), 100)),
    };
    before = rain;
    return step;
  });
  return {
    model: "ALARO-4",
    run: first.run.toISOString(),
    lat,
    lon,
    modelElev: Math.round(orography / 9.80665),
    steps: out,
  };
}
