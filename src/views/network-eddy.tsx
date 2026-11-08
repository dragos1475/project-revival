// LifeWatch networks, eddy covariance data (ltser sections/ui_data_ec.R + server_data_ec.R).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Camera, LineChart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { EC_PARAMS } from "@/lib/catalog";
import { loadLtserAreas, loadNetworks } from "@/lib/geo";
import { eddyScale, inkFor } from "@/lib/palettes";
import { addMinutes, clampWall, fmtAuto, fmtNum, fmtWall, wallToMs } from "@/lib/format";
import { SERIES } from "@/lib/chart-colors";
import { useAsync } from "@/hooks/use-async";
import { replaceQuery } from "@/hooks/use-route";
import { ltser } from "@/api/ltser";
import { AtlasMap } from "@/components/map/atlas-map";
import { ltserLayer, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml } from "@/components/map/glyphs";
import { TimeSeriesPanel } from "@/components/charts/time-series";
import { DataTable, type TableColumn } from "@/components/data-table";
import { TimeStepper } from "@/components/time-stepper";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Badge, Callout, Field } from "@/components/ui/misc";
import { Photo } from "@/components/ui/photo";
import type { ViewProps } from "@/explorer-routes";

const DAY = 86400000;
type Row = { time: string; station: string; variable: string; value: number | null };

