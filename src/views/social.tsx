// Social indicators by administrative unit (ltser sections/ui_social.R + server_social.R).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { AGES, GENDERS, LTSER_AREAS, LTSER_BY_NAME, SOCIAL_INDICATORS, type SocialIndicator } from "@/lib/catalog";
import { loadNetworks, loadUats, type AreaFeature } from "@/lib/geo";
import { indicatorScale } from "@/lib/palettes";
import { fmtInt, wallToMs } from "@/lib/format";
import { downloadGeoJSON } from "@/lib/export";
import { SERIES } from "@/lib/chart-colors";
import { useAsync } from "@/hooks/use-async";
import { ltser } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { networkOverlays, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml } from "@/components/map/glyphs";
import { TimeSeriesPanel } from "@/components/charts/time-series";
import { MapCard, PageHeader, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Callout, Field } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

export default function Social(_: ViewProps) {
  const { t, L: lbl } = useI18n();
  const [indicatorId, setIndicatorId] = useState<SocialIndicator["id"]>("pop108d");
  const [years, setYears] = useState<Record<string, number>>({ pop108d: 2022, pop309e: 2021 });
  const [sex, setSex] = useState(3);
  const [age, setAge] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const ind = SOCIAL_INDICATORS.find((i) => i.id === indicatorId)!;
  const year = years[indicatorId];
  const params = ind.hasSexAge ? { year, sex, age } : { year };

  const uats = useAsync(() => loadUats(), []);
  const networks = useAsync(() => loadNetworks(), []);
  const values = useAsync(() => ltser.socialValues(indicatorId, params), [indicatorId, year, sex, age]);
  // Units without a value are shown as 0, like the original mutate(value = ifelse(is.na(value), 0, value)).
  const valueMap = useMemo(() => new Map((values.data ?? []).map((r) => [String(r.uat), r.value ?? 0])), [values.data]);
  const scale = useMemo(() => {
    if (!uats.data || !values.data) return null;
    const vals = uats.data.features.map((f) => valueMap.get(f.properties.natcode) ?? 0);
    return indicatorScale(indicatorId, [Math.min(...vals), Math.max(...vals)]);
  }, [uats.data, values.data, valueMap, indicatorId]);

  // The original picks a random unit whenever the indicator, gender or age changes.
  useEffect(() => {
    if (!uats.data) return;
    const ids = uats.data.features.map((f) => f.properties.natcode);
    setSelected(ids[Math.floor(Math.random() * ids.length)]);
  }, [uats.data, indicatorId, sex, age]);

  const ctx = useRef({ valueMap, scale, selected });
  ctx.current = { valueMap, scale, selected };
  const styleFor = (f: AreaFeature): L.PathOptions => {
    const c = ctx.current;
    const sel = f.properties.natcode === c.selected;
    return { fillColor: c.scale ? c.scale.scale.color(c.valueMap.get(f.properties.natcode) ?? 0) : "transparent", fillOpacity: 0.8, color: sel ? "#254380" : "#8b8b93", weight: sel ? 2.5 : 0.5, opacity: sel ? 1 : 0.7 };
  };
  const areaOf = (f: AreaFeature) => lbl(LTSER_AREAS[LTSER_BY_NAME[String(f.properties.ltser)]]) || String(f.properties.ltser ?? "");

  const layer = useMemo(() => {
    if (!uats.data) return null;
    return L.geoJSON(uats.data as unknown as GeoJSON.FeatureCollection, {
      pane: "unitsPane",
      style: (f) => styleFor(f as unknown as AreaFeature),
      onEachFeature: (feat, lyr) => {
        const f = feat as unknown as AreaFeature;
        lyr.bindTooltip(() => `<b>${escapeHtml(f.properties.name)}</b><span class="sub">${escapeHtml(areaOf(f))}</span><span class="num">${escapeHtml(fmtInt(ctx.current.valueMap.get(f.properties.natcode) ?? 0))}</span><span class="hint">${escapeHtml(t("map.clickSeries"))}</span>`, { className: "lt-tip", sticky: true });
        const path = lyr as L.Path;
        path.on("mouseover", () => {
          path.setStyle({ weight: 2, color: "#52525b", fillOpacity: 0.2 });
          path.bringToFront();
        });
        path.on("mouseout", () => path.setStyle(styleFor(f)));
        path.on("click", () => setSelected(f.properties.natcode));
      },
    });
  }, [uats.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    layer?.eachLayer((l) => {
      const f = (l as L.GeoJSON & { feature: AreaFeature }).feature;
      (l as L.Path).setStyle(styleFor(f));
      if (f.properties.natcode === selected) (l as L.Path).bringToFront();
    });
  }, [layer, valueMap, scale, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (map && layer) map.fitBounds(layer.getBounds(), { padding: [30, 30] });
  }, [map, layer]);

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [];
    if (layer) list.push({ id: "units", label: t("map.units"), layer });
    if (networks.data) list.push(...networkOverlays(networks.data, lbl));
    return list;
  }, [layer, networks.data, t, lbl]);

  const series = useAsync(() => (selected ? ltser.socialSeries(indicatorId, { uat: selected, ...(ind.hasSexAge ? { sex, age } : {}) }, ind.years) : null), [indicatorId, selected, sex, age]);
  const points = useMemo(() => (series.data ?? []).filter((r) => r.year <= year).sort((a, b) => a.year - b.year).map((r) => [wallToMs(`${r.year}-01-01`), r.value] as [number, number | null]), [series.data, year]);
  const feature = uats.data?.features.find((f) => f.properties.natcode === selected) ?? null;
  const caption = `${year}${ind.hasSexAge ? ` · ${lbl(GENDERS.find((g) => g.id === sex))} · ${lbl(AGES.find((a) => a.id === age))}` : ""}`;

  const exportGeoJSON = () => {
    if (!uats.data) return;
    const file = `${indicatorId}.geojson`;
    downloadGeoJSON(
      {
        type: "FeatureCollection",
        features: uats.data.features.map((f) => ({
          type: "Feature",
          geometry: f.geometry,
          properties: { natcode: f.properties.natcode, name: f.properties.name, county: f.properties.county, ltser: f.properties.ltser, indicator: indicatorId, ...params, value: valueMap.get(f.properties.natcode) ?? 0 },
        })),
      },
      file,
    );
    toast.success(t("table.downloaded", { file }));
  };

  return (
    <div>
      <PageHeader crumbs={[t("nav.social"), t("social.crumb")]} title={t("social.title")} description={t("social.lede")} actions={<SourceBadge backend="ltser" />} />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap
              className="h-[440px] xl:h-[min(78dvh,820px)]"
              onReady={setMap}
              busy={values.loading}
              caption={{ title: lbl(ind), sub: caption }}
              legend={scale ? { title: t("social.persons"), scale: scale.scale, digits: 0 } : null}
              overlays={overlays}
            />
          </MapCard>
        }
        aside={
          <>
            <Card>
              <CardHeader title={t("ui.parameters")} />
              <CardBody className="grid gap-4">
                <Field label={t("social.indicator")}>
                  <Segmented ariaLabel={t("social.indicator")} fill value={indicatorId} onChange={setIndicatorId} options={SOCIAL_INDICATORS.map((i) => ({ value: i.id, label: lbl(i) }))} />
                </Field>
                <Field label={t("social.year")}>
                  <Select ariaLabel={t("social.year")} value={String(year)} onValueChange={(v) => setYears((y) => ({ ...y, [indicatorId]: Number(v) }))} options={ind.years.map((y) => ({ value: String(y), label: String(y) }))} />
                </Field>
                {ind.hasSexAge ? (
                  <>
                    <Field label={t("social.gender")}>
                      <Segmented ariaLabel={t("social.gender")} fill value={sex} onChange={setSex} options={GENDERS.map((g) => ({ value: g.id, label: lbl(g) }))} />
                    </Field>
                    <Field label={t("social.age")}>
                      <Select ariaLabel={t("social.age")} value={String(age)} onValueChange={(v) => setAge(Number(v))} options={AGES.map((a) => ({ value: String(a.id), label: lbl(a) }))} />
                    </Field>
                  </>
                ) : null}
                <Button className="justify-self-start" disabled={!values.data} onClick={exportGeoJSON}>
                  <Download strokeWidth={1.75} />
                  {t("rs.getGeojson")}
                </Button>
                {values.error ? <Callout tone="error" title={t("error.load")}>{errorText(values.error, t)}</Callout> : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={feature?.properties.name ?? t("rs.selectedUnit")} description={feature ? [feature.properties.natLevName, feature.properties.county, areaOf(feature)].filter(Boolean).join(" · ") : undefined} />
              <CardBody className="flex items-baseline gap-2">
                <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{selected ? fmtInt(valueMap.get(selected) ?? 0) : "n/d"}</span>
                <span className="text-xs text-muted">{t("social.persons")} · {year}</span>
                <span className="tabular ml-auto text-[11px] text-subtle">SIRUTA {selected}</span>
              </CardBody>
            </Card>
            <TimeSeriesPanel
              title={feature?.properties.name ?? t("rs.selectedUnit")}
              subtitle={points.length ? `${lbl(ind)} · ${new Date(points[0][0]).getUTCFullYear()} – ${new Date(points[points.length - 1][0]).getUTCFullYear()}` : undefined}
              lanes={points.length ? [[{ key: "v", name: lbl(ind), unit: t("social.persons"), color: SERIES.emerald, type: "area", points }]] : []}
              height={240}
              yearOnly
              loading={series.loading}
              emptyText={t("social.noSeries")}
              filename={`${indicatorId}_${selected ?? "uat"}`}
            />
          </>
        }
      />
      <p className="mt-4 text-xs text-subtle">
        {t("social.source")}{" "}
        <a href="http://statistici.roda.ro/" target="_blank" rel="noopener noreferrer" className="text-muted underline-offset-2 hover:text-foreground hover:underline">statistici.roda.ro</a>
      </p>
    </div>
  );
}
