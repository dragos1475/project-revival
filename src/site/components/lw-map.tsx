// Leaflet map of the network for the public site. Leaflet is loaded in an effect, so the component
// prerenders as an empty box. Background: CARTO Voyager (light theme) or Dark Matter (dark theme)
// with the key from runtime-config.js, Esri imagery and relief, or a Natural Earth vector map that
// also stands in while tiles load or when they fail.
import { useEffect, useRef, useState } from "react";
import type * as LT from "leaflet";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/lib/theme";
import { asset, CAT, CAT_ORDER, fmt, photoOf, sheetKey, type Cat, type LwPoint } from "../content/lw";
import { pageHref, useRouter } from "../router";
import { isEn, t } from "../i18n/core";
import { shapeSvg } from "./lw-shapes";

export type BaseName = "osm" | "sat" | "topo" | "vector" | "clc" | "eunis1";
export const BASES: { id: BaseName; label: string }[] = [
  { id: "osm", label: "Hartă" },
  { id: "sat", label: "Satelit" },
  { id: "topo", label: "Relief" },
  { id: "vector", label: "Simplă" },
];
/** Thematic EEA maps offered as backgrounds in the data sheets, with a legend. */
export const THEMATIC_BASES: { id: BaseName; label: string }[] = [
  { id: "clc", label: "CORINE 2018" },
  { id: "eunis1", label: "EUNIS nivel 1" },
];

/** EEA and Copernicus layers served through ArcGIS "export", the sources of the Wetland Restoration Hub. */
export const EEA: Record<string, { label: string; short: string; note: string; url: string; op: number; image?: boolean; legend?: string }> = {
  eunis1: { label: "EUNIS nivel 1 (EEA v2.1)", short: "EUNIS nivel 1", note: "Hartă a ecosistemelor pe clase EUNIS de nivel 1, rezoluție 1 km", url: "https://bio.discomap.eea.europa.eu/arcgis/rest/services/Ecosystem/EcosystemMap_el1_1km_v2_1/MapServer/export", op: 0.7, legend: "eunis1" },
  n2k: { label: "Situri Natura 2000", short: "Situri Natura 2000", note: "SCI/SAC și SPA, baza de date EEA", url: "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer/export", op: 0.6 },
  ecosys: { label: "Tipuri de ecosisteme (EEA v3.1)", short: "Tipuri de ecosisteme", note: "Hartă modelată a ecosistemelor terestre, ~100 m", url: "https://bio.discomap.eea.europa.eu/arcgis/rest/services/Ecosystem/EcosystemTypeMap_v3_1_Terrestrial/MapServer/export", op: 0.65 },
  wet: { label: "Apă și umiditate (HRL 2018)", short: "Apă și umiditate", note: "Copernicus High Resolution Layer, 20 m", url: "https://image.discomap.eea.europa.eu/arcgis/rest/services/GioLandPublic/HRL_WaterWetness_2018/ImageServer/exportImage", op: 0.75, image: true },
  clc: { label: "CORINE Land Cover 2018", short: "CORINE 2018", note: "Utilizarea terenului, 44 de clase", url: "https://image.discomap.eea.europa.eu/arcgis/rest/services/Corine/CLC2018_WM/MapServer/export", op: 0.6, legend: "clc" },
  riparian: { label: "Zone ripariene 2018", short: "Zone ripariene", note: "Copernicus Riparian Zones", url: "https://copernicus.discomap.eea.europa.eu/arcgis/rest/services/RiparianZones/RZ_2018/MapServer/export", op: 0.7 },
  tree: { label: "Densitatea coronamentului (HRL 2018)", short: "Densitatea coronamentului", note: "Copernicus Tree Cover Density", url: "https://image.discomap.eea.europa.eu/arcgis/rest/services/GioLandPublic/HRL_TreeCoverDensity_2018/ImageServer/exportImage", op: 0.7, image: true },
};

const ROMANIA: LT.LatLngBoundsExpression = [
  [43.55, 20.2],
  [48.3, 29.75],
];

