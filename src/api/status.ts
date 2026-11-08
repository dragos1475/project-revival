// Decides once per page load whether each backend is used live or in demo mode.
import { CONFIG, type BackendName } from "@/lib/config";
import { getJSON } from "./http";

export type ResolvedMode = "pending" | "live" | "demo";
export type ModeReason = "configured" | "probe" | "unhealthy" | "timeout" | "unreachable" | null;

export interface BackendState {
  mode: ResolvedMode;
  reason: ModeReason;
  baseUrl: string;
  latencyMs: number | null;
}

const state: Record<BackendName, BackendState> = {
  lifewatch: { mode: "pending", reason: null, baseUrl: CONFIG.lifewatch.baseUrl, latencyMs: null },
  ltser: { mode: "pending", reason: null, baseUrl: CONFIG.ltser.baseUrl, latencyMs: null },
};
const listeners = new Set<() => void>();
const inflight: Partial<Record<BackendName, Promise<"live" | "demo">>> = {};

export const getBackendState = (name: BackendName) => state[name];

export function subscribeBackends(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(name: BackendName, patch: Partial<BackendState>) {
  state[name] = { ...state[name], ...patch };
  listeners.forEach((fn) => fn());
}

export function resolveBackend(name: BackendName): Promise<"live" | "demo"> {
  const existing = inflight[name];
  if (existing) return existing;
  const conf = CONFIG[name];
  const run = (async () => {
    if (conf.mode === "demo") {
      set(name, { mode: "demo", reason: "configured" });
      return "demo" as const;
    }
    if (conf.mode === "live") {
      set(name, { mode: "live", reason: "configured" });
      return "live" as const;
    }
    const started = performance.now();
    try {
      const body = await getJSON<{ status?: string }>(`${conf.baseUrl}/health`, { timeout: CONFIG.probeTimeoutMs });
      const latencyMs = Math.round(performance.now() - started);
      if (body?.status === "healthy") {
        set(name, { mode: "live", reason: "probe", latencyMs });
        return "live" as const;
      }
      set(name, { mode: "demo", reason: "unhealthy", latencyMs });
    } catch (err) {
      const kind = (err as { kind?: string }).kind;
      set(name, { mode: "demo", reason: kind === "timeout" ? "timeout" : "unreachable" });
    }
    return "demo" as const;
  })();
  inflight[name] = run;
  return run;
}
