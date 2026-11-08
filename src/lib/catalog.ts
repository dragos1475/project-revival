// Static catalogs ported from ltser/www/data/tabs/*.csv and socio_years.rds.

export interface Labelled {
  ro: string;
  en: string;
}
export interface RsIndicator extends Labelled {
  id: "ssm" | "ndvi" | "fapar";
  short: string;
  unit: string;
}
export type MeteoGroup = "tm" | "ws" | "ps" | "hu" | "ts" | "ir" | "tr" | "sh";
export interface MeteoParam extends Labelled {
  base: string;
  group: MeteoGroup;
  shortRo: string;
  shortEn: string;
}
export interface EcParam extends Labelled {
  id: string;
  unit: string;
  unitEn?: string;
  defRo: string;
  defEn: string;
}
export interface Network extends Labelled {
  id: "ws" | "ec" | "cu" | "ra" | "co" | "bu";
  color: string;
  shape: "circle" | "diamond" | "triangle" | "square" | "hexagon" | "ring";
}
export interface SocialIndicator extends Labelled {
  id: "pop108d" | "pop309e";
  hasSexAge: boolean;
  years: number[];
}
export type Resolution = "hourly" | "daily";

export const RS_INDICATORS: RsIndicator[] = [
  { id: "ssm", short: "SSM", unit: "%", ro: "Umiditatea solului la suprafață", en: "Surface soil moisture" },
  { id: "ndvi", short: "NDVI", unit: "", ro: "Indicele de vegetație NDVI", en: "Vegetation index NDVI" },
  { id: "fapar", short: "FAPAR", unit: "", ro: "Fracția de radiație absorbită FAPAR", en: "Absorbed radiation fraction FAPAR" },
];

export const LTSER_AREAS: Record<number, Labelled> = {
  1: { ro: "Rezervația Biosferei Delta Dunării", en: "Danube Delta Biosphere Reserve" },
  2: { ro: "Insulele Brăilei", en: "Braila Islands" },
  3: { ro: "Bazinul Neajlovului", en: "Neajlov catchment" },
  4: { ro: "Bucegi-Piatra Craiului", en: "Bucegi-Piatra Craiului National Park" },
  5: { ro: "Rodnei-Călimani", en: "Rodnei-Calimani" },
  6: { ro: "Rezervația Biosferei Retezat", en: "Retezat Biosphere Reserve" },
};
export const LTSER_BY_NAME: Record<string, number> = {
  "Danube Delta Biosphere Reserve": 1,
  "Braila Islands": 2,
  "LTSER Neajlov catchment": 3,
  "Bucegi-Piatra Craiului National Park": 4,
  "Rodnei Calimani": 5,
  "Retezat Biosphere Reserve": 6,
};

// Weather station parameters. The id is built as `${base}_01h` (hourly) or `${base}_24h` (daily).
export const METEO_PARAMS: MeteoParam[] = [
  { base: "tmin", group: "tm", ro: "Temperatura minimă a aerului", en: "Minimum air temperature", shortRo: "T min", shortEn: "T min" },
  { base: "tmean", group: "tm", ro: "Temperatura medie a aerului", en: "Mean air temperature", shortRo: "T medie", shortEn: "T mean" },
  { base: "tmax", group: "tm", ro: "Temperatura maximă a aerului", en: "Maximum air temperature", shortRo: "T max", shortEn: "T max" },
  { base: "psmin", group: "ps", ro: "Presiunea minimă a aerului", en: "Minimum air pressure", shortRo: "P min", shortEn: "P min" },
  { base: "psmean", group: "ps", ro: "Presiunea medie a aerului", en: "Mean air pressure", shortRo: "P medie", shortEn: "P mean" },
  { base: "psmax", group: "ps", ro: "Presiunea maximă a aerului", en: "Maximum air pressure", shortRo: "P max", shortEn: "P max" },
  { base: "hurmin", group: "hu", ro: "Umiditatea relativă minimă", en: "Minimum relative humidity", shortRo: "UR min", shortEn: "RH min" },
  { base: "hurmean", group: "hu", ro: "Umiditatea relativă", en: "Relative humidity", shortRo: "UR medie", shortEn: "RH mean" },
  { base: "hurmax", group: "hu", ro: "Umiditatea relativă maximă", en: "Maximum relative humidity", shortRo: "UR max", shortEn: "RH max" },
  { base: "wsmax", group: "ws", ro: "Viteza maximă a vântului", en: "Maximum wind speed", shortRo: "Vânt max", shortEn: "Wind max" },
  { base: "wsavg", group: "ws", ro: "Viteza medie a vântului", en: "Mean wind speed", shortRo: "Vânt mediu", shortEn: "Wind mean" },
  { base: "irrmean", group: "ir", ro: "Radiația globală", en: "Global irradiance", shortRo: "Radiație", shortEn: "Irradiance" },
  { base: "tsmean", group: "ts", ro: "Temperatura medie a solului", en: "Mean soil temperature", shortRo: "T sol", shortEn: "Soil T" },
  { base: "shmean", group: "sh", ro: "Umiditatea medie a solului", en: "Mean soil humidity", shortRo: "Umid. sol", shortEn: "Soil hum." },
  { base: "trsum", group: "tr", ro: "Precipitații totale", en: "Total precipitation", shortRo: "Precipitații", shortEn: "Precipitation" },
];

