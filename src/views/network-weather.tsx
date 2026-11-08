// LifeWatch networks, weather station data (ltser sections/ui_data_ws.R + server_data_ws.R).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useI18n } from "@/lib/i18n";
import { METEO_GROUPS, METEO_PAIRS, METEO_PARAMS, meteoGroupOf, meteoId, meteoParam, type Resolution } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks, type StationFeature } from "@/lib/geo";
import { indicatorScale, inkFor } from "@/lib/palettes";
import { addMinutes, fmtNum, fmtWall, wallToMs } from "@/lib/format";
import { SERIES, SERIES_CYCLE } from "@/lib/chart-colors";
import { useAsync } from "@/hooks/use-async";
import { replaceQuery } from "@/hooks/use-route";
import { ltser } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { ltserLayer, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml } from "@/components/map/glyphs";
import { TimeSeriesPanel, type ChartSeries } from "@/components/charts/time-series";
import { DataTable, type TableColumn } from "@/components/data-table";
import { TimeStepper } from "@/components/time-stepper";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Callout, Field } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

const DAY = 86400000;
const digitsFor = (variable: string) => (variable.startsWith("sh") ? 3 : 1);
// Semantic colours: minimum cool, mean neutral, maximum warm; the second axis gets its own pair.
const COLOR_BY_BASE: Record<string, string> = {
  tmin: SERIES.sky, tmean: SERIES.emerald, tmax: SERIES.rose,
  psmin: SERIES.sky, psmean: SERIES.emerald, psmax: SERIES.rose,
  hurmin: "#7dd3fc", hurmean: SERIES.teal, hurmax: "#0f766e",
  wsmax: SERIES.amber, wsavg: SERIES.orange,
  irrmean: SERIES.amber, tsmean: SERIES.orange, shmean: SERIES.teal, trsum: SERIES.sky,
};

type Row = Record<string, string | number | null>;

