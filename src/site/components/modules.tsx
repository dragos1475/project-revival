// Numbered list of research modules or services, separated by hairlines.
import { cn } from "@/lib/utils";

export function ModuleList({ modules, className }: { modules: { code?: string; title: string; body?: string }[]; className?: string }) {
  return (
    <ol className={cn("grid border-t border-border", className)}>
      {modules.map((m, i) => (
        <li key={m.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-border py-2.5 sm:grid-cols-[48px_minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-6">
          <span className="tabular pt-0.5 text-[13px] text-subtle">{m.code ?? String(i + 1).padStart(2, "0")}</span>
          <span className="text-[15px] font-medium tracking-tight">{m.title}</span>
          {m.body ? <span className="col-start-2 text-[14px] leading-relaxed text-muted sm:col-start-3">{m.body}</span> : null}
        </li>
      ))}
    </ol>
  );
}
