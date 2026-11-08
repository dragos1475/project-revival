// SVG atlas of Romania's LTSER platforms, the four research stations and the monitoring networks.
// The frame and the stations render on the server; polygons and network sites load in the browser.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NETWORKS } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks, type AreaCollection, type Networks } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { STATIONS } from "../content/stations";
import { PLATFORMS } from "../content/platforms";
import { useRouter, pageHref } from "../router";
import { BasemapSvg } from "@/components/map/basemap-svg";

// Equirectangular projection scaled by cos(46°N), the same scale on both axes.
const BOX = { w: 20.1, e: 29.9, s: 43.5, n: 48.4 };
const COS = Math.cos((46 * Math.PI) / 180);
export const ATLAS_W = 600;
const SCALE = ATLAS_W / ((BOX.e - BOX.w) * COS);
export const ATLAS_H = Math.round((BOX.n - BOX.s) * SCALE);
const project = (lon: number, lat: number): [number, number] => [(lon - BOX.w) * COS * SCALE, (BOX.n - lat) * SCALE];

const SHOWN_NETWORKS = new Set(["ws", "ec"]);

function useAtlasData() {
  const [data, setData] = useState<{ areas: AreaCollection; networks: Networks } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([loadLtserAreas(), loadNetworks()]).then(([areas, networks]) => live && setData({ areas, networks }), () => undefined);
    return () => {
      live = false;
    };
  }, []);
  return data;
}

