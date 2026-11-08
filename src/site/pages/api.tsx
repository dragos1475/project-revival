// API reference for the LifeWatch data service, with copyable requests.
import { useEffect, useState } from "react";
import { ENDPOINTS, LIFEWATCH_API_BASE } from "../content/data";
import { Link } from "../router";
import { CodeBlock, ServiceStatus } from "../components/blocks";
import { Container, Crumbs, PageIntro, Reveal } from "../components/primitives";
import { Toc } from "../components/toc";

const slug = (path: string) => path.replace(/[{}]/g, "").replace(/\//g, "-").replace(/^-/, "") || "root";

export default function ApiPage() {
  // The public origin is only known in the browser; the server renders a placeholder.
  const [origin, setOrigin] = useState("https://<domeniu>");
  useEffect(() => setOrigin(window.location.origin), []);
  const base = `${origin}${LIFEWATCH_API_BASE}`;

  return (
    <>
      <PageIntro
        eyebrow="Date și servicii"
        title="API de acces la date"
        lede="Serviciul LifeWatch expune măsurătorile brute ale stațiilor prin cereri HTTP GET, cu răspunsuri JSON. Exploratorul folosește exact aceleași rute."
        crumbs={<Crumbs items={[{ label: "Date", node: <Link to="date" className="hover:text-foreground">Date și servicii</Link> }, { label: "API" }]} />}
      >
        <div className="grid gap-3">
          <ServiceStatus className="w-fit" />
          <CodeBlock code={base} label="Adresa de bază" />
        </div>
      </PageIntro>

      <Container className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="hidden lg:col-span-3 lg:block">
          <Toc items={ENDPOINTS.map((e) => ({ id: slug(e.path), title: e.path }))} label="Rute" layoutId="toc-api" />
        </div>
        <div className="grid min-w-0 gap-6 lg:col-span-9">
          <Reveal className="grid gap-2 rounded-[18px] border border-border bg-surface p-4 shadow-card">
            <h2 className="text-[17px] font-semibold tracking-tight">Note de utilizare</h2>
            <ul className="grid gap-1 text-[14px] leading-relaxed text-muted">
              <li>Ruta /lifewatch-api este servită de pe aceeași adresă ca site-ul, prin proxy, deci funcționează și din browser fără configurare CORS.</li>
              <li>Intervalul unei cereri de măsurători trebuie să fie mai scurt de 7 zile. Răspunsul are cel mult 50.000 de rânduri.</li>
              <li>
                Fusul orar, pasul de timp și valorile lipsă sunt descrise în <Link to="date/documentatie" className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-accent">documentație</Link>.
              </li>
            </ul>
          </Reveal>

          {ENDPOINTS.map((e) => (
            <Reveal key={e.path}>
              <section aria-labelledby={slug(e.path)} className="grid min-w-0 gap-3 border-t border-border pt-5">
                <div className="grid gap-1">
                  <p className="flex items-center gap-2 font-mono text-[13px]">
                    <span className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-1.5 py-0.5 text-[11px] font-medium text-foreground">{e.method}</span>
                    <span id={slug(e.path)} className="scroll-mt-24 text-foreground">{e.path}</span>
                  </p>
                  <h2 className="text-[20px] font-semibold tracking-tight">{e.title}</h2>
                  <p className="max-w-[90ch] text-[14.5px] leading-relaxed text-muted">{e.body}</p>
                </div>
                {e.params ? (
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
                    <thead>
                      <tr className="border-y border-border text-[12px] text-subtle">
                        <th scope="col" className="py-2 pr-4 font-medium">Parametru</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Tip</th>
                        <th scope="col" className="py-2 font-medium">Descriere</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.params.map((p) => (
                        <tr key={p.name} className="border-b border-border align-top">
                          <td className="py-1.5 pr-4 font-mono text-[13px]">{p.name}</td>
                          <td className="py-1.5 pr-4 text-[13px] whitespace-nowrap text-subtle">{p.type}</td>
                          <td className="py-1.5 text-muted">{p.body}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : null}
                <div className="grid min-w-0 gap-2 xl:grid-cols-2">
                  <CodeBlock code={`curl "${base}${e.example}"`} label="Cerere" className="min-w-0" />
                  <CodeBlock code={e.response} label="Răspuns, prescurtat" className="min-w-0" />
                </div>
              </section>
            </Reveal>
          ))}

          <Reveal className="grid gap-2 border-t border-border pt-5">
            <h2 className="text-[20px] font-semibold tracking-tight">Serviciul LTSER</h2>
            <p className="max-w-[90ch] text-[14.5px] leading-relaxed text-muted">
              Teledetecția, valorile agregate ale rețelelor și indicatorii sociali vin de la un al doilea serviciu, publicat la /ltser-api. Contractul lui este documentat împreună cu codul exploratorului. Până la punerea lui în funcțiune, exploratorul afișează aceste module cu date demonstrative, marcate ca atare.
            </p>
          </Reveal>
        </div>
      </Container>
    </>
  );
}
