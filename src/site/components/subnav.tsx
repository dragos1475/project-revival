// Sticky row of in-page anchors (and links to related pages) under a page intro; the section in
// view is marked as current.
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "../router";
import { Container } from "./primitives";

export interface SubNavItem {
  label: string;
  /** In-page anchor. */
  hash?: string;
  /** Another page (route key). */
  to?: string;
}

export function SubNav({ items, label }: { items: SubNavItem[]; label: string }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = items.filter((i) => i.hash && !i.to).map((i) => i.hash!);
    const els = ids.map((id) => document.getElementById(id)).filter((x): x is HTMLElement => Boolean(x));
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  const cls =
    "inline-flex min-h-[38px] shrink-0 items-center rounded-md px-3 text-[14px] font-semibold text-navy transition-colors hover:bg-surface-2 aria-[current=true]:bg-navy aria-[current=true]:text-white dark:text-foreground dark:aria-[current=true]:bg-lime dark:aria-[current=true]:text-navy";
  return (
    <nav aria-label={label} className="sticky top-[69px] z-[900] border-b border-border bg-background/95 backdrop-blur">
      <Container className="flex gap-1 overflow-x-auto py-1.5">
        {items.map((i) =>
          i.to != null ? (
            <Link key={i.label} to={i.to} hash={i.hash} className={cn(cls, "text-[#2f7d4f] dark:text-accent")}>
              {i.label} →
            </Link>
          ) : (
            <a key={i.label} href={`#${i.hash}`} aria-current={active === i.hash ? "true" : undefined} className={cls}>
              {i.label}
            </a>
          ),
        )}
      </Container>
    </nav>
  );
}