export const METEO_GROUPS: Record<MeteoGroup, Labelled & { unit: string }> = {
  tm: { ro: "Temperatura aerului", en: "Air temperature", unit: "°C" },
  ws: { ro: "Viteza vântului", en: "Wind speed", unit: "m/s" },
  ps: { ro: "Presiunea aerului", en: "Air pressure", unit: "hPa" },
  hu: { ro: "Umiditatea aerului", en: "Air humidity", unit: "%" },
  ts: { ro: "Temperatura solului", en: "Soil temperature", unit: "°C" },
  ir: { ro: "Radiația globală", en: "Global irradiance", unit: "W/m²" },
  tr: { ro: "Precipitații totale", en: "Total precipitation", unit: "l/m²" },
  sh: { ro: "Umiditatea solului", en: "Soil humidity", unit: "m³/m³" },
};

// Pairs shown together on the dual axis chart (ltser/utils/subset_param.R).
export const METEO_PAIRS: Record<MeteoGroup, [MeteoGroup, MeteoGroup]> = { tm: ["tm", "ws"], ws: ["tm", "ws"], ps: ["ps", "hu"], hu: ["ps", "hu"], ts: ["ts", "ir"], ir: ["ts", "ir"], tr: ["tr", "sh"], sh: ["tr", "sh"] };

export function meteoId(base: string, resolution: Resolution) {
  return `${base}_${resolution === "daily" ? "24h" : "01h"}`;
}

export function meteoParam(id: string): MeteoParam | null {
  const base = id.replace(/_(01|24)h$/, "");
  return METEO_PARAMS.find((p) => p.base === base) || null;
}

export function meteoGroupOf(id: string) {
  return id.slice(0, 2) as MeteoGroup;
}

export const EC_PARAMS: EcParam[] = [
  { id: "co2_flux", unit: "µmol/m²s", ro: "Flux de CO₂", en: "CO₂ flux", defRo: "Fluxul net de CO₂ dintre ecosistem și atmosferă", defEn: "CO₂ flux" },
  { id: "LE", unit: "W/m²", ro: "Flux de căldură latentă", en: "Latent heat flux", defRo: "Flux de căldură latentă corectat", defEn: "Corrected latent heat flux" },
  { id: "H", unit: "W/m²", ro: "Flux de căldură sensibilă", en: "Sensible heat flux", defRo: "Flux de căldură sensibilă corectat", defEn: "Corrected sensible heat flux" },
  { id: "ET", unit: "mm/oră", unitEn: "mm/hour", ro: "Evapotranspirație", en: "Evapotranspiration", defRo: "Fluxul de evapotranspirație", defEn: "Evapotranspiration flux" },
  { id: "RN_1_1_1", unit: "W/m²", ro: "Radiație netă", en: "Net radiation", defRo: "Radiația netă", defEn: "Net radiation" },
  { id: "RH_1_1_1", unit: "%", ro: "Umiditate relativă", en: "Relative humidity", defRo: "Umiditatea relativă a aerului ambiant", defEn: "Ambient relative humidity" },
  { id: "PPFD_1_1_1", unit: "µmol/m²s", ro: "Densitatea fluxului fotonic fotosintetic", en: "Photosynthetic photon flux density", defRo: "Densitatea fluxului de fotoni activi fotosintetic", defEn: "Photosynthetic photon flux density" },
];

