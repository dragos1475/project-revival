// Services offered through the Sinaia data centre and the European networks.
import { ArrowUpRight } from "lucide-react";
import { findStation } from "../content/stations";
import { DEIMS, EXTERNAL_MAPS } from "../content/org";
import { explorerHref, Link } from "../router";
import { ArrowLink } from "../components/blocks";
import { ModuleList } from "../components/modules";
import { Container, PageIntro, Reveal, SectionHeader } from "../components/primitives";

export default function ServicesPage() {
  const sinaia = findStation("sinaia")!;
  const dataServices = sinaia.sections.find((s) => s.id === "servicii")?.modules ?? [];
  const tools = [
    { title: "Exploratorul LTSER", body: "Teledetecție, rețele, date brute și indicatori sociali, în browser.", href: explorerHref(), external: false },
    { title: "Harta avansată", body: "Vizualizatorul cartografic al infrastructurii, cu straturi tematice.", href: EXTERNAL_MAPS.advanced, external: true },
    { title: "eLTER DEIMS-SDR", body: "Fișele siturilor românești în registrul european.", href: DEIMS.network, external: true },
  ];
  return (
    <>
      <PageIntro eyebrow="Date și servicii" title="Servicii" lede="Instrumente web pentru consultarea datelor și serviciile centrului de date de la Sinaia: stocare, calcul și laboratoare virtuale." />

      <Container className="grid gap-4">
        <SectionHeader index="01" eyebrow="Aplicații" title="Instrumente web" />
        <Reveal className="grid gap-3 md:grid-cols-3">
          {tools.map((t, i) => (
            <a key={t.title} href={t.href} target={t.external ? "_blank" : undefined} rel={t.external ? "noreferrer" : undefined} className={i === 0 ? "group grid content-between gap-4 rounded-[18px] bg-panel p-4 text-panel-foreground dark:border dark:border-border" : "group grid content-between gap-4 rounded-[18px] border border-border bg-surface p-4 shadow-card transition-colors hover:border-border-strong"}>
              <span className="flex items-start justify-between gap-3">
                <span className="text-[16px] font-semibold tracking-tight">{t.title}</span>
                <ArrowUpRight className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
              </span>
              <span className={i === 0 ? "text-[13.5px] leading-relaxed text-white/70" : "text-[13.5px] leading-relaxed text-muted"}>{t.body}</span>
            </a>
          ))}
        </Reveal>
      </Container>

      <Container className="grid gap-6 pt-6 xl:grid-cols-12 xl:gap-10">
        <section className="grid content-start gap-4 xl:col-span-7">
          <SectionHeader
            index="02"
            eyebrow="Calcul și stocare"
            title="Centrul de date Sinaia"
            lede="Infrastructura de calcul de înaltă performanță, în model cloud, extinde platforma integrată a Universității din București și o leagă de platformele tematice."
            aside={<ArrowLink to="statiuni/sinaia">Stațiunea Sinaia</ArrowLink>}
          />
          <ModuleList modules={dataServices} />
        </section>
        <section className="grid content-start gap-4 xl:col-span-5">
          <SectionHeader index="03" eyebrow="Educație" title="Formare" />
          <p className="text-[14.5px] leading-[1.7] text-muted">
            Stațiunile Sinaia și Orșova găzduiesc practica de teren a studenților, iar centrul de conferințe de la Sinaia are săli și laboratoare pentru ateliere și simpozioane. Programele de formare fac parte din obiectivele infrastructurii.
          </p>
          <p className="text-[14.5px] leading-[1.7] text-muted">
            Pentru organizarea unei activități, contactați direct stația: <Link to="contact" className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-accent">adrese și telefoane</Link>.
          </p>
        </section>
      </Container>
    </>
  );
}