export function Atlas({ highlight, focusStation, showNetworks = true, className, interactive = true }: { highlight?: number; focusStation?: string; showNetworks?: boolean; className?: string; interactive?: boolean }) {
  const data = useAtlasData();
  const { navigate } = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const paths = useMemo(
    () =>
      (data?.areas.features ?? []).map((f) => {
        const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates as [number, number][][]] : (f.geometry.coordinates as [number, number][][][]);
        const d = polys.map((p) => p.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${project(x, y).map((v) => v.toFixed(1)).join(" ")}`).join(" ") + "Z").join(" ")).join(" ");
        const id = Number(f.properties.natcode);
        return { id, d, platform: PLATFORMS.find((p) => p.explorerId === id) ?? null };
      }),
    [data],
  );
  const sites = useMemo(
    () => (showNetworks && data ? NETWORKS.filter((n) => SHOWN_NETWORKS.has(n.id)).flatMap((n) => data.networks[n.id].features.map((f) => ({ n, f }))) : []),
    [data, showNetworks],
  );

  const hovered = hover?.startsWith("p:") ? PLATFORMS.find((p) => p.slug === hover.slice(2)) : null;
  const hoveredStation = hover?.startsWith("s:") ? STATIONS.find((s) => s.slug === hover.slice(2)) : null;

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${ATLAS_W} ${ATLAS_H}`} className="block size-full" role="img" aria-label="Harta României cu platformele LTSER și stațiile de cercetare">
        <BasemapSvg />
        {[21, 22, 23, 24, 25, 26, 27, 28, 29].map((lon) => {
          const [x] = project(lon, 46);
          return <line key={`x${lon}`} x1={x} x2={x} y1={0} y2={ATLAS_H} className="stroke-foreground/[0.06]" strokeWidth={1} />;
        })}
        {[44, 45, 46, 47, 48].map((lat) => {
          const [, y] = project(25, lat);
          return (
            <g key={`y${lat}`}>
              <line x1={0} x2={ATLAS_W} y1={y} y2={y} className="stroke-foreground/[0.06]" strokeWidth={1} />
              <text x={6} y={y - 4} className="fill-subtle font-mono text-[9px]">{lat}°N</text>
            </g>
          );
        })}

        {paths.map((p, i) => {
          const active = highlight === undefined || highlight === p.id;
          const isHover = hover === `p:${p.platform?.slug}`;
          return (
            <motion.path
              key={p.id}
              d={p.d}
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 1 : 0.35 }}
              transition={{ delay: 0.06 * i, duration: 0.45 }}
              className={cn("transition-[fill] duration-200", active ? "fill-brand-green/15 stroke-brand-green" : "fill-subtle/10 stroke-subtle/60", isHover && "fill-brand-green/30", interactive && p.platform && "cursor-pointer")}
              strokeWidth={highlight === p.id ? 1.8 : 1.2}
              strokeLinejoin="round"
              onMouseEnter={interactive && p.platform ? () => setHover(`p:${p.platform!.slug}`) : undefined}
              onMouseLeave={interactive ? () => setHover(null) : undefined}
              onClick={interactive && p.platform ? () => navigate(pageHref(`platforme/${p.platform!.slug}`)) : undefined}
            >
              {p.platform ? <title>{p.platform.name}</title> : null}
            </motion.path>
          );
        })}

        {sites.map(({ n, f }, i) => {
          const [x, y] = project(...f.geometry.coordinates);
          return (
            <motion.circle
              key={`${n.id}-${f.properties.name}`}
              cx={x}
              cy={y}
              r={n.id === "ec" ? 4 : 3.5}
              fill={n.color}
              className="stroke-surface"
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: highlight === undefined ? 0.9 : 0.55 }}
              transition={{ delay: 0.35 + i * 0.01 }}
              pointerEvents="none"
            />
          );
        })}

        {STATIONS.map((s) => {
          const [x, y] = project(...s.lonLat);
          const focused = focusStation === s.slug;
          const dim = focusStation !== undefined && !focused;
          const left = s.lonLat[0] > 28.5;
          const label = (
            <g className={cn("transition-opacity", dim && "opacity-40")}>
              {focused ? <circle cx={x} cy={y} r={13} className="fill-brand-orange/15 stroke-brand-orange/50" strokeWidth={1} /> : null}
              <circle cx={x} cy={y} r={6.5} className="fill-brand-orange stroke-surface" strokeWidth={2.5} />
              <circle cx={x} cy={y} r={2.2} className="fill-surface" />
              <text x={left ? x - 12 : x + 12} y={y + 4} textAnchor={left ? "end" : "start"} className="fill-foreground text-[12px] font-medium" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4, strokeLinejoin: "round" }}>
                {s.short}
              </text>
            </g>
          );
          return interactive ? (
            <a key={s.slug} href={pageHref(`statiuni/${s.slug}`)} onClick={(e) => { e.preventDefault(); navigate(pageHref(`statiuni/${s.slug}`)); }} onMouseEnter={() => setHover(`s:${s.slug}`)} onMouseLeave={() => setHover(null)} aria-label={s.name}>
              {label}
            </a>
          ) : (
            <g key={s.slug}>{label}</g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hovered || hoveredStation ? (
          <motion.div
            key={hover}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-none absolute top-3 left-3 max-w-[260px] rounded-[10px] border border-border-strong bg-surface/95 px-3 py-2 shadow-float backdrop-blur"
          >
            <p className="text-[11px] text-subtle">{hovered ? `Platformă LTSER · ${hovered.kind}` : `Stație de cercetare · din ${hoveredStation!.founded}`}</p>
            <p className="text-[13px] font-medium">{hovered ? hovered.name : hoveredStation!.name}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AtlasLegend({ showNetworks = true }: { showNetworks?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
      <li className="inline-flex items-center gap-1.5">
        <span className="grid size-3 place-items-center rounded-full bg-brand-orange"><span className="size-1 rounded-full bg-surface" /></span>
        Stații de cercetare
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] border border-brand-green bg-brand-green/15" />
        Platforme LTSER
      </li>
      {showNetworks
        ? NETWORKS.filter((n) => SHOWN_NETWORKS.has(n.id)).map((n) => (
            <li key={n.id} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: n.color }} />
              {n.ro}
            </li>
          ))
        : null}
    </ul>
  );
}
