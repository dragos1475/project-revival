// Remote sensing, national level (ltser sections/ui_national.R + server_national.R).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Download, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { RS_INDICATORS, LTSER_AREAS } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks, type AreaFeature } from "@/lib/geo";
import { indicatorScale } from "@/lib/palettes";
import { fmtMonth, fmtNum, wallToMs } from "@/lib/format";
import { downloadBlob, geoTiffBlob } from "@/lib/export";
import { useAsync } from "@/hooks/use-async";
import { replaceQuery } from "@/hooks/use-route";
import { ltser, gridValueAt } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { gridToImage, ltserLayer, networkOverlays, type OverlaySpec } from "@/components/map/layers";
import { crosshairSvg, escapeHtml } from "@/components/map/glyphs";
import { TimeSeriesPanel } from "@/components/charts/time-series";
import { SERIES } from "@/lib/chart-colors";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Segmented } from "@/components/ui/segmented";
import { Callout, Field } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

const YEAR = 365.25 * 86400000;
type Indicator = (typeof RS_INDICATORS)[number]["id"];

export default function RemoteNational({ route }: ViewProps) {
  const { t, L: lbl } = useI18n();
  const initial = route.query.get("indicator");
  const [indicator, setIndicator] = useState<Indicator>(RS_INDICATORS.some((i) => i.id === initial) ? (initial as Indicator) : "ssm");
  const [date, setDate] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [clickMode, setClickMode] = useState<"popup" | "series">("series");
  const [point, setPoint] = useState<{ lon: number; lat: number } | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const meta = RS_INDICATORS.find((i) => i.id === indicator)!;
  const digits = indicator === "ssm" ? 1 : 2;

  const indicators = useAsync(() => ltser.rsIndicators(), []);
  const dates = useMemo(() => indicators.data?.find((d) => d.id === indicator)?.dates ?? [], [indicators.data, indicator]);
  useEffect(() => {
    if (dates.length && (!date || !dates.includes(date))) setDate(dates[dates.length - 1]);
  }, [dates, date]);

  const grid = useAsync(() => (date ? ltser.rsGrid(indicator, date) : null), [indicator, date]);
  const series = useAsync(() => (point ? ltser.rsPoint(indicator, point.lon, point.lat) : null), [indicator, point?.lon, point?.lat]);
  const geo = useAsync(() => Promise.all([loadLtserAreas(), loadNetworks()]), []);

  const scale = useMemo(() => (grid.data?.domain ? indicatorScale(indicator, grid.data.domain) : null), [grid.data, indicator]);

  // Layers ---------------------------------------------------------------------------
  const raster = useMemo(() => L.imageOverlay("data:,", L.latLngBounds([0, 0], [0, 0]), { pane: "rasterPane", opacity: 0.8, className: "raster-img", interactive: false }), []);
  useEffect(() => {
    if (!grid.data || !scale) return;
    const { url, bounds } = gridToImage(grid.data, scale.scale);
    raster.setUrl(url);
    raster.setBounds(bounds);
  }, [grid.data, scale, raster]);

  const areaName = (f: AreaFeature) => lbl(LTSER_AREAS[Number(f.properties.natcode)]) || f.properties.name;
  const areas = useMemo(() => (geo.data ? ltserLayer(geo.data[0], { opacity: 0.5, areaName }) : null), [geo.data]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    areas?.setStyle({ fillOpacity: opacity });
  }, [areas, opacity]);

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [];
    if (areas) list.push({ id: "ltser", label: t("map.ltser"), layer: areas });
    list.push({ id: "raster", label: t("rs.rasterLayer"), layer: raster });
    if (geo.data) list.push(...networkOverlays(geo.data[1], lbl));
    return list;
  }, [areas, raster, geo.data, t, lbl]);

  // Crosshair at the extracted point.
  const marker = useMemo(() => L.marker([0, 0], { icon: L.divIcon({ className: "xh text-foreground", html: crosshairSvg, iconSize: [26, 26], iconAnchor: [13, 13] }), interactive: false, keyboard: false }), []);
  useEffect(() => {
    if (!map || !point) return;
    marker.setLatLng([point.lat, point.lon]).addTo(map);
  }, [map, point, marker]);

  // The original app starts at lon 25, lat 46; start inside an LTSER area instead so the chart has data.
  useEffect(() => {
    if (point || !grid.data) return;
    for (const [lon, lat] of [[27.95, 45.15], [28.95, 45.08], [25.4, 44.35], [22.85, 45.35]]) {
      const hit = gridValueAt(grid.data, lon, lat);
      if (hit) return setPoint({ lon: hit.lon, lat: hit.lat });
    }
    setPoint({ lon: 25, lat: 46 });
  }, [grid.data, point]);

  // Map clicks read the latest state through refs.
  const state = useRef({ clickMode, grid: grid.data, short: meta.short, digits });
  state.current = { clickMode, grid: grid.data, short: meta.short, digits };
  useEffect(() => {
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      const s = state.current;
      if (s.clickMode === "popup") {
        const hit = s.grid && gridValueAt(s.grid, e.latlng.lng, e.latlng.lat);
        if (!hit) return;
        L.popup({ autoPanPadding: [40, 40] })
          .setLatLng([hit.lat, hit.lon])
          .setContent(`<div class="lt-pop__k">${escapeHtml(s.short)}</div><div class="lt-pop__v">${escapeHtml(fmtNum(hit.value, s.digits))}</div>`)
          .openOn(map);
      } else setPoint({ lon: e.latlng.lng, lat: e.latlng.lat });
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map]);

  const hit = point && grid.data ? gridValueAt(grid.data, point.lon, point.lat) : null;
  const points = useMemo(
    () => (series.data && date ? series.data.series.filter((r) => r.date <= date).map((r) => [wallToMs(r.date), r.value] as [number, number | null]) : []),
    [series.data, date],
  );
  const hasValues = points.some((p) => p[1] !== null);

  return (
    <div>
      <PageHeader crumbs={[t("nav.rs"), t("nav.rs.national")]} title={t("rs.national.title")} description={t("rs.national.lede")} actions={<SourceBadge backend="ltser" />} />
      <SectionTabs group="rs" active="teledetectie/national" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap
              className="h-[440px] xl:h-[min(78dvh,820px)]"
              onReady={setMap}
              busy={grid.loading}
              caption={date ? { title: `${meta.short} · ${lbl(meta)}`, sub: fmtMonth(date) } : null}
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
                <Field label={t("rs.indicator")}>
                  <Select
                    ariaLabel={t("rs.indicator")}
                    value={indicator}
                    onValueChange={(v) => {
                      setIndicator(v as Indicator);
                      replaceQuery({ indicator: v });
                    }}
                    options={RS_INDICATORS.map((i) => ({ value: i.id, label: `${i.short} · ${lbl(i)}` }))}
                  />
                </Field>
                <Field label={t("rs.month")} aside={dates.length ? t("rs.months", { n: dates.length }) : undefined}>
                  <Select ariaLabel={t("rs.month")} value={date ?? undefined} onValueChange={setDate} options={[...dates].reverse().map((d) => ({ value: d, label: fmtMonth(d) }))} />
                </Field>
                <Field label={t("rs.ltserOpacity")} aside={fmtNum(opacity, 1)}>
                  <Slider ariaLabel={t("rs.ltserOpacity")} value={opacity} onValueChange={setOpacity} />
                </Field>
                <Field label={t("rs.click")}>
                  <Segmented ariaLabel={t("rs.click")} value={clickMode} onChange={(v) => { setClickMode(v); map?.closePopup(); }} options={[{ value: "popup", label: t("rs.click.popup") }, { value: "series", label: t("rs.click.series") }]} fill />
                </Field>
                <Button
                  className="justify-self-start"
                  disabled={!grid.data}
                  onClick={() => {
                    if (!grid.data || !date) return;
                    const file = `${indicator}_${date.slice(0, 7)}.tif`;
                    downloadBlob(geoTiffBlob(grid.data), file);
                    toast.success(t("table.downloaded", { file }));
                  }}
                >
                  <Download strokeWidth={1.75} />
                  {t("rs.getTiff")}
                </Button>
                {grid.error ? <Callout tone="error" title={t("error.load")}>{errorText(grid.error, t)}</Callout> : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t("rs.extracted")} description={point ? `lon ${fmtNum(point.lon, 5)} · lat ${fmtNum(point.lat, 5)}` : undefined} actions={<Crosshair className="size-3.5 text-subtle" strokeWidth={1.75} />} />
              <CardBody>
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{hit ? fmtNum(hit.value, digits) : "n/d"}</span>
                  <span className="text-xs text-muted">{meta.unit ? `${meta.unit} · ` : ""}{date ? fmtMonth(date) : ""}</span>
                </div>
                {clickMode === "series" ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle"><MousePointerClick className="size-3.5" strokeWidth={1.75} />{t("rs.clickHint")}</p>
                ) : null}
              </CardBody>
            </Card>

            <TimeSeriesPanel
              title={t("rs.seriesTitle", { ind: meta.short })}
              subtitle={series.data ? `lon ${fmtNum(series.data.lon, 5)} · lat ${fmtNum(series.data.lat, 5)}` : undefined}
              lanes={hasValues ? [[{ key: "v", name: meta.short, color: SERIES.emerald, type: "area", unit: meta.unit, points }]] : []}
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
              filename={`${indicator}_${point ? `${point.lon.toFixed(3)}_${point.lat.toFixed(3)}` : "serie"}`}
            />
          </>
        }
      />
    </div>
  );
}
