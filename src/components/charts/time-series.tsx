// Time series panel built on Recharts: multi-series lanes, left and right axes, toggleable
// legend, range presets, a two-thumb range selector, PNG export and native fullscreen.
// Times are "wall clock" milliseconds rendered in UTC, so the axis shows the dataset clock.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import * as RSlider from "@radix-ui/react-slider";
import { Download, Expand, Minimize } from "lucide-react";
import { lttb, type Point } from "@/lib/lttb";
import { fmtAuto, fmtWallMs, locale, tickFormatter } from "@/lib/format";
import { exportSvgPng } from "@/lib/export";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState, Skeleton } from "@/components/ui/misc";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  points: Point[];
  axis?: "left" | "right";
  type?: "line" | "area" | "bar";
  dashed?: boolean;
  unit?: string;
}

export interface RangePreset {
  id: string;
  label: string;
  span: number | null;
}

interface PanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  lanes: ChartSeries[][];
  axisLabels?: { left?: string; right?: string }[];
  presets?: RangePreset[];
  defaultPreset?: string;
  height?: number;
  laneHeight?: number;
  dateOnly?: boolean;
  yearOnly?: boolean;
  maxPoints?: number;
  filename: string;
  loading?: boolean;
  emptyText?: string;
  footer?: ReactNode;
  className?: string;
}

const compact = () => new Intl.NumberFormat(locale(), { notation: "compact", maximumFractionDigits: 2 });

