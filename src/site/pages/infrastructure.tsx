// The LifeWatch România project and its infrastructure: 11 laboratories, the field network, the data
// centre in Sinaia, the genetics laboratory in Brăila, the web platform, LTSER Explorer and the data
// services. Text from the colleagues' static site.
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { asset, CAT, LTSER_URL, NETS, NETWORK_POINTS, placeText, sheetKey, type NetCode } from "../content/lw";
import { LOGOS, sitePhoto } from "../content/site-photos";
import { PROJECTS } from "../content/projects";
import { Link } from "../router";
import { Band, Container, SectionHeader } from "../components/primitives";
import { SubNav } from "../components/subnav";
import { LwMap } from "../components/lw-map";
import { useLightbox } from "../components/lw-gallery";
import { Card, CardBody, CardText, CardTitle, Tag } from "../components/lw-ui";
import { ProjectCards } from "../components/project-cards";

const PHOTOS = [
  sitePhoto("47c58b77", "Stația de flux ICOS de la Enisala, vedere aeriană"),
  sitePhoto("49bb8db2", "Structura infrastructurii de cercetare"),
  sitePhoto("ba0b7821", "Turnul de flux de la Enisala"),
  sitePhoto("00c041bf", "Instalarea unui turn de măsurare"),
  sitePhoto("8a3e1856", "Rack-urile centrului de date de la Sinaia"),
  sitePhoto("89f8fa52", "Arhitectura centrului de date"),
  sitePhoto("fab11817", "Laboratorul de genetică, vedere generală"),
  sitePhoto("2b8180fc", "Rotavapor și echipamente de laborator"),
  sitePhoto("fe4f88b6", "Microscoape și secvențiator"),
  sitePhoto("1d8aca66", "Bancul de lucru pentru biologie moleculară"),
  sitePhoto("e35237c7", "Integrarea serviciilor de date"),
  sitePhoto("4d20c4b6", "Serviciile de infrastructură ale platformei"),
  sitePhoto("e8ed8185", "Geoportalul LifeWatch România"),
  sitePhoto("4b5d473a", "LTSER Explorer, umiditatea solului"),
  sitePhoto("a5da705a", "LTSER Explorer, FAPAR"),
];

/** Figure that opens the shared lightbox. */
function Fig({ i, caption, open, className, imgClass }: { i: number; caption: ReactNode; open: (i: number) => void; className?: string; imgClass?: string }) {
  const p = PHOTOS[i];
  return (
    <figure className={cn("m-0 grid gap-1.5", className)}>
      <button type="button" onClick={() => open(i)} aria-label={`Mărește fotografia: ${p.alt}`} className="cursor-zoom-in overflow-hidden rounded-xl border border-border bg-surface-3">
        <img loading="lazy" src={asset(p.src)} alt={p.alt} width={p.w} height={p.h} className={cn("h-auto w-full object-cover", imgClass)} />
      </button>
      <figcaption className="text-[13px] leading-snug text-subtle">{caption}</figcaption>
    </figure>
  );
}

const LABS: { where: string; title: string; body: string; link?: { hash: string; label: string } }[] = [
  { where: "Ecosisteme costiere și deltaice", title: "Monitorizarea și analiza ecosistemelor costiere și deltaice", body: "Un modul mobil și un modul de analiză a probelor, pentru starea ecosistemelor din apele marine, de pe litoral și din zonele umede deltaice și fluviale." },
  { where: "3 laboratoare", title: "Prelevare, precondiționare și izolare a probelor", body: "Câte un laborator pentru zonele costiere și deltaice, pentru ecosistemele acvatice fluviale și pentru ecosistemele montane. Echipamentele sunt similare în toate stațiunile." },
  { where: "Brăila", title: "Genetică pentru studii ecologice în zone umede", body: "Secvențiere ADN, MALDI-TOF și microscopie de fluorescență pentru identificarea organismelor din probele de teren.", link: { hash: "genetica", label: "Echipamentele" } },
  { where: "Brăila · lunca Dunării", title: "Analiză ecologică complexă a zonelor umede inundabile", body: "Patru module: telemetrie și teledetecție mobilă, procese ecologice și experimentare, monitorizarea ecosistemelor terestre, identificarea și monitorizarea biodiversității la nivel de specie." },
  { where: "Orșova · ecosisteme fluviale", title: "Date geomatice și probe pentru ecosisteme acvatice fluviale", body: "Șase module: eroziune areală, procesare primară și modelare spațială, teledetecție, batimetrie, scanare geochimică XRF și un autolaborator pentru prelevarea probelor." },
  { where: "Sinaia", title: "Centrul de date pentru volume mari de date (HPC)", body: "Cloud privat al universității, cu laboratoare virtuale conectate la LifeWatch, ICOS și eLTER.", link: { hash: "centru-date", label: "Configurația" } },
  { where: "Rețea națională · 20 de stații", title: "Stații climatice distribuite", body: "Monitorizează parametrii atmosferici pentru cercetări de microclimat, riscuri meteorologice și adaptarea la schimbările climatice.", link: { hash: "retea-teren", label: "Lista stațiilor" } },
  { where: "Rețea națională · 5 stații", title: "Stații complexe pentru fluxuri ecologice in situ", body: "Măsoară fluxurile de gaze cu efect de seră dintre suprafața terestră și atmosferă, ca să detecteze schimbările sistematice ale fluxurilor regionale." },
  { where: "Rețea națională", title: "Laboratorul mobil de cercetare socială", body: "Adună rapid datele sociale necesare pentru a cartografia efectele presiunilor umane asupra sistemelor socio-ecologice." },
];

