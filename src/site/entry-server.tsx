// Used only by scripts/prerender.mjs at build time.
import { renderToString } from "react-dom/server";
import { SiteApp } from "./app";
import { findSiteRoute, SITE_ROUTES, headTags } from "./routes";
import { langOfKey, loadEn, MISSING, setLang } from "./i18n/core";

/** Loads what English pages need; call once before rendering. */
export const prepare = () => loadEn();

export function render(key: string) {
  const route = findSiteRoute(key);
  const lang = key === "__404__" ? "ro" : langOfKey(key);
  setLang(lang);
  return {
    status: route ? 200 : 404,
    lang,
    head: headTags(route),
    html: renderToString(<SiteApp initialKey={key} />),
  };
}

export const routeKeys = () => SITE_ROUTES.map((r) => r.key);
/** Romanian strings that English pages showed untranslated. */
export const missingEnglish = () => [...MISSING].sort();
