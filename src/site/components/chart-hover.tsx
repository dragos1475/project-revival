// Hover and keyboard readout for the small SVG charts of the site sheets. Every column of the chart gets an
// invisible full-height hit area, so the pointer only has to be over the month or year, not on the painted bar;
// a tooltip shows the values of that column. With the keyboard the chart takes focus and the arrow keys move
// from column to column.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TipRow {
  value: ReactNode;
  label?: ReactNode;
  /** Colour of the short key stroke before the row; none for a row without a series. */
  color?: string;
}
export interface Tip {
  title: ReactNode;
  rows: TipRow[];
}

export function HoverChart({
  W,
  H,
  n,
  x0 = 0,
  bw = 0,
  cols,
  label,
  tip,
  anchorY,
  children,
  className,
}: {
  /** viewBox size. */
  W: number;
  H: number;
  /** Number of columns, their left edge and width in viewBox units. */
  n: number;
  x0?: number;
  bw?: number;
  /** Columns of unequal width (left edge and width), instead of x0 and bw; for example uneven time steps. */
  cols?: { x: number; w: number }[];
  label: string;
  tip: (i: number) => Tip | null;
  /** Top of the marks of a column, in viewBox units; the tooltip sits above it. */
  anchorY: (i: number) => number;
  /** The chart itself, given the active column so it can mark it. */
  children: (active: number | null) => ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const col = (i: number) => cols?.[i] ?? { x: x0 + i * bw, w: bw };
  const t = active == null ? null : tip(active);
  const cx = active == null ? 0 : (col(active).x + col(active).w / 2) / W;
  const cy = active == null ? 0 : Math.max(anchorY(active), 0) / H;
  const box = useRef<HTMLDivElement>(null);
  const tipBox = useRef<HTMLDivElement>(null);
  // Centred over the column, but kept inside the chart: near the edges it opens towards the inside.
  useLayoutEffect(() => {
    const el = tipBox.current;
    const cw = box.current?.clientWidth;
    if (!el || !cw) return;
    const w = el.offsetWidth;
    el.style.left = `${Math.min(Math.max(cx * cw - w / 2, 0), Math.max(cw - w, 0))}px`;
  });
  const move = (d: number) => setActive((a) => Math.min(n - 1, Math.max(0, (a ?? n - 1) + d)));
  return (
    // A finger leaves the chart as soon as it lifts, so a tap keeps its tooltip until the next tap or blur.
    <div
      ref={box}
      className={cn("relative", className)}
      onPointerLeave={(e) => e.pointerType !== "touch" && setActive(null)}
    >
      <svg
        className="block h-auto w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        tabIndex={0}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          const step = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 }[e.key];
          if (step) move(step);
          else if (e.key === "Home") setActive(0);
          else if (e.key === "End") setActive(n - 1);
          else if (e.key === "Escape") setActive(null);
          else return;
          e.preventDefault();
        }}
      >
        {active != null ? (
          <rect
            x={col(active).x}
            y={0}
            width={col(active).w}
            height={H}
            fill="var(--chart-axis)"
            opacity={0.07}
          />
        ) : null}
        {children(active)}
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={col(i).x}
            y={0}
            width={col(i).w}
            height={H}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
          />
        ))}
      </svg>
      {t ? (
        <div
          ref={tipBox}
          role="status"
          className="pointer-events-none absolute z-20 w-max max-w-[min(260px,100%)] rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12.5px] leading-[1.4] shadow-[0_6px_18px_rgba(14,42,59,0.16)]"
          style={{
            left: `${cx * 100}%`,
            top: `${cy * 100}%`,
            transform: "translateY(calc(-100% - 8px))",
          }}
        >
          <div className="text-[12px] text-subtle">{t.title}</div>
          {t.rows.map((r, k) => (
            <div key={k} className="flex items-baseline gap-1.5">
              {r.color ? (
                <i
                  className="inline-block h-0.5 w-2.5 shrink-0 self-center rounded-full"
                  style={{ background: r.color }}
                />
              ) : null}
              <b className="tabular shrink-0 font-semibold whitespace-nowrap text-foreground">
                {r.value}
              </b>
              {r.label ? <span className="text-subtle">{r.label}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