export default function NetworkEddy({ route }: ViewProps) {
  const { t, L: lbl, lang } = useI18n();
  const [paramId, setParamId] = useState(EC_PARAMS[0].id);
  const [time, setTime] = useState<string | null>(null);
  const [station, setStation] = useState<string | null>(route.query.get("statie"));
  const [tab, setTab] = useState<"graph" | "camera">("graph");
  const [map, setMap] = useState<L.Map | null>(null);
  const param = EC_PARAMS.find((p) => p.id === paramId)!;
  const unit = lang === "en" && param.unitEn ? param.unitEn : param.unit;

  const networks = useAsync(() => loadNetworks(), []);
  const areas = useAsync(() => loadLtserAreas(), []);
  const stations = networks.data?.ec.features ?? [];
  const featureOf = (id: string) => stations.find((f) => f.properties.dataId === id) ?? null;

  // ltser opens the picker at 12:00 on the last day with at least two stations.
  const range = useAsync(() => ltser.ecRange(paramId), []);
  useEffect(() => {
    if (range.data && !time) setTime(clampWall(`${range.data.latest.slice(0, 10)}T12:00`, range.data.min, range.data.max));
  }, [range.data, time]);

  const snapshot = useAsync(() => (time ? ltser.ecSnapshot(paramId, time) : null), [paramId, time]);
  const rows = useMemo(() => (snapshot.data ?? []).filter((r): r is { id: string; value: number } => r.value !== null && stations.some((f) => f.properties.dataId === r.id)), [snapshot.data, stations]);
  const scale = useMemo(() => (rows.length ? eddyScale(paramId, [Math.min(...rows.map((r) => r.value)), Math.max(...rows.map((r) => r.value))], rows.length) : null), [rows, paramId]);

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
    for (const r of rows) {
      const f = featureOf(r.id)!;
      const [lon, lat] = f.geometry.coordinates;
      const fill = scale ? scale.color(r.value, "#a1a1aa") : "#a1a1aa";
      const sel = r.id === station;
      L.marker([lat, lon], {
        icon: L.divIcon({ className: `vm ${sel ? "is-selected" : ""}`, iconSize: [40, 40], iconAnchor: [20, 20], html: `<div class="vm__dot" style="background:${fill};color:${inkFor(fill)}">${escapeHtml(fmtAuto(r.value))}</div>` }),
        riseOnHover: true,
        zIndexOffset: sel ? 500 : 0,
      })
        .bindTooltip(`<b>${escapeHtml(f.properties.name)}</b><span class="sub">${escapeHtml(f.properties.locality)}, ${escapeHtml(f.properties.county)}</span><span class="num">${escapeHtml(fmtAuto(r.value))} ${escapeHtml(unit)}</span><span class="hint">${escapeHtml(t("map.clickData"))}</span>`, { className: "lt-tip", direction: "top", offset: [0, -18] })
        .on("click", () => select.current(r.id))
        .addTo(markers);
    }
    if (map && !fitted.current && rows.length) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(rows.map((r) => featureOf(r.id)!.geometry.coordinates.slice().reverse() as [number, number])), { padding: [60, 60], maxZoom: 8 });
    }
  }, [rows, scale, station, map, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlays = useMemo<OverlaySpec[]>(() => {
    const list: OverlaySpec[] = [{ id: "network", label: t("map.network"), layer: markers }];
    if (areas.data) list.push({ id: "ltser", label: t("map.ltser"), layer: ltserLayer(areas.data, { opacity: 0.8, areaName: (f) => f.properties.name }), defaultVisible: false });
    return list;
  }, [markers, areas.data, t]);

  const series = useAsync(() => (station && time ? ltser.ecSeries(station, paramId, addMinutes(time, -7 * 1440), time) : null), [station, paramId, time]);
  const camera = useAsync(() => (station && time && tab === "camera" ? ltser.cameraUrl(station, time) : null), [station, time, tab]);
  const f = station ? featureOf(station) : null;
  const current = rows.find((r) => r.id === station);
  const points = useMemo(() => (series.data ?? []).map((r) => [wallToMs(r.time), r.value] as [number, number | null]), [series.data]);
  const tableRows = useMemo<Row[]>(() => (series.data ?? []).map((r) => ({ time: r.time.replace("T", " "), station: f?.properties.name ?? "", variable: paramId, value: r.value })).reverse(), [series.data, f, paramId]);
  const columns: TableColumn<Row>[] = [
    { key: "time", label: t("table.timeEet") },
    { key: "station", label: t("table.station") },
    { key: "variable", label: t("table.variable") },
    { key: "value", label: `${t("table.value")} (${unit})`, numeric: true, render: (v) => fmtAuto(v as number | null) },
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav.net"), t("nav.net.eddy")]} title={t("ec.title")} description={t("ec.lede")} actions={<SourceBadge backend="ltser" />} />
      <SectionTabs group="net" active="retele/eddy" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap
              className="h-[440px] xl:h-[min(78dvh,820px)]"
              maxZoom={18}
              onReady={setMap}
              busy={snapshot.loading || range.loading}
              caption={time ? { title: lbl(param), sub: `${fmtWall(time)} ${t("ec.tzShort")}` } : null}
              legend={scale ? { title: unit, scale } : null}
              overlays={overlays}
            />
          </MapCard>
        }
        aside={
          <>
            <Card>
              <CardHeader title={t("ui.parameters")} actions={<Badge>{t("res.halfhourly")}</Badge>} />
              <CardBody className="grid gap-4">
                <Field label={t("ec.parameter")} hint={lang === "ro" ? param.defRo : param.defEn}>
                  <Select ariaLabel={t("ec.parameter")} value={paramId} onValueChange={setParamId} options={EC_PARAMS.map((p) => ({ value: p.id, label: lbl(p) }))} />
                </Field>
                <Field label={t("time.moment")} hint={t("ec.tz")}>
                  <TimeStepper value={time} min={range.data?.min} max={range.data?.max} stepMinutes={30} onChange={setTime} />
                </Field>
                {range.error || snapshot.error ? <Callout tone="error" title={t("error.load")}>{errorText(range.error ?? snapshot.error, t)}</Callout> : null}
                {!snapshot.loading && snapshot.data && !rows.length ? <Callout tone="info">{t("ec.noStations")}</Callout> : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={f ? f.properties.name : t("ec.station")}
                description={f ? `${f.properties.locality}, ${f.properties.county}` : undefined}
                actions={<Segmented ariaLabel={t("ec.view")} value={tab} onChange={setTab} options={[{ value: "graph", label: t("ec.tab.graph") }, { value: "camera", label: t("ec.tab.camera") }]} />}
              />
              <CardBody className="grid gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{current ? fmtAuto(current.value) : "n/d"}</span>
                  <span className="text-xs text-muted">{unit} · {lbl(param)}</span>
                </div>
                {f ? (
                  <p className="tabular flex flex-wrap gap-x-3 text-[11px] text-subtle">
                    <span>lat {fmtNum(f.geometry.coordinates[1], 4)}</span>
                    <span>lon {fmtNum(f.geometry.coordinates[0], 4)}</span>
                    {f.properties.elevation ? <span>{fmtNum(f.properties.elevation, 0)} m</span> : null}
                  </p>
                ) : null}
                {tab === "camera" ? (
                  <div className="grid gap-2">
                    <Photo src={camera.data ?? null} alt={`${f?.properties.name ?? ""} ${time ?? ""}`} fallback={t("ec.noImage")} className="aspect-[4/3] rounded-[10px]" />
                    {!camera.data && !camera.loading ? <p className="text-[11px] text-subtle">{t("ec.cameraDemo")}</p> : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            {tab === "graph" ? (
              <TimeSeriesPanel
                title={f ? `${f.properties.name} (${f.properties.locality}, ${f.properties.county})` : t("ec.station")}
                subtitle={`${lbl(param)} · ${t("chart.last7d")}`}
                lanes={points.length ? [[{ key: "v", name: lbl(param), unit, color: paramId === "RN_1_1_1" ? SERIES.orange : SERIES.emerald, type: "area", points }]] : []}
                presets={[{ id: "all", label: t("chart.all"), span: null }, { id: "2d", label: t("chart.2d"), span: 2 * DAY }, { id: "1d", label: t("chart.1d"), span: DAY }]}
                height={240}
                loading={series.loading}
                emptyText={t("ws.noSeries")}
                filename={`${station ?? "ec"}_${paramId}`}
              />
            ) : (
              <Card className="flex items-center gap-2 p-4 text-xs text-muted">
                <Camera className="size-3.5" strokeWidth={1.75} />
                {t("ec.cameraHint")}
                <button type="button" onClick={() => setTab("graph")} className="ml-auto inline-flex items-center gap-1 text-foreground hover:underline">
                  <LineChart className="size-3.5" strokeWidth={1.75} />
                  {t("ec.tab.graph")}
                </button>
              </Card>
            )}
          </>
        }
      />
      <Card className="mt-4">
        <CardHeader title={t("ui.tableData")} description={t("table.rowsCount", { n: tableRows.length })} />
        <CardBody>
          <DataTable columns={columns} rows={tableRows} filename={`${station ?? "ec"}_${paramId}_${time?.slice(0, 10) ?? ""}`} />
        </CardBody>
      </Card>
    </div>
  );
}
