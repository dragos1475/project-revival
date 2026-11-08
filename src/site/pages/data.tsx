// Data catalogue: every dataset the explorer serves, filterable by theme.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/misc";
import { DATASETS, THEMES, type DatasetTheme } from "../content/data";
import { EXTERNAL_MAPS } from "../content/org";
import { explorerHref, Link } from "../router";
import { ServiceStatus } from "../components/blocks";
import { Container, ExternalLink, PageIntro, SPRING } from "../components/primitives";

const THEME_TONE: Record<DatasetTheme, string> = {
  teledetectie: "bg-brand-green",
  retele: "bg-brand-teal",
  platforma: "bg-brand-navy",
  social: "bg-brand-orange",
  geo: "bg-brand-sand",
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function DataPage() {
  const [theme, setTheme] = useState<DatasetTheme | "all">("all");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return DATASETS.filter((d) => (theme === "all" || d.theme === theme) && words.every((w) => fold([d.title, d.summary, ...d.variables, ...d.formats].join(" ")).includes(w)));
  }, [theme, query]);
  const themes: (DatasetTheme | "all")[] = ["all", ...(Object.keys(THEMES) as DatasetTheme[])];

  return (
    <>
      <PageIntro
        eyebrow="Date și servicii"
        title="Catalog de date"
        lede="Seturile de date disponibile în exploratorul LTSER, pe teme. Măsurătorile brute sunt accesibile și prin API."
      >
        <div className="grid gap-3">
          <ServiceStatus className="w-fit" />
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
            <Link to="date/api" className="underline decoration-border-strong underline-offset-4 hover:decoration-accent">API de acces</Link>
            <Link to="date/documentatie" className="underline decoration-border-strong underline-offset-4 hover:decoration-accent">Documentație</Link>
            <ExternalLink href={EXTERNAL_MAPS.advanced}>Harta avansată</ExternalLink>
          </div>
        </div>
      </PageIntro>

      <Container className="grid gap-3">
        <div className="sticky top-[79px] z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-2 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-2.5">
          <div role="tablist" aria-label="Teme" className="flex flex-wrap gap-1">
            {themes.map((t) => {
              const on = theme === t;
              return (
                <button key={t} type="button" role="tab" aria-selected={on} onClick={() => setTheme(t)} className={cn("relative h-8 rounded-lg px-3 text-[13px] transition-colors", on ? "text-foreground" : "text-muted hover:text-foreground")}>
                  {on ? <motion.span layoutId="data-theme" transition={SPRING} className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-border" /> : null}
                  <span className="relative flex items-center gap-1.5">
                    {t !== "all" ? <span aria-hidden className={cn("size-2 rounded-[2px]", THEME_TONE[t])} /> : null}
                    {t === "all" ? "Toate" : THEMES[t]}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="relative ml-auto w-full sm:w-64">
            <span className="sr-only">Filtrează seturile de date</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Variabilă, format, temă" className={cn(inputClass, "pl-8")} />
          </label>
        </div>

        <p className="tabular text-[12px] text-subtle" aria-live="polite">{shown.length} din {DATASETS.length} seturi de date</p>

        <ul className="grid border-t border-border">
          <AnimatePresence initial={false}>
            {shown.map((d) => (
              <motion.li key={d.id} id={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING} className="scroll-mt-36 border-b border-border">
                <div className="grid gap-3 py-3.5 md:grid-cols-12 md:gap-6">
                  <div className="grid content-start gap-1 md:col-span-3">
                    <p className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                      <span aria-hidden className={cn("size-2.5 rounded-[3px]", THEME_TONE[d.theme])} />
                      {THEMES[d.theme]}
                    </p>
                    <p className="text-[12px] text-subtle">{d.service}</p>
                  </div>
                  <div className="grid content-start gap-1 md:col-span-6">
                    <h2 className="text-[16.5px] font-semibold tracking-tight">{d.title}</h2>
                    <p className="text-[14px] leading-relaxed text-muted">{d.summary}</p>
                    <ul className="flex flex-wrap gap-1 pt-1">
                      {d.variables.slice(0, 8).map((v) => (
                        <li key={v} className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[12px] text-muted">{v}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid content-start gap-2 md:col-span-3">
                    <dl className="grid gap-1 text-[13px]">
                      <div className="flex justify-between gap-3"><dt className="text-subtle">Rezoluție</dt><dd className="text-right">{d.resolution}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-subtle">Acoperire</dt><dd className="text-right">{d.coverage}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-subtle">Formate</dt><dd className="tabular text-right text-[12px]">{d.formats.join(" · ")}</dd></div>
                    </dl>
                    <Button asChild size="md" className="w-fit">
                      <a href={explorerHref(d.explorer.path, d.explorer.query)}>
                        Deschide în explorator
                        <ArrowUpRight strokeWidth={1.75} />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!shown.length ? <p className="py-10 text-center text-[14px] text-muted">Niciun set de date nu corespunde filtrului.</p> : null}
      </Container>
    </>
  );
}
