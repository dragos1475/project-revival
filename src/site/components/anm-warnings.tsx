// ANM weather warnings in force, drawn on a Leaflet map as the county and zone polygons of the ANM feed, coloured by
// level, with a short summary for the corner of the map. Feed and helpers: ./site-weather.
import { useEffect, useState } from "react";
import type * as LT from "leaflet";
import { pick } from "../i18n/core";
import {
  activeWarnings,
  levelOf,
  loadWarnings,
  phenomenaOf,
  validity,
  type WarningFeature,
} from "./site-weather";

const ATTRIBUTION = "Avertizări © ANM, CC BY 4.0";

function tooltip(f: WarningFeature) {
  const w = f.properties;
  const lv = levelOf(w.level);
  const box = document.createElement("div");
  const head = document.createElement("b");
  head.textContent = pick(lv.ro, lv.en);
  box.append(head, ` · ${w.area_name}`);
  const what = phenomenaOf(w);
  for (const line of [what, validity(w)]) {
    if (!line) continue;
    box.append(document.createElement("br"), line);
  }
  return box;
}

/** Warning polygons on the map and their summary; the summary is the returned element. */
export function WarningsLayer({ L, map }: { L: typeof LT; map: LT.Map }) {
  const [list, setList] = useState<WarningFeature[] | null | undefined>(undefined);
  useEffect(() => {
    let on = true;
    const load = () => loadWarnings().then((fc) => on && setList(fc ? activeWarnings(fc) : null));
    void load();
    const timer = setInterval(load, 5 * 60_000);
    return () => {
      on = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!list?.length) return;
    const pane = map.getPane("warnPane") ?? map.createPane("warnPane");
    pane.style.zIndex = "402"; // above the backgrounds and habitat layers, below the radar and the markers
    // Higher levels are drawn last, on top.
    const sorted = [...list].sort((a, b) => a.properties.level - b.properties.level);
    const layer = L.geoJSON(
      { type: "FeatureCollection", features: sorted } as unknown as GeoJSON.FeatureCollection,
      {
        pane: "warnPane",
        style: (f) => {
          const lv = levelOf((f as unknown as WarningFeature).properties.level);
          return {
            color: lv.color,
            weight: 1.3,
            opacity: 0.95,
            fillColor: lv.color,
            fillOpacity: 0.22,
          };
        },
        onEachFeature: (f, l) =>
          l.bindTooltip(tooltip(f as unknown as WarningFeature), { sticky: true }),
      },
    ).addTo(map);
    map.attributionControl.addAttribution(ATTRIBUTION);
    return () => {
      layer.remove();
      map.attributionControl.removeAttribution(ATTRIBUTION);
    };
  }, [L, map, list]);

  // Areas in force at each level; one warning covers many counties and zones.
  const counts = [3, 2, 1]
    .map(
      (n) =>
        [
          n,
          new Set(
            (list ?? []).filter((f) => f.properties.level === n).map((f) => f.properties.area_name),
          ).size,
        ] as const,
    )
    .filter(([, c]) => c);
  return (
    <div
      className="rounded-lg bg-surface/95 px-2.5 py-1.5 text-[12px] shadow-card"
      aria-live="polite"
    >
      {list === undefined ? (
        <span className="text-subtle">
          {pick("Se încarcă avertizările ANM…", "Loading ANM warnings…")}
        </span>
      ) : list === null ? (
        <span className="text-subtle">
          {pick("Avertizările ANM nu se pot încărca acum.", "ANM warnings cannot be loaded now.")}
        </span>
      ) : counts.length ? (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <b>{pick("Avertizări ANM", "ANM warnings")}</b>
          {counts.map(([n, c]) => (
            <span key={n} className="inline-flex items-center gap-1">
              <i
                className="inline-block size-2.5 rounded-[2px]"
                style={{ background: levelOf(n).color }}
              />
              {pick(
                `${levelOf(n).ro.replace("Cod ", "cod ")}: ${c} ${c === 1 ? "zonă" : "zone"}`,
                `${levelOf(n).en.replace(" warning", "")}: ${c} ${c === 1 ? "area" : "areas"}`,
              )}
            </span>
          ))}
        </span>
      ) : (
        <span>{pick("Nicio avertizare ANM în vigoare acum.", "No ANM warning in force now.")}</span>
      )}
    </div>
  );
}
