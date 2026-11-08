// Map symbols of the point categories: square stations, round sites, ICOS triangles, meteo diamonds.
import { CAT, type Cat } from "../content/lw";

function inner(cat: Cat, s: number) {
  const c = CAT[cat] ?? CAT.lter;
  const h = s / 2;
  if (c.shape === "square")
    return `<rect x="2" y="2" width="${s - 4}" height="${s - 4}" rx="3" fill="${c.color}" stroke="#fff" stroke-width="2"/><circle cx="${h}" cy="${h}" r="${s / 6}" fill="#B9E27A"/>`;
  if (c.shape === "triangle") return `<path d="M${h} 2 L${s - 2} ${s - 2} L2 ${s - 2} Z" fill="${c.color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
  if (c.shape === "diamond") return `<path d="M${h} 1 L${s - 1} ${h} L${h} ${s - 1} L1 ${h} Z" fill="${c.color}" stroke="#fff" stroke-width="2"/>`;
  return `<circle cx="${h}" cy="${h}" r="${h - 2}" fill="${c.color}" stroke="#fff" stroke-width="2"/>`;
}

/** SVG markup of a category symbol, for Leaflet icons. */
export const shapeSvg = (cat: Cat, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${inner(cat, size)}</svg>`;

/** Category symbol as a React element. */
export function CatShape({ cat, size = 16, className }: { cat: Cat; size?: number; className?: string }) {
  return <span aria-hidden className={className ?? "inline-flex shrink-0 items-center justify-center"} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: shapeSvg(cat, size) }} />;
}

/** Small label with the category symbol and its name. */
export function CatTag({ cat }: { cat: Cat }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap text-navy dark:text-foreground">
      <CatShape cat={cat} size={14} />
      {CAT[cat].one}
    </span>
  );
}