function TooltipBody({ active, payload, label, series, dateOnly, yearOnly }: { active?: boolean; payload?: { dataKey?: string | number; value?: number | null }[]; label?: number; series: ChartSeries[]; dateOnly?: boolean; yearOnly?: boolean }) {
  if (!active || !payload?.length || label === undefined) return null;
  const head = yearOnly ? String(new Date(label).getUTCFullYear()) : fmtWallMs(label, { time: !dateOnly });
  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-surface px-2.5 py-2 text-xs shadow-float">
      <p className="tabular mb-1.5 text-[11px] text-subtle">{head}</p>
      <ul className="grid gap-1">
        {payload.map((p) => {
          const s = series.find((x) => x.key === p.dataKey);
          if (!s || p.value === null || p.value === undefined) return null;
          return (
            <li key={s.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-[3px]" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="tabular font-medium text-foreground">
                {fmtAuto(p.value)}
                {s.unit ? <span className="ml-1 font-sans font-normal text-subtle">{s.unit}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Lane({ series, hidden, window, height, showX, syncId, dateOnly, yearOnly, maxPoints, labels }: {
  series: ChartSeries[];
  hidden: Set<string>;
  window: [number, number];
  height: number;
  showX: boolean;
  syncId: string;
  dateOnly?: boolean;
  yearOnly?: boolean;
  maxPoints: number;
  labels?: { left?: string; right?: string };
}) {
  const gid = useId().replace(/:/g, "");
  const visible = useMemo(() => series.filter((s) => !hidden.has(s.key)), [series, hidden]);
  const rows = useMemo(() => {
    const byX = new Map<number, Record<string, number | null>>();
    for (const s of visible) {
      const inWindow = s.points.filter((p) => p[0] >= window[0] && p[0] <= window[1]);
      const pts = s.type === "bar" ? inWindow : lttb(inWindow, maxPoints);
      for (const [x, y] of pts) {
        let row = byX.get(x);
        if (!row) byX.set(x, (row = { x }));
        row[s.key] = y;
      }
    }
    return [...byX.values()].sort((a, b) => (a.x as number) - (b.x as number));
  }, [visible, window, maxPoints]);
  const hasRight = visible.some((s) => s.axis === "right");
  const fmtTick = useMemo(() => (yearOnly ? (ms: number) => String(new Date(ms).getUTCFullYear()) : tickFormatter(window[1] - window[0])), [window, yearOnly]);
  const nf = compact();
  const tick = { fill: "var(--chart-axis)", fontSize: 10, fontFamily: "var(--font-mono)" };
  return (
    <div>
      {labels?.left || labels?.right ? (
        <div className="flex justify-between px-1 pb-1 text-[11px] text-subtle">
          <span>{labels.left}</span>
          <span>{labels.right}</span>
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} syncId={syncId} syncMethod="value" margin={{ top: 6, right: hasRight ? 0 : 6, bottom: 0, left: 0 }}>
          <defs>
            {visible.map((s) => (
              <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" scale="time" domain={window} allowDataOverflow tickFormatter={fmtTick} tick={showX ? tick : false} height={showX ? 22 : 4} axisLine={false} tickLine={false} minTickGap={36} />
          <YAxis yAxisId="left" width={46} tick={tick} axisLine={false} tickLine={false} tickFormatter={(v: number) => nf.format(v)} domain={["auto", "auto"]} />
          {hasRight ? <YAxis yAxisId="right" orientation="right" width={46} tick={tick} axisLine={false} tickLine={false} tickFormatter={(v: number) => nf.format(v)} domain={["auto", "auto"]} /> : null}
          <RTooltip cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} content={(props) => <TooltipBody {...(props as object)} series={series} dateOnly={dateOnly} yearOnly={yearOnly} />} isAnimationActive={false} />
          {visible.map((s) => {
            const common = { dataKey: s.key, name: s.name, yAxisId: s.axis === "right" ? "right" : "left", isAnimationActive: rows.length < 600 };
            if (s.type === "bar") return <Bar key={s.key} {...common} fill={s.color} fillOpacity={0.8} radius={[2, 2, 0, 0]} maxBarSize={14} />;
            if (s.type === "area")
              return <Area key={s.key} {...common} type="linear" stroke={s.color} strokeWidth={1.5} fill={`url(#${gid}-${s.key})`} dot={rows.length < 80 ? { r: 2, strokeWidth: 0, fill: s.color } : false} activeDot={{ r: 3.5, strokeWidth: 0 }} connectNulls={false} />;
            return <Line key={s.key} {...common} type="linear" stroke={s.color} strokeWidth={1.5} strokeDasharray={s.dashed ? "5 4" : undefined} dot={false} activeDot={{ r: 3.5, strokeWidth: 0 }} connectNulls={false} />;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeSeriesPanel({
  title, subtitle, lanes, axisLabels, presets, defaultPreset, height = 300, laneHeight, dateOnly, yearOnly, maxPoints = 900, filename, loading, emptyText, footer, className,
}: PanelProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const syncId = useId();
  const all = useMemo(() => lanes.flat(), [lanes]);
  const [lo, hi] = useMemo(() => {
    let a = Infinity, b = -Infinity;
    for (const s of all) for (const [x] of s.points) {
      if (x < a) a = x;
      if (x > b) b = x;
    }
    return Number.isFinite(a) ? [a, b] : [0, 1];
  }, [all]);
  const [preset, setPreset] = useState(defaultPreset ?? presets?.[0]?.id ?? "all");
  const [range, setRange] = useState<[number, number]>([lo, hi]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const p = presets?.find((x) => x.id === preset);
    setRange([p?.span ? Math.max(lo, hi - p.span) : lo, hi]);
  }, [lo, hi, preset, presets]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = (key: string) => setHidden((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key);
    else if (all.length - next.size > 1) next.add(key);
    return next;
  });

  const exportPng = () => {
    if (!ref.current) return;
    void exportSvgPng(ref.current, `${filename}.png`, getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#ffffff");
  };

  const empty = !loading && !all.some((s) => s.points.some((p) => p[1] !== null));
  const per = laneHeight ?? height;
  const step = Math.max(1, (hi - lo) / 1000);

  return (
    <div ref={ref} className={cn("rounded-2xl border border-border bg-surface shadow-card", fullscreen && "overflow-auto rounded-none p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3.5 pb-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-medium tracking-tight">{title}</h3>
          {subtitle ? <p className="tabular mt-0.5 truncate text-[11px] text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          {presets && presets.length > 1 && !empty ? <Segmented ariaLabel={t("chart.range")} value={preset} onChange={setPreset} options={presets.map((p) => ({ value: p.id, label: p.label }))} /> : null}
          <Tooltip content={t("chart.png")}>
            <Button variant="ghost" size="icon-sm" aria-label={t("chart.png")} onClick={exportPng} disabled={empty || loading}>
              <Download strokeWidth={1.75} />
            </Button>
          </Tooltip>
          <Tooltip content={fullscreen ? t("ui.exitFullscreen") : t("ui.fullscreen")}>
            <Button variant="ghost" size="icon-sm" aria-label={t("ui.fullscreen")} onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void ref.current?.requestFullscreen?.())}>
              {fullscreen ? <Minimize strokeWidth={1.75} /> : <Expand strokeWidth={1.75} />}
            </Button>
          </Tooltip>
        </div>
      </div>

      {all.length > 1 && !empty ? (
        <div className="flex flex-wrap gap-1 px-4 pb-2">
          {all.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={!hidden.has(s.key)}
              onClick={() => toggle(s.key)}
              className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border px-1.5 text-[11px] text-muted transition-colors hover:text-foreground aria-[pressed=false]:opacity-45"
            >
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.dashed ? `repeating-linear-gradient(90deg, ${s.color} 0 3px, transparent 3px 5px)` : s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="px-2 pb-3">
        {loading && !all.length ? (
          <div className="px-2"><Skeleton style={{ height: per * Math.max(1, lanes.length) }} /></div>
        ) : empty ? (
          <div className="px-2"><EmptyState title={emptyText ?? t("chart.empty")} /></div>
        ) : (
          <div className={cn("transition-opacity", loading && "opacity-50")}>
            {lanes.map((lane, i) => (
              <Lane
                key={i}
                series={lane}
                hidden={hidden}
                window={range}
                height={fullscreen ? Math.max(per, (window.innerHeight - 220) / lanes.length) : per}
                showX={i === lanes.length - 1}
                syncId={syncId}
                dateOnly={dateOnly}
                yearOnly={yearOnly}
                maxPoints={maxPoints}
                labels={axisLabels?.[i]}
              />
            ))}
            {hi > lo ? (
              <div className="px-2 pt-2">
                <RSlider.Root
                  value={range}
                  min={lo}
                  max={hi}
                  step={step}
                  minStepsBetweenThumbs={2}
                  onValueChange={(v) => {
                    setRange([v[0], v[1]]);
                    setPreset("__custom__");
                  }}
                  className="relative flex h-5 w-full touch-none select-none items-center"
                >
                  <RSlider.Track className="relative h-1 grow rounded-full bg-surface-3">
                    <RSlider.Range className="absolute h-full rounded-full bg-accent/60" />
                  </RSlider.Track>
                  <RSlider.Thumb aria-label={t("chart.from")} className="block h-4 w-2.5 rounded-[4px] border border-border-strong bg-surface shadow-card" />
                  <RSlider.Thumb aria-label={t("chart.to")} className="block h-4 w-2.5 rounded-[4px] border border-border-strong bg-surface shadow-card" />
                </RSlider.Root>
                <div className="tabular mt-1 flex justify-between text-[10px] text-subtle">
                  <span>{yearOnly ? new Date(range[0]).getUTCFullYear() : fmtWallMs(range[0], { time: !dateOnly })}</span>
                  <span>{yearOnly ? new Date(range[1]).getUTCFullYear() : fmtWallMs(range[1], { time: !dateOnly })}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </div>
  );
}
