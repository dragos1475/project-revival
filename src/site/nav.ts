// Main menu (header mega menu and mobile sheet) and the explorer's modules, shared with the search.
import { baseKey } from "./i18n/core";
import { Database, RadioTower, Satellite, Users, type LucideIcon } from "lucide-react";

export interface MenuLink {
  label: string;
  note: string;
  /** Site route key, with an optional anchor. */
  to?: string;
  hash?: string;
  /** External address, or the explorer. */
  href?: string;
}
export interface Menu {
  id: string;
  label: string;
  desc: string;
  /** First path segments that belong to this menu, for the active state. */
  match: string[];
  links: MenuLink[];
}

export const MENUS: Menu[] = [
  {
    id: "despre",
    label: "Despre",
    desc: "Cine suntem, ce construim și cum ne legăm de infrastructurile europene.",
    match: ["despre", "infrastructura", "acces", "proiecte", "intrebari-frecvente", "contact"],
    links: [
      { label: "Despre LifeWatch România", note: "Misiune, obiective și istoric", to: "despre" },
      { label: "Proiectul și infrastructura", note: "Laboratoare, rețea de teren, centru de date", to: "infrastructura" },
      { label: "Acces la infrastructură", note: "Cine răspunde, cum se face cererea", to: "acces" },
      { label: "Proiecte susținute", note: "Unde lucrează fiecare proiect", to: "proiecte" },
      { label: "Platforma web", note: "Arhitectură, servicii OGC și STAC", to: "infrastructura", hash: "platforma" },
      { label: "LifeWatch, eLTER și ICOS", note: "Cum se leagă infrastructurile", to: "", hash: "icos-elter" },
      { label: "Întrebări frecvente", note: "Infrastructură, date, explorator", to: "intrebari-frecvente" },
      { label: "Contact", note: "Adresele și telefoanele stațiunilor", to: "contact" },
    ],
  },
  {
    id: "statiuni",
    label: "Stațiuni",
    desc: "Patru stațiuni ale Universității din București, de la Bucegi la Marea Neagră.",
    match: ["statiuni"],
    links: [
      { label: "Toate stațiunile", note: "Prezentare, galerii, date", to: "statiuni" },
      { label: "Sinaia", note: "Stațiunea Zoologică · din 1922", to: "statiuni/sinaia" },
      { label: "Brăila", note: "Lunca Dunării · din 1955", to: "statiuni/braila" },
      { label: "Orșova", note: "Defileul Dunării · din 1964", to: "statiuni/orsova" },
      { label: "Sfântu Gheorghe", note: "Delta și litoralul · din 2002", to: "statiuni/sfantu-gheorghe" },
      { label: "Acces pentru cercetători", note: "Stațiuni, echipamente, centrul de date", to: "acces" },
      { label: "Colaboratori la Brăila", note: "SCDA Brăila și living lab-ul ENoLL", to: "statiuni/braila", hash: "colaboratori" },
    ],
  },
  {
    id: "situri",
    label: "Situri LTER",
    desc: "Siturile de cercetare ecologică pe termen lung din România, înregistrate în DEIMS-SDR.",
    match: ["situri", "platforme"],
    links: [
      { label: "Siturile noastre", note: "Operate de Universitatea din București", to: "situri", hash: "noastre" },
      { label: "Rețeaua LTER România", note: "Toate siturile din DEIMS", to: "situri", hash: "retea" },
      { label: "Stațiile de flux", note: "Fluxuri de carbon, apă și energie", to: "situri", hash: "icos" },
      { label: "Platformele LTSER", note: "Șase platforme socio-ecologice", to: "platforme" },
      { label: "Harta zonelor", note: "Toate punctele pe o hartă", to: "", hash: "harta" },
    ],
  },
  {
    id: "date",
    label: "Date și instrumente",
    desc: "Explorați stațiile, siturile și datele lor: habitate, climă, biodiversitate, serii de măsurători.",
    match: ["date", "servicii"],
    links: [
      { label: "Exploratorul LTSER", note: "Teledetecție, rețele de stații, indicatori", href: "explorer" },
      { label: "Fișele siturilor", note: "Hartă, fișe de sit, instrumente", to: "situri/insulele-brailei" },
      { label: "Geoportalul LifeWatch", note: "Hărți interactive și serii de timp", href: "https://map.lifewatch.ro/" },
      { label: "LTSER Explorer", note: "Portalul original, pe HTTP", href: "http://193.226.53.30/ltser/" },
      { label: "Stațiile din teren", note: "20 de stații climatice și 5 de flux", to: "infrastructura", hash: "retea-teren" },
      { label: "Catalog de date", note: "Seturile de date ale infrastructurii", to: "date" },
      { label: "API de acces", note: "Rute și exemple de cereri", to: "date/api" },
      { label: "Servicii", note: "Centrul de date și instrumente web", to: "servicii" },
    ],
  },
  {
    id: "retea",
    label: "Rețea",
    desc: "Infrastructurile europene și proiectele în care lucrăm.",
    match: ["retea"],
    links: [
      { label: "Rețea și comunitate", note: "ILTER, LTER-Europe, eLTER", to: "retea" },
      { label: "Proiectele noastre", note: "Restore4Life, RESTORE4Cs, CROSSEU și altele", to: "proiecte" },
      { label: "LifeWatch ERIC", note: "e-Știință pentru biodiversitate", href: "https://www.lifewatch.eu/" },
      { label: "eLTER RI", note: "Cercetare ecologică pe termen lung", href: "https://elter-ri.eu/" },
      { label: "ICOS", note: "Observarea carbonului", href: "https://www.icos-cp.eu/" },
      { label: "DANUBIUS-RI", note: "Sisteme fluviu–mare", href: "https://www.danubius-ri.eu/" },
      { label: "MIRRI-ERIC", note: "Resurse microbiene", href: "https://www.mirri.org/" },
      { label: "ENoLL", note: "Living lab-ul de la Brăila", href: "https://enoll.org/member/agrodatasmart/" },
    ],
  },
];

export const activeMenu = (key: string) => MENUS.find((m) => m.match.includes(baseKey(key).split("/")[0]))?.id ?? null;

export interface ExplorerModule {
  id: string;
  title: string;
  body: string;
  path: string;
  icon: LucideIcon;
}

export const EXPLORER_MODULES: ExplorerModule[] = [
  { id: "rs", title: "Teledetecție", body: "Hărți lunare SSM, NDVI și FAPAR, serii pe punct sau pe unitate administrativă.", path: "teledetectie/national", icon: Satellite },
  { id: "net", title: "Rețele de stații", body: "Valori orare, zilnice și semi-orare pe hartă, grafice cu două axe și metadatele instrumentelor.", path: "retele/meteo", icon: RadioTower },
  { id: "platform", title: "Platforma de date", body: "Măsurători brute pentru fiecare stație, până la patru variabile comparate pe ferestre de cel mult 7 zile.", path: "platforma/statii", icon: Database },
  { id: "social", title: "Indicatori sociali", body: "Populația după domiciliu, pe sex și vârstă, și emigrația definitivă pentru 208 unități administrative.", path: "social", icon: Users },
];
