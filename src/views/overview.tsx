// Overview: what the explorer covers, live service state, latest network reading and the six areas.
import { useMemo } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Database, RadioTower, Satellite, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LTSER_AREAS, LTSER_AREA_META, NETWORKS } from "@/lib/catalog";
import { areaKm2, featureContains, loadLtserAreas, loadNetworks, type AreaCollection, type Networks } from "@/lib/geo";
import { AREA_PHOTOS, photoSrc, photoSrcSet } from "@/lib/photos";
import { fmtInt, fmtNum, fmtWall } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { useBackend } from "@/hooks/use-backend";
import { hashFor } from "@/hooks/use-route";
import { isMac } from "@/hooks/use-media";
import { openCommandMenu } from "@/components/command-menu";
import { ltser } from "@/api/ltser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd, Skeleton, StatusDot } from "@/components/ui/misc";
import { Photo } from "@/components/ui/photo";
import { Tooltip } from "@/components/ui/tooltip";
import type { ViewProps } from "@/explorer-routes";
import { BasemapSvg } from "@/components/map/basemap-svg";

// Equirectangular projection scaled by cos(46°N), the same scale on both axes.
const BOX = { w: 20.1, e: 29.9, s: 43.5, n: 48.4 };
const COS = Math.cos((46 * Math.PI) / 180);
const W = 600;
const SCALE = W / ((BOX.e - BOX.w) * COS);
const H = Math.round((BOX.n - BOX.s) * SCALE);
const project = (lon: number, lat: number): [number, number] => [(lon - BOX.w) * COS * SCALE, (BOX.n - lat) * SCALE];

