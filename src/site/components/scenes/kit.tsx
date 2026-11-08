// Drawing kit for the page scenes: a seeded random source, smooth paths and small reusable motifs.
// Everything here is deterministic, so the prerendered SVG and the hydrated one are identical.
import type { CSSProperties, ReactNode } from "react";

/** Scene canvas. Boxes crop it with "slice", so the subject stays inside SAFE and the edges only extend it. */
export const W = 400;
export const H = 200;
export const SAFE = { x0: 70, x1: 330, y0: 44, y1: 156 } as const;

export type Pt = readonly [number, number];

/** Small seeded generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const n = (v: number) => String(Math.round(v * 10) / 10 || 0);

export function poly(points: readonly Pt[], closed = false) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("") + (closed ? "Z" : "");
}

/** Catmull-Rom spline through the points, written as cubic Béziers. */
export function smooth(points: readonly Pt[], closed = false) {
  const p = points;
  const len = p.length;
  if (len < 3) return poly(p, closed);
  const at = (i: number) => (closed ? p[(i + len) % len] : p[Math.max(0, Math.min(len - 1, i))]);
  let d = `M${n(p[0][0])} ${n(p[0][1])}`;
  const segs = closed ? len : len - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

export function sample(fn: (x: number) => number, step = 8, x0 = -12, x1 = W + 12): Pt[] {
  const out: Pt[] = [];
  for (let x = x0; x <= x1 + 0.01; x += step) out.push([x, fn(x)]);
  return out;
}

/** Closed band between an upper and a lower line sampled at the same x positions. */
export function band(top: readonly Pt[], bottom: readonly Pt[]) {
  return `${smooth(top)}L${smooth([...bottom].reverse()).slice(1)}Z`;
}

/** Points every `step` units along a polyline, for distance tests. */
export function densify(points: readonly Pt[], step = 4): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j < k; j++) out.push([x0 + ((x1 - x0) * j) / k, y0 + ((y1 - y0) * j) / k]);
  }
  out.push(points[points.length - 1]);
  return out;
}

export const near = (pts: readonly Pt[], x: number, y: number, d: number) => pts.some(([px, py]) => Math.abs(px - x) < d && Math.hypot(px - x, py - y) < d);

/** A filled band under a line, down to `bottom`. */
export function under(points: readonly Pt[], bottom = H + 6, curved = true) {
  const first = points[0], last = points[points.length - 1];
  return `${curved ? smooth(points) : poly(points)}L${n(last[0])} ${bottom}L${n(first[0])} ${bottom}Z`;
}

/** Mountain profile: sharp peaks summed with a little seeded roughness. */
export function ridge(seed: number, base: number, peaks: readonly { x: number; h: number; w: number }[], rough = 2.5) {
  const r = rng(seed);
  const a = r() * 6, b = r() * 6;
  return (x: number) => {
    let top = 0;
    for (const p of peaks) top = Math.max(top, p.h * Math.max(0, 1 - Math.abs(x - p.x) / p.w) ** 1.25);
    return base - top + rough * (Math.sin(x * 0.19 + a) * 0.6 + Math.sin(x * 0.47 + b) * 0.4);
  };
}

/** Gentle rolling line. */
export function rolling(seed: number, base: number, amp: number, len = 90) {
  const r = rng(seed);
  const a = r() * 6, b = r() * 6;
  return (x: number) => base + amp * (Math.sin(x / len + a) * 0.7 + Math.sin(x / (len * 0.43) + b) * 0.3);
}

/** Irregular closed loop, used for contour lines, lakes and islands. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.14, steps = 28) {
  const r = rng(seed);
  const a = r() * 6, b = r() * 6, c = r() * 6;
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const k = 1 + wobble * (Math.sin(2 * t + a) * 0.55 + Math.sin(3 * t + b) * 0.3 + Math.sin(5 * t + c) * 0.15);
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  return smooth(pts, true);
}

export function scatter(seed: number, count: number, x0: number, x1: number, y0: number, y1: number, keep?: (x: number, y: number) => boolean): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  for (let tries = 0; out.length < count && tries < count * 20; tries++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
    if (!keep || keep(x, y)) out.push([x, y]);
  }
  return out;
}

/* Motifs. Each returns path data so a whole forest is one element. */

