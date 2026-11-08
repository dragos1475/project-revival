// Client-side exports: CSV, clipboard, XLSX, GeoJSON, GeoTIFF and chart PNG. No dependencies.

export interface Column<Row> {
  key: keyof Row & string;
  label: string;
}
type Cell = string | number | null | undefined;
type AnyRow = Record<string, unknown>;

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const cellValue = (v: unknown): Cell => (typeof v === "number" || typeof v === "string" ? v : v === null || v === undefined ? null : String(v));
const csvCell = (v: Cell) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV<Row extends AnyRow>(columns: Column<Row>[], rows: Row[]) {
  const head = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(cellValue(r[c.key]))).join(","));
  return [head, ...body].join("\n");
}

export function downloadCSV<Row extends AnyRow>(columns: Column<Row>[], rows: Row[], filename: string) {
  downloadBlob(new Blob(["﻿" + toCSV(columns, rows)], { type: "text/csv;charset=utf-8" }), filename);
}

export async function copyRows<Row extends AnyRow>(columns: Column<Row>[], rows: Row[]) {
  const tsv = [columns.map((c) => c.label).join("\t"), ...rows.map((r) => columns.map((c) => cellValue(r[c.key]) ?? "").join("\t"))].join("\n");
  await navigator.clipboard.writeText(tsv);
}

export function downloadGeoJSON(featureCollection: unknown, filename: string) {
  downloadBlob(new Blob([JSON.stringify(featureCollection)], { type: "application/geo+json" }), filename);
}

// XLSX ---------------------------------------------------------------------------------
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

