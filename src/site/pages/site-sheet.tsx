// Data sheet of one place of the network (/situri/<slug>/): list of all places, map, and tabs for
// overview, habitats, climate, biodiversity, eLTER/ICOS and data/API. The snapshot is prerendered;
// "live" buttons query the public services (iNaturalist, GBIF, NASA POWER) from the browser.
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  bboxQuery,
  CAT,
  CAT_ORDER,
  fmt,
  gbifUrl,
  inatUrl,
  LW_POINTS,
  meanOf,
  PLATFORM_POINT,
  relatedOf,
  sheetGallery,
  sheetKey,
  snapshotLabel,
  commonName,
  customPoint,
  LTSER_URL,
  NETS,
  apiStationId,
  placeText,
  STATION_SLUG,
  type LwClimate,
  type LwN2k,
  type LwPoint,
  type LwSpecies,
} from "../content/lw";
import { Link, pageHref, useRouter } from "../router";
import { Container } from "../components/primitives";
import { BaseSwitch, EEA, LwMap, type BaseName } from "../components/lw-map";
import { CatShape } from "../components/lw-shapes";
import { Bars, Climograph, ClimographLegend, MONTHS, YearBars } from "../components/lw-charts";
import { Gallery, useLightbox } from "../components/lw-gallery";
import { ChipLink, Chips, H3, KeyValues, Note, PointTags, Tag } from "../components/lw-ui";
import { isEn } from "../i18n/core";

const ORDER = ["statiune", "ltser", "icos", "lter", "meteo", "icos-cat"];
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PLATFORM_OF: Record<string, string> = Object.fromEntries(Object.entries(PLATFORM_POINT).map(([slug, key]) => [key, slug]));

const TABS = [
  { id: "prezentare", label: "Prezentare" },
  { id: "habitate", label: "Habitate" },
  { id: "clima", label: "Climă" },
  { id: "biodiversitate", label: "Biodiversitate" },
  { id: "retele", label: "eLTER și ICOS" },
  { id: "date", label: "Date și API" },
] as const;
type TabId = (typeof TABS)[number]["id"];
// The chosen tab stays open while moving from one place to another.
let lastTab: TabId = "prezentare";

async function live<T>(url: string, ms = 12000): Promise<T | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function Snap() {
  return <span className="text-[12px] font-semibold text-subtle">{snapshotLabel()}</span>;
}
function Live() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1F5A37] dark:text-accent">
      <span className="size-2 rounded-full bg-[#3DAA5C]" />
      Date live
    </span>
  );
}
function Offline({ what }: { what: string }) {
  return (
    <Note className="mb-4">
      <b>Nu am putut încărca acum {what}.</b> Cererea pleacă direct din browser către serviciul public. Încercați din nou peste câteva minute.
    </Note>
  );
}
function Prose({ children }: { children: ReactNode }) {
  return <p className="max-w-[860px] text-[15px] leading-[1.65] whitespace-pre-line text-muted">{children}</p>;
}
function Section({ title, note, children, className }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-7 first:mt-0", className)}>
      <H3>
        {title} {note ? <span className="text-[13px] font-normal text-subtle">({note})</span> : null}
      </H3>
      {children}
    </div>
  );
}