export function conifers(points: readonly Pt[], h: number, jitter = 0.35, seed = 1) {
  const r = rng(seed);
  return points
    .map(([x, y]) => {
      const t = h * (1 - jitter / 2 + r() * jitter);
      const w = t * 0.3;
      return `M${n(x)} ${n(y - t)}L${n(x + w * 0.62)} ${n(y - t * 0.5)}L${n(x + w * 0.34)} ${n(y - t * 0.5)}L${n(x + w)} ${n(y)}L${n(x - w)} ${n(y)}L${n(x - w * 0.34)} ${n(y - t * 0.5)}L${n(x - w * 0.62)} ${n(y - t * 0.5)}Z`;
    })
    .join("");
}

/** Round crowns (broadleaf trees and willows) as arcs, drawn above the base point. */
export function crowns(points: readonly Pt[], r0: number, seed = 2) {
  const r = rng(seed);
  return points
    .map(([x, y]) => {
      const rad = r0 * (0.75 + r() * 0.5);
      const cy = y - rad * 0.95;
      return `M${n(x - rad)} ${n(cy)}a${n(rad)} ${n(rad * 0.92)} 0 1 1 ${n(rad * 2)} 0a${n(rad)} ${n(rad * 0.92)} 0 1 1 ${n(-rad * 2)} 0Z`;
    })
    .join("");
}

export function trunks(points: readonly Pt[], h: number) {
  return points.map(([x, y]) => `M${n(x)} ${n(y)}V${n(y - h)}`).join("");
}

/** Tall narrow poplars, the usual line of trees along Danube embankments. */
export function poplars(points: readonly Pt[], h: number, seed = 3) {
  const r = rng(seed);
  return points
    .map(([x, y]) => {
      const t = h * (0.8 + r() * 0.4), w = t * 0.16;
      return `M${n(x)} ${n(y - t)}C${n(x + w * 1.3)} ${n(y - t * 0.7)} ${n(x + w)} ${n(y - t * 0.15)} ${n(x)} ${n(y)}C${n(x - w)} ${n(y - t * 0.15)} ${n(x - w * 1.3)} ${n(y - t * 0.7)} ${n(x)} ${n(y - t)}Z`;
    })
    .join("");
}

/** Reed stems with a lean, some with a seed head. */
export function reeds(x0: number, x1: number, y: (x: number) => number, count: number, h: number, seed = 4) {
  const r = rng(seed);
  let stems = "", heads = "";
  for (let i = 0; i < count; i++) {
    const x = x0 + ((x1 - x0) * (i + r() * 0.8)) / count;
    const base = y(x), t = h * (0.55 + r() * 0.6), lean = (r() - 0.4) * t * 0.35;
    stems += `M${n(x)} ${n(base)}Q${n(x + lean * 0.2)} ${n(base - t * 0.6)} ${n(x + lean)} ${n(base - t)}`;
    if (r() < 0.35) heads += `M${n(x + lean * 0.86)} ${n(base - t * 0.9)}L${n(x + lean * 1.04)} ${n(base - t * 1.06)}`;
  }
  return { stems, heads };
}

export function grass(x0: number, x1: number, y: (x: number) => number, count: number, h: number, seed = 5) {
  const r = rng(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = x0 + (x1 - x0) * r(), base = y(x), t = h * (0.5 + r() * 0.7);
    d += `M${n(x - 1.6)} ${n(base)}L${n(x - 0.6)} ${n(base - t * 0.7)}M${n(x)} ${n(base)}L${n(x + 0.4)} ${n(base - t)}M${n(x + 1.5)} ${n(base)}L${n(x + 2.2)} ${n(base - t * 0.6)}`;
  }
  return d;
}

/** A gull in flight, centred on 0,0; flapping is done by CSS on the wrapper. */
export const BIRD = "M-5.5 0.6Q-2.8 -3 0 0.2Q2.8 -3 5.5 0.6";

type Flock = readonly { x: number; y: number; s?: number }[];

