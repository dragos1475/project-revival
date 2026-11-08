import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { BackendName } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { useBackend } from "@/hooks/use-backend";
import { hashFor } from "@/hooks/use-route";
import { Badge, StatusDot } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { NAV } from "@/explorer-routes";

export function PageHeader({ crumbs, title, description, actions }: { crumbs: string[]; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-subtle">
          {crumbs.map((c, i) => (
            <span key={c} className="inline-flex items-center gap-1">
              {i ? <ChevronRight className="size-3" strokeWidth={1.75} /> : null}
              {c}
            </span>
          ))}
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px] sm:leading-tight">{title}</h1>
        {description ? <p className="mt-1.5 max-w-[68ch] text-[15px] leading-relaxed text-pretty text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SourceBadge({ backend }: { backend: BackendName }) {
  const { t } = useI18n();
  const state = useBackend(backend);
  const variant = state.mode === "live" ? "live" : state.mode === "demo" ? "demo" : "neutral";
  return (
    <Tooltip content={state.mode === "demo" ? t("source.demoHint") : state.mode === "live" ? t("source.liveHint") : t("source.pending")}>
      <Badge variant={variant} tabIndex={0}>
        <StatusDot mode={state.mode} />
        {t(`source.${state.mode}`)}
      </Badge>
    </Tooltip>
  );
}

/** Sub-navigation with a sliding active underline. */
export function SectionTabs({ group, active }: { group: string; active: string }) {
  const { t } = useI18n();
  const items = NAV.find((g) => g.id === group)?.items ?? [];
  if (items.length < 2) return null;
  return (
    <nav aria-label={t("nav.sub")} className="mb-5 flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]">
      {items.map((it) => {
        const on = it.path === active;
        return (
          <a key={it.path} href={hashFor(it.path)} aria-current={on ? "page" : undefined} className="relative px-2.5 pt-1 pb-2.5 text-[13px] font-medium whitespace-nowrap text-muted transition-colors hover:text-foreground aria-[current=page]:text-foreground">
            {t(it.title)}
            {on ? <motion.span layoutId={`tab-${group}`} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" /> : null}
          </a>
        );
      })}
    </nav>
  );
}

/** Two-column sticky split pane used by the map screens. */
export function SplitPane({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 xl:sticky xl:top-6">{main}</div>
      <aside className="grid min-w-0 gap-4">{aside}</aside>
    </div>
  );
}

/** Map plate: card with a 6px inset, so the map uses rounded-[10px] (16 - 6). */
export function MapCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-surface p-1.5 shadow-card">{children}</div>;
}

export function errorText(err: unknown, t: (k: string) => string) {
  const e = err as { kind?: string; detail?: string; message?: string } | undefined;
  if (!e) return t("error.unknown");
  if (e.kind === "timeout") return t("error.timeout");
  if (e.kind === "network") return t("error.network");
  return e.detail || e.message || t("error.unknown");
}