export const NETWORKS: Network[] = [
  // Network colours follow the LifeWatch logo palette (navy lifted to a mid blue for map contrast).
  { id: "ws", color: "#4f79c4", shape: "circle", ro: "Stații meteorologice", en: "Weather stations" },
  { id: "ec", color: "#398346", shape: "diamond", ro: "Eddy covariance", en: "Eddy covariance" },
  { id: "cu", color: "#d55a2b", shape: "triangle", ro: "Radiometru UV total CUV5", en: "CUV5 total UV radiometer" },
  { id: "ra", color: "#e49950", shape: "square", ro: "RaZON+", en: "RaZON+" },
  { id: "co", color: "#4aa4a6", shape: "hexagon", ro: "Neutroni din radiația cosmică", en: "Cosmic ray neutron" },
  { id: "bu", color: "#334155", shape: "ring", ro: "Geamandură", en: "Buoy" },
];

export const NETWORK_DESCRIPTIONS: Record<Network["id"], Labelled> = {
  ws: {
    en: "Measuring weather parameters in a Long-Term Socio-Ecological Research (LTSER) area is crucial for understanding the complex interactions between the environment and human systems over extended periods.<br>These measurements will provide invaluable data for assessing climate change impacts, ecosystem dynamics, and informing sustainable land management strategies, aiding in the development of evidence-based policies and practices.<br>The deployment of 20 weather stations in the LTSER area will greatly enhance the accuracy and spatial resolution of weather data collection.<br>This comprehensive network of stations will enable researchers to capture localized weather patterns, identify microclimatic variations, and assess the influence of topography on weather conditions, leading to a more holistic understanding of the area's ecological processes and facilitating targeted conservation and management efforts.",
    ro: "Măsurarea parametrilor meteorologici într-o zonă de cercetare socio-ecologică pe termen lung (LTSER) este esențială pentru înțelegerea interacțiunilor complexe dintre mediu și sistemele umane pe perioade îndelungate.<br>Aceste măsurători oferă date valoroase pentru evaluarea impactului schimbărilor climatice și a dinamicii ecosistemelor și pentru fundamentarea strategiilor de gestionare durabilă a terenurilor, sprijinind politici și practici bazate pe dovezi.<br>Instalarea a 20 de stații meteorologice în zonele LTSER crește considerabil acuratețea și rezoluția spațială a datelor colectate.<br>Rețeaua permite cercetătorilor să surprindă tiparele meteorologice locale, să identifice variațiile microclimatice și să evalueze influența reliefului asupra condițiilor meteorologice, pentru o înțelegere mai completă a proceselor ecologice și pentru intervenții țintite de conservare și management.",
  },
  ec: {
    en: "Installing five eddy covariance stations in the LTSER areas is of utmost importance as it enables direct measurements of ecosystem-scale fluxes of carbon dioxide, water vapor, and other greenhouse gases.<br>These stations provide critical insights into the net exchange of gases between the terrestrial ecosystem and the atmosphere, allowing scientists to quantify carbon sequestration rates, assess ecosystem productivity, and understand the impacts of climate change on ecosystem functioning.<br>The data obtained from these stations greatly enhance our understanding of the carbon cycle and contribute to informed decision-making for effective climate change mitigation and adaptation strategies in the LTSER areas.",
    ro: "Cele cinci stații eddy covariance din zonele LTSER permit măsurarea directă, la scara ecosistemului, a fluxurilor de dioxid de carbon, vapori de apă și alte gaze cu efect de seră.<br>Stațiile arată schimbul net de gaze dintre ecosistemul terestru și atmosferă, permițând cuantificarea ratelor de sechestrare a carbonului, evaluarea productivității ecosistemelor și înțelegerea efectelor schimbărilor climatice asupra funcționării acestora.<br>Datele obținute aprofundează înțelegerea ciclului carbonului și sprijină decizii informate pentru atenuarea schimbărilor climatice și adaptarea la acestea în zonele LTSER.",
  },
  cu: {
    en: "CUV5 is a general-purpose instrument measuring the total UV radiation from natural sunlight for applications in meteorology and outdoor material testing.<br>The high quality dome and diffuser provide optimized directional response. A specially designed optical filter provides sensitivity to combined UVA and UVB irradiance. The photodiode generates a voltage output linearly proportional to the UV intensity.<br>Specific parts of the UV spectrum such as UVA, UVB or UVE / UV Index cannot be derived from the CUV5 measurements. For measurement of these individual parameters our specific SUV models are required.",
    ro: "CUV5 este un instrument de uz general care măsoară radiația ultravioletă totală a luminii solare naturale, pentru aplicații în meteorologie și testarea materialelor în exterior.<br>Domul și difuzorul de înaltă calitate asigură un răspuns direcțional optimizat. Un filtru optic dedicat oferă sensibilitate la iradianța combinată UVA și UVB, iar fotodioda generează o tensiune proporțională liniar cu intensitatea UV.<br>Componentele specifice ale spectrului UV, precum UVA, UVB sau indicele UV, nu pot fi derivate din măsurătorile CUV5. Pentru acești parametri sunt necesare modelele dedicate SUV.",
  },
  co: {
    en: "Large scale soil and surface biomass moisture measurement is possible using Cosmic Ray Neutron Sensing (CRNS). Counting the backscattered neutrons generated by the interaction between cosmic ray (fast neutrons) from the sky and water present in the soil and surface biomass (leaf litter and grass).<br>As a noninvasive automatic method for estimating soil moisture at intermediate scale, the cosmic-ray neutron probe (CRNP) is able to bridge the scale gap between the point scale and the large scale (Baroni et al., 2018; Franz et al., 2015; Jeong et al., 2021; Kim et al., 2018; Vather et al., 2019). CRNP takes advantage of the negative correlation between fast neutrons and the hydrogen pool around CRNP (Franz et al., 2016; Jakobi et al., 2022; Zreda et al., 2008). Hydrogen atoms are commonly present in the soil as soil moisture, so soil moisture can be inferred using fast neutron intensity.<br>The CRNP horizontal measurement footprint is a circular area with a radius of 130 to 240 m, depending on air humidity, soil moisture, and vegetation (Desilets et al., 2010). The measurement depth ranges from 15 to 83 cm, depending mainly on the soil moisture and distance from the sensor (Jakobi et al., 2021; Kohli et al., 2015; Nguyen et al., 2019).",
    ro: "Măsurarea la scară largă a umidității solului și a biomasei de suprafață este posibilă prin detecția neutronilor din radiația cosmică (CRNS), care numără neutronii retroîmprăștiați generați de interacțiunea dintre radiația cosmică (neutroni rapizi) și apa din sol și din biomasa de suprafață (litieră și iarbă).<br>Fiind o metodă automată și neinvazivă de estimare a umidității solului la scară intermediară, sonda de neutroni cosmici (CRNP) face legătura dintre scara punctuală și scara largă (Baroni et al., 2018; Franz et al., 2015; Jeong et al., 2021; Kim et al., 2018; Vather et al., 2019). CRNP se bazează pe corelația negativă dintre neutronii rapizi și rezerva de hidrogen din jurul senzorului (Franz et al., 2016; Jakobi et al., 2022; Zreda et al., 2008). Atomii de hidrogen se găsesc în sol mai ales sub formă de apă, astfel încât umiditatea solului poate fi dedusă din intensitatea neutronilor rapizi.<br>Amprenta orizontală a măsurătorii este un cerc cu raza de 130 până la 240 m, în funcție de umiditatea aerului, umiditatea solului și vegetație (Desilets et al., 2010). Adâncimea de măsurare variază între 15 și 83 cm, în principal în funcție de umiditatea solului și de distanța față de senzor (Jakobi et al., 2021; Kohli et al., 2015; Nguyen et al., 2019).",
  },
  ra: {
    en: "RaZON+ is an all-in-one system that accurately measures both direct normal irradiance (DNI) and diffuse horizontal irradiance (DHI) from the sun and sky, enabling it to provide very reliable values of global horizontal solar irradiance (GHI) and sunshine duration.<br>The integrated data logger presents the irradiance measurements in W/m², sunshine duration in hours and energy in kWh/m² (kilowatt-hours per square meter).",
    ro: "RaZON+ este un sistem integrat care măsoară cu precizie iradianța normală directă (DNI) și iradianța orizontală difuză (DHI) a soarelui și a cerului, oferind valori foarte fiabile ale iradianței solare orizontale globale (GHI) și ale duratei de strălucire a soarelui.<br>Înregistratorul de date integrat exprimă iradianța în W/m², durata de strălucire în ore și energia în kWh/m² (kilowați-oră pe metru pătrat).",
  },
  bu: {
    en: "The instruments used to obtain the data are:<ul><li>Wave height, period, and direction sensor: NAVTRON NavMon11</li><li>Vertical current profile sensor: NORTEK AquaDopp Profiler 1MHz</li><li>Turbidity sensor: VALEPORT Hyperion Turbidity (with Zebra-Tech wiper)</li><li>Water temperature sensor: NAVTRON NavMon11</li><li>Wind speed and direction sensor: GILL INSTRUMENTS WindSonic M</li></ul>The buoy also includes auxiliary equipment such as batteries, solar panels, navigation signal lamp, RADAR reflector, AToN AIS, and antennas.",
    ro: "Instrumentele folosite pentru obținerea datelor sunt:<ul><li>Senzor pentru înălțimea, perioada și direcția valurilor: NAVTRON NavMon11</li><li>Senzor pentru profilul vertical al curenților: NORTEK AquaDopp Profiler 1MHz</li><li>Senzor de turbiditate: VALEPORT Hyperion Turbidity (cu ștergător Zebra-Tech)</li><li>Senzor pentru temperatura apei: NAVTRON NavMon11</li><li>Senzor pentru viteza și direcția vântului: GILL INSTRUMENTS WindSonic M</li></ul>Geamandura include și echipamente auxiliare: baterii, panouri solare, lampă de semnalizare pentru navigație, reflector RADAR, AToN AIS și antene.",
  },
};

