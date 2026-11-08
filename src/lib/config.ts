export type BackendName = "lifewatch" | "ltser";
export type BackendMode = "auto" | "live" | "demo";

interface RuntimeConfig {
  lifewatchApi?: string;
  lifewatchMode?: string;
  ltserApi?: string;
  ltserMode?: string;
  mediaBaseUrl?: string | null;
  requestTimeoutMs?: number;
  probeTimeoutMs?: number;
  cartoKey?: string;
  basemaps?: Partial<Record<"light" | "lightLabels" | "dark" | "darkLabels" | "imagery", string>>;
}

declare global {
  interface Window {
    LTSER_CONFIG?: RuntimeConfig;
  }
}

const raw: RuntimeConfig = window.LTSER_CONFIG ?? {};
const forced = new URLSearchParams(window.location.search).get("mod");
const mode = (m?: string | null): BackendMode => (m === "live" || m === "demo" || m === "auto" ? m : "auto");
const trim = (u: string) => u.replace(/\/+$/, "");
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const CARTO = "https://basemaps.cartocdn.com/rastertiles";
const cartoKey = raw.cartoKey?.trim() || "";
/** CARTO tile URL for a style when a key is configured, else the Esri fallback. */
const carto = (style: string, esri: string) => (cartoKey ? `${CARTO}/${style}/{z}/{x}/{y}{r}.png?key={key}` : esri);
const withKey = (url: string) => url.replace("{key}", encodeURIComponent(cartoKey));

const ltserBase = trim(raw.ltserApi ?? "/ltser-api");

export const CONFIG = {
  lifewatch: { baseUrl: trim(raw.lifewatchApi ?? "/lifewatch-api"), mode: mode(forced ?? raw.lifewatchMode) },
  ltser: { baseUrl: ltserBase, mode: mode(forced ?? raw.ltserMode) },
  mediaBaseUrl: trim(raw.mediaBaseUrl ?? `${ltserBase}/media`),
  requestTimeoutMs: raw.requestTimeoutMs ?? 20000,
  probeTimeoutMs: raw.probeTimeoutMs ?? 2500,
  cartoKey,
  basemaps: {
    light: withKey(raw.basemaps?.light ?? carto("light_nolabels", `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`)),
    lightLabels: withKey(raw.basemaps?.lightLabels ?? carto("light_only_labels", `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`)),
    dark: withKey(raw.basemaps?.dark ?? carto("dark_nolabels", `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`)),
    darkLabels: withKey(raw.basemaps?.darkLabels ?? carto("dark_only_labels", `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`)),
    imagery: withKey(raw.basemaps?.imagery ?? `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`),
  },
} as const;

/** Credit line for a basemap URL. */
export const basemapAttribution = (url: string) =>
  url.includes("cartocdn.com") ? "&copy; OpenStreetMap contributors &copy; CARTO" : url.includes("World_Imagery") ? "Esri, Maxar, Earthstar Geographics" : "Esri, HERE, Garmin, &copy; OpenStreetMap contributors";