function colName(i: number) {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Single-sheet XLSX with a frozen, bold header row and a shared strings table. */
export function downloadXLSX<Row extends AnyRow>(columns: Column<Row>[], rows: Row[], filename: string, sheetName = "Date") {
  const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const strings: string[] = [];
  const index = new Map<string, number>();
  const shared = (text: string) => {
    if (!index.has(text)) {
      index.set(text, strings.length);
      strings.push(text);
    }
    return index.get(text)!;
  };
  const cell = (ref: string, v: Cell, style = 0) => {
    if (v === null || v === undefined || v === "") return "";
    const st = style ? ` s="${style}"` : "";
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${st}><v>${v}</v></c>`;
    return `<c r="${ref}" t="s"${st}><v>${shared(String(v))}</v></c>`;
  };
  const sheetRows = [`<row r="1">${columns.map((c, i) => cell(`${colName(i)}1`, c.label, 1)).join("")}</row>`];
  rows.forEach((r, ri) => {
    const n = ri + 2;
    sheetRows.push(`<row r="${n}">${columns.map((c, ci) => cell(`${colName(ci)}${n}`, cellValue(r[c.key]))).join("")}</row>`);
  });
  const sst = strings.map((x) => `<si><t${x !== x.trim() ? ' xml:space="preserve"' : ""}>${xmlEsc(x)}</t></si>`).join("");
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="${xmlEsc(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rId3" Type="${REL}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/sharedStrings.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="${NS}" count="${strings.length}" uniqueCount="${strings.length}">${sst}</sst>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${sheetRows.join("")}</sheetData></worksheet>`,
  };
  const enc = new TextEncoder();
  downloadBlob(new Blob([storeZip(Object.entries(files).map(([name, text]) => [name, enc.encode(text)]))], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP archive with stored (uncompressed) entries. */
function storeZip(entries: [string, Uint8Array][]) {
  const enc = new TextEncoder();
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  let cdSize = 0;
  for (const [name, data] of entries) {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(local.buffer, nameBytes as BlobPart, data as BlobPart);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(12, time, true);
    cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(cd.buffer, nameBytes as BlobPart);
    cdSize += 46 + nameBytes.length;
    offset += 30 + nameBytes.length + data.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer]);
}

// GeoTIFF ------------------------------------------------------------------------------
export interface GridLike {
  west: number;
  north: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  values: ArrayLike<number>;
}

/** Single band Float32 GeoTIFF, EPSG:4326, nodata NaN, rows ordered north to south. */
export function geoTiffBlob(grid: GridLike) {
  const { width, height, west, north, dx, dy, values } = grid;
  const SHORT = 3, LONG = 4, ASCII = 2, DOUBLE = 12;
  const extra: Uint8Array[] = [];
  let extraSize = 0;
  const addExtra = (bytes: Uint8Array) => {
    const at = extraSize;
    extra.push(bytes);
    extraSize += bytes.byteLength;
    return at;
  };
  const doubles = (arr: number[]) => {
    const b = new DataView(new ArrayBuffer(arr.length * 8));
    arr.forEach((v, i) => b.setFloat64(i * 8, v, true));
    return new Uint8Array(b.buffer);
  };
  const shorts = (arr: number[]) => {
    const b = new DataView(new ArrayBuffer(arr.length * 2));
    arr.forEach((v, i) => b.setUint16(i * 2, v, true));
    return new Uint8Array(b.buffer);
  };
  const geoKeys = [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326];
  const pixelScale = addExtra(doubles([dx, dy, 0]));
  const tiepoint = addExtra(doubles([0, 0, 0, west, north, 0]));
  const geoKeyDir = addExtra(shorts(geoKeys));
  type Tag = [number, number, number, number | "DATA" | "NAN" | { extra: number }];
  const tags: Tag[] = [
    [256, LONG, 1, width], [257, LONG, 1, height], [258, SHORT, 1, 32], [259, SHORT, 1, 1], [262, SHORT, 1, 1],
    [273, LONG, 1, "DATA"], [277, SHORT, 1, 1], [278, LONG, 1, height], [279, LONG, 1, width * height * 4],
    [284, SHORT, 1, 1], [339, SHORT, 1, 3],
    [33550, DOUBLE, 3, { extra: pixelScale }], [33922, DOUBLE, 6, { extra: tiepoint }], [34735, SHORT, geoKeys.length, { extra: geoKeyDir }],
    [42113, ASCII, 4, "NAN"],
  ];
  const ifdSize = 2 + tags.length * 12 + 4;
  const extraOffset = 8 + ifdSize;
  const dataOffset = extraOffset + extraSize;
  const header = new DataView(new ArrayBuffer(8 + ifdSize));
  header.setUint8(0, 0x49);
  header.setUint8(1, 0x49);
  header.setUint16(2, 42, true);
  header.setUint32(4, 8, true);
  header.setUint16(8, tags.length, true);
  tags.forEach(([tag, type, count, value], i) => {
    const p = 10 + i * 12;
    header.setUint16(p, tag, true);
    header.setUint16(p + 2, type, true);
    header.setUint32(p + 4, count, true);
    if (value === "DATA") header.setUint32(p + 8, dataOffset, true);
    else if (value === "NAN") [..."nan"].forEach((ch, k) => header.setUint8(p + 8 + k, ch.charCodeAt(0)));
    else if (typeof value === "object") header.setUint32(p + 8, extraOffset + value.extra, true);
    else if (type === SHORT) header.setUint16(p + 8, value, true);
    else header.setUint32(p + 8, value, true);
  });
  const pixels = new DataView(new ArrayBuffer(width * height * 4));
  for (let i = 0; i < width * height; i++) pixels.setFloat32(i * 4, values[i], true);
  return new Blob([header.buffer, ...(extra as BlobPart[]), pixels.buffer], { type: "image/tiff" });
}

// Chart PNG ----------------------------------------------------------------------------
/** Rasterises the first SVG inside a container (Recharts surface) to a 2x PNG. */
export async function exportSvgPng(container: HTMLElement, filename: string, background: string) {
  const svg = container.querySelector("svg.recharts-surface") ?? container.querySelector("svg");
  if (!svg) return;
  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const style = getComputedStyle(container);
  clone.setAttribute("style", `font-family:${style.fontFamily};color:${style.color}`);
  // Resolve CSS custom properties: the standalone SVG has no access to the page stylesheet.
  const root = getComputedStyle(document.documentElement);
  const data = new XMLSerializer().serializeToString(clone).replace(/var\((--[\w-]+)\)/g, (_, name: string) => root.getPropertyValue(name).trim() || "#71717a");
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * 2);
  canvas.height = Math.round(height * 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(2, 2);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  await new Promise<void>((resolve) => canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
    resolve();
  }, "image/png"));
}
