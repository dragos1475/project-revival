// Client for the LifeWatch Romania FastAPI service (lifewatch-romania/src/lifewatch/api/main.py).
import { CONFIG } from "@/lib/config";
import { buildUrl, getJSON, createCache } from "./http";
import { resolveBackend } from "./status";
import type { LwMeasurementsBody, LwMeasurementsQuery, LwSnapshot, LwStation, LwStationInfo, LwVariable, Measurements } from "./types";

export const LIFEWATCH_ROW_LIMIT = 50000;

interface Impl {
  stations(): Promise<LwStation[]>;
  stationInfo(id: number): Promise<LwStationInfo>;
  variables(): Promise<LwVariable[]>;
  measurements(id: number, q: LwMeasurementsQuery): Promise<LwMeasurementsBody>;
  snapshot(q: { variable: string; since?: string; until?: string }): Promise<LwSnapshot>;
}

const base = () => CONFIG.lifewatch.baseUrl;
const live: Impl = {
  stations: () => getJSON(buildUrl(base(), "/stations")),
  stationInfo: (id) => getJSON(buildUrl(base(), `/stations/${id}`)),
  variables: () => getJSON(buildUrl(base(), "/variables")),
  measurements: (id, { variables = [], since, until }) => getJSON(buildUrl(base(), `/stations/${id}/measurements`, { variables, since, until })),
  snapshot: ({ variable, since, until }) => getJSON(buildUrl(base(), "/stations/snapshot", { variable, since, until })),
};

let mock: Impl | null = null;
async function impl(): Promise<Impl> {
  if ((await resolveBackend("lifewatch")) === "live") return live;
  mock ??= (await import("./mock/lifewatch-mock")).lifewatchMock;
  return mock;
}

const cache = createCache(2 * 60 * 1000);
const FRACTION = /\.(\d{3})\d+/;
const parseInstant = (s: string) => Date.parse(s.length > 25 ? s.replace(FRACTION, ".$1") : s);

function normalize(body: LwMeasurementsBody): Measurements {
  const series: Measurements["series"] = {};
  for (const name of body.variables ?? []) {
    const ts = body.timestamps?.[name] ?? [];
    const vs = body.measurements?.[name] ?? [];
    const t = new Float64Array(ts.length);
    const v = new Float64Array(ts.length);
    for (let i = 0; i < ts.length; i++) {
      t[i] = parseInstant(ts[i]);
      const x = vs[i];
      v[i] = x === null || x === undefined ? Number.NaN : x;
    }
    series[name] = { t, v };
  }
  return { variables: body.variables ?? [], series };
}

export const lifewatch = {
  stations: async () => cache("stations", async () => (await impl()).stations()),
  stationInfo: async (id: number) => cache(`station:${id}`, async () => (await impl()).stationInfo(id)),
  variables: async () => cache("variables", async () => (await impl()).variables()),
  measurements: async (id: number, q: LwMeasurementsQuery = {}) =>
    cache(`m:${id}:${(q.variables ?? []).join(",")}:${q.since ?? ""}:${q.until ?? ""}`, async () => normalize(await (await impl()).measurements(id, q))),
  snapshot: async (q: { variable: string; since?: string; until?: string }) =>
    cache(`snap:${q.variable}:${q.since ?? ""}:${q.until ?? ""}`, async () => (await impl()).snapshot(q)),
};
