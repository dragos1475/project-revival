// Climate context of a network point from its ANM reference station: normals 1991–2020, the last 24 months
// and every year of the series against those normals. Data: public/data/climate-anm.json, built by
// scripts/climate_anm.py from the ANM open data portal.
import { useEffect, useState } from "react";
import { fmt, meanOf, type LwPoint } from "../content/lw";
import { pick } from "../i18n/core";
import { H3, KeyValues } from "./lw-ui";
import { HoverChart, type Tip } from "./chart-hover";

interface AnmStation {
  name: string;
  county?: string | null;
  elev: number;
  since: string;
  normal: {
    t: (number | null)[];
    tx: (number | null)[];
    tn: (number | null)[];
    p: (number | null)[];
  };
  y0: number;
  years: { t: (number | null)[]; p: (number | null)[] };
  recent: { m: string; t: number | null; p: number | null; d: number }[];
}
interface AnmClimate {
  source: string;
  url: string;
  end: string;
  normal: [number, number];
  stations: Record<string, AnmStation>;
  points: Record<string, { wsi: string; km: number; elev: number }>;
}

let request: Promise<AnmClimate | null> | null = null;
const loadAnm = () =>
  (request ??= fetch(`${import.meta.env.BASE_URL}data/climate-anm.json`)
    .then((r) => (r.ok ? (r.json() as Promise<AnmClimate>) : null))
    .catch(() => null));

const MON = () =>
  pick(
    "ian feb mar apr mai iun iul aug sep oct noi dec",
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec",
  ).split(" ");
