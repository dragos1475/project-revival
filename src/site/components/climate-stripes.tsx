// Climate stripes of the places of our network since 1961, from the homogenised daily grid of ANM, and the map of
// warming over Romania. Data: public/data/climate-stripes.json, built by scripts/climate_stripes.py.
//   - SiteStripes: one place (Climate tab of its sheet), temperature and precipitation of every year.
//   - NetworkStripes: every place of the network, one stripe band each, next to the warming map.
// Each stripe is a year; the colour is its departure from the 1961–1990 mean of the same place.
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { fmt, LW_POINTS, sheetKey, type LwPoint } from "../content/lw";
import { pick } from "../i18n/core";
import { Link } from "../router";
import { HoverChart, type Tip } from "./chart-hover";
import { H3, KeyValues } from "./lw-ui";

interface StripePoint {
  t: (number | null)[];
  p: (number | null)[];
  cells: number;
  km: 1 | 4;
}
interface StripeData {
  source: string;
  url: string;
  years: [number, number];
  ref: [number, number];
  now: [number, number];
  points: Record<string, StripePoint>;
  map: { bbox: [number, number, number, number]; w: number; h: number; diff: string; mean: number };
}

let request: Promise<StripeData | null> | null = null;
const loadStripes = () =>
  (request ??= fetch(`${import.meta.env.BASE_URL}data/climate-stripes.json`)
    .then((r) => (r.ok ? (r.json() as Promise<StripeData>) : null))
    .catch(() => null));
function useStripes() {
  const [data, setData] = useState<StripeData | null | undefined>(undefined);
  useEffect(() => {
    let on = true;
    void loadStripes().then((d) => on && setData(d));
    return () => {
      on = false;
    };
  }, []);
  return data;
}

