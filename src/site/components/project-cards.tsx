// Project cards: funding, years, what the project does, where it works and the stations involved.
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATIONS } from "../content/stations";
import type { Project } from "../content/projects";
import { Link } from "../router";
import { Card, CardBody, CardText, CardTitle, Tag } from "./lw-ui";

const stationName = (slug: string) => STATIONS.find((s) => s.slug === slug)?.short ?? slug;

function ProjectLink({ url }: { url: string }) {
  if (!url) return null;
  const cls = "mt-auto inline-flex w-fit items-center gap-1 pt-1 text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent";
  if (/^https?:/.test(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={cls}>
        Site-ul proiectului <ArrowUpRight className="size-3.5" strokeWidth={2} />
      </a>
    );
  }
  const [to, hash] = url.split("#");
  return (
    <Link to={to} hash={hash} className={cls}>
      Detalii →
    </Link>
  );
}

export function ProjectCards({ list, className, showStations = true }: { list: Project[]; className?: string; showStations?: boolean }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3", className)}>
      {list.map((p) => (
        <Card key={p.name}>
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              <Tag>{p.funding}</Tag>
              {p.years ? <Tag tone="ours">{p.years}</Tag> : null}
            </div>
            <CardTitle>{p.name}</CardTitle>
            <CardText>{p.summary}</CardText>
            <p className="text-[14px] leading-[1.5]">
              <b className="block text-foreground">Unde lucrează</b>
              <span className="text-muted">{p.where}</span>
            </p>
            <p className="text-[13.5px] text-subtle">{p.role}</p>
            {showStations && p.stations.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.stations.map((s) => (
                  <Link key={s} to={`statiuni/${s}`} className="inline-flex min-h-[28px] items-center rounded-md bg-surface-2 px-2 text-[13px] text-navy hover:bg-surface-3 dark:text-foreground">
                    {stationName(s)}
                  </Link>
                ))}
              </div>
            ) : null}
            <ProjectLink url={p.url} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/** Compact list for a station page. */
export function ProjectList({ list, title }: { list: Project[]; title: string }) {
  if (!list.length) return null;
  return (
    <div>
      <h3 className="mb-3 font-display text-[21px] leading-[1.25] font-bold sm:text-[22px]">{title}</h3>
      <ul className="grid border-t border-border">
        {list.map((p) => (
          <li key={p.name} className="grid gap-0.5 border-b border-border py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              {p.url && /^https?:/.test(p.url) ? (
                <a href={p.url} target="_blank" rel="noreferrer" className="font-semibold text-navy hover:text-accent hover:underline dark:text-foreground">
                  {p.name}
                </a>
              ) : (
                <b>{p.name}</b>
              )}
              <span className="text-[13px] text-subtle">
                {p.funding}
                {p.years ? ` · ${p.years}` : ""}
              </span>
            </div>
            <span className="text-[14px] text-muted">{p.where}</span>
          </li>
        ))}
      </ul>
      <Link to="proiecte" className="mt-2 inline-block text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
        Toate proiectele susținute de infrastructură →
      </Link>
    </div>
  );
}