export const SOCIAL_INDICATORS: SocialIndicator[] = [
  { id: "pop108d", ro: "Populația după domiciliu", en: "Population by residence", hasSexAge: true, years: range(2022, 1992) },
  { id: "pop309e", ro: "Emigranți definitivi", en: "Definitive emigrants", hasSexAge: false, years: range(2021, 1994) },
];

export const GENDERS: (Labelled & { id: number })[] = [
  { id: 3, ro: "Toți", en: "All" },
  { id: 1, ro: "Femei", en: "Females" },
  { id: 2, ro: "Bărbați", en: "Males" },
];

export const AGES: (Labelled & { id: number })[] = [
  { id: -1, ro: "Toate vârstele", en: "All ages" },
  { id: 0, ro: "Nou-născuți", en: "Newborns" },
  ...Array.from({ length: 85 }, (_, i) => ({ id: i + 1, ro: i === 0 ? "1 an" : `${i + 1} ani`, en: i === 0 ? "1 year" : `${i + 1} years` })),
  { id: 86, ro: "Peste 85 de ani", en: "Over 85 years" },
];

function range(from: number, to: number) {
  const out: number[] = [];
  for (let y = from; y >= to; y--) out.push(y);
  return out;
}

/** Short descriptors for each LTSER area, shown on the overview. */
export const LTSER_AREA_META: Record<number, { uats: number; kind: Labelled }> = {
  1: { uats: 30, kind: { ro: "Deltă și zone umede", en: "Delta and wetlands" } },
  2: { uats: 23, kind: { ro: "Luncă și agricultură", en: "Floodplain and farmland" } },
  3: { uats: 84, kind: { ro: "Câmpie și păduri de luncă", en: "Lowland and riparian forest" } },
  4: { uats: 11, kind: { ro: "Munte și carst", en: "Mountain and karst" } },
  5: { uats: 36, kind: { ro: "Munte vulcanic și alpin", en: "Volcanic and alpine mountains" } },
  6: { uats: 24, kind: { ro: "Munte alpin și glaciar", en: "Alpine and glacial mountains" } },
};