/* ---------------------------------------------------------------- colour */
// Two single-hue arms that meet at a near-white midpoint (ColorBrewer Blues/Reds, BrBG), seven or five steps each.
// The bands are framed, so their lightest stripes stay readable against the page.
const COLD = ["#08306b", "#08519c", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#deebf7"];
const WARM = ["#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#67000d"];
const DRY = ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3"];
const WET = ["#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"];
const T_RANGE = 3; // °C either side of the 1961–1990 mean
const P_RANGE = 40; // % either side

function diverging(v: number, range: number, neg: string[], pos: string[]) {
  const k = Math.min(Math.floor((Math.abs(v) / range) * pos.length), pos.length - 1);
  return v < 0 ? neg[neg.length - 1 - k] : pos[k];
}
const tColor = (a: number) => diverging(a, T_RANGE, COLD, WARM);
const pColor = (a: number) => diverging(a, P_RANGE, DRY, WET);

/* ---------------------------------------------------------------- numbers */
const isNum = (v: number | null | undefined): v is number => v != null;
const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
const signed = (v: number, digits = 1) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v), digits)}`;

/** Means, warming between the two periods and the linear trend of one place. */
function summary(d: StripeData, s: StripePoint) {
  const [y0] = d.years;
  const span = ([a, b]: [number, number], xs: (number | null)[]) =>
    mean(xs.slice(a - y0, b - y0 + 1).filter(isNum));
  const ref = span(d.ref, s.t);
  const now = span(d.now, s.t);
  const refP = span(d.ref, s.p);
  const pts = s.t
    .map((t, i) => [y0 + i, t] as const)
    .filter((x): x is readonly [number, number] => isNum(x[1]));
  const xm = mean(pts.map((x) => x[0])),
    ym = mean(pts.map((x) => x[1]));
  const trend =
    pts.reduce((a, [x, y]) => a + (x - xm) * (y - ym), 0) /
    pts.reduce((a, [x]) => a + (x - xm) ** 2, 0);
  const warmest = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { ref, now, warming: now - ref, refP, trend, warmest };
}

/* ---------------------------------------------------------------- one band */
function Band({
  values,
  color,
  label,
  tip,
  height,
  className,
}: {
  values: (number | null)[];
  color: (i: number) => string | null;
  label: string;
  tip: (i: number) => Tip;
  height: number;
  className?: string;
}) {
  const W = values.length * 10;
  return (
    <HoverChart
      W={W}
      H={height}
      n={values.length}
      x0={0}
      bw={10}
      label={label}
      tip={tip}
      anchorY={() => 0}
      className={className}
    >
      {(active) => (
        <>
          {values.map((_, i) => {
            const c = color(i);
            return (
              <rect
                key={i}
                x={i * 10}
                y={0}
                width={10.6}
                height={height}
                fill={c ?? "var(--surface-2)"}
              />
            );
          })}
          {active != null ? (
            <rect
              x={active * 10 + 0.75}
              y={0.75}
              width={8.5}
              height={height - 1.5}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={1.5}
            />
          ) : null}
          <rect
            x={0.5}
            y={0.5}
            width={W - 1}
            height={height - 1}
            fill="none"
            stroke="var(--border-strong)"
          />
        </>
      )}
    </HoverChart>
  );
}

function ScaleBar({
  neg,
  pos,
  range,
  unit,
  left,
  right,
}: {
  neg: string[];
  pos: string[];
  range: number;
  unit: string;
  left: string;
  right: string;
}) {
  const all = [...neg, ...pos];
  return (
    <div className="grid max-w-[420px] gap-1 text-[12px] text-subtle">
      <div className="flex h-2.5 overflow-hidden rounded-[2px] border border-border-strong">
        {all.map((c) => (
          <i key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="flex justify-between tabular">
        <span>{`${signed(-range, 0)}${unit}`}</span>
        <span>0</span>
        <span>{`${signed(range, 0)}${unit}`}</span>
      </div>
      <div className="-mt-1 flex justify-between">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- site sheet */
export function SiteStripes({ p }: { p: LwPoint }) {
  const data = useStripes();
  const s = data?.points[p.key];
  if (!data || !s) return null;
  const [y0, y1] = data.years;
  const [r0, r1] = data.ref;
  const [n0, n1] = data.now;
  const sum = summary(data, s);
  const year = (i: number) => y0 + i;
  const where =
    s.km === 1
      ? pick(
          "celulele de circa 1 km din jurul punctului (3 × 3)",
          "the cells of about 1 km around the point (3 × 3)",
        )
      : pick(
          `cele ${s.cells} celule de 4 km din interiorul ariei`,
          `the ${s.cells} cells of 4 km inside the area`,
        );
  return (
    <div className="mb-9">
      <H3>
        {pick(
          `Clima locului din ${y0}, pe grila ANM`,
          `The climate of this place since ${y0}, on the ANM grid`,
        )}
      </H3>
      <p className="mb-4 max-w-[860px] text-muted">
        {pick(
          `Fiecare dungă este un an, de la ${y0} la ${y1}. Culoarea arată cât de cald sau de ploios a fost anul față de media ${r0}–${r1} a acestui loc. Valorile sunt media pentru ${where}, din grila climatică zilnică omogenizată a ANM, nu de la o singură stație.`,
          `Each stripe is a year, from ${y0} to ${y1}. The colour shows how warm or wet the year was against the ${r0}–${r1} mean of this place. Values are the mean of ${where}, from the homogenised daily climate grid of ANM, not from a single station.`,
        )}
      </p>
      <KeyValues
        className="mb-4"
        rows={[
          [
            pick(`Media ${r0}–${r1}`, `Mean ${r0}–${r1}`),
            `${fmt(sum.ref, 1)} °C · ${fmt(sum.refP)} mm${pick("/an", "/yr")}`,
          ],
          [
            pick(`Încălzire ${n0}–${n1} față de ${r0}–${r1}`, `Warming ${n0}–${n1} vs ${r0}–${r1}`),
            `${signed(sum.warming)} °C`,
          ],
          [
            pick(`Tendință ${y0}–${y1}`, `Trend ${y0}–${y1}`),
            `${signed(sum.trend * 10, 2)} °C ${pick("pe deceniu", "per decade")}`,
          ],
          [
            pick("Cel mai cald an", "Warmest year"),
            `${sum.warmest[0]} · ${fmt(sum.warmest[1], 1)} °C (${signed(sum.warmest[1] - sum.ref)} °C)`,
          ],
        ]}
      />
      <p className="mb-1 font-semibold">
        {pick("Temperatura medie a fiecărui an", "Mean temperature of each year")}
      </p>
      <Band
        values={s.t}
        height={96}
        color={(i) => (isNum(s.t[i]) ? tColor(s.t[i]! - sum.ref) : null)}
        label={pick(
          `Dungi climatice ale temperaturii, ${p.ro}, ${y0}–${y1}`,
          `Temperature climate stripes, ${p.ro}, ${y0}–${y1}`,
        )}
        tip={(i) => ({
          title: String(year(i)),
          rows: isNum(s.t[i])
            ? [
                { value: `${fmt(s.t[i], 1)} °C`, label: pick("media anului", "annual mean") },
                {
                  value: `${signed(s.t[i]! - sum.ref)} °C`,
                  label: pick(`față de ${r0}–${r1}`, `vs ${r0}–${r1}`),
                  color: tColor(s.t[i]! - sum.ref),
                },
              ]
            : [{ value: pick("an incomplet", "incomplete year") }],
        })}
      />
      <div className="mt-1 mb-4 flex justify-between text-[12px] text-subtle tabular">
        <span>{y0}</span>
        <span>{Math.round((y0 + y1) / 2)}</span>
        <span>{y1}</span>
      </div>
      <p className="mb-1 font-semibold">
        {pick("Precipitațiile fiecărui an", "Precipitation of each year")}
      </p>
      <Band
        values={s.p}
        height={40}
        color={(i) => (isNum(s.p[i]) ? pColor((s.p[i]! / sum.refP - 1) * 100) : null)}
        label={pick(
          `Dungi ale precipitațiilor anuale, ${p.ro}, ${y0}–${y1}`,
          `Annual precipitation stripes, ${p.ro}, ${y0}–${y1}`,
        )}
        tip={(i) => {
          const a = isNum(s.p[i]) ? Math.round((s.p[i]! / sum.refP - 1) * 100) : null;
          return {
            title: String(year(i)),
            rows:
              isNum(s.p[i]) && a != null
                ? [
                    { value: `${fmt(s.p[i])} mm`, label: pick("în an", "in the year") },
                    {
                      value: `${signed(a, 0)} %`,
                      label: pick(`față de ${r0}–${r1}`, `vs ${r0}–${r1}`),
                      color: pColor(a),
                    },
                  ]
                : [{ value: pick("an incomplet", "incomplete year") }],
          };
        }}
      />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <ScaleBar
          neg={COLD}
          pos={WARM}
          range={T_RANGE}
          unit=" °C"
          left={pick("mai rece", "colder")}
          right={pick("mai cald", "warmer")}
        />
        <ScaleBar
          neg={DRY}
          pos={WET}
          range={P_RANGE}
          unit=" %"
          left={pick("mai secetos", "drier")}
          right={pick("mai ploios", "wetter")}
        />
      </div>
      <p className="mt-3 text-[13px] text-subtle">
        {pick(
          `Temperatura medie a zilei este media dintre maxima și minima ei. Sursa: Administrația Națională de Meteorologie, date climatice gridate zilnice omogenizate, licență CC BY 4.0. `,
          `The mean temperature of a day is the mean of its maximum and minimum. Source: Romanian National Meteorological Administration (ANM), homogenised daily gridded climate data, CC BY 4.0 licence. `,
        )}
        <a
          href={data.url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {pick("Setul de date ANM", "ANM dataset")}
        </a>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- network */
interface Basemap {
  countries: {
    features: {
      properties: { ro: boolean };
      geometry: { type: string; coordinates: number[][][] | number[][][][] };
    }[];
  };
  counties: {
    features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[];
  };
}
let basemapRequest: Promise<Basemap | null> | null = null;
const loadBasemap = () =>
  (basemapRequest ??= fetch(`${import.meta.env.BASE_URL}data/lw-basemap.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Basemap>) : null))
    .catch(() => null));

