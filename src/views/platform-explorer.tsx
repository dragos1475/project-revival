// LifeWatch data platform (lifewatch-romania/web-ui), extended to every API capability:
// station index, station sheet, all variables, comparison of up to four, windows up to 7 days.
import { useMemo, useState } from "react";
import { ArrowRight, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { bucharestOffset, bucharestWallToInstant, fmtAuto, fmtDuration, fmtInstant, fmtInt, fmtNum, instantToBucharestWall, prettyUnit } from "@/lib/format";
import { downloadCSV } from "@/lib/export";
import { SERIES_CYCLE } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { hashFor, navigate } from "@/hooks/use-route";
import { lifewatch, LIFEWATCH_ROW_LIMIT } from "@/api/lifewatch";
import type { LwStation, LwStationInfo, Measurements, Series } from "@/api/types";
import { TimeSeriesPanel, type ChartSeries } from "@/components/charts/time-series";
import { Sparkline } from "@/components/charts/sparkline";
import { PageHeader, SectionTabs, SourceBadge, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Badge, Callout, Field, Skeleton, inputClass } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const MAX_PINNED = 4;
// The API rejects windows of 7 days or more, so the longest preset stops one minute short.
const PRESETS = [
  { id: "default", span: null as number | null },
  { id: "6h", span: 6 * HOUR },
  { id: "24h", span: DAY },
  { id: "3d", span: 3 * DAY },
  { id: "7d", span: 7 * DAY - 60000 },
];

function kindLabel(kind: LwStation["kind"], t: (k: string) => string) {
  return kind === "meteorological" ? t("platform.kind.meteo") : kind === "eddy-covariance" ? t("platform.kind.ec") : t("platform.kind.unknown");
}

function summary(s?: Series) {
  let last: number | null = null, min = Infinity, max = -Infinity;
  if (!s) return { last, min: null, max: null };
  for (let i = 0; i < s.v.length; i++) {
    const v = s.v[i];
    if (Number.isNaN(v)) continue;
    last = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { last, min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null };
}

/** Instants shifted to Bucharest wall clock for display on a UTC axis. */
function toWallPoints(s: Series): [number, number | null][] {
  const out: [number, number | null][] = new Array(s.t.length);
  const o0 = s.t.length ? bucharestOffset(s.t[0]) : 0;
  const o1 = s.t.length ? bucharestOffset(s.t[s.t.length - 1]) : 0;
  for (let i = 0; i < s.t.length; i++) out[i] = [s.t[i] + (o0 === o1 ? o0 : bucharestOffset(s.t[i])), Number.isNaN(s.v[i]) ? null : s.v[i]];
  return out;
}

function StationPicker({ stations, value }: { stations: LwStation[]; value: number | null }) {
  const { t } = useI18n();
  const groups: Record<string, string> = { meteorological: t("platform.kind.meteo"), "eddy-covariance": t("platform.kind.ec") };
  return (
    <div className="w-full max-w-md">
      <Select
        ariaLabel={t("platform.station")}
        placeholder={t("platform.choose")}
        value={value ? String(value) : undefined}
        onValueChange={(v) => navigate("platforma/statii", { statie: v })}
        options={stations.map((s) => ({ value: String(s.id), label: s.name, group: s.kind ? groups[s.kind] : t("platform.kind.unknown"), hint: `#${s.id}` }))}
      />
    </div>
  );
}

function StationIndex({ stations }: { stations: LwStation[] }) {
  const { t } = useI18n();
  const cols = (["meteorological", "eddy-covariance"] as const).map((k) => ({ kind: k, list: stations.filter((s) => s.kind === k) }));
  const unknown = stations.filter((s) => !s.kind);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {[...cols, ...(unknown.length ? [{ kind: null, list: unknown }] : [])].map(({ kind, list }) => (
        <Card key={String(kind)} className="overflow-hidden">
          <CardHeader title={kindLabel(kind, t)} description={t("platform.count", { n: list.length })} />
          <ul className={cn("grid border-t border-border", kind === "meteorological" && "md:grid-cols-2")}>
            {list.map((s) => (
              <li key={s.id} className="border-b border-border md:[&:nth-last-child(-n+2)]:border-b-0">
                <a href={hashFor("platforma/statii", { statie: s.id })} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/60">
                  <span className="tabular w-6 text-[11px] text-subtle">{String(s.id).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{s.name.replace(/^Stația \d+ - /, "")}</span>
                  {s.has_ch4 ? <Badge>CH₄</Badge> : null}
                  <ArrowRight className="size-3.5 text-subtle opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function StationSheet({ info, rep }: { info: LwStationInfo; rep?: Series }) {
  const { t } = useI18n();
  const first = rep?.t.length ? fmtInstant(rep.t[0], { seconds: true }) : "…";
  const last = rep?.t.length ? fmtInstant(rep.t[rep.t.length - 1], { seconds: true }) : "…";
  return (
    <Card className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:p-5">
      <div className="grid content-start gap-2">
        <p className="tabular text-xs text-subtle">{t("platform.stationNo")} {info.id}</p>
        <h2 className="text-xl font-semibold tracking-tight text-balance">{info.name}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{kindLabel(info.kind, t)}</Badge>
          {info.has_ch4 ? <Badge variant="live">{t("platform.ch4")}</Badge> : null}
        </div>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-1.5 text-[13px]">
        <dt className="text-xs text-subtle">{t("platform.location")}</dt>
        <dd className="tabular">{fmtNum(info.location.latitude, 5)}° N, {fmtNum(info.location.longitude, 5)}° E</dd>
        <dt className="text-xs text-subtle">{t("platform.variables")}</dt>
        <dd className="tabular">{info.variables.length}</dd>
        <dt className="text-xs text-subtle">{t("platform.firstTs")}</dt>
        <dd className="tabular">{first}</dd>
        <dt className="text-xs text-subtle">{t("platform.lastTs")}</dt>
        <dd className="tabular">{last}</dd>
      </dl>
    </Card>
  );
}

function Explorer({ info, overview }: { info: LwStationInfo; overview: Measurements }) {
  const { t } = useI18n();
  const meta = useMemo(() => new Map(info.variables.map((v) => [v.name, v])), [info]);
  const defaults = (info.kind === "meteorological" ? ["air_temperature", "air_humidity"] : ["co2_molar_fraction", "h2o_molar_fraction"]).filter((d) => meta.has(d));
  const [pinned, setPinned] = useState<string[]>(defaults.length ? defaults : [info.variables[0].name]);
  const [query, setQuery] = useState("");
  const [preset, setPreset] = useState("default");
  const [win, setWin] = useState<{ since: number; until: number } | null>(null);
  const latest = useMemo(() => Math.max(...Object.values(overview.series).map((s) => (s.t.length ? s.t[s.t.length - 1] : 0))), [overview]);
  const [since, setSince] = useState(() => instantToBucharestWall(latest - 2 * HOUR));
  const [until, setUntil] = useState(() => instantToBucharestWall(latest));
  const [rangeError, setRangeError] = useState<string | null>(null);

  const focus = useAsync(
    () => lifewatch.measurements(info.id, { variables: pinned, ...(win ? { since: new Date(win.since).toISOString(), until: new Date(win.until).toISOString() } : {}) }),
    [info.id, pinned.join(","), win?.since, win?.until],
  );

  const choosePreset = (id: string) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id)!;
    const next = p.span === null ? null : { since: latest - p.span, until: latest };
    setWin(next);
    setSince(instantToBucharestWall(next?.since ?? latest - 2 * HOUR));
    setUntil(instantToBucharestWall(next?.until ?? latest));
    setRangeError(null);
  };

  const apply = () => {
    const s = bucharestWallToInstant(since);
    const u = bucharestWallToInstant(until);
    if (s >= u) return setRangeError(t("platform.err.order"));
    if (u - s >= 7 * DAY) return setRangeError(t("platform.err.max7"));
    setRangeError(null);
    setPreset("custom");
    setWin({ since: s, until: u });
  };

  const toggle = (name: string) => {
    if (pinned.includes(name)) {
      if (pinned.length > 1) setPinned(pinned.filter((x) => x !== name));
    } else if (pinned.length >= MAX_PINNED) toast(t("platform.maxPinned", { n: MAX_PINNED }));
    else setPinned([...pinned, name]);
  };

  const lanes = useMemo<ChartSeries[][]>(() => {
    if (!focus.data) return [];
    return pinned.filter((n) => focus.data!.series[n]?.t.length).map((n, i) => {
      const m = meta.get(n)!;
      return [{ key: n, name: m.label, unit: prettyUnit(m.units), color: SERIES_CYCLE[pinned.indexOf(n) % SERIES_CYCLE.length] ?? SERIES_CYCLE[i], type: "line" as const, points: toWallPoints(focus.data!.series[n]) }];
    });
  }, [focus.data, pinned, meta]);

  const span = useMemo(() => {
    if (!focus.data) return null;
    let a = Infinity, b = -Infinity;
    for (const n of pinned) {
      const s = focus.data.series[n];
      if (!s?.t.length) continue;
      a = Math.min(a, s.t[0]);
      b = Math.max(b, s.t[s.t.length - 1]);
    }
    return Number.isFinite(a) ? { a, b } : null;
  }, [focus.data, pinned]);
  const truncated = focus.data ? pinned.filter((n) => (focus.data!.series[n]?.t.length ?? 0) >= LIFEWATCH_ROW_LIMIT).map((n) => meta.get(n)!.label) : [];

  const exportCsv = () => {
    if (!focus.data) return;
    const rows: { timestamp: string; variable: string; value: number | string }[] = [];
    for (const n of pinned) {
      const s = focus.data.series[n];
      if (!s) continue;
      for (let i = 0; i < s.t.length; i++) rows.push({ timestamp: new Date(s.t[i]).toISOString(), variable: n, value: Number.isNaN(s.v[i]) ? "" : s.v[i] });
    }
    const file = `statia_${info.id}_${pinned.join("-")}.csv`;
    downloadCSV([{ key: "timestamp", label: "timestamp_utc" }, { key: "variable", label: "variable" }, { key: "value", label: "value" }], rows, file);
    toast.success(t("table.downloaded", { file }));
  };

  const filtered = info.variables.filter((v) => !query || `${v.label} ${v.name} ${v.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="overflow-hidden xl:sticky xl:top-6">
        <CardHeader title={t("platform.allVariables", { n: info.variables.length })} description={t("platform.overviewHint")} />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("platform.searchVar")} aria-label={t("platform.searchVar")} className={cn(inputClass, "pl-8")} />
          </div>
        </div>
        <ul className="max-h-[calc(100dvh-260px)] overflow-y-auto border-t border-border">
          {filtered.map((v) => {
            const s = overview.series[v.name];
            const sm = summary(s);
            const idx = pinned.indexOf(v.name);
            const on = idx >= 0;
            return (
              <li key={v.name} className="border-b border-border last:border-0">
                <button type="button" aria-pressed={on} onClick={() => toggle(v.name)} title={v.description || v.label} className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2/60", on && "bg-accent-soft/60")}>
                  <span className={cn("h-7 w-1 shrink-0 rounded-full", !on && "bg-surface-3")} style={on ? { background: SERIES_CYCLE[idx % SERIES_CYCLE.length] } : undefined} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[13px] font-medium">{v.label}</span>
                    <span className="tabular truncate text-[11px] text-subtle">{v.name}</span>
                  </span>
                  {s ? <Sparkline values={s.v} width={64} height={22} /> : null}
                  <span className="grid w-20 shrink-0 text-right">
                    <span className="tabular text-[13px]">{sm.last === null ? "n/d" : fmtAuto(sm.last)}</span>
                    <span className="truncate text-[10px] text-subtle">{prettyUnit(v.units)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardBody className="grid gap-3 pt-4">
            <Field label={t("platform.window")}>
              <Segmented ariaLabel={t("platform.window")} value={preset === "custom" ? null : preset} onChange={choosePreset} options={PRESETS.map((p) => ({ value: p.id, label: t(`platform.preset.${p.id}`) }))} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label={t("platform.since")}>
                <input type="datetime-local" step={60} value={since} onChange={(e) => setSince(e.target.value)} aria-invalid={!!rangeError} className={cn(inputClass, "tabular")} />
              </Field>
              <Field label={t("platform.until")}>
                <input type="datetime-local" step={60} value={until} onChange={(e) => setUntil(e.target.value)} aria-invalid={!!rangeError} className={cn(inputClass, "tabular")} />
              </Field>
              <Button variant="primary" onClick={apply}>{t("platform.apply")}</Button>
            </div>
            {rangeError ? <p role="alert" className="text-xs text-danger">{rangeError}</p> : <p className="text-[11px] text-subtle">{t("platform.tzHint")}</p>}
          </CardBody>
        </Card>

        {focus.error ? <Callout tone="error" title={t("platform.err.measurements")}>{errorText(focus.error, t)}</Callout> : null}
        {truncated.length ? <Callout tone="warning" title={t("platform.truncated.title")}>{t("platform.truncated", { v: truncated.join(", "), n: fmtInt(LIFEWATCH_ROW_LIMIT) })}</Callout> : null}

        <TimeSeriesPanel
          key={pinned.join(",")}
          title={t("platform.focus")}
          subtitle={span ? `${fmtInstant(span.a)} · ${fmtInstant(span.b)} · ${fmtDuration(span.b - span.a)}` : undefined}
          lanes={lanes}
          laneHeight={lanes.length > 1 ? 150 : 300}
          maxPoints={1200}
          loading={focus.loading}
          emptyText={t("platform.noData")}
          filename={`statia_${info.id}`}
          footer={
            <div className="flex flex-wrap items-start justify-between gap-3">
              <dl className="grid gap-1 text-xs">
                {pinned.map((n) => (
                  <div key={n} className="flex gap-2">
                    <dt className="shrink-0 font-medium">{meta.get(n)?.label}</dt>
                    <dd className="text-muted">{meta.get(n)?.description || <span className="tabular">{n} · {prettyUnit(meta.get(n)?.units)}</span>}</dd>
                  </div>
                ))}
              </dl>
              <Button size="sm" onClick={exportCsv} disabled={!focus.data}>
                <Download strokeWidth={1.75} />
                CSV
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default function PlatformExplorer({ route }: ViewProps) {
  const { t } = useI18n();
  const raw = route.query.get("statie") ?? route.query.get("stationId");
  const id = raw ? Number.parseInt(raw, 10) : null;
  const invalid = raw !== null && raw !== "" && Number.isNaN(id);
  const stations = useAsync(() => lifewatch.stations(), []);
  const info = useAsync(() => (id && !invalid ? lifewatch.stationInfo(id) : null), [id]);
  const overview = useAsync(() => (info.data?.variables.length ? lifewatch.measurements(info.data.id, { variables: info.data.variables.map((v) => v.name) }) : null), [info.data]);

  return (
    <div>
      <PageHeader crumbs={[t("nav.platform"), t("nav.platform.stations")]} title={t("platform.title")} description={id ? t("platform.lede") : t("platform.lede.pick")} actions={<SourceBadge backend="lifewatch" />} />
      <SectionTabs group="platform" active="platforma/statii" />
      <div className="grid gap-4">
        {stations.data ? <StationPicker stations={stations.data} value={id} /> : null}
        {invalid ? <Callout tone="error" title={t("platform.err.invalidId", { id: raw ?? "" })} /> : null}
        {stations.error ? <Callout tone="error" title={t("platform.err.stations")}>{errorText(stations.error, t)}</Callout> : null}
        {!id && !invalid ? (stations.data ? <StationIndex stations={stations.data} /> : <Skeleton className="h-80 rounded-2xl" />) : null}
        {id && info.error ? <Callout tone="error" title={t("platform.err.info")}>{errorText(info.error, t)}</Callout> : null}
        {id && info.data ? <StationSheet info={info.data} rep={overview.data?.series[info.data.variables[0]?.name]} /> : id && info.loading ? <Skeleton className="h-36 rounded-2xl" /> : null}
        {info.data && !info.data.variables.length ? <Callout>{t("platform.noVariables")}</Callout> : null}
        {overview.error ? <Callout tone="error" title={t("platform.err.measurements")}>{errorText(overview.error, t)}</Callout> : null}
        {info.data && overview.data ? <Explorer key={info.data.id} info={info.data} overview={overview.data} /> : info.data && overview.loading ? <Skeleton className="h-[520px] rounded-2xl" /> : null}
      </div>
    </div>
  );
}
