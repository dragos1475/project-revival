// Animated precipitation radar for LwMap: the national composite of ANM's seven weather radars, one frame
// every 10 minutes over the last three hours. Frames are read straight from the ANM open data portal
// (GeoZarr in Web Mercator, one zstd-compressed uint8 chunk per frame, open to other sites), coloured in a
// canvas and swapped in one image overlay. Source: dataset ro.anm.radar.composite, CC BY 4.0.
import { useEffect, useRef, useState } from "react";
import type * as LT from "leaflet";
import { Pause, Play } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { numberLocale, pick } from "../i18n/core";

const STORE = "https://opendata.geo.meteoromania.ro/data/radar/composite.zarr";
const CATALOG = "https://opendata.geo.meteoromania.ro/catalog/ro.anm.radar.composite/";
const FRAMES = 18;
const FRAME_MS = 450;
const HOLD_MS = 1800;
const REFRESH_MS = 5 * 60_000;
const ATTRIBUTION = "Radar © ANM, CC BY 4.0";

/** Lower bounds of the rain-rate classes, mm/h. */
const BINS = [0.1, 0.5, 2, 5, 10, 25];
/** One blue ramp per theme, light to heavy, validated as ordinal ramps against the map's light and dark land colours. */
const RAMPS: Record<Theme, string[]> = {
  light: ["#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b", "#08234a"],
  dark: ["#2a78d6", "#4a90e6", "#6da7ec", "#9ec5f4", "#cde2fb", "#eef5fe"],
};
const EMPTY = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface Meta {
  w: number;
  h: number;
  /** Web Mercator bounds of the grid, metres: west, south, east, north. */
  bbox: [number, number, number, number];
  scale: number;
  offset: number;
}
export interface RadarFrame {
  t: number;
  url: string;
}
type Zstd = (data: Uint8Array, out?: Uint8Array) => Uint8Array;

let zstd: Promise<Zstd> | null = null;
const loadZstd = () => (zstd ??= import("fzstd").then((m) => m.decompress));

async function readMeta(): Promise<Meta> {
  const r = await fetch(`${STORE}/zarr.json`);
  if (!r.ok) throw new Error(`radar metadata ${r.status}`);
  const j = await r.json();
  const a = j.attributes ?? {};
  const v = j.consolidated_metadata?.metadata?.dbr?.attributes ?? {};
  const [h, w] = a["spatial:shape"];
  return {
    w,
    h,
    bbox: a["spatial:bbox"],
    scale: v.scale_factor ?? 0.2,
    offset: v.add_offset ?? -20.2,
  };
}

/** Frame times of the rolling store, ms since 1970; the position is the frame's chunk index. */
async function readTimes(z: Zstd): Promise<number[]> {
  const r = await fetch(`${STORE}/time/c/0`);
  if (!r.ok) throw new Error(`radar time ${r.status}`);
  const raw = z(new Uint8Array(await r.arrayBuffer()));
  const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const out: number[] = [];
  for (let i = 0; i + 8 <= raw.byteLength; i += 8) out.push(Number(dv.getBigInt64(i, true)) * 1000);
  return out;
}