// Classes of 0.1 °C: below +1.0, +1.0 to +1.1 … +1.5 and above.
const MAP_RAMP = WARM;
const MAP_BREAKS = [1, 1.1, 1.2, 1.3, 1.4, 1.5];
const mapColor = (v: number) => MAP_RAMP[MAP_BREAKS.filter((b) => v >= b - 1e-9).length];

function WarmingMap({
  data,
  places,
}: {
  data: StripeData;
  places: { p: LwPoint; warming: number }[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<Basemap | null>(null);
  const [probe, setProbe] = useState<{ v: number | null; x: number; y: number } | null>(null);
  const { bbox, w, h } = data.map;
  const cells = useMemo(() => Int8Array.from(atob(data.map.diff), (c) => c.charCodeAt(0)), [data]);
  const [W0, S0, E0, N0] = bbox;
  const k = Math.cos((((S0 + N0) / 2) * Math.PI) / 180);
  const VW = 1000;
  const VH = Math.round((VW * (N0 - S0)) / ((E0 - W0) * k));
  const px = (lon: number) => ((lon - W0) / (E0 - W0)) * VW;
  const py = (lat: number) => ((N0 - lat) / (N0 - S0)) * VH;

  useEffect(() => {
    void loadBasemap().then(setBase);
  }, []);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = cells[i];
      if (v === -128) continue;
      const hex = mapColor(v / 10);
      img.data[i * 4] = parseInt(hex.slice(1, 3), 16);
      img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [cells, w, h]);

  const path = (g: { type: string; coordinates: number[][][] | number[][][][] }) => {
    const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as number[][][][];
    return polys
      .map((rings) =>
        rings
          .map(
            (r) =>
              r
                .map(([lo, la], i) => `${i ? "L" : "M"}${px(lo).toFixed(1)},${py(la).toFixed(1)}`)
                .join("") + "Z",
          )
          .join(""),
      )
      .join("");
  };
  const ro = base?.countries.features.filter((f) => f.properties.ro) ?? [];
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width,
      fy = (e.clientY - r.top) / r.height;
    const i = Math.floor(fy * h),
      j = Math.floor(fx * w);
    const v = i >= 0 && i < h && j >= 0 && j < w ? cells[i * w + j] : -128;
    setProbe({ v: v === -128 ? null : v / 10, x: fx, y: fy });
  };

  return (
    <figure className="grid gap-2">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VW} / ${VH}` }}
        onPointerMove={onMove}
        onPointerLeave={() => setProbe(null)}
      >
        <canvas
          ref={canvas}
          width={w}
          height={h}
          className="absolute inset-0 size-full"
          aria-hidden
        />
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="absolute inset-0 size-full"
          role="img"
          aria-label={pick(
            `Harta încălzirii României: media ${data.now[0]}–${data.now[1]} față de ${data.ref[0]}–${data.ref[1]}, în medie cu ${fmt(data.map.mean, 1)} °C mai cald`,
            `Warming map of Romania: ${data.now[0]}–${data.now[1]} against ${data.ref[0]}–${data.ref[1]}, on average ${fmt(data.map.mean, 1)} °C warmer`,
          )}
        >
          {base?.counties.features.map((f, i) => (
            <path
              key={i}
              d={path(f.geometry)}
              fill="none"
              stroke="var(--foreground)"
              strokeOpacity={0.18}
              strokeWidth={0.8}
            />
          ))}
          {ro.map((f, i) => (
            <path
              key={i}
              d={path(f.geometry)}
              fill="none"
              stroke="var(--foreground)"
              strokeOpacity={0.7}
              strokeWidth={1.4}
            />
          ))}
          {places.map(({ p, warming }) => (
            <g key={p.key}>
              <circle
                cx={px(p.lon)}
                cy={py(p.lat)}
                r={5.5}
                fill="var(--navy)"
                stroke="#fff"
                strokeWidth={1.8}
              >
                <title>{`${p.ro}: ${signed(warming)} °C`}</title>
              </circle>
            </g>
          ))}
        </svg>
        {probe ? (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface px-2 py-1 text-[12.5px] shadow-card"
            style={{
              left: `${Math.min(probe.x * 100, 82)}%`,
              top: `${probe.y * 100}%`,
              transform: "translate(10px, -120%)",
            }}
          >
            {probe.v == null ? (
              pick("în afara grilei ANM", "outside the ANM grid")
            ) : (
              <>
                <b className="tabular">{signed(probe.v)} °C</b>
              </>
            )}
          </div>
        ) : null}
      </div>
      <figcaption className="grid gap-2">
        <div className="grid max-w-[360px] gap-1 text-[12px] text-subtle">
          <div className="flex h-2.5 overflow-hidden rounded-[2px] border border-border-strong">
            {MAP_RAMP.map((c) => (
              <i key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="relative h-4 tabular">
            {MAP_BREAKS.map((b, i) => (
              <span
                key={b}
                className="absolute -translate-x-1/2"
                style={{ left: `${((i + 1) / MAP_RAMP.length) * 100}%` }}
              >
                {b.toLocaleString(pick("ro-RO", "en-GB"), { minimumFractionDigits: 1 })}
              </span>
            ))}
          </div>
          <span>{pick("°C mai cald", "°C warmer")}</span>
        </div>
        <span className="text-[13px] text-subtle">
          {pick(
            `Cu cât a crescut temperatura medie anuală din ${data.ref[0]}–${data.ref[1]} până în ${data.now[0]}–${data.now[1]}, pe grila ANM de 4 km. În medie, România s-a încălzit cu ${fmt(data.map.mean, 1)} °C. Punctele sunt locurile rețelei noastre.`,
            `How much the mean annual temperature rose from ${data.ref[0]}–${data.ref[1]} to ${data.now[0]}–${data.now[1]}, on the 4 km ANM grid. On average Romania warmed by ${fmt(data.map.mean, 1)} °C. Dots are the places of our network.`,
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export function NetworkStripes() {
  const data = useStripes();
  const rows = useMemo(() => {
    if (!data) return [];
    // Places on the same grid cells share one band.
    const groups = new Map<string, { points: LwPoint[]; s: StripePoint }>();
    for (const p of LW_POINTS) {
      const s = data.points[p.key];
      if (!s) continue;
      const id = s.t.join(",");
      if (!groups.has(id)) groups.set(id, { points: [], s });
      groups.get(id)!.points.push(p);
    }
    return [...groups.values()]
      .map((g) => ({ ...g, sum: summary(data, g.s) }))
      .sort((a, b) => b.sum.warming - a.sum.warming);
  }, [data]);
  if (!data || !rows.length) return null;
  const [y0, y1] = data.years;
  const places = rows.flatMap((r) => r.points.map((p) => ({ p, warming: r.sum.warming })));
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-start">
      <div className="min-w-0">
        <ul
          className="grid gap-[3px]"
          aria-label={pick(
            "Dungi climatice ale locurilor rețelei",
            "Climate stripes of the network places",
          )}
        >
          {rows.map((r) => (
            // Phones: name and warming above a full-width band; wider screens: one row.
            <li
              key={r.points[0].key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-0.5 max-sm:mb-1.5 sm:grid-cols-[minmax(0,210px)_minmax(0,1fr)_56px]"
            >
              <Link
                to={sheetKey(r.points[0])}
                className="truncate text-[13px] font-medium hover:text-accent hover:underline"
                title={r.points.map((p) => p.ro).join(" · ")}
              >
                {r.points[0].ro}
                {r.points.length > 1 ? (
                  <span className="text-subtle"> +{r.points.length - 1}</span>
                ) : null}
              </Link>
              <Band
                className="order-3 col-span-2 sm:order-none sm:col-span-1"
                values={r.s.t}
                height={24}
                color={(i) => (isNum(r.s.t[i]) ? tColor(r.s.t[i]! - r.sum.ref) : null)}
                label={pick(
                  `Dungi climatice, ${r.points[0].ro}`,
                  `Climate stripes, ${r.points[0].ro}`,
                )}
                tip={(i) => ({
                  title: `${r.points[0].ro}, ${y0 + i}`,
                  rows: isNum(r.s.t[i])
                    ? [
                        {
                          value: `${fmt(r.s.t[i], 1)} °C`,
                          label: pick("media anului", "annual mean"),
                        },
                        {
                          value: `${signed(r.s.t[i]! - r.sum.ref)} °C`,
                          label: pick(
                            `față de ${data.ref[0]}–${data.ref[1]}`,
                            `vs ${data.ref[0]}–${data.ref[1]}`,
                          ),
                          color: tColor(r.s.t[i]! - r.sum.ref),
                        },
                      ]
                    : [{ value: pick("an incomplet", "incomplete year") }],
                })}
              />
              <span className="order-2 text-right text-[13px] font-semibold tabular sm:order-none">
                {signed(r.sum.warming)}°
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-1 grid gap-2.5 text-[12px] text-subtle tabular sm:grid-cols-[minmax(0,210px)_minmax(0,1fr)_56px]">
          <span className="max-sm:hidden" />
          <span className="flex justify-between">
            <span>{y0}</span>
            <span>{y1}</span>
          </span>
          <span className="text-right max-sm:hidden">{pick("încălzire", "warming")}</span>
        </div>
        <div className="mt-4">
          <ScaleBar
            neg={COLD}
            pos={WARM}
            range={T_RANGE}
            unit=" °C"
            left={pick(
              `mai rece decât ${data.ref[0]}–${data.ref[1]}`,
              `colder than ${data.ref[0]}–${data.ref[1]}`,
            )}
            right={pick("mai cald", "warmer")}
          />
        </div>
        <p className="mt-3 text-[13px] text-subtle">
          {pick(
            `Fiecare dungă este un an, de la ${y0} la ${y1}, față de media ${data.ref[0]}–${data.ref[1]} a aceluiași loc. Cifra din dreapta: cu cât a fost mai cald în ${data.now[0]}–${data.now[1]}. Locurile aflate pe aceleași celule ale grilei au o singură bandă. Sursa: ANM, date climatice gridate zilnice omogenizate, CC BY 4.0.`,
            `Each stripe is a year, from ${y0} to ${y1}, against the ${data.ref[0]}–${data.ref[1]} mean of the same place. The figure on the right: how much warmer ${data.now[0]}–${data.now[1]} was. Places on the same grid cells share one band. Source: ANM, homogenised daily gridded climate data, CC BY 4.0.`,
          )}
        </p>
      </div>
      <WarmingMap data={data} places={places} />
    </div>
  );
}
