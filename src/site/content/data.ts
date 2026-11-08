// Data catalogue and API reference. Datasets mirror what the explorer serves (src/lib/catalog.ts,
// public/data/networks.json); endpoints mirror the LifeWatch FastAPI service used by src/api/lifewatch.ts.
import { EC_PARAMS, METEO_PARAMS, RS_INDICATORS, SOCIAL_INDICATORS } from "@/lib/catalog";

export type DatasetTheme = "teledetectie" | "retele" | "platforma" | "social" | "geo";

export interface Dataset {
  id: string;
  theme: DatasetTheme;
  title: string;
  summary: string;
  variables: string[];
  resolution: string;
  coverage: string;
  formats: string[];
  service: "API LTSER" | "API LifeWatch" | "Fișier static";
  explorer: { path: string; query?: Record<string, string | number> };
}

export const THEMES: Record<DatasetTheme, string> = {
  teledetectie: "Teledetecție",
  retele: "Rețele de stații",
  platforma: "Date brute",
  social: "Indicatori sociali",
  geo: "Limite și amplasamente",
};

const socialYears = (id: string) => {
  const years = SOCIAL_INDICATORS.find((s) => s.id === id)?.years ?? [];
  return years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "";
};

export const DATASETS: Dataset[] = [
  {
    id: "rs-grid",
    theme: "teledetectie",
    title: "Produse satelitare lunare",
    summary: "Hărți lunare de umiditate a solului, indice de vegetație și radiație absorbită, pe grila națională, cu serii de timp pe punct.",
    variables: RS_INDICATORS.map((r) => r.short),
    resolution: "lunar",
    coverage: "România",
    formats: ["GeoTIFF", "CSV", "XLSX"],
    service: "API LTSER",
    explorer: { path: "teledetectie/national" },
  },
  {
    id: "rs-admin",
    theme: "teledetectie",
    title: "Indicatori satelitari pe unități administrative",
    summary: "Valorile SSM, NDVI și FAPAR agregate pe zonele LTSER și pe unitățile administrativ-teritoriale din interiorul lor.",
    variables: RS_INDICATORS.map((r) => r.short),
    resolution: "lunar",
    coverage: "6 zone LTSER, 208 UAT",
    formats: ["GeoJSON", "PNG"],
    service: "API LTSER",
    explorer: { path: "teledetectie/administrativ" },
  },
  {
    id: "meteo",
    theme: "retele",
    title: "Rețeaua de stații meteorologice",
    summary: "Valori orare și zilnice de la 20 de stații automate din zonele LTSER, cu hărți pentru un moment ales și grafice pe 7 sau 31 de zile.",
    variables: [...new Set(METEO_PARAMS.map((p) => p.shortRo))],
    resolution: "orar, zilnic",
    coverage: "20 de stații",
    formats: ["CSV", "XLSX", "PNG"],
    service: "API LTSER",
    explorer: { path: "retele/meteo" },
  },
  {
    id: "eddy",
    theme: "retele",
    title: "Fluxuri eddy covariance",
    summary: "Fluxuri de CO₂, căldură latentă și sensibilă și variabile asociate, de la cinci turnuri eddy covariance.",
    variables: EC_PARAMS.map((p) => p.ro),
    resolution: "semi-orar",
    coverage: "5 turnuri",
    formats: ["CSV", "XLSX", "PNG"],
    service: "API LTSER",
    explorer: { path: "retele/eddy" },
  },
  {
    id: "raw",
    theme: "platforma",
    title: "Măsurători brute ale stațiilor",
    summary: "Înregistrările originale ale stațiilor meteorologice și eddy covariance, din baza TimescaleDB, pe ferestre de cel mult 7 zile.",
    variables: ["temperatura aerului", "umiditate", "presiune", "vânt", "radiație", "sol", "CO₂", "H₂O", "CH₄"],
    resolution: "20 s până la 60 s, eddy covariance la 2,5 s",
    coverage: "25 de stații",
    formats: ["JSON", "CSV", "XLSX"],
    service: "API LifeWatch",
    explorer: { path: "platforma/statii" },
  },
  {
    id: "availability",
    theme: "platforma",
    title: "Disponibilitatea datelor",
    summary: "Numărul de înregistrări pe stație pentru o variabilă și un interval, afișat pe hartă.",
    variables: ["număr de înregistrări"],
    resolution: "interval ales",
    coverage: "25 de stații",
    formats: ["JSON"],
    service: "API LifeWatch",
    explorer: { path: "platforma/disponibilitate" },
  },
  {
    id: "pop108d",
    theme: "social",
    title: "Populația după domiciliu",
    summary: "Populația unităților administrative din zonele LTSER, pe sex și grupe de vârstă.",
    variables: ["sex", "grupe de vârstă"],
    resolution: `anual, ${socialYears("pop108d")}`,
    coverage: "208 UAT",
    formats: ["GeoJSON", "PNG"],
    service: "API LTSER",
    explorer: { path: "social" },
  },
  {
    id: "pop309e",
    theme: "social",
    title: "Emigranți definitivi",
    summary: "Numărul anual de emigranți definitivi pentru unitățile administrative din zonele LTSER.",
    variables: ["emigranți"],
    resolution: `anual, ${socialYears("pop309e")}`,
    coverage: "208 UAT",
    formats: ["GeoJSON", "PNG"],
    service: "API LTSER",
    explorer: { path: "social" },
  },
  {
    id: "networks",
    theme: "geo",
    title: "Amplasamentele rețelelor",
    summary: "Coordonatele, parametrii și data punerii în funcțiune pentru stațiile meteo, eddy covariance, radiometre UV, RaZON+, senzorii de neutroni cosmici și geamandură.",
    variables: ["coordonate", "parametri", "punere în funcțiune"],
    resolution: "static",
    coverage: "46 de amplasamente",
    formats: ["GeoJSON", "CSV", "XLSX"],
    service: "Fișier static",
    explorer: { path: "retele/metadate" },
  },
  {
    id: "limits",
    theme: "geo",
    title: "Limitele zonelor LTSER și ale UAT",
    summary: "Poligoanele celor șase zone LTSER și ale unităților administrativ-teritoriale din interiorul lor.",
    variables: ["poligoane", "denumiri", "județe"],
    resolution: "static",
    coverage: "6 zone, 208 UAT",
    formats: ["TopoJSON"],
    service: "Fișier static",
    explorer: { path: "teledetectie/administrativ" },
  },
];

