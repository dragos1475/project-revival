// Deterministic synthetic fields for demo mode. Every value is a pure function of its inputs,
// so snapshot maps, time series and tables always agree with each other.

export function hash(...parts: (string | number)[]) {
  let h = 2166136261 >>> 0;
  for (const part of parts) {
    const s = typeof part === "number" ? part.toFixed(6) : part;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  }
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export const rand01 = (...parts: (string | number)[]) => hash(...parts) / 4294967296;

function intHash(seed: number, i: number, j = 0) {
  let x = (seed ^ Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function noise1(seed: number, x: number) {
  const i = Math.floor(x);
  const f = smooth(x - i);
  const a = intHash(seed, i) * 2 - 1;
  const b = intHash(seed, i + 1) * 2 - 1;
  return a + (b - a) * f;
}

export function fbm1(seed: number, x: number, octaves = 3) {
  let sum = 0, amp = 1, norm = 0, freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += noise1(seed + o * 101, x * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function noise2(seed: number, x: number, y: number) {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = smooth(x - i), fy = smooth(y - j);
  const a = intHash(seed, i, j), b = intHash(seed, i + 1, j);
  const c = intHash(seed, i, j + 1), d = intHash(seed, i + 1, j + 1);
  const top = a + (b - a) * fx;
  const bot = c + (d - c) * fx;
  return (top + (bot - top) * fy) * 2 - 1;
}

export function fbm2(seed: number, x: number, y: number, octaves = 3) {
  let sum = 0, amp = 1, norm = 0, freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += noise2(seed + o * 131, x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const round = (v: number, d = 1) => {
  const k = Math.pow(10, d);
  return Math.round(v * k) / k;
};

const DAY = 86400000;

export function dayOfYear(ms: number) {
  return (ms - Date.UTC(new Date(ms).getUTCFullYear(), 0, 1)) / DAY;
}

export function sunSine(utcMs: number, lat: number, lon: number) {
  const decl = 0.4093 * Math.sin((2 * Math.PI * (dayOfYear(utcMs) - 81)) / 365);
  const solarHour = (utcMs % DAY) / 3600000 + lon / 15;
  const ha = ((solarHour - 12) * Math.PI) / 12;
  const phi = (lat * Math.PI) / 180;
  return Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha);
}

export const solarHour = (utcMs: number, lon: number) => ((((utcMs % DAY) / 3600000 + lon / 15) % 24) + 24) % 24;

export interface Site {
  id: string;
  lat: number;
  lon: number;
  elev: number;
  seed: number;
  wet?: number;
}

export interface Weather {
  temp: number;
  irradiance: number;
  rain: number;
  humidity: number;
  pressure: number;
  wind: number;
  windDir: number;
  soilTemp: number;
  soilHum: number;
  cloud: number;
  snow: number;
  sinEl: number;
}

/** Shared surface weather model: instantaneous values at a site. */
export function weatherAt(site: Site, utcMs: number): Weather {
  const tDays = utcMs / DAY;
  const doy = dayOfYear(utcMs);
  const seasonal = 10.8 - 12.6 * Math.cos((2 * Math.PI * (doy - 18)) / 365);
  const synoptic = fbm1(7, tDays / 4.5, 3) * 4.8 + fbm1(site.seed, tDays / 2.2, 2) * 1.1;
  const cloud = clamp(0.48 + 0.62 * fbm1(23, tDays * 1.15 + site.lon * 0.05, 3) + 0.18 * fbm1(site.seed + 3, tDays * 3, 2), 0, 1);
  const sh = solarHour(utcMs, site.lon);
  const amp = (4.2 + 2.6 * Math.sin((2 * Math.PI * (doy - 80)) / 365)) * (1 - 0.55 * cloud);
  const diurnal = amp * Math.cos((2 * Math.PI * (sh - 15)) / 24);
  const temp = seasonal + synoptic + diurnal - 0.0065 * site.elev;
  const sinEl = Math.max(0, sunSine(utcMs, site.lat, site.lon));
  const irradiance = 1030 * Math.pow(sinEl, 1.15) * (1 - 0.72 * Math.pow(cloud, 1.4));
  const rainSignal = cloud - 0.74 + 0.25 * fbm1(site.seed + 9, tDays * 6, 2);
  const rain = rainSignal > 0 ? rainSignal * 9 * (0.6 + 0.8 * rand01(site.seed, Math.floor(utcMs / 3600000))) : 0;
  const humidity = clamp(72 - 0.95 * diurnal * 4 + 22 * fbm1(31, tDays / 2.8, 2) + (rain > 0 ? 18 : 0) + cloud * 8, 18, 100);
  const pressure = (1014.5 + 9 * fbm1(41, tDays / 5.5, 3) - (rain > 0 ? 4 : 0)) * Math.exp(-site.elev / 8200);
  const windBase = 2.2 + ((1.7 * (fbm1(53, tDays * 1.6, 3) + 1)) / 2) * 3 + site.elev / 900;
  const wind = Math.max(0, windBase * (0.65 + 0.45 * Math.max(0, Math.cos((2 * Math.PI * (sh - 14)) / 24))) + 0.6 * fbm1(site.seed + 5, tDays * 24, 2));
  const windDir = ((fbm1(61, tDays / 1.4, 2) + 1) * 220 + 40 + fbm1(site.seed + 6, tDays * 20, 2) * 25 + 360) % 360;
  const soilTemp = 11.2 - 11 * Math.cos((2 * Math.PI * (doy - 30)) / 365) + synoptic * 0.45 + 1.4 * Math.cos((2 * Math.PI * (sh - 18)) / 24) - 0.005 * site.elev;
  const soilHum = clamp(0.24 + 0.07 * fbm1(site.seed + 11, tDays / 18, 2) + 0.04 * fbm1(71, tDays / 6, 2) + (site.wet ?? 0), 0.06, 0.52);
  const snow = temp < 1 && site.elev > 450 ? Math.max(0, (1 - temp) * 6 * (fbm1(site.seed + 13, tDays / 9, 2) + 0.6)) : 0;
  return { temp, irradiance, rain, humidity, pressure, wind, windDir, soilTemp, soilHum, cloud, snow, sinEl };
}
