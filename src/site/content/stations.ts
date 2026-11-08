// The four research stations. Facts from lifewatch.ro station pages; wording is original.
import { STATION_PHOTOS } from "@/lib/photos";
import type { Photo } from "@/lib/photos";

export interface ExplorerLink {
  label: string;
  path: string;
  query?: Record<string, string | number>;
}

export interface StationSection {
  id: string;
  title: string;
  lede?: string;
  items?: string[];
  modules?: { code?: string; title: string; body?: string }[];
}

export interface Station {
  slug: "braila" | "sfantu-gheorghe" | "sinaia" | "orsova";
  short: string;
  name: string;
  founded: number;
  county: string;
  setting: string;
  summary: string;
  focus: string[];
  operator: string;
  address: string;
  phone: string;
  phoneHref: string;
  website?: string;
  /** Approximate location of the station, for the atlas and map links. */
  lonLat: [number, number];
  photo: Photo;
  facts: { label: string; value: string }[];
  sections: StationSection[];
  explorer: ExplorerLink[];
  platforms: string[];
}

export const STATIONS: Station[] = [
  {
    slug: "braila",
    short: "Brăila",
    name: "Stația de cercetare Brăila",
    founded: 1955,
    county: "Brăila",
    setting: "Lunca Dunării, Bălțile Brăilei",
    summary:
      "Stație de cercetare în lunca Dunării, înființată în 1955. Coordonează monitorizarea platformei LTSER Insulele Brăilei și găzduiește componente LifeWatch, ICOS, DANUBIUS și LTER.",
    focus: ["Climă și hidrologie", "Nutrienți", "Vegetație", "Păsări acvatice"],
    operator: "Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate, Universitatea din București",
    address: "Str. Ciprian Porumbescu nr. 4, Brăila",
    phone: "0239 670 046",
    phoneHref: "tel:+40239670046",
    lonLat: [27.9575, 45.2692],
    photo: STATION_PHOTOS.braila,
    facts: [
      { label: "Înființare", value: "1955, stație hidrobiologică" },
      { label: "Platformă LTSER", value: "Insulele Brăilei" },
      { label: "Infrastructuri", value: "LifeWatch, ICOS, DANUBIUS, LTER" },
    ],
    sections: [
      {
        id: "istoric",
        title: "Istoric",
        lede: "Stația a pornit în 1955 ca bază hidrobiologică pentru învățământul și cercetarea universitară. A fost condusă de academicianul Nicolae Botnariuc, apoi de profesorul Angheluță Vădineanu, și a găzduit practica de teren a studenților la biologie. Cercetarea s-a concentrat pe ecosistemele acvatice și terestre ale Dunării de Jos.",
      },
      {
        id: "monitorizare",
        title: "Monitorizare pe termen lung",
        lede: "Parametrii monitorizați în lunca Dunării:",
        items: [
          "Clima și hidrologia regională",
          "Nutrienții din sedimente și din apă",
          "Structura comunităților bentonice",
          "Structura și productivitatea vegetației acvatice, terestre și de zone umede",
          "Structura comunităților de păsări acvatice",
        ],
      },
      {
        id: "module",
        title: "Module de cercetare",
        modules: [
          { title: "Telemetrie și teledetecție", body: "Urmărirea dispersiei și a migrației speciilor, cartarea ecosistemelor." },
          { title: "Biodiversitatea păsărilor", body: "Identificare și monitorizare la nivel de specie, din înregistrări audio și video." },
          { title: "Procese ecologice", body: "Senzori și experimente la scara ecosistemului." },
          { title: "Senzori in situ", body: "Umiditatea, temperatura și conductivitatea solului, completate de analize chimice." },
          { title: "Genetică și biodiversitate", body: "Analize genetice pentru taxonomie și filogenie." },
          { title: "Sistem informatic", body: "Gestionarea seturilor mari de date despre zonele umede din lunca Dunării." },
        ],
      },
      {
        id: "echipamente",
        title: "Echipamente",
        items: [
          "Puncte de prelevare pe fiecare tip de habitat",
          "Stație de monitorizare intensivă cu senzori meteorologici și de sol, inclusiv senzori în puțuri de adâncime, cu date în timp real",
          "Echipamente portabile LI-COR pentru măsurarea pe termen lung a CO₂ din sol",
          "Drone, sisteme satelitare și stații automate",
          "Laborator de genetică și biologie moleculară pentru taxonomie, filogenie, proteomică și metabolomică",
          "Mijloace de transport și comunicații pentru campaniile de teren",
        ],
      },
      {
        id: "ecosisteme",
        title: "Ecosisteme studiate",
        lede: "Aria de lucru acoperă Sistemul Dunării de Jos, Câmpia Română, Podișul și Munții Dobrogei.",
        items: ["Terenuri agricole, pajiști și păduri", "Lacuri puțin adânci și fluviul Dunărea", "Zone umede și mlaștini"],
      },
    ],
    explorer: [
      { label: "Stația meteorologică Brăila", path: "retele/meteo", query: { statie: "BR-Bra" } },
      { label: "Teledetecție pe Insulele Brăilei", path: "teledetectie/administrativ", query: { unitate: "ltser", id: 2 } },
      { label: "Eddy covariance", path: "retele/eddy" },
    ],
    platforms: ["insulele-brailei"],
  },
  {
    slug: "sfantu-gheorghe",
    short: "Sfântu Gheorghe",
    name: "Stația de cercetare Sfântu Gheorghe",
    founded: 2002,
    county: "Tulcea",
    setting: "Delta Dunării, țărmul Mării Negre",
    summary:
      "Stație de cercetare costieră la gura brațului Sfântu Gheorghe, înființată în 2002. Studiază evoluția deltei, a plajelor și a zonei litorale, inclusiv efectul furtunilor, al viiturilor și al creșterii nivelului mării.",
    focus: ["Geomorfologie costieră", "Hidrodinamică", "Climă costieră", "Calitatea apei"],
    operator: "Grupul de Cercetări Costiere, Facultatea de Geografie, Universitatea din București",
    address: "Str. Principală nr. 137, Sfântu Gheorghe, județul Tulcea",
    phone: "+40 723 264 913",
    phoneHref: "tel:+40723264913",
    website: "https://coastalresearch.ro/",
    lonLat: [29.5936, 44.8973],
    photo: STATION_PHOTOS["sfantu-gheorghe"],
    facts: [
      { label: "Înființare", value: "2002" },
      { label: "Submodule mobile", value: "9" },
      { label: "Precizia cartării", value: "milimetrică, pe apă și uscat" },
    ],
    sections: [
      {
        id: "istoric",
        title: "Istoric",
        lede: "Din 2002, stația este baza locală a Grupului de Cercetări Costiere al Facultății de Geografie. Oferă sprijin pentru cercetare și pentru educația în științele marine și costiere, direct în satul Sfântu Gheorghe.",
      },
      {
        id: "teme",
        title: "Teme de cercetare",
        items: [
          "Evoluția peisajului costier: lobi deltaici, săgeți litorale și insule barieră",
          "Geomorfologie costieră: dinamica plajelor, a dunelor și a barelor submerse",
          "Clima costieră: evoluția furtunilor și variabilitatea climatică",
          "Hidrodinamica zonei litorale și comportamentul gurilor de vărsare",
          "Efectul furtunilor, al viiturilor și al creșterii nivelului mării asupra ecosistemelor",
          "Dinamica apei și a sedimentelor în zonele umede și costiere",
          "Schimbări ale reliefului submers, ale utilizării terenului și ale vegetației",
          "Reconstituirea paleoclimatului",
          "Dinamica acviferelor, calitatea apei, eutrofizarea și sursele de poluare",
        ],
      },
      {
        id: "masuratori",
        title: "Ce se măsoară",
        items: [
          "Înălțimea și direcția valurilor, viteza și direcția curenților, nivelul apei, turbiditatea",
          "Fenologia vegetației, extinderea zonelor umede, umiditatea plajei",
          "Proprietățile fizice și chimice ale apei și ale sedimentelor",
          "Răspunsul spectral al apei, vegetației și nisipului, pentru calibrarea imaginilor satelitare",
          "Distribuția pe verticală a curenților fluviali și litorali",
        ],
      },
      {
        id: "module",
        title: "Module",
        modules: [
          {
            title: "Monitorizare mobilă a biodiversității și geodiversității",
            body: "Nouă submodule pentru cartare subacvatică, măsurarea debitelor, analiza fundului, profilarea 3D a curenților, dinamica valurilor și monitorizarea în larg a valurilor, curenților și condițiilor meteorologice.",
          },
          {
            title: "Analiza probelor",
            body: "Analizoare pentru proprietățile fizico-chimice și optice ale apei, echipamente de granulometrie și chimie a sedimentelor, imagistică și analiză structurală.",
          },
        ],
      },
      {
        id: "ecosisteme",
        title: "Ecosisteme studiate",
        items: ["Delta Dunării și brațele fluviului", "Lacuri și zone umede", "Plaje și zona costieră a Mării Negre"],
      },
    ],
    explorer: [
      { label: "Stația meteorologică Sfântu Gheorghe", path: "retele/meteo", query: { statie: "TL-Sfg" } },
      { label: "Teledetecție pe Delta Dunării", path: "teledetectie/administrativ", query: { unitate: "ltser", id: 1 } },
      { label: "Metadatele rețelelor", path: "retele/metadate" },
    ],
    platforms: ["delta-dunarii"],
  },
  {
    slug: "sinaia",
    short: "Sinaia",
    name: "Stațiunea de cercetare Sinaia",
    founded: 1922,
    county: "Prahova",
    setting: "Cumpătu, Munții Bucegi, circa 860 m",
    summary:
      "Stațiune de cercetare în Munții Bucegi, înființată în 1922. Găzduiește centrul de date al infrastructurii: calcul de înaltă performanță și laboratoare virtuale conectate la LifeWatch ERIC.",
    focus: ["Calcul de înaltă performanță", "Laboratoare virtuale", "Biodiversitate montană", "Formare"],
    operator: "Departamentul de Ecologie Sistemică, RCSES, Universitatea din București",
    address: "Str. Cumpătu nr. 5, 106100 Sinaia, județul Prahova",
    phone: "+40 745 865 151",
    phoneHref: "tel:+40745865151",
    lonLat: [25.552, 45.3415],
    photo: STATION_PHOTOS.sinaia,
    facts: [
      { label: "Înființare", value: "1922" },
      { label: "Altitudine", value: "circa 860 m" },
      { label: "Lucrări publicate", value: "130 până în 1951, 386 până în 1989" },
    ],
    sections: [
      {
        id: "istoric",
        title: "Istoric",
        lede: "Profesorul A. Popovici-Bâznoșeanu a înființat stațiunea în 1922, pentru lucrările de teren ale studenților la biologie. Până în 1951 a funcționat fără personal permanent și a produs circa 130 de lucrări științifice. Între 1951 și 1989, cu cercetători proprii, a publicat 386 de lucrări originale. După 1989, activitatea a fost integrată în Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate.",
      },
      {
        id: "infrastructura",
        title: "Infrastructură",
        items: [
          "Laboratoare pentru cercetări de taxonomie și ecologie pe termen lung",
          "Cazare pentru studenți în timpul cursurilor de teren",
          "Centru de conferințe cu săli și laboratoare pentru formare, ateliere și simpozioane",
          "Infrastructură de calcul de înaltă performanță, în model cloud",
          "Centrul de date Sinaia, cu laboratoare virtuale și linii de internet dedicate către patru platforme",
          "Laborator de prelevare, precondiționare și izolare a probelor pentru studiul biodiversității montane",
        ],
      },
      {
        id: "servicii",
        title: "Servicii de date",
        modules: [
          { title: "Vizualizare, analiză și modelare", body: "Instrumente pentru explorarea datelor și pentru rularea modelelor." },
          { title: "Stocare și procesare rapidă", body: "Capacitate pentru volume mari de date brute și derivate." },
          { title: "Analiză la scară mare", body: "Suport pentru infrastructura și aplicațiile de analiză a datelor masive." },
          { title: "Laboratoare virtuale", body: "Medii de lucru partajate, accesibile de la distanță." },
          { title: "Conectare europeană", body: "Schimb de date brute și rezultate ale modelării cu LifeWatch ERIC, ICOS, DANUBIUS și eLTER." },
        ],
      },
      {
        id: "retea",
        title: "Platforme deservite",
        lede: "Centrul de date leagă platforma integrată a universității de platformele LTSER Bucegi-Piatra Craiului, Neajlov și Insulele Brăilei. Partener de teren este Institutul de Cercetări și Amenajări Silvice.",
      },
    ],
    explorer: [
      { label: "Platforma de date brute", path: "platforma/statii" },
      { label: "Disponibilitatea datelor", path: "platforma/disponibilitate" },
      { label: "Teledetecție pe Bucegi-Piatra Craiului", path: "teledetectie/administrativ", query: { unitate: "ltser", id: 4 } },
    ],
    platforms: ["bucegi-piatra-craiului", "neajlov", "insulele-brailei"],
  },
  {
    slug: "orsova",
    short: "Orșova",
    name: "Stațiunea de cercetare Orșova",
    founded: 1964,
    county: "Mehedinți",
    setting: "Dealul Moșului, deasupra Golfului Cernei",
    summary:
      "Stațiune de cercetare a Facultății de Geografie pe Dunăre, înființată în 1964. Laboratorul de monitorizare a ecosistemelor fluviale folosește drone, batimetrie, senzori și scanare geochimică a sedimentelor.",
    focus: ["Eroziunea solului", "Dinamica albiilor", "Batimetrie", "Geochimie"],
    operator: "Facultatea de Geografie, Universitatea din București",
    address: "Str. Panfil Șeicaru nr. 2, Orșova, județul Mehedinți",
    phone: "0252 361 513",
    phoneHref: "tel:+40252361513",
    website: "https://orsova.geo.unibuc.ro/",
    lonLat: [22.396, 44.718],
    photo: STATION_PHOTOS.orsova,
    facts: [
      { label: "Înființare", value: "1964" },
      { label: "Capacitate", value: "peste 70 de locuri" },
      { label: "Teren propriu", value: "circa 1,5 ha" },
    ],
    sections: [
      {
        id: "istoric",
        title: "Amplasament și istoric",
        lede: "Stațiunea se află pe versantul Dealului Moșului (267 m), lângă vârful Cioaca Mică, în sudul orașului, cu vedere spre lacul de acumulare și Golful Cernei. Din 1964 sprijină cercetarea în geomorfologie, hidrologie, climatologie și biogeografie și găzduiește practica studenților geografi.",
      },
      {
        id: "dotari",
        title: "Dotări",
        items: [
          "Clădire principală de circa 200 m² pe două niveluri, cu peste 70 de locuri",
          "Laboratoare de geomorfologie și mediu, de meteorologie și hidrologie, de geografie umană și regională",
          "Sală de conferințe și bibliotecă de specialitate",
          "Stații meteorologice automate și clasice, platformă meteorologică",
          "Clădire secundară de circa 30 de locuri și laboratorul Gratca de pe malul Dunării, în prezent nefuncționale",
        ],
      },
      {
        id: "module",
        title: "Laboratorul de monitorizare a ecosistemelor fluviale",
        modules: [
          { code: "M1", title: "Eroziunea solului", body: "Monitorizarea și evaluarea proceselor de eroziune." },
          { code: "M2", title: "Teledetecția ecosistemelor fluviale", body: "Drone cu senzori RGB și multispectrali pentru indici de sol, vegetație, apă și relief." },
          { code: "M3", title: "Batimetrie", body: "Măsurători single-beam ale adâncimii și ale reliefului submers." },
          { code: "M4", title: "Scanare geochimică XRF", body: "Carote de sediment și sol, inclusiv susceptibilitatea magnetică." },
          { code: "M5", title: "Procesare și modelare", body: "Date de la senzori, sateliți și drone transformate în modele raster și vectoriale." },
        ],
      },
      {
        id: "teme",
        title: "Teme de cercetare",
        items: [
          "Informație geografică interdisciplinară, topografie digitală și GNSS",
          "Eroziunea solului, dinamica albiilor și planificarea urbană",
          "Schimbările ecosistemelor și impactul amenajărilor hidroenergetice",
          "Dezvoltarea urbană și rurală durabilă",
          "Rețea de senzori pentru aer, sol și mediul acvatic",
        ],
      },
    ],
    explorer: [
      { label: "Stația meteorologică Orșova", path: "retele/meteo", query: { statie: "MH-Ors" } },
      { label: "Metadatele rețelelor", path: "retele/metadate" },
    ],
    platforms: [],
  },
];

export const findStation = (slug: string) => STATIONS.find((s) => s.slug === slug) ?? null;
