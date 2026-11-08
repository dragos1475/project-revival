import { useMemo } from "react";

/** Min/max envelope sparkline. Accepts long series and buckets them to ~60 columns. */
export function Sparkline({ values, width = 80, height = 24, className }: { values: ArrayLike<number>; width?: number; height?: number; className?: string }) {
  const path = useMemo(() => {
    const n = values.length;
    if (!n) return "";
    const buckets = Math.min(60, n);
    const cols: [number, number, number][] = [];
    let lo = Infinity, hi = -Infinity;
    for (let b = 0; b < buckets; b++) {
      let mn = Infinity, mx = -Infinity;
      for (let i = Math.floor((b * n) / buckets); i < Math.floor(((b + 1) * n) / buckets); i++) {
        const v = values[i];
        if (Number.isNaN(v)) continue;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      if (mn === Infinity) continue;
      cols.push([b, mn, mx]);
      lo = Math.min(lo, mn);
      hi = Math.max(hi, mx);
    }
    if (!cols.length) return "";
    const span = hi - lo || 1;
    const x = (b: number) => (b / Math.max(1, buckets - 1)) * width;
    const y = (v: number) => height - 2 - ((v - lo) / span) * (height - 4);
    const top = cols.map(([b, , mx], i) => `${i ? "L" : "M"}${x(b).toFixed(1)} ${y(mx).toFixed(1)}`).join(" ");
    const bottom = cols.slice().reverse().map(([b, mn]) => `L${x(b).toFixed(1)} ${y(mn).toFixed(1)}`).join(" ");
    return `${top} ${bottom} Z`;
  }, [values, width, height]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none" aria-hidden className={className}>
      <path d={path} className="fill-accent/15 stroke-accent" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