/** Compressed rain-rate chunk of one frame; null when the store left it out because it holds no data. */
async function readFrame(i: number): Promise<Uint8Array | null> {
  const r = await fetch(`${STORE}/dbr/c/${i}/0/0`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`radar frame ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

const rgb = (hex: string) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));

/** Rain rate of a stored value, mm/h; null for no echo (0) and outside the radar coverage (255). */
const rateOf = (v: number, m: Meta) =>
  v === 0 || v === 255 ? null : 10 ** ((v * m.scale + m.offset) / 10);

/** RGBA colour of every stored value, packed little-endian for a Uint32 view of ImageData. */
function colourTable(m: Meta, theme: Theme) {
  const ramp = RAMPS[theme].map(rgb);
  const out = new Uint32Array(256);
  for (let v = 1; v < 255; v++) {
    const rate = rateOf(v, m)!;
    let k = -1;
    while (k + 1 < BINS.length && rate >= BINS[k + 1]) k++;
    if (k < 0) continue;
    const [r, g, b] = ramp[k];
    out[v] = (((k === 0 ? 170 : 215) << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  return out;
}

/** Clears echo pixels with fewer than two echo neighbours: single-pixel speckle, about a seventh of the echoes in
 * the raw composite, is noise rather than precipitation. Display and cursor readout both use the cleaned grid. */
function despeckle(a: Uint8Array, m: Meta) {
  const { w, h } = m;
  const vmin = Math.ceil((10 * Math.log10(BINS[0]) - m.offset) / m.scale);
  const echo = (v: number) => v >= vmin && v !== 255;
  const out = a.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!echo(a[y * w + x])) continue;
      let n = 0;
      for (let dy = -1; dy <= 1 && n < 2; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1 && n < 2; dx++) {
          const xx = x + dx;
          if ((dx || dy) && xx >= 0 && xx < w && echo(a[yy * w + xx])) n++;
        }
      }
      if (n < 2) out[y * w + x] = 0;
    }
  }
  return out;
}

async function pool<T, R>(items: T[], size: number, run: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const k = next++;
        out[k] = await run(items[k]);
      }
    }),
  );
  return out;
}

/** Loads and refreshes the frames and paints them for the current theme, outside React. */
class RadarEngine {
  meta: Meta | null = null;
  private z: Zstd | null = null;
  private packed = new Map<number, Uint8Array | null>();
  private urls = new Map<number, string>();
  private decoded: { t: number; data: Uint8Array | null } | null = null;
  private canvas = document.createElement("canvas");
  private timer = 0;
  private dead = false;
  private busy = false;
  theme: Theme;

  constructor(
    theme: Theme,
    private on: {
      frames: (f: RadarFrame[]) => void;
      progress: (done: number, total: number) => void;
      error: (on: boolean) => void;
    },
  ) {
    this.theme = theme;
  }

  async start() {
    this.timer = window.setInterval(() => void this.refresh(), REFRESH_MS);
    await this.refresh();
  }

  stop() {
    this.dead = true;
    clearInterval(this.timer);
    for (const u of this.urls.values()) URL.revokeObjectURL(u);
    this.urls.clear();
  }

  async refresh() {
    if (this.busy || this.dead) return;
    this.busy = true;
    try {
      [this.z, this.meta] = await Promise.all([this.z ?? loadZstd(), this.meta ?? readMeta()]);
      await this.round(this.z, true);
      this.on.error(false);
    } catch {
      if (!this.dead) this.on.error(true);
    } finally {
      this.busy = false;
    }
  }

  /** Fetches the frames still missing. The store rolls every 10 minutes and its chunk indices move with it, so
   * the time axis is read again after the fetch and the round restarts once if it moved meanwhile. */
  private async round(z: Zstd, retry: boolean): Promise<void> {
    const before = await readTimes(z);
    const want = before
      .map((t, i) => [t, i] as const)
      .filter(([t]) => t > 0)
      .slice(-FRAMES);
    const missing = want.filter(([t]) => !this.packed.has(t));
    let done = want.length - missing.length;
    const first = this.packed.size === 0;
    if (first) this.on.progress(done, want.length);
    const got = await pool(missing, 6, async ([t, i]) => {
      const p = await readFrame(i);
      done++;
      if (first && !this.dead) this.on.progress(done, want.length);
      return [t, p] as const;
    });
    if (this.dead) return;
    const after = await readTimes(z);
    if (after.length !== before.length || after[after.length - 1] !== before[before.length - 1]) {
      if (retry) return this.round(z, false);
      return;
    }
    for (const [t, p] of got) this.packed.set(t, p);
    const keep = new Set(want.map(([t]) => t));
    for (const t of [...this.packed.keys()]) if (!keep.has(t)) this.packed.delete(t);
    await this.paint();
  }

  /** Builds the image of every frame that has none for the current theme, then publishes the frame list.
   * Calls run one after the other, since they share the canvas and the image list. */
  paint() {
    this.painting = this.painting.then(() => this.paintNow()).catch(() => {});
    return this.painting;
  }
  private painting: Promise<void> = Promise.resolve();

  /** Image URLs still on screen for a moment after they are replaced, so they are revoked a little later. */
  private retire(urls: string[]) {
    if (urls.length) window.setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 5000);
  }

  private async paintNow() {
    const m = this.meta;
    if (!m || !this.z || this.dead) return;
    const stale: string[] = [];
    for (const [t, u] of this.urls) {
      if (!this.packed.has(t) || this.urlTheme !== this.theme) {
        stale.push(u);
        this.urls.delete(t);
      }
    }
    this.urlTheme = this.theme;
    const table = colourTable(m, this.theme);
    this.canvas.width = m.w;
    this.canvas.height = m.h;
    const ctx = this.canvas.getContext("2d");
    for (const t of [...this.packed.keys()].sort((a, b) => a - b)) {
      if (this.urls.has(t)) continue;
      const data = this.decode(t);
      if (!data || !ctx) continue;
      const img = ctx.createImageData(m.w, m.h);
      const px = new Uint32Array(img.data.buffer);
      for (let i = 0; i < data.length; i++) px[i] = table[data[i]];
      ctx.putImageData(img, 0, 0);
      const blob = await new Promise<Blob | null>((res) => this.canvas.toBlob(res, "image/png"));
      if (this.dead) return;
      if (blob) this.urls.set(t, URL.createObjectURL(blob));
    }
    const frames = [...this.packed.keys()]
      .sort((a, b) => a - b)
      .map((t) => ({ t, url: this.urls.get(t) ?? EMPTY }));
    this.on.frames(frames);
    this.retire(stale);
  }
  private urlTheme: Theme | null = null;

  setTheme(theme: Theme) {
    if (theme === this.theme) return;
    this.theme = theme;
    void this.paint();
  }

  /** Values of one frame, decompressed on demand and kept for the last frame asked. */
  private decode(t: number): Uint8Array | null {
    if (this.decoded?.t === t) return this.decoded.data;
    const m = this.meta!;
    const p = this.packed.get(t);
    let data: Uint8Array | null = null;
    if (p) {
      const out = this.z!(p, new Uint8Array(m.w * m.h));
      data = out.length === m.w * m.h ? despeckle(out, m) : null;
    }
    this.decoded = { t, data };
    return data;
  }

  /** Rain rate at a Web Mercator point: mm/h, 0 for no echo, null outside the radar coverage. */
  valueAt(t: number, x: number, y: number): number | null {
    const m = this.meta;
    if (!m || !this.packed.has(t)) return null;
    const [x0, , x1, y1] = m.bbox;
    const px = (x1 - x0) / m.w;
    const col = Math.floor((x - x0) / px);
    const row = Math.floor((y1 - y) / px);
    if (col < 0 || row < 0 || col >= m.w || row >= m.h) return null;
    const data = this.decode(t);
    if (!data) return null;
    const v = data[row * m.w + col];
    if (v === 255) return null;
    const rate = rateOf(v, m);
    return rate == null || rate < BINS[0] ? 0 : rate;
  }
}

const timeFmt = () =>
  new Intl.DateTimeFormat(numberLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  });
const rateFmt = (v: number) =>
  new Intl.NumberFormat(numberLocale(), { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v);

/** The radar layer on a Leaflet map with its player: play or pause, a time slider, the legend and the source. */
export function RadarPlayer({ L, map, theme }: { L: typeof LT; map: LT.Map; theme: Theme }) {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [progress, setProgress] = useState<[number, number]>([0, FRAMES]);
  const [failed, setFailed] = useState(false);
  const [probe, setProbe] = useState<number | null | undefined>(undefined);
  const engine = useRef<RadarEngine | null>(null);
  const overlay = useRef<LT.ImageOverlay | null>(null);
  const pointer = useRef<LT.Point | null>(null);
  const shown = useRef<number | null>(null);
  const listed = useRef<RadarFrame[]>([]);

  useEffect(() => {
    const pane = map.getPane("radarPane") ?? map.createPane("radarPane");
    pane.style.zIndex = "405";
    pane.style.pointerEvents = "none";
    map.attributionControl.addAttribution(ATTRIBUTION);
    const e = new RadarEngine(theme, {
      frames: (f) => {
        const prev = listed.current;
        listed.current = f;
        setFrames(f);
        // Keep the frame on screen across refreshes; a viewer at the newest frame moves on to the new newest.
        setIndex((i) => {
          if (i < 0 || i >= prev.length - 1) return f.length - 1;
          const k = f.findIndex((x) => x.t === prev[i].t);
          return k < 0 ? 0 : k;
        });
      },
      progress: (done, total) => setProgress([done, total]),
      error: setFailed,
    });
    engine.current = e;
    void e.start();
    const move = (ev: LT.LeafletMouseEvent) => {
      pointer.current = L.CRS.EPSG3857.project(ev.latlng);
      if (shown.current != null)
        setProbe(e.valueAt(shown.current, pointer.current.x, pointer.current.y));
    };
    const out = () => {
      pointer.current = null;
      setProbe(undefined);
    };
    map.on("mousemove", move);
    map.on("mouseout", out);
    return () => {
      e.stop();
      engine.current = null;
      map.off("mousemove", move);
      map.off("mouseout", out);
      overlay.current?.remove();
      overlay.current = null;
      map.attributionControl.removeAttribution(ATTRIBUTION);
    };
    // The engine lives as long as the map; the theme is passed on below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, map]);

  useEffect(() => {
    engine.current?.setTheme(theme);
  }, [theme]);

  // Show the current frame.
  const frame = frames[index];
  useEffect(() => {
    const e = engine.current;
    if (!frame || !e?.meta) return;
    shown.current = frame.t;
    if (!overlay.current) {
      const [x0, y0, x1, y1] = e.meta.bbox;
      const bounds = L.latLngBounds(
        L.CRS.EPSG3857.unproject(L.point(x0, y0)),
        L.CRS.EPSG3857.unproject(L.point(x1, y1)),
      );
      overlay.current = L.imageOverlay(frame.url, bounds, {
        pane: "radarPane",
        interactive: false,
        opacity: 0.9,
        className: "lw-radar",
      }).addTo(map);
    } else overlay.current.setUrl(frame.url);
    const p = pointer.current;
    if (p) setProbe(e.valueAt(frame.t, p.x, p.y));
  }, [L, map, frame]);

  // Play: one frame every FRAME_MS, a longer pause on the newest one before it starts again.
  useEffect(() => {
    if (!playing || frames.length < 2 || index < 0) return;
    const last = index >= frames.length - 1;
    const id = window.setTimeout(
      () => setIndex((i) => (i >= frames.length - 1 ? 0 : i + 1)),
      last ? HOLD_MS : FRAME_MS,
    );
    return () => clearTimeout(id);
  }, [playing, index, frames.length]);

  const fmt = timeFmt();
  const newest = frames[frames.length - 1]?.t;
  const age = newest ? Math.max(0, Math.round((Date.now() - newest) / 60_000)) : null;
  const ramp = RAMPS[theme];
  const loading = !frames.length && !failed;
  const label = frame ? fmt.format(frame.t) : "–";

  return (
    <div
      role="group"
      aria-label={pick(
        "Radar ANM: precipitațiile din ultimele 3 ore",
        "ANM radar: precipitation over the last 3 hours",
      )}
      className="absolute right-2.5 bottom-7 z-[500] w-[min(320px,calc(100%-20px))] rounded-lg bg-surface/95 px-2.5 py-2 text-[12px] shadow-card"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={frames.length < 2}
          aria-label={
            playing
              ? pick("Oprește animația radar", "Pause the radar animation")
              : pick("Pornește animația radar", "Play the radar animation")
          }
          className="grid size-7 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-navy hover:bg-surface-2 disabled:opacity-50 dark:text-foreground"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={Math.max(0, index)}
          disabled={frames.length < 2}
          onChange={(ev) => {
            setPlaying(false);
            setIndex(+ev.target.value);
          }}
          aria-label={pick("Ora cadrului radar", "Time of the radar frame")}
          aria-valuetext={label}
          className="h-7 min-w-0 flex-1 accent-[#256abf] dark:accent-[#9ec5f4]"
        />
        <span className="tabular w-[40px] shrink-0 text-right text-[13px] font-semibold">
          {label}
        </span>
      </div>
      <div className="mt-1 flex items-end gap-1.5" aria-hidden>
        <div className="grid flex-1 grid-cols-6 gap-0.5">
          {ramp.map((c, k) => (
            <span key={c} className="grid gap-0.5">
              <span className="h-1.5 rounded-[2px]" style={{ background: c }} />
              <span className="tabular text-[11px] leading-none text-subtle">
                {k === BINS.length - 1 ? `${rateFmt(BINS[k])}+` : rateFmt(BINS[k])}
              </span>
            </span>
          ))}
        </div>
        <span className="text-[11px] leading-none text-subtle">mm/h</span>
      </div>
      <p className="sr-only">
        {pick(
          "Clasele de intensitate încep la 0,1, 0,5, 2, 5, 10 și 25 de milimetri pe oră.",
          "The intensity classes start at 0.1, 0.5, 2, 5, 10 and 25 millimetres per hour.",
        )}
      </p>
      <p className="mt-1.5 leading-[1.35] text-subtle empty:hidden" aria-live="polite">
        {failed
          ? pick(
              "Radarul ANM nu răspunde acum. Încercăm din nou peste câteva minute.",
              "The ANM radar is not responding now. We will try again in a few minutes.",
            )
          : loading
            ? pick(
                `Se încarcă radarul: ${progress[0]} din ${progress[1]} cadre`,
                `Loading the radar: ${progress[0]} of ${progress[1]} frames`,
              )
            : null}
      </p>
      {frames.length ? (
        <p className="mt-1.5 leading-[1.35] text-subtle">
          {probe !== undefined ? (
            probe == null ? (
              pick(
                "Sub cursor: în afara acoperirii radar",
                "Under the cursor: outside radar coverage",
              )
            ) : probe === 0 ? (
              pick("Sub cursor: fără precipitații", "Under the cursor: no precipitation")
            ) : (
              // Above 50 mm/h a reading is more often clutter than rain, so the readout stops there.
              pick(
                `Sub cursor: ${probe > 50 ? "peste 50" : rateFmt(probe)} mm/h`,
                `Under the cursor: ${probe > 50 ? "over 50" : rateFmt(probe)} mm/h`,
              )
            )
          ) : (
            <>
              <a
                href={CATALOG}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                {pick("Precipitații din radarul ANM", "Precipitation from the ANM radar")}
              </a>
              {pick(", ultimele 3 ore, ora României.", ", last 3 hours, Romanian time.")}
              {age != null
                ? pick(` Cel mai nou cadru: acum ${age} min.`, ` Newest frame: ${age} min ago.`)
                : null}
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