const MON_LONG = () =>
  pick(
    "ianuarie februarie martie aprilie mai iunie iulie august septembrie octombrie noiembrie decembrie",
    "January February March April May June July August September October November December",
  ).split(" ");
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
const signed = (v: number, digits = 1) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmt(Math.abs(v), digits)}`;
const isNum = (v: number | null | undefined): v is number => v != null;
const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0);

/** Bars above and below a zero line, for anomalies. Missing values leave a gap. */
function DivergingBars({
  values,
  tip,
  ticks,
  pos,
  neg,
  unit,
  label,
  faded,
  floor,
}: {
  values: (number | null)[];
  /** Readout of a column on hover or keyboard focus. */
  tip: (i: number) => Tip;
  ticks: (string | null)[];
  pos: string;
  neg: string;
  unit: string;
  label: string;
  faded?: boolean[];
  /** Fixed bottom of the scale, for example −100 % for precipitation; symmetric otherwise. */
  floor?: number;
}) {
  const W = 680,
    H = 190,
    L = 44,
    R = 8,
    T = 12,
    B = 30;
  const iw = W - L - R,
    ih = H - T - B;
  const vals = values.filter(isNum);
  const peak = Math.max(...vals.map(Math.abs), 0.1);
  const step = peak > 40 ? 50 : peak > 4 ? 2 : peak > 2 ? 1 : 0.5;
  const top = Math.ceil(Math.max(floor == null ? peak : Math.max(...vals, 0), step) / step) * step;
  const bottom = floor ?? -top;
  const bw = iw / values.length;
  const y = (v: number) => T + ((top - v) / (top - bottom)) * ih;
  return (
    <HoverChart
      W={W}
      H={H}
      n={values.length}
      x0={L}
      bw={bw}
      label={label}
      tip={tip}
      anchorY={(i) => {
        const v = values[i];
        return v == null ? y(0) : Math.min(y(v), y(0));
      }}
    >
      {(active) => (
        <>
          {[top, 0, bottom].map((v) => (
            <g key={v}>
              <line
                x1={L}
                x2={W - R}
                y1={y(v)}
                y2={y(v)}
                stroke={v === 0 ? "var(--chart-axis)" : "var(--chart-grid)"}
                strokeOpacity={v === 0 ? 0.6 : 1}
              />
              <text
                x={L - 6}
                y={y(v) + 4}
                fontSize="11"
                textAnchor="end"
                fill="var(--chart-axis)"
              >{`${signed(v, step < 1 ? 1 : 0)}${unit}`}</text>
            </g>
          ))}
          {values.map((v, i) =>
            v == null ? null : (
              <rect
                key={i}
                x={L + i * bw + bw * 0.12}
                y={Math.min(y(v), y(0))}
                width={Math.max(bw * 0.76, 1)}
                height={Math.max(Math.abs(y(v) - y(0)), 0.5)}
                rx={bw > 6 ? 2 : 0}
                fill={v >= 0 ? pos : neg}
                opacity={faded?.[i] ? 0.45 : 1}
                stroke={i === active ? "var(--chart-axis)" : undefined}
                strokeWidth={i === active ? 1.5 : undefined}
              />
            ),
          )}
          {ticks.map((tk, i) =>
            tk ? (
              <text
                key={i}
                x={L + i * bw + bw / 2}
                y={H - 10}
                fontSize="10.5"
                textAnchor="middle"
                fill="var(--chart-axis)"
              >
                {tk}
              </text>
            ) : null,
          )}
        </>
      )}
    </HoverChart>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {items.map(([color, text]) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-3.5 rounded-[2px]" style={{ background: color }} />
          {text}
        </span>
      ))}
    </div>
  );
}

export function AnmClimateContext({ p }: { p: LwPoint }) {
  const [data, setData] = useState<AnmClimate | null | undefined>(undefined);
  useEffect(() => {
    let on = true;
    void loadAnm().then((d) => on && setData(d));
    return () => {
      on = false;
    };
  }, []);

  const ref = data?.points[p.key];
  if (data === undefined)
    return (
      <p className="mb-6 text-subtle">{pick("Se încarcă datele ANM…", "Loading ANM data…")}</p>
    );
  if (!data || !ref) return null;
  const s = data.stations[ref.wsi];
  const [n0, n1] = data.normal;
  const mon = MON();
  const nT = s.normal.t,
    nP = s.normal.p;
  const normT = meanOf(nT.filter(isNum));
  const normP = sum(nP.filter(isNum));
  const endDay = new Date(`${data.end}T12:00:00`);
  const endText = `${endDay.getDate()} ${MON_LONG()[endDay.getMonth()]} ${endDay.getFullYear()}`;

  // The last 24 months against the normal of each calendar month; the current month is partial.
  const months = s.recent.map((r, i) => {
    const [y, m] = r.m.split("-").map(Number);
    const full = daysIn(y, m);
    const partial = i === s.recent.length - 1 && r.d < full;
    const tA = isNum(r.t) && isNum(nT[m - 1]) ? +(r.t - nT[m - 1]!).toFixed(1) : null;
    const pN = isNum(nP[m - 1]) ? (nP[m - 1]! * (partial ? r.d : full)) / full : null;
    const pA = isNum(r.p) && pN ? Math.round((r.p / pN - 1) * 100) : null;
    return { ...r, y, m, partial, tA, pA, pN };
  });
  const longLabel = (x: (typeof months)[number]) =>
    `${MON_LONG()[x.m - 1]} ${x.y}${x.partial ? pick(`, până pe ${x.d}`, `, to day ${x.d}`) : ""}`;
  const last12 = months.slice(-12);
  const t12 = last12.map((x) => x.tA).filter(isNum);
  const p12 = last12.filter((x) => isNum(x.p) && x.pN && !x.partial);
  const p12pct = p12.length
    ? Math.round((sum(p12.map((x) => x.p!)) / sum(p12.map((x) => x.pN!)) - 1) * 100)
    : null;

  // Every year with complete data, against the annual normal.
  const years = s.years.t.map((t, i) => ({ y: s.y0 + i, t, p: s.years.p[i] }));
  const valid = years.filter((x): x is { y: number; t: number; p: number | null } => isNum(x.t));
  const lastYear = years[years.length - 1];
  const ranked = [...valid].sort((a, b) => b.t - a.t);
  const rank = isNum(lastYear.t) ? ranked.findIndex((x) => x.y === lastYear.y) + 1 : 0;
  const since = valid.filter((x) => x.y >= 1961);
  let trend: number | null = null;
  if (since.length >= 30) {
    const xm = meanOf(since.map((x) => x.y));
    const ym = meanOf(since.map((x) => x.t));
    trend = sum(since.map((x) => (x.y - xm) * (x.t - ym))) / sum(since.map((x) => (x.y - xm) ** 2));
  }

  const dz = s.elev - ref.elev;
  const where = s.county
    ? `${s.name} (${pick(`județul ${s.county}`, `${s.county} county`)})`
    : s.name;
  const cell = "border-b border-border px-2 py-1.5 text-right tabular";

  return (
    <div className="mb-9">
      <H3>{pick("Context climatic din datele ANM", "Climate context from ANM data")}</H3>
      <p className="mb-4 max-w-[860px] text-muted">
        {pick(
          `Stația meteorologică ANM de referință este ${where}, la ${fmt(ref.km, 1)} km de acest loc, la ${fmt(s.elev)} m altitudine (locul: circa ${fmt(ref.elev)} m). Are măsurători din ${s.since}. Comparăm lunile și anii cu normala climatică ${n0}–${n1} a stației.`,
          `The ANM reference weather station is ${where}, ${fmt(ref.km, 1)} km from this place, at ${fmt(s.elev)} m elevation (this place: about ${fmt(ref.elev)} m). It has measurements since ${s.since}. Months and years are compared with the station's ${n0}–${n1} climate normal.`,
        )}
        {Math.abs(dz) >= 150
          ? pick(
              ` Stația este cu ${fmt(Math.abs(dz))} m mai ${dz > 0 ? "sus" : "jos"}, deci aici e de obicei cu circa ${fmt((Math.abs(dz) * 0.6) / 100, 1)} °C mai ${dz > 0 ? "cald" : "rece"} decât la stație.`,
              ` The station lies ${fmt(Math.abs(dz))} m ${dz > 0 ? "higher" : "lower"}, so this place is usually about ${fmt((Math.abs(dz) * 0.6) / 100, 1)} °C ${dz > 0 ? "warmer" : "colder"} than the station.`,
            )
          : null}
      </p>
      <KeyValues
        className="mb-5"
        rows={[
          [
            pick(`Normala ${n0}–${n1}`, `Normal ${n0}–${n1}`),
            `${fmt(normT, 1)} °C · ${fmt(normP)} mm${pick("/an", "/yr")}`,
          ],
          [
            pick("Ultimele 12 luni, temperatura", "Last 12 months, temperature"),
            t12.length ? `${signed(meanOf(t12))} °C ${pick("față de normală", "vs normal")}` : null,
          ],
          [
            pick("Ultimele 12 luni, precipitații", "Last 12 months, precipitation"),
            p12pct != null
              ? `${signed(p12pct, 0)} % ${pick("față de normală", "vs normal")}`
              : null,
          ],
          [
            pick(`Anul ${lastYear.y}`, `Year ${lastYear.y}`),
            isNum(lastYear.t)
              ? `${fmt(lastYear.t, 1)} °C (${signed(lastYear.t - normT)}) · ${pick(`locul ${rank} din ${valid.length} de ani`, `rank ${rank} of ${valid.length} years`)}`
              : null,
          ],
          [
            pick("Cel mai cald an", "Warmest year"),
            ranked[0] ? `${ranked[0].y} · ${fmt(ranked[0].t, 1)} °C` : null,
          ],
          [
            pick("Tendință din 1961", "Trend since 1961"),
            trend != null
              ? `${signed(trend * 10, 2)} °C ${pick("pe deceniu", "per decade")}`
              : null,
          ],
        ]}
      />

      <p className="mb-1 font-semibold">
        {pick(
          "Temperatura lunară față de normală, ultimele 24 de luni",
          "Monthly temperature against the normal, last 24 months",
        )}
      </p>
      <Legend
        items={[
          ["var(--an-warm)", pick("mai cald decât normal", "warmer than normal")],
          ["var(--an-cold)", pick("mai rece decât normal", "colder than normal")],
        ]}
      />
      <DivergingBars
        values={months.map((x) => x.tA)}
        tip={(i) => {
          const x = months[i];
          return {
            title: longLabel(x),
            rows: isNum(x.t)
              ? [
                  { value: `${fmt(x.t, 1)} °C`, label: pick("media lunii", "monthly mean") },
                  ...(isNum(x.tA)
                    ? [
                        {
                          value: `${signed(x.tA)} °C`,
                          label: pick(
                            `față de normală (${fmt(nT[x.m - 1], 1)} °C)`,
                            `vs normal (${fmt(nT[x.m - 1], 1)} °C)`,
                          ),
                          color: x.tA >= 0 ? "var(--an-warm)" : "var(--an-cold)",
                        },
                      ]
                    : []),
                ]
              : [{ value: pick("fără date complete", "no complete data") }],
          };
        }}
        ticks={months.map((x, i) =>
          i % 3 === 0 ? `${mon[x.m - 1]} ${String(x.y).slice(2)}` : null,
        )}
        faded={months.map((x) => x.partial)}
        pos="var(--an-warm)"
        neg="var(--an-cold)"
        unit="°"
        label={pick(
          `Abaterea temperaturii lunare la ${s.name}`,
          `Monthly temperature anomaly at ${s.name}`,
        )}
      />
      <p className="mt-4 mb-1 font-semibold">
        {pick(
          "Precipitațiile lunare față de normală, ultimele 24 de luni",
          "Monthly precipitation against the normal, last 24 months",
        )}
      </p>
      <Legend
        items={[
          ["var(--an-wet)", pick("mai ploios decât normal", "wetter than normal")],
          ["var(--an-dry)", pick("mai secetos decât normal", "drier than normal")],
        ]}
      />
      <DivergingBars
        values={months.map((x) => x.pA)}
        tip={(i) => {
          const x = months[i];
          return {
            title: longLabel(x),
            rows: isNum(x.p)
              ? [
                  { value: `${fmt(x.p)} mm`, label: pick("în lună", "in the month") },
                  ...(isNum(x.pA)
                    ? [
                        {
                          value: `${signed(x.pA, 0)} %`,
                          label: pick(
                            `față de normală (${fmt(x.pN)} mm)`,
                            `vs normal (${fmt(x.pN)} mm)`,
                          ),
                          color: x.pA >= 0 ? "var(--an-wet)" : "var(--an-dry)",
                        },
                      ]
                    : []),
                ]
              : [{ value: pick("fără date complete", "no complete data") }],
          };
        }}
        ticks={months.map((x, i) =>
          i % 3 === 0 ? `${mon[x.m - 1]} ${String(x.y).slice(2)}` : null,
        )}
        faded={months.map((x) => x.partial)}
        pos="var(--an-wet)"
        neg="var(--an-dry)"
        unit="%"
        floor={-100}
        label={pick(
          `Abaterea precipitațiilor lunare la ${s.name}`,
          `Monthly precipitation anomaly at ${s.name}`,
        )}
      />
      {months.some((x) => x.t == null) ? (
        <p className="text-[13px] text-subtle">
          {pick(
            "Golurile sunt luni fără date complete în sursa ANM.",
            "Gaps are months without complete data in the ANM source.",
          )}
        </p>
      ) : null}

      <p className="mt-5 mb-1 font-semibold">
        {pick(
          `Temperatura fiecărui an față de normală, ${valid[0]?.y}–${lastYear.y}`,
          `Temperature of each year against the normal, ${valid[0]?.y}–${lastYear.y}`,
        )}
      </p>
      <DivergingBars
        values={years.map((x) => (isNum(x.t) ? +(x.t - normT).toFixed(2) : null))}
        tip={(i) => {
          const x = years[i];
          return {
            title: String(x.y),
            rows: isNum(x.t)
              ? [
                  { value: `${fmt(x.t, 1)} °C`, label: pick("media anului", "annual mean") },
                  {
                    value: `${signed(x.t - normT)} °C`,
                    label: pick(
                      `față de normală (${fmt(normT, 1)} °C)`,
                      `vs normal (${fmt(normT, 1)} °C)`,
                    ),
                    color: x.t >= normT ? "var(--an-warm)" : "var(--an-cold)",
                  },
                  ...(isNum(x.p)
                    ? [{ value: `${fmt(x.p)} mm`, label: pick("precipitații", "precipitation") }]
                    : []),
                ]
              : [{ value: pick("an incomplet în sursa ANM", "incomplete year in the ANM source") }],
          };
        }}
        ticks={years.map((x) => (x.y % 20 === 0 ? String(x.y) : null))}
        pos="var(--an-warm)"
        neg="var(--an-cold)"
        unit="°"
        label={pick(
          `Abaterea temperaturii anuale la ${s.name}`,
          `Annual temperature anomaly at ${s.name}`,
        )}
      />

      <div className="my-3.5 overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <caption className="px-2 pt-2 text-left text-[12px] font-semibold text-subtle uppercase">
            {pick(
              `Normalele lunare ${n0}–${n1}, ${s.name}`,
              `Monthly normals ${n0}–${n1}, ${s.name}`,
            )}
          </caption>
          <thead>
            <tr className="text-[12px] text-subtle uppercase">
              <th className="border-b border-border px-2 py-2" />
              {mon.map((m) => (
                <th key={m} className="border-b border-border px-2 py-2 text-right font-semibold">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                [pick("T medie °C", "Mean T °C"), s.normal.t, 1],
                [pick("T maximă °C", "Max T °C"), s.normal.tx, 1],
                [pick("T minimă °C", "Min T °C"), s.normal.tn, 1],
                [pick("Precipitații mm", "Precipitation mm"), s.normal.p, 0],
              ] as [string, (number | null)[], number][]
            ).map(([name, v, digits]) => (
              <tr key={name}>
                <td className="border-b border-border px-2 py-1.5 whitespace-nowrap">{name}</td>
                {v.map((x, i) => (
                  <td key={i} className={cell}>
                    {fmt(x, digits)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-subtle">
        {pick(
          `Sursa: Administrația Națională de Meteorologie, date climatice zilnice validate, licență CC BY 4.0. Date până la ${endText}. `,
          `Source: Romanian National Meteorological Administration (ANM), validated daily climate data, CC BY 4.0 licence. Data up to ${endText}. `,
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
