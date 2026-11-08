// React shell around Leaflet. Reproduces the ltser map setup (base map or imagery, labels,
// overlays, legend, scale, reset view) with design-system controls rendered as React.
import { useEffect, useRef, useState, type ReactNode } from "react";
import L from "leaflet";
import { AnimatePresence, motion } from "motion/react";
import { Expand, Home, Layers, Minimize, Minus, Plus } from "lucide-react";
import { basemapAttribution, CONFIG } from "@/lib/config";
import { ROMANIA_BOUNDS, ROMANIA_CENTER } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { Legend, type LegendSpec } from "./legend";
import type { OverlaySpec } from "./layers";

export interface AtlasMapProps {
  className?: string;
  caption?: { title: string; sub?: string } | null;
  busy?: boolean;
  legend?: LegendSpec | null;
  overlays?: OverlaySpec[];
  onReady?: (map: L.Map) => void;
  minZoom?: number;
  maxZoom?: number;
  children?: ReactNode;
}


function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip content={label} side="left">
      <button type="button" aria-label={label} onClick={onClick} className="grid size-8 place-items-center text-muted transition-colors hover:bg-surface-2 hover:text-foreground [&_svg]:size-3.5">
        {children}
      </button>
    </Tooltip>
  );
}

export function AtlasMap({ className, caption, busy, legend, overlays = [], onReady, minZoom = 6, maxZoom = 12, children }: AtlasMapProps) {
  const { t } = useI18n();
  const dark = useDarkMode();
  const wrapRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const baseRef = useRef<Record<"light" | "dark" | "imagery" | "lightLabels" | "darkLabels", L.TileLayer> | null>(null);
  const [base, setBase] = useState<"map" | "imagery">("map");
  const [labelsOn, setLabelsOn] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const homeRef = useRef<{ center: L.LatLngExpression; zoom: number }>({ center: ROMANIA_CENTER, zoom: 6.5 });
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  // Create the map once the container has its real size. A map created while the layout is still
  // settling (0 px, or the width of an intermediate frame) starts from the wrong zoom, and every later
  // resize then shifts its centre. Resizes keep the centre fixed, and the view can never leave Romania.
  useEffect(() => {
    const el = elRef.current!;
    let m: L.Map | null = null;

    const create = () => {
      const narrow = el.clientWidth < 560;
      const zoom = narrow ? 5.4 : 6.5;
      homeRef.current = { center: ROMANIA_CENTER, zoom };
      const bounds = L.latLngBounds(ROMANIA_BOUNDS);
      const map = L.map(el, {
        minZoom: narrow ? Math.min(minZoom, 5) : minZoom,
        maxZoom,
        zoomControl: false,
        zoomSnap: 0.25,
        wheelPxPerZoomLevel: 90,
        maxBounds: bounds.pad(0.04),
        maxBoundsViscosity: 1,
      }).setView(ROMANIA_CENTER, zoom);
      // Safety net: if anything still moves the view far outside Romania, go back to the start view.
      const limits = bounds.pad(0.5);
      map.on("moveend", () => {
        if (!limits.contains(map.getCenter())) map.setView(homeRef.current.center, homeRef.current.zoom, { animate: false });
      });
      map.attributionControl.setPrefix(false);
      map.createPane("ltserPane").style.zIndex = "405";
      map.createPane("unitsPane").style.zIndex = "410";
      map.createPane("rasterPane").style.zIndex = "420";
      const labelsPane = map.createPane("labelsPane");
      labelsPane.style.zIndex = "450";
      labelsPane.style.pointerEvents = "none";
      // One layer per theme. Switching themes swaps layers instead of calling setUrl(): Leaflet's
      // redraw() after setUrl() requests tiles at the fractional zoom (6.5), the tile server reads it
      // as 6, and the map showed Indonesia instead of Romania in dark mode.
      const opts = { maxNativeZoom: CONFIG.cartoKey ? 19 : 16, maxZoom: 19 };
      baseRef.current = {
        light: L.tileLayer(CONFIG.basemaps.light, { ...opts, attribution: basemapAttribution(CONFIG.basemaps.light) }),
        dark: L.tileLayer(CONFIG.basemaps.dark, { ...opts, attribution: basemapAttribution(CONFIG.basemaps.dark) }),
        imagery: L.tileLayer(CONFIG.basemaps.imagery, { maxNativeZoom: 18, maxZoom: 19, attribution: basemapAttribution(CONFIG.basemaps.imagery) }),
        lightLabels: L.tileLayer(CONFIG.basemaps.lightLabels, { ...opts, pane: "labelsPane" }),
        darkLabels: L.tileLayer(CONFIG.basemaps.darkLabels, { ...opts, pane: "labelsPane" }),
      };
      L.control.scale({ position: "bottomright", metric: true, imperial: false }).addTo(map);
      (el as HTMLDivElement & { atlasMap?: L.Map }).atlasMap = map;
      setMap(map);
      readyRef.current?.(map);
      return map;
    };

    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      if (!m) m = create();
      else m.invalidateSize({ pan: true });
    });
    ro.observe(el);
    if (el.clientWidth && el.clientHeight) m = create();
    return () => {
      ro.disconnect();
      m?.remove();
      baseRef.current = null;
    };
  }, [minZoom, maxZoom]);

  // Base map and labels follow the theme and the layer menu; imagery is the same in both themes.
  useEffect(() => {
    const b = baseRef.current;
    if (!map || !b) return;
    const baseLayer = base === "imagery" ? b.imagery : dark ? b.dark : b.light;
    const labels = labelsOn ? (dark ? b.darkLabels : b.lightLabels) : null;
    for (const layer of [b.light, b.dark, b.imagery]) if (layer !== baseLayer && map.hasLayer(layer)) map.removeLayer(layer);
    for (const layer of [b.lightLabels, b.darkLabels]) if (layer !== labels && map.hasLayer(layer)) map.removeLayer(layer);
    if (!map.hasLayer(baseLayer)) baseLayer.addTo(map).bringToBack();
    if (labels && !map.hasLayer(labels)) labels.addTo(map);
  }, [map, dark, base, labelsOn]);

  // Overlays: add the visible ones, remove the rest (also when a spec's layer is replaced).
  const mounted = useRef(new Map<string, L.Layer>());
  useEffect(() => {
    if (!map) return;
    const want = new Map<string, L.Layer>();
    for (const o of overlays) if (visible[o.id] ?? o.defaultVisible ?? true) want.set(o.id, o.layer);
    for (const [id, layer] of mounted.current) {
      if (want.get(id) !== layer) {
        map.removeLayer(layer);
        mounted.current.delete(id);
      }
    }
    for (const [id, layer] of want) {
      if (!mounted.current.has(id)) {
        layer.addTo(map);
        mounted.current.set(id, layer);
      }
    }
  }, [map, overlays, visible]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === wrapRef.current);
      setTimeout(() => map?.invalidateSize(), 80);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [map]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={wrapRef} className={cn("relative isolate overflow-hidden rounded-[10px] bg-surface-2", fullscreen && "rounded-none", className)}>
      <div ref={elRef} className="absolute inset-0" />

      {caption ? (
        <div className="pointer-events-none absolute top-3 left-3 z-[1000] max-w-[calc(100%-140px)] rounded-lg border border-border bg-surface/90 px-2.5 py-1.5 shadow-float backdrop-blur">
          <p className="truncate text-xs font-medium text-foreground">{caption.title}</p>
          {caption.sub ? <p className="tabular truncate text-[11px] text-muted">{caption.sub}</p> : null}
        </div>
      ) : null}

      <AnimatePresence>
        {busy ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-none absolute top-3 left-1/2 z-[1000] -translate-x-1/2"
          >
            <span className="inline-flex items-center gap-2 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background shadow-float">
              <span className="size-2.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
              {t("ui.loading")}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="absolute top-3 right-3 z-[1000]">
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface/90 px-2.5 text-xs font-medium text-foreground shadow-float backdrop-blur transition-colors hover:bg-surface">
              <Layers className="size-3.5" strokeWidth={1.75} />
              {t("map.layers")}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <p className="px-2 pt-1.5 pb-1 text-[11px] font-medium text-subtle">{t("map.base")}</p>
            {(["map", "imagery"] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={base === b}
                onClick={() => setBase(b)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-2"
              >
                {b === "map" ? t("map.light") : t("map.imagery")}
                <span className={cn("size-3.5 rounded-full border border-border-strong", base === b && "border-[4px] border-accent")} />
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <p className="px-2 pt-1 pb-1 text-[11px] font-medium text-subtle">{t("map.overlays")}</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2">
              <Checkbox checked={labelsOn} onCheckedChange={setLabelsOn} />
              <span className="size-3.5" />
              {t("map.labels")}
            </label>
            {overlays.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-2">
                <Checkbox checked={visible[o.id] ?? o.defaultVisible ?? true} onCheckedChange={(v) => setVisible((s) => ({ ...s, [o.id]: v }))} />
                {o.glyph ? <span className="inline-flex size-3.5" dangerouslySetInnerHTML={{ __html: o.glyph }} /> : <span className="size-3.5" />}
                <span className="truncate">{o.label}</span>
              </label>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {legend ? <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex max-h-[70%] flex-col justify-end">{<Legend spec={legend} />}</div> : null}

      <div className="absolute right-3 bottom-12 z-[1000] grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface/90 shadow-float backdrop-blur">
        <ControlButton label={t("map.zoomIn")} onClick={() => map?.zoomIn()}><Plus strokeWidth={1.75} /></ControlButton>
        <ControlButton label={t("map.zoomOut")} onClick={() => map?.zoomOut()}><Minus strokeWidth={1.75} /></ControlButton>
        <ControlButton label={t("map.reset")} onClick={() => map?.flyTo(homeRef.current.center, homeRef.current.zoom, { duration: 0.6 })}><Home strokeWidth={1.75} /></ControlButton>
        <ControlButton label={fullscreen ? t("ui.exitFullscreen") : t("ui.fullscreen")} onClick={toggleFullscreen}>
          {fullscreen ? <Minimize strokeWidth={1.75} /> : <Expand strokeWidth={1.75} />}
        </ControlButton>
      </div>

      {children}
    </div>
  );
}