const DATA_CENTRE: [string, string][] = [
  ["Cloud privat pentru cercetare", "6 noduri HCI, extensibile la 64 · 2 procesoare Intel Xeon de 2,9 GHz și 32 de nuclee pe nod · 1,5 TB RAM pe nod · 2 plăci NVIDIA Tesla T4 de 16 GB pe nod · 8 TFLOPS în simplă precizie, 60 TFLOPS în precizie mixtă"],
  ["Stivă HCI de uz general", "6 noduri, extensibile la 64 · 2 procesoare Intel Xeon de 2,9 GHz și 32 de nuclee pe nod · 1,1 TB RAM pe nod"],
  ["Stocare structurată (SAN)", "All-flash NVMe, 38 TB instalați, 120.000 IOPS, compresie și deduplicare · extensibilă până la 2,82 PB"],
  ["Stocare nestructurată (NAS)", "4 noduri scale-out, 160 TB instalați · extensibilă până la 8 PB"],
  ["Backup", "Sistem de backup și restaurare cu deduplicare, 90 TB instalați"],
  ["Rețea", "Conexiuni de 10 Gb/s între noduri și sistemele de stocare"],
];

const GENETICS: [string, string][] = [
  ["Biologie moleculară", "Secvențiator ADN Illumina MiniSeq · termociclor PCR SensoQuest Labcycler · hotă PCR Aura Mini · spectrofotometru pentru acizi nucleici Thermo Scientific NanoDrop One · electroforeză orizontală și verticală · transiluminator UV/VIS · sistem Western Blot"],
  ["Microbiologie", "MALDI-TOF Bruker Biotyper Sirius · incubator cu CO₂ Memmert ICO50 · incubator cu agitare Jeio Tech IST-3075R · incubator iluminat Biobase · sistem de anaerobioză PetriSphere · autoclav VWR · nefelometru Biosan DEN-1B"],
  ["Analize și microscopie", "Microscop de fluorescență Nikon Eclipse Ci-L plus · spectrofotometru pentru plăci Agilent Cytation 1 · spectrofotometru UV-VIS SAFAS UV mc1 · rotavapor LabTech EV400 · nișă chimică"],
];

const NET_COUNTS: [string, string][] = [
  ["20", "stații climatice automate"],
  ["5", "stații de flux eddy covariance, dintre care trei înregistrate ca stații ICOS"],
  ["10", "radiometre UV CUV5"],
  ["5", "radiometre solare RaZON+"],
  ["5", "sonde cu neutroni cosmici pentru umiditatea solului"],
  ["1", "geamandură în largul Sfântului Gheorghe"],
];

const btnLink = "inline-flex w-fit items-center gap-1 text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent";

