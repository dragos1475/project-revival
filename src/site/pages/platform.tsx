// One LTSER platform: landscape, key figures, location, DEIMS records and explorer links.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LTSER_AREA_META } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { PLATFORMS, type Platform } from "../content/platforms";
import { STATIONS } from "../content/stations";
import { explorerHref, Link } from "../router";
import { Atlas, ATLAS_H, ATLAS_W } from "../components/atlas";
import { CreditedPhoto } from "../components/blocks";
import { BulletList, Container, Crumbs, ExternalLink, Figures, Reveal } from "../components/primitives";
import { PageMotionGraphic, usePageMotionScene } from "../components/page-motion";
import { lwByKey, PLATFORM_POINT, sheetKey } from "../content/lw";

export function PlatformPage({ platform }: { platform: Platform }) {
  const scene = usePageMotionScene();
  const meta = LTSER_AREA_META[platform.explorerId];
  const figures = [...platform.figures, { value: String(meta.uats), label: "unități administrative în explorator" }].slice(0, 4);
  const stations = STATIONS.filter((s) => platform.stations.includes(s.slug));
  const links = [
    { label: "Teledetecție pe unitățile administrative", body: "SSM, NDVI și FAPAR agregate pe zonă și pe UAT", href: explorerHref("teledetectie/administrativ", { unitate: "ltser", id: platform.explorerId }) },
    { label: "Indicatori sociali", body: "Populația și emigrația pentru UAT-urile zonei", href: explorerHref("social") },
    { label: "Rețeaua meteorologică", body: "Valori orare și zilnice ale stațiilor automate", href: explorerHref("retele/meteo") },
  ];
  const others = PLATFORMS.filter((p) => p.slug !== platform.slug);

  return (
    <>
      <Container className="pt-6 sm:pt-8">
        <Crumbs items={[{ label: "Platforme", node: <Link to="platforme" className="hover:text-foreground">Platforme LTSER</Link> }, { label: platform.name }]} />
        <div className="relative overflow-hidden rounded-[22px] border border-border">
          <CreditedPhoto photo={platform.photo} alt={`${platform.name}, ${platform.photo.location}`} priority className="h-[240px] sm:h-[280px] lg:h-[320px]" credit="none" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 grid gap-2 p-5 text-white sm:p-7">
            <p className="flex items-center gap-2 text-[13px] font-medium text-white/85"><span aria-hidden className="size-2.5 rounded-[3px] bg-brand-green" />Platformă LTSER · {platform.kind}</p>
            <h1 className="max-w-[24ch] text-[30px] leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-[44px]">{platform.name}</h1>
            <p className="text-[14px] text-white/75">{platform.region}</p>
          </div>
          <a href={platform.photo.page} target="_blank" rel="noreferrer" className="absolute top-3 right-3 rounded-md bg-zinc-950/50 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur">
            {platform.photo.author} · Unsplash
          </a>
        </div>
      </Container>

      <Container className="grid gap-2.5 pt-4 sm:gap-3 xl:grid-cols-12">
        <Figures items={figures} className="xl:col-span-9 2xl:col-span-10" />
        {scene ? <PageMotionGraphic scene={scene} className="hidden xl:col-span-3 xl:block 2xl:col-span-2" /> : null}
      </Container>

      <Container className="grid gap-6 pt-6 lg:grid-cols-12 lg:gap-8">
        <Reveal className="grid content-start gap-3 lg:col-span-7">
          <p className="text-[17px] leading-[1.55] font-medium tracking-tight text-pretty">{platform.summary}</p>
          {platform.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-[80ch] text-[15px] leading-[1.7] text-muted">{p}</p>
          ))}
          <BulletList items={platform.highlights} />
        </Reveal>
        <Reveal className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-5">
          <div className="rounded-[18px] border border-border bg-surface p-1.5 shadow-card">
            <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2/60" style={{ aspectRatio: `${ATLAS_W} / ${ATLAS_H}` }}>
              <div aria-hidden className="dot-grid absolute inset-0 opacity-70" />
              <Atlas className="absolute inset-0" highlight={platform.explorerId} showNetworks={false} />
            </div>
            <p className="px-2.5 pt-1.5 pb-1 text-[11.5px] text-subtle">Conturul zonei în setul de date al exploratorului.</p>
          </div>
          <dl className="grid content-start gap-4">
            {lwByKey(PLATFORM_POINT[platform.slug] ?? "") ? (
              <div className="grid gap-2">
                <dt className="text-[12px] font-medium text-subtle">Fișa de date</dt>
                <dd>
                  <Link to={sheetKey(lwByKey(PLATFORM_POINT[platform.slug])!)} className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2f7d4f] dark:text-accent">
                    Habitate, climă, biodiversitate și API
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </Link>
                </dd>
              </div>
            ) : null}
            {platform.deims.length ? (
              <div className="grid gap-2">
                <dt className="text-[12px] font-medium text-subtle">Fișe DEIMS-SDR</dt>
                {platform.deims.map((d) => (
                  <dd key={d.url} className="text-[14px]">
                    <ExternalLink href={d.url}>{d.label}</ExternalLink>
                  </dd>
                ))}
              </div>
            ) : null}
            {stations.length ? (
              <div className="grid gap-2">
                <dt className="text-[12px] font-medium text-subtle">Stații care deservesc platforma</dt>
                {stations.map((s) => (
                  <dd key={s.slug}>
                    <Link to={`statiuni/${s.slug}`} className="group inline-flex items-center gap-1.5 text-[14px] font-medium">
                      {s.name}
                      <ArrowRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
                    </Link>
                  </dd>
                ))}
              </div>
            ) : null}
          </dl>
        </Reveal>
      </Container>

      <Container className="pt-6">
        <Reveal className="grid gap-3 rounded-[18px] border border-border bg-surface p-1.5 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-3 px-3.5 pt-3">
            <div>
              <p className="text-[13px] font-medium text-accent">Date</p>
              <h2 className="text-[18px] font-semibold tracking-tight">Date în exploratorul LTSER</h2>
            </div>
          </div>
          <ul className="grid gap-1.5 md:grid-cols-3">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="group grid h-full gap-0.5 rounded-xl bg-surface-2/70 px-3.5 py-3 transition-colors hover:bg-surface-2">
                  <span className="flex items-center justify-between gap-3 text-[15px] font-medium">
                    {l.label}
                    <ArrowUpRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] leading-relaxed text-muted">{l.body}</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>

      <Container className="pt-6">
        <p className="mb-3 text-[12px] font-medium text-subtle">Celelalte platforme</p>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {others.map((p) => (
            <li key={p.slug} className="w-[200px] shrink-0 snap-start xl:w-auto xl:flex-1">
              <Link to={`platforme/${p.slug}`} className="group grid gap-2">
                <CreditedPhoto photo={p.photo} alt={`${p.name}, ${p.photo.location}`} sizes="240px" credit="none" className="aspect-[16/9] rounded-xl border border-border" />
                <span className={cn("text-[14px] font-medium leading-snug")}>{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
