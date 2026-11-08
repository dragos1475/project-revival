// About: mission, vision, objectives, affiliations, timeline and photo credits.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AREA_PHOTOS, HERO_PHOTO, STATION_PHOTOS, type Photo } from "@/lib/photos";
import { INFRASTRUCTURES, MISSION, OBJECTIVES, ORG, TIMELINE, VISION } from "../content/org";
import { Link } from "../router";
import { Container, ExternalLink, PageIntro, Reveal, SectionHeader } from "../components/primitives";

export default function AboutPage() {
  const photos: Photo[] = [...new Map([...Object.values(STATION_PHOTOS), ...Object.values(AREA_PHOTOS), HERO_PHOTO].map((p) => [p.id, p])).values()];
  return (
    <>
      <PageIntro eyebrow={ORG.host} title="Despre LifeWatch România" lede={MISSION[0]}>
        <dl className="grid gap-2 rounded-[18px] border border-border bg-surface p-4 shadow-card">
          <div className="grid gap-0.5">
            <dt className="text-[12px] text-subtle">Instituție gazdă</dt>
            <dd className="text-[14px] font-medium">{ORG.host}</dd>
          </div>
          <div className="grid gap-0.5 border-t border-border pt-2">
            <dt className="text-[12px] text-subtle">Centru de cercetare</dt>
            <dd className="text-[14px] font-medium">
              <ExternalLink href={ORG.centerUrl}>{ORG.center}</ExternalLink>
            </dd>
          </div>
        </dl>
      </PageIntro>

      <Container className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="grid content-start gap-3 lg:col-span-7">
          {MISSION.slice(1).map((p) => (
            <p key={p.slice(0, 20)} className="text-[15.5px] leading-[1.7] text-pretty text-muted">{p}</p>
          ))}
        </div>
        <figure className="self-start border-l-2 border-brand-sand pl-4 lg:col-span-5">
          <p className="text-[12px] font-medium text-subtle">Viziune</p>
          <blockquote className="mt-1 text-[17px] leading-[1.5] font-medium tracking-tight text-pretty">{VISION}</blockquote>
        </figure>
      </Container>

      <Container className="grid gap-6 pt-6 xl:grid-cols-2 xl:gap-10">
        <section className="grid content-start gap-4">
          <SectionHeader index="01" eyebrow="Misiune" title="Obiective" />
          <div className="grid gap-3 md:grid-cols-2">
            {OBJECTIVES.map((o, i) => (
              <div key={o.title} className="rounded-[18px] border border-border bg-surface p-4 shadow-card">
                <p className="tabular text-[12px] text-subtle">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1.5 text-[16px] font-semibold tracking-tight">{o.title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{o.body}</p>
                {o.items ? (
                  <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border bg-border">
                    {o.items.map((item, j) => (
                      <li key={item} className="flex gap-2.5 bg-surface-2/60 px-3 py-1.5 text-[13.5px]">
                        <span className="tabular text-subtle">{String.fromCharCode(97 + j)}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <section className="grid content-start gap-4">
          <SectionHeader index="02" eyebrow="Afilieri" title="Infrastructuri europene de cercetare" lede="Siturile planificate în Bălțile Brăilei și în Delta Dunării servesc LifeWatch, ICOS, eLTER și DANUBIUS-RI." />
          <div className="grid gap-px overflow-hidden rounded-[18px] border border-border bg-border sm:grid-cols-2">
            {INFRASTRUCTURES.map((i) => (
              <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="group grid content-start gap-1.5 bg-surface p-4 transition-colors hover:bg-surface-2/60">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[16px] font-semibold tracking-tight">{i.name}</span>
                  <ArrowUpRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
                </span>
                <span className="text-[13.5px] leading-relaxed text-muted">{i.role}</span>
              </a>
            ))}
          </div>
        </section>
      </Container>

      <Container className="grid gap-4 pt-6">
        <SectionHeader index="03" eyebrow="1922–2007" title="Istoric" />
        <Reveal>
          <ol className="grid gap-px overflow-hidden rounded-[18px] border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
            {TIMELINE.map((m) => (
              <li key={m.year + m.title} className="grid content-start gap-1 bg-surface px-4 py-3">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="size-2 rounded-full bg-brand-orange" />
                  <span className="tabular text-[13px] font-medium text-accent">{m.year}</span>
                </span>
                <h3 className="text-[15px] font-semibold tracking-tight">{m.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-muted">{m.body}</p>
                {m.link ? (
                  <Link to={m.link} className="group mt-0.5 inline-flex w-fit items-center gap-1 text-[12.5px] font-medium">
                    Detalii
                    <ArrowRight className="size-3 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </Reveal>
      </Container>

      <Container className="grid gap-4 pt-6">
        <SectionHeader
          index="04"
          id="fotografii"
          eyebrow="Credite"
          title="Fotografii și surse"
          lede="Fotografiile provin de pe Unsplash și sunt folosite conform licenței Unsplash. Locația fiecăreia a fost verificată pe pagina fotografiei. Faptele despre stații și platforme provin din paginile infrastructurii LifeWatch România."
        />
        <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 border-b border-border py-2 text-[13.5px]">
              <span className="text-muted">{p.location}</span>
              <ExternalLink href={p.page}>{p.author}</ExternalLink>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
