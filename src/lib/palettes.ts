// Port of ltser/utils/map_fun_cols_ws.R and map_fun_cols_ec.R. Reproduces RColorBrewer,
// grDevices::colorRampPalette, base::pretty, findInterval and leaflet::colorBin, so the map
// classes match the original application. Outputs were compared with R and are identical.

export const BREWER = {
  RdYlBu10: ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE090", "#E0F3F8", "#ABD9E9", "#74ADD1", "#4575B4", "#313695"],
  RdYlGn11: ["#A50026", "#D73027", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#D9EF8B", "#A6D96A", "#66BD63", "#1A9850", "#006837"],
  Spectral11: ["#9E0142", "#D53E4F", "#F46D43", "#FDAE61", "#FEE08B", "#FFFFBF", "#E6F598", "#ABDDA4", "#66C2A5", "#3288BD", "#5E4FA2"],
  PuRd9: ["#F7F4F9", "#E7E1EF", "#D4B9DA", "#C994C7", "#DF65B0", "#E7298A", "#CE1256", "#980043", "#67001F"],
  YlOrRd9: ["#FFFFCC", "#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#BD0026", "#800026"],
  BuPu9: ["#F7FCFD", "#E0ECF4", "#BFD3E6", "#9EBCDA", "#8C96C6", "#8C6BB1", "#88419D", "#810F7C", "#4D004B"],
  OrRd9: ["#FFF7EC", "#FEE8C8", "#FDD49E", "#FDBB84", "#FC8D59", "#EF6548", "#D7301F", "#B30000", "#7F0000"],
} as const;

export const PLASMA7 = ["#0D0887", "#5D01A6", "#9C179E", "#CC4678", "#ED7953", "#FDB32F", "#F0F921"];

export const COLS_TEMP = ["#F7FCFD", "#EBF4F8", "#E0ECF4", "#CFDFED", "#BFD3E6", "#AEC7E0", "#9EBCDA", "#95A9D0", "#8C96C6", "#8C80BB", "#8C6BB1", "#8A56A7", "#88419D", "#0000ff", "#0049ff", "#0072ff", "#00a3ff", "#00ccff", "#00e5ff", "#00ffff", "#007700", "#009900", "#00bb00", "#00dd00", "#00ff00", "#7fff00", "#cfff00", "#ffff00", "#ffe500", "#ffcc00", "#ffad00", "#ff9900", "#ff7f00", "#FF4E00", "#F23A00", "#E42700", "#D81300", "#CB0000", "#A62137", "#9D3673", "#813986", "#532B6E"];

const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};

const toHex255 = (channels: number[]) =>
  "#" + channels.map((c) => Math.trunc(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * grDevices::colorRamp step by step: channels scaled to [0, 1], stops at seq(0, 1, length.out = n),
 * linear interpolation, then multiplied by 255 and truncated as rgb(maxColorValue = 255) does.
 */
export function colorRamp(colors: readonly string[]) {
  const rgb = colors.map((c) => hexToRgb(c).map((v) => v / 255));
  const n = rgb.length;
  const xs = Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i * (1 / (n - 1))));
  return (t: number) => {
    const x = Math.max(0, Math.min(1, t));
    if (n === 1) return toHex255(rgb[0].map((v) => v * 255));
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const f = (x - xs[i]) / (xs[i + 1] - xs[i]);
    return toHex255([0, 1, 2].map((k) => (rgb[i][k] + (rgb[i + 1][k] - rgb[i][k]) * f) * 255));
  };
}

export function rampPalette(colors: readonly string[], n: number) {
  const ramp = colorRamp(colors);
  if (n === 1) return [ramp(0)];
  const by = 1 / (n - 1);
  return Array.from({ length: n }, (_, i) => ramp(i * by));
}

