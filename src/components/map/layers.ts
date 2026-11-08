import L from "leaflet";
import { NETWORKS } from "@/lib/catalog";
import type { AreaCollection, AreaFeature, Networks } from "@/lib/geo";
import type { BinScale } from "@/lib/palettes";
import type { Grid } from "@/api/types";
import { glyphSvg, escapeHtml } from "./glyphs";

export interface OverlaySpec {
  id: string;
  label: string;
  layer: L.Layer;
  defaultVisible?: boolean;
  glyph?: string;
}

/** The six LifeWatch networks as hidden overlays (ltser leaflet_fun_na / leaflet_fun_ad). */
export function networkOverlays(networks: Networks, label: (n: (typeof NETWORKS)[number]) => string): OverlaySpec[] {
  return NETWORKS.filter((n) => networks[n.id]).map((n) => ({
    id: `net-${n.id}`,
    label: label(n),
    glyph: glyphSvg(n.shape, n.color, 14),
    defaultVisible: false,
    layer: L.layerGroup(
      networks[n.id].features.map((f) =>
        L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], {
          icon: L.divIcon({ className: "gm", html: glyphSvg(n.shape, n.color, 16), iconSize: [16, 16], iconAnchor: [8, 8] }),
          keyboard: false,
        }).bindTooltip(`<b>${escapeHtml(f.properties.name)}</b><span class="sub">${escapeHtml(label(n))}</span>`, { className: "lt-tip", direction: "top", offset: [0, -8] }),
      ),
    ),
  }));
}

/** LTSER area polygons in the original teal style. */
export function ltserLayer(fc: AreaCollection, { opacity = 0.5, interactive = true, areaName }: { opacity?: number; interactive?: boolean; areaName: (f: AreaFeature) => string }) {
  return L.geoJSON(fc as unknown as GeoJSON.FeatureCollection, {
    pane: "ltserPane",
    interactive,
    style: () => ({ color: "#003c30", weight: 1, fillColor: "#99d8c9", fillOpacity: opacity, opacity: 0.9 }),
    onEachFeature: (f, layer) => {
      if (interactive) layer.bindTooltip(escapeHtml(areaName(f as unknown as AreaFeature)), { className: "lt-tip", sticky: true });
    },
  });
}

/**
 * Renders a lon/lat grid to a PNG resampled in Web Mercator rows, so cells land where
 * terra / leaflet::addRasterImage would put them.
 */
export function gridToImage(grid: Grid, scale: BinScale) {
  const W = grid.width;
  const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const yN = merc(grid.north);
  const yS = merc(grid.south);
  const H = Math.max(1, Math.round((W * (yN - yS)) / (((grid.east - grid.west) * Math.PI) / 180)));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const colors = scale.colors.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  for (let r = 0; r < H; r++) {
    const lat = ((2 * Math.atan(Math.exp(yN - ((r + 0.5) / H) * (yN - yS))) - Math.PI / 2) * 180) / Math.PI;
    const row = Math.min(grid.height - 1, Math.max(0, Math.floor((grid.north - lat) / grid.dy))) * W;
    for (let c = 0; c < W; c++) {
      const v = grid.values[row + c];
      if (Number.isNaN(v)) continue;
      const k = scale.index(v);
      if (k < 0) continue;
      const o = (r * W + c) * 4;
      img.data[o] = colors[k][0];
      img.data[o + 1] = colors[k][1];
      img.data[o + 2] = colors[k][2];
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL("image/png"), bounds: L.latLngBounds([grid.south, grid.west], [grid.north, grid.east]) };
}