type Geo = GeoJSON.GeoJsonObject;
const cache = new Map<string, Promise<unknown>>();
function loadJson<T>(path: string): Promise<T | null> {
  if (!cache.has(path)) cache.set(path, fetch(asset(path)).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(path) as Promise<T | null>;
}

function tileFor(base: BaseName, theme: Theme): { url: string; attr: string; label: string } | null {
  const key = window.LTSER_CONFIG?.cartoKey;
  if (base === "osm")
    return key
      ? { url: `https://basemaps.cartocdn.com/rastertiles/${theme === "dark" ? "dark_all" : "voyager"}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`, attr: "&copy; OpenStreetMap contributors, &copy; CARTO", label: t("Hartă") }
      : null;
  if (base === "sat") return { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: `${t("Imagini")} &copy; Esri, Maxar, Earthstar Geographics`, label: t("Satelit") };
  if (base === "topo") return { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attr: `${t("Hartă")} &copy; Esri ${isEn() ? "and its partners" : "și furnizorii săi"}`, label: t("Relief") };
  return null;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function popupHtml(p: LwPoint) {
  const ph = photoOf(p);
  const en = isEn();
  const facts = [
    p.inat?.species ? `${fmt(p.inat.species)} ${en ? "species on iNaturalist" : "specii pe iNaturalist"}` : null,
    p.n2k?.length ? `${p.n2k.length} ${en ? "Natura 2000 sites" : "situri Natura 2000"}` : null,
    p.ltser ? `${en ? "Network code" : "Cod în rețea"} ${p.ltser.code}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `<div class="lw-pop">${ph ? `<img src="${esc(asset(ph.thumb || ph.src))}" alt="${esc(t(ph.alt))}">` : ""}<div class="lw-pop-tags"><span class="lw-pop-tag">${shapeSvg(p.cat, 13)}${esc(t(CAT[p.cat].one))}</span>${p.ours ? `<span class="lw-pop-tag lw-pop-ours">${esc(t("Operat de UB"))}</span>` : ""}</div><h4>${esc(t(p.ro))}</h4>${facts ? `<p>${esc(facts)}</p>` : ""}<a href="${esc(pageHref(sheetKey(p)))}" data-spa>${esc(t("Deschide fișa sitului"))}</a></div>`;
}

interface LegendEntry {
  l: string;
  l_en?: string;
  img: string;
}

export interface LwMapProps {
  points: LwPoint[];
  className?: string;
  base?: BaseName;
  hiddenCats?: Cat[];
  eea?: string[];
  /** Fit Romania (default) or the given points. */
  fit?: "romania" | "points";
  padTopLeft?: [number, number];
  maxFitZoom?: number;
  /** Permanent name labels, for small overview maps. */
  labels?: boolean;
  markerSize?: number;
  popups?: boolean;
  boundaries?: boolean;
  selected?: LwPoint | null;
  onSelect?: (p: LwPoint) => void;
  /** Wheel zoom: always, never, or after a click on the map. */
  scrollZoom?: "always" | "never" | "click";
  onEea?: (key: string, ok: boolean) => void;
  /** Markers drawn faded (filtered out but kept for context). */
  dimmedKeys?: string[];
  /** Click on the map outside the markers. */
  onMapClick?: (lat: number, lon: number) => void;
  /** Fractional zoom steps, for small maps that must fit an area closely. */
  zoomSnap?: number;
  label: string;
}

interface MapState {
  L: typeof LT;
  map: LT.Map;
  groups: Partial<Record<Cat, LT.FeatureGroup>>;
  vector: LT.LayerGroup | null;
  tiles: LT.TileLayer | null;
  eea: Record<string, LT.Layer>;
  aoi: LT.Rectangle | null;
  pin: LT.CircleMarker | null;
  markers: Map<string, LT.Marker>;
  thematic: LT.Layer | null;
}

export function LwMap(props: LwMapProps) {
  const { points, className, base = "osm", hiddenCats = [], eea = [], fit = "romania", padTopLeft, maxFitZoom = 11, labels, markerSize, popups = true, boundaries = true, selected, onSelect, scrollZoom = "click", onEea, dimmedKeys, onMapClick, zoomSnap = 1, label } = props;
  const el = useRef<HTMLDivElement>(null);
  const st = useRef<MapState | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const theme = useTheme();
  const { navigate } = useRouter();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onEeaRef = useRef(onEea);
  onEeaRef.current = onEea;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const [legend, setLegend] = useState<{ title: string; items: LegendEntry[] } | null>(null);

  // Create the map and the point layers once.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    import("leaflet").then(async (mod) => {
      const L = ((mod as unknown as { default?: typeof LT }).default ?? mod) as typeof LT;
      if (cancelled || !el.current) return;
      const map = L.map(el.current, { zoomControl: false, attributionControl: true, minZoom: 5, maxZoom: 18, zoomSnap, zoomDelta: 1, scrollWheelZoom: scrollZoom === "always" });
      L.control.zoom({ position: "topright", zoomInTitle: t("Mărește"), zoomOutTitle: t("Micșorează") }).addTo(map);
      map.on("click", (e) => onMapClickRef.current?.(+e.latlng.lat.toFixed(4), +e.latlng.lng.toFixed(4)));
      map.attributionControl.setPrefix("Leaflet");
      map.createPane("basePane").style.zIndex = "150";
      map.createPane("boundPane").style.zIndex = "410";
      if (scrollZoom === "click") {
        map.on("click", () => map.scrollWheelZoom.enable());
        map.on("mouseout", () => map.scrollWheelZoom.disable());
      }
      map.on("popupopen", (e) => {
        e.popup
          .getElement()
          ?.querySelectorAll<HTMLAnchorElement>("a[data-spa]")
          .forEach((a) =>
            a.addEventListener("click", (ev) => {
              if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
              ev.preventDefault();
              navigate(a.getAttribute("href")!);
            }),
          );
      });

      const shapes = (await loadJson<Record<string, Geo>>("data/lw-boundaries.json")) ?? {};
      if (cancelled) {
        map.remove();
        return;
      }
      const groups: MapState["groups"] = {};
      const markers = new Map<string, LT.Marker>();
      for (const p of points) {
        const g = (groups[p.cat] ??= L.featureGroup());
        const shape = shapes[p.key];
        if (shape && boundaries) {
          const c = CAT[p.cat].color;
          L.geoJSON(shape, { pane: "boundPane", bubblingMouseEvents: false, style: { color: c, weight: 1.6, fillColor: c, fillOpacity: 0.1, dashArray: p.cat === "ltser" ? undefined : "4 3" } })
            .bindTooltip(esc(t(p.ro)), { sticky: true, className: "lw-label" })
            .on("click", () => onSelectRef.current?.(p))
            .addTo(g);
        }
        const size = markerSize ?? (p.cat === "statiune" ? 24 : 18);
        const m = L.marker([p.lat, p.lon], {
          icon: L.divIcon({ className: "lw-marker", html: shapeSvg(p.cat, size), iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
          title: t(p.ro),
          alt: t(p.ro),
          riseOnHover: true,
          zIndexOffset: p.cat === "statiune" ? 1000 : 0,
          keyboard: true,
        });
        if (popups && !onSelectRef.current) m.bindPopup(popupHtml(p), { maxWidth: 280 });
        if (labels) m.bindTooltip(esc(t(p.short || p.ro)), { permanent: true, direction: "right", offset: [10, 0], className: "lw-label" });
        else m.bindTooltip(esc(t(p.ro)), { direction: "top", offset: [0, -8], className: "lw-label" });
        m.on("click", () => onSelectRef.current?.(p));
        m.addTo(g);
        markers.set(p.key, m);
      }

      if (fit === "points" && points.length) {
        const b = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
        for (const p of points) if (shapes[p.key] && boundaries) b.extend(L.geoJSON(shapes[p.key]).getBounds());
        if (points.length === 1) map.setView([points[0].lat, points[0].lon], 10);
        else map.fitBounds(b.pad(0.25), { maxZoom: maxFitZoom });
      } else {
        map.fitBounds(ROMANIA, { paddingTopLeft: padTopLeft && window.innerWidth >= 768 ? padTopLeft : [0, 0] });
      }
      st.current = { L, map, groups, vector: null, tiles: null, eea: {}, aoi: null, pin: null, markers, thematic: null };
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(el.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      st.current?.map.remove();
      st.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Category filter.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    for (const cat of CAT_ORDER) {
      const g = s.groups[cat];
      if (!g) continue;
      if (hiddenCats.includes(cat)) s.map.removeLayer(g);
      else g.addTo(s.map);
    }
  }, [ready, hiddenCats.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Faded markers.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    const dim = new Set(dimmedKeys ?? []);
    for (const [key, m] of s.markers) m.setOpacity(dim.has(key) ? 0.15 : 1);
  }, [ready, (dimmedKeys ?? []).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vector background, redrawn for the theme.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    let cancelled = false;
    loadJson<{ countries: Geo; counties: Geo; lakes: Geo; rivers: Geo }>("data/lw-basemap.json").then((B) => {
      if (cancelled || !B || !st.current) return;
      const { L, map } = st.current;
      if (st.current.vector) map.removeLayer(st.current.vector);
      const dark = theme === "dark";
      const renderer = L.canvas({ pane: "basePane" });
      const g = L.layerGroup();
      // GeoJSON passes its options to the path layers, which accept a renderer.
      const base = (o: LT.GeoJSONOptions) => ({ pane: "basePane", interactive: false, renderer, ...o }) as LT.GeoJSONOptions;
      L.geoJSON(B.countries, base({
        style: (f) => (f?.properties?.ro ? { color: dark ? "#5d8496" : "#6E8B99", weight: 1.6, fillColor: dark ? "#123246" : "#F7F9F6", fillOpacity: 1 } : { color: dark ? "#2c5a6e" : "#A9BCC5", weight: 1, fillColor: dark ? "#0c2534" : "#E9EEEC", fillOpacity: 1 }),
      })).addTo(g);
      L.geoJSON(B.counties, base({ style: { color: dark ? "#24485b" : "#C9D5D0", weight: 0.8, fill: false } })).addTo(g);
      L.geoJSON(B.lakes, base({ style: { color: dark ? "#3e7f9c" : "#8DB8CC", weight: 0.6, fillColor: dark ? "#1d5770" : "#BBD7E4", fillOpacity: 1 } })).addTo(g);
      L.geoJSON(B.rivers, base({ style: (f) => ({ color: dark ? "#4f8fac" : "#6FA4BD", weight: f?.properties?.n === "Danube" ? 2.6 : 1.2, opacity: 0.9 }) })).addTo(g);
      g.addTo(map);
      st.current.vector = g;
      if (!map.attributionControl.getContainer()?.textContent?.includes("Natural Earth")) map.attributionControl.addAttribution("Natural Earth");
    });
    return () => {
      cancelled = true;
    };
  }, [ready, theme]);

  // Tile background.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    if (s.tiles) {
      s.map.removeLayer(s.tiles);
      s.tiles = null;
    }
    if (s.thematic) {
      s.map.removeLayer(s.thematic);
      s.thematic = null;
    }
    setStatus(null);
    setLegend(null);
    const thematic = EEA[base];
    if (thematic) {
      const layer = eeaLayer(s, thematic.url, 0.9, (ok) => {
        if (!ok) setStatus(isEn() ? `The “${t(thematic.label)}” map comes from the EEA servers and cannot be loaded now. The simple map is still available.` : `Harta „${thematic.label}” vine de la serverele EEA și nu se poate încărca acum. Harta simplă rămâne disponibilă.`);
      });
      layer.addTo(s.map);
      s.thematic = layer;
      if (!s.map.attributionControl.getContainer()?.textContent?.includes("EEA")) s.map.attributionControl.addAttribution("© EEA / Copernicus Land Monitoring Service");
      if (thematic.legend) {
        let gone = false;
        loadJson<Record<string, LegendEntry[]>>("data/lw-legends.json").then((all) => {
          const items = all?.[thematic.legend!];
          if (!gone && items) setLegend({ title: t(thematic.label), items });
        });
        return () => {
          gone = true;
        };
      }
      return;
    }
    const cfg = tileFor(base, theme);
    if (!cfg) {
      if (base === "osm") setStatus(t("Fundalul „Hartă” are nevoie de cheia CARTO din runtime-config.js. Harta simplă rămâne disponibilă."));
      return;
    }
    let ok = false;
    let errors = 0;
    const layer = s.L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: 19 });
    layer.on("tileload", () => {
      ok = true;
      setStatus(null);
    });
    layer.on("tileerror", () => {
      errors += 1;
      if (!ok && errors > 4) {
        setStatus(isEn() ? `The “${cfg.label}” background cannot be loaded now. The simple map is still available.` : `Fundalul „${cfg.label}” nu se poate încărca acum. Harta simplă rămâne disponibilă.`);
        s.map.removeLayer(layer);
      }
    });
    layer.addTo(s.map);
    s.tiles = layer;
  }, [ready, base, theme]);

  // EEA and Copernicus overlays.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    const { map } = s;
    for (const key of Object.keys(s.eea)) {
      if (!eea.includes(key)) {
        map.removeLayer(s.eea[key]);
        delete s.eea[key];
      }
    }
    for (const key of eea) {
      if (s.eea[key] || !EEA[key]) continue;
      const cfg = EEA[key];
      const group = eeaLayer(s, cfg.url, cfg.op, (ok) => onEeaRef.current?.(key, ok));
      group.addTo(map);
      s.eea[key] = group;
    }
  }, [ready, eea.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selected site: dashed analysis box.
  useEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    if (s.aoi) {
      s.map.removeLayer(s.aoi);
      s.aoi = null;
    }
    if (s.pin) {
      s.map.removeLayer(s.pin);
      s.pin = null;
    }
    if (!selected) return;
    const [south, west, north, east] = selected.aoi;
    s.aoi = s.L.rectangle(
      [
        [south, west],
        [north, east],
      ],
      { color: "#B9E27A", weight: 2, dashArray: "6 4", fill: false, interactive: false },
    ).addTo(s.map);
    if (selected.custom) {
      s.pin = s.L.circleMarker([selected.lat, selected.lon], { radius: 8, color: "#fff", weight: 2, fillColor: "#C0392B", fillOpacity: 1, interactive: false }).addTo(s.map);
      s.map.setView([selected.lat, selected.lon], Math.max(s.map.getZoom(), 10), { animate: false });
    } else {
      s.map.fitBounds(s.aoi.getBounds().pad(0.3), { maxZoom: maxFitZoom, animate: false });
    }
  }, [ready, selected?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("relative isolate overflow-hidden bg-[#dce8ee] dark:bg-[#0c2534]", className)}>
      <div ref={el} role="region" aria-label={label} className="absolute inset-0" />
      {status ? <div className="absolute top-3 right-14 z-[500] max-w-[300px] rounded-lg bg-surface/95 px-2.5 py-1.5 text-[12px] text-subtle shadow-card">{status}</div> : null}
      {legend ? (
        <details open className="absolute right-2.5 bottom-6 z-[500] max-h-[calc(100%-60px)] max-w-[260px] overflow-auto rounded-lg bg-surface/95 px-2.5 py-2 text-[12px] shadow-card max-sm:[&:not([open])]:w-fit">
          <summary className="cursor-pointer font-semibold">{isEn() ? "Legend" : "Legendă"} · {legend.title}</summary>
          <ul className="mt-1.5 grid gap-1">
            {legend.items.map((e) => (
              <li key={e.l} className="flex items-center gap-2">
                <img src={e.img} alt="" width={16} height={16} className="size-4 shrink-0 rounded-[3px]" />
                <span>{isEn() && e.l_en ? e.l_en : e.l}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** An EEA ArcGIS "export" image that follows the map view. */
function eeaLayer(s: MapState, url: string, opacity: number, onResult: (ok: boolean) => void) {
  const { L, map } = s;
  const img = L.imageOverlay("data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", map.getBounds(), { opacity, interactive: false });
  const refresh = () => {
    const b = map.getBounds();
    const size = map.getSize();
    const sw = L.CRS.EPSG3857.project(b.getSouthWest());
    const ne = L.CRS.EPSG3857.project(b.getNorthEast());
    img.setUrl(`${url}?bbox=${[sw.x, sw.y, ne.x, ne.y].map(Math.round).join(",")}&bboxSR=3857&imageSR=3857&size=${size.x},${size.y}&format=png32&transparent=true&f=image`);
    img.setBounds(b);
  };
  const group = L.layerGroup([img]);
  img.on("load", () => onResult(true));
  img.on("error", () => onResult(false));
  group.on("add", () => {
    map.on("moveend", refresh);
    refresh();
  });
  group.on("remove", () => map.off("moveend", refresh));
  return group;
}

/** Segmented choice of the map background. */
export function BaseSwitch({ value, onChange, className, floating, thematic }: { value: BaseName; onChange: (b: BaseName) => void; className?: string; floating?: boolean; thematic?: boolean }) {
  return (
    <div role="group" aria-label="Fundalul hărții" className={cn("flex flex-wrap gap-1.5", className)}>
      {(thematic ? [...BASES, ...THEMATIC_BASES] : BASES).map((b) => (
        <button
          key={b.id}
          type="button"
          aria-pressed={value === b.id}
          onClick={() => onChange(b.id)}
          className={cn(
            "h-8 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-semibold text-navy transition-colors hover:bg-surface-2 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white dark:text-foreground dark:aria-pressed:border-lime dark:aria-pressed:bg-lime dark:aria-pressed:text-navy",
            floating && "shadow-[0_1px_4px_rgba(0,0,0,0.2)]",
          )}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