function FieldNetwork({ open }: { open: (i: number) => void }) {
  const points = useMemo(() => NETWORK_POINTS(), []);
  const [net, setNet] = useState<NetCode | "all">("all");
  const rows = useMemo(
    () =>
      points
        .filter((p) => net === "all" || p.ltser!.nets.includes(net))
        .sort((a, b) => (a.cat === b.cat ? 0 : a.cat === "meteo" ? -1 : 1) || a.ltser!.code.localeCompare(b.ltser!.code)),
    [points, net],
  );
  const dimmed = net === "all" ? [] : points.filter((p) => !p.ltser!.nets.includes(net)).map((p) => p.key);
  const seg = "h-8 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-semibold text-navy transition-colors hover:bg-surface-2 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white dark:text-foreground dark:aria-pressed:border-lime dark:aria-pressed:bg-lime dark:aria-pressed:text-navy";
  return (
    <>
      <dl className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {NET_COUNTS.map(([n, l]) => (
          <div key={l} className="flex flex-col-reverse justify-end gap-1 rounded-xl border border-border bg-surface px-4 py-3">
            <dt className="text-[13px] leading-snug text-muted">{l}</dt>
            <dd className="font-display text-[30px] leading-none font-extrabold text-navy dark:text-foreground">{n}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap gap-1.5" role="group" aria-label="Filtrează după instrument">
        <button type="button" aria-pressed={net === "all"} onClick={() => setNet("all")} className={seg}>
          Toate
        </button>
        {(Object.keys(NETS) as NetCode[]).map((k) => (
          <button key={k} type="button" aria-pressed={net === k} onClick={() => setNet(k)} className={seg} title={NETS[k].d}>
            {NETS[k].t}
          </button>
        ))}
      </div>
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <LwMap points={points} dimmedKeys={dimmed} boundaries={false} fit="points" maxFitZoom={8} zoomSnap={0.25} popups label="Harta rețelei de stații din teren" className="h-[360px] rounded-xl border border-border lg:sticky lg:top-[130px] lg:h-[520px]" />
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] border-collapse text-[14px]">
            <thead>
              <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
                <th className="border-b border-border px-3 py-2.5 font-semibold">Stația</th>
                <th className="border-b border-border px-3 py-2.5 font-semibold">Localitate</th>
                <th className="border-b border-border px-3 py-2.5 font-semibold">Instrumente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const l = p.ltser!;
                const sub = placeText(p).split(", ").slice(1).join(", ");
                return (
                  <tr key={p.key} className="align-top">
                    <td className="border-b border-border px-3 py-2">
                      <Link to={sheetKey(p)} className="font-bold text-navy hover:text-accent hover:underline dark:text-foreground">
                        {l.code}
                      </Link>
                      <div className="text-[12.5px] text-subtle">{CAT[p.cat].one}</div>
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      {l.place || "–"}
                      {sub ? <div className="text-[12.5px] text-subtle">{sub}</div> : null}
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {l.nets.map((n) => (
                          <span key={n} title={NETS[n].d} className="inline-flex min-h-[26px] items-center rounded-md bg-surface-2 px-2 text-[12.5px] text-navy dark:text-foreground">
                            {NETS[n].t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 max-w-[90ch] text-[13px] text-subtle">Codurile sunt cele din LTSER Explorer, unde primele două litere arată județul. Localitățile sunt stabilite după coordonate, cu OpenStreetMap. Treceți cu mouse-ul peste o stație ca să-i vedeți numele și apăsați pe ea ca s-o deschideți.</p>
      <p className="mt-1.5 max-w-[90ch] text-[13px] text-subtle">Descrierea proiectului mai menționează 10 fenocamere pentru dinamica vegetației, precum și microfoane și camere pentru monitorizarea biodiversității.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fig i={2} open={open} caption="Turnul de flux de la Enisala" imgClass="aspect-[4/3]" />
        <Fig i={3} open={open} caption="Instalarea unui turn de măsurare" imgClass="aspect-[4/3]" />
        <Fig i={0} open={open} caption="Enisala, vedere aeriană" imgClass="aspect-[4/3]" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button asChild variant="outline" size="site-sm">
          <Link to="" hash="harta">Harta zonelor</Link>
        </Button>
        <Button asChild variant="outline" size="site-sm">
          <Link to="situri" hash="icos">Stațiile de flux</Link>
        </Button>
        <Button asChild variant="dark" size="site-sm">
          <a href={LTSER_URL} target="_blank" rel="noreferrer">
            LTSER Explorer <ArrowUpRight />
          </a>
        </Button>
      </div>
    </>
  );
}

function FeatureGrid({ items, className }: { items: { kicker?: string; title: string; body: string }[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((x) => (
        <Card key={x.title}>
          <CardBody>
            {x.kicker ? <p className="text-[12px] font-semibold tracking-[0.08em] text-accent uppercase">{x.kicker}</p> : null}
            <CardTitle>{x.title}</CardTitle>
            <CardText>{x.body}</CardText>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default function InfrastructurePage() {
  const box = useLightbox(PHOTOS);
  const open = box.open;
  return (
    <>
      <section className="bg-navy text-white">
        <Container className="grid items-center gap-8 pt-10 pb-11 sm:pt-14 sm:pb-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
          <div className="grid gap-3">
            <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">Proiectul LifeWatch România</p>
            <h1 className="font-display text-[32px] leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-[42px] xl:text-[50px]">O infrastructură distribuită pentru ecosisteme și biodiversitate</h1>
            <p className="max-w-[78ch] text-[16px] leading-[1.65] text-[#CFDCE2] sm:text-[17px]">Proiectul „Întărirea capacității de cercetare ecosistemică și biodiversitate a Universității din București prin e-știință și tehnologie” a construit laboratoare noi în patru stațiuni, o rețea de stații de observare în teren și un centru de date conectat la LifeWatch ERIC, eLTER și ICOS.</p>
            <p className="text-[14px] text-[#A9BCC5]">Cod POC/448/1/1/126867 · Programul Operațional Competitivitate 2014–2020, Axa 1, Acțiunea 1.1.1</p>
            <div className="mt-2 flex flex-wrap gap-2.5">
              <Button asChild variant="lime" size="site">
                <a href="https://map.lifewatch.ro/" target="_blank" rel="noreferrer">
                  Geoportalul LifeWatch <ArrowUpRight />
                </a>
              </Button>
              <Button asChild size="site" className="border border-[#4E6B7C] bg-transparent text-white hover:bg-navy-2">
                <a href="#laboratoare">Laboratoarele</a>
              </Button>
            </div>
          </div>
          <figure className="m-0 grid gap-1.5">
            <button type="button" onClick={() => open(0)} aria-label={`Mărește fotografia: ${PHOTOS[0].alt}`} className="cursor-zoom-in overflow-hidden rounded-xl border border-[#2C5A6E]">
              <img src={asset(PHOTOS[0].src)} alt="Stația de flux ICOS de la Enisala, în zona umedă a Deltei Dunării, vedere aeriană" width={PHOTOS[0].w} height={PHOTOS[0].h} className="aspect-[16/10] w-full object-cover" />
            </button>
            <figcaption className="text-[13px] text-[#A9BCC5]">Stația de flux de la Enisala, Delta Dunării</figcaption>
          </figure>
        </Container>
      </section>
      <SubNav
        label="Secțiunile paginii"
        items={[
          { label: "Proiectul", hash: "proiect" },
          { label: "Laboratoare", hash: "laboratoare" },
          { label: "Rețeaua din teren", hash: "retea-teren" },
          { label: "Centrul de date", hash: "centru-date" },
          { label: "Laboratorul de genetică", hash: "genetica" },
          { label: "Platforma", hash: "platforma" },
          { label: "LTSER Explorer", hash: "ltser-explorer" },
          { label: "Servicii de date", hash: "servicii" },
          { label: "Proiecte", hash: "proiecte" },
          { label: "Acces", to: "acces" },
        ]}
      />
      {box.node}

      <Band id="proiect">
        <Container>
          <SectionHeader eyebrow="Proiectul" title="De ce o infrastructură de cercetare pentru natură" lede="Proiectul modernizează infrastructura de cercetare a Universității din București pentru studiul ecosistemelor și al biodiversității și o aliniază la LifeWatch ERIC. Pe aceleași situri funcționează și componente eLTER și ICOS, iar acordurile de colaborare includ ICOS ERIC și DANUBIUS-RI." />
          <FeatureGrid
            className="mt-7"
            items={[
              { kicker: "Cunoaștere", title: "Biodiversitate, capital natural și metabolism socio-industrial", body: "Înțelegerea legăturilor complexe și dinamice dintre biodiversitate, capitalul natural și metabolismul social și industrial." },
              { kicker: "Scenarii", title: "Scenarii de dezvoltare durabilă", body: "Modele care estimează cum răspund sistemele ecologice la presiuni externe, la scări spațiale și temporale diferite." },
              { kicker: "Politici", title: "Strategii și politici bazate pe cercetare", body: "Cunoaștere produsă împreună cu actorii interesați, care ajunge la decidenți sub formă de date, instrumente și recomandări." },
            ]}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="grid content-start gap-3">
              <h3 className="font-display text-[22px] font-bold">Co-localizarea infrastructurilor</h3>
              <p className="text-[15.5px] leading-[1.7] text-muted">În lunca Dunării, laboratoarele sunt organizate în zone de cercetare intensivă care răspund simultan cerințelor LifeWatch, ICOS, DANUBIUS și LTER. Aceleași parcele sunt monitorizate pentru biodiversitate, fluxuri de gaze, hidrologie și indicatori sociali, astfel încât datele pot fi puse împreună.</p>
              <p className="text-[15.5px] leading-[1.7] text-muted">Abordarea pornește de la ecologia sistemică și de la studiul complexității ecologice. Modelele asimilează date din cercetarea disciplinară și estimează proprietățile componentelor mai puțin studiate ale sistemelor.</p>
            </div>
            <div className="grid content-start gap-3 rounded-xl border border-border bg-ground p-5 sm:p-6">
              <h3 className="font-display text-[22px] font-bold">Finanțare</h3>
              <p className="text-[15px] leading-[1.65] text-muted">Proiect cofinanțat din Fondul European de Dezvoltare Regională prin Programul Operațional Competitivitate 2014–2020, Axa prioritară 1 „Cercetare, dezvoltare tehnologică și inovare în sprijinul competitivității economice și dezvoltării afacerilor”, Acțiunea 1.1.1 „Proiecte de infrastructură de cercetare pentru instituții publice de CD și universități”.</p>
              <p className="text-[15px]">
                <b>Cod proiect</b> POC/448/1/1/126867
              </p>
              <span className="w-fit rounded-lg bg-white p-2">
                <img src={asset(LOGOS.funding.src)} alt={LOGOS.funding.alt} width={LOGOS.funding.w} height={LOGOS.funding.h} className="h-auto w-full max-w-[420px]" />
              </span>
            </div>
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="laboratoare">
        <Container>
          <SectionHeader eyebrow="Laboratoare" title="11 laboratoare, legate printr-un singur centru de date" lede="Proiectul a înființat 9 laboratoare noi și a modernizat alte 2. Toate trimit datele către centrul de date de la Sinaia, unde sunt integrate, analizate și modelate." />
          <Fig i={1} open={open} caption="Structura infrastructurii de cercetare. Apăsați pe imagine ca s-o măriți." className="mt-7 max-w-[1100px]" imgClass="bg-white" />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {LABS.map((l) => (
              <Card key={l.title}>
                <CardBody>
                  <Tag className="w-fit">{l.where}</Tag>
                  <CardTitle>{l.title}</CardTitle>
                  <CardText>{l.body}</CardText>
                  {l.link ? (
                    <a href={`#${l.link.hash}`} className={cn(btnLink, "mt-auto")}>
                      {l.link.label} →
                    </a>
                  ) : null}
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </Band>

      <Band id="retea-teren">
        <Container>
          <SectionHeader eyebrow="Rețeaua din teren" title="Stații de observare distribuite" lede="Senzorii din teren transmit continuu date despre atmosferă, sol, vegetație și biodiversitate. Inventarul de mai jos urmează LTSER Explorer, portalul în care se văd măsurătorile fiecărei stații." />
          <FieldNetwork open={open} />
        </Container>
      </Band>

      <Band tone="ground" id="centru-date">
        <Container>
          <SectionHeader eyebrow="Sinaia" title="Centrul de date: integrare, analiză și modelare" lede="Centrul de date de la Stațiunea Zoologică Sinaia stochează datele venite de la laboratoarele mobile și de la siturile de observare și rulează modelele și sintezele. Funcționează ca un cloud privat al universității, cu laboratoare virtuale conectate la LifeWatch ERIC." />
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[520px] border-collapse text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
                    <th className="border-b border-border px-3.5 py-2.5 font-semibold">Componentă</th>
                    <th className="border-b border-border px-3.5 py-2.5 font-semibold">Configurație</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_CENTRE.map(([k, v]) => (
                    <tr key={k} className="align-top">
                      <td className="border-b border-border px-3.5 py-2.5 font-semibold whitespace-nowrap last:border-b-0">{k}</td>
                      <td className="border-b border-border px-3.5 py-2.5 leading-[1.55] text-muted">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Fig i={4} open={open} caption="Rack-urile de la Sinaia" imgClass="aspect-[4/3]" />
              <Fig i={5} open={open} caption="Arhitectura centrului de date" imgClass="bg-white" />
            </div>
          </div>
        </Container>
      </Band>

      <Band id="genetica">
        <Container>
          <SectionHeader eyebrow="Brăila" title="Laboratorul de genetică pentru studii ecosistemice" lede="Laboratorul prelucrează probele din zonele umede ale luncii Dunării, de la izolare și cultivare până la secvențierea ADN și identificarea microorganismelor." />
          <div className="mt-7 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[6, 7, 8, 9].map((i) => (
              <button key={i} type="button" onClick={() => open(i)} aria-label={`Mărește fotografia: ${PHOTOS[i].alt}`} className="aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg bg-surface-3">
                <img loading="lazy" src={asset(PHOTOS[i].src)} alt={PHOTOS[i].alt} className="size-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {GENETICS.map(([k, v]) => (
              <Card key={k}>
                <CardBody>
                  <CardTitle>{k}</CardTitle>
                  <CardText>{v}</CardText>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </Band>

      <Band tone="dark" id="platforma">
        <Container>
          <SectionHeader eyebrow="Platforma web" title={<span className="text-white">Platforma interactivă LifeWatch România</span>} lede={<span className="text-[#CFDCE2]">Arhitectura tehnică urmează modelul propus de Agenția Spațială Europeană în inițiativa „EO Exploitation Platforms Common Architecture”.</span>} />
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Interfețe prietenoase", "Produse accesibile prin interfețe grafice ușor de folosit și fluxuri de lucru intuitive."],
              ["Vizualizări puternice", "Metode de vizualizare potrivite pentru volume mari de date multitemporale."],
              ["Arhitectură modernă", "Proiectată după principiile arhitecturii orientate pe servicii, cu standarde deschise."],
              ["Software liber", "Platforma este construită integral cu software liber și open source."],
              ["Interoperabilitate", "Se conectează la platforme standard, conform INSPIRE, noii Directive privind datele deschise, OGC și WMO."],
            ].map(([k, v]) => (
              <div key={k} className="grid content-start gap-2 rounded-xl border border-[#2C5A6E] bg-navy-2 p-5">
                <h3 className="font-display text-[18px] font-bold">{k}</h3>
                <p className="text-[14.5px] leading-[1.55] text-[#CFDCE2]">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Fig i={10} open={open} caption={<span className="text-[#A9BCC5]">Integrarea serviciilor de date, de la sursele europene și naționale până la utilizatori.</span>} imgClass="bg-white" />
            <Fig i={11} open={open} caption={<span className="text-[#A9BCC5]">Clustere GeoServer, EWPS și GeoPortal care se scalează automat în Kubernetes, în spatele unui proxy HAProxy.</span>} imgClass="bg-white" />
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="ltser-explorer">
        <Container>
          <SectionHeader eyebrow="Portal de date" title="LTSER Explorer, portalul cu date climatice, ecologice și sociale" lede="Portalul reunește măsurătorile stațiilor din teren, indicatorii de teledetecție și datele sociale pentru platformele LTSER din România. Se deschide în browser, fără cont." />
          <FeatureGrid
            className="mt-7"
            items={[
              { kicker: "Remote sensing", title: "Indicatori din satelit", body: "Umiditatea solului la suprafață (SSM), NDVI și FAPAR, cu hărți lunare din ianuarie 2015 până în martie 2024. Se aleg la nivel național sau pe unități administrative (LTSER, NUTS) și se descarcă în GeoTIFF sau GeoJSON." },
              { kicker: "Lifewatch networks", title: "Măsurătorile din teren", body: "Pentru stațiile climatice, temperatura și umiditatea aerului, vântul, presiunea, precipitațiile, radiația globală, temperatura și umiditatea solului, cu grafice și imagini de la cameră. Pentru stațiile de flux, valori semiorare ale fluxurilor de CO₂ și căldură, evapotranspirației și radiației nete." },
              { kicker: "Social indicators", title: "Populație și migrație", body: "Populația după domiciliu și emigranții definitivi, pe ani, sexe și grupe de vârstă, preluați din arhiva de date sociale RODA." },
            ]}
          />
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Fig i={14} open={open} caption="Fracția de radiație absorbită de vegetație (FAPAR), hartă lunară și serie de timp." />
            <div className="grid content-start gap-3 rounded-xl border border-border bg-surface p-5">
              <h3 className="font-display text-[20px] font-bold">Cum găsiți o stație</h3>
              <ol className="grid list-decimal gap-1.5 pl-5 text-[15px] leading-[1.6] text-muted">
                <li>Deschideți portalul și alegeți fila Lifewatch networks.</li>
                <li>Alegeți rețeaua dorită, de la stațiile meteo și cele de flux la radiometre, sonde cu neutroni cosmici sau geamandură.</li>
                <li>Alegeți stația după cod, de exemplu BR-Mar sau TL-Sfg.</li>
                <li>În fila Data, alegeți parametrul și intervalul, apoi comutați între grafic și cameră.</li>
              </ol>
              <p className="text-[13.5px] text-subtle">Portalul folosește HTTP, așa că browserul poate afișa un avertisment de conexiune nesigură. Interfața este în limba engleză.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="dark" size="site-sm">
                  <a href={LTSER_URL} target="_blank" rel="noreferrer">
                    Deschide LTSER Explorer <ArrowUpRight />
                  </a>
                </Button>
                <Button asChild variant="outline" size="site-sm">
                  <a href="#retea-teren">Lista stațiilor</a>
                </Button>
              </div>
              <p className="text-[13.5px] text-subtle">
                Același tip de date se vede și în{" "}
                <a href={`${import.meta.env.BASE_URL}explorator/`} className="font-semibold text-[#2f7d4f] underline dark:text-accent">
                  exploratorul acestui site
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </Band>

      <Band id="servicii">
        <Container>
          <SectionHeader eyebrow="Diseminare" title="Cum ajung datele la utilizatori" />
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[
              ["Interfețe web", ["site-ul general LifeWatch România", "catalogul de date LifeWatch România", "geoportalul cu hărți interactive", "tablouri de bord interactive", "povești pe hartă (geostories)"]],
              ["Servicii web standard", ["OGC WCS, WMS, WFS și CSW", "OGC API", "Cloud Optimised GeoTIFF (COG)", "SpatioTemporal Asset Catalog (STAC)"]],
            ].map(([k, list]) => (
              <Card key={k as string}>
                <CardBody>
                  <CardTitle>{k as string}</CardTitle>
                  <ul className="grid list-disc gap-1 pl-5 text-[15px] leading-[1.6] text-muted">
                    {(list as string[]).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Fig i={12} open={open} caption="Geoportalul LifeWatch: umiditatea solului la suprafață, cu serie de timp 2015–2023 și straturi CORINE." />
            <Fig
              i={13}
              open={open}
              caption={
                <>
                  LTSER Explorer: date socio-ecologice esențiale, cu hărți lunare și serii de timp pentru orice punct.{" "}
                  <a href="#ltser-explorer" className="font-semibold text-[#2f7d4f] underline dark:text-accent">Despre portal</a>
                </>
              }
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button asChild variant="dark" size="site-sm">
              <a href="https://map.lifewatch.ro/" target="_blank" rel="noreferrer">
                Deschide geoportalul <ArrowUpRight />
              </a>
            </Button>
            <Button asChild variant="outline" size="site-sm">
              <a href="https://lifewatch.ro/" target="_blank" rel="noreferrer">
                lifewatch.ro <ArrowUpRight />
              </a>
            </Button>
            <Button asChild variant="outline" size="site-sm">
              <Link to="situri/insulele-brailei">Exploratorul acestui site</Link>
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-subtle">Diagramele și capturile de ecran provin din prezentarea tehnică a platformei (Vasile Crăciunescu, Mihai Adamescu) și din descrierea proiectului.</p>
        </Container>
      </Band>

      <Band tone="ground" id="proiecte">
        <Container>
          <SectionHeader
            eyebrow="Proiecte"
            title="Proiecte susținute de infrastructură"
            lede="Infrastructura LifeWatch România susține proiectele europene și naționale ale Universității din București, majoritatea coordonate de RCSES. Pentru fiecare proiect arătăm unde lucrează, iar pe pagina stațiunilor găsiți proiectele fiecărei stațiuni."
          />
          <ProjectCards list={PROJECTS} className="mt-7" />
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild variant="outline" size="site-sm">
              <Link to="statiuni/braila">Proiectele de la Brăila</Link>
            </Button>
            <Button asChild variant="green" size="site-sm">
              <Link to="acces">Acces la infrastructură</Link>
            </Button>
          </div>
        </Container>
      </Band>
    </>
  );
}
