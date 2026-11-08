// Access to the LifeWatch România infrastructure: who is responsible, principles, users, procedure,
// costs, laboratories, computing, data, obligations and the request form (Netlify form "acces").
// Text from the colleagues' static site, which follows the infrastructure's access regulation.
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { asset, LTSER_URL } from "../content/lw";
import { sitePhoto } from "../content/site-photos";
import { isEn } from "../i18n/core";
import { Link } from "../router";
import { Band, Container, SectionHeader } from "../components/primitives";
import { SubNav } from "../components/subnav";
import { Card, CardBody, CardText, CardTitle } from "../components/lw-ui";

const RACKS = sitePhoto("8a3e1856", "Rack-urile centrului de date de la Sinaia");
const link = "inline-flex w-fit items-center gap-1 text-[14px] font-semibold text-[#2f7d4f] hover:underline dark:text-accent";
const th = "border-b border-border px-3.5 py-2.5 text-left text-[12px] font-semibold tracking-[0.05em] text-subtle uppercase";
const td = "border-b border-border px-3.5 py-2.5 align-top leading-[1.55]";

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={link}>
      {children} <ArrowUpRight className="size-3.5" strokeWidth={2} />
    </a>
  );
}

function Table({ head, rows, min = 640 }: { head: string[]; rows: ReactNode[][]; min?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-[14px]" style={{ minWidth: min }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cn(td, j === 0 && "font-semibold")}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([k, v]) => (
        <Card key={k}>
          <CardBody>
            <CardTitle>{k}</CardTitle>
            <CardText>{v}</CardText>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

const field = "h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-[15px] outline-none focus-visible:border-accent";

function RequestForm() {
  const form = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = new URLSearchParams(new FormData(form.current!) as unknown as Record<string, string>).toString();
    setState("sending");
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then((r) => {
        setState(r.ok ? "ok" : "fail");
        if (r.ok) form.current?.reset();
      })
      .catch(() => setState("fail"));
  };
  const label = "grid gap-1.5 text-[14px] font-semibold";
  return (
    <form ref={form} name="acces" method="POST" action="/" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6">
      <input type="hidden" name="form-name" value="acces" />
      <p hidden>
        <label>
          Nu completați <input name="bot-field" />
        </label>
      </p>
      <label className={label}>
        Nume și prenume
        <input name="nume" required autoComplete="name" className={field} />
      </label>
      <label className={label}>
        Funcția sau gradul
        <input name="functie" autoComplete="organization-title" className={field} />
      </label>
      <label className={label}>
        Instituția, facultatea și departamentul
        <input name="institutie" required autoComplete="organization" className={field} />
      </label>
      <label className={label}>
        E-mail
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className={label}>
        Sunteți
        <select name="solicitant" required defaultValue="" className={field}>
          <option value="">Alegeți</option>
          <option>Cercetător al Universității din București (Anexa 1)</option>
          <option>Cercetător din afara universității (Anexa 2)</option>
          <option>Partener într-un proiect al universității</option>
        </select>
      </label>
      <label className={label}>
        Ce vă trebuie
        <select name="tip" required defaultValue="" className={field}>
          <option value="">Alegeți</option>
          <option>Acces la echipamente și laboratoare</option>
          <option>Analize făcute de personalul infrastructurii</option>
          <option>Resurse de calcul în centrul de date</option>
          <option>Acces la date existente</option>
          <option>Folosirea unui echipament în afara laboratorului</option>
        </select>
      </label>
      <label className={label}>
        Laboratorul sau echipamentul
        <input name="laborator" className={field} />
      </label>
      <label className={label}>
        Perioada dorită
        <input name="perioada" className={field} />
      </label>
      <label className={label}>
        Aveți competențele pentru lucrul independent?
        <select name="competente" className={field}>
          <option>Da, am discutat cu responsabilul laboratorului</option>
          <option>Nu, solicit realizarea analizelor de către personal</option>
        </select>
      </label>
      <label className={label}>
        Sursa de finanțare
        <input name="finantare" className={field} />
      </label>
      <label className={cn(label, "sm:col-span-2")}>
        Experimentele sau analizele
        <textarea name="descriere" required rows={5} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[15px] font-normal outline-none focus-visible:border-accent" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="green" size="site" disabled={state === "sending"}>
          {state === "sending" ? "Se trimite…" : "Trimite cererea"}
        </Button>
        <p role="status" className="text-[14px] text-muted">
          {state === "ok" ? "Mulțumim! Cererea a fost trimisă către RCSES, care vă va contacta pentru detalii." : null}
          {state === "fail" ? "Cererea nu a putut fi trimisă din această previzualizare. Pe site-ul publicat pe Netlify formularul ajunge direct la echipă." : null}
        </p>
      </div>
    </form>
  );
}

export default function AccessPage() {
  const en = isEn();
  return (
    <>
      <section className="bg-navy text-white">
        <Container className="grid items-end gap-8 pt-10 pb-11 sm:pt-14 sm:pb-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <div className="grid gap-3">
            <p className="text-[12.5px] font-semibold tracking-[0.1em] text-lime uppercase">Acces</p>
            <h1 className="font-display text-[32px] leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-[42px] xl:text-[50px]">Acces la infrastructura LifeWatch România</h1>
            <p className="max-w-[78ch] text-[16px] leading-[1.65] text-[#CFDCE2] sm:text-[17px]">IC LifeWatch este infrastructura de cercetare colocată LifeWatch, eLTER, ICOS și MIRRI a Universității din București. Laboratoarele, echipamentele, centrul de date și datele ei sunt deschise cercetării și formării, pentru instituții academice, organisme publice și entități private. Pe această pagină găsiți cine răspunde de infrastructură și cum se cere accesul.</p>
          </div>
          <div className="grid gap-3 rounded-xl border border-[#2C5A6E] bg-navy-2 p-5">
            <h3 className="font-display text-[19px] font-bold">Pe scurt</h3>
            <ol className="grid list-decimal gap-1.5 pl-5 text-[15px] leading-[1.55] text-[#CFDCE2]">
              <li>Discutați întâi cu responsabilul laboratorului.</li>
              <li>Trimiteți cererea către directorul IC LifeWatch cu cel puțin 14 zile înainte.</li>
              <li>După aprobare se stabilesc costurile și, după caz, se încheie contractul sau acordul de colaborare.</li>
              <li>Lucrul se face în prezența personalului desemnat.</li>
            </ol>
            <Button asChild variant="lime" size="site-sm" className="w-fit">
              <a href="#cerere">Cerere de acces</a>
            </Button>
          </div>
        </Container>
      </section>
      <SubNav
        label="Secțiunile paginii"
        items={[
          { label: "Cine răspunde", hash: "responsabil" },
          { label: "Principii", hash: "principii" },
          { label: "Cine are acces", hash: "cine" },
          { label: "Procedura", hash: "procedura" },
          { label: "Costuri", hash: "costuri" },
          { label: "Laboratoare", hash: "echipamente" },
          { label: "Centrul de date", hash: "calcul" },
          { label: "Date", hash: "date" },
          { label: "Obligații", hash: "obligatii" },
          { label: "Cerere", hash: "cerere" },
        ]}
      />

      <Band id="responsabil">
        <Container>
          <SectionHeader eyebrow="Responsabilitate" title="Cine răspunde de infrastructură" lede="IC LifeWatch a fost înființată în 2019, odată cu proiectul LifeWatch România, ca infrastructură de cercetare fără personalitate juridică a Universității din București. O coordonează directorul infrastructurii, împreună cu coordonatorii stațiunilor de cercetare, iar stațiunile de la Brăila și Sinaia sunt coordonate de RCSES." />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardBody>
                <p className="text-[12px] font-semibold tracking-[0.08em] text-accent uppercase">Proprietar</p>
                <CardTitle>Universitatea din București</CardTitle>
                <CardText>Asigură resursele pentru funcționarea curentă, adică întreținerea, personalul administrativ și tehnic, reparațiile, mentenanța și actualizarea echipamentelor. Contractele și acordurile de acces se încheie cu universitatea.</CardText>
                <Ext href="https://unibuc.ro/">unibuc.ro</Ext>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-[12px] font-semibold tracking-[0.08em] text-accent uppercase">Coordonare</p>
                <CardTitle>Directorul IC LifeWatch și RCSES</CardTitle>
                <CardText>Directorul infrastructurii primește și aprobă cererile de acces, împreună cu coordonatorii stațiunilor. Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate (RCSES) coordonează stațiunile de la Brăila și Sinaia și asigură participarea universității în LifeWatch ERIC, eLTER, ICOS și MIRRI-ERIC.</CardText>
                <Ext href="https://rcses.unibuc.ro/">rcses.unibuc.ro</Ext>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-[12px] font-semibold tracking-[0.08em] text-accent uppercase">Operare</p>
                <CardTitle>Laboratoarele și personalul lor</CardTitle>
                <CardText>Fiecare laborator are un responsabil desemnat și cel puțin un tehnician sau laborant. Echipamentele sunt folosite numai după procedurile laboratorului și numai de personalul desemnat, iar coordonatorii stațiunilor planifică accesul utilizatorilor.</CardText>
                <a href="#echipamente" className={link}>Laboratoarele →</a>
              </CardBody>
            </Card>
          </div>
          <div className="mt-6">
            <Table
              min={820}
              head={["Stațiunea", "Centrul de cercetare care o coordonează", "Laboratoare IC LifeWatch", "Legătura"]}
              rows={[
                [<Link key="b" to="statiuni/braila" className="hover:text-accent hover:underline">Brăila</Link>, "RCSES, Facultatea de Biologie", "Analize ecologice pentru zone umede inundabile, genetică pentru zone umede", <span key="l" className="grid gap-1"><Ext href="https://unibuc.ro/cercetare/statiuni-de-cercetare/statiunea-de-cercetari-de-la-braila/">Pagina UB</Ext><a href="mailto:statiunea.braila@gmail.com" className="text-[13.5px] break-all hover:text-accent" data-no-tr>statiunea.braila@gmail.com</a></span>],
                [<Link key="s" to="statiuni/sinaia" className="hover:text-accent hover:underline">Sinaia</Link>, "RCSES, Facultatea de Biologie", "Prelevare și precondiționare pentru zone montane, centrul de date cu laboratoare virtuale", <Ext key="l" href="https://unibuc.ro/cercetare/statiuni-de-cercetare/statiunea-zoologica-sinaia/">Pagina UB</Ext>],
                [<Link key="o" to="statiuni/orsova" className="hover:text-accent hover:underline">Orșova</Link>, "Centrele de cercetare ale facultăților de Geografie, Chimie, Biologie și Geologie, între care Centrul de Degradarea Terenurilor și Dinamică Geomorfologică și Centrul de Studii de Risc, Modelare Spațială și Dinamica Sistemelor Terestre și Costiere", "Probe și date geomatice pentru ecosisteme fluviale, prelevare și precondiționare pentru ape fluviale", <Ext key="l" href="https://unibuc.ro/cercetare/statiuni-de-cercetare/statiunea-de-cercetare-de-la-orsova/">Pagina UB</Ext>],
                [<Link key="g" to="statiuni/sfantu-gheorghe" className="hover:text-accent hover:underline">Sfântu Gheorghe</Link>, "Facultatea de Geografie, cu Centrul de Cercetări Costiere pentru Protecția Mediului și Centrul de Cercetare de Geologie și Geofizică Ambientală", "Monitorizarea ecosistemelor costiere și deltaice, prelevare și precondiționare pentru zone costiere și deltaice", <Ext key="l" href="https://unibuc.ro/cercetare/statiuni-de-cercetare/statiunea-de-cercetari-de-la-sfantu-gheorghe/">Pagina UB</Ext>],
                ["Distribuit", "RCSES", "Laboratorul mobil de cercetări sociale, stațiile de flux, cele 20 de stații climatice", <Link key="l" to="infrastructura" hash="retea-teren" className={link}>Lista stațiilor →</Link>],
              ]}
            />
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="principii">
        <Container>
          <SectionHeader eyebrow="Principii" title="Cum gestionăm accesul" lede="Regulamentul urmărește ca cererile să fie tratate transparent, echitabil și eficient, după trei principii." />
          <div className="mt-7">
            <Steps
              items={[
                ["Acces deschis", "Acces larg și echitabil la infrastructură, cu păstrarea sustenabilității ei operaționale."],
                ["Utilizare corectă", "Resursele se folosesc responsabil, fără supra-utilizare, care i-ar împiedica pe alți cercetători, și fără sub-utilizare, care ar pune în pericol întreținerea infrastructurii."],
                ["Date partajate și transparente", "Datele generate în infrastructură se fac accesibile deschis ori de câte ori este posibil, ca să încurajeze colaborarea și progresul științific."],
              ]}
            />
          </div>
        </Container>
      </Band>

      <Band id="cine">
        <Container>
          <SectionHeader eyebrow="Utilizatori" title="Cine poate folosi infrastructura" />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {[
              ["Acces nerestricționat", "Personalul stațiunilor și al centrelor care le coordonează", "Cercetătorii asociați acestor centre au acces nerestricționat în laboratoare, sub supravegherea personalului desemnat al fiecărui laborator."],
              ["Pe bază de cerere", "Alți cercetători ai Universității din București", "Cadre didactice, cercetători, doctoranzi și masteranzi care au competențele necesare. Cererea se face pe modelul din Anexa 1 a regulamentului."],
              ["Contract sau acord", "Cercetători din țară și din străinătate", "Pe baza unor contracte, proiecte de cercetare, dezvoltare și inovare sau acorduri de colaborare, cu cererea pe modelul din Anexa 2. Partenerii din proiectele universității lucrează după acordurile proiectului."],
            ].map(([k, title, body]) => (
              <Card key={title}>
                <CardBody>
                  <p className="text-[12px] font-semibold tracking-[0.08em] text-accent uppercase">{k}</p>
                  <CardTitle>{title}</CardTitle>
                  <CardText>{body}</CardText>
                </CardBody>
              </Card>
            ))}
          </div>
          <p className="mt-5 max-w-[90ch] text-[15px] leading-[1.65] text-muted">Au prioritate experimentele și analizele din proiectele în derulare ale centrelor care coordonează stațiunile. Infrastructura se folosește numai pentru cercetare, inovare, dezvoltare tehnologică și evenimente științifice.</p>
        </Container>
      </Band>

      <Band tone="ground" id="procedura">
        <Container>
          <SectionHeader eyebrow="Procedura" title="Cum se obține accesul" />
          <div className="mt-7">
            <Steps
              items={[
                ["1 · Discuția preliminară", "Vorbiți cu responsabilul laboratorului despre experiment, analize, numărul de probe și perioadă. Cererea trebuie să confirme că această discuție a avut loc."],
                ["2 · Cererea", "Cererea se adresează directorului IC LifeWatch cu cel puțin 14 zile înainte de perioada dorită, pe modelul din Anexa 1 pentru cercetătorii UB sau din Anexa 2 pentru cei din afara universității. Precizați echipamentul, laboratorul, analizele, perioada și sursa de finanțare."],
                ["3 · Competențele", "Declarați dacă aveți competențele necesare pentru experiment. Dacă nu le aveți, analizele pot fi făcute de cercetătorii infrastructurii, pe baza unui acord de colaborare (Anexa 3)."],
                ["4 · Aprobarea și costurile", "Directorul aprobă cererea împreună cu responsabilul laboratorului. După aprobare se stabilesc sumele pentru utilizare și consumabile, iar utilizatorii din afara universității încheie un contract sau trimit o comandă fermă."],
                ["5 · Lucrul în laborator", "Accesul are loc numai în prezența responsabilului de laborator, a unui tehnician calificat sau a unui cercetător al infrastructurii. Echipamentele sunt operate de personalul desemnat."],
              ]}
            />
          </div>
          <p className="mt-5 max-w-[95ch] rounded-xl border border-dashed border-border-strong bg-background p-4 text-[14.5px] leading-[1.6] text-muted">
            <b className="text-foreground">Echipamente scoase din laborator.</b> Echipamentele de laborator se folosesc în afara laboratorului numai în mod excepțional, cu o notă justificativă avizată de responsabilul laboratorului și de directorul IC LifeWatch și cu proces-verbal de predare-primire semnat la gestionarul stațiunii. Echipamentele de teren nu intră sub această restricție.
          </p>
        </Container>
      </Band>

      <Band id="costuri">
        <Container>
          <SectionHeader eyebrow="Costuri" title="Cine plătește" />
          <div className="mt-7">
            <Table
              head={["Utilizator", "Ce acoperă", "Cum"]}
              rows={[
                ["Cercetători UB, în proiecte", "Consumabilele și utilitățile pentru experiment", "Din bugetul proiectului"],
                ["Cercetători UB, în activitatea de bază", "Consumabilele și utilitățile pentru experiment", "Din bugetul facultății, al departamentului sau al grantului doctoral"],
                ["Utilizatori din afara UB", "Toate costurile utilizării, inclusiv amortizarea echipamentelor și cheltuielile operaționale", "Contract sau comandă fermă, cu tarife stabilite după tipul de utilizator și complexitatea echipamentului"],
                ["Parteneri din proiectele UB", "Condiții stabilite pe durata proiectului", "Acorduri sau protocoale specifice, din care rezultă beneficiile pentru universitate"],
              ]}
            />
          </div>
          <p className="mt-4 text-[15px] text-muted">Veniturile din parteneriate și din taxele de acces se reinvestesc în întreținerea și dezvoltarea infrastructurii.</p>
        </Container>
      </Band>

      <Band tone="ground" id="echipamente">
        <Container>
          <SectionHeader eyebrow="Acces la echipamente" title="Cele 11 laboratoare ale infrastructurii" lede="Fiecare laborator are un responsabil desemnat. În cerere folosiți denumirea echipamentului așa cum apare pe lifewatch.ro." />
          <div className="mt-7">
            <Table
              head={["Laborator", "Locul", "Exemple de echipamente"]}
              rows={[
                ["Monitorizarea și analiza ecosistemelor costiere și deltaice", "Sfântu Gheorghe", "Modul mobil și modul de analiză a probelor"],
                ["Prelevare, precondiționare și izolare probe pentru zone costiere și deltaice", "Sfântu Gheorghe", "Echipamente de prelevare și conservare a probelor"],
                ["Analize ecologice complexe pentru zone umede inundabile", "Brăila", "Telemetrie și teledetecție mobilă, experimente ecologice, monitorizarea ecosistemelor terestre și a biodiversității"],
                ["Genetică pentru studii ecosistemice în zone umede", "Brăila", "Secvențiator Illumina MiniSeq, MALDI-TOF Bruker Biotyper, microscopie de fluorescență"],
                ["Monitorizare, prelevare și analiză probe și date geomatice pentru ecosisteme fluviale", "Orșova", "Drone, batimetrie, scanare geochimică XRF, autolaborator"],
                ["Prelevare, precondiționare și izolare probe pentru zone acvatice fluviale", "Orșova", "Echipamente de prelevare și conservare a probelor"],
                ["Prelevare, precondiționare și izolare probe pentru zone montane", "Sinaia", "Echipamente de prelevare și conservare a probelor"],
                ["Centrul de date, modul de interfață LifeWatch (laboratoare virtuale)", "Sinaia", "Cloud privat HCI, plăci NVIDIA Tesla T4, stocare NVMe și scale-out"],
                ["Laboratorul mobil de cercetări sociale", "Distribuit", "Culegerea rapidă a datelor sociale din teren"],
                ["Stații complexe de monitorizare a fluxurilor ecologice in situ", "Distribuit", "Cinci turnuri eddy covariance, sonde cu neutroni cosmici"],
                ["Stații distribuite de cercetări climatice și de adaptare la schimbările climatice", "Distribuit", "20 de stații climatice, radiometre UV și RaZON+, geamandura"],
              ]}
            />
          </div>
          <Link to="infrastructura" hash="laboratoare" className={cn(link, "mt-4")}>
            Detaliile laboratoarelor →
          </Link>
        </Container>
      </Band>

      <Band id="calcul">
        <Container className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <SectionHeader eyebrow="Acces virtual" title="Acces la infrastructura de calcul" lede="Centrul de date de la Stațiunea Zoologică Sinaia este unul dintre cele 11 laboratoare ale infrastructurii, ca modul de interfață cu LifeWatch și laboratoare virtuale. Accesul la resursele lui se cere ca la orice alt laborator, prin cererea adresată directorului IC LifeWatch, după discuția cu responsabilul centrului de date." />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Ce se poate obține", ["mașini virtuale în cloud-ul privat al universității, cu procesoare Intel Xeon și, la nevoie, plăci NVIDIA Tesla T4", "spațiu de stocare pentru date și rezultate", "acces la laboratoarele virtuale conectate la LifeWatch ERIC", "publicarea rezultatelor prin serviciile OGC, COG și STAC ale platformei"]],
                ["Ce precizați în cerere", ["scopul și durata lucrului, proiectul și sursa de finanțare", "numărul aproximativ de nuclee, memoria, nevoia de GPU și volumul de date", "persoanele care vor lucra pe resurse și programele necesare"]],
              ].map(([k, list]) => (
                <div key={k as string}>
                  <h3 className="mb-2 font-display text-[19px] font-bold">{k as string}</h3>
                  <ul className="grid list-disc gap-1 pl-5 text-[15px] leading-[1.55] text-muted">
                    {(list as string[]).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild variant="green" size="site-sm">
                <a href="#cerere">Cere resurse de calcul</a>
              </Button>
              <Button asChild variant="outline" size="site-sm">
                <Link to="infrastructura" hash="centru-date">Configurația centrului →</Link>
              </Button>
            </div>
          </div>
          <figure className="m-0 grid gap-1.5">
            <img loading="lazy" src={asset(RACKS.src)} alt={RACKS.alt} width={RACKS.w} height={RACKS.h} className="w-full rounded-xl border border-border object-cover" />
            <figcaption className="text-[13px] text-subtle">Centrul de date LifeWatch România de la Sinaia.</figcaption>
          </figure>
        </Container>
      </Band>

      <Band tone="ground" id="date">
        <Container>
          <SectionHeader eyebrow="Acces deschis" title="Acces la date" />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              [LTSER_URL, "LTSER Explorer", "Măsurătorile stațiilor climatice și de flux, indicatorii din satelit și datele sociale, cu export GeoTIFF și GeoJSON."],
              ["https://map.lifewatch.ro/", "Geoportalul LifeWatch", "Hărți interactive și serii de timp, cu servicii OGC pentru propriile aplicații."],
              ["https://deims.org/networks/4260f964-0ac4-4406-8adc-5afc06e31779", "DEIMS-SDR", "Fișele siturilor LTER din România și metadatele seturilor de date."],
            ].map(([href, title, body]) => (
              <a key={title} href={href} target="_blank" rel="noreferrer" className="group grid content-start gap-2 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent">
                <h3 className="font-display text-[20px] font-bold group-hover:text-accent">{title} ↗</h3>
                <p className="text-[15px] leading-[1.55] text-muted">{body}</p>
              </a>
            ))}
          </div>
          <p className="mt-5 max-w-[90ch] text-[15px] leading-[1.65] text-muted">Accesul la datele existente care nu sunt publicate se cere tot directorului IC LifeWatch, pe modelul din Anexa 2, și se reglementează printr-un acord de colaborare.</p>
        </Container>
      </Band>

      <Band id="obligatii">
        <Container className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Obligații" title="Ce își asumă utilizatorii" />
            <ul className="mt-6 grid list-disc gap-1.5 pl-5 text-[15.5px] leading-[1.6] text-muted">
              <li>respectarea regulamentului, a procedurilor laboratorului și a legislației în vigoare</li>
              <li>acoperirea costurilor de utilizare și a consumabilelor, după caz</li>
              <li>repararea în cel mai scurt timp a echipamentului defectat prin utilizare necorespunzătoare</li>
              <li>cooptarea ca coautori a membrilor infrastructurii care au participat efectiv la analize sau experimente</li>
              <li>menționarea infrastructurii în orice rezultat obținut cu echipamentele ei</li>
            </ul>
            <p className="mt-4 text-[15px] leading-[1.65] text-muted">La final, responsabilul laboratorului și solicitantul consemnează în acordul de colaborare activitățile făcute, starea echipamentului și modul în care vor fi folosite rezultatele.</p>
          </div>
          <div className="grid content-start gap-3 rounded-xl border border-border bg-ground p-5 sm:p-6">
            <h3 className="font-display text-[20px] font-bold">Textul de mulțumire</h3>
            <blockquote className="border-l-[3px] border-accent pl-4 text-[16px] leading-[1.6] italic" lang="en" data-no-tr>
              Experiments in this paper were carried out in the collocated LifeWatch, eLTER, ICOS Research Infrastructure, Laboratory …, University of Bucharest.
            </blockquote>
            <p className="text-[14px] text-subtle">Se completează denumirea laboratorului folosit.</p>
          </div>
        </Container>
      </Band>

      <Band tone="ground" id="cerere">
        <Container className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="grid content-start gap-3">
            <SectionHeader eyebrow="Cerere" title="Cerere de acces" />
            <p className="text-[15.5px] leading-[1.65] text-muted">Formularul pregătește cererea către directorul IC LifeWatch. Trimiteți-l cu cel puțin 14 zile înainte de perioada dorită, după ce ați vorbit cu responsabilul laboratorului.</p>
            <p className="text-[15.5px] leading-[1.65] text-muted">Cererea oficială se semnează pe modelul din regulament, Anexa 1 pentru cercetătorii UB sau Anexa 2 pentru cei din afara universității, iar datele din formular servesc la completarea ei.</p>
            <p className="text-[13.5px] text-subtle">Datele din formular se folosesc numai pentru analizarea cererii, de către Universitatea din București.</p>
            {en ? <p className="text-[13.5px] text-subtle">The official request forms (Annexes 1–3) are in Romanian.</p> : null}
          </div>
          <RequestForm />
        </Container>
      </Band>
    </>
  );
}
