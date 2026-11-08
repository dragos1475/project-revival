// Community and network: international networks, memberships and partners.
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DEIMS, INFRASTRUCTURES, NETWORKS_INTL } from "../content/org";
import { LTSER_FACTS } from "../content/platforms";
import { PROJECTS } from "../content/projects";
import { Link } from "../router";
import { Container, ExternalLink, Figures, PageIntro, Reveal, SectionHeader } from "../components/primitives";

export default function NetworkPage() {
  return (
    <>
      <PageIntro
        eyebrow="Rețele de cercetare pe termen lung"
        title="Rețea și comunitate"
        lede="Platformele românești fac parte din rețeaua internațională ILTER și din LTER-Europe. Echipele colaborează cu infrastructurile europene de cercetare și în proiecte comune."
      />
      <Container>
        <Figures items={LTSER_FACTS} />
      </Container>

      <Container className="grid gap-6 pt-6 xl:grid-cols-2 xl:gap-10">
        <section className="grid content-start gap-4">
          <SectionHeader index="01" eyebrow="Rețele" title="Rețele internaționale" />
          <ul className="grid border-t border-border">
            {NETWORKS_INTL.map((n) => (
              <li key={n.name} className="border-b border-border">
                <a href={n.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[112px_minmax(0,1fr)_auto] items-baseline gap-4 py-2.5">
                  <span className="text-[15px] font-semibold tracking-tight">{n.name}</span>
                  <span className="text-[14px] leading-relaxed text-muted">{n.role}</span>
                  <ArrowUpRight className="size-3.5 self-center text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13.5px]">
            <ExternalLink href={DEIMS.ltserRomania}>Rețeaua LTSER România în DEIMS</ExternalLink>
            <ExternalLink href={DEIMS.network}>Rețeaua eLTER în DEIMS</ExternalLink>
          </div>
        </section>
        <section className="grid content-start gap-4">
          <SectionHeader index="02" eyebrow="Parteneri" title="Colaborări" />
          <dl className="grid border-t border-border">
            {[
              ["ALTER-Net", "Participare activă din 2004 la rețeaua europeană de cercetare a biodiversității și ecosistemelor."],
              ["ICAS", "Institutul de Cercetări și Amenajări Silvice, partener pentru platformele LTSER deservite de centrul de date de la Sinaia."],
              ["Proiecte de capacitate", "Lucrări de infrastructură și dezvoltare a capacității de cercetare pe platformele Insulele Brăilei și Neajlov."],
            ].map(([term, body]) => (
              <div key={term} className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 border-b border-border py-2.5 sm:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="text-[14px] font-medium">{term}</dt>
                <dd className="text-[14px] leading-relaxed text-muted">{body}</dd>
              </div>
            ))}
          </dl>
          <Link to="proiecte" className="group flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-2.5 shadow-card transition-colors hover:border-border-strong">
            <span className="grid">
              <span className="text-[14.5px] font-semibold tracking-tight">{PROJECTS.length} proiecte europene și naționale</span>
              <span className="text-[13px] text-muted">{PROJECTS.map((p) => p.name).join(", ")}</span>
            </span>
            <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
          </Link>
        </section>
      </Container>

      <Container className="grid gap-4 pt-6">
        <SectionHeader index="03" eyebrow="Infrastructuri" title="Infrastructuri europene de cercetare" />
        <Reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INFRASTRUCTURES.map((i) => (
            <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="group grid content-start gap-1.5 rounded-[16px] border border-border bg-surface p-4 shadow-card transition-colors hover:border-border-strong">
              <span className="flex items-start justify-between gap-2">
                <span className="text-[15.5px] font-semibold tracking-tight">{i.name}</span>
                <ArrowUpRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
              </span>
              <span className="text-[13.5px] leading-relaxed text-muted">{i.role}</span>
            </a>
          ))}
        </Reveal>
      </Container>
    </>
  );
}
