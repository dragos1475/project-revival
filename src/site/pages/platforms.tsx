// LTER and LTSER platforms: the concept, the national network and the six documented platforms.
import { ArrowRight } from "lucide-react";
import { LTSER_AREA_META } from "@/lib/catalog";
import { DEIMS } from "../content/org";
import { LTSER_FACTS, PLATFORMS } from "../content/platforms";
import { Link } from "../router";
import { Atlas, ATLAS_H, ATLAS_W, AtlasLegend } from "../components/atlas";
import { CreditedPhoto } from "../components/blocks";
import { Container, ExternalLink, Figures, PageIntro, Reveal, SectionHeader } from "../components/primitives";

export default function PlatformsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Cercetare socio-ecologică pe termen lung"
        title="Platforme LTER și LTSER"
        lede="O platformă LTSER studiază un teritoriu împreună cu populația și activitățile umane din el. România face parte din rețeaua internațională ILTER din 2001."
      >
        <div className="grid gap-1.5 text-[14px]">
          <ExternalLink href={DEIMS.ltserRomania}>Rețeaua LTSER România în DEIMS</ExternalLink>
          <ExternalLink href={DEIMS.network}>Rețeaua eLTER în DEIMS</ExternalLink>
        </div>
      </PageIntro>
      <Container>
        <Figures items={LTSER_FACTS} />
      </Container>

      <Container className="grid gap-6 pt-6 lg:grid-cols-12 lg:gap-8">
        <div className="self-start rounded-[18px] border border-border bg-surface p-1.5 shadow-card lg:col-span-5 2xl:col-span-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2/60" style={{ aspectRatio: `${ATLAS_W} / ${ATLAS_H}` }}>
            <div aria-hidden className="dot-grid absolute inset-0 opacity-70" />
            <Atlas className="absolute inset-0" showNetworks={false} />
          </div>
          <div className="px-2.5 pt-2 pb-1">
            <AtlasLegend showNetworks={false} />
          </div>
        </div>
        <div className="grid content-start gap-3 lg:col-span-7 2xl:col-span-8">
          <h2 className="text-[20px] leading-tight font-semibold tracking-tight">Conceptul LTSER</h2>
          <p className="max-w-[85ch] text-[15px] leading-[1.7] text-muted">
            LTER-Europe a introdus conceptul de platformă LTSER în 2007, ca extensie a siturilor ecologice clasice. În locul unei suprafețe de studiu, platforma acoperă o regiune întreagă, cu localitățile, agricultura și infrastructura ei.
          </p>
          <p className="max-w-[85ch] text-[15px] leading-[1.7] text-muted">
            Rețeaua națională numără 11 platforme, din ecosisteme alpine, păduri de amestec și de foioase, terenuri agricole și râuri. Șase dintre ele au date integrate în exploratorul LTSER, unde fiecare zonă poate fi analizată pe unități administrative.
          </p>
        </div>
      </Container>

      <Container className="grid gap-4 pt-6">
        <SectionHeader index="01" eyebrow="Exploratorul LTSER" title="Platforme documentate în explorator" />
        <Reveal className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <Link key={p.slug} to={`platforme/${p.slug}`} className="group grid grid-cols-[128px_minmax(0,1fr)] gap-3.5 rounded-2xl border border-border bg-surface p-1.5 pr-3.5 shadow-card transition-colors hover:border-border-strong sm:grid-cols-[148px_minmax(0,1fr)]">
              <CreditedPhoto photo={p.photo} alt={`${p.name}, ${p.photo.location}`} sizes="160px" credit="none" className="aspect-square rounded-[10px]" />
              <span className="grid content-center gap-1 py-1">
                <span className="tabular text-[11.5px] text-subtle">
                  {String(i + 1).padStart(2, "0")} · {p.kind} · {LTSER_AREA_META[p.explorerId].uats} UAT
                </span>
                <span className="flex items-center gap-1.5 text-[16px] leading-snug font-semibold tracking-tight">
                  {p.name}
                  <ArrowRight className="size-3.5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
                </span>
                <span className="line-clamp-3 text-[13px] leading-relaxed text-muted">{p.summary}</span>
              </span>
            </Link>
          ))}
        </Reveal>
      </Container>
    </>
  );
}
