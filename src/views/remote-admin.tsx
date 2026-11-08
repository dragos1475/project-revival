// Remote sensing, administrative level (ltser sections/ui_admin.R + server_admin.R).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { LTSER_AREAS, LTSER_BY_NAME, RS_INDICATORS } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks, loadUats, type AreaFeature } from "@/lib/geo";
import { indicatorScale } from "@/lib/palettes";
import { fmtMonth, fmtNum, wallToMs } from "@/lib/format";
import { downloadGeoJSON } from "@/lib/export";
import { SERIES } from "@/lib/chart-colors";
import { useAsync } from "@/hooks/use-async";
import { replaceQuery } from "@/hooks/use-route";
import { ltser } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { networkOverlays, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml } from "@/components/map/glyphs";
import { TimeSeriesPanel } from "@/components/charts/time-series";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Segmented } from "@/components/ui/segmented";
import { Callout, Field } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

const YEAR = 365.25 * 86400000;
type Unit = "ltser" | "nut";
type Indicator = (typeof RS_INDICATORS)[number]["id"];

export default function RemoteAdmin({ route }: ViewProps) {
  const { t, L: lbl } = useI18n();
  const [unit, setUnit] = useState<Unit>(route.query.get("unitate") === "nut" ? "nut" : "ltser");
  const [indicator, setIndicator] = useState<Indicator>("ssm");
  const [date, setDate] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [selected, setSelected] = useState<string | null>(route.query.get("id"));
  const [map, setMap] = useState<L.Map | null>(null);
  const meta = RS_INDICATORS.find((i) => i.id === indicator)!;
  const digits = indicator === "ssm" ? 1 : 2;

  const indicators = useAsync(() => ltser.rsIndicators(), []);
  const dates = useMemo(() => indicators.data?.find((d) => d.id === indicator)?.dates ?? [], [indicators.data, indicator]);
  useEffect(() => {
    if (dates.length && (!date || !dates.includes(date))) setDate(dates[dates.length - 1]);
  }, [dates, date]);

  const shapes = useAsync(() => (unit === "ltser" ? loadLtserAreas() : loadUats()), [unit]);
  const networks = useAsync(() => loadNetworks(), []);
  const values = useAsync(() => (date ? ltser.adminValues(unit, indicator, date) : null), [unit, indicator, date]);
  const valueMap = useMemo(() => new Map((values.data ?? []).map((r) => [String(r.id), r.value])), [values.data]);
  const scale = useMemo(() => {
    const vals = (values.data ?? []).map((r) => r.value).filter((v): v is number => v !== null);
    return vals.length ? indicatorScale(indicator, [Math.min(...vals), Math.max(...vals)]) : null;
  }, [values.data, indicator]);

  // A random unit is selected when none is chosen, as in the original observeEvent.
  useEffect(() => {
    if (!values.data?.length) return;
    if (!selected || !valueMap.has(selected)) {
      const ids = [...valueMap.keys()];
      setSelected(ids[Math.floor(Math.random() * ids.length)]);
    }
  }, [values.data, valueMap, selected]);

  const nameOf = (f: AreaFeature) => (unit === "ltser" ? lbl(LTSER_AREAS[Number(f.properties.natcode)]) || f.properties.name : f.properties.name);
  const areaOfUat = (f: AreaFeature) => lbl(LTSER_AREAS[LTSER_BY_NAME[String(f.properties.ltser)]]) || String(f.properties.ltser ?? "");

  const ctx = useRef({ valueMap, scale, opacity, selected, digits, nameOf, areaOfUat, unit });
  ctx.current = { valueMap, scale, opacity, selected, digits, nameOf, areaOfUat, unit };

  const styleFor = (f: AreaFeature): L.PathOptions => {
    const c = ctx.current;
    const sel = f.properties.natcode === c.selected;
    return {
      fillColor: c.scale ? c.scale.scale.color(c.valueMap.get(f.properties.natcode)) : "transparent",
      fillOpacity: c.opacity,
      color: sel ? "#254380" : "#8b8b93",
      weight: sel ? 2.5 : 0.5,
      opacity: sel ? 1 : 0.7,
    };
  };

  const layer = useMemo(() => {
    if (!shapes.data) return null;
    return L.geoJSON(shapes.data as unknown as GeoJSON.FeatureCollection, {
      pane: "unitsPane",
      style: (f) => styleFor(f as unknown as AreaFeature),
      onEachFeature: (feat, lyr) => {
        const f = feat as unknown as AreaFeature;
        lyr.bindTooltip(() => {
          const c = ctx.current;
          const v = c.valueMap.get(f.properties.natcode);
          const sub = c.unit === "nut" ? `<span class="sub">${escapeHtml(c.areaOfUat(f))}</span>` : "";
          return `<b>${escapeHtml(c.nameOf(f))}</b>${sub}<span class="num">${escapeHtml(v === null || v === undefined ? "n/d" : fmtNum(v, c.digits))}</span><span class="hint">${escapeHtml(t("map.clickSeries"))}</span>`;
        }, { className: "lt-tip", sticky: true });
        const path = lyr as L.Path;
        path.on("mouseover", () => {
          path.setStyle({ weight: 2, color: "#52525b", fillOpacity: Math.min(ctx.current.opacity, 0.2) });
          path.bringToFront();
        });
        path.on("mouseout", () => path.setStyle(styleFor(f)));
        path.on("click", () => setSelected(f.properties.natcode));
      },
    });
  }, [shapes.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    layer?.eachLayer((l) => {
      const f = (l as L.GeoJSON & { feature: AreaFeature }).feature;
      (l as L.Path).setStyle(styleFor(f));
      if (f.properties.natcode === selected) (l as L.Path).bringToFront();
    });
  }, [layer, valueMap, scale, opacity, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (map && layer) map.flyToBounds(layer.getBounds(), { padding: [30, 30], duration: 0.6, maxZoom: unit === "ltser" ? 7 : 8 });
  }, [map, layer, unit]);

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [];
    if (layer) list.push({ id: `units-${unit}`, label: t("map.units"), layer });
    if (networks.data) list.push(...networkOverlays(networks.data, lbl));
    return list;
  }, [layer, unit, networks.data, t, lbl]);

  const series = useAsync(() => (selected && valueMap.has(selected) ? ltser.adminSeries(unit, indicator, selected) : null), [unit, indicator, selected, valueMap.size > 0]);
  const feature = shapes.data?.features.find((f) => f.properties.natcode === selected) ?? null;
  const points = useMemo(() => (series.data && date ? series.data.filter((r) => r.date <= date).map((r) => [wallToMs(r.date), r.value] as [number, number | null]) : []), [series.data, date]);
  const value = selected ? valueMap.get(selected) : null;

  const exportGeoJSON = () => {
    if (!shapes.data || !date) return;
    const file = `${indicator}_${unit}_${date.slice(0, 7)}.geojson`;
    downloadGeoJSON(
      {
        type: "FeatureCollection",
        features: shapes.data.features.map((f) => ({
          type: "Feature",
          geometry: f.geometry,
          properties: { natcode: f.properties.natcode, name: f.properties.name, ...(f.properties.ltser ? { ltser: f.properties.ltser } : {}), indicator, date, value: valueMap.get(f.properties.natcode) ?? null },
        })),
      },
      file,
    );
    toast.success(t("table.downloaded", { file }));
  };

  return (
    <div>
      <PageHeader crumbs={[t("nav.rs"), t("nav.rs.admin")]} title={t("rs.admin.title")} description={t("rs.admin.lede")} actions={<SourceBadge backend="ltser" />} />
      <SectionTabs group="rs" active="teledetectie/administrativ" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap
              className="h-[440px] xl:h-[min(78dvh,820px)]"
              onReady={setMap}
              busy={values.loading || shapes.loading}
              caption={date ? { title: `${meta.short} · ${unit === "ltser" ? t("rs.unit.ltser") : t("rs.unit.nut")}`, sub: fmtMonth(date) } : null}
              legend={scale ? { title: scale.title, scale: scale.scale } : null}
              overlays={overlays}
            />
          </MapCard>
        }
        aside={
          <>
            <Card>
              <CardHeader title={t("ui.parameters")} />
              <CardBody className="grid gap-4">
                <Field label={t("rs.unit")}>
                  <Segmented
                    ariaLabel={t("rs.unit")}
                    fill
                    value={unit}
                    onChange={(v) => {
                      setUnit(v);
                      setSelected(null);
                      replaceQuery({ unitate: v, id: null });
                    }}
                    options={[{ value: "ltser", label: t("rs.unit.ltser") }, { value: "nut", label: t("rs.unit.nut") }]}
                  />
                </Field>
                <Field label={t("rs.indicator")}>
                  <Select ariaLabel={t("rs.indicator")} value={indicator} onValueChange={(v) => setIndicator(v as Indicator)} options={RS_INDICATORS.map((i) => ({ value: i.id, label: `${i.short} · ${lbl(i)}` }))} />
                </Field>
                <Field label={t("rs.month")}>
                  <Select ariaLabel={t("rs.month")} value={date ?? undefined} onValueChange={setDate} options={[...dates].reverse().map((d) => ({ value: d, label: fmtMonth(d) }))} />
                </Field>
                <Field label={t("rs.unitOpacity")} aside={fmtNum(opacity, 1)}>
                  <Slider ariaLabel={t("rs.unitOpacity")} value={opacity} onValueChange={setOpacity} />
                </Field>
                <Button className="justify-self-start" disabled={!values.data} onClick={exportGeoJSON}>
                  <Download strokeWidth={1.75} />
                  {t("rs.getGeojson")}
                </Button>
                {values.error ? <Callout tone="error" title={t("error.load")}>{errorText(values.error, t)}</Callout> : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={feature ? nameOf(feature) : t("rs.selectedUnit")}
                description={feature ? (unit === "nut" ? [feature.properties.natLevName, feature.properties.county, areaOfUat(feature)].filter(Boolean).join(" · ") : t("rs.unit.ltserOne")) : undefined}
              />
              <CardBody className="flex items-baseline gap-2">
                <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{value === null || value === undefined ? "n/d" : fmtNum(value, digits)}</span>
                <span className="text-xs text-muted">{meta.unit ? `${meta.unit} · ` : ""}{date ? fmtMonth(date) : ""}</span>
                <span className="tabular ml-auto text-[11px] text-subtle">{t("rs.code")} {selected}</span>
              </CardBody>
            </Card>

            <TimeSeriesPanel
              title={feature ? nameOf(feature) : t("rs.selectedUnit")}
              subtitle={date ? `${meta.short} · ${t("rs.until")} ${fmtMonth(date)}` : undefined}
              lanes={points.length ? [[{ key: "v", name: meta.short, color: SERIES.emerald, type: "area", unit: meta.unit, points }]] : []}
              presets={[
                { id: "1y", label: t("chart.1y"), span: YEAR },
                { id: "3y", label: t("chart.3y"), span: 3 * YEAR },
                { id: "5y", label: t("chart.5y"), span: 5 * YEAR },
                { id: "all", label: t("chart.all"), span: null },
              ]}
              defaultPreset="1y"
              height={240}
              dateOnly
              loading={series.loading}
              emptyText={t("rs.noValues")}
              filename={`${indicator}_${unit}_${selected ?? "unitate"}`}
            />
          </>
        }
      />
    </div>
  );
}