function AtlasIllustration({ areas, networks }: { areas: AreaCollection; networks: Networks }) {
  const { L } = useI18n();
  const paths = useMemo(
    () =>
      areas.features.map((f) => {
        const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates as [number, number][][]] : (f.geometry.coordinates as [number, number][][][]);
        const d = polys.map((p) => p.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${project(x, y).map((v) => v.toFixed(1)).join(" ")}`).join(" ") + "Z").join(" ")).join(" ");
        return { id: f.properties.natcode, d, c: project(...f.centroid) };
      }),
    [areas],
  );
  const lons = [21, 22, 23, 24, 25, 26, 27, 28, 29];
  const lats = [44, 45, 46, 47, 48];
  const points = NETWORKS.flatMap((n) => (n.id === "ws" || n.id === "ec" || n.id === "co" ? networks[n.id].features.map((f) => ({ n, f })) : []));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label="LTSER">
      <BasemapSvg />
      {lons.map((lon) => {
        const [x] = project(lon, 46);
        return <line key={`x${lon}`} x1={x} x2={x} y1={0} y2={H} className="stroke-foreground/[0.06]" strokeWidth={1} />;
      })}
      {lats.map((lat) => {
        const [, y] = project(25, lat);
        return (
          <g key={`y${lat}`}>
            <line x1={0} x2={W} y1={y} y2={y} className="stroke-foreground/[0.06]" strokeWidth={1} />
            <text x={6} y={y - 4} className="fill-subtle font-mono text-[9px]">{lat}°N</text>
          </g>
        );
      })}
      {paths.map((p, i) => (
        <motion.path
          key={p.id}
          d={p.d}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 * i, duration: 0.5 }}
          className="fill-accent/15 stroke-accent"
          strokeWidth={1.2}
          strokeLinejoin="round"
        >
          <title>{L(LTSER_AREAS[Number(p.id)])}</title>
        </motion.path>
      ))}
      {points.map(({ n, f }, i) => {
        const [x, y] = project(...f.geometry.coordinates);
        return (
          <motion.circle
            key={`${n.id}-${f.properties.name}-${i}`}
            cx={x}
            cy={y}
            r={n.id === "ws" ? 6 : 7}
            fill={n.color}
            className="stroke-surface"
            strokeWidth={2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 + i * 0.012 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <title>{`${f.properties.name} · ${f.properties.locality}`}</title>
          </motion.circle>
        );
      })}
    </svg>
  );
}

function ServiceRow({ name, label }: { name: "lifewatch" | "ltser"; label: string }) {
  const { t } = useI18n();
  const s = useBackend(name);
  return (
    <li className="flex items-center gap-3 py-2.5">
      <StatusDot mode={s.mode} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="tabular truncate text-[11px] text-subtle">{s.baseUrl}</p>
      </div>
      <div className="text-right">
        <p className={cn("text-xs font-medium", s.mode === "live" ? "text-accent" : s.mode === "demo" ? "text-warning" : "text-subtle")}>{t(`source.${s.mode}`)}</p>
        <p className="tabular text-[11px] text-subtle">{s.latencyMs !== null ? `${s.latencyMs} ms` : s.reason ? t(`about.reason.${s.reason}`) : ""}</p>
      </div>
    </li>
  );
}

function LatestReading() {
  const { t } = useI18n();
  const { data, loading } = useAsync(async () => {
    const range = await ltser.meteoRange("hourly", "tmean_01h");
    const rows = (await ltser.meteoSnapshot("hourly", "tmean_01h", range.latest)).filter((r) => r.value !== null) as { id: string; value: number }[];
    return { time: range.latest, rows: rows.sort((a, b) => a.value - b.value) };
  }, []);
  if (loading && !data) return <Skeleton className="h-28" />;
  if (!data?.rows.length) return <p className="text-xs text-muted">{t("overview.noReading")}</p>;
  const vals = data.rows.map((r) => r.value);
  const lo = vals[0];
  const hi = vals[vals.length - 1];
  const median = vals[Math.floor(vals.length / 2)];
  const span = hi - lo || 1;
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline gap-2">
        <span className="tabular text-3xl font-semibold tracking-tight">{fmtNum(median, 1)}</span>
        <span className="text-xs text-muted">°C · {t("overview.median")}</span>
      </div>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        {data.rows.map((r, i) => (
          <Tooltip key={r.id} content={`${r.id} · ${fmtNum(r.value, 1)} °C`}>
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-surface"
              style={{ left: `${((r.value - lo) / span) * 100}%` }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="tabular flex justify-between text-[11px] text-subtle">
        <span>min {fmtNum(lo, 1)}</span>
        <span>{fmtWall(data.time)} UTC</span>
        <span>max {fmtNum(hi, 1)}</span>
      </div>
    </div>
  );
}

export default function Overview(_: ViewProps) {
  const { t, L } = useI18n();
  const { data } = useAsync(() => Promise.all([loadLtserAreas(), loadNetworks()]), []);
  const [areas, networks] = data ?? [];

  const areaStats = useMemo(() => {
    if (!areas || !networks) return new Map<string, { km2: number; stations: number }>();
    return new Map(
      areas.features.map((f) => [
        f.properties.natcode,
        {
          km2: areaKm2(f.geometry),
          stations: [...networks.ws.features, ...networks.ec.features].filter((s) => featureContains(f, s.geometry.coordinates[0], s.geometry.coordinates[1])).length,
        },
      ]),
    );
  }, [areas, networks]);

  const modules = [
    { icon: Satellite, title: t("nav.rs"), body: t("overview.mod.rs"), href: "teledetectie/national" },
    { icon: RadioTower, title: t("nav.net"), body: t("overview.mod.net"), href: "retele/meteo" },
    { icon: Database, title: t("nav.platform"), body: t("overview.mod.platform"), href: "platforma/statii" },
    { icon: Users, title: t("nav.social"), body: t("overview.mod.social"), href: "social" },
  ];

  // Gallery placement: Delta tall on the left, Retezat wide, two mountains, two lowland areas.
  const gallery: { id: number; cls: string; ratio: string }[] = [
    { id: 1, cls: "md:col-span-2 md:row-span-2", ratio: "aspect-[4/3] md:aspect-auto md:h-full" },
    { id: 6, cls: "md:col-span-2", ratio: "aspect-[16/9]" },
    { id: 5, cls: "", ratio: "aspect-[4/3]" },
    { id: 4, cls: "", ratio: "aspect-[4/3]" },
    { id: 2, cls: "md:col-span-2", ratio: "aspect-[21/9]" },
    { id: 3, cls: "md:col-span-2", ratio: "aspect-[21/9]" },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card className="relative overflow-hidden md:col-span-2 xl:col-span-4 xl:row-span-2">
          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
            <div className="grid content-start gap-4">
              <p className="text-xs font-medium text-accent">{t("overview.eyebrow")}</p>
              <h1 className="text-[28px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-[34px]">{t("overview.title")}</h1>
              <p className="text-[15px] leading-relaxed text-pretty text-muted">{t("overview.lede")}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="primary" size="lg">
                  <a href={hashFor("teledetectie/national")}>
                    {t("overview.cta")}
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </a>
                </Button>
                <Button size="lg" onClick={openCommandMenu}>
                  {t("cmd.search")}
                  <Kbd className="ml-1">{isMac() ? "⌘K" : "Ctrl K"}</Kbd>
                </Button>
              </div>
              <dl className="mt-2 grid grid-cols-4 gap-3 border-t border-border pt-4">
                {[
                  [networks?.ws.features.length ?? 20, t("overview.stat.ws")],
                  [networks?.ec.features.length ?? 5, t("overview.stat.ec")],
                  [areas?.features.length ?? 6, t("overview.stat.areas")],
                  [208, t("overview.stat.uat")],
                ].map(([n, label]) => (
                  <div key={String(label)}>
                    <dt className="text-[11px] text-subtle">{label}</dt>
                    <dd className="tabular text-xl font-semibold tracking-tight">{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="grid gap-2">
              <div className="relative overflow-hidden rounded-[10px] border border-border bg-surface-2/60" style={{ aspectRatio: `${W} / ${H}` }}>
                <div aria-hidden className="dot-grid absolute inset-0 opacity-70" />
                {areas && networks ? <AtlasIllustration areas={areas} networks={networks} /> : <Skeleton className="absolute inset-0" />}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="size-2.5 rounded-[3px] border border-accent bg-accent/15" />
                  {t("overview.stat.areas")}
                </span>
                {NETWORKS.filter((n) => ["ws", "ec", "co"].includes(n.id)).map((n) => (
                  <span key={n.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="size-2 rounded-full" style={{ background: n.color }} />
                    {L(n)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[13px] font-medium">{t("overview.services")}</h2>
            <a href={hashFor("despre")} className="text-[11px] text-muted hover:text-foreground">{t("overview.details")}</a>
          </div>
          <ul className="divide-y divide-border">
            <ServiceRow name="lifewatch" label={t("rail.backend.lifewatch")} />
            <ServiceRow name="ltser" label={t("rail.backend.ltser")} />
          </ul>
        </Card>

        <Card className="p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-medium">{t("overview.latest")}</h2>
            <a href={hashFor("retele/meteo")} className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-foreground">
              {t("overview.openNetwork")}
              <ArrowUpRight className="size-3" strokeWidth={1.75} />
            </a>
          </div>
          <LatestReading />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <ul className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0">
          {modules.map((m, i) => (
            <li key={m.href} className={cn(i % 2 === 0 && "md:border-r md:border-border", i < 2 && "md:border-b md:border-border")}>
              <a href={hashFor(m.href)} className="group flex items-start gap-3 p-4 transition-colors hover:bg-surface-2/60">
                <m.icon className="mt-0.5 size-4 shrink-0 text-subtle" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{m.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{m.body}</span>
                </span>
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={1.75} />
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <section className="grid gap-3 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("overview.areas")}</h2>
            <p className="text-[13px] text-muted">{t("overview.areasLede")}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {gallery.map(({ id, cls, ratio }) => {
            const photo = AREA_PHOTOS[id];
            const stat = areaStats.get(String(id));
            return (
              <a key={id} href={hashFor("teledetectie/administrativ", { unitate: "ltser", id })} className={cn("group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card", cls)}>
                <Photo
                  src={photoSrc(photo, 1200)}
                  srcSet={photoSrcSet(photo)}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  alt={`${L(LTSER_AREAS[id])}, ${photo.location}`}
                  fallback={L(LTSER_AREAS[id])}
                  className={cn("w-full", ratio)}
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 grid gap-1.5 p-4 text-white">
                  <p className="text-[11px] font-medium text-white/70">{L(LTSER_AREA_META[id].kind)}</p>
                  <h3 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight">
                    {L(LTSER_AREAS[id])}
                    <ArrowRight className="size-3.5 opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" strokeWidth={1.75} />
                  </h3>
                  <p className="tabular flex flex-wrap gap-x-3 text-[11px] text-white/75">
                    {stat ? <span>{fmtInt(stat.km2)} km²</span> : null}
                    <span>{LTSER_AREA_META[id].uats} UAT</span>
                    {stat?.stations ? <span>{t("overview.stationsIn", { n: stat.stations })}</span> : null}
                  </p>
                </div>
                <span className="absolute top-2.5 right-2.5 rounded-md bg-zinc-950/45 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur">
                  {photo.author} · Unsplash
                </span>
              </a>
            );
          })}
        </div>
        <p className="text-[11px] text-subtle">{t("overview.photoNote")}</p>
      </section>
    </div>
  );
}
