import type { Network } from "@/lib/catalog";

export function glyphSvg(shape: Network["shape"], color: string, size = 14) {
  const s = size;
  const c = s / 2;
  const stroke = "#ffffff";
  const shapes: Record<Network["shape"], string> = {
    circle: `<circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>`,
    diamond: `<path d="M${c} 1 L${s - 1} ${c} L${c} ${s - 1} L1 ${c} Z" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>`,
    triangle: `<path d="M${c} 1.2 L${s - 1} ${s - 1.5} L1 ${s - 1.5} Z" fill="${color}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`,
    square: `<rect x="1.5" y="1.5" width="${s - 3}" height="${s - 3}" rx="1.5" fill="${color}" stroke="${stroke}" stroke-width="1.5"/>`,
    hexagon: `<path d="M${c} 0.8 L${s - 1.2} ${s * 0.28} L${s - 1.2} ${s * 0.72} L${c} ${s - 0.8} L1.2 ${s * 0.72} L1.2 ${s * 0.28} Z" fill="${color}" stroke="${stroke}" stroke-width="1.4"/>`,
    ring: `<circle cx="${c}" cy="${c}" r="${c - 2.2}" fill="${stroke}" stroke="${color}" stroke-width="3"/>`,
  };
  return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true">${shapes[shape]}</svg>`;
}

export const pinSvg = (color: string) =>
  `<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path d="M12 31s10-10.4 10-18A10 10 0 0 0 2 13c0 7.6 10 18 10 18z" fill="${color}" stroke="#ffffff" stroke-width="1.6"/><circle cx="12" cy="12.5" r="3.6" fill="#ffffff"/></svg>`;

export const crosshairSvg = `<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="7" fill="none" stroke="#254380" stroke-width="1.8"/><path d="M13 1v7M13 18v7M1 13h7M18 13h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

export const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