export default function NetworkWeather({ route }: ViewProps) {
  const { t, L: lbl, lang } = useI18n();
  const [resolution, setResolution] = useState<Resolution>("daily");
  const [base, setBase] = useState("tmean");
  const [time, setTime] = useState<string | null>(null);
  const [station, setStation] = useState<string | null>(route.query.get("statie"));
  const [map, setMap] = useState<L.Map | null>(null);
  const variable = meteoId(base, resolution);
  const param = meteoParam(variable)!;
  const group = METEO_GROUPS[param.group];

  const networks = useAsync(() => loadNetworks(), []);
  const areas = useAsync(() => loadLtserAreas(), []);
  const stations = networks.data?.ws.features ?? [];
  const featureOf = (id: string) => stations.find((f) => f.properties.dataId === id) ?? null;

  // The picker opens at the last time with at least two stations, like the ltser observeEvent.
  const range = useAsync(() => ltser.meteoRange(resolution, variable), [resolution, variable]);
  useEffect(() => {
    if (range.data) setTime(range.data.latest);
  }, [range.data]);

  const snapshot = useAsync(() => (time ? ltser.meteoSnapshot(resolution, variable, time) : null), [resolution, variable, time]);
  const scale = useMemo(() => {
    const vals = (snapshot.data ?? []).map((r) => r.value).filter((v): v is number => v !== null);
    return vals.length ? indicatorScale(variable, [Math.min(...vals), Math.max(...vals)]) : null;
  }, [snapshot.data, variable]);
  // Values are clamped to the colour table bounds, like the original mutate(values = ...).
  const rows = useMemo(() => {
    const [lo, hi] = scale?.minmax ?? [-Infinity, Infinity];
    return (snapshot.data ?? []).filter((r) => r.value !== null && stations.some((f) => f.properties.dataId === r.id)).map((r) => ({ id: r.id, value: Math.min(hi, Math.max(lo, r.value as number)) }));
  }, [snapshot.data, scale, stations]);

  useEffect(() => {
    if (rows.length && (!station || !rows.some((r) => r.id === station))) setStation(rows[0].id);
  }, [rows, station]);

  const markers = useMemo(() => L.layerGroup(), []);
  const select = useRef<(id: string) => void>(() => {});
  select.current = (id) => {
    setStation(id);
    replaceQuery({ statie: id });
  };
  const fitted = useRef(false);
  useEffect(() => {
    markers.clearLayers();
    const d = digitsFor(variable);
    for (const r of rows) {
      const f = featureOf(r.id)!;
      const [lon, lat] = f.geometry.coordinates;
      const fill = scale ? scale.scale.color(r.value, "#a1a1aa") : "#a1a1aa";
      const sel = r.id === station;
      L.marker([lat, lon], {
        icon: L.divIcon({ className: `vm ${sel ? "is-selected" : ""}`, iconSize: [34, 34], iconAnchor: [17, 17], html: `<div class="vm__dot" style="background:${fill};color:${inkFor(fill)}">${escapeHtml(fmtNum(r.value, d))}</div>` }),
        riseOnHover: true,
        zIndexOffset: sel ? 500 : 0,
      })
        .bindTooltip(`<b>${escapeHtml(f.properties.name)}</b><span class="sub">${escapeHtml(f.properties.locality)}, ${escapeHtml(f.properties.county)}</span><span class="num">${escapeHtml(fmtNum(r.value, d))} ${escapeHtml(scale?.title ?? "")}</span><span class="hint">${escapeHtml(t("map.clickData"))}</span>`, { className: "lt-tip", direction: "top", offset: [0, -16] })
        .on("click", () => select.current(r.id))
        .addTo(markers);
    }
    if (map && !fitted.current && rows.length) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(rows.map((r) => featureOf(r.id)!.geometry.coordinates.slice().reverse() as [number, number])), { padding: [40, 40] });
    }
  }, [rows, scale, station, map, variable, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [{ id: "network", label: t("map.network"), layer: markers }];
    if (areas.data) list.push({ id: "ltser", label: t("map.ltser"), layer: ltserLayer(areas.data, { opacity: 0.8, areaName: (f) => f.properties.name }), defaultVisible: false });
    return list;
  }, [markers, areas.data, t]);

  // Series: 7 days (hourly) or 31 days (daily) ending at the selected time, paired groups.
  const groups = METEO_PAIRS[meteoGroupOf(variable)];
  const series = useAsync(
    () => (station && time ? ltser.meteoSeries(resolution, station, groups, addMinutes(time, -(resolution === "daily" ? 31 : 7) * 1440), time) : null),
    [resolution, station, time, groups.join(",")],
  );

  const short = (id: string) => {
    const p = meteoParam(id);
    return p ? (lang === "ro" ? p.shortRo : p.shortEn) : id;
  };
  const lanes = useMemo<ChartSeries[][]>(() => {
    if (!series.data?.length) return [];
    const byVar = new Map<string, [number, number | null][]>();
    for (const r of series.data) {
      if (!byVar.has(r.variable)) byVar.set(r.variable, []);
      byVar.get(r.variable)!.push([wallToMs(r.time), r.value]);
    }
    const out: ChartSeries[] = [];
    let k = 0;
    groups.forEach((g, axis) => {
      for (const p of METEO_PARAMS.filter((x) => x.group === g)) {
        const id = meteoId(p.base, resolution);
        const pts = byVar.get(id);
        if (!pts?.length) continue;
        out.push({
          key: id, name: short(id), unit: METEO_GROUPS[g].unit, color: COLOR_BY_BASE[p.base] ?? SERIES_CYCLE[k++ % SERIES_CYCLE.length],
          points: pts.sort((a, b) => a[0] - b[0]), axis: axis === 0 ? "left" : "right", dashed: axis === 1, type: axis === 0 && g === "tr" ? "bar" : "line",
        });
      }
    });
    return [out];
  }, [series.data, groups.join(","), resolution, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const f: StationFeature | null = station ? featureOf(station) : null;
  const current = rows.find((r) => r.id === station);
  const tableVars = METEO_PARAMS.filter((p) => groups.includes(p.group)).map((p) => meteoId(p.base, resolution));
  const tableRows = useMemo(() => {
    const byTime = new Map<string, Row>();
    for (const r of series.data ?? []) {
      if (!byTime.has(r.time)) byTime.set(r.time, { time: resolution === "daily" ? r.time.slice(0, 10) : `${r.time.replace("T", " ")} UTC`, station: f?.properties.name ?? "" });
      byTime.get(r.time)![r.variable] = r.value;
    }
    return [...byTime.values()].reverse();
  }, [series.data, resolution, f]);
  const columns: TableColumn<Row>[] = [
    { key: "time", label: t("table.time") },
    { key: "station", label: t("table.station") },
    ...tableVars.map((v) => ({ key: v, label: v, numeric: true, render: (x: Row[string]) => (typeof x === "number" ? fmtNum(x, digitsFor(v)) : "") })),
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav.net"), t("nav.net.meteo")]} title={t("ws.title")} description={t("ws.lede")} actions={<SourceBadge backend="ltser" />} />
      <SectionTabs group="net" active="retele/meteo" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap
              className="h-[440px] xl:h-[min(78dvh,820px)]"
              maxZoom={18}
              onReady={setMap}
              busy={snapshot.loading || range.loading}
              caption={time ? { title: lbl(param), sub: `${fmtWall(time, { time: resolution === "hourly" })}${resolution === "hourly" ? " UTC" : ""}` } : null}
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
                <Field label={t("res.label")}>
                  <Segmented ariaLabel={t("res.label")} fill value={resolution} onChange={setResolution} options={[{ value: "hourly", label: t("res.hourly") }, { value: "daily", label: t("res.daily") }]} />
                </Field>
                <Field label={t("ws.parameter")}>
                  <Select ariaLabel={t("ws.parameter")} value={base} onValueChange={setBase} options={METEO_PARAMS.map((p) => ({ value: p.base, label: lbl(p), group: lbl(METEO_GROUPS[p.group]) }))} />
                </Field>
                <Field label={t("time.moment")} hint={t("ws.tz")}>
                  <TimeStepper value={time} min={range.data?.min} max={range.data?.max} stepMinutes={resolution === "daily" ? 1440 : 60} onChange={setTime} />
                </Field>
                {range.error || snapshot.error ? <Callout tone="error" title={t("error.load")}>{errorText(range.error ?? snapshot.error, t)}</Callout> : null}
                {!snapshot.loading && snapshot.data && !rows.length ? <Callout tone="info">{t("ws.noStations")}</Callout> : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={f ? f.properties.name : t("ws.station")} description={f ? `${f.properties.locality}, ${f.properties.county}` : undefined} />
              <CardBody className="grid gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{current ? fmtNum(current.value, digitsFor(variable)) : "n/d"}</span>
                  <span className="text-xs text-muted">{group.unit} · {lbl(param)}</span>
                </div>
                {f ? (
                  <p className="tabular flex flex-wrap gap-x-3 text-[11px] text-subtle">
                    <span>lat {fmtNum(f.geometry.coordinates[1], 4)}</span>
                    <span>lon {fmtNum(f.geometry.coordinates[0], 4)}</span>
                    {f.properties.dataId !== f.properties.name ? <span>{t("ws.dataId")} {f.properties.dataId}</span> : null}
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <TimeSeriesPanel
              title={f ? `${f.properties.name} (${f.properties.locality}, ${f.properties.county})` : t("ws.station")}
              subtitle={`${lbl(METEO_GROUPS[groups[0]])} · ${lbl(METEO_GROUPS[groups[1]])}`}
              lanes={lanes}
              axisLabels={[{ left: `${lbl(METEO_GROUPS[groups[0]])} [${METEO_GROUPS[groups[0]].unit}]`, right: `${lbl(METEO_GROUPS[groups[1]])} [${METEO_GROUPS[groups[1]].unit}]` }]}
              presets={[{ id: "all", label: t("chart.all"), span: null }, { id: "7d", label: t("chart.7d"), span: 7 * DAY }, { id: "2d", label: t("chart.2d"), span: 2 * DAY }]}
              height={260}
              dateOnly={resolution === "daily"}
              loading={series.loading}
              emptyText={t("ws.noSeries")}
              filename={`${f?.properties.name ?? "statie"}_${variable}`}
            />
          </>
        }
      />
      <Card className="mt-4">
        <CardHeader title={t("ui.tableData")} description={t("table.rowsCount", { n: tableRows.length })} />
        <CardBody>
          <DataTable columns={columns} rows={tableRows} filename={`${f?.properties.name ?? "statie"}_${variable}_${time?.slice(0, 10) ?? ""}`} />
        </CardBody>
      </Card>
    </div>
  );
}