function SiteList({ current }: { current: LwPoint }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const rows = useMemo(() => {
    const t = fold(q.trim());
    return LW_POINTS.filter((p) => (cat === "all" || (cat === "ours" ? p.ours : p.cat === cat)) && (!t || fold(`${p.ro} ${p.fullName ?? ""}`).includes(t))).sort(
      (a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat) || a.ro.localeCompare(b.ro, "ro"),
    );
  }, [q, cat]);
  const input = "h-10 w-full rounded-lg border border-border-strong bg-surface px-2.5 text-[14px] outline-none focus-visible:border-accent";
  return (
    <aside aria-label="Lista siturilor" className="hidden border-r border-border bg-background lg:sticky lg:top-[70px] lg:flex lg:max-h-[calc(100vh-70px)] lg:flex-col">
      <div className="grid gap-2 border-b border-border p-3.5">
        <label className="sr-only" htmlFor="ex-q">Filtrează siturile</label>
        <input id="ex-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrează după nume…" autoComplete="off" className={input} />
        <label className="sr-only" htmlFor="ex-cat">Tip de sit</label>
        <select id="ex-cat" value={cat} onChange={(e) => setCat(e.target.value)} className={input}>
          <option value="all">Toate tipurile</option>
          <option value="ours">Doar siturile noastre</option>
          {CAT_ORDER.map((c) => (
            <option key={c} value={c}>{CAT[c].label}</option>
          ))}
        </select>
        <span className="text-[12.5px] text-subtle">
          {rows.length} din {LW_POINTS.length} locuri
        </span>
      </div>
      <ul className="flex-1 overflow-auto p-1.5">
        {rows.map((p) => (
          <li key={p.key}>
            <Link
              to={sheetKey(p)}
              aria-current={p.key === current.key ? "page" : undefined}
              className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-ground aria-[current=page]:bg-surface-2 aria-[current=page]:shadow-[inset_3px_0_0_var(--accent)]"
            >
              <CatShape cat={p.cat} className="mt-0.5 inline-flex shrink-0" />
              <span>
                {p.ro}
                <small className="block text-[12px] text-subtle">
                  {CAT[p.cat].one}
                  {p.ours ? " · UB" : ""}
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function MobilePicker({ current }: { current: LwPoint }) {
  const { navigate } = useRouter();
  return (
    <div className="border-b border-border p-4 lg:hidden">
      <label className="grid grid-cols-[minmax(0,1fr)] gap-1 text-[13px] font-semibold">
        Alt sit sau altă stație
        <select value={current.slug} onChange={(e) => navigate(pageHref(`situri/${e.target.value}`))} className="h-10 w-full min-w-0 rounded-lg border border-border-strong bg-surface px-2.5 text-[14px] font-normal">
          {[...LW_POINTS]
            .sort((a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat) || a.ro.localeCompare(b.ro, "ro"))
            .map((p) => (
              <option key={p.key} value={p.slug}>{p.ro}</option>
            ))}
        </select>
      </label>
    </div>
  );
}

/* ---------------------------------------------------------------- Prezentare */
function Overview({ p }: { p: LwPoint }) {
  if (p.custom) {
    return (
      <>
        <p className="mb-5 max-w-[820px] text-[17px] leading-[1.65] text-muted">Ați ales un punct oarecare de pe hartă. Fila Climă încarcă climatologia NASA POWER pentru acest loc, fila Biodiversitate încarcă observațiile iNaturalist și GBIF, iar fila Habitate caută siturile Natura 2000 din jur.</p>
        <KeyValues
          className="mb-3"
          rows={[
            ["Latitudine", `${p.lat.toFixed(4)}°`],
            ["Longitudine", `${p.lon.toFixed(4)}°`],
            ["Zonă analizată", "≈ 11 × 11 km în jurul punctului"],
          ]}
        />
        <p className="text-[13px] text-subtle">Apăsați pe un marcaj ca să reveniți la un sit documentat.</p>
      </>
    );
  }
  const imgs = sheetGallery(p);
  const box = useLightbox(imgs);
  const station = STATION_SLUG[p.id];
  const platform = PLATFORM_OF[p.key];
  return (
    <>
      {imgs.length ? (
        <>
          <Gallery list={imgs} onOpen={box.open} />
          <p className="mt-1.5 mb-6 text-[13px] text-subtle">Fotografii din DEIMS-SDR și iNaturalist (licențe CC, autorii apar la mărire).</p>
          {box.node}
        </>
      ) : null}
      {p.text ? (
        <p className="mb-5 max-w-[820px] text-[17px] leading-[1.65] text-muted">{p.text}</p>
      ) : p.ltser ? (
        <p className="mb-5 max-w-[820px] text-[17px] leading-[1.65] text-muted">{`${p.cat === "icos" ? "Stație de flux ecosistemic" : "Stație climatică"} din rețeaua de teren LifeWatch România, cu codul ${p.ltser.code}. Măsurătorile ei se văd în LTSER Explorer, iar aici găsiți clima de referință, habitatele și biodiversitatea din jurul ei.`}</p>
      ) : null}
      {station || platform ? (
        <Note className="mb-5">
          {station ? (
            <>
              <b>Pagina stațiunii.</b> Laboratoare, echipamente, contact și galeria completă:{" "}
              <Link to={`statiuni/${station}`} className="font-semibold text-[#2f7d4f] underline dark:text-accent">deschide pagina stațiunii</Link>.
            </>
          ) : (
            <>
              <b>Pagina platformei.</b> Descrierea platformei LTSER și seturile de date din explorator:{" "}
              <Link to={`platforme/${platform}`} className="font-semibold text-[#2f7d4f] underline dark:text-accent">deschide pagina platformei</Link>.
            </>
          )}
        </Note>
      ) : null}
      <KeyValues
        className="mb-6"
        rows={[
          ["Tip", CAT[p.cat].one],
          ["Înființat", p.established ?? p.founded],
          ["Statut", p.status ? (p.status === "Operational" ? "Operațional" : p.status) : null],
          ["Suprafață", p.area_ha ? `${fmt(p.area_ha)} ha` : null],
          ["Altitudine", p.elev && (p.elev.min != null || p.elev.max != null) ? `${p.elev.min ?? "?"}–${p.elev.max ?? "?"} m` : null],
          ["Regiune biogeografică", p.biogeo],
          ["Biom", p.biome],
          ["Acces", p.access?.type ? `${p.access.type}${p.access.allYear ? ", tot anul" : ""}` : null],
          ["Manager de sit", p.managers?.length ? p.managers.join(", ") : null],
          ["Operator", p.orgs?.length ? p.orgs.join(", ") : p.unit],
        ]}
      />
      {p.networks?.length ? (
        <Section title="Rețele">
          <p className="text-[15px] leading-[1.7]">
            {p.networks.map((n) => (
              <span key={n.name} className="block">
                {n.name} {n.code ? <span className="text-subtle">({n.code})</span> : null}
              </span>
            ))}
          </p>
        </Section>
      ) : null}
      {p.abstract ? (
        <Section title="Descriere din DEIMS-SDR" note="în engleză">
          <Prose>{p.abstract}</Prose>
        </Section>
      ) : null}
      {p.ecosystems?.length ? (
        <Section title="Tipuri de ecosisteme">
          <Chips items={p.ecosystems} />
        </Section>
      ) : null}
      {p.infraNotes || p.infraItems?.length ? (
        <Section title="Infrastructură în teren">
          {p.infraNotes ? <Prose>{p.infraNotes}</Prose> : null}
          {p.infraItems?.length ? <Chips items={p.infraItems} className="mt-3" /> : null}
        </Section>
      ) : null}
      {p.projects?.length ? (
        <Section title="Proiecte">
          <Chips items={p.projects} />
        </Section>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- Habitate */
function N2kTable({ list }: { list: LwN2k[] }) {
  if (!list.length) return <p className="text-subtle">Niciun sit Natura 2000 nu intersectează zona analizată.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full min-w-[640px] border-collapse text-[14px]">
        <thead>
          <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
            {["Cod", "Denumire", "Tip", "Suprafață", "Fișe"].map((h) => (
              <th key={h} className="border-b border-border px-2.5 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.code} className="align-top">
              <td className="border-b border-border px-2.5 py-2 font-semibold">{s.code}</td>
              <td className="border-b border-border px-2.5 py-2">{s.name}</td>
              <td className="border-b border-border px-2.5 py-2">{s.type === "SPA" ? "Arie de protecție specială avifaunistică" : "Sit de importanță comunitară"}</td>
              <td className="tabular border-b border-border px-2.5 py-2 whitespace-nowrap">{fmt(s.ha)} ha</td>
              <td className="border-b border-border px-2.5 py-2 whitespace-nowrap">
                <a href={`https://natura2000.eea.europa.eu/Natura2000/SDF.aspx?site=${s.code}`} target="_blank" rel="noreferrer" className="text-[#2f7d4f] hover:underline dark:text-accent">Formular standard ↗</a> ·{" "}
                <a href={`https://eunis.eea.europa.eu/sites/${s.code}`} target="_blank" rel="noreferrer" className="text-[#2f7d4f] hover:underline dark:text-accent">EUNIS ↗</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Natura 2000 sites intersecting the analysis box, asked live from the EEA service. */
function LiveN2k({ p }: { p: LwPoint }) {
  const [list, setList] = useState<LwN2k[] | null | "fail">(null);
  useEffect(() => {
    let gone = false;
    const [s, w, n, e] = p.aoi;
    const base = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer/";
    const qs = `query?geometry=${[w, s, e, n].join(",")}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=SITECODE,SITENAME,Area_ha&returnGeometry=false&f=json`;
    type R = { features?: { attributes: { SITECODE: string; SITENAME: string; Area_ha?: number } }[] } | null;
    Promise.all([live<R>(`${base}0/${qs}`), live<R>(`${base}1/${qs}`)]).then(([a, b]) => {
      if (gone) return;
      if (!a && !b) return setList("fail");
      const found = new Map<string, LwN2k>();
      [a, b].forEach((r, i) => (r?.features ?? []).forEach((f) => found.set(f.attributes.SITECODE, { code: f.attributes.SITECODE, name: f.attributes.SITENAME, ha: Math.round(f.attributes.Area_ha ?? 0), type: i ? "SPA" : "SCI" })));
      setList([...found.values()].sort((x, y) => x.code.localeCompare(y.code)));
    });
    return () => {
      gone = true;
    };
  }, [p]);
  if (list === null) return <p className="text-subtle">Se caută siturile Natura 2000…</p>;
  if (list === "fail") return <Offline what="lista siturilor Natura 2000" />;
  return (
    <>
      <Live />
      <N2kTable list={list} />
    </>
  );
}

function Habitats({ p, eea, setEea, eeaFail }: { p: LwPoint; eea: string[]; setEea: (k: string[]) => void; eeaFail: string | null }) {
  const texts: [keyof LwPoint, string][] = [
    ["hydrology", "Hidrologie"],
    ["vegetation", "Vegetație"],
    ["soils", "Soluri"],
    ["geology", "Geologie"],
  ];
  return (
    <>
      <Section title="Straturi pe hartă">
        <p className="-mt-1.5 mb-3 text-[13px] text-subtle">Aceleași servicii EEA și Copernicus folosite de Wetland Restoration Hub. Bifați un strat, apoi priviți harta de sus.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
          {Object.entries(EEA).map(([k, cfg]) => (
            <label key={k} className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border p-3 text-[14px] hover:border-accent">
              <input type="checkbox" checked={eea.includes(k)} onChange={(e) => setEea(e.target.checked ? [...eea, k] : eea.filter((x) => x !== k))} className="mt-0.5 size-[18px] accent-[#2f7d4f]" />
              <span>
                <b>{cfg.label}</b>
                <small className="block text-[12.5px] text-subtle">{cfg.note}</small>
              </span>
            </label>
          ))}
        </div>
        {eeaFail ? (
          <Note className="mt-3">
            <b>Stratul „{eeaFail}” nu se poate încărca acum.</b> Imaginile vin de la serverele EEA.
          </Note>
        ) : null}
      </Section>
      {p.eunis?.length ? (
        <Section title="Habitate EUNIS raportate în DEIMS">
          <Chips
            items={p.eunis.map((x) => {
              const m = x.match(/\(([A-Z][0-9.]*)\)\s*$/);
              return (
                <>
                  {m ? <b className="mr-1.5">{m[1]}</b> : null}
                  {x.replace(/\s*\([A-Z][0-9.]*\)\s*$/, "")}
                </>
              );
            })}
          />
        </Section>
      ) : null}
      <Section title="Situri Natura 2000 care se suprapun cu zona">
        {p.n2k ? (
          <>
            <Snap />
            <N2kTable list={p.n2k} />
          </>
        ) : (
          <LiveN2k p={p} />
        )}
      </Section>
      {texts.map(([k, label]) =>
        p[k] ? (
          <Section key={k} title={label} note="DEIMS, în engleză">
            <Prose>
              {String(p[k]).slice(0, 1600)}
              {String(p[k]).length > 1600 ? "…" : ""}
            </Prose>
          </Section>
        ) : null,
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Climă */
function Climate({ p }: { p: LwPoint }) {
  const [pw, setPw] = useState<{ data: LwClimate; live: boolean } | null>(p.power ? { data: p.power, live: false } : null);
  const [loading, setLoading] = useState<"clim" | "series" | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [series, setSeries] = useState<{ shifted: Record<string, number>; slope: number; mean: number; min: number } | null>(null);

  const refresh = async () => {
    setLoading("clim");
    setFailed(null);
    const d = await live<{ properties: { parameter: Record<string, Record<string, number>> } }>(
      `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN&community=AG&longitude=${p.lon}&latitude=${p.lat}&format=JSON`,
      30000,
    );
    setLoading(null);
    if (!d) return setFailed("climatologia NASA POWER");
    const par = d.properties.parameter;
    const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const days = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    setPw({
      live: true,
      data: {
        t: mon.map((m) => +par.T2M[m].toFixed(1)),
        tmin: mon.map((m) => +par.T2M_MIN[m].toFixed(1)),
        tmax: mon.map((m) => +par.T2M_MAX[m].toFixed(1)),
        p: mon.map((m, i) => Math.round(par.PRECTOTCORR[m] * days[i])),
        rad: mon.map((m) => +par.ALLSKY_SFC_SW_DWN[m].toFixed(2)),
        src: "NASA POWER, climatologie lunară (MERRA-2)",
      },
    });
  };

  const loadSeries = async () => {
    setLoading("series");
    setFailed(null);
    const d = await live<{ properties: { parameter: { T2M: Record<string, number> } } }>(
      `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=AG&longitude=${p.lon}&latitude=${p.lat}&start=1991&end=2024&format=JSON`,
      30000,
    );
    setLoading(null);
    if (!d) return setFailed("seria NASA POWER");
    const t = d.properties.parameter.T2M;
    const ann: Record<string, number> = {};
    for (const k of Object.keys(t)) if (k.slice(4) === "13" && t[k] > -900) ann[k.slice(0, 4)] = t[k];
    const ys = Object.keys(ann).sort();
    const xm = meanOf(ys.map(Number));
    const ym = meanOf(ys.map((y) => ann[y]));
    const slope = ys.reduce((s, y) => s + (+y - xm) * (ann[y] - ym), 0) / ys.reduce((s, y) => s + (+y - xm) ** 2, 0);
    const min = Math.min(...ys.map((y) => ann[y]));
    setSeries({ shifted: Object.fromEntries(ys.map((y) => [y, +(ann[y] - min + 0.2).toFixed(2)])), slope, mean: ym, min });
  };

  // Places without a snapshot (picked on the map) load the climatology at once.
  useEffect(() => {
    if (!p.power) void refresh();
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = pw?.data;
  const cell = "border-b border-border px-2 py-1.5 text-right tabular";
  return (
    <>
      {failed ? <Offline what={failed} /> : null}
      {!c && loading === "clim" ? <p className="text-subtle">Se încarcă climatologia NASA POWER…</p> : null}
      {c ? (
        <>
          <KeyValues
            className="mb-4"
            rows={[
              ["Temperatura medie anuală", `${fmt(meanOf(c.t), 1)} °C`],
              ["Precipitații anuale", `${fmt(c.p.reduce((s, v) => s + v, 0))} mm`],
              ["Luna cea mai caldă", `${MONTHS[c.t.indexOf(Math.max(...c.t))]} · ${fmt(Math.max(...c.t), 1)} °C`],
              ["Luna cea mai rece", `${MONTHS[c.t.indexOf(Math.min(...c.t))]} · ${fmt(Math.min(...c.t), 1)} °C`],
            ]}
          />
          <div className="mb-2 flex flex-wrap items-center gap-3">
            {pw.live ? <Live /> : <Snap />}
            <Button variant="outline" size="site-sm" onClick={refresh} disabled={loading === "clim"}>
              {loading === "clim" ? "Se încarcă…" : "Actualizează live"}
            </Button>
          </div>
          <Climograph main={c} compare={p.clim} label={`Climograma pentru ${p.ro}`} />
          <ClimographLegend compare={p.clim ? `Temperatura din DEIMS (${p.clim.period ?? ""})` : undefined} />
          <div className="my-3.5 overflow-x-auto rounded-[10px] border border-border">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="text-[12px] text-subtle uppercase">
                  <th className="border-b border-border px-2 py-2" />
                  {MONTHS.map((m) => (
                    <th key={m} className="border-b border-border px-2 py-2 text-right font-semibold">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["T medie °C", c.t],
                    ["T minimă a lunii °C", c.tmin],
                    ["T maximă a lunii °C", c.tmax],
                    ["Precipitații mm", c.p],
                    ["Radiație kWh/m²/zi", c.rad],
                    ["DEIMS T °C", p.clim?.t],
                    ["DEIMS P mm", p.clim?.p],
                  ] as [string, number[] | undefined][]
                )
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <tr key={label}>
                      <td className="border-b border-border px-2 py-1.5 whitespace-nowrap">{label}</td>
                      {v!.map((x, i) => (
                        <td key={i} className={cell}>{x}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-subtle">{c.src ?? "NASA POWER"}. NASA POWER folosește o grilă de aproximativ 50 km, deci valorile descriu regiunea, nu microclimatul stației.</p>
        </>
      ) : null}
      <Section title="Seria anuală 1991–2024" className="mt-8">
        <p className="-mt-1.5 mb-3 text-subtle">Temperatura medie a fiecărui an, din NASA POWER, ca să vedeți tendința de încălzire în acest loc.</p>
        {series ? (
          <>
            <Live />
            <p className="my-2">
              <b>
                Tendință: {series.slope > 0 ? "+" : ""}
                {fmt(series.slope * 10, 2)} °C pe deceniu
              </b>{" "}
              · media perioadei {fmt(series.mean, 1)} °C
            </p>
            <YearBars data={series.shifted} label="Temperatura medie anuală" />
            <p className="text-[13px] text-subtle">Barele arată diferența față de anul cel mai rece din serie ({fmt(series.min, 1)} °C). Sursa: NASA POWER, serie lunară MERRA-2.</p>
          </>
        ) : (
          <Button variant="dark" size="site-sm" onClick={loadSeries} disabled={loading === "series"}>
            {loading === "series" ? "Se încarcă…" : "Încarcă seria anuală"}
          </Button>
        )}
      </Section>
    </>
  );
}

/* ---------------------------------------------------------------- Biodiversitate */
interface LiveSpecies extends LwSpecies {
  photo?: string;
}
function SpeciesGrid({ list }: { list: LiveSpecies[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
      {list.map((t) => {
        const img = t.img ? `${import.meta.env.BASE_URL}${t.img}` : t.photo;
        return (
          <a key={t.taxon} href={`https://www.inaturalist.org/taxa/${t.taxon}`} target="_blank" rel="noreferrer" className="flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface hover:border-accent">
            {img ? (
              <img loading="lazy" src={img} alt={commonName(t) || t.name} title={t.credit ?? ""} className="aspect-square w-full bg-surface-3 object-cover" />
            ) : (
              <span className="grid aspect-square place-items-center bg-surface-3 p-2 text-center text-[12px] text-subtle">{t.group || "Fără fotografie liberă"}</span>
            )}
            <div className="px-2.5 py-2 text-[13px] leading-[1.35]">
              {commonName(t) || t.name}
              <i className="block text-[12px] text-subtle">{t.name}</i>
              <em className="font-bold text-[#2f7d4f] not-italic dark:text-accent">{fmt(t.count)} obs.</em>
              {t.status ? <Tag tone="warn" className="ml-1.5 px-1.5 py-0 text-[11px]">{t.status.toUpperCase()}</Tag> : null}
            </div>
          </a>
        );
      })}
    </div>
  );
}

type Recent = { id: number; photo: string; name: string; date: string; user: string };
function Biodiversity({ p }: { p: LwPoint }) {
  const i = p.inat;
  const [stats, setStats] = useState<{ obs?: number | null; sp?: number | null; gbif?: number | null; live: boolean }>({ obs: i?.obs, sp: i?.species, gbif: p.gbif?.occ, live: false });
  const [groups, setGroups] = useState(i?.groups ?? []);
  const [top, setTop] = useState<LiveSpecies[]>(i?.top ?? []);
  const [years, setYears] = useState<Record<string, number> | null>(null);
  const [recent, setRecent] = useState<Recent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setFailed(false);
    const q = `${bboxQuery(p)}&verifiable=true`;
    const api = "https://api.inaturalist.org/v1/observations";
    const [s, ic, h, r, g] = await Promise.all([
      live<{ total_results: number; results: { count: number; taxon: { id: number; name: string; preferred_common_name?: string; default_photo?: { medium_url?: string; url?: string; attribution?: string }; iconic_taxon_name?: string; conservation_status?: { status?: string } } }[] }>(`${api}/species_counts?${q}&per_page=24&locale=${isEn() ? "en" : "ro"}`),
      live<{ results: { count: number; taxon: { name: string; preferred_common_name?: string } }[] }>(`${api}/iconic_taxa_species_counts?${q}&locale=${isEn() ? "en" : "ro"}`),
      live<{ results: { year: Record<string, number> } }>(`${api}/histogram?${q}&interval=year&date_field=observed`),
      live<{ total_results: number; results: { id: number; observed_on?: string; user?: { login?: string }; photos?: { url?: string }[]; taxon?: { name?: string; preferred_common_name?: string } }[] }>(`${api}?${q}&per_page=12&order_by=observed_on&photos=true&locale=${isEn() ? "en" : "ro"}`),
      live<{ count: number }>(`https://api.gbif.org/v1/occurrence/search?limit=0&decimalLatitude=${p.aoi[0]},${p.aoi[2]}&decimalLongitude=${p.aoi[1]},${p.aoi[3]}`),
    ]);
    setLoading(false);
    if (!s) return setFailed(true);
    setStats({ obs: r?.total_results ?? null, sp: s.total_results, gbif: g?.count ?? null, live: true });
    setTop(
      s.results.map((x) => ({
        name: x.taxon.name,
        common: x.taxon.preferred_common_name,
        common_en: x.taxon.preferred_common_name,
        count: x.count,
        taxon: x.taxon.id,
        photo: x.taxon.default_photo?.medium_url || x.taxon.default_photo?.url,
        credit: x.taxon.default_photo?.attribution,
        group: x.taxon.iconic_taxon_name,
        status: x.taxon.conservation_status?.status ?? null,
      })),
    );
    if (ic) setGroups(ic.results.slice(0, 10).map((x) => ({ g: x.taxon.preferred_common_name || x.taxon.name, n: x.count })));
    if (h?.results?.year) setYears(Object.fromEntries(Object.entries(h.results.year).filter(([k]) => +k.slice(0, 4) >= 2005).map(([k, v]) => [k.slice(0, 4), v])));
    if (r)
      setRecent(
        r.results.map((o) => ({ id: o.id, photo: (o.photos?.[0]?.url ?? "").replace("square", "small"), name: o.taxon?.preferred_common_name || o.taxon?.name || "Neidentificat", date: o.observed_on ?? "", user: o.user?.login ?? "" })),
      );
  };

  useEffect(() => {
    if (!p.inat) void refresh();
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {failed ? <Offline what="datele iNaturalist" /> : null}
      {stats.live ? <Live /> : loading && !p.inat ? <p className="text-subtle">Se încarcă datele iNaturalist și GBIF…</p> : <Snap />}
      <KeyValues
        className="mt-2"
        rows={[
          ["Observații iNaturalist", fmt(stats.obs)],
          ["Specii iNaturalist", fmt(stats.sp)],
          ["Ocurențe GBIF", fmt(stats.gbif)],
        ]}
      />
      <div className="mt-3 mb-6 flex flex-wrap gap-2">
        <Button variant="dark" size="site-sm" onClick={refresh} disabled={loading}>
          {loading ? "Se încarcă…" : "Actualizează live"}
        </Button>
        <Button asChild variant="outline" size="site-sm">
          <a href={inatUrl(p)} target="_blank" rel="noreferrer">
            Toate observațiile pe iNaturalist <ArrowUpRight />
          </a>
        </Button>
        <Button asChild variant="outline" size="site-sm">
          <a href={gbifUrl(p)} target="_blank" rel="noreferrer">
            Ocurențe în GBIF <ArrowUpRight />
          </a>
        </Button>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-2">
        <div>
          <H3>Specii pe grupuri</H3>
          {groups.length ? <Bars rows={groups} /> : <p className="text-subtle">Fără date.</p>}
        </div>
        <div>
          <H3>Observații pe ani</H3>
          {years ? <YearBars data={years} label="Observații iNaturalist pe ani" /> : <p className="text-[13px] text-subtle">Apăsați „Actualizează live” ca să încărcați histograma.</p>}
        </div>
      </div>
      <Section title="Cele mai observate specii" className="mt-8">
        {top.length ? <SpeciesGrid list={top} /> : <p className="text-subtle">Nicio specie înregistrată în zonă.</p>}
      </Section>
      <Section title="Observații recente" className="mt-8">
        {recent ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {recent.map((o) => (
              <a key={o.id} href={`https://www.inaturalist.org/observations/${o.id}`} target="_blank" rel="noreferrer" className="flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface hover:border-accent">
                {o.photo ? <img loading="lazy" src={o.photo} alt={o.name} className="aspect-square w-full bg-surface-3 object-cover" /> : <span className="grid aspect-square place-items-center bg-surface-3 text-[12px] text-subtle">Fără fotografie</span>}
                <div className="px-2.5 py-2 text-[13px] leading-[1.35]">
                  {o.name}
                  <i className="block text-[12px] text-subtle">
                    {o.date} · {o.user}
                  </i>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-subtle">Disponibile după „Actualizează live”.</p>
        )}
      </Section>
      <p className="mt-5 text-[13px] text-subtle">Zona analizată este dreptunghiul punctat de pe hartă, care încadrează limitele sitului. Sunt incluse doar observațiile verificabile.</p>
    </>
  );
}

/* ---------------------------------------------------------------- eLTER și ICOS */
function SensorNetwork({ p }: { p: LwPoint }) {
  const l = p.ltser!;
  const place = placeText(p);
  return (
    <div className="mb-7">
      <H3>Rețeaua de senzori LifeWatch</H3>
      <p className="mb-3 max-w-[820px] text-[15.5px] leading-[1.6] text-muted">{`${place ? `Stația se află la ${place}. ` : ""}În LTSER Explorer apare cu codul ${l.code}, iar instrumentele instalate aici sunt următoarele.`}</p>
      <div className="mb-4 overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full border-collapse text-[14px]">
          <tbody>
            {l.nets.map((n) => (
              <tr key={n} className="align-top">
                <td className="border-b border-border px-2.5 py-2 font-semibold whitespace-nowrap">{NETS[n].t}</td>
                <td className="border-b border-border px-2.5 py-2 text-muted">{NETS[n].d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button asChild variant="dark" size="site-sm">
          <a href={LTSER_URL} target="_blank" rel="noreferrer">
            Deschide LTSER Explorer <ArrowUpRight />
          </a>
        </Button>
        <Button asChild variant="outline" size="site-sm">
          <Link to="infrastructura" hash="ltser-explorer">Cum se folosește</Link>
        </Button>
      </div>
      <p className="text-[13px] text-subtle">{`În portal, alegeți fila Lifewatch networks, apoi rețeaua și stația ${l.code}. Fila Data arată graficele, iar pentru stațiile meteo și imaginile camerei.`}</p>
    </div>
  );
}

function Networks({ p }: { p: LwPoint }) {
  const rel = relatedOf(p);
  if (p.custom) return <p className="text-subtle">Punctele libere nu au înregistrări în rețelele eLTER sau ICOS. Alegeți un sit din listă.</p>;
  const has = p.cat === "icos" || p.cat === "icos-cat" || p.cat === "statiune" || p.networks?.length || p.observed?.length || p.deims || p.ltser;
  if (!has) return <p className="text-subtle">Fără informații de rețea pentru acest loc.</p>;
  return (
    <>
      {p.ltser ? <SensorNetwork p={p} /> : null}
      {p.cat === "icos" && p.deims ? (
        <Note className="mb-5">
          <b>Stație de flux ecosistemic.</b> Turnul de covarianță turbulentă măsoară schimburile de CO₂, vapori de apă și energie dintre ecosistem și atmosferă. Datele validate se publică prin ICOS Carbon Portal.
        </Note>
      ) : null}
      {p.cat === "icos-cat" ? (
        <>
          <p className="mb-4 text-[17px] leading-[1.65] text-muted">{p.text}</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <Button asChild variant="dark" size="site-sm">
              <a href={p.link} target="_blank" rel="noreferrer">Fișa ICOS <ArrowUpRight /></a>
            </Button>
            <Button asChild variant="outline" size="site-sm">
              <a href="https://data.icos-cp.eu/portal/" target="_blank" rel="noreferrer">ICOS Carbon Portal <ArrowUpRight /></a>
            </Button>
          </div>
        </>
      ) : null}
      {p.cat === "statiune" ? (
        <>
          <p className="mb-4 max-w-[780px] text-[17px] leading-[1.65] text-muted">Stațiunile Universității din București nu au fișe proprii în DEIMS. Datele lor se raportează prin siturile pe termen lung asociate.</p>
          {rel.length ? (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {rel.map((r) => (
                <ChipLink key={r.key} href={pageHref(sheetKey(r))}>{r.ro}</ChipLink>
              ))}
            </div>
          ) : (
            <p className="mb-5 text-subtle">Un sit DEIMS pentru zona Porțile de Fier ar completa rețeaua.</p>
          )}
        </>
      ) : null}
      {p.networks?.length ? (
        <Section title="Afilieri în rețele">
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="text-left text-[12px] tracking-[0.05em] text-subtle uppercase">
                  <th className="border-b border-border px-2.5 py-2.5 font-semibold">Rețea</th>
                  <th className="border-b border-border px-2.5 py-2.5 font-semibold">Cod de sit</th>
                </tr>
              </thead>
              <tbody>
                {p.networks.map((n) => (
                  <tr key={n.name}>
                    <td className="border-b border-border px-2.5 py-2">{n.name}</td>
                    <td className="border-b border-border px-2.5 py-2">{n.code ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
      {p.observed?.length ? (
        <Section title="Ce se măsoară aici" note={`${p.observed.length} variabile, vocabular EnvThes`}>
          <Chips items={p.observed} />
        </Section>
      ) : null}
      {p.design && (p.design.obs || p.design.exp) ? (
        <KeyValues className="mt-6" rows={[["Observații", p.design.obs], ["Experimente", p.design.exp]]} />
      ) : null}
      {p.deims ? (
        <Section title="Legături">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="site-sm">
              <a href={p.deims} target="_blank" rel="noreferrer">Fișa DEIMS-SDR <ArrowUpRight /></a>
            </Button>
            <Button asChild variant="outline" size="site-sm">
              <a href={`https://deims.org/api/sites/${p.id}`} target="_blank" rel="noreferrer">JSON DEIMS <ArrowUpRight /></a>
            </Button>
            <Button asChild variant="outline" size="site-sm">
              <a href="https://elter-ri.eu/" target="_blank" rel="noreferrer">eLTER RI <ArrowUpRight /></a>
            </Button>
            {p.cat === "icos" ? (
              <Button asChild variant="outline" size="site-sm">
                <a href="https://data.icos-cp.eu/portal/" target="_blank" rel="noreferrer">ICOS Carbon Portal <ArrowUpRight /></a>
              </Button>
            ) : null}
          </div>
        </Section>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- Date și API */
function DataApi({ p }: { p: LwPoint }) {
  const json = useMemo(() => JSON.stringify(p, null, 2), [p]);
  const [msg, setMsg] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [json]);
  const [s, w, n, e] = p.aoi;
  const apiId = apiStationId(p);
  const calls: [string, string][] = [
    ...(p.deims ? [["DEIMS-SDR, fișa completă a sitului", `curl "https://deims.org/api/sites/${p.id}"`] as [string, string]] : []),
    ["iNaturalist, specii în zona sitului", `curl "https://api.inaturalist.org/v1/observations/species_counts?${bboxQuery(p)}&verifiable=true"`],
    ["GBIF, număr de ocurențe", `curl "https://api.gbif.org/v1/occurrence/search?limit=0&decimalLatitude=${s},${n}&decimalLongitude=${w},${e}"`],
    ["NASA POWER, climatologie lunară", `curl "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=AG&latitude=${p.lat}&longitude=${p.lon}&format=JSON"`],
    (apiId
      ? [
          `API LifeWatch România, ultimele măsurători ale stației ${p.ltser!.code}`,
          `curl "https://[domeniu-api-lifewatch]/stations/${apiId}/measurements?${p.cat === "icos" ? "variables=co2_molar_fraction&variables=h2o_molar_fraction" : "variables=air_temperature&variables=air_humidity"}"`,
        ]
      : ["API LifeWatch România, lista stațiilor din teren", `curl "https://[domeniu-api-lifewatch]/stations"`]) as [string, string],
  ];
  const pre = "overflow-x-auto rounded-lg bg-[#13212b] px-4 py-3.5 font-mono text-[12.5px] whitespace-pre text-lime";
  return (
    <>
      <H3>Fișa sitului în format JSON</H3>
      <p className="-mt-1.5 mb-3 text-subtle">Toate datele afișate pe această pagină pentru acest loc.</p>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <Button
          variant="dark"
          size="site-sm"
          onClick={() =>
            navigator.clipboard?.writeText(json).then(
              () => setMsg("Copiat."),
              () => setMsg("Copierea nu este permisă aici; selectați textul de mai jos."),
            ) ?? setMsg("Copierea nu este disponibilă; selectați textul de mai jos.")
          }
        >
          Copiază JSON
        </Button>
        <Button asChild variant="outline" size="site-sm">
          <a href={url ?? undefined} download={`${p.custom ? `punct-${p.lat}-${p.lon}` : p.slug}.json`}>Descarcă JSON</a>
        </Button>
        <span role="status" className="text-[13px] text-subtle">{msg}</span>
      </div>
      <pre className={cn(pre, "max-h-[320px]")}>{json.slice(0, 20000)}{json.length > 20000 ? "\n…" : ""}</pre>
      <H3 className="mt-7">Cereri API pentru același loc</H3>
      {calls.map(([t, c]) => (
        <div key={t}>
          <p className="mt-3.5 mb-1.5 font-semibold">{t}</p>
          <pre className={pre}>{c}</pre>
        </div>
      ))}
      <p className="mt-3 text-[13px] text-subtle">
        {apiId
          ? "Fără since și until, serviciul întoarce ultimele două ore înregistrate. Cu ele se poate cere un interval de cel mult 7 zile, în format ISO 8601."
          : "Măsurătorile unei stații se cer apoi cu /stations/{id}/measurements, folosind id-ul din listă."}{" "}
        Domeniul API-ului LifeWatch România se completează după publicarea serviciului.{" "}
        <Link to="date/api" className="font-semibold text-[#2f7d4f] hover:underline dark:text-accent">
          Toate rutele API
        </Link>
      </p>
      {p.ltser ? (
        <>
          <H3 className="mt-7">Măsurătorile din teren</H3>
          <p className="mb-3 max-w-[820px] text-[15px] leading-[1.6] text-muted">{`Seriile de timp ale stației ${p.ltser.code} se consultă și se descarcă din LTSER Explorer, fila Lifewatch networks. Portalul folosește HTTP, așa că unele browsere afișează un avertisment la deschidere.`}</p>
          <Button asChild variant="dark" size="site-sm">
            <a href={LTSER_URL} target="_blank" rel="noreferrer">
              Deschide LTSER Explorer <ArrowUpRight />
            </a>
          </Button>
        </>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- Page */
export function SiteSheetPage({ point }: { point: LwPoint }) {
  const { navigate } = useRouter();
  // A place picked on the map replaces the sheet until a marker or the list is used again.
  const [custom, setCustom] = useState<LwPoint | null>(null);
  const p = custom ?? point;
  const [tab, setTab] = useState<TabId>(lastTab);
  const [base, setBase] = useState<BaseName>("osm");
  const [eea, setEea] = useState<string[]>([]);
  const [eeaFail, setEeaFail] = useState<string | null>(null);
  const choose = (t: TabId) => {
    lastTab = t;
    setTab(t);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (j == null) return;
    e.preventDefault();
    const next = TABS[(j + TABS.length) % TABS.length];
    choose(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  const station = STATION_SLUG[p.id];

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <SiteList current={point} />
      <div className="min-w-0">
        <MobilePicker current={point} />
        <div className="relative">
          <LwMap
            points={LW_POINTS}
            selected={p}
            base={base}
            eea={eea}
            onSelect={(x) => (x.key === point.key ? setCustom(null) : navigate(pageHref(sheetKey(x))))}
            onMapClick={(lat, lon) => setCustom(customPoint(lat, lon))}
            onEea={(k, ok) => setEeaFail(ok ? null : EEA[k].label)}
            scrollZoom="always"
            label={`Harta: ${p.ro}`}
            className="h-[340px] sm:h-[420px]"
          />
          <BaseSwitch value={base} onChange={setBase} floating thematic className="absolute top-2.5 right-14 left-2.5 z-[500]" />
        </div>
        <p className="border-b border-border px-5 py-2 text-[13px] text-subtle sm:px-7">Apăsați oriunde pe hartă ca să analizați un punct ales de dvs.: climă, biodiversitate și situri Natura 2000 din jur.</p>
        <Container className="!max-w-none !px-5 sm:!px-7">
          <div className="flex flex-wrap items-start justify-between gap-3.5 pt-5">
            <div className="grid gap-1.5">
              {p.custom ? <Tag className="w-fit">Punct liber</Tag> : <PointTags p={p} ours />}
              <h1 className="mt-1 font-display text-[28px] leading-[1.15] font-bold sm:text-[30px]">{p.ro}</h1>
              <p className="text-[13px] text-subtle">
                {p.fullName && p.fullName !== p.ro ? `${p.fullName} · ` : ""}
                {p.lat.toFixed(4)}° N, {p.lon.toFixed(4)}° E{p.approx ? " (aproximativ)" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.custom ? (
                <Button variant="dark" size="site-sm" onClick={() => setCustom(null)}>
                  Înapoi la {point.ro}
                </Button>
              ) : null}
              {p.ltser ? (
                <Button asChild variant="dark" size="site-sm">
                  <a href={LTSER_URL} target="_blank" rel="noreferrer">
                    Date în LTSER Explorer <ArrowUpRight />
                  </a>
                </Button>
              ) : null}
              {station ? (
                <Button asChild variant="dark" size="site-sm">
                  <Link to={`statiuni/${station}`}>Pagina stațiunii</Link>
                </Button>
              ) : null}
              {PLATFORM_OF[p.key] ? (
                <Button asChild variant="dark" size="site-sm">
                  <Link to={`platforme/${PLATFORM_OF[p.key]}`}>Pagina platformei</Link>
                </Button>
              ) : null}
              {p.deims ? (
                <Button asChild variant="outline" size="site-sm">
                  <a href={p.deims} target="_blank" rel="noreferrer">DEIMS <ArrowUpRight /></a>
                </Button>
              ) : null}
              {p.link ? (
                <Button asChild variant="outline" size="site-sm">
                  <a href={p.link} target="_blank" rel="noreferrer">{p.cat === "icos-cat" ? "ICOS" : "Pagina UB"} <ArrowUpRight /></a>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="site-sm">
                <a href={inatUrl(p)} target="_blank" rel="noreferrer">iNaturalist <ArrowUpRight /></a>
              </Button>
            </div>
          </div>
        </Container>
        <div role="tablist" aria-label="Instrumente" className="mt-4 flex gap-0.5 overflow-x-auto border-b border-border px-5 sm:px-7">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className="min-h-[46px] shrink-0 border-b-[3px] border-transparent px-3.5 text-[15px] font-semibold text-subtle hover:text-foreground aria-selected:border-accent aria-selected:text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
        <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="px-5 pt-6 pb-14 sm:px-7">
          {tab === "prezentare" ? <Overview key={p.key} p={p} /> : null}
          {tab === "habitate" ? <Habitats key={p.key} p={p} eea={eea} setEea={setEea} eeaFail={eeaFail} /> : null}
          {tab === "clima" ? <Climate key={p.key} p={p} /> : null}
          {tab === "biodiversitate" ? <Biodiversity key={p.key} p={p} /> : null}
          {tab === "retele" ? <Networks key={p.key} p={p} /> : null}
          {tab === "date" ? <DataApi key={p.key} p={p} /> : null}
        </section>
      </div>
    </div>
  );
}
