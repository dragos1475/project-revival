// Route table of the public site. Every entry is prerendered to /<key>/index.html.
import type { ComponentType } from "react";
import { photoSrc } from "@/lib/photos";
import { HERO_PHOTO } from "@/lib/photos";
import { STATIONS } from "./content/stations";
import { PLATFORMS } from "./content/platforms";
import HomePage from "./pages/home";
import AboutPage from "./pages/about";
import StationsPage from "./pages/stations";
import InfrastructurePage from "./pages/infrastructure";
import AccessPage from "./pages/access";
import { StationPage } from "./pages/station";
import PlatformsPage from "./pages/platforms";
import { PlatformPage } from "./pages/platform";
import DataPage from "./pages/data";
import ApiPage from "./pages/api";
import DocsPage from "./pages/docs";
import ServicesPage from "./pages/services";
import NetworkPage from "./pages/network";
import ProjectsPage from "./pages/projects";
import FaqPage from "./pages/faq";
import ContactPage from "./pages/contact";
import SitesPage from "./pages/sites";
import { SiteSheetPage } from "./pages/site-sheet";
import { CAT, LW_POINTS, sheetKey } from "./content/lw";
import { baseKey, getLang, keyFor, langOfKey, t } from "./i18n/core";

export interface SiteRoute {
  key: string;
  title: string;
  description: string;
  Page: ComponentType;
  image?: string;
  searchable?: boolean;
}

const page = (key: string, title: string, description: string, Page: ComponentType, image?: string): SiteRoute => ({ key, title, description, Page, image, searchable: true });

/** Romanian pages; every one also exists in English under /en/. */
const RO_ROUTES: SiteRoute[] = [
  page("", "Acasă", "Infrastructura națională de cercetare e-Science pentru biodiversitate și ecosisteme: stații de teren, platforme LTSER și date deschise.", HomePage, photoSrc(HERO_PHOTO, 1200)),
  page("despre", "Despre", "Misiunea, obiectivele și istoricul LifeWatch România, infrastructură de cercetare a Universității din București.", AboutPage),
  page("infrastructura", "Proiectul și infrastructura", "Proiectul LifeWatch România: 11 laboratoare, rețeaua de stații din teren, centrul de date de la Sinaia, platforma web și serviciile de date.", InfrastructurePage),
  page("acces", "Acces la infrastructură", "Cine răspunde de infrastructura LifeWatch România, cine o poate folosi, procedura, costurile și cererea de acces.", AccessPage),
  page("statiuni", "Stațiunile de cercetare", "Cele patru stațiuni de cercetare ale Universității din București: Sinaia, Brăila, Orșova și Sfântu Gheorghe, și accesul pentru cercetători.", StationsPage),
  ...STATIONS.map((s) => ({
    key: `statiuni/${s.slug}`,
    title: s.name,
    description: s.summary,
    Page: () => <StationPage station={s} />,
    image: photoSrc(s.photo, 1200),
    searchable: false,
  })),
  page("situri", "Situri LTER și ICOS", "Toate siturile românești din registrul european DEIMS-SDR, cu stațiile de flux și cu cele 20 de stații climatice LifeWatch.", SitesPage),
  ...LW_POINTS.map((p) => ({
    key: sheetKey(p),
    title: p.ro,
    description: `${CAT[p.cat].one}: habitate, climă, biodiversitate, rețele și date pentru ${p.ro}.`,
    Page: () => <SiteSheetPage point={p} />,
    searchable: false,
  })),
  page("platforme", "Platforme LTER și LTSER", "Cercetarea socio-ecologică pe termen lung în România și cele șase platforme documentate în explorator.", PlatformsPage),
  ...PLATFORMS.map((p) => ({
    key: `platforme/${p.slug}`,
    title: p.name,
    description: p.summary,
    Page: () => <PlatformPage platform={p} />,
    image: photoSrc(p.photo, 1200),
    searchable: false,
  })),
  page("date", "Catalog de date", "Seturile de date ale infrastructurii: teledetecție, rețele de stații, măsurători brute, indicatori sociali și limite.", DataPage),
  page("date/api", "API de acces la date", "Rutele API-ului LifeWatch pentru stații, variabile și serii de timp, cu exemple de cereri și răspunsuri.", ApiPage),
  page("date/documentatie", "Documentație", "Fus orar, pas de timp, limite, valori lipsă și formatele de export ale datelor.", DocsPage),
  page("servicii", "Servicii", "Instrumente web, centrul de date de la Sinaia și formare pentru cercetare.", ServicesPage),
  page("retea", "Rețea și comunitate", "ILTER, LTER-Europe, eLTER și infrastructurile europene de cercetare în care contribuie LifeWatch România.", NetworkPage),
  page("proiecte", "Proiecte", "Proiectele europene și naționale susținute de infrastructura LifeWatch România și stațiunile unde lucrează fiecare.", ProjectsPage),
  page("intrebari-frecvente", "Întrebări frecvente", "Răspunsuri despre infrastructură, platformele LTSER, accesul la date și explorator.", FaqPage),
  page("contact", "Contact", "Adresele și telefoanele stațiilor de cercetare LifeWatch România.", ContactPage),
];

export const SITE_ROUTES: SiteRoute[] = [...RO_ROUTES, ...RO_ROUTES.map((r) => ({ ...r, key: keyFor(r.key, "en") }))];

const BY_KEY = new Map(SITE_ROUTES.map((r) => [r.key, r]));
export const findSiteRoute = (key: string) => BY_KEY.get(key) ?? null;
/** Romanian routes, for lists (search, sitemap order) that show each page once. */
export const BASE_ROUTES = RO_ROUTES;
export { langOfKey };

export const documentTitle = (route: SiteRoute | null) =>
  !route ? `${t("Pagina nu există")} · ${t("LifeWatch România")}` : baseKey(route.key) ? `${t(route.title)} · ${t("LifeWatch România")}` : `${t("LifeWatch România")} · ${t("Universitatea din București")}`;
export const NOT_FOUND_DESCRIPTION = "Pagina căutată nu există pe site-ul LifeWatch România.";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Title, description and Open Graph tags for a prerendered page. */
export function headTags(route: SiteRoute | null) {
  const title = escapeHtml(documentTitle(route));
  const description = escapeHtml(t(route?.description ?? NOT_FOUND_DESCRIPTION));
  const en = getLang() === "en";
  const base = import.meta.env.BASE_URL;
  const alt = (lang: "ro" | "en") => {
    const k = keyFor(baseKey(route!.key), lang);
    return `${base}${k ? `${k}/` : ""}`;
  };
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${en ? "en_GB" : "ro_RO"}" />`,
    `<meta property="og:site_name" content="LifeWatch România" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
  ];
  if (route?.image) tags.push(`<meta property="og:image" content="${escapeHtml(route.image)}" />`, `<meta name="twitter:card" content="summary_large_image" />`);
  if (!route) tags.push(`<meta name="robots" content="noindex" />`);
  else tags.push(`<link rel="alternate" hreflang="ro" href="${alt("ro")}" />`, `<link rel="alternate" hreflang="en" href="${alt("en")}" />`);
  return tags.join("\n    ");
}
