import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px] font-medium text-muted", className)}>{children}</kbd>;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--surface-2)_25%,var(--surface-3)_50%,var(--surface-2)_75%)] bg-[length:200%_100%]", className)} {...props} />;
}

/** Live status indicator: pulsing when live, steady amber for demo data, faint while checking. */
export function StatusDot({ mode }: { mode: "live" | "demo" | "pending" }) {
  if (mode === "live") {
    return (
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-green opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
      </span>
    );
  }
  if (mode === "demo") return <span className="relative inline-flex size-2 rounded-full bg-amber-500" />;
  return <span className="relative inline-flex size-2 animate-pulse rounded-full bg-zinc-400" />;
}

export const badgeVariants = cva("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[11px] font-medium", {
  variants: {
    variant: {
      neutral: "border-border bg-surface-2 text-muted",
      live: "border-brand-green/25 bg-brand-green/10 text-brand-green",
      demo: "border-amber-500/25 bg-warning-soft text-warning",
      outline: "border-border-strong text-foreground",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const calloutIcons = { info: Info, warning: AlertTriangle, error: OctagonAlert };

export function Callout({ tone = "info", title, children, className }: { tone?: "info" | "warning" | "error"; title?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = calloutIcons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3 py-2.5 text-[13px]",
        tone === "info" && "border-border bg-surface-2 text-muted",
        tone === "warning" && "border-amber-500/25 bg-warning-soft text-foreground",
        tone === "error" && "border-red-500/25 bg-danger-soft text-foreground",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", tone === "error" ? "text-danger" : tone === "warning" ? "text-warning" : "text-subtle")} strokeWidth={1.75} />
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-medium text-foreground">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, htmlFor, aside }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string; aside?: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted">{label}</label>
        {aside ? <span className="tabular text-xs text-subtle">{aside}</span> : null}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-subtle">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon, title, children, className }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-[10px] border border-dashed border-border-strong px-6 py-10 text-center", className)}>
      <div aria-hidden className="dot-grid absolute inset-0 opacity-60" />
      <div className="relative grid justify-items-center gap-2">
        {icon ? <span className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-subtle shadow-card">{icon}</span> : null}
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        {children ? <p className="max-w-[36ch] text-xs text-muted">{children}</p> : null}
      </div>
    </div>
  );
}

export const inputClass =
  "h-8 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 text-[13px] shadow-card transition-colors placeholder:text-subtle hover:border-border-strong focus-visible:border-accent disabled:opacity-50 aria-[invalid=true]:border-danger";
