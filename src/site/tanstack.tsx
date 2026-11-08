// Glue between TanStack routes and the public site's page table (src/site/routes.tsx).
import { redirect } from "@tanstack/react-router";
import { SiteApp } from "./app";
import { toKey } from "./router";
import { documentTitle, findSiteRoute, NOT_FOUND_DESCRIPTION } from "./routes";
import { baseKey, langOfKey, loadEn, setLang, t } from "./i18n/core";

// Loaders are not re-run during hydration, so English pages load their dictionaries here,
// before the first client render, to match the server's English markup.
if (typeof window !== "undefined" && /^\/en(\/|$)/.test(window.location.pathname)) await loadEn();

const MOVED_STATIONS = /^(en\/)?infrastructura\/(sinaia|braila|orsova|sfantu-gheorghe)(\/.*)?$/;

/** Loader shared by "/" and "/$": handles old URLs and loads English dictionaries before render. */
export async function loadSitePage(pathname: string) {
  const key = toKey(pathname);
  const moved = MOVED_STATIONS.exec(key);
  if (moved) throw redirect({ href: `/${moved[1] ?? ""}statiuni/${moved[2]}/`, statusCode: 301 });
  const lang = langOfKey(key);
  if (lang === "en") await loadEn();
  return { key: findSiteRoute(key) ? key : "__404__", lang };
}

export function siteHead(key: string, lang: "ro" | "en") {
  setLang(lang);
  const route = findSiteRoute(key);
  const title = documentTitle(route);
  const description = t(route?.description ?? NOT_FOUND_DESCRIPTION);
  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: lang === "en" ? "en_GB" : "ro_RO" },
    { property: "og:site_name", content: "LifeWatch România" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: route?.image ? "summary_large_image" : "summary" },
  ];
  if (route?.image) meta.push({ property: "og:image", content: route.image }, { name: "twitter:image", content: route.image });
  if (!route) meta.push({ name: "robots", content: "noindex" });
  const base = route ? baseKey(route.key) : "";
  const links = route
    ? [
        { rel: "alternate", hrefLang: "ro", href: `/${base ? `${base}/` : ""}` },
        { rel: "alternate", hrefLang: "en", href: `/en/${base ? `${base}/` : ""}` },
      ]
    : [];
  return { meta, links };
}

export function SitePage({ siteKey, lang }: { siteKey: string; lang: "ro" | "en" }) {
  setLang(lang);
  return <SiteApp initialKey={siteKey} />;
}
