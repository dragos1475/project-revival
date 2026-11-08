import type { BinScale } from "@/lib/palettes";
import { locale } from "@/lib/format";

export interface LegendSpec {
  title: string;
  scale: BinScale;
  digits?: number;
}

export function Legend({ spec }: { spec: LegendSpec }) {
  const nf = new Intl.NumberFormat(locale(), { maximumFractionDigits: spec.digits ?? spec.scale.digits ?? 3 });
  return (
    <div className="pointer-events-auto max-h-[60%] min-w-[118px] overflow-auto rounded-xl border border-border bg-surface/90 p-2.5 shadow-float backdrop-blur">
      <p className="mb-1.5 font-mono text-[11px] font-medium text-foreground">{spec.title}</p>
      <ul className="grid">
        {spec.scale.legend().map((r) => (
          <li key={`${r.from}-${r.to}`} className="flex items-center gap-2 font-mono text-[10.5px] leading-[13px] text-muted tabular-nums [&:last-child>span]:border-b">
            <span className="h-[13px] w-4 border-x border-t border-black/10 dark:border-white/10" style={{ background: r.color }} />
            {nf.format(r.from)} – {nf.format(r.to)}
          </li>
        ))}
      </ul>
    </div>
  );
}
