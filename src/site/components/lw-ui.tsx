// Building blocks of the reference design: cards, small labels, key/value grids, chips and notes.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { asset, CAT, siteCode, type LwImage, type LwPoint } from "../content/lw";
import { CatTag } from "./lw-shapes";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <article className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-surface", className)}>{children}</article>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex grow flex-col gap-2.5 p-5 sm:p-[22px]", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("font-display text-[19px] leading-[1.25] font-bold text-foreground sm:text-[20px]", className)}>{children}</h3>;
}

export function CardText({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[15px] leading-[1.55] text-pretty text-muted", className)}>{children}</p>;
}

/** Card photo with a fixed 16:10 frame, or a tinted placeholder with the name. */
export function CardImage({ image, name }: { image: LwImage | null; name: string }) {
  return image ? (
    <img loading="lazy" src={asset(image.thumb || image.src)} alt={image.alt} className="aspect-[16/10] w-full bg-surface-3 object-cover" />
  ) : (
    <div className="flex aspect-[16/10] items-end bg-[linear-gradient(135deg,#dce6e2,#c9d8d2)] p-3.5 font-display font-bold text-navy dark:bg-[linear-gradient(135deg,#163a4f,#0f2c3e)] dark:text-foreground">{name}</div>
  );
}

export function Tag({ children, tone = "plain", className }: { children: ReactNode; tone?: "plain" | "ours" | "warn"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap",
        tone === "plain" && "bg-surface-2 text-navy dark:text-foreground",
        tone === "ours" && "bg-accent-soft text-[#1F5A37] dark:text-accent",
        tone === "warn" && "bg-warning-soft text-warning",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Category label plus the European site code, when there is one. */
export function PointTags({ p, ours }: { p: LwPoint; ours?: boolean }) {
  const code = siteCode(p);
  return (
    <div className="flex flex-wrap gap-1.5">
      <CatTag cat={p.cat} />
      {code ? <Tag>{code}</Tag> : null}
      {ours && p.ours ? <Tag tone="ours">Operat de UB</Tag> : null}
    </div>
  );
}

export function Chips({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((x, i) => (
        <span key={i} className="inline-flex min-h-[30px] items-center rounded-md bg-surface-2 px-2.5 py-0.5 text-[13px] text-navy dark:text-foreground">
          {x}
        </span>
      ))}
    </div>
  );
}

export function ChipLink({ href, children, external }: { href: string; children: ReactNode; external?: boolean }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="inline-flex min-h-[30px] items-center rounded-md bg-surface-2 px-2.5 py-0.5 text-[13px] text-navy transition-colors hover:bg-surface-3 dark:text-foreground">
      {children}
    </a>
  );
}

/** Key/value boxes; rows without a value are left out. */
export function KeyValues({ rows, className }: { rows: [string, ReactNode | null | undefined][]; className?: string }) {
  const shown = rows.filter(([, v]) => v != null && v !== "" && v !== "–");
  return (
    <dl className={cn("grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5", className)}>
      {shown.map(([k, v]) => (
        <div key={k} className="rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <dt className="text-[12px] font-semibold tracking-[0.05em] text-subtle uppercase">{k}</dt>
          <dd className="mt-0.5 font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-dashed border-border-strong bg-ground px-3 py-2.5 text-[13px] text-subtle [&_b]:text-foreground", className)}>{children}</div>;
}

export function H3({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("mb-3 font-display text-[21px] leading-[1.25] font-bold sm:text-[22px]", className)}>{children}</h3>;
}

export const catOne = (p: LwPoint) => CAT[p.cat].one;
