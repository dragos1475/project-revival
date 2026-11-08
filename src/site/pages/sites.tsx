// The LTER network of Romania: our sites, the sortable table of all DEIMS-SDR sites and the ICOS
// stations.
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAT, fmt, LTSER_URL, LW_POINTS, NETS, sheetKey, siteCode, type LwPoint } from "../content/lw";
import { Link } from "../router";
import { Band, Container, SectionHeader } from "../components/primitives";
import { LwMap } from "../components/lw-map";
import { CatShape, CatTag } from "../components/lw-shapes";
import { Card, CardBody, CardText, CardTitle, Note, Tag } from "../components/lw-ui";
import { SiteCard } from "./home";

const DEIMS = LW_POINTS.filter((p) => p.deims);
const RANK = ["ltser", "icos", "meteo", "lter"];

type Filter = "all" | "ours" | "ltser" | "lter" | "icos" | "meteo";
const FILTERS: [Filter, string][] = [
  ["all", "Toate"],
  ["ours", "Ale noastre"],
  ["ltser", "Platforme LTSER"],
  ["lter", "Situri LTER"],
  ["icos", "Flux"],
  ["meteo", "Stații climatice în DEIMS"],
];
type Col = "ro" | "cat" | "code" | "established" | "area_ha" | "elev" | "species" | "n2k";
const COLS: [Col, string][] = [
  ["ro", "Sit"],
  ["cat", "Tip"],
  ["code", "Cod eLTER"],
  ["established", "Din"],
  ["area_ha", "Suprafață (ha)"],
  ["elev", "Altitudine (m)"],
  ["species", "Specii iNat"],
  ["n2k", "Natura 2000"],
];
function value(p: LwPoint, k: Col): string | number {
  if (k === "code") return siteCode(p) ?? "";
  if (k === "cat") return ["ltser", "lter", "icos", "meteo"].indexOf(p.cat);
  if (k === "elev") return p.elev?.max ?? -1;
  if (k === "species") return p.inat?.species ?? 0;
  if (k === "n2k") return p.n2k?.length ?? 0;
  if (k === "ro") return p.ro;
  return p[k] ?? -1;
}

