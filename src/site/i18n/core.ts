// Language of the public site. Romanian pages live at /<key>/, English ones at /en/<key>/.
// English text comes from dictionaries keyed by the Romanian string: the static site's dictionary
// (en-static.json, from the colleagues' pages) and ours (en-site.json). The JSX runtime in this
// folder translates text children and a few attributes as elements are created, so server and
// browser render the same English markup and hydration matches.
export type Lang = "ro" | "en";
export const LANGS: Lang[] = ["ro", "en"];

let LANG: Lang = "ro";
export const getLang = () => LANG;
export const isEn = () => LANG === "en";
/** Set synchronously before a page renders (server) and before hydration (browser). */
export const setLang = (lang: Lang) => {
  LANG = lang;
};

export const langOfKey = (key: string): Lang => (key === "en" || key.startsWith("en/") ? "en" : "ro");
/** Route key without the language prefix. */
export const baseKey = (key: string) => (key === "en" ? "" : key.startsWith("en/") ? key.slice(3) : key);
export const keyFor = (base: string, lang: Lang) => (lang === "en" ? (base ? `en/${base}` : "en") : base);

interface Dictionary {
  dict: Record<string, string>;
  rules?: [string, string][];
}

let DICT: Map<string, string> | null = null;
let RULES: [RegExp, string][] = [];
const CACHE = new Map<string, string | null>();
/** Romanian strings with no English version, collected while rendering English pages. */
export const MISSING = new Set<string>();
const RO_HINT = /[ăâîșțĂÂÎȘȚşţ]|\b(și|din|pentru|sau|care|este|sunt|cu|pe|la|de|în|ale|al|ai|unei|unui|fără|după|până|între)\b/;

export function installEn(...dicts: Dictionary[]) {
  DICT = new Map();
  RULES = [];
  CACHE.clear();
  // Later dictionaries win, so our own entries override the static site's.
  for (const d of dicts) {
    for (const [k, v] of Object.entries(d.dict)) DICT.set(k, v);
    for (const [re, to] of d.rules ?? []) RULES.push([new RegExp(re), to]);
  }
}

let loading: Promise<void> | null = null;
/** Loads the English dictionaries once. Romanian pages never download them. */
export function loadEn() {
  loading ??= Promise.all([import("./en-static.json"), import("./en-site.json")]).then(([a, b]) => installEn(a.default as unknown as Dictionary, b.default as unknown as Dictionary));
  return loading;
}

function lookup(s: string, depth = 0): string | null {
  const hit = DICT!.get(s);
  if (hit != null) return hit;
  if (depth > 3) return null;
  for (const [re, to] of RULES) {
    const m = s.match(re);
    if (m) return to.replace(/\$(\d)/g, (_, k) => {
      const g = m[+k] ?? "";
      const t = g ? lookup(g.trim(), depth + 1) : null;
      return t ?? g;
    });
  }
  if (s.includes(" · ")) {
    let changed = false;
    const parts = s.split(" · ").map((p) => {
      const t = lookup(p.trim(), depth + 1);
      if (t != null) changed = true;
      return t ?? p;
    });
    if (changed) return parts.join(" · ");
  }
  // "Text:" and "Text." fall back to "Text".
  const tail = /^(.*?)([:.])$/.exec(s);
  if (tail && tail[1]) {
    const t = lookup(tail[1], depth + 1);
    if (t != null) return t + tail[2];
  }
  return null;
}

/** English version of a Romanian string on English pages; the string itself otherwise. */
export function t(s: string): string {
  if (LANG !== "en" || !DICT || !s) return s;
  const core = s.trim();
  if (!core || !/[A-Za-zÀ-ž]/.test(core)) return s;
  let hit = CACHE.get(core);
  if (hit === undefined) {
    hit = lookup(core.replace(/\s+/g, " "));
    CACHE.set(core, hit);
    if (hit == null && RO_HINT.test(core)) MISSING.add(core);
  }
  return hit == null ? s : core === s ? hit : s.replace(core, hit);
}

/** Romanian or English text picked in code, for strings that are not worth a dictionary entry. */
export const pick = (ro: string, en: string) => (LANG === "en" ? en : ro);

/** Number in the page language: 1.234,5 in Romanian, 1,234.5 in English. */
export const numberLocale = () => (LANG === "en" ? "en-GB" : "ro-RO");