/** base::pretty with the default bias settings (R_pretty). */
export function prettyR(lo: number, up: number, ndiv = 5) {
  const minN = Math.floor(ndiv / 3);
  const h = 1.5;
  const h5 = 0.5 + 1.5 * h;
  const eps = 1e-10;
  if (lo > up) [lo, up] = [up, lo];
  const dx = up - lo;
  let cell: number;
  let small: boolean;
  if (dx === 0 && up === 0) {
    cell = 1;
    small = true;
  } else {
    cell = Math.max(Math.abs(lo), Math.abs(up));
    const U = (1 + (h5 >= 1.5 * h + 0.5 ? 1 / (1 + h) : 1.5 / (1 + h5))) * Math.max(1, ndiv) * Number.EPSILON;
    small = dx < cell * U * 3;
  }
  if (small) {
    if (cell > 10) cell = 9 + cell / 10;
    cell *= 0.75;
    if (minN > 1) cell /= minN;
  } else {
    cell = dx;
    if (ndiv > 1) cell /= ndiv;
  }
  if (cell < 20 * Number.MIN_VALUE) cell = 20 * Number.MIN_VALUE;
  const base = Math.pow(10, Math.floor(Math.log10(cell)));
  let unit = base;
  if (2 * base - cell < h * (cell - unit)) {
    unit = 2 * base;
    if (5 * base - cell < h5 * (cell - unit)) {
      unit = 5 * base;
      if (10 * base - cell < h * (cell - unit)) unit = 10 * base;
    }
  }
  let ns = Math.floor(lo / unit + eps);
  let nu = Math.ceil(up / unit - eps);
  while (ns * unit > lo + eps * unit) ns--;
  while (nu * unit < up - eps * unit) nu++;
  let k = Math.floor(0.5 + nu - ns);
  if (k < minN) {
    k = minN - k;
    if (ns >= 0) {
      nu += k / 2;
      ns -= k / 2 + (k % 2);
    } else {
      ns -= k / 2;
      nu += k / 2 + (k % 2);
    }
  }
  const out: number[] = [];
  for (let i = ns; i <= nu + 1e-9; i++) out.push(+(i * unit).toPrecision(12));
  return out;
}

/** base::findInterval(x, vec, rightmost.closed = TRUE), 1-based. */
function findInterval(x: number, vec: number[]) {
  const n = vec.length;
  if (x < vec[0]) return 0;
  if (x >= vec[n - 1]) return x === vec[n - 1] ? n - 1 : n;
  let i = 0;
  while (i < n - 1 && x >= vec[i + 1]) i++;
  return i + 1;
}

export interface LegendRow {
  from: number;
  to: number;
  color: string;
}

/** leaflet::colorBin equivalent: intervals [a, b), last one closed. */
export class BinScale {
  constructor(public breaks: number[], public colors: string[], public digits: number | null = null) {}

  index(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return -1;
    const b = this.breaks;
    if (value < b[0] || value > b[b.length - 1]) return -1;
    for (let i = 0; i < b.length - 1; i++) if (value < b[i + 1] || i === b.length - 2) return i;
    return -1;
  }

  color(value: number | null | undefined, fallback = "transparent") {
    const i = this.index(value);
    return i < 0 ? fallback : this.colors[i] ?? fallback;
  }

  /** Highest class first, like the original legends (sorted decreasing). */
  legend(): LegendRow[] {
    const rows: LegendRow[] = [];
    for (let i = 0; i < this.breaks.length - 1; i++) rows.push({ from: this.breaks[i], to: this.breaks[i + 1], color: this.colors[i] });
    return rows.reverse();
  }
}

const seq = (from: number, to: number, by: number) => {
  const out: number[] = [];
  for (let v = from; v <= to + by / 1e6; v += by) out.push(+v.toFixed(6));
  return out;
};
const spectral = (n: number) => rampPalette(BREWER.Spectral11, n);

interface ColourTable {
  vals: number[];
  cols: readonly string[];
  title: string;
  digits?: number;
}