/** A flock crossing the scene slowly from left to right; each bird flaps on its own beat. */
export function Birds({ flock, delay = 0, duration = 64, opacity = 0.45 }: { flock: Flock; delay?: number; duration?: number; opacity?: number }) {
  return (
    <g className="scene-glide" style={{ animationDuration: `${duration}s`, animationDelay: `${-delay}s` }} fill="none" stroke="var(--foreground)" strokeOpacity={opacity} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
      {flock.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s ?? 1})`}>
          <path d={BIRD} className="scene-flap" style={{ animationDelay: `${-i * 0.55}s` }} />
        </g>
      ))}
    </g>
  );
}

/** Lattice mast with an anemometer: the flux and weather towers used at the stations. */
export function Tower({ x, y, h, color = "var(--brand-navy)" }: { x: number; y: number; h: number; color?: string }) {
  const top = y - h, w = h * 0.09;
  let brace = "";
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const y0 = y - (h * 0.92 * i) / steps, y1 = y - (h * 0.92 * (i + 1)) / steps;
    const k0 = w * (1 - (0.6 * i) / steps), k1 = w * (1 - (0.6 * (i + 1)) / steps);
    brace += i % 2 ? `M${n(x + k0)} ${n(y0)}L${n(x - k1)} ${n(y1)}` : `M${n(x - k0)} ${n(y0)}L${n(x + k1)} ${n(y1)}`;
  }
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${n(x - w)} ${n(y)}L${n(x - w * 0.4)} ${n(top + h * 0.08)}M${n(x + w)} ${n(y)}L${n(x + w * 0.4)} ${n(top + h * 0.08)}`} strokeOpacity={0.6} strokeWidth={1} />
      <path d={brace} strokeOpacity={0.35} strokeWidth={0.8} />
      <path d={`M${n(x)} ${n(top + h * 0.08)}V${n(top)}M${n(x - w * 2)} ${n(top + h * 0.12)}H${n(x + w * 2.2)}`} strokeOpacity={0.6} strokeWidth={1} />
      <circle cx={x + w * 2.2} cy={top + h * 0.12} r={1.4} fill={color} fillOpacity={0.5} stroke="none" />
      <circle cx={x} cy={top} r={1.6} fill="var(--brand-orange)" stroke="none" className="scene-breathe" />
    </g>
  );
}

/** Low field-station building. */
export function Hut({ x, y, w = 22, color = "var(--brand-navy)" }: { x: number; y: number; w?: number; color?: string }) {
  const h = w * 0.42;
  return (
    <g stroke={color} strokeLinejoin="round">
      <path d={`M${n(x - w / 2)} ${n(y)}V${n(y - h)}H${n(x + w / 2)}V${n(y)}Z`} fill="var(--surface)" strokeOpacity={0.55} strokeWidth={1} />
      <path d={`M${n(x - w / 2 - 2)} ${n(y - h)}L${n(x - w / 6)} ${n(y - h - w * 0.32)}H${n(x + w / 2 + 2)}L${n(x + w / 2)} ${n(y - h)}`} fill="var(--brand-orange)" fillOpacity={0.22} strokeOpacity={0.55} strokeWidth={1} />
      <path d={`M${n(x - w / 4)} ${n(y - h * 0.62)}h${n(w * 0.16)}M${n(x + w / 8)} ${n(y - h * 0.62)}h${n(w * 0.16)}`} strokeOpacity={0.45} strokeWidth={1.4} />
    </g>
  );
}

/** Thin flowing line (rivers, currents, data links). The dash pattern repeats every 30 units. */
export function Flow({ d, color = "var(--brand-teal)", opacity = 0.6, width = 1, dash = "10 20", duration = 16, delay = 0, reverse = false, track = false }: { d: string; color?: string; opacity?: number; width?: number; dash?: string; duration?: number; delay?: number; reverse?: boolean; track?: boolean }) {
  const line = (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      className="scene-flow"
      style={{ animationDuration: `${duration}s`, animationDelay: `${-delay}s`, animationDirection: reverse ? "reverse" : undefined }}
    />
  );
  if (!track) return line;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={opacity * 0.35} strokeWidth={width * 0.8} />
      {line}
    </g>
  );
}

