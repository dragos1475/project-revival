// Photos and diagrams of the LifeWatch România project, decoded from the colleagues' pages by
// scripts/import-lw-data.mjs (credit: Proiectul LifeWatch România).
import raw from "./lw-photos.json";
import type { LwImage } from "./lw";

interface SitePhoto {
  src: string;
  alt: string;
  w?: number;
  h?: number;
}
const ALL = raw as Record<string, SitePhoto & { hash: string }>;

/** Photo by the hash suffix of its file name, with its own caption as alt text unless given. */
export function sitePhoto(hash: string, alt?: string): LwImage & { w?: number; h?: number } {
  const p = Object.values(ALL).find((x) => x.hash === hash);
  if (!p) throw new Error(`Missing site photo ${hash}`);
  return { src: p.src, alt: alt ?? p.alt, credit: "Proiectul LifeWatch România", w: p.w, h: p.h };
}

export const LOGOS = {
  lifewatch: sitePhoto("cd6b2b82", "LifeWatch România"),
  ub: sitePhoto("f6f2fbfc", "Universitatea din București"),
  rcses: sitePhoto("167ac2e4", "RCSES, Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate"),
  rcsesSmall: sitePhoto("da23b8f9", "RCSES"),
  funding: sitePhoto("8e4159e0", "Uniunea Europeană, Guvernul României, Programul Operațional Competitivitate, Instrumente Structurale 2014–2020"),
};
