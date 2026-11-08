// Geometry utilities and loaders for the static geodata shipped in public/data.
import { assetUrl } from "./utils";

export type Ring = [number, number][];
export type PolygonCoords = Ring[];
export interface PolyGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: PolygonCoords | PolygonCoords[];
}
export interface AreaFeature {
  type: "Feature";
  properties: Record<string, string | number | null> & { natcode: string; name: string };
  geometry: PolyGeometry;
  bbox: [number, number, number, number];
  centroid: [number, number];
}
export interface AreaCollection {
  type: "FeatureCollection";
  features: AreaFeature[];
}
export interface StationProps {
  name: string;
  dataId: string;
  locality: string;
  county: string;
  parameters: string;
  commissioned: string | null;
  elevation?: number | null;
}
export interface StationFeature {
  type: "Feature";
  properties: StationProps;
  geometry: { type: "Point"; coordinates: [number, number] };
}
export type NetworkId = "ws" | "ec" | "cu" | "ra" | "co" | "bu";
export type Networks = Record<NetworkId, { type: "FeatureCollection"; features: StationFeature[] }>;

interface Topology {
  type: "Topology";
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { geometries: { type: string; arcs: number[][] | number[][][]; properties?: Record<string, unknown> }[] }>;
}

const cache = new Map<string, Promise<unknown>>();
function loadJSON<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    cache.set(name, fetch(assetUrl(`data/${name}`)).then((r) => {
      if (!r.ok) throw new Error(`Cannot load ${name}`);
      return r.json();
    }));
  }
  return cache.get(name) as Promise<T>;
}

/** Minimal TopoJSON decoder for Polygon and MultiPolygon objects. */
export function topoToGeo(topology: Topology): { type: "FeatureCollection"; features: { type: "Feature"; properties: Record<string, unknown>; geometry: PolyGeometry }[] } {
  const tf = topology.transform;
  const arcs = topology.arcs.map((arc) => {
    if (!tf) return arc;
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]] as [number, number];
    });
  });
  const arcCoords = (i: number) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
  const ring = (indices: number[]): Ring => {
    const out: Ring = [];
    indices.forEach((idx, k) => {
      const pts = arcCoords(idx);
      out.push(...(k === 0 ? pts : pts.slice(1)));
    });
    return out;
  };
  const object = Object.values(topology.objects)[0];
  return {
    type: "FeatureCollection",
    features: object.geometries.map((g) => ({
      type: "Feature",
      properties: { ...(g.properties ?? {}) },
      geometry: g.type === "Polygon"
        ? { type: "Polygon", coordinates: (g.arcs as number[][]).map(ring) }
        : { type: "MultiPolygon", coordinates: (g.arcs as number[][][]).map((p) => p.map(ring)) },
    })),
  };
}

function polygons(geometry: PolyGeometry): PolygonCoords[] {
  return geometry.type === "Polygon" ? [geometry.coordinates as PolygonCoords] : (geometry.coordinates as PolygonCoords[]);
}

export function bboxOf(geometry: PolyGeometry): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const poly of polygons(geometry)) {
    for (const [x, y] of poly[0]) {
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }
  }
  return [w, s, e, n];
}

function ringContains(r: Ring, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function featureContains(feature: AreaFeature, x: number, y: number) {
  const [w, s, e, n] = feature.bbox;
  if (x < w || x > e || y < s || y > n) return false;
  for (const poly of polygons(feature.geometry)) {
    if (!ringContains(poly[0], x, y)) continue;
    if (!poly.slice(1).some((hole) => ringContains(hole, x, y))) return true;
  }
  return false;
}

export function centroidOf(geometry: PolyGeometry): [number, number] {
  let best: [number, number] | null = null;
  let bestArea = 0;
  for (const poly of polygons(geometry)) {
    const r = poly[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
      a += f;
      cx += (r[j][0] + r[i][0]) * f;
      cy += (r[j][1] + r[i][1]) * f;
    }
    a /= 2;
    if (a !== 0 && Math.abs(a) > bestArea) {
      bestArea = Math.abs(a);
      best = [cx / (6 * a), cy / (6 * a)];
    }
  }
  return best ?? [25, 46];
}

/** Geodesic area in km² (spherical excess on a 6371 km sphere). */
export function areaKm2(geometry: PolyGeometry) {
  const R = 6371;
  const rad = Math.PI / 180;
  const ringArea = (r: Ring) => {
    let sum = 0;
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i];
      const [x2, y2] = r[(i + 1) % r.length];
      sum += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad));
    }
    return Math.abs((sum * R * R) / 2);
  };
  return polygons(geometry).reduce((acc, poly) => acc + ringArea(poly[0]) - poly.slice(1).reduce((h, ring) => h + ringArea(ring), 0), 0);
}

function indexed(fc: ReturnType<typeof topoToGeo>): AreaCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      ...f,
      properties: { ...(f.properties as AreaFeature["properties"]), natcode: String(f.properties.natcode), name: String(f.properties.name) },
      bbox: bboxOf(f.geometry),
      centroid: centroidOf(f.geometry),
    })),
  };
}

let ltserPromise: Promise<AreaCollection> | null = null;
let uatPromise: Promise<AreaCollection> | null = null;

export const loadLtserAreas = () => (ltserPromise ??= loadJSON<Topology>("ltser.topojson").then((t) => indexed(topoToGeo(t))));
export const loadUats = () => (uatPromise ??= loadJSON<Topology>("uat_ltser.topojson").then((t) => indexed(topoToGeo(t))));
export const loadNetworks = () => loadJSON<Networks>("networks.json");

export const ROMANIA_BOUNDS: [[number, number], [number, number]] = [[43.5, 20], [48.2, 30]];
export const ROMANIA_CENTER: [number, number] = [46, 25];
