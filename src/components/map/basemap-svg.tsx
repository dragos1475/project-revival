// Static base map for the SVG atlases: sea, neighbouring countries, Romania and place labels.
// Shared by the public site atlas and the explorer overview, which use the same projection.
import { BASEMAP_LABELS, BASEMAP_SIZE, NEIGHBOUR_PATHS, ROMANIA_PATH } from "@/lib/basemap";

export function BasemapSvg() {
  const { width, height } = BASEMAP_SIZE;
  return (
    <g aria-hidden>
      <rect width={width} height={height} className="fill-brand-teal/10" />
      {NEIGHBOUR_PATHS.map((n) => (
        <path key={n.id} d={n.d} className="fill-surface-2 stroke-border-strong dark:fill-background" strokeWidth={0.8} strokeLinejoin="round" />
      ))}
      <path d={ROMANIA_PATH} className="fill-surface stroke-foreground/40 dark:fill-surface-3/60 dark:stroke-foreground/45" strokeWidth={1.3} strokeLinejoin="round" />
      {BASEMAP_LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          className={l.kind === "country" ? "fill-foreground/35 text-[11px] font-semibold tracking-[0.35em]" : l.kind === "sea" ? "fill-brand-teal text-[9.5px] italic" : "fill-subtle text-[8.5px] font-medium tracking-[0.25em]"}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}