function NetworkTable() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ k: Col; dir: 1 | -1 }>({ k: "cat", dir: 1 });
  const rows = useMemo(() => {
    const list = DEIMS.filter((p) => filter === "all" || (filter === "ours" ? p.ours : p.cat === filter));
    return list.sort((a, b) => {
      const x = value(a, sort.k), y = value(b, sort.k);
      return (typeof x === "string" ? x.localeCompare(String(y), "ro") : x > (y as number) ? 1 : x < (y as number) ? -1 : 0) * sort.dir;
    });
  }, [filter, sort]);
  return (
    <>
      <div role="group" aria-label="Filtrează după tip" className="mt-6 mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className="h-9 rounded-md border border-border-strong bg-surface px-3 text-[13.5px] font-semibold text-navy hover:bg-surface-2 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white dark:text-foreground dark:aria-pressed:border-lime dark:aria-pressed:bg-lime dark:aria-pressed:text-navy"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
              {COLS.map(([k, label]) => (
                <th key={k} aria-sort={sort.k === k ? (sort.dir > 0 ? "ascending" : "descending") : "none"} className="border-b border-border px-2.5 py-2.5 font-semibold">
                  <button type="button" onClick={() => setSort((s) => (s.k === k ? { k, dir: s.dir > 0 ? -1 : 1 } : { k, dir: 1 }))} className="uppercase hover:text-foreground">
                    {label}
                    {sort.k === k ? (sort.dir > 0 ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.key} className="align-top">
                <td className="border-b border-border px-2.5 py-2.5">
                  <Link to={sheetKey(p)} className="font-semibold text-[#2f7d4f] hover:underline dark:text-accent">{p.ro}</Link>
                  {p.ours ? <Tag tone="ours" className="ml-1.5 px-1.5 py-0 text-[11px]">UB</Tag> : null}
                  <div className="text-[12.5px] text-subtle">{p.fullName}</div>
                </td>
                <td className="border-b border-border px-2.5 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <CatShape cat={p.cat} size={14} />
                    {CAT[p.cat].one}
                  </span>
                </td>
                <td className="border-b border-border px-2.5 py-2.5">{siteCode(p) ?? "–"}</td>
                <td className="tabular border-b border-border px-2.5 py-2.5">{p.established ?? "–"}</td>
                <td className="tabular border-b border-border px-2.5 py-2.5">{fmt(p.area_ha)}</td>
                <td className="tabular border-b border-border px-2.5 py-2.5">{p.elev && (p.elev.min != null || p.elev.max != null) ? `${p.elev.min ?? ""}–${p.elev.max ?? ""}` : "–"}</td>
                <td className="tabular border-b border-border px-2.5 py-2.5">{fmt(p.inat?.species)}</td>
                <td className="tabular border-b border-border px-2.5 py-2.5">{p.n2k?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-[13px] text-subtle">Apăsați pe titlul unei coloane ca să sortați tabelul.</p>
    </>
  );
}

export default function SitesPage() {
  const ours = DEIMS.filter((p) => p.ours).sort((a, b) => RANK.indexOf(a.cat) - RANK.indexOf(b.cat));
  const icos = LW_POINTS.filter((p) => p.cat === "icos");
  return (
    <>
      <section className="bg-navy text-white">
        <Container className="grid items-end gap-8 pt-10 pb-11 sm:pt-14 sm:pb-14 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-3">
            <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">Rețeaua LTER România</p>
            <h1 className="font-display text-[34px] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[44px] xl:text-[52px]">Situri de cercetare pe termen lung</h1>
            <p className="max-w-[78ch] text-[16px] leading-[1.65] text-[#CFDCE2] sm:text-[17px]">Toate siturile românești din registrul european DEIMS-SDR, cu stațiile de flux și cu cele 20 de stații climatice LifeWatch. Siturile operate de Universitatea din București sunt marcate separat.</p>
          </div>
          <LwMap points={LW_POINTS.filter((p) => p.cat !== "statiune")} label="Harta siturilor LTER și a stațiilor ICOS" className="h-[300px] rounded-xl border border-[#2C5A6E]" />
        </Container>
      </section>
      <nav aria-label="Secțiuni" className="border-b border-border bg-background">
        <Container className="flex gap-1.5 overflow-x-auto py-2">
          {[
            ["noastre", "Siturile noastre"],
            ["retea", "Toată rețeaua"],
            ["icos", "Stațiile ICOS"],
          ].map(([id, label]) => (
            <Link key={id} to="situri" hash={id} className="inline-flex min-h-[38px] shrink-0 items-center rounded-md border border-border px-3.5 text-[14px] font-semibold text-navy hover:border-navy hover:bg-navy hover:text-white dark:text-foreground dark:hover:border-lime dark:hover:bg-lime dark:hover:text-navy">
              {label}
            </Link>
          ))}
          <Link to="platforme" className="inline-flex min-h-[38px] shrink-0 items-center rounded-md border border-border px-3.5 text-[14px] font-semibold text-navy hover:border-navy hover:bg-navy hover:text-white dark:text-foreground dark:hover:border-lime dark:hover:bg-lime dark:hover:text-navy">
            Platformele LTSER
          </Link>
        </Container>
      </nav>

      <Band id="noastre">
        <Container>
          <SectionHeader eyebrow="Operate de Universitatea din București" title="Siturile noastre" lede="Platformele socio-ecologice și stațiile de flux în care RCSES este manager de sit sau furnizor de metadate în DEIMS." />
          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
            {ours.map((p) => (
              <SiteCard key={p.key} p={p} abstract />
            ))}
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="retea">
        <Container>
          <SectionHeader eyebrow="DEIMS-SDR" title="Toată rețeaua" lede={`${DEIMS.length} fișe românești în registrul european al siturilor de cercetare pe termen lung.`} />
          <NetworkTable />
        </Container>
      </Band>

      <Band id="icos">
        <Container>
          <SectionHeader eyebrow="ICOS · Integrated Carbon Observation System" title="Stațiile de flux ecosistemic" lede="Proiectul LifeWatch România a instalat cinci stații de flux, iar una dintre ele, într-o zonă umedă, măsoară și metanul. Trei sunt înregistrate în DEIMS ca stații ICOS. Turnurile lor de covarianță turbulentă măsoară schimburile de dioxid de carbon, apă și energie dintre ecosisteme și atmosferă pe terenurile agricole de pe Insula Mare a Brăilei, în Parcul Natural Comana din bazinul Neajlovului și în zonele umede de la Enisala, în Rezervația Biosferei Delta Dunării. Celelalte două, codificate POLI și BV, apar în LTSER Explorer." />
          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {icos.map((p) => (
              <Card key={p.key}>
                <CardBody>
                  <div>
                    <CatTag cat="icos" />
                  </div>
                  <CardTitle>{p.ro}</CardTitle>
                  <CardText>{p.abstract || (p.ltser?.code === "POLI" ? "Turn de covarianță turbulentă din rețeaua LifeWatch, la Polizești, cu o sondă cu neutroni cosmici pentru umiditatea solului." : "Turn de covarianță turbulentă din rețeaua LifeWatch, amplasat lângă stația climatică BV-Brv.")}</CardText>
                  <p className="text-[13px] text-subtle">
                    <b className="text-foreground">Variabile:</b> {p.observed?.length ? p.observed.join(", ") : `${NETS.ec.d}.`}
                  </p>
                  {p.ltser ? <p className="text-[13px]">Cod în LTSER Explorer: {p.ltser.code}</p> : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button asChild variant="dark" size="site-sm">
                      <Link to={sheetKey(p)}>Fișa stației</Link>
                    </Button>
                    {p.deims ? (
                      <>
                        <Button asChild variant="outline" size="site-sm">
                          <a href={p.deims} target="_blank" rel="noreferrer">
                            DEIMS <ArrowUpRight />
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="site-sm">
                          <a href="https://data.icos-cp.eu/portal/" target="_blank" rel="noreferrer">
                            Carbon Portal <ArrowUpRight />
                          </a>
                        </Button>
                      </>
                    ) : null}
                    <Button asChild variant="outline" size="site-sm">
                      <a href={LTSER_URL} target="_blank" rel="noreferrer">
                        LTSER Explorer <ArrowUpRight />
                      </a>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <Note className="mt-6">
            <b>Unde sunt datele.</b> Metadatele stațiilor sunt în DEIMS-SDR. Datele de flux validate se publică prin ICOS Carbon Portal, unde se pot căuta după stație, variabilă și perioadă. Seriile semiorare ale tuturor celor cinci stații se văd în{" "}
            <a href={LTSER_URL} target="_blank" rel="noreferrer" className="font-semibold text-[#2f7d4f] underline dark:text-accent">
              LTSER Explorer ↗
            </a>
            .
          </Note>
        </Container>
      </Band>
    </>
  );
}
