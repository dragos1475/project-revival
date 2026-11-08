// Organisation facts for the public site. Wording is original; facts come from lifewatch.ro
// (Despre, Stații, Rețea), checked in November 2026.

export const ORG = {
  name: "LifeWatch România",
  host: "Universitatea din București",
  hostGenitive: "Universității din București",
  center: "Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate",
  centerShort: "RCSES",
  centerUrl: "https://rcses.unibuc.ro/",
};

export const MISSION = [
  "LifeWatch România construiește și modernizează infrastructura de cercetare în științele vieții a Universității din București, ca nod național al infrastructurilor europene de cercetare.",
  "Stațiile de teren, platformele de monitorizare și centrul de date de la Sinaia sprijină studiul biodiversității și al funcționării ecosistemelor printr-o bază de date comună, instrumente de analiză și programe de formare.",
  "Infrastructura oferă administratorilor ariilor naturale și decidenților soluții bazate pe cunoaștere pentru conservarea biodiversității.",
];

export const VISION =
  "Alinierea infrastructurii românești de cercetare la cea europeană, cu accent pe cooperarea transfrontalieră privind gestionarea capitalului natural și pe cercetarea fundamentală.";

export const OBJECTIVES = [
  {
    title: "Calcul de înaltă performanță",
    body: "Resurse de calcul pentru integrarea, stocarea și analiza datelor despre ecosisteme și biodiversitate.",
  },
  {
    title: "Capacitate de cercetare comună",
    body: "Producerea în comun a datelor, pe patru direcții care se sprijină reciproc.",
    items: ["Dezvoltarea cunoașterii", "Colectarea datelor cu tehnologii noi", "Cunoaștere pentru sprijinirea deciziilor", "Programe de formare"],
  },
];

export interface Infrastructure {
  id: string;
  name: string;
  short: string;
  role: string;
  url: string;
}

/** European research infrastructures the Romanian node contributes to. */
export const INFRASTRUCTURES: Infrastructure[] = [
  { id: "lifewatch", name: "LifeWatch ERIC", short: "LifeWatch", role: "Infrastructură e-Science pentru cercetarea biodiversității și a ecosistemelor.", url: "https://www.lifewatch.eu/" },
  { id: "elter", name: "eLTER RI", short: "eLTER", role: "Cercetare ecologică pe termen lung, în situri și platforme socio-ecologice.", url: "https://elter-ri.eu/" },
  { id: "icos", name: "ICOS", short: "ICOS", role: "Observarea gazelor cu efect de seră și a fluxurilor de carbon.", url: "https://www.icos-cp.eu/" },
  { id: "danubius", name: "DANUBIUS-RI", short: "DANUBIUS", role: "Cercetarea sistemelor râu-mare, de la bazinul hidrografic la zona costieră.", url: "https://www.danubius-ri.eu/" },
];

export const NETWORKS_INTL = [
  { name: "ILTER", role: "Rețeaua internațională de cercetare ecologică pe termen lung. România face parte din ea din 2001.", url: "https://www.ilter.network/" },
  { name: "LTER-Europe", role: "Rețeaua europeană, care a introdus conceptul de platformă LTSER în 2007.", url: "https://lter-europe.net/" },
  { name: "DEIMS-SDR", role: "Registrul siturilor și al seturilor de date eLTER, cu fișe pentru platformele românești.", url: "https://deims.org/" },
];

export const DEIMS = {
  network: "https://deims.org/networks/4260f964-0ac4-4406-8adc-5afc06e31779",
  ltserRomania: "https://deims.org/cdf8ba96-4a30-4eb7-96cc-1c81e8320989",
};

export const EXTERNAL_MAPS = {
  advanced: "https://map.lifewatch.ro/map/#/viewer/23",
};

export interface Milestone {
  year: string;
  title: string;
  body: string;
  link?: string;
}

export const TIMELINE: Milestone[] = [
  { year: "1922", title: "Stațiunea Sinaia", body: "Profesorul A. Popovici-Bâznoșeanu înființează la Sinaia o bază pentru practica de teren a studenților la biologie.", link: "statiuni/sinaia" },
  { year: "1951", title: "Cercetători permanenți la Sinaia", body: "Stațiunea primește personal propriu. Până în 1989 publică 386 de lucrări științifice originale." },
  { year: "1955", title: "Stația hidrobiologică Brăila", body: "Începe cercetarea ecosistemelor Dunării de Jos, sub conducerea academicianului Nicolae Botnariuc.", link: "statiuni/braila" },
  { year: "1964", title: "Stațiunea Orșova", body: "Facultatea de Geografie înființează stațiunea de cercetare și practică de la Orșova.", link: "statiuni/orsova" },
  { year: "2001", title: "România intră în ILTER", body: "Cercetarea ecologică românească pe termen lung se conectează la rețeaua internațională." },
  { year: "2002", title: "Stația Sfântu Gheorghe", body: "Grupul de Cercetări Costiere deschide o bază în Delta Dunării, la gura brațului Sfântu Gheorghe.", link: "statiuni/sfantu-gheorghe" },
  { year: "2003", title: "Bucegi-Piatra Craiului, sit ILTER", body: "Platforma devine sit ILTER, iar din 2008 face parte din LTER-Europe.", link: "platforme/bucegi-piatra-craiului" },
  { year: "2004", title: "Rețeaua ALTER-Net", body: "Echipele românești participă activ la rețeaua europeană de cercetare a biodiversității." },
  { year: "2007", title: "Conceptul LTSER", body: "LTER-Europe propune platformele socio-ecologice. În același an începe cercetarea pe termen lung în Rodna-Călimani.", link: "platforme" },
];