export interface Endpoint {
  method: "GET";
  path: string;
  title: string;
  body: string;
  params?: { name: string; type: string; body: string }[];
  example: string;
  response: string;
}

export const LIFEWATCH_API_BASE = "/lifewatch-api";

export const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/health",
    title: "Starea serviciului",
    body: "Răspunde cu starea serviciului. Exploratorul o verifică la pornire pentru a decide între date reale și date demonstrative.",
    example: "/health",
    response: `{ "status": "healthy" }`,
  },
  {
    method: "GET",
    path: "/stations",
    title: "Lista stațiilor",
    body: "Toate stațiile, cu tipul lor (meteorologică sau eddy covariance) și indicatorul pentru senzorul de metan.",
    example: "/stations",
    response: `[
  { "id": 1, "name": "Stația 1 - Ilfov, Cornetu", "kind": "meteorological", "has_ch4": null }
]`,
  },
  {
    method: "GET",
    path: "/stations/{id}",
    title: "Fișa unei stații",
    body: "Coordonatele stației și variabilele pe care le măsoară, cu unități și descrieri.",
    params: [{ name: "id", type: "întreg", body: "Identificatorul stației din lista de mai sus." }],
    example: "/stations/1",
    response: `{
  "id": 1, "name": "Stația 1 - Ilfov, Cornetu", "kind": "meteorological",
  "location": { "latitude": 44.334, "longitude": 25.966 },
  "variables": [{ "name": "air_temperature", "label": "Air temperature", "units": "°C", "description": "" }]
}`,
  },
  {
    method: "GET",
    path: "/stations/{id}/measurements",
    title: "Serii de timp",
    body: "Valorile variabilelor cerute, pe intervalul ales. Intervalul trebuie să fie mai scurt de 7 zile, iar răspunsul are cel mult 50.000 de rânduri.",
    params: [
      { name: "variables", type: "text, repetabil", body: "Una sau mai multe variabile: variables=air_temperature&variables=air_humidity." },
      { name: "since", type: "ISO 8601", body: "Începutul intervalului, de exemplu 2026-10-01T00:00:00Z." },
      { name: "until", type: "ISO 8601", body: "Sfârșitul intervalului." },
    ],
    example: "/stations/1/measurements?variables=air_temperature&since=2026-10-01T00:00:00Z&until=2026-10-02T00:00:00Z",
    response: `{
  "variables": ["air_temperature"],
  "timestamps": { "air_temperature": ["2026-10-01T00:00:20Z", "..."] },
  "measurements": { "air_temperature": [11.4, "..."] }
}`,
  },
  {
    method: "GET",
    path: "/variables",
    title: "Catalogul variabilelor",
    body: "Toate variabilele cunoscute de serviciu, cu tipul stației, unitatea de măsură și descrierea.",
    example: "/variables",
    response: `[
  { "id": "air_temperature", "name": "Air temperature", "kind": "meteorological", "units": "°C", "description": "" }
]`,
  },
  {
    method: "GET",
    path: "/stations/snapshot",
    title: "Disponibilitate pe stații",
    body: "Pentru o variabilă și un interval, numărul de înregistrări al fiecărei stații, cu coordonatele ei.",
    params: [
      { name: "variable", type: "text", body: "Variabila numărată." },
      { name: "since, until", type: "ISO 8601", body: "Intervalul, opțional." },
    ],
    example: "/stations/snapshot?variable=air_temperature",
    response: `{
  "stations": [{ "id": 1, "name": "Stația 1 - Ilfov, Cornetu", "location": { "latitude": 44.334, "longitude": 25.966 }, "count": 4320 }]
}`,
  },
];

export const CONVENTIONS = [
  { term: "Fus orar", body: "Stațiile meteorologice raportează în UTC. Datele eddy covariance sunt în ora României (EET). Tabelele exportate indică fusul în antetul coloanei de timp." },
  { term: "Pas de timp", body: "Măsurătorile brute meteorologice au pas de 20, 30 sau 60 de secunde, în funcție de senzor. Pentru eddy covariance, serviciul păstrează un rând din 50, adică un pas de 2,5 secunde." },
  { term: "Limite", body: "O cerere de măsurători acoperă mai puțin de 7 zile și întoarce cel mult 50.000 de rânduri. Exploratorul aplică aceleași limite în formular." },
  { term: "Valori lipsă", body: "O valoare lipsă apare ca null în răspunsul JSON, la aceeași poziție cu marca de timp corespunzătoare." },
  { term: "Proiecție", body: "Fișierele GeoTIFF folosesc EPSG:4326, cu NaN ca valoare nodata. Hărțile din explorator sunt afișate în Web Mercator." },
  { term: "Date demonstrative", body: "Când un serviciu nu răspunde, exploratorul generează valori locale, deterministe, marcate vizibil. Ele nu reprezintă măsurători." },
];
