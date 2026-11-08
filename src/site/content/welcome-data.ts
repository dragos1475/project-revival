import basemap from '../../../public/data/lw-basemap.json';
import { LW_POINTS, type Cat, type LwPoint } from './lw';

export const INTRO_DURATION = 6000;
export const ENTRY_DELAY = 1500;
export const POINT_START = 1800;
export const POINT_END = 4500;
export const WELCOME_GROUPS: { cats: Cat[]; label: string; en: string }[] = [
  { cats: ['statiune'], label: 'stațiuni de cercetare', en: 'research stations' },
  { cats: ['ltser'], label: 'platforme LTSER', en: 'LTSER platforms' },
  { cats: ['lter'], label: 'situri LTER', en: 'LTER sites' },
  { cats: ['icos', 'icos-cat'], label: 'stații de flux', en: 'flux stations' },
  { cats: ['meteo'], label: 'stații climatice', en: 'weather stations' },
];
export const WELCOME_POINTS = [...LW_POINTS].sort((a, b) => a.lon - b.lon || a.lat - b.lat);
export function pointTime(index: number, total = WELCOME_POINTS.length) {
  return POINT_START + (POINT_END - POINT_START) * index / Math.max(1, total - 1);
}
export function welcomeCounts(points: LwPoint[] = LW_POINTS) {
  return WELCOME_GROUPS.map(group => points.filter(p => group.cats.includes(p.cat)).length);
}
export function visibleCounts(elapsed: number) {
  return welcomeCounts(WELCOME_POINTS.filter((_, i) => elapsed >= pointTime(i)));
}
export function projectPoint(lon: number, lat: number): [number, number] {
  return [(lon - 19.8) * 61, (49.1 - lat) * 85];
}
type Geometry = { type: string; coordinates: unknown };
function linePath(line: number[][], close = false) {
  return line.map(([lon, lat], i) => {
    const [x, y] = projectPoint(lon, lat);
    return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + (close ? ' Z' : '');
}
function geometryPath(geometry: Geometry): string {
  switch (geometry.type) {
    case 'Polygon': return (geometry.coordinates as number[][][]).map(l => linePath(l, true)).join(' ');
    case 'MultiPolygon': return (geometry.coordinates as number[][][][]).flatMap(p => p.map(l => linePath(l, true))).join(' ');
    case 'LineString': return linePath(geometry.coordinates as number[][]);
    case 'MultiLineString': return (geometry.coordinates as number[][][]).map(l => linePath(l)).join(' ');
    default: return '';
  }
}
const romania = basemap.countries.features.find(f => f.properties.ro);
export const ROMANIA_PATH = romania ? geometryPath(romania.geometry) : '';
export const DANUBE_PATH = basemap.rivers.features.filter(f => f.properties.n === 'Danube' || f.properties.n?.startsWith('Bratul')).map(f => geometryPath(f.geometry)).join(' ');
export const COUNTY_PATHS = basemap.counties.features.map(f => geometryPath(f.geometry));