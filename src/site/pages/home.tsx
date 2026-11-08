// Home: map of the research areas, key numbers, our long-term sites, the stations, tools, how the
// infrastructure works, the European networks, ideas, news, partners, sources and access.
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ClipboardList, Database, Leaf, Link2, Thermometer, Trees, Waves, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CAT, CAT_ORDER, fmt, LW_POINTS, lwByKey, photoOf, sheetKey, STATION_SLUG, type Cat, type LwPoint } from "../content/lw";
import { explorerHref, Link } from "../router";
import { Band, Container, SectionHeader } from "../components/primitives";
import { BaseSwitch, EEA, LwMap, type BaseName } from "../components/lw-map";
import { CatShape } from "../components/lw-shapes";
import { Card, CardBody, CardImage, CardText, CardTitle, PointTags, Tag } from "../components/lw-ui";
import { LTSER_URL, asset } from "../content/lw";
import { sitePhoto } from "../content/site-photos";
import { PROJECTS as ALL_PROJECTS } from "../content/projects";

const P = LW_POINTS;
const COUNTS = P.reduce<Record<string, number>>((a, p) => ((a[p.cat] = (a[p.cat] ?? 0) + 1), a), {});
// Our long-term sites; the field-network stations from LTSER Explorer are listed on their own.
const OURS = P.filter((p) => p.ours && p.cat !== "statiune" && !p.fromLtser).sort((a, b) => (a.cat === "ltser" ? 0 : 1) - (b.cat === "ltser" ? 0 : 1));
const DEIMS = P.filter((p) => p.deims);
const STATIONS = P.filter((p) => p.cat === "statiune");
const sheet = (key: string) => sheetKey(lwByKey(key)!);

