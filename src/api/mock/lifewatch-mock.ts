// Demo implementation of the LifeWatch Romania FastAPI service
// (lifewatch-romania/src/lifewatch/api/main.py): same routes, shapes, limits and errors.
import { SEED_STATIONS, SEED_VARIABLES, type SeedStation } from "./lifewatch-seed";
import { hash, rand01, fbm1, clamp, round, weatherAt, type Site, type Weather } from "./fields";
import { ApiError } from "../http";
import type { LwMeasurementsBody, LwMeasurementsQuery, LwSnapshot, LwStation, LwStationInfo, LwVariable } from "../types";

const DAY = 86400000;
const MAX_ROWS = 50000;
const delay = (ms = 120 + Math.random() * 180) => new Promise((r) => setTimeout(r, ms));

const STEP_MS: Record<string, number> = {
  meteorological_20s_measurements: 20000,
  meteorological_30s_measurements: 30000,
  meteorological_60s_measurements: 60000,
  // 20 Hz raw data, the API keeps every 50th row: one sample each 2.5 s.
  eddy_covariance_measurements: 2500,
  eddy_covariance_ch4_measurements: 2500,
};

const ELEV: Record<string, number> = { "IF-Cor": 90, "TR-Drv": 90, "TL-Sar": 30, "BR-Mar": 5, "BR-Bra": 20, "TL-Mal": 10, "CL-Scm": 30, "AG-Mih": 520, "PH-Ber": 140, "AG-Dmb": 780, "MH-Ors": 80, "GR-Bul": 110, "IF-Ste": 70, "DB-Mor": 640, "HD-Uri": 1580, "HD-San": 340, "BH-Pad": 1270, "TL-Sfg": 2, "BV-Brv": 560, "GR-Com": 60, bv: 300, com: 4, enisala: 5, imb: 3, poli: 3 };
const CUV5 = new Set(["AG-Dmb", "BH-Pad", "BR-Bra", "CL-Scm", "IF-Cor", "IF-Ste", "MH-Ors", "TL-Mal", "TL-Sfg", "TR-Drv"]);

const meteoVars = SEED_VARIABLES.filter((v) => v.table.startsWith("meteorological"));
const baseEcVars = SEED_VARIABLES.filter((v) => v.table === "eddy_covariance_measurements");
const ch4Vars = SEED_VARIABLES.filter((v) => v.table === "eddy_covariance_ch4_measurements");

const site = (st: SeedStation): Site => ({ id: st.code, lat: st.lat, lon: st.lon, elev: ELEV[st.code] ?? 100, seed: hash("lw", st.id) & 0xffff, wet: st.kind === "eddy-covariance" ? 0.05 : 0 });

function stationVariables(st: SeedStation) {
  if (st.kind === "meteorological") return meteoVars;
  if (st.kind === "eddy-covariance") return st.has_ch4 ? [...baseEcVars, ...ch4Vars] : baseEcVars;
  return [];
}

/** Newest timestamp of a table for a station. Station 17 (Padiș) is deliberately stale. */
function latestFor(st: SeedStation, table: string) {
  const step = STEP_MS[table];
  const lagMin = 2 + Math.floor(rand01("lag", st.id) * 7);
  return Math.floor((Date.now() - lagMin * 60000 - (st.id === 17 ? 3 * DAY : 0)) / step) * step;
}

function hasSensor(st: SeedStation, variable: string) {
  if (variable === "licor_irradiance") return rand01("licor", st.id) < 0.35;
  if (variable === "cuv5_irradiance") return CUV5.has(st.code);
  if (variable === "snow_depth") return (ELEV[st.code] ?? 0) > 450;
  return true;
}

const es = (T: number) => 0.6108 * Math.exp((17.27 * T) / (T + 237.3));

