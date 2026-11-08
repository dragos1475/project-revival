// Availability map: GET /stations/snapshot of the LifeWatch API, not used by its Next.js UI.
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { fmtInt, prettyUnit } from "@/lib/format";
import { loadLtserAreas } from "@/lib/geo";
import { useAsync } from "@/hooks/use-async";
import { hashFor, navigate, replaceQuery } from "@/hooks/use-route";
import { lifewatch } from "@/api/lifewatch";
import { AtlasMap } from "@/components/map/atlas-map";
import { ltserLayer, type OverlaySpec } from "@/components/map/layers";
import { escapeHtml } from "@/components/map/glyphs";
import { MapCard, PageHeader, SectionTabs, SourceBadge, SplitPane, errorText } from "@/components/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Callout, Field, Skeleton } from "@/components/ui/misc";
import type { ViewProps } from "@/explorer-routes";

const DAY = 86400000;
const WINDOWS = [
  { id: "default", span: null as number | null },
  { id: "24h", span: DAY },
  { id: "3d", span: 3 * DAY },
  { id: "7d", span: 7 * DAY - 60000 },
];

export default function PlatformAvailability({ route }: ViewProps) {
  const { t } = useI18n();
  const [variable, setVariable] = useState(route.query.get("variabila") ?? "air_temperature");
  const [win, setWin] = useState("default");
  const variables = useAsync(() => lifewatch.variables(), []);
  const stations = useAsync(() => lifewatch.stations(), []);
  const areas = useAsync(() => loadLtserAreas(), []);
  const kinds = useMemo(() => new Map((stations.data ?? []).map((s) => [s.id, s.kind])), [stations.data]);

  useEffect(() => {
    if (variables.data?.length && !variables.data.some((v) => v.id === variable)) setVariable(variables.data[0].id);
  }, [variables.data, variable]);

  const snapshot = useAsync(() => {
    const w = WINDOWS.find((x) => x.id === win)!;
    if (w.span === null) return lifewatch.snapshot({ variable });
    const now = Date.now();
    return lifewatch.snapshot({ variable, since: new Date(now - w.span).toISOString(), until: new Date(now).toISOString() });
  }, [variable, win]);

  const list = snapshot.data?.stations ?? [];
  const max = Math.max(1, ...list.map((s) => s.count));
  const total = list.reduce((a, s) => a + s.count, 0);
  const meta = variables.data?.find((v) => v.id === variable);

  const bubbles = useMemo(() => L.layerGroup(), []);
  useEffect(() => {
    bubbles.clearLayers();
    for (const s of list) {
      const r = 6 + 9 * Math.sqrt(s.count / max);
      L.marker([s.location.latitude, s.location.longitude], {
        icon: L.divIcon({ className: `sb ${kinds.get(s.id) === "eddy-covariance" ? "sb--ec" : ""}`, iconSize: [r * 2, r * 2], iconAnchor: [r, r], html: '<div class="sb__c"></div>' }),
        riseOnHover: true,
      })
        .bindTooltip(`<b>${escapeHtml(s.name)}</b><span class="num">${escapeHtml(fmtInt(s.count))}</span><span class="sub">${escapeHtml(t("avail.validMeasurements"))}</span><span class="hint">${escapeHtml(t("avail.open"))}</span>`, { className: "lt-tip", direction: "top", offset: [0, -r] })
        .on("click", () => navigate("platforma/statii", { statie: s.id }))
        .addTo(bubbles);
    }
  }, [list, max, kinds, bubbles, t]);

  const overlays = useMemo<OverlaySpec[]>(() => {
    const out: OverlaySpec[] = [{ id: "network", label: t("map.network"), layer: bubbles }];
    if (areas.data) out.push({ id: "ltser", label: t("map.ltser"), layer: ltserLayer(areas.data, { opacity: 0.6, areaName: (f) => f.properties.name }), defaultVisible: false });
    return out;
  }, [bubbles, areas.data, t]);

  const groups: Record<string, string> = { meteorological: t("platform.kind.meteo"), "eddy-covariance": t("platform.kind.ec") };

  return (
    <div>
      <PageHeader crumbs={[t("nav.platform"), t("nav.platform.availability")]} title={t("avail.title")} description={t("avail.lede")} actions={<SourceBadge backend="lifewatch" />} />
      <SectionTabs group="platform" active="platforma/disponibilitate" />
      <SplitPane
        main={
          <MapCard>
            <AtlasMap className="h-[440px] xl:h-[min(78dvh,820px)]" maxZoom={14} busy={snapshot.loading} caption={{ title: meta?.name ?? variable, sub: t(`avail.window.${win}`) }} overlays={overlays} />
          </MapCard>
        }
        aside={
          <>
            <Card>
              <CardHeader title={t("ui.parameters")} />
              <CardBody className="grid gap-4">
                <Field label={t("avail.variable")}>
                  {variables.data ? (
                    <Select
                      ariaLabel={t("avail.variable")}
                      value={variable}
                      onValueChange={(v) => {
                        setVariable(v);
                        replaceQuery({ variabila: v });
                      }}
                      options={variables.data.map((v) => ({ value: v.id, label: `${v.name.trim()}${v.units ? ` [${prettyUnit(v.units)}]` : ""}`, group: groups[v.kind] }))}
                    />
                  ) : (
                    <Skeleton className="h-8" />
                  )}
                </Field>
                <Field label={t("platform.window")}>
                  <Segmented ariaLabel={t("platform.window")} fill value={win} onChange={setWin} options={WINDOWS.map((w) => ({ value: w.id, label: t(`avail.window.${w.id}`) }))} />
                </Field>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("avail.stations")} description={list.length ? t("avail.stationsWithData", { n: list.length }) : undefined} />
              <CardBody className="grid gap-3">
                {snapshot.error ? <Callout tone="error" title={t("avail.error")}>{errorText(snapshot.error, t)}</Callout> : null}
                {!snapshot.loading && !snapshot.error && !list.length ? <Callout>{t("avail.empty")}</Callout> : null}
                {list.length ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="tabular text-[32px] leading-none font-semibold tracking-tight">{fmtInt(total)}</span>
                      <span className="text-xs text-muted">{t("avail.measurements")}</span>
                    </div>
                    <ol className="grid">
                      {[...list].sort((a, b) => b.count - a.count).map((s, i) => (
                        <li key={s.id}>
                          <a href={hashFor("platforma/statii", { statie: s.id })} className="grid grid-cols-[minmax(0,1.3fr)_minmax(60px,1fr)_auto] items-center gap-3 border-b border-border py-2 text-[13px] last:border-0 hover:text-foreground">
                            <span className="truncate text-muted">{s.name.replace(/^Stația \d+ - /, "")}</span>
                            <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                              <motion.span
                                className="block h-full rounded-full bg-accent"
                                initial={{ width: 0 }}
                                animate={{ width: `${(s.count / max) * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.02 }}
                              />
                            </span>
                            <span className="tabular text-xs text-subtle">{fmtInt(s.count)}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : null}
              </CardBody>
            </Card>
          </>
        }
      />
    </div>
  );
}
