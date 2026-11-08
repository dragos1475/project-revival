// Demo implementation of docs/API_CONTRACT.md. Returns the exact JSON shapes the real service
// must return, computed from deterministic synthetic fields over the real LTSER geometries.
import { hash, rand01, fbm1, fbm2, clamp, round, weatherAt, type Site } from "./fields";
import { loadLtserAreas, loadUats, loadNetworks, featureContains, type AreaFeature } from "@/lib/geo";
import { LTSER_BY_NAME, METEO_PARAMS, meteoId, type MeteoGroup, type Resolution } from "@/lib/catalog";
import { bucharestOffset, wallToMs, msToWall } from "@/lib/format";
import type { DateValue, IdValue, MeteoRow, RsGridBody, RsIndicatorDates, RsPoint, SocialParams, TimeRange, TimeValue, UatValue, YearValue } from "../types";

const DAY = 86400000;
const HOUR = 3600000;
const delay = (ms = 140 + Math.random() * 160) => new Promise((r) => setTimeout(r, ms));

// Remote sensing ---------------------------------------------------------------------------
const GRID = { west: 22.35, north: 47.77, dx: 0.015, dy: 0.015, width: 500, height: 258 };
const EAST = +(GRID.west + GRID.width * GRID.dx).toFixed(6);
const SOUTH = +(GRID.north - GRID.height * GRID.dy).toFixed(6);

function monthList(fromY: number, fromM: number, toY: number, toM: number) {
  const out: string[] = [];
  for (let y = fromY, m = fromM; y < toY || (y === toY && m <= toM); m === 12 ? (y++, (m = 1)) : m++) out.push(`${y}-${String(m).padStart(2, "0")}-01`);
  return out;
}

const RS_DATES: Record<string, string[]> = {
  ssm: monthList(2015, 4, 2024, 3),
  ndvi: monthList(2014, 1, 2024, 12),
  fapar: monthList(2014, 1, 2024, 12),
};

let maskPromise: Promise<{ mask: Int8Array; cellsByArea: Map<number, number[]> }> | null = null;
function getMask() {
  maskPromise ??= loadLtserAreas().then((fc) => {
    const mask = new Int8Array(GRID.width * GRID.height);
    const cellsByArea = new Map<number, number[]>();
    for (const f of fc.features) {
      const id = Number(f.properties.natcode);
      const [w, s, e, n] = f.bbox;
      const j0 = Math.max(0, Math.floor((w - GRID.west) / GRID.dx));
      const j1 = Math.min(GRID.width - 1, Math.ceil((e - GRID.west) / GRID.dx));
      const i0 = Math.max(0, Math.floor((GRID.north - n) / GRID.dy));
      const i1 = Math.min(GRID.height - 1, Math.ceil((GRID.north - s) / GRID.dy));
      const cells: number[] = [];
      for (let i = i0; i <= i1; i++) {
        const lat = GRID.north - (i + 0.5) * GRID.dy;
        for (let j = j0; j <= j1; j++) {
          if (featureContains(f, GRID.west + (j + 0.5) * GRID.dx, lat)) {
            mask[i * GRID.width + j] = id;
            cells.push(i * GRID.width + j);
          }
        }
      }
      cellsByArea.set(id, cells);
    }
    return { mask, cellsByArea };
  });
  return maskPromise;
}

const monthIndex = (iso: string) => (Number(iso.slice(0, 4)) - 2000) * 12 + Number(iso.slice(5, 7)) - 1;

function rsValue(ind: string, lon: number, lat: number, mi: number, area: number) {
  const m = ((mi % 12) + 12) % 12;
  const mountain = area === 4 || area === 5 || area === 6;
  const wet = area === 1 || area === 2;
  const tex = fbm2(hash("tex", ind) & 0xffff, lon / 0.32, lat / 0.32, 3);
  const fine = fbm2(hash("fine", ind) & 0xffff, lon / 0.06, lat / 0.06, 2);
  const inter = fbm1(hash("yr", ind) & 0xffff, mi / 7, 2);
  const water = wet && fbm2(977, lon / 0.07, lat / 0.07, 2) > 0.36;
  const winter = m <= 2 || m >= 10;
  if (ind === "ssm") {
    if (water) return clamp(86 + 7 * fine, 0, 100);
    return clamp(52 + 19 * Math.cos((2 * Math.PI * (m - 2.2)) / 12) + 12 * tex + 5 * fine + 9 * inter + (wet ? 13 : 0) + (mountain ? 9 : 0), 2, 100);
  }
  const peak = Math.cos((2 * Math.PI * (m - 5.6 - (mountain ? 0.9 : 0))) / 12);
  if (ind === "ndvi") {
    if (water) return clamp(-0.12 + 0.07 * fine, -0.35, 0.93);
    return clamp(0.44 + 0.31 * peak + 0.09 * tex + 0.04 * fine + 0.05 * inter - (mountain && winter ? 0.2 : 0), -0.35, 0.93);
  }
  if (water) return clamp(0.02 + 0.02 * Math.abs(fine), 0, 0.94);
  return clamp(0.38 + 0.29 * peak + 0.08 * tex + 0.035 * fine + 0.04 * inter - (mountain && winter ? 0.15 : 0), 0, 0.94);
}

