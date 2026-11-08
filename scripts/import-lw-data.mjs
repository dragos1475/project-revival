// Imports the data snapshot of the static LifeWatch România site that colleagues send as
// self-contained HTML pages (data and images inlined), e.g. "Primit de la colegi /lifewatch-romania-html".
//   node scripts/import-lw-data.mjs <folder with explorer.html, explorer-en.html, index.html, ...>
// Writes:
//   src/site/content/lw-data.json      points without boundaries, bundled with the site
//   src/site/i18n/en-static.json        the static site's Romanian → English dictionary and rules
//   src/site/content/lw-photos.json     photos and diagrams used on the static site's pages
//   public/data/lw-boundaries.json      site boundaries, fetched by the maps at runtime
//   public/data/lw-basemap.json         Natural Earth basemap for Romania
//   public/data/lw-legends.json         EUNIS level 1 and CORINE 2018 legends
//   public/img/{deims,inat,lw,site}/    images decoded from the pages
// Images and slugs already in lw-data.json are kept, so URLs and photo files stay stable.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const src = path.resolve(process.argv[2] ?? "Primit de la colegi /lifewatch-romania-html");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = (rel) => path.join(root, rel);

/** Runs the inline scripts that assign window.LW_* and returns those globals. */
function globals(file) {
  const html = fs.readFileSync(path.join(src, file), "utf8");
  const win = {};
  for (const [, body] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!/^\s*(\/\*[\s\S]*?\*\/\s*)?window\.LW_[A-Z_]+\s*=/.test(body)) continue;
    const ctx = { window: win };
    vm.createContext(ctx);
    vm.runInContext(body, ctx);
  }
  return { html, win };
}

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Pixel size of a JPEG or PNG buffer. */
function size(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  for (let i = 2; i < buf.length - 9; ) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

/** Writes a data: URI to public/<dir>/ and returns its public path. */
function save(uri, dir, name) {
  const m = /^data:image\/([a-z+]+);base64,(.+)$/.exec(uri);
  if (!m) return uri;
  const buf = Buffer.from(m[2], "base64");
  const ext = { jpeg: "jpg", "svg+xml": "svg" }[m[1]] ?? m[1];
  const file = `${name ?? crypto.createHash("md5").update(buf).digest("hex").slice(0, 12)}.${ext}`;
  fs.mkdirSync(out(`public/img/${dir}`), { recursive: true });
  fs.writeFileSync(out(`public/img/${dir}/${file}`), buf);
  return `img/${dir}/${file}`;
}

const { win } = globals("explorer.html"); // the explorer page carries every photo
const data = win.LW_DATA;
const en = globals("explorer-en.html").win.LW_EN;

const prevFile = out("src/site/content/lw-data.json");
const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, "utf8")) : { points: [] };
const prevByKey = new Map(prev.points.map((p) => [p.key, p]));

const boundaries = {};
const seen = new Set(prev.points.map((p) => p.slug));
let decoded = 0;
const points = data.points.map((p) => {
  const { boundary, _marker, ...rest } = p;
  if (boundary) boundaries[p.key] = boundary;
  const old = prevByKey.get(p.key);
  let slug = old?.slug;
  if (!slug) {
    slug = slugify(p.ro);
    while (seen.has(slug)) slug += "-2";
    seen.add(slug);
  }
  const used = new Set();
  const images = (p.images ?? []).map((img) => {
    const i = (old?.images ?? []).findIndex((o, k) => !used.has(k) && o.alt === img.alt && o.credit === img.credit);
    if (i >= 0) {
      used.add(i);
      return { ...img, src: old.images[i].src, thumb: old.images[i].thumb ?? img.thumb };
    }
    decoded++;
    const srcPath = save(img.src, "lw");
    return { ...img, src: srcPath, thumb: img.thumb ? save(img.thumb, "lw") : undefined };
  });
  const oldTop = new Map((old?.inat?.top ?? []).map((t) => [t.taxon, t]));
  const inat = p.inat && {
    ...p.inat,
    top: (p.inat.top ?? []).map((t) => {
      if (!t.img) return t;
      const o = oldTop.get(t.taxon);
      if (o?.img) return { ...t, img: o.img };
      decoded++;
      return { ...t, img: save(t.img, "inat") };
    }),
  };
  return { ...rest, slug, images, inat };
});

fs.writeFileSync(prevFile, JSON.stringify({ generated: data.generated, catNames: data.catNames, ltserNets: data.ltserNets, points }));
fs.mkdirSync(out("public/data"), { recursive: true });
fs.writeFileSync(out("public/data/lw-boundaries.json"), JSON.stringify(boundaries));
fs.writeFileSync(out("public/data/lw-basemap.json"), JSON.stringify(win.LW_BASE));
fs.writeFileSync(out("public/data/lw-legends.json"), JSON.stringify(win.LW_LEGENDS));
fs.mkdirSync(out("src/site/i18n"), { recursive: true });
fs.writeFileSync(out("src/site/i18n/en-static.json"), JSON.stringify(en));

// Photos and diagrams placed directly in the pages (not in the data): one file per image.
const photos = {};
for (const file of fs.readdirSync(src).filter((f) => f.endsWith(".html") && !f.endsWith("-en.html"))) {
  const html = fs.readFileSync(path.join(src, file), "utf8");
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    const uri = /src="(data:image\/[^"]+)"/.exec(tag)?.[1];
    if (!uri) continue;
    const alt = /alt="([^"]*)"/.exec(tag)?.[1] ?? "";
    const buf = Buffer.from(uri.split(",")[1], "base64");
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
    if (Object.values(photos).some((x) => x.hash === hash)) continue;
    const name = `${slugify(alt).slice(0, 48) || "img"}-${hash}`;
    photos[name] = { hash, src: save(uri, "site", name), alt, page: file, ...size(buf) };
  }
}
fs.writeFileSync(out("src/site/content/lw-photos.json"), JSON.stringify(photos, null, 1));

console.log(
  `${points.length} points, ${Object.keys(boundaries).length} boundaries, ${decoded} new images, ` +
    `${Object.keys(photos).length} page photos, ${Object.keys(en.dict).length} EN phrases, generated ${data.generated}`,
);
