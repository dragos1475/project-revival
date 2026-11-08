// Layout primitives for the public site: container, section header, reveal, facts, external link.
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageMotionGraphic, usePageMotionScene } from "./page-motion";

export const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

/** The five logo colours, used in order for numbered sections and categories. */
export const BRAND_TONES = ["bg-brand-green", "bg-brand-orange", "bg-brand-teal", "bg-brand-sand", "bg-brand-navy"] as const;
export const toneFor = (index?: string) => BRAND_TONES[((Number.parseInt(index ?? "1", 10) || 1) - 1) % BRAND_TONES.length];

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  // Fluid up to 1920px; the side padding grows with the screen instead of a narrow fixed column.
  return <div className={cn("mx-auto w-full max-w-[1920px] px-4 sm:px-8 lg:px-12 2xl:px-16", className)}>{children}</div>;
}

/** Fades content in once it scrolls into view. The noscript style in index.html keeps it visible without JS. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[12.5px] font-semibold tracking-[0.1em] text-accent uppercase", className)}>{children}</p>;
}

/** Section header: eyebrow, title and lede, with an optional link on the right. */
export function SectionHeader({ eyebrow, title, lede, aside, id }: { index?: string; eyebrow: string; title: ReactNode; lede?: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
      <div className="grid max-w-[80ch] gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="scroll-mt-36 font-display text-[26px] leading-[1.15] font-bold tracking-[-0.01em] text-balance text-navy sm:text-[32px] lg:text-[36px] dark:text-foreground">{title}</h2>
        {lede ? <p className="max-w-[780px] text-[15.5px] leading-[1.65] text-pretty text-muted sm:text-[17px]">{lede}</p> : null}
      </div>
      {aside ? <div className="pb-0.5">{aside}</div> : null}
    </div>
  );
}

/** Full-width band of a page: plain, light green-grey or navy. */
export function Band({ tone = "plain", id, className, children, label }: { tone?: "plain" | "ground" | "dark"; id?: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <section
      id={id}
      aria-label={label}
      className={cn("scroll-mt-36 py-12 sm:py-16", tone === "ground" && "bg-ground", tone === "dark" && "bg-navy text-white [&_.text-accent]:text-lime", className)}
    >
      {children}
    </section>
  );
}

/** Opening band of every inner page: navy, with the page scene (or the given aside) on the right. */
export function PageIntro({ eyebrow, title, lede, children, crumbs, meta, actions }: { eyebrow: string; title: ReactNode; lede?: ReactNode; children?: ReactNode; crumbs?: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  const scene = usePageMotionScene();
  return (
    <section className="bg-navy text-white">
      <Container className="pt-9 pb-10 sm:pt-12 sm:pb-12">
        {crumbs}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className={cn("flex min-w-0 gap-8", children ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12")}>
            <div className="grid min-w-0 flex-[0_1_80ch] content-start gap-3">
              <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">{eyebrow}</p>
              <h1 className="font-display text-[34px] leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-[44px] xl:text-[52px]">{title}</h1>
              {meta ? <p className="text-[14px] text-[#A9BCC5]">{meta}</p> : null}
              {lede ? <p className="max-w-[78ch] text-[16px] leading-[1.65] text-pretty text-[#CFDCE2] sm:text-[17px]">{lede}</p> : null}
              {actions ? <div className="mt-2 flex flex-wrap gap-2.5">{actions}</div> : null}
            </div>
            {scene ? (
              // A size container: the box takes the full text height and at most three times that in width.
              <div className={cn("relative hidden min-w-[190px] flex-1 [container-type:size]", children ? "xl:block" : "lg:block")}>
                <PageMotionGraphic scene={scene} className="absolute inset-y-0 right-0 w-[min(100cqw,300cqh)] border-[#2C5A6E]" />
              </div>
            ) : null}
          </div>
          {children ? <div className="min-w-0 text-foreground lg:col-span-5 xl:col-span-4">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/** Key numbers separated by hairlines; the 1px gap shows the border colour through. */
export function Figures({ items, className }: { items: { value: string; label: string }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4", className)}>
      {items.map((f) => (
        <div key={f.label} className="flex flex-col-reverse justify-end gap-1.5 rounded-xl border border-border bg-surface px-4 py-3 sm:px-5 sm:py-4">
          <dt className="text-[13px] leading-snug text-muted sm:text-[14px]">{f.label}</dt>
          <dd className="font-display text-[28px] leading-none font-extrabold text-navy sm:text-[34px] dark:text-foreground">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("group inline-flex items-center gap-1 text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-accent", className)}>
      {children}
      <ArrowUpRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
    </a>
  );
}

export function BulletList({ items, columns = 1 }: { items: string[]; columns?: 1 | 2 }) {
  return (
    <ul className={cn("grid border-t border-border", columns === 2 && "md:grid-cols-2 md:gap-x-8")}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 border-b border-border py-2 text-[15px] leading-relaxed text-foreground">
          <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Crumbs({ items }: { items: { label: string; node?: ReactNode }[] }) {
  return (
    <nav aria-label="Navigare ierarhică" className="crumbs mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-subtle">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden className="text-border-strong">/</span> : null}
            {item.node ?? <span aria-current="page" className="text-muted">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
