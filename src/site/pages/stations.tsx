// Research stations (/statiuni/): overview map, the four stations and how researchers get access.
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LW_POINTS, STATION_SLUG } from "../content/lw";
import { Link } from "../router";
import { Band, Container, SectionHeader } from "../components/primitives";
import { LwMap } from "../components/lw-map";
import { Card, CardBody, CardText, CardTitle } from "../components/lw-ui";
import { StationCard } from "./home";

const STATIONS = LW_POINTS.filter((p) => p.cat === "statiune");

export function StationTabs({ current }: { current?: string }) {
  const cls =
    "inline-flex min-h-[38px] shrink-0 items-center rounded-md border border-border px-3.5 text-[14px] font-semibold text-navy hover:border-navy hover:bg-navy hover:text-white aria-[current=page]:border-navy aria-[current=page]:bg-navy aria-[current=page]:text-white dark:text-foreground dark:hover:border-lime dark:hover:bg-lime dark:hover:text-navy dark:aria-[current=page]:border-lime dark:aria-[current=page]:bg-lime dark:aria-[current=page]:text-navy";
  return (
    <nav aria-label="Stațiuni" className="border-b border-border bg-background">
      <Container className="flex gap-1.5 overflow-x-auto py-2">
        {STATIONS.map((p) => (
          <Link key={p.key} to={`statiuni/${STATION_SLUG[p.id]}`} aria-current={current === STATION_SLUG[p.id] ? "page" : undefined} className={cls}>
            {p.short}
          </Link>
        ))}
        <Link to="acces" className={cls}>
          Acces pentru cercetători
        </Link>
      </Container>
    </nav>
  );
}

export default function StationsPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <Container className="grid items-end gap-8 pt-10 pb-11 sm:pt-14 sm:pb-14 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-3">
            <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">Infrastructura din teren</p>
            <h1 className="font-display text-[34px] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[44px] xl:text-[52px]">Stațiunile de cercetare</h1>
            <p className="max-w-[78ch] text-[16px] leading-[1.65] text-[#CFDCE2] sm:text-[17px]">Patru stațiuni ale Universității din București acoperă un gradient complet, de la pădurile montane din Bucegi la lunca inundabilă a Dunării, defileul de la Porțile de Fier și gura de vărsare în Marea Neagră.</p>
          </div>
          <LwMap points={STATIONS} labels markerSize={24} popups={false} label="Harta stațiunilor de cercetare" className="h-[280px] rounded-xl border border-[#2C5A6E]" />
        </Container>
      </section>
      <StationTabs />

      <Band>
        <Container>
          <SectionHeader eyebrow="Facultatea de Biologie și Facultatea de Geografie" title="Patru stațiuni, de la Bucegi la Marea Neagră" lede="Fiecare stațiune are o pagină cu galerie, laboratoare, climă, specii observate frecvent și ariile Natura 2000 din jur." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            {STATIONS.map((p) => (
              <StationCard key={p.key} p={p} />
            ))}
          </div>
          <div className="mt-6 grid gap-1.5 rounded-xl border border-border bg-ground p-5">
            <p className="font-semibold">Stațiuni și platforme LTSER</p>
            <p className="text-[15px] leading-[1.6] text-muted">Brăila coordonează monitorizarea Insulelor Brăilei, Sfântu Gheorghe lucrează în Delta Dunării, iar centrul de date de la Sinaia deservește platformele Bucegi-Piatra Craiului, Neajlov și Insulele Brăilei.</p>
            <Link to="platforme" className="w-fit text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
              Platformele LTSER →
            </Link>
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="acces">
        <Container className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Acces" title="Cum lucrați la stațiunile noastre" lede="Primim echipe de cercetare, studenți la practică și parteneri din proiecte. Cererile de acces la laboratoare și echipamente se adresează directorului infrastructurii IC LifeWatch cu cel puțin 14 zile înainte, după o discuție cu responsabilul laboratorului." />
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild variant="green" size="site">
                <Link to="acces" hash="cerere">Trimite o cerere</Link>
              </Button>
              <Button asChild variant="dark" size="site">
                <Link to="acces">Regulile de acces</Link>
              </Button>
              <Button asChild variant="outline" size="site">
                <a href="https://elter-ri.eu/" target="_blank" rel="noreferrer">
                  Acces prin eLTER <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["1 · Spuneți-ne ce plănuiți", "Perioada, numărul de persoane, ce vreți să măsurați, echipamentele de care aveți nevoie și sursa de finanțare."],
              ["2 · Stabilim logistica", "Cazare, transport pe apă la Brăila și Sfântu Gheorghe, acces la laboratoare și la centrul de date, prin acordul de acces."],
              ["3 · Datele rămân deschise", "Seturile de date produse la stațiuni sunt descrise în DEIMS și publicate cu licență deschisă după perioada de embargo convenită."],
            ].map(([t, b]) => (
              <Card key={t}>
                <CardBody>
                  <CardTitle>{t}</CardTitle>
                  <CardText>{b}</CardText>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </Band>
    </>
  );
}