const rsDigits = (ind: string) => (ind === "ssm" ? 1 : 3);
const areaFromUat = (props: AreaFeature["properties"]) => LTSER_BY_NAME[String(props.ltser)] ?? 0;

function unitValue(ind: string, feature: AreaFeature, mi: number, area: number) {
  const [cx, cy] = feature.centroid;
  const pts = [[0, 0], [0.03, 0.02], [-0.03, -0.02], [0.02, -0.03], [-0.02, 0.03]];
  return round(pts.reduce((acc, [dx, dy]) => acc + rsValue(ind, cx + dx, cy + dy, mi, area), 0) / pts.length, rsDigits(ind));
}

// Stations ---------------------------------------------------------------------------------
const ELEV: Record<string, number> = {
  "BR-Mar": 5, "TL-Sar": 30, "BR-Bra": 20, "TL-Mal": 10, "CL-Scm": 30, "AG-Mih": 520, "PH-Ber": 140, "IF-Cor": 90, "AG-Dmb": 780, "TR-Drv": 90,
  "MH-Ors": 80, "DB-Mor": 640, "GR-Bul": 110, "IF-Ste": 70, "HD-Uri": 1580, "HD-San": 340, "BH-Pad": 1270, "TL-Sfg": 2, "BV-Brv": 560, "GR-Com": 60,
};
interface StationSite extends Site {
  since: number;
  wetland?: boolean;
}

let sitesPromise: Promise<{ ws: StationSite[]; ec: StationSite[] }> | null = null;
function getSites() {
  sitesPromise ??= loadNetworks().then((nets) => {
    const ecSince: Record<string, string> = { enisala: "2024-03-15", imb: "2024-04-02", com: "2024-05-10", poli: "2024-06-01", bv: "2024-09-01" };
    return {
      ws: nets.ws.features.map((f) => ({
        id: f.properties.dataId, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
        elev: ELEV[f.properties.dataId] ?? 100, seed: hash(f.properties.dataId) & 0xffff,
        since: wallToMs(f.properties.commissioned ?? "2023-08-22"),
      })),
      ec: nets.ec.features.map((f) => {
        const wetland = ["enisala", "com"].includes(f.properties.dataId);
        return {
          id: f.properties.dataId, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
          elev: f.properties.elevation || 5, seed: hash(f.properties.dataId) & 0xffff,
          since: wallToMs(ecSince[f.properties.dataId] ?? "2024-04-01"), wetland, wet: wetland ? 0.12 : 0,
        };
      }),
    };
  });
  return sitesPromise;
}

function todayUtc() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const isAvailable = (s: StationSite, ms: number) => ms >= s.since && rand01("outage", s.id, Math.floor(ms / DAY)) > 0.03;

type Agg = Record<string, number>;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

function hourlyAggregate(s: StationSite, start: number): Agg {
  const samples = [0, 15, 30, 45, 59].map((m) => weatherAt(s, start + m * 60000));
  const pick = (k: keyof (typeof samples)[number]) => samples.map((x) => x[k]);
  const temps = pick("temp");
  const gust = 1.25 + 0.35 * rand01("gust", s.id, start);
  return {
    tmin: round(Math.min(...temps) - 0.15, 1), tmean: round(mean(temps), 1), tmax: round(Math.max(...temps) + 0.15, 1),
    psmin: round(Math.min(...pick("pressure")) - 0.1, 1), psmean: round(mean(pick("pressure")), 1), psmax: round(Math.max(...pick("pressure")) + 0.1, 1),
    hurmin: round(Math.min(...pick("humidity")), 1), hurmean: round(mean(pick("humidity")), 1), hurmax: round(Math.max(...pick("humidity")), 1),
    wsmax: round(Math.max(...pick("wind")) * gust, 1), wsavg: round(mean(pick("wind")), 1),
    irrmean: round(mean(pick("irradiance")), 1), tsmean: round(mean(pick("soilTemp")), 1), shmean: round(mean(pick("soilHum")), 3),
    trsum: round(samples[2].rain, 1),
  };
}

