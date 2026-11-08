// One research station: navy intro, photo and gallery, what the station offers, laboratories,
// species observed nearby; on the side the key facts, contacts, a map, the climate and Natura 2000.
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATIONS, type Station } from "../content/stations";
import { PLATFORMS } from "../content/platforms";
import { asset, commonName, fmt, lwByKey, meanOf, relatedOf, sheetKey, stationGallery, STATION_POINT } from "../content/lw";
import { explorerHref, Link, pageHref } from "../router";
import { CopyValue } from "../components/blocks";
import { BulletList, Container, Crumbs, PageIntro } from "../components/primitives";
import { ModuleList } from "../components/modules";
import { LwMap } from "../components/lw-map";
import { Climograph, ClimographLegend } from "../components/lw-charts";
import { Gallery, useLightbox } from "../components/lw-gallery";
import { ChipLink, H3 } from "../components/lw-ui";
import { StationTabs } from "./stations";
import { projectsAt } from "../content/projects";
import { ProjectList } from "../components/project-cards";
import { Card, CardBody, CardText, CardTitle, Tag } from "../components/lw-ui";

const LABS: Record<string, string[]> = {
  sinaia: ["Centrul de date LifeWatch România (HPC și cloud privat)", "Laboratoare virtuale conectate la LifeWatch ERIC", "Bază pentru ecologia montană din Bucegi și Piatra Craiului"],
  braila: ["Laborator de ecologie a zonelor inundabile", "Laborator de genetică pentru studii ecosistemice în zone umede", "Cabana de teren Stăncuța, nave de cercetare și ponton-laborator", "Stație de flux ICOS pe Insula Mare a Brăilei"],
  orsova: ["Laborator de monitorizare, prelevare și analiză a probelor geomatice pentru ecosisteme fluviale", "Drone, batimetrie și senzori pentru lacul de acumulare Porțile de Fier I", "Geochimia sedimentelor"],
  "sfantu-gheorghe": ["Grupul de Cercetări Costiere al Facultății de Geografie", "Instrumente optice pentru biologie și ecologie marină", "Infrastructură GIS și de teledetecție", "Monitorizarea plajelor, a furtunilor și a evoluției Peninsulei Sacalin"],
};

/** Research centre that coordinates each station. */
const COORD: Record<string, string> = {
  sinaia: "RCSES, Facultatea de Biologie",
  braila: "RCSES, Facultatea de Biologie",
  orsova: "Centrele de cercetare ale facultăților de Geografie, Chimie, Biologie și Geologie",
  "sfantu-gheorghe": "Facultatea de Geografie, Centrul de Cercetări Costiere pentru Protecția Mediului",
};

