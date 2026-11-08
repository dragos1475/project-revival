import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Radius math: Card is rounded-2xl (16px). Anything inset by p-1.5 (6px) uses rounded-[10px]. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-3.5 pb-3", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[13px] font-medium tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 truncate text-xs text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4", className)} {...props} />;
}

export function Divider({ className }: { className?: string }) {
  return <div role="separator" className={cn("h-px bg-border", className)} />;
}