function dailyAggregate(s: StationSite, day: number): Agg {
  const hours = Array.from({ length: 24 }, (_, i) => hourlyAggregate(s, day + i * HOUR));
  const col = (k: string) => hours.map((x) => x[k]);
  return {
    tmin: round(Math.min(...col("tmin")), 1), tmean: round(mean(col("tmean")), 1), tmax: round(Math.max(...col("tmax")), 1),
    psmin: round(Math.min(...col("psmin")), 1), psmean: round(mean(col("psmean")), 1), psmax: round(Math.max(...col("psmax")), 1),
    hurmin: round(Math.min(...col("hurmin")), 1), hurmean: round(mean(col("hurmean")), 1), hurmax: round(Math.max(...col("hurmax")), 1),
    wsmax: round(Math.max(...col("wsmax")), 1), wsavg: round(mean(col("wsavg")), 1),
    irrmean: round(mean(col("irrmean")), 1), tsmean: round(mean(col("tsmean")), 1), shmean: round(mean(col("shmean")), 3),
    trsum: round(col("trsum").reduce((a, b) => a + b, 0), 1),
  };
}

function meteoBounds(resolution: Resolution) {
  const today = todayUtc();
  return resolution === "daily"
    ? { min: wallToMs("2023-08-23"), max: today - DAY, step: DAY }
    : { min: wallToMs("2023-08-22T01:00"), max: today - HOUR, step: HOUR };
}
const fmtMeteo = (ms: number, resolution: Resolution) => (resolution === "daily" ? msToWall(ms).slice(0, 10) : `${msToWall(ms)}:00Z`);
const parseMeteo = (s: string) => wallToMs(s.replace("Z", "").slice(0, 16));
const baseOf = (variable: string) => variable.replace(/_(01|24)h$/, "");

function ecValue(s: StationSite, variable: string, wallMs: number) {
  const utc = wallMs - bucharestOffset(wallMs);
  const w = weatherAt(s, utc);
  const doy = (utc - Date.UTC(new Date(utc).getUTCFullYear(), 0, 1)) / DAY;
  const growth = s.wetland ? Math.exp(-(((doy - 195) / 62) ** 2)) : Math.max(Math.exp(-(((doy - 165) / 42) ** 2)), 0.55 * Math.exp(-(((doy - 115) / 30) ** 2)));
  const ppfd = Math.max(0, w.irradiance * 2.05);
  const rn = 0.74 * w.irradiance - 42 - (w.sinEl <= 0 ? 18 * (1 - w.cloud) : 0);
  const n = (k: number, scale = 1) => fbm1(s.seed + k, wallMs / 1800000 / 1.7, 2) * scale;
  const pmax = s.wetland ? 3 + 19 * growth : 2 + 27 * growth;
  const gpp = (pmax * ppfd) / (ppfd + 620);
  const reco = (1.3 + 3.1 * growth) * Math.pow(2, (w.temp - 12) / 10);
  const evapFrac = s.wetland ? 0.74 : 0.33 + 0.42 * growth;
  const le = Math.max(-12, evapFrac * rn * 0.9 + n(3, 12));
  switch (variable) {
    case "co2_flux": return round(reco - gpp + n(1, 1.3), 2);
    case "LE": return round(le, 1);
    case "H": return round((1 - evapFrac) * rn * 0.9 + n(5, 14), 1);
    case "ET": return round(Math.max(-0.02, le * 0.001467), 3);
    case "RN_1_1_1": return round(rn + n(7, 6), 1);
    case "RH_1_1_1": return round(w.humidity, 1);
    case "PPFD_1_1_1": return round(Math.max(0, ppfd + n(9, 20) * (ppfd > 0 ? 1 : 0)), 1);
    default: return null;
  }
}

const ecBounds = () => ({ min: wallToMs("2024-03-15T00:00"), max: todayUtc() - 30 * 60000, step: 30 * 60000 });

// Social -------------------------------------------------------------------------------------
const AGE_WEIGHTS = (() => {
  const w: number[] = [];
  for (let a = 0; a <= 85; a++) {
    if (a < 15) w.push(0.82 + 0.004 * a);
    else if (a < 35) w.push(0.9 + 0.012 * (a - 15));
    else if (a < 58) w.push(1.14 + 0.004 * (a - 35) - 0.0002 * (a - 35) ** 2);
    else w.push(Math.max(0.12, 1.12 - 0.034 * (a - 58)));
  }
  w.push(0.95);
  const total = w.reduce((x, y) => x + y, 0);
  return w.map((x) => x / total);
})();