/** SCDA Brăila and the AGRODATASMART living lab, partners of the Brăila Islands LTSER platform. */
function BrailaPartners() {
  return (
    <div id="colaboratori" className="mt-8 scroll-mt-36">
      <H3>Colaboratori și living lab</H3>
      <div className="grid gap-3">
        <Card>
          <CardBody>
            <Tag className="w-fit">Partener local</Tag>
            <CardTitle>Stațiunea de Cercetare-Dezvoltare Agricolă Brăila (SCDA Brăila)</CardTitle>
            <CardText>Partenerul agricol al platformei LTSER Insulele Brăilei. Are un centru experimental la Polizești, localitatea în care se află și stația de flux POLI a rețelei LifeWatch, iar împreună lucrăm la legătura dintre agricultura din lunca Dunării și ecosistemele ei.</CardText>
            <a href="https://www.scdabraila.ro/" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
              scdabraila.ro <ArrowUpRight className="size-3.5" strokeWidth={2} />
            </a>
          </CardBody>
        </Card>
        <Card className="border-[#2f7d4f]/40">
          <CardBody>
            <Tag tone="ours" className="w-fit">ENoLL · Living lab</Tag>
            <CardTitle>Insulele Brăilei, living lab în rețeaua ENoLL</CardTitle>
            <CardText>SCDA Brăila coordonează AGRODATASMART, living lab membru al Rețelei Europene a Living Lab-urilor (ENoLL), împreună cu clusterul AGROSMART, o asociație cu 15 membri, de la fermieri și universități la companii și autorități locale. Living lab-ul dezvoltă agricultura de precizie cu senzori, imagini satelitare, stații meteo și drone, ca să reducă folosirea pesticidelor.</CardText>
            <CardText>Prin acest parteneriat, întreaga platformă LTSER Insulele Brăilei face parte din ENoLL. Cercetătorii, fermierii, administrațiile și comunitățile locale testează aici împreună soluții pentru lunca Dunării.</CardText>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button asChild variant="outline" size="site-sm">
                <a href="https://enoll.org/member/agrodatasmart/" target="_blank" rel="noreferrer">
                  AGRODATASMART pe ENoLL <ArrowUpRight />
                </a>
              </Button>
              <Button asChild variant="outline" size="site-sm">
                <Link to="platforme/insulele-brailei">Platforma LTSER →</Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Fact({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-[10px] border border-border bg-surface px-3.5 py-3${wide ? " sm:col-span-2" : ""}`}>
      <dt className="text-[12px] font-semibold tracking-[0.06em] text-subtle uppercase">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold">{children}</dd>
    </div>
  );
}

export function StationPage({ station }: { station: Station }) {
  const p = lwByKey(STATION_POINT[station.slug])!;
  const related = relatedOf(p);
  const imgs = stationGallery(p);
  const box = useLightbox(imgs);
  const hero = imgs[0];
  const species = (p.inat?.top ?? []).filter((t) => t.img).slice(0, 6);
  const index = STATIONS.findIndex((s) => s.slug === station.slug);
  const prev = STATIONS[(index - 1 + STATIONS.length) % STATIONS.length];
  const next = STATIONS[(index + 1) % STATIONS.length];
  const platforms = PLATFORMS.filter((x) => station.platforms.includes(x.slug));

  return (
    <>
      <PageIntro
        crumbs={<Crumbs items={[{ label: "Stațiuni", node: <Link to="statiuni">Stațiuni</Link> }, { label: station.short }]} />}
        eyebrow={`${p.unit ?? "Stațiune de cercetare"} · din ${station.founded}`}
        title={station.name}
        meta={`${station.setting} · județul ${station.county}`}
        lede={station.summary}
        actions={
          <>
            <Button asChild variant="lime" size="site">
              <Link to={sheetKey(p)}>Datele stațiunii</Link>
            </Button>
            {p.link ? (
              <Button asChild size="site" className="border border-[#4E6B7C] bg-transparent text-white hover:bg-navy-2">
                <a href={p.link} target="_blank" rel="noreferrer">
                  Pagina UB <ArrowUpRight />
                </a>
              </Button>
            ) : null}
          </>
        }
      />
      <StationTabs current={station.slug} />

      <Container className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          {hero ? (
            <figure className="relative m-0 mb-3 aspect-[16/9] cursor-zoom-in overflow-hidden rounded-[14px] bg-surface-3" onClick={() => box.open(0)}>
              <img src={asset(hero.src)} alt={hero.alt} className="size-full object-cover" />
              <figcaption className="absolute bottom-3 left-3 rounded-md bg-[rgba(14,42,59,0.78)] px-2.5 py-1 text-[12px] text-white">{hero.credit || hero.alt}</figcaption>
            </figure>
          ) : null}
          {imgs.length > 1 ? <Gallery list={imgs} onOpen={box.open} start={1} /> : null}
          {box.node}
          {p.text ? <p className="my-6 text-[17px] leading-[1.65] text-muted">{p.text}</p> : null}

          <H3>Ce găsiți aici</H3>
          <BulletList items={LABS[station.slug] ?? []} />
          <Link to="infrastructura" hash="laboratoare" className="mt-2 inline-block text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
            Toate laboratoarele proiectului →
          </Link>

          <div className="mt-8">
            <ProjectList list={projectsAt(station.slug)} title={station.slug === "braila" ? "Proiecte RCSES susținute de stațiune" : "Proiecte care lucrează aici"} />
          </div>
          {station.slug === "braila" ? <BrailaPartners /> : null}

          {station.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id} className="mt-8 grid gap-3">
              <h2 id={section.id} className="scroll-mt-36 font-display text-[21px] leading-tight font-bold sm:text-[22px]">{section.title}</h2>
              {section.lede ? <p className="max-w-[80ch] text-[15.5px] leading-[1.7] text-pretty text-muted">{section.lede}</p> : null}
              {section.items ? <BulletList items={section.items} columns={section.items.length > 3 ? 2 : 1} /> : null}
              {section.modules ? <ModuleList modules={section.modules} /> : null}
            </section>
          ))}

          {related.length ? (
            <div className="mt-8">
              <H3>Situri pe termen lung asociate</H3>
              <div className="flex flex-wrap gap-1.5">
                {related.map((r) => (
                  <ChipLink key={r.key} href={pageHref(sheetKey(r))}>{r.ro}</ChipLink>
                ))}
              </div>
            </div>
          ) : null}

          {species.length ? (
            <div className="mt-8">
              <H3>Specii observate frecvent în zonă</H3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {species.map((t) => (
                  <a key={t.taxon} href={`https://www.inaturalist.org/taxa/${t.taxon}`} target="_blank" rel="noreferrer" className="flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface hover:border-accent">
                    <img loading="lazy" src={asset(t.img!)} alt={commonName(t) || t.name} className="aspect-square w-full bg-surface-3 object-cover" />
                    <div className="px-2.5 py-2 text-[13px] leading-[1.35]">
                      {commonName(t) || t.name}
                      <i className="block text-[12px] text-subtle">{t.name}</i>
                      <em className="font-bold text-[#2f7d4f] not-italic dark:text-accent">{fmt(t.count)} obs.</em>
                    </div>
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-subtle">Fotografii iNaturalist cu licență Creative Commons; autorii apar în galerie.</p>
            </div>
          ) : null}

          <section aria-labelledby="date" className="mt-8 grid gap-3">
            <h2 id="date" className="scroll-mt-36 font-display text-[21px] leading-tight font-bold sm:text-[22px]">Date în explorator</h2>
            <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
              {station.explorer.map((e) => (
                <li key={e.label} className="border-b border-border">
                  <a href={explorerHref(e.path, e.query)} className="group flex items-center justify-between gap-4 py-2.5 text-[15px] hover:text-accent">
                    {e.label}
                    <ArrowUpRight className="size-4 shrink-0 text-subtle" strokeWidth={1.75} />
                  </a>
                </li>
              ))}
              {platforms.map((x) => (
                <li key={x.slug} className="border-b border-border">
                  <Link to={`platforme/${x.slug}`} className="group flex items-center justify-between gap-4 py-2.5 text-[15px] hover:text-accent">
                    Platforma LTSER {x.name}
                    <ArrowRight className="size-4 shrink-0 text-subtle" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="min-w-0">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label="Înființată">{station.founded}</Fact>
            <Fact label="Unitate">{p.unit}</Fact>
            <Fact label="Centrul care coordonează stațiunea" wide>
              {COORD[station.slug]}
            </Fact>
            {station.slug === "braila" ? (
              <>
                <Fact label="Coordonator">Dr. Mihai Adamescu, RCSES</Fact>
                <Fact label="Contact">
                  Marius Bujor
                  <a href="mailto:statiunea.braila@gmail.com" className="block text-[14px] font-normal break-all hover:text-accent" data-no-tr>
                    statiunea.braila@gmail.com
                  </a>
                </Fact>
              </>
            ) : null}
            <Fact label="Specii pe iNaturalist">{fmt(p.inat?.species)}</Fact>
            <Fact label="Ocurențe GBIF">{fmt(p.gbif?.occ)}</Fact>
            <Fact label="Situri Natura 2000">{p.n2k?.length ?? 0}</Fact>
            <Fact label="Temperatura medie anuală">{p.power ? `${fmt(meanOf(p.power.t), 1)} °C` : "–"}</Fact>
          </dl>
          <dl className="mt-3 grid rounded-[10px] border border-border bg-surface px-3.5">
            {[
              ["Coordonare", station.operator],
              ["Adresă", <CopyValue key="a" value={station.address} label="Adresa" />],
              ["Telefon", <a key="t" href={station.phoneHref} className="tabular hover:text-accent">{station.phone}</a>],
              ...(station.website ? [["Site web", <a key="w" href={station.website} target="_blank" rel="noreferrer" className="hover:text-accent">{station.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>]] : []),
            ].map(([label, value]) => (
              <div key={label as string} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-border py-2.5 last:border-b-0">
                <dt className="text-[13px] text-subtle">{label}</dt>
                <dd className="text-[14px] leading-snug">{value}</dd>
              </div>
            ))}
          </dl>
          <Button asChild variant="green" size="site-sm" className="mt-3.5">
            <Link to="acces">Cum lucrați aici</Link>
          </Button>
          <LwMap points={[p, ...related]} fit="points" label={`Harta: ${station.name} și siturile asociate`} className="mt-3.5 h-[260px] rounded-xl border border-border" />
          <p className="mt-1.5 mb-5 text-[13px] text-subtle">Poziție aproximativă, la nivel de localitate.</p>
          {p.power ? (
            <>
              <H3>Clima</H3>
              <Climograph main={p.power} label={`Climograma pentru ${station.short}`} />
              <ClimographLegend />
              <p className="text-[13px] text-subtle">{p.power.src}</p>
            </>
          ) : null}
          {p.n2k?.length ? (
            <>
              <H3 className="mt-5">Arii protejate Natura 2000</H3>
              <div className="flex flex-wrap gap-1.5">
                {p.n2k.slice(0, 8).map((s) => (
                  <ChipLink key={s.code} href={`https://eunis.eea.europa.eu/sites/${s.code}`} external>
                    {s.code} · {s.name}
                  </ChipLink>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      </Container>

      <Container className="pb-12">
        <nav aria-label="Alte stațiuni" className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
          <Link to={`statiuni/${prev.slug}`} className="group grid gap-0.5 rounded-xl p-3 transition-colors hover:bg-surface-2">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <ArrowLeft className="size-3" strokeWidth={1.75} />
              Stațiunea anterioară
            </span>
            <span className="text-[16px] font-semibold">{prev.name}</span>
          </Link>
          <Link to={`statiuni/${next.slug}`} className="group grid gap-0.5 rounded-xl p-3 text-right transition-colors hover:bg-surface-2">
            <span className="inline-flex items-center justify-end gap-1.5 text-[12.5px] text-subtle">
              Stațiunea următoare
              <ArrowRight className="size-3" strokeWidth={1.75} />
            </span>
            <span className="text-[16px] font-semibold">{next.name}</span>
          </Link>
        </nav>
      </Container>
    </>
  );
}
