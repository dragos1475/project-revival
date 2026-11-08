// Projects supported by the infrastructure, filterable by station.
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PROJECTS, PROJECTS_SOURCE } from "../content/projects";
import { STATIONS } from "../content/stations";
import { Link } from "../router";
import { Band, Container, Crumbs, ExternalLink, PageIntro } from "../components/primitives";
import { ProjectCards } from "../components/project-cards";

export default function ProjectsPage() {
  const [station, setStation] = useState<string | null>(null);
  const list = station ? PROJECTS.filter((p) => p.stations.includes(station)) : PROJECTS;
  const seg = "inline-flex min-h-9 items-center rounded-md border border-border px-3 text-[14px] font-semibold text-navy hover:border-navy aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white dark:text-foreground dark:aria-pressed:border-lime dark:aria-pressed:bg-lime dark:aria-pressed:text-navy";
  return (
    <>
      <PageIntro
        eyebrow="Proiecte"
        title="Proiecte susținute de infrastructură"
        lede="Infrastructura LifeWatch România susține proiectele europene și naționale ale Universității din București, majoritatea coordonate de RCSES. Pentru fiecare proiect arătăm unde lucrează, iar pe pagina stațiunilor găsiți proiectele fiecărei stațiuni."
        crumbs={<Crumbs items={[{ label: "Despre", node: <Link to="despre" className="hover:text-white">Despre</Link> }, { label: "Proiecte" }]} />}
        actions={<ExternalLink href={PROJECTS_SOURCE} className="text-[14px] text-white decoration-white/40">Lista proiectelor RCSES</ExternalLink>}
      />
      <Band>
        <Container>
          <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrează după stațiune">
            <button type="button" aria-pressed={station === null} onClick={() => setStation(null)} className={seg}>
              Toate
            </button>
            {STATIONS.map((s) => (
              <button key={s.slug} type="button" aria-pressed={station === s.slug} onClick={() => setStation(s.slug)} className={cn(seg)}>
                {s.short}
              </button>
            ))}
            <span className="ml-1 text-[14px] text-subtle">
              {list.length} {list.length === 1 ? "proiect" : "proiecte"}
            </span>
          </div>
          <ProjectCards list={list} />
        </Container>
      </Band>
    </>
  );
}
