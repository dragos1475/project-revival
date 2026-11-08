// Contact: address and phone of each station, with copy buttons and map links.
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { STATIONS } from "../content/stations";
import { ORG } from "../content/org";
import { Link } from "../router";
import { CopyValue, CreditedPhoto } from "../components/blocks";
import { Container, ExternalLink, PageIntro } from "../components/primitives";

const osm = ([lon, lat]: [number, number]) => `https://www.openstreetmap.org/?mlat=${lat.toFixed(4)}&mlon=${lon.toFixed(4)}#map=13/${lat.toFixed(4)}/${lon.toFixed(4)}`;

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Stații de cercetare" title="Contact" lede={`Adresele și telefoanele stațiilor de cercetare ale ${ORG.hostGenitive}.`}>
        <Link to="intrebari-frecvente" className="group inline-flex items-center gap-1.5 text-[14px] font-medium">
          Întrebări frecvente
          <ArrowRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
        </Link>
      </PageIntro>
      <Container>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATIONS.map((s) => (
              <li key={s.slug} className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-[18px] border border-border bg-surface p-1.5 shadow-card">
                <CreditedPhoto photo={s.photo} alt={`${s.photo.location}, imagine pentru ${s.name}`} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="hidden aspect-[16/9] rounded-xl sm:block" />
                <div className="grid content-start gap-3 px-2.5 pt-3 pb-2">
                  <div className="grid gap-0.5">
                    <p className="tabular text-[12px] text-subtle">din {s.founded} · județul {s.county}</p>
                    <h2 className="text-[16.5px] font-semibold tracking-tight">
                      <Link to={`statiuni/${s.slug}`} className="hover:text-accent">{s.name}</Link>
                    </h2>
                    <p className="text-[13px] text-muted">{s.operator}</p>
                  </div>
                  <dl className="grid gap-2 border-t border-border pt-3 text-[13.5px]">
                    <div className="flex items-start gap-3">
                      <dt className="sr-only">Adresă</dt>
                      <MapPin className="mt-0.5 size-4 shrink-0 text-subtle" strokeWidth={1.75} />
                      <dd className="grid gap-1">
                        <CopyValue value={s.address} label="Adresa" />
                        <a href={osm(s.lonLat)} target="_blank" rel="noreferrer" className="w-fit text-[13px] text-muted underline decoration-border-strong underline-offset-4 hover:text-foreground">
                          Deschide în OpenStreetMap
                        </a>
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt className="sr-only">Telefon</dt>
                      <Phone className="size-4 shrink-0 text-subtle" strokeWidth={1.75} />
                      <dd>
                        <a href={s.phoneHref} className="tabular hover:text-accent">{s.phone}</a>
                      </dd>
                    </div>
                    {s.website ? (
                      <div className="flex items-center gap-3 pl-7">
                        <dt className="sr-only">Site web</dt>
                        <dd>
                          <ExternalLink href={s.website}>{s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</ExternalLink>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