/** Wrapper that drifts its content sideways and back (clouds, mist, boats). */
export function Drift({ children, duration = 38, delay = 0, distance = 14 }: { children: ReactNode; duration?: number; delay?: number; distance?: number }) {
  return (
    <g className="scene-drift" style={{ animationDuration: `${duration}s`, animationDelay: `${-delay}s`, "--drift": `${distance}px` } as CSSProperties}>
      {children}
    </g>
  );
}

/** Long soft cloud or mist band. */
export function cloud(x: number, y: number, w: number, h: number) {
  return `M${n(x)} ${n(y)}C${n(x + w * 0.1)} ${n(y - h)} ${n(x + w * 0.32)} ${n(y - h * 1.1)} ${n(x + w * 0.45)} ${n(y - h * 0.55)}C${n(x + w * 0.55)} ${n(y - h * 1.5)} ${n(x + w * 0.85)} ${n(y - h * 1.2)} ${n(x + w * 0.88)} ${n(y - h * 0.35)}C${n(x + w * 0.97)} ${n(y - h * 0.3)} ${n(x + w)} ${n(y)} ${n(x + w)} ${n(y)}Z`;
}

/** Shared gradients for one scene instance. Colours come from the theme, so dark mode follows. */
export function SceneDefs({ id }: { id: string }) {
  const stop = (offset: string, color: string, opacity: number) => <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />;
  return (
    <defs>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        {stop("0", "var(--brand-sand)", 0.32)}
        {stop("1", "var(--brand-sand)", 0)}
      </radialGradient>
      <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
        {stop("0", "var(--brand-teal)", 0.34)}
        {stop("1", "var(--brand-teal)", 0.08)}
      </linearGradient>
      {(["green", "teal", "navy", "sand"] as const).map((c) => (
        <linearGradient key={c} id={`${id}-${c}`} x1="0" y1="0" x2="0" y2="1">
          {stop("0", `var(--brand-${c})`, 1)}
          {stop("1", `var(--brand-${c})`, 0)}
        </linearGradient>
      ))}
    </defs>
  );
}

/* Map furniture for the plan-view scenes. */

export function ScaleBar({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--brand-navy)" strokeOpacity={0.5} strokeWidth={0.8}>
      <rect x={x} y={y} width={12} height={2.4} fill="var(--brand-navy)" fillOpacity={0.45} />
      <rect x={x + 12} y={y} width={12} height={2.4} fill="none" />
      <rect x={x + 24} y={y} width={12} height={2.4} fill="var(--brand-navy)" fillOpacity={0.45} />
      <path d={`M${x} ${y - 2}v-2M${x + 36} ${y - 2}v-2`} />
    </g>
  );
}

export function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g strokeLinejoin="round">
      <path d={`M${x} ${y - 8}L${x + 4} ${y + 4}L${x} ${y + 1.5}Z`} fill="var(--brand-navy)" fillOpacity={0.55} />
      <path d={`M${x} ${y - 8}L${x - 4} ${y + 4}L${x} ${y + 1.5}Z`} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={0.8} />
    </g>
  );
}

export function Graticule({ xs, ys }: { xs: readonly number[]; ys: readonly number[] }) {
  return <path d={xs.map((x) => `M${x} -10V${H + 10}`).join("") + ys.map((y) => `M-10 ${y}H${W + 10}`).join("")} stroke="var(--border-strong)" strokeWidth={0.7} strokeDasharray="1 5" fill="none" />;
}

/** Marsh symbol used on topographic maps: a short base line with three reed ticks. */
export function marsh(points: readonly Pt[]) {
  return points.map(([x, y]) => `M${n(x - 2.4)} ${n(y)}h4.8M${n(x)} ${n(y)}v-2.8M${n(x - 1.5)} ${n(y)}l-0.9 -2.1M${n(x + 1.5)} ${n(y)}l0.9 -2.1`).join("");
}

export function dots(points: readonly Pt[], r = 1) {
  return points.map(([x, y]) => `M${n(x - r)} ${n(y)}a${r} ${r} 0 1 0 ${n(r * 2)} 0a${r} ${r} 0 1 0 ${n(-r * 2)} 0Z`).join("");
}