function popAt(props: AreaFeature["properties"], year: number) {
  const r = 0.003 + 0.012 * rand01("trend", props.natcode);
  const base = Number(props.pop2015) || 2500;
  return base * (1 + r * (2015 - year)) * (1 + 0.012 * fbm1(hash(props.natcode) & 0xffff, year / 3, 2));
}

const emigRate = (year: number) => (year < 2002 ? 0.0012 : year < 2007 ? 0.0022 : year < 2010 ? 0.0055 : year < 2017 ? 0.0032 : 0.0026);

function socialValue(indicator: string, props: AreaFeature["properties"], year: number, sex: number, age: number) {
  if (indicator === "pop309e") return Math.round(popAt(props, year) * emigRate(year) * (0.55 + 0.9 * rand01("em", props.natcode, year)));
  const female = 0.508 + 0.012 * (rand01("sex", props.natcode) - 0.5);
  const sexShare = sex === 1 ? female : sex === 2 ? 1 - female : 1;
  const ageShare = age === -1 ? 1 : AGE_WEIGHTS[age] * (0.85 + 0.3 * rand01("age", props.natcode, age));
  return Math.round(popAt(props, year) * sexShare * ageShare);
}

// Public API: same names and shapes as the HTTP client ------------------------------------
export const ltserMock = {
  async rsIndicators(): Promise<RsIndicatorDates[]> {
    await delay(60);
    return Object.entries(RS_DATES).map(([id, dates]) => ({ id, dates }));
  },

  async rsGrid(indicator: string, date: string): Promise<RsGridBody> {
    const { mask } = await getMask();
    await delay();
    const mi = monthIndex(date);
    const values: (number | null)[] = new Array(GRID.width * GRID.height).fill(null);
    for (let i = 0; i < GRID.height; i++) {
      const lat = GRID.north - (i + 0.5) * GRID.dy;
      for (let j = 0; j < GRID.width; j++) {
        const k = i * GRID.width + j;
        if (mask[k]) values[k] = round(rsValue(indicator, GRID.west + (j + 0.5) * GRID.dx, lat, mi, mask[k]), rsDigits(indicator));
      }
    }
    return { indicator, date, west: GRID.west, south: SOUTH, east: EAST, north: GRID.north, width: GRID.width, height: GRID.height, values };
  },

  async rsPoint(indicator: string, lon: number, lat: number): Promise<RsPoint> {
    const { mask } = await getMask();
    await delay();
    const i = Math.floor((GRID.north - lat) / GRID.dy);
    const j = Math.floor((lon - GRID.west) / GRID.dx);
    const inside = i >= 0 && j >= 0 && i < GRID.height && j < GRID.width;
    const area = inside ? mask[i * GRID.width + j] : 0;
    const clon = GRID.west + (Math.min(Math.max(j, 0), GRID.width - 1) + 0.5) * GRID.dx;
    const clat = GRID.north - (Math.min(Math.max(i, 0), GRID.height - 1) + 0.5) * GRID.dy;
    return {
      indicator, lon: +clon.toFixed(5), lat: +clat.toFixed(5),
      series: RS_DATES[indicator].map((date) => ({ date, value: area ? round(rsValue(indicator, clon, clat, monthIndex(date), area), rsDigits(indicator)) : null })),
    };
  },

  async adminValues(unit: string, indicator: string, date: string): Promise<IdValue[]> {
    await delay();
    const mi = monthIndex(date);
    if (unit === "ltser") {
      const { cellsByArea } = await getMask();
      return [...cellsByArea.entries()].map(([id, cells]) => {
        let sum = 0;
        for (const k of cells) {
          const i = Math.floor(k / GRID.width), j = k % GRID.width;
          sum += rsValue(indicator, GRID.west + (j + 0.5) * GRID.dx, GRID.north - (i + 0.5) * GRID.dy, mi, id);
        }
        return { id: String(id), value: cells.length ? round(sum / cells.length, rsDigits(indicator)) : null };
      });
    }
    const uats = await loadUats();
    return uats.features.map((f) => ({ id: f.properties.natcode, value: unitValue(indicator, f, mi, areaFromUat(f.properties)) }));
  },

  async adminSeries(unit: string, indicator: string, id: string): Promise<DateValue[]> {
    await delay();
    const fc = unit === "ltser" ? await loadLtserAreas() : await loadUats();
    const f = fc.features.find((x) => x.properties.natcode === String(id));
    if (!f) return [];
    const area = unit === "ltser" ? Number(id) : areaFromUat(f.properties);
    return RS_DATES[indicator].map((date) => ({ date, value: unitValue(indicator, f, monthIndex(date), area) }));
  },

  async meteoRange(resolution: Resolution): Promise<TimeRange> {
    await delay(80);
    const { ws } = await getSites();
    const b = meteoBounds(resolution);
    let latest = b.max;
    for (let k = 0; k < 96; k++) {
      const ms = b.max - k * b.step;
      if (ws.filter((s) => isAvailable(s, ms)).length >= 2) {
        latest = ms;
        break;
      }
    }
    return { min: fmtMeteo(b.min, resolution), max: fmtMeteo(b.max, resolution), latest: fmtMeteo(latest, resolution) };
  },

  async meteoSnapshot(resolution: Resolution, variable: string, time: string): Promise<IdValue[]> {
    const { ws } = await getSites();
    await delay();
    const ms = parseMeteo(time);
    const b = meteoBounds(resolution);
    if (ms < b.min || ms > b.max) return [];
    const base = baseOf(variable);
    return ws.filter((s) => isAvailable(s, ms)).map((s) => ({ id: s.id, value: (resolution === "daily" ? dailyAggregate(s, ms) : hourlyAggregate(s, ms))[base] }));
  },

  async meteoSeries(resolution: Resolution, station: string, groups: MeteoGroup[], since: string, until: string): Promise<MeteoRow[]> {
    const { ws } = await getSites();
    await delay();
    const s = ws.find((x) => x.id === station);
    if (!s) return [];
    const b = meteoBounds(resolution);
    const vars = METEO_PARAMS.filter((p) => groups.includes(p.group));
    const rows: MeteoRow[] = [];
    for (let ms = Math.max(parseMeteo(since), b.min); ms <= Math.min(parseMeteo(until), b.max); ms += b.step) {
      if (!isAvailable(s, ms)) continue;
      const agg = resolution === "daily" ? dailyAggregate(s, ms) : hourlyAggregate(s, ms);
      for (const p of vars) rows.push({ time: fmtMeteo(ms, resolution), variable: meteoId(p.base, resolution), value: agg[p.base] });
    }
    return rows;
  },

  async ecRange(): Promise<TimeRange> {
    await delay(80);
    const { ec } = await getSites();
    const b = ecBounds();
    let latest = b.max;
    for (let k = 0; k < 400; k++) {
      const ms = b.max - k * b.step;
      if (ec.filter((s) => isAvailable(s, ms)).length >= 2) {
        latest = ms;
        break;
      }
    }
    return { min: `${msToWall(b.min)}:00`, max: `${msToWall(b.max)}:00`, latest: `${msToWall(latest)}:00` };
  },

  async ecSnapshot(variable: string, time: string): Promise<IdValue[]> {
    const { ec } = await getSites();
    await delay();
    const ms = wallToMs(time.slice(0, 16));
    const b = ecBounds();
    if (ms < b.min || ms > b.max) return [];
    return ec.filter((s) => isAvailable(s, ms)).map((s) => ({ id: s.id, value: ecValue(s, variable, ms) }));
  },

  async ecSeries(station: string, variable: string, since: string, until: string): Promise<TimeValue[]> {
    const { ec } = await getSites();
    await delay();
    const s = ec.find((x) => x.id === station);
    if (!s) return [];
    const b = ecBounds();
    const rows: TimeValue[] = [];
    const end = Math.min(wallToMs(until.slice(0, 16)), b.max);
    for (let ms = Math.max(wallToMs(since.slice(0, 16)) + b.step, b.min); ms <= end; ms += b.step) {
      if (isAvailable(s, ms)) rows.push({ time: `${msToWall(ms)}:00`, value: ecValue(s, variable, ms) });
    }
    return rows;
  },

  async socialValues(indicator: string, { year = 2022, sex = 3, age = -1 }: SocialParams): Promise<UatValue[]> {
    const uats = await loadUats();
    await delay();
    return uats.features.map((f) => ({ uat: f.properties.natcode, value: socialValue(indicator, f.properties, year, sex, age) }));
  },

  async socialSeries(indicator: string, { uat, sex = 3, age = -1 }: SocialParams, years: number[]): Promise<YearValue[]> {
    const uats = await loadUats();
    await delay();
    const f = uats.features.find((x) => x.properties.natcode === String(uat));
    if (!f) return [];
    return [...years].sort((a, b) => a - b).map((year) => ({ year, value: socialValue(indicator, f.properties, year, sex, age) }));
  },
};
