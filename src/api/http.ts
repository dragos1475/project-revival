import { CONFIG } from "@/lib/config";

export type ApiErrorKind = "http" | "network" | "timeout" | "parse";

export class ApiError extends Error {
  status: number;
  detail: string | null;
  url: string;
  kind: ApiErrorKind;
  constructor(message: string, { status = 0, detail = null, url = "", kind = "http" }: { status?: number; detail?: string | null; url?: string; kind?: ApiErrorKind } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.url = url;
    this.kind = kind;
  }
}

type Param = string | number | null | undefined | (string | number)[];

/** Builds a URL; relative bases ("/lifewatch-api") resolve against the page origin. */
export function buildUrl(base: string, path: string, params: Record<string, Param> = {}) {
  const url = new URL(base + path, window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function getJSON<T>(url: string, { timeout = CONFIG.requestTimeoutMs }: { timeout?: number } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeout);
  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new ApiError("timeout", { url, kind: "timeout" });
    throw new ApiError(err instanceof Error ? err.message : "network", { url, kind: "network" });
  }
  clearTimeout(timer);
  if (!response.ok) {
    let detail: string | null = null;
    try {
      const body = await response.json();
      detail = typeof body?.detail === "string" ? body.detail : body?.detail ? JSON.stringify(body.detail) : null;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(detail ?? `HTTP ${response.status}`, { status: response.status, detail, url });
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("parse", { url, kind: "parse" });
  }
}

/** Promise cache keyed by request; failures are evicted so they can be retried. */
export function createCache(ttlMs = 5 * 60 * 1000, maxEntries = 160) {
  const store = new Map<string, { p: Promise<unknown>; t: number }>();
  return function cached<T>(key: string, producer: () => Promise<T>): Promise<T> {
    const hit = store.get(key);
    if (hit && Date.now() - hit.t < ttlMs) return hit.p as Promise<T>;
    const p = Promise.resolve().then(producer);
    store.set(key, { p, t: Date.now() });
    p.catch(() => store.delete(key));
    if (store.size > maxEntries) store.delete(store.keys().next().value as string);
    return p;
  };
}