function MapHero() {
  const [hidden, setHidden] = useState<Cat[]>([]);
  const [base, setBase] = useState<BaseName>("osm");
  const [eea, setEea] = useState<string[]>([]);
  const [eeaMsg, setEeaMsg] = useState<string | null>(null);
  const toggleCat = (c: Cat) => setHidden((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]));
  const toggleEea = (k: string) => {
    setEeaMsg(null);
    setEea((e) => (e.includes(k) ? e.filter((x) => x !== k) : [...e, k]));
  };
  return (
    <section id="harta" aria-label="Harta zonelor de cercetare" className="relative scroll-mt-36 bg-[#dce8ee] dark:bg-[#0c2534]">
      <LwMap
        points={P}
        hiddenCats={hidden}
        base={base}
        eea={eea}
        padTopLeft={[420, 0]}
        label="Harta stațiunilor, platformelor LTSER, siturilor LTER și stațiilor ICOS"
        onEea={(k, ok) => setEeaMsg(ok ? null : `Stratul „${EEA[k].label}” vine de la serverele EEA și nu se poate încărca acum.`)}
        className="h-[62vh] min-h-[420px] md:h-[min(78vh,760px)] md:min-h-[540px]"
      />
      <div className="z-[500] max-h-[calc(100%-40px)] overflow-auto border-b border-border bg-surface p-5 md:absolute md:top-5 md:left-5 md:w-[380px] md:rounded-xl md:border md:shadow-[0_18px_44px_rgba(14,42,59,0.22)] lg:left-[max(20px,calc((100vw-1920px)/2+48px))]">
        <p className="text-[12.5px] font-semibold tracking-[0.1em] text-accent uppercase">LifeWatch România · Universitatea din București</p>
        <h1 className="mt-2 font-display text-[27px] leading-[1.1] font-bold tracking-[-0.01em] text-navy dark:text-foreground">Harta zonelor de cercetare</h1>
        <p className="mt-2 text-[15px] leading-[1.5] text-muted">Stațiunile noastre, platformele LTSER, siturile LTER, stațiile de flux și cele 20 de stații climatice LifeWatch, pe aceeași hartă. Alegeți un punct ca să vedeți habitatele, clima și speciile observate acolo.</p>
        <fieldset className="mt-3 grid gap-0.5">
          <legend className="sr-only">Ce se afișează pe hartă</legend>
          {CAT_ORDER.map((c) => (
            <label key={c} className="flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[14px] font-medium hover:bg-ground">
              <input type="checkbox" checked={!hidden.includes(c)} onChange={() => toggleCat(c)} className="size-[18px] accent-[#2f7d4f]" />
              <CatShape cat={c} />
              {CAT[c].label}
              <span className="tabular ml-auto text-[12px] text-subtle">{COUNTS[c] ?? 0}</span>
            </label>
          ))}
        </fieldset>
        <BaseSwitch value={base} onChange={setBase} className="mt-3" />
        <div role="group" aria-label="Straturi tematice" className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-subtle">Straturi:</span>
          {["n2k", "ecosys", "wet"].map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={eea.includes(k)}
              onClick={() => toggleEea(k)}
              className="h-8 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-semibold text-navy hover:bg-surface-2 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white dark:text-foreground dark:aria-pressed:border-lime dark:aria-pressed:bg-lime dark:aria-pressed:text-navy"
            >
              {EEA[k].short}
            </button>
          ))}
        </div>
        {eeaMsg ? <p className="mt-2 text-[12.5px] text-subtle">{eeaMsg}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button asChild variant="dark" size="site">
            <a href={explorerHref()}>Deschide exploratorul</a>
          </Button>
          <Button asChild variant="outline" size="site">
            <a href={LTSER_URL} target="_blank" rel="noreferrer">
              LTSER Explorer <ArrowUpRight />
            </a>
          </Button>
          <Button asChild variant="green" size="site">
            <Link to="acces">Acces</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const obs = OURS.reduce((a, p) => a + (p.inat?.obs ?? 0), 0);
  const stats: [number, string][] = [
    [STATIONS.length, "stațiuni de cercetare ale Universității din București"],
    [11, "laboratoare noi sau modernizate"],
    [COUNTS.meteo ?? 0, "stații climatice automate"],
    [COUNTS.icos ?? 0, "stații de flux eddy covariance"],
    [DEIMS.length, "situri românești în registrul DEIMS-SDR"],
    [obs, "observații iNaturalist în siturile noastre"],
  ];
  return (
    <section aria-label="Cifre cheie" className="bg-ground">
      <Container className="grid grid-cols-2 gap-5 py-8 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(([n, label]) => (
          <div key={label}>
            <b className="block font-display text-[32px] leading-[1.1] font-extrabold text-navy sm:text-[40px] dark:text-foreground">{fmt(n)}</b>
            <span className="text-[14px] text-muted">{label}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}

export function SiteCard({ p, abstract }: { p: LwPoint; abstract?: boolean }) {
  const facts = [p.established ? `Din ${p.established}` : null, p.area_ha ? `${fmt(p.area_ha)} ha` : null, p.inat?.species ? `${fmt(p.inat.species)} specii pe iNaturalist` : null].filter(Boolean).join(" · ");
  return (
    <Card>
      <CardImage image={photoOf(p)} name={p.ro} />
      <CardBody>
        <PointTags p={p} />
        <CardTitle>{p.ro}</CardTitle>
        {abstract ? <p className="text-[13px] text-subtle">{p.fullName}</p> : null}
        {abstract && p.abstract ? <CardText>{p.abstract.length > 220 ? `${p.abstract.slice(0, 220)}…` : p.abstract}</CardText> : facts ? <CardText>{facts}</CardText> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button asChild variant="dark" size="site-sm">
            <Link to={sheetKey(p)}>Fișa sitului</Link>
          </Button>
          {p.deims ? (
            <Button asChild variant="outline" size="site-sm">
              <a href={p.deims} target="_blank" rel="noreferrer">
                DEIMS <ArrowUpRight />
              </a>
            </Button>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

export function StationCard({ p }: { p: LwPoint }) {
  return (
    <Link to={`statiuni/${STATION_SLUG[p.id]}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent">
      <CardImage image={photoOf(p)} name={p.short ?? p.ro} />
      <CardBody>
        <span className="text-[13px] font-bold text-[#2f7d4f] dark:text-accent">
          Din {p.founded} · {p.setting}
        </span>
        <CardTitle>{p.short}</CardTitle>
        <CardText>{p.role}</CardText>
        <span className="mt-auto inline-flex items-center gap-1 text-[14px] font-semibold text-[#2f7d4f] dark:text-accent">
          Detalii <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </span>
      </CardBody>
    </Link>
  );
}

type Status = "live" | "hub" | "plan";
const STATUS: Record<Status, [string, string]> = {
  live: ["Disponibil aici", "bg-[#E2F2E7] text-[#1F5A37] dark:bg-accent-soft dark:text-accent"],
  hub: ["Pe Hub", "bg-[#E3EEF4] text-[#164E66] dark:bg-[#1f6e8c]/25 dark:text-[#8fc1d6]"],
  plan: ["Planificat", "bg-[#F6EBDD] text-[#7A4508] dark:bg-warning-soft dark:text-warning"],
};
const TOOLS: { icon: LucideIcon; title: string; body: string; status: Status; to?: string; hash?: string; href?: string; cta: string }[] = [
  { icon: Trees, title: "Exploratorul de habitate", body: "Habitate EUNIS din DEIMS, situri Natura 2000 care se suprapun și straturile EEA de ecosisteme, CORINE, apă și umiditate, zone ripariene.", status: "live", to: sheet("s-d4854af8"), cta: "Deschide pentru Insulele Brăilei" },
  { icon: Thermometer, title: "Tablou climatic", body: "Climatologie DEIMS 1991–2020 comparată cu NASA POWER, plus temperaturi minime, maxime și radiație solară.", status: "live", to: sheet("s-sinaia"), cta: "Deschide pentru Sinaia" },
  { icon: Leaf, title: "Biodiversitate iNaturalist", body: "Specii observate, grupuri taxonomice, statut de conservare și observații recente, în limitele fiecărui sit.", status: "live", to: sheet("s-cdf8ba96"), cta: "Deschide pentru Delta Dunării" },
  { icon: Database, title: "Ocurențe GBIF", body: "Numărul de înregistrări din GBIF pentru fiecare sit, cu legătură directă la căutarea pe hartă.", status: "live", to: sheet("s-a6af4965"), cta: "Deschide pentru Neajlov" },
  { icon: Waves, title: "Stații de flux ICOS", body: "Ce măsoară stațiile de la Brăila, Comana și Enisala și unde se găsesc datele în ICOS Carbon Portal.", status: "live", to: "situri", hash: "icos", cta: "Vezi stațiile" },
  { icon: Link2, title: "Fișe DEIMS și API", body: "Metadate eLTER pentru fiecare sit, cu exemple de cereri API pentru DEIMS, iNaturalist, GBIF și NASA POWER.", status: "live", to: sheet("s-383aab7b"), cta: "Deschide pentru ICOS Brăila" },
  { icon: Thermometer, title: "Climate Dashboard ANM", body: "Date observaționale și scenarii climatice pe grila bazinului Dunării, dezvoltate cu Administrația Națională de Meteorologie.", status: "hub", href: "https://carmine.geo.meteoromania.ro/restore4life-dss/", cta: "Deschide pe Hub" },
  { icon: Database, title: "Catalogul de date Restore4Life", body: "Catalog GeoNetwork și servicii WMS pentru siturile pilot din bazinul Dunării.", status: "hub", href: "https://r4l-data.unibuc.ro/catalog/srv/dut/catalog.search", cta: "Deschide catalogul" },
  { icon: Leaf, title: "eBird, MINKA și CrowdWater", body: "Știință cetățenească pentru păsări, biodiversitate și hidrologie, integrate în tablourile de sit ale Hub-ului.", status: "hub", href: "https://wetlandrestorationhub.eu/", cta: "Deschide Hub-ul" },
  { icon: ClipboardList, title: "Raportare pentru Planul Național de Restaurare", body: "Fișe automate pe sit, cu corespondențe EUNIS și Anexa I spre grupurile de habitate din Regulamentul de restaurare a naturii.", status: "plan", to: "", hash: "idei", cta: "Vezi ideea" },
];

function ToolCard({ t }: { t: (typeof TOOLS)[number] }) {
  const cls = "group flex flex-col rounded-xl border border-border bg-surface transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent";
  const body = (
    <CardBody>
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-[10px] bg-surface-2 text-[#2f7d4f] dark:text-accent">
          <t.icon className="size-[22px]" strokeWidth={1.8} />
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-[12px] font-bold", STATUS[t.status][1])}>{STATUS[t.status][0]}</span>
      </div>
      <CardTitle>{t.title}</CardTitle>
      <CardText>{t.body}</CardText>
      <span className="mt-auto text-[14px] font-semibold text-[#2f7d4f] dark:text-accent">
        {t.cta} {t.href ? "↗" : "→"}
      </span>
    </CardBody>
  );
  return t.href ? (
    <a href={t.href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link to={t.to ?? ""} hash={t.hash} className={cls}>
      {body}
    </Link>
  );
}

const ARCH = [
  { step: "01 · Teren", title: "Laboratoare și stații", body: "11 laboratoare, 20 de stații climatice, 5 stații de flux, radiometre UV și solare, sonde cu neutroni cosmici, o geamandură și fenocamere." },
  { step: "02 · Centrul de date", title: "Sinaia", body: "Cloud privat cu GPU-uri, stocare NVMe extensibilă la petabytes și laboratoare virtuale conectate la LifeWatch ERIC." },
  { step: "03 · Servicii standard", title: "OGC, COG, STAC", body: "Servicii WMS, WFS, WCS și CSW, OGC API, Cloud Optimised GeoTIFF și catalog STAC, interoperabile cu INSPIRE." },
];

/** Project photos on the home page, each leading to its section of the infrastructure page. */
const IN_PICTURES = [
  { photo: sitePhoto("9dcd0bec"), caption: "Stația de flux de la Enisala", hash: "retea-teren" },
  { photo: sitePhoto("fab11817"), caption: "Genetică, Brăila", hash: "genetica" },
  { photo: sitePhoto("d6f67b83"), caption: "Centrul de date, Sinaia", hash: "centru-date" },
  { photo: sitePhoto("09c06e7d"), caption: "Rețeaua din teren", hash: "retea-teren" },
  { photo: sitePhoto("a44b1326"), caption: "Geoportalul", hash: "servicii" },
];

const IDEAS: [string, string][] = [
  ["Fluxuri ICOS în timp real", "Grafice zilnice de CO₂, metan, evapotranspirație și energie pentru cele cinci stații de flux, citite direct din centrul de date de la Sinaia."],
  ["Fișă NRR pentru fiecare sit", "Raport generat automat cu habitatele Anexei I, presiunile și măsurile potrivite, gata de folosit în Planul Național de Restaurare."],
  ["Actualizare automată nocturnă", "Un flux GitHub Actions reface instantaneul din DEIMS, iNaturalist, GBIF și NASA POWER în fiecare noapte."],
  ["BioBlitz LifeWatch România", "Câte un proiect iNaturalist pentru fiecare stațiune, cu întâlniri anuale de inventariere împreună cu studenții și comunitățile locale."],
  ["Fenocamere și senzori live", "Imagini zilnice de vegetație și citiri de la stațiile meteo, afișate direct pe fișa fiecărei stațiuni."],
  ["Calendar de acces transnațional", "Rezervarea locurilor de cazare, a navelor și a laboratoarelor, legată de apelurile eLTER pentru acces la situri."],
  ["Dunărea, de la Orșova la Sfântu Gheorghe", "O poveste pe hartă care urmărește fluviul prin cele patru zone ale noastre, cu date, fotografii și rezultate de cercetare."],
  ["Variabile esențiale de biodiversitate", "Indicatori EBV calculați pe sit din iNaturalist, GBIF și teledetecție, comparabili cu restul rețelei eLTER."],
  ["Catalog de seturi de date cu DOI", "Publicarea seturilor de date ale stațiunilor în Zenodo sau B2SHARE, cu metadate preluate automat din DEIMS."],
];

const NEWS = [
  { meta: "16 februarie 2024 · eLTER", title: "eLTER despre platformele eLT(S)ER-România și LifeWatch-România", body: "Articolul eLTER prezintă consolidarea stațiunilor Universității din București de la Orșova, Brăila, Sfântu Gheorghe și Sinaia.", href: "https://elter-ri.eu/news/breaking-new-ground-university-bucharests-eltser-romania-and-lifewatch-romania-platforms-project", cta: "Citește pe elter-ri.eu" },
  { meta: "Septembrie 2026 · DEIMS-SDR", title: "Trei stații de flux ICOS, înregistrate în DEIMS", body: "Stațiile de la Brăila, Comana și Enisala, operate de RCSES, au acum fișe proprii în registrul european al siturilor.", to: "situri", hash: "icos", cta: "Vezi stațiile ICOS" },
  { meta: "Universitatea din București", title: "LifeWatch România, conferința de final a proiectului", body: "Proiectul de infrastructură s-a încheiat, iar stațiunile și centrul de date intră în etapa de operare.", href: "https://unibuc.ro/lifewatch-romania-infrastructura-pentru-cercetare-un-proiect-incheiat-un-nou-inceput-conferinta-de-final-la-universitatea-din-bucuresti/", cta: "Citește pe unibuc.ro" },
];

const PARTNERS = [
  { name: "LifeWatch ERIC", body: "Infrastructură de e-Știință pentru cercetarea biodiversității și a ecosistemelor.", href: "https://www.lifewatch.eu/" },
  { name: "eLTER RI", body: "Cercetare ecologică pe termen lung în situri și platforme socio-ecologice.", href: "https://elter-ri.eu/" },
  { name: "ICOS", body: "Observarea gazelor cu efect de seră și a fluxurilor de carbon.", href: "https://www.icos-cp.eu/" },
  { name: "DANUBIUS-RI", body: "Cercetarea sistemelor fluviu–mare, de la bazin la coastă.", href: "https://www.danubius-ri.eu/" },
];
const PROJECTS: { name: string; href?: string }[] = [
  { name: "Wetland Restoration Hub", href: "https://wetlandrestorationhub.eu/" },
  ...ALL_PROJECTS.filter((p) => p.name !== "LifeWatch România" && p.name !== "eLTER").map((p) => ({ name: p.name, href: /^https?:/.test(p.url) ? p.url : undefined })),
];

function Grid({ cols, children, className }: { cols: 2 | 3 | 4; children: ReactNode; className?: string }) {
  return <div className={cn("mt-8 grid gap-5 sm:gap-6", cols === 3 && "md:grid-cols-2 xl:grid-cols-3", cols === 4 && "sm:grid-cols-2 xl:grid-cols-4", cols === 2 && "lg:grid-cols-2", className)}>{children}</div>;
}

export default function HomePage() {
  const icos = useMemo(() => P.filter((p) => p.cat === "icos" || p.cat === "icos-cat"), []);
  const lterCount = P.filter((p) => p.cat === "ltser" || p.cat === "lter").length;
  return (
    <>
      <MapHero />
      <Stats />

      <Band id="noastre">
        <Container>
          <SectionHeader eyebrow="Cercetare ecologică pe termen lung" title="Siturile noastre de cercetare pe termen lung" lede="Platformele LTSER și stațiile de flux operate de echipele Universității din București. Fiecare are o fișă în registrul european DEIMS-SDR și o fișă de date pe acest site." />
          <Grid cols={4}>
            {OURS.map((p) => (
              <SiteCard key={p.key} p={p} />
            ))}
          </Grid>
          <div className="mt-7">
            <Button asChild variant="outline" size="site">
              <Link to="situri" hash="retea">Toată rețeaua LTER România</Link>
            </Button>
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="statiuni-preview">
        <Container>
          <SectionHeader eyebrow="Infrastructura din teren" title="Patru stațiuni, de la Bucegi la Marea Neagră" lede="Stațiunile Universității din București adună peste un secol de observații. Prin proiectul LifeWatch România au primit laboratoare noi, iar Sinaia găzduiește centrul de date al infrastructurii." />
          <Grid cols={4}>
            {STATIONS.map((p) => (
              <StationCard key={p.key} p={p} />
            ))}
          </Grid>
        </Container>
      </Band>

      <Band id="instrumente">
        <Container>
          <SectionHeader eyebrow="Date și instrumente" title="Instrumentele Wetland Restoration Hub, aduse pentru România" lede="Fișele siturilor folosesc aceleași surse ca Wetland Restoration Hub, aplicate fiecărui sit din România. Instrumentele marcate „Pe Hub” se deschid în platforma Restore4Life." />
          <Grid cols={4}>
            {TOOLS.map((t) => (
              <ToolCard key={t.title} t={t} />
            ))}
          </Grid>
        </Container>
      </Band>

      <Band tone="ground" id="in-imagini">
        <Container>
          <SectionHeader
            eyebrow="Proiectul LifeWatch România"
            title="Infrastructura, în imagini"
            lede="11 laboratoare, 20 de stații de observare în teren și un centru de date, construite cu fonduri europene în stațiunile Universității din București."
            aside={
              <Button asChild variant="outline" size="site">
                <Link to="infrastructura">Proiectul și infrastructura</Link>
              </Button>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            {IN_PICTURES.map((x, i) => (
              <Link key={x.caption} to="infrastructura" hash={x.hash} className={cn("group grid content-start gap-2", i === 0 && "col-span-2 md:col-span-1")}>
                <span className="block overflow-hidden rounded-xl border border-border bg-surface-3">
                  <img loading="lazy" src={asset(x.photo.src)} alt={x.photo.alt} width={x.photo.w} height={x.photo.h} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                </span>
                <span className="text-[14px] font-semibold text-navy group-hover:text-accent dark:text-foreground">{x.caption}</span>
              </Link>
            ))}
          </div>
        </Container>
      </Band>

      <Band tone="dark" id="arhitectura">
        <Container>
          <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">Cum funcționează</p>
          <h2 className="mt-2 font-display text-[26px] leading-[1.15] font-bold sm:text-[32px] lg:text-[36px]">De la senzorul din teren la fișa de date</h2>
          <p className="mt-2 max-w-[780px] text-[15.5px] leading-[1.65] text-[#CFDCE2] sm:text-[17px]">Platforma urmează arhitectura comună propusă de ESA pentru platformele de exploatare a datelor de observare a Pământului și este construită integral cu software liber.</p>
          <Grid cols={4}>
            {ARCH.map((a) => (
              <div key={a.step} className="grid content-start gap-2.5 rounded-xl border border-[#2C5A6E] bg-navy-2 p-[22px]">
                <span className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">{a.step}</span>
                <h3 className="font-display text-[20px] font-bold">{a.title}</h3>
                <p className="text-[15px] leading-[1.55] text-[#CFDCE2]">{a.body}</p>
              </div>
            ))}
            <a href={explorerHref()} className="grid content-start gap-2.5 rounded-xl bg-lime p-[22px] text-navy transition-colors hover:bg-[#cdee98]">
              <span className="text-[12.5px] font-semibold tracking-[0.1em] uppercase">04 · Utilizatori</span>
              <h3 className="font-display text-[20px] font-bold">Geoportal și explorator</h3>
              <p className="text-[15px] leading-[1.55]">Geoportalul, LTSER Explorer cu măsurătorile stațiilor și fișe de sit cu habitate, climă și biodiversitate.</p>
            </a>
          </Grid>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild variant="lime" size="site-sm">
              <Link to="infrastructura" hash="platforma">Arhitectura platformei</Link>
            </Button>
            <Button asChild size="site-sm" className="border border-[#4E6B7C] bg-transparent text-white hover:bg-navy-2">
              <a href="https://map.lifewatch.ro/" target="_blank" rel="noreferrer">
                Geoportalul <ArrowUpRight />
              </a>
            </Button>
            <Button asChild size="site-sm" className="border border-[#4E6B7C] bg-transparent text-white hover:bg-navy-2">
              <a href={LTSER_URL} target="_blank" rel="noreferrer">
                LTSER Explorer <ArrowUpRight />
              </a>
            </Button>
          </div>
        </Container>
      </Band>

      <Band id="icos-elter">
        <Container>
          <SectionHeader eyebrow="Infrastructuri europene" title="LifeWatch, eLTER și ICOS, în același loc" lede="Aceleași situri servesc trei infrastructuri europene. eLTER descrie locul și ce se măsoară acolo, ICOS măsoară schimburile de carbon, apă și energie, iar LifeWatch oferă serviciile de date pentru biodiversitate." />
          <Grid cols={3}>
            {[
              { t: "eLTER RI", b: `Rețeaua LTER România are ${DEIMS.length} fișe în DEIMS-SDR, dintre care ${lterCount} platforme și situri LTER. Fiecare are un cod de sit european, de exemplu LTER_EU_RO_006 pentru Insulele Brăilei.`, href: "https://deims.org/networks/4260f964-0ac4-4406-8adc-5afc06e31779", cta: "LTER România în DEIMS" },
              { t: "ICOS", b: "Proiectul a instalat cinci stații de flux care măsoară CO₂, apă și energie, iar una, într-o zonă umedă, măsoară și metanul. Stațiile de la Brăila, Comana și Enisala au fișe în DEIMS.", to: "situri", hash: "icos", cta: "Stațiile de flux" },
              { t: "LifeWatch ERIC", b: "Centrul de date de la Sinaia și laboratoarele virtuale sunt nodul românesc al serviciilor LifeWatch pentru biodiversitate și ecosisteme.", href: "https://www.lifewatch.eu/", cta: "LifeWatch ERIC" },
            ].map((c) => (
              <Card key={c.t}>
                <CardBody>
                  <CardTitle>{c.t}</CardTitle>
                  <CardText>{c.b}</CardText>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noreferrer" className="mt-auto text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
                      {c.cta} ↗
                    </a>
                  ) : (
                    <Link to={c.to!} hash={c.hash} className="mt-auto text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
                      {c.cta} →
                    </Link>
                  )}
                </CardBody>
              </Card>
            ))}
          </Grid>
          <h3 className="mt-11 mb-3 font-display text-[22px] font-bold">Stațiile de flux din România</h3>
          <IcosTable rows={icos} />
          <p className="mt-2.5 text-[13px] text-subtle">Proiectul a instalat cinci stații de flux. Trei au deja fișe în DEIMS-SDR ca situri eLTER_ICOS, iar POLI și BV se urmăresc în LTSER Explorer. Ultimele două rânduri provin din catalogul de metadate ICOS Carbon Portal (interogare SPARQL din 7 noiembrie 2026).</p>
        </Container>
      </Band>

      <Band tone="ground" id="despre">
        <Container>
          <SectionHeader eyebrow="Despre noi" title="Viziune, misiune și strategie" />
          <Grid cols={3}>
            {[
              ["Viziune", "Ecosistemele României, de la crestele carpatice până la Delta Dunării, sunt observate continuu, iar datele despre ele sunt deschise tuturor celor care iau decizii pe baza lor."],
              ["Misiune", "Legăm cercetarea de teren, monitorizarea pe termen lung și analiza datelor într-o singură infrastructură, conectată la LifeWatch ERIC, eLTER RI și ICOS."],
              ["Obiective strategice", "Extinderea rețelei de senzori, armonizarea protocoalelor cu standardele eLTER și ICOS și transformarea datelor în servicii pentru restaurarea ecologică și Planul Național de Restaurare."],
            ].map(([t, b]) => (
              <Card key={t}>
                <CardBody>
                  <CardTitle>{t}</CardTitle>
                  <CardText>{b}</CardText>
                </CardBody>
              </Card>
            ))}
          </Grid>
          <div className="mt-7">
            <Button asChild variant="outline" size="site">
              <Link to="despre">Despre LifeWatch România</Link>
            </Button>
          </div>
        </Container>
      </Band>

      <Band id="idei">
        <Container>
          <SectionHeader eyebrow="Ce construim în continuare" title="Idei pentru următoarea versiune" lede="Propuneri care pornesc de la datele deja adunate aici. Le putem discuta cu partenerii și le putem prioritiza împreună." />
          <Grid cols={3}>
            {IDEAS.map(([t, b], i) => (
              <Card key={t}>
                <CardBody>
                  <span className="text-[12.5px] font-semibold tracking-[0.1em] text-accent uppercase">Idee {i + 1}</span>
                  <CardTitle>{t}</CardTitle>
                  <CardText>{b}</CardText>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Container>
      </Band>

      <Band tone="ground" id="noutati">
        <Container>
          <SectionHeader eyebrow="Noutăți" title="Din rețea" />
          <Grid cols={3}>
            {NEWS.map((n) => (
              <Card key={n.title}>
                <CardBody>
                  <span className="text-[13px] text-subtle">{n.meta}</span>
                  <CardTitle>{n.title}</CardTitle>
                  <CardText>{n.body}</CardText>
                  {n.href ? (
                    <a href={n.href} target="_blank" rel="noreferrer" className="mt-auto text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
                      {n.cta} ↗
                    </a>
                  ) : (
                    <Link to={n.to!} hash={n.hash} className="mt-auto text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
                      {n.cta}
                    </Link>
                  )}
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Container>
      </Band>

      <Band id="proiecte">
        <Container>
          <SectionHeader eyebrow="Rețea" title="Infrastructuri și proiecte partenere" />
          <Grid cols={4}>
            {PARTNERS.map((p) => (
              <a key={p.name} href={p.href} target="_blank" rel="noreferrer" className="flex flex-col rounded-xl border border-border bg-surface transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent">
                <CardBody>
                  <CardTitle>{p.name} ↗</CardTitle>
                  <CardText>{p.body}</CardText>
                </CardBody>
              </a>
            ))}
          </Grid>
          <h3 className="mt-10 mb-3.5 text-[16px] font-semibold text-muted">Proiecte europene în derulare</h3>
          <div className="flex flex-wrap gap-1.5">
            {PROJECTS.map((p) =>
              p.href ? (
                <a key={p.name} href={p.href} target="_blank" rel="noreferrer" className="inline-flex min-h-[30px] items-center rounded-md bg-surface-2 px-2.5 text-[13px] text-navy hover:bg-surface-3 dark:text-foreground">
                  {p.name} ↗
                </a>
              ) : (
                <Tag key={p.name} className="min-h-[30px] px-2.5 text-[13px] font-normal">
                  {p.name}
                </Tag>
              ),
            )}
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="surse" className="!py-10">
        <Container>
          <h2 className="font-display text-[22px] font-bold">Surse de date și licențe</h2>
          <div className="mt-4 grid gap-5 text-[13.5px] leading-[1.6] text-subtle md:grid-cols-3 [&_b]:text-foreground">
            <p>
              <b>DEIMS-SDR</b> pentru descrierea siturilor, limite, habitate EUNIS, climatologie și fotografii. Fiecare fișă trimite la înregistrarea originală.
            </p>
            <p>
              <b>iNaturalist</b> pentru observații verificabile; fotografiile incluse au licențe Creative Commons, cu autorul afișat. <b>GBIF</b> pentru numărul de ocurențe.
            </p>
            <p>
              <b>NASA POWER</b> pentru climatologia lunară, <b>EEA și Copernicus</b> pentru Natura 2000 și straturile de habitat, <b>ICOS Carbon Portal</b> pentru catalogul stațiilor, <b>CARTO</b> și <b>Natural Earth</b> pentru hărțile de bază.
            </p>
          </div>
        </Container>
      </Band>

      <Band id="acces-cta" label="Colaborare">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl bg-[#2F7D4F] p-7 text-white sm:p-10">
            <div className="max-w-[640px] flex-[1_1_460px]">
              <h2 className="font-display text-[26px] leading-[1.15] font-bold sm:text-[32px]">Cercetează la stațiunile noastre</h2>
              <p className="mt-2 text-[16px] leading-[1.6] text-[#E4F2E9] sm:text-[17px]">Găzduim echipe, campanii de teren și instalări de senzori. Spuneți-ne ce vă trebuie și vă răspundem cu o propunere.</p>
            </div>
            <Link to="acces" hash="cerere" className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-[15px] font-bold text-[#1F5A37] hover:bg-[#f0f7f2]">
              Cere acces
            </Link>
          </div>
        </Container>
      </Band>
    </>
  );
}

export function IcosTable({ rows }: { rows: LwPoint[] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
            {["Stație", "Tip", "Coordonate", "Operator", "Legături"].map((h) => (
              <th key={h} className="border-b border-border px-2.5 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.key} className="align-top">
              <td className="border-b border-border px-2.5 py-2.5 font-semibold">{p.ro}</td>
              <td className="border-b border-border px-2.5 py-2.5">{CAT[p.cat].one}</td>
              <td className="tabular border-b border-border px-2.5 py-2.5">{p.lat.toFixed(3)}, {p.lon.toFixed(3)}</td>
              <td className="border-b border-border px-2.5 py-2.5">{p.cat === "icos" ? "RCSES, Universitatea din București" : p.id === "icos-BSC" ? "NOAA Global Monitoring Laboratory" : "–"}</td>
              <td className="border-b border-border px-2.5 py-2.5 whitespace-nowrap">
                <Link to={sheetKey(p)} className="text-[#2f7d4f] hover:underline dark:text-accent">Fișa</Link> ·{" "}
                <a href={p.deims || p.link} target="_blank" rel="noreferrer" className="text-[#2f7d4f] hover:underline dark:text-accent">
                  {p.deims ? "DEIMS" : "ICOS"} ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