function colourTable(indic: string, domain: [number, number]): ColourTable | null {
  const p2 = indic.slice(0, 2);
  if (indic === "ssm") return { vals: seq(0, 100, 10), cols: rampPalette(BREWER.RdYlBu10, 11), title: "SSM [%]" };
  if (indic === "ndvi") return { vals: seq(-0.8, 1, 0.2), cols: BREWER.RdYlGn11.slice(1), title: "NDVI" };
  if (indic === "fapar") return { vals: [...seq(0, 0.8, 0.1), 0.94], cols: BREWER.RdYlGn11.slice(1), title: "FAPAR" };
  if (indic === "pop309e" || indic === "pop108d") {
    const [a, b] = domain;
    return { vals: [0, 0.025, 0.05, 0.1, 0.33, 0.66, 1].map((p) => a + p * (b - a)), cols: [...PLASMA7].reverse(), title: "persons", digits: 0 };
  }
  if (p2 === "tm" || p2 === "ts") return { vals: seq(-40, 42, 2), cols: COLS_TEMP, title: "°C" };
  if (p2 === "ps") return { vals: seq(960, 1050, 5), cols: spectral(19), title: "hPa" };
  if (p2 === "hu") return { vals: [...seq(0, 90, 10), 95, 100], cols: spectral(12), title: "%" };
  if (p2 === "ws") return { vals: [0, 0.5, 1, 2, 3, 4, 6, 8, 10, 15, 20, 30, 40], cols: rampPalette(BREWER.PuRd9, 13), title: "m/s" };
  if (p2 === "sh") return { vals: seq(0, 0.7, 0.05), cols: spectral(15), title: "m³/m³" };
  if (indic === "irrmean_01h") return { vals: seq(0, 1000, 50), cols: rampPalette(BREWER.YlOrRd9, 21), title: "W/m²" };
  if (indic === "irrmean_24h") return { vals: seq(0, 350, 25), cols: rampPalette(BREWER.YlOrRd9, 15), title: "W/m²" };
  if (indic === "trsum_01h") return { vals: [0, 0.1, 0.2, 0.4, 0.5, 1, 5, 10, 20, 30, 40, 50], cols: rampPalette(BREWER.BuPu9, 12), title: "l/m²" };
  if (indic === "trsum_24h") return { vals: [0, 0.5, 1, 5, 10, 20, 30, 40, 50, 75, 100, 125, 150], cols: rampPalette(BREWER.BuPu9, 13), title: "l/m²" };
  return null;
}

export interface IndicatorScale {
  scale: BinScale;
  title: string;
  minmax: [number, number];
}

/** mapa_fun_cols(): classes for remote sensing, weather and social indicators. */
export function indicatorScale(indic: string, domain: [number, number]): IndicatorScale | null {
  const table = colourTable(indic, domain);
  if (!table) return null;
  let [a, b] = domain;
  if (!Number.isFinite(a) || !Number.isFinite(b)) [a, b] = [table.vals[0], table.vals[table.vals.length - 1]];
  if (a > b) [a, b] = [b, a];
  let i1 = findInterval(a, table.vals);
  let i2 = findInterval(b, table.vals);
  i1 = Math.max(1, Math.min(table.vals.length - 1, i1));
  i2 = Math.max(i1, Math.min(table.vals.length - 1, i2));
  return {
    scale: new BinScale(table.vals.slice(i1 - 1, i2 + 1), table.cols.slice(i1 - 1, i2), table.digits ?? null),
    title: table.title,
    minmax: [table.vals[0], table.vals[table.vals.length - 1]],
  };
}

/** mapa_fun_cols_ec(): colorBin(palette, domain, bins = n) with pretty breaks. */
export function eddyScale(indic: string, domain: [number, number], nbins: number) {
  const palette = indic === "RN_1_1_1" ? BREWER.OrRd9 : BREWER.BuPu9;
  let [a, b] = domain;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a === b) {
    a -= Math.abs(a) * 0.05 || 0.5;
    b += Math.abs(b) * 0.05 || 0.5;
  }
  const breaks = prettyR(a, b, Math.max(1, nbins));
  return new BinScale(breaks, rampPalette(palette, breaks.length - 1));
}

/** Ink colour with the better contrast on a fill. */
export function inkFor(hex: string) {
  if (!hex || hex === "transparent") return "#09090b";
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36 ? "#09090b" : "#fafafa";
}
