// LifeWatch networks, metadata (ltser sections/ui_metadata.R + server_metadata.R).
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { NETWORKS, NETWORK_DESCRIPTIONS, type Network } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks, type StationFeature } from "@/lib/geo";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { ltser } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { ltserLayer, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml, glyphSvg, pinSvg } from "@/components/map/glyphs";
import { DataTable, type TableColumn } from "@/components/data-table";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/photo";
import type { ViewProps } from "@/explorer-routes";

const coords = (f: StationFeature) => `${fmtNum(f.geometry.coordinates[1], 5)}° N, ${fmtNum(f.geometry.coordinates[0], 5)}° E`;
type Row = { name: string; locality: string; county: string; parameters: string; coordinates: string };

/** Network descriptions are trusted static HTML from the catalog (ul, li, br only). */
function Description({ html }: { html: string }) {
  const parts = html.split(/<br>/);
  return (
    <div className="grid gap-2.5 text-[13px] leading-relaxed text-muted">
      {parts.map((p, i) => {
        const list = p.match(/^(.*?)<ul>(.*)<\/ul>(.*)$/s);
        if (!list) return <p key={i}>{p}</p>;
        const items = [...list[2].matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
        return (
          <div key={i} className="grid gap-1.5">
            {list[1] ? <p>{list[1]}</p> : null}
            <ul className="grid gap-1 pl-4 [list-style:disc]">{items.map((it) => <li key={it}>{it}</li>)}</ul>
            {list[3] ? <p>{list[3]}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function NetworkMetadata(_: ViewProps) {
  const { t, L: lbl, lang } = useI18n();
  const [netId, setNetId] = useState<Network["id"]>("ws");
  const [selected, setSelected] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const networks = useAsync(() => loadNetworks(), []);
  const areas = useAsync(() => loadLtserAreas(), []);
  const net = NETWORKS.find((n) => n.id === netId)!;
  const features = useMemo(() => networks.data?.[netId].features ?? [], [networks.data, netId]);
  const feature = features.find((f) => f.properties.name === selected) ?? null;
  const photo = useAsync(() => (feature ? ltser.photoUrl(netId, feature.properties.name) : null), [netId, feature?.properties.name]);

  const markers = useMemo(() => L.layerGroup(), []);
  useEffect(() => {
    markers.clearLayers();
    for (const f of features) {
      const sel = f.properties.name === selected;
      L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], {
        icon: L.divIcon({ className: `pm ${sel ? "is-selected" : ""}`, iconSize: [22, 30], iconAnchor: [11, 30], html: `<div class="pm__pin">${pinSvg(net.color)}<span class="pm__label">${escapeHtml(f.properties.name)}</span></div>` }),
        riseOnHover: true,
        zIndexOffset: sel ? 600 : 0,
      })
        .bindTooltip(`<b>${escapeHtml(f.properties.name)}</b><span class="sub">${escapeHtml(f.properties.locality)}, ${escapeHtml(f.properties.county)}</span><span class="hint">${escapeHtml(t("map.clickInfo"))}</span>`, { className: "lt-tip", direction: "top", offset: [0, -30] })
        .on("click", () => setSelected(f.properties.name))
        .addTo(markers);
    }
  }, [features, selected, net, markers, t]);

  useEffect(() => {
    if (!map || !features.length) return;
    const pts = features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number]);
    if (pts.length === 1) map.flyTo(pts[0], 9, { duration: 0.6 });
    else map.flyToBounds(L.latLngBounds(pts), { padding: [70, 70], duration: 0.6, maxZoom: 9 });
  }, [map, features]);

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [{ id: "network", label: t("map.network"), layer: markers }];
    if (areas.data) list.push({ id: "ltser", label: t("map.ltser"), layer: ltserLayer(areas.data, { opacity: 0.8, areaName: (f) => f.properties.name }), defaultVisible: false });
    return list;
  }, [markers, areas.data, t]);

  const rows = features.map<Row>((f) => ({ name: f.properties.name, locality: f.properties.locality, county: f.properties.county, parameters: f.properties.parameters, coordinates: coords(f) }));
  const columns: TableColumn<Row>[] = [
    { key: "name", label: t("meta.name"), render: (v) => <span className="tabular font-medium">{String(v)}</span> },
    { key: "locality", label: t("meta.locality") },
    { key: "county", label: t("meta.county") },
    { key: "parameters", label: t("meta.parameters"), wrap: true },
    { key: "coordinates", label: t("meta.coordinates"), render: (v) => <span className="tabular">{String(v)}</span> },
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav.net"), t("nav.net.meta")]} title={t("meta.title")} description={t("meta.lede")} actions={<SourceBadge backend="ltser" />} />
      <SectionTabs group="net" active="retele/metadate" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap className="h-[440px] xl:h-[min(72dvh,760px)]" maxZoom={18} onReady={setMap} caption={{ title: lbl(net), sub: t("meta.stationsCount", { n: features.length }) }} overlays={overlays} />
          </MapCard>
        }
        aside={
          <>
            <Card className="p-1.5">
              <ul role="radiogroup" aria-label={t("meta.network")} className="grid">
                {NETWORKS.map((n) => {
                  const on = n.id === netId;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setNetId(n.id);
                          setSelected(null);
                        }}
                        className="relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-surface-2/70"
                      >
                        {on ? <motion.span layoutId="net-active" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 rounded-[10px] bg-surface-2 ring-1 ring-border" /> : null}
                        <span className="relative inline-flex" dangerouslySetInnerHTML={{ __html: glyphSvg(n.shape, n.color, 14) }} />
                        <span className={cn("relative flex-1", on ? "font-medium text-foreground" : "text-muted")}>{lbl(n)}</span>
                        <span className="tabular relative text-xs text-subtle">{networks.data?.[n.id].features.length ?? ""}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card>
              <CardHeader title={t("meta.about")} description={lbl(net)} />
              <CardBody>
                <Description html={NETWORK_DESCRIPTIONS[netId][lang]} />
              </CardBody>
            </Card>
          </>
        }
      />

      <Card className="mt-4">
        {feature ? (
          <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <div className="grid content-start gap-4">
              <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setSelected(null)}>
                <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
                {t("meta.backToAll")}
              </Button>
              <div>
                <p className="text-xs text-subtle">{lbl(net)}</p>
                <h2 className="tabular text-2xl font-semibold tracking-tight">{feature.properties.name}</h2>
                <p className="text-[13px] text-muted">{feature.properties.locality}, {feature.properties.county}</p>
              </div>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2.5 text-[13px]">
                {[
                  [t("meta.name"), feature.properties.name],
                  [t("meta.locality"), feature.properties.locality],
                  [t("meta.county"), feature.properties.county],
                  [t("meta.parameters"), feature.properties.parameters],
                  [t("meta.coordinates"), coords(feature)],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-xs text-subtle">{k}</dt>
                    <dd className={k === t("meta.coordinates") ? "tabular" : ""}>{v || "n/d"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Photo src={photo.data ?? null} alt={feature.properties.name} fallback={t("meta.noPhoto")} className="aspect-[4/3] rounded-[10px]" />
          </div>
        ) : (
          <>
            <CardHeader title={t("meta.allStations", { net: lbl(net) })} description={t("table.rowsCount", { n: rows.length })} />
            <CardBody>
              <DataTable columns={columns} rows={rows} filename={`metadate_${netId}`} initialPageSize={25} onRowClick={(r) => setSelected(r.name)} />
            </CardBody>
          </>
        )}
      </Card>
    </div>
  );
}
