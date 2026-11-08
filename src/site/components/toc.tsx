// Sticky table of contents that follows the section in view.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SPRING } from "./primitives";

export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

export function Toc({ items, label = "Pe această pagină", layoutId = "toc" }: { items: { id: string; title: string }[]; label?: string; layoutId?: string }) {
  const active = useScrollSpy(items.map((i) => i.id));
  return (
    <nav aria-label={label} className="sticky top-24 grid gap-3">
      <p className="text-[12px] font-medium text-subtle">{label}</p>
      <ul className="relative grid border-l border-border">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id} className="relative">
              {on ? <motion.span layoutId={layoutId} transition={SPRING} className="absolute top-0 bottom-0 -left-px w-px bg-accent" /> : null}
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${item.id}`);
                }}
                className={cn("block py-1.5 pl-4 text-[13px] transition-colors", on ? "text-foreground" : "text-muted hover:text-foreground")}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