function sample(st: SeedStation, s: Site, variable: string, ms: number, w: Weather): number | null {
  if (!hasSensor(st, variable)) return null;
  const white = (k: number) => rand01(variable, st.id, k, Math.floor(ms / 500)) * 2 - 1;
  const slow = (k: number, scale = 1) => fbm1(s.seed + k, ms / 600000, 2) * scale;
  const pKpa = w.pressure / 10;
  const airMol = (pKpa * 1000) / (8.314 * (w.temp + 273.15));
  const ppm = 418 + (w.sinEl <= 0 ? 16 : 3) + slow(1, 5) + white(1) * 2.5;
  const e = (w.humidity / 100) * es(w.temp);
  const h2oMf = (e / pKpa) * 1000;
  const ws = Math.max(0, w.wind + white(2) * 0.6);
  const dir = (w.windDir * Math.PI) / 180;
  switch (variable) {
    case "irradiance": return round(Math.max(0, w.irradiance + white(3) * 6 * (w.irradiance > 0 ? 1 : 0)), 2);
    case "unit_temperature_sr30": return round(w.temp + 0.004 * w.irradiance, 2);
    case "error_code_sr30": return 0;
    case "licor_irradiance": return round(Math.max(0, w.irradiance * 0.97), 2);
    case "cuv5_irradiance": return round(Math.max(0, w.irradiance * 0.046), 3);
    case "wind_direction": return Math.round((w.windDir + white(4) * 12 + 360) % 360);
    case "wind_speed": return round(ws, 2);
    case "current_weather_code": return w.rain > 2 ? 63 : w.rain > 0 ? 61 : w.humidity > 97 ? 30 : 0;
    case "visibility": return Math.round(w.rain > 0 ? 4000 + 3000 * rand01("vis", ms) : w.humidity > 95 ? 900 + 900 * rand01("vis", ms) : 15000 + 5000 * rand01("vis", ms));
    case "particles_count": return w.rain > 0 ? Math.round(w.rain * 38 + 6 * rand01("pc", ms)) : 0;
    case "intensity": return round(w.rain, 2);
    case "air_temp_cs125": return round(w.temp + 0.15, 2);
    case "air_pressure": return round(w.pressure, 2);
    case "air_humidity": return round(w.humidity, 2);
    case "air_temperature": return round(w.temp, 2);
    case "data_logger_voltage": return round(12.7 + 0.9 * Math.min(1, w.irradiance / 600) + white(5) * 0.02, 3);
    case "snow_depth": return round(w.snow, 1);
    case "total_rain": return round(w.rain / 60, 3);
    case "soil_temperature": return round(w.soilTemp, 2);
    case "soil_humidity": return round(w.soilHum, 3);
    case "measurement_quality_sr50a": return 152 + Math.floor(rand01("q", st.id, Math.floor(ms / 3600000)) * 50);
    case "co2_concentration": return round((ppm * airMol) / 1000, 4);
    case "h2o_concentration": return round(h2oMf * airMol, 3);
    case "co2_raw_power_in_sample_wavelength": return round(0.873 + slow(2, 0.004) + white(6) * 0.0015, 5);
    case "h2o_raw_power_in_sample_wavelength": return round(0.842 + slow(3, 0.006) + white(7) * 0.002, 5);
    case "co2_raw_power_in_reference_wavelength": return round(0.951 + slow(4, 0.003) + white(8) * 0.001, 5);
    case "h2o_raw_power_in_reference_wavelength": return round(0.947 + slow(5, 0.003) + white(9) * 0.001, 5);
    case "co2_molar_fraction": return round(ppm, 3);
    case "h2o_molar_fraction": return round(h2oMf + white(10) * 0.05, 3);
    case "co2_mass_density": return round(((ppm * airMol) / 1000) * 44.01, 2);
    case "h2o_mass_density": return round((h2oMf * airMol * 18.015) / 1000, 3);
    case "co2_absorptance": return round(0.0915 + (ppm - 420) * 0.00002 + white(11) * 0.0002, 5);
    case "h2o_absorptance": return round(0.018 + h2oMf * 0.0061 + white(12) * 0.0004, 5);
    case "co2_signal_strength": return round(clamp(99 - 2.5 * (w.rain > 0 ? 1 : 0) + slow(6, 0.6), 80, 101), 2);
    case "temperature": return round(w.temp + 0.4 + slow(7, 0.2), 3);
    case "pressure": return round(pKpa + white(13) * 0.005, 4);
    case "dew_point": {
      const g = Math.log(e / 0.6108);
      return round((237.3 * g) / (17.27 - g), 3);
    }
    case "cooler_voltage": return round(1.82 + 0.021 * w.temp + white(14) * 0.003, 4);
    case "chopper_cooler_voltage": return round(1.55 + 0.012 * w.temp + white(15) * 0.003, 4);
    case "vin_smart_flux": return round(12.6 + 0.8 * Math.min(1, w.irradiance / 600) + white(16) * 0.01, 3);
    case "vin_dsi": return round(12.5 + 0.8 * Math.min(1, w.irradiance / 600) + white(17) * 0.01, 3);
    case "wind_u": return round(-ws * Math.sin(dir) + white(18) * 0.45 * (ws + 0.3), 3);
    case "wind_v": return round(-ws * Math.cos(dir) + white(19) * 0.45 * (ws + 0.3), 3);
    case "wind_w": return round(white(20) * 0.16 * (ws + 0.3), 3);
    case "sonic_temperature": return round(w.temp + 0.2 + white(21) * 0.15, 3);
    case "chk": return hash("chk", st.id, ms) % 256;
    case "ch4_molar_fraction": return round(2.04 + (w.sinEl <= 0 ? 0.07 : 0.01) + slow(8, 0.02) + white(22) * 0.006, 4);
    case "ch4_molar_density": return round(((2.04 + slow(8, 0.02)) * airMol) / 1000, 5);
    case "ch4_temperature": return round(w.temp + 1.2, 3);
    case "ch4_pressure": return round(pKpa - 0.25 + white(23) * 0.01, 4);
    case "ch4_signal_strength": return round(clamp(54 + slow(9, 6) - (w.rain > 0 ? 18 : 0), 5, 80), 2);
    case "ch4_auxiliary_input_1":
    case "ch4_auxiliary_input_2":
    case "ch4_auxiliary_input_3":
    case "ch4_auxiliary_input_4": return round(0.0012 + white(24) * 0.0004, 5);
    case "ch4_thermocouple_input_1": return round(w.temp + 0.3, 3);
    case "ch4_thermocouple_input_2": return round(w.temp - 0.2, 3);
    case "ch4_thermocouple_input_3": return round(w.soilTemp, 3);
    case "ch4_diagnostic_value": return 0;
    case "ch4_drop_rate": return round(clamp(0.2 + slow(10, 0.4) + Math.max(0, white(25)) * 0.3, 0, 100), 3);
    default: return null;
  }
}

