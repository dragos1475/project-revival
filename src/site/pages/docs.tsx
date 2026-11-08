// Documentation: conventions, export formats, explorer modules and data sources.
import { ArrowUpRight } from "lucide-react";
import { CONVENTIONS, DATASETS } from "../content/data";
import { EXPLORER_MODULES } from "../nav";
import { explorerHref, Link } from "../router";
import { Container, Crumbs, ExternalLink, PageIntro, SectionHeader } from "../components/primitives";

const FORMATS = [
  { id: "CSV", body: "Tabele cu separator virgulă, pentru orice program de calcul." },
  { id: "XLSX", body: "Registre Excel generate în browser, cu o foaie de date." },
  { id: "GeoTIFF", body: "Grile raster în EPSG:4326, cu NaN ca valoare nodata. Se deschid în QGIS sau R." },
  { id: "GeoJSON", body: "Poligoane ale unităților administrative, cu valorile indicatorului ales." },
  { id: "PNG", body: "Imaginea graficului, așa cum apare pe ecran." },
  { id: "JSON", body: "Răspunsurile API-ului LifeWatch." },
];

export default function DocsPage() {
  const formatUse = (f: string) => DATASETS.filter((d) => d.formats.includes(f)).length;
  return (
    <>
      <PageIntro
        eyebrow="Date și servicii"
        title="Documentație"
        lede="Convențiile de măsurare, stocare și export ale datelor."
        crumbs={<Crumbs items={[{ label: "Date", node: <Link to="date" className="hover:text-foreground">Date și servicii</Link> }, { label: "Documentație" }]} />}
      />

      <Container className="grid gap-6 xl:grid-cols-2 xl:gap-10">
        <section className="grid content-start gap-4">
          <SectionHeader index="01" eyebrow="Date" title="Convenții" />
          <dl className="grid border-t border-border">
            {CONVENTIONS.map((c) => (
              <div key={c.term} className="grid gap-1 border-b border-border py-2.5 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-[14px] font-medium">{c.term}</dt>
                <dd className="text-[14px] leading-relaxed text-muted">{c.body}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="grid content-start gap-4">
          <SectionHeader index="02" eyebrow="Export" title="Formate de fișier" />
          <div className="grid gap-px overflow-hidden rounded-[18px] border border-border bg-border sm:grid-cols-2">
            {FORMATS.map((f) => (
              <div key={f.id} className="grid content-start gap-1 bg-surface px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="tabular text-[15px] font-medium">{f.id}</span>
                  <span className="tabular text-[12px] text-subtle">{formatUse(f.id)} seturi</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      <Container className="grid gap-6 pt-6 xl:grid-cols-2 xl:gap-10">
        <section className="grid content-start gap-4">
          <SectionHeader index="03" eyebrow="Aplicație" title="Modulele exploratorului LTSER" lede="La pornire, exploratorul verifică ambele servicii de date. Starea lor apare în bara laterală, iar fiecare pagină indică sursa datelor afișate." />
          <ul className="grid border-t border-border">
            {EXPLORER_MODULES.map((m) => (
              <li key={m.id} className="border-b border-border">
                <a href={explorerHref(m.path)} className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 py-2.5">
                  <m.icon className="mt-0.5 size-4 text-subtle" strokeWidth={1.75} />
                  <span className="grid gap-0.5">
                    <span className="text-[14.5px] font-medium">{m.title}</span>
                    <span className="text-[13.5px] leading-relaxed text-muted">{m.body}</span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="grid content-start gap-4">
          <SectionHeader index="04" eyebrow="Proveniență" title="Surse de date" />
          <ul className="grid gap-2 text-[14px] sm:grid-cols-2">
            {[
              ["https://github.com/GabrielMajeri/lifewatch-romania", "Platforma de date LifeWatch România", "Modelul de date, ingestia în TimescaleDB și API-ul FastAPI pentru măsurătorile brute."],
              ["https://github.com/alexdum/ltser", "Aplicația LTSER Explorer", "Aplicația R Shiny originală, cu teledetecția, rețelele și indicatorii sociali."],
              ["https://www.icos-etc.eu/icos/documents/instructions/", "Instrucțiunile ICOS ETC", "Standardele pentru colectarea și stocarea datelor de monitorizare a mediului."],
              ["http://statistici.roda.ro/", "Arhiva Română de Date Sociale", "Sursa indicatorilor de populație și emigrație."],
            ].map(([href, title, body]) => (
              <li key={href} className="grid content-start gap-1 rounded-[14px] border border-border bg-surface px-3.5 py-3 shadow-card">
                <ExternalLink href={href}>{title}</ExternalLink>
                <span className="text-[13px] leading-relaxed text-muted">{body}</span>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
