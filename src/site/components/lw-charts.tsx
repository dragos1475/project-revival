// Small SVG charts of the site sheets: climograph, horizontal bars and yearly bars.
import { fmt, type LwClimate } from "../content/lw";

export const MONTHS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "noi", "dec"];

/** Precipitation bars, mean temperature line and the monthly min to max band; optional second series. */
export function Climograph({ main, compare, label }: { main: LwClimate; compare?: { t: number[] } | null; label: string }) {
  const W = 680, H = 290, L = 46, R = 50, T = 18, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const temps = [...main.t, ...(main.tmin ?? []), ...(main.tmax ?? []), ...(compare?.t ?? [])];
  const tmin = Math.floor(Math.min(...temps, 0) / 5) * 5;
  const tmax = Math.ceil(Math.max(...temps) / 5) * 5;
  const pmax = Math.ceil(Math.max(...main.p) / 20) * 20 || 20;
  const bw = iw / 12;
  const x = (i: number) => L + bw * i + bw / 2;
  const yt = (v: number) => T + ih - ((v - tmin) / (tmax - tmin)) * ih;
  const yp = (v: number) => T + ih - (v / pmax) * ih;
  const band = main.tmin && main.tmax ? [...main.tmax.map((v, i) => `${x(i)},${yt(v)}`), ...main.tmin.slice().reverse().map((v, j) => `${x(11 - j)},${yt(v)}`)].join(" ") : null;
  return (
    <svg className="climograph block h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((k) => {
        const tv = tmin + ((tmax - tmin) * k) / 4;
        const yy = yt(tv);
        return (
          <g key={k}>
            <line x1={L} x2={W - R} y1={yy} y2={yy} stroke="var(--chart-grid)" />
            <text x={L - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="var(--chart-axis)">{Math.round(tv)}°</text>
            <text x={W - R + 8} y={yy + 4} fontSize="11" fill="var(--cg-p-text)">{Math.round((pmax * k) / 4)}</text>
          </g>
        );
      })}
      {tmin < 0 ? <line x1={L} x2={W - R} y1={yt(0)} y2={yt(0)} stroke="var(--chart-axis)" strokeOpacity="0.6" strokeDasharray="3 3" /> : null}
      {main.p.map((v, i) => (
        <rect key={i} x={x(i) - bw * 0.32} y={yp(v)} width={bw * 0.64} height={T + ih - yp(v)} rx="3" fill="var(--cg-p)">
          <title>{`${MONTHS[i]}: ${v} mm`}</title>
        </rect>
      ))}
      {band ? <polygon points={band} fill="var(--cg-band)" opacity="0.14" /> : null}
      {compare ? <polyline points={compare.t.map((v, i) => `${x(i)},${yt(v)}`).join(" ")} fill="none" stroke="#C96F12" strokeWidth="2.4" strokeDasharray="6 4" /> : null}
      <polyline points={main.t.map((v, i) => `${x(i)},${yt(v)}`).join(" ")} fill="none" stroke="var(--cg-t)" strokeWidth="2.8" />
      {main.t.map((v, i) => (
        <circle key={i} cx={x(i)} cy={yt(v)} r="3.5" fill="var(--cg-t)">
          <title>{`${MONTHS[i]}: ${v} °C`}</title>
        </circle>
      ))}
      {MONTHS.map((m, i) => (
        <text key={m} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--chart-axis)">{m}</text>
      ))}
      <text x="12" y={T + ih / 2} fontSize="11" fill="var(--chart-axis)" transform={`rotate(-90 12 ${T + ih / 2})`} textAnchor="middle">°C</text>
      <text x={W - 10} y={T + ih / 2} fontSize="11" fill="var(--cg-p-text)" transform={`rotate(90 ${W - 10} ${T + ih / 2})`} textAnchor="middle">mm</text>
    </svg>
  );
}

export function ClimographLegend({ compare }: { compare?: string }) {
  return (
    <div className="my-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
      <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-3.5 rounded-[2px] bg-[var(--cg-t)]" />Temperatura medie</span>
      <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-3.5 rounded-[2px] bg-[var(--cg-band)] opacity-30" />Minima și maxima lunii</span>
      <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-3.5 rounded-[2px] bg-[var(--cg-p)]" />Precipitații</span>
      {compare ? <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-3.5 bg-[#C96F12]" />{compare}</span> : null}
    </div>
  );
}

/** Horizontal bars with a label and a value per row. */
export function Bars({ rows }: { rows: { g: string; n: number }[] }) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <div className="grid gap-1.5">
      {rows.map((r) => (
        <div key={r.g} className="grid grid-cols-[100px_1fr_50px] items-center gap-2.5 text-[13px] sm:grid-cols-[130px_1fr_60px]">
          <span className="truncate">{r.g}</span>
          <span className="relative h-3 overflow-hidden rounded-[3px] bg-surface-2">
            <i className="absolute inset-y-0 left-0 rounded-[3px] bg-brand-green" style={{ width: `${((r.n / max) * 100).toFixed(1)}%` }} />
          </span>
          <span className="tabular text-right text-subtle">{fmt(r.n)}</span>
        </div>
      ))}
    </div>
  );
}

/** Yearly bars, for example iNaturalist observations per year. */
export function YearBars({ data, label }: { data: Record<string, number>; label: string }) {
  const ys = Object.keys(data).sort();
  if (!ys.length) return null;
  const W = 680, H = 200, L = 40, T = 12, B = 28;
  const iw = W - L - 10, ih = H - T - B;
  const max = Math.max(...ys.map((y) => data[y])) || 1;
  const bw = iw / ys.length;
  return (
    <svg className="block h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ys.map((y, i) => {
        const h = (data[y] / max) * ih;
        return (
          <g key={y}>
            <rect x={L + i * bw + bw * 0.15} y={T + ih - h} width={bw * 0.7} height={h} rx="2" fill="var(--color-brand-green)">
              <title>{`${y}: ${fmt(data[y])}`}</title>
            </rect>
            {ys.length <= 16 || i % 2 === 0 ? <text x={L + i * bw + bw / 2} y={H - 9} fontSize="10.5" textAnchor="middle" fill="var(--chart-axis)">{String(y).slice(-2)}</text> : null}
          </g>
        );
      })}
      <text x={L - 6} y={T + 8} fontSize="10.5" textAnchor="end" fill="var(--chart-axis)">{fmt(max)}</text>
    </svg>
  );
}