/** Python isoformat() of an aware UTC datetime, including microseconds when present. */
const iso = (ms: number) => new Date(ms).toISOString().replace(".000Z", "+00:00").replace(/\.(\d{3})Z$/, ".$1000+00:00");

function parseDate(value: string | undefined, name: string) {
  if (!value) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new ApiError(`Invalid ${name}`, { status: 422, detail: `Input should be a valid datetime (${name})` });
  return ms;
}

function checkWindow(since: number, until: number, maxDays = 7) {
  if (since >= until) throw new ApiError("`since` date cannot be after `until` date", { status: 400, detail: "`since` date cannot be after `until` date" });
  if (until - since >= maxDays * DAY) {
    const detail = `We currently don't allow retrieving data for periods of longer than ${maxDays} days in a single request`;
    throw new ApiError(detail, { status: 400, detail });
  }
}

function findStation(id: number) {
  const st = SEED_STATIONS.find((s) => s.id === Number(id));
  if (!st) throw new ApiError("Station not found", { status: 404, detail: "Station not found" });
  return st;
}

export const lifewatchMock = {
  async variables(): Promise<LwVariable[]> {
    await delay(60);
    return [
      ...meteoVars.map((v) => ({ id: v.id, name: v.name, kind: "meteorological" as const, units: v.units, description: v.description })),
      ...[...baseEcVars, ...ch4Vars].map((v) => ({ id: v.id, name: v.name, kind: "eddy-covariance" as const, units: v.units, description: v.description })),
    ];
  },

  async stations(): Promise<LwStation[]> {
    await delay(80);
    return SEED_STATIONS.map((s) => ({ id: s.id, name: s.name, kind: s.kind, has_ch4: s.has_ch4 }));
  },

  async stationInfo(id: number): Promise<LwStationInfo> {
    await delay(80);
    const st = findStation(id);
    return {
      id: st.id, name: st.name, kind: st.kind, has_ch4: st.has_ch4,
      location: { latitude: st.lat, longitude: st.lon },
      variables: stationVariables(st).map((v) => ({ name: v.id, label: v.name, units: v.units, description: v.description })),
    };
  },

  async measurements(id: number, { variables = [], since, until }: LwMeasurementsQuery = {}): Promise<LwMeasurementsBody> {
    await delay();
    const st = findStation(id);
    if (!st.kind) throw new ApiError("Cannot get measurements for a station of unknown kind", { status: 400, detail: "Cannot get measurements for a station of unknown kind" });
    const valid = stationVariables(st).map((v) => v.id);
    let wanted = variables;
    if (wanted.length) {
      const invalid = wanted.filter((v) => !valid.includes(v));
      if (invalid.length) {
        const detail = `Some of the requested variables are not available for this station kind: ${invalid.join(", ")}`;
        throw new ApiError(detail, { status: 400, detail });
      }
    } else wanted = valid;
    const meta = SEED_VARIABLES.filter((v) => wanted.includes(v.id));
    const tables = [...new Set(meta.map((m) => m.table))];
    const latest = Math.max(...tables.map((tb) => latestFor(st, tb)));
    const s = parseDate(since, "since") ?? latest - 2 * 3600000;
    const u = parseDate(until, "until") ?? latest;
    checkWindow(s, u);
    const s0 = site(st);
    const timestamps: Record<string, string[]> = {};
    const measurements: Record<string, (number | null)[]> = {};
    for (const table of tables) {
      const step = STEP_MS[table];
      const end = Math.min(u, latestFor(st, table));
      const vars = meta.filter((m) => m.table === table).map((m) => m.id);
      const ts: string[] = [];
      const cols: (number | null)[][] = vars.map(() => []);
      for (let ms = Math.ceil(s / step) * step; ms <= end && ts.length < MAX_ROWS; ms += step) {
        const w = weatherAt(s0, ms);
        ts.push(iso(ms));
        vars.forEach((v, k) => cols[k].push(sample(st, s0, v, ms, w)));
      }
      vars.forEach((v, k) => {
        timestamps[v] = ts;
        measurements[v] = cols[k];
      });
    }
    return { variables: wanted, timestamps, measurements };
  },

  async snapshot({ variable, since, until }: { variable: string; since?: string; until?: string }): Promise<LwSnapshot> {
    await delay();
    const md = SEED_VARIABLES.find((v) => v.id === variable);
    if (!md) throw new ApiError(`Invalid variable name: ${variable}`, { status: 400, detail: `Invalid variable name: ${variable}` });
    const owners = SEED_STATIONS.filter((st) => stationVariables(st).some((v) => v.id === variable));
    const latest = Math.max(...owners.map((st) => latestFor(st, md.table)));
    const s = parseDate(since, "since") ?? latest - 12 * 3600000;
    const u = parseDate(until, "until") ?? latest;
    checkWindow(s, u);
    const step = STEP_MS[md.table];
    return {
      stations: owners
        .filter((st) => hasSensor(st, variable))
        .map((st) => {
          const end = Math.min(u, latestFor(st, md.table));
          const count = end < s ? 0 : Math.floor((end - Math.ceil(s / step) * step) / step) + 1;
          return { id: st.id, name: st.name, location: { latitude: st.lat, longitude: st.lon }, count: Math.max(0, count) };
        })
        .filter((x) => x.count > 0),
    };
  },
};
