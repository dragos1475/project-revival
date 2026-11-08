// The six LTSER platforms documented in the explorer. Facts from lifewatch.ro (Platforme LTER și
// LTSER, Rețea); the explorer id matches the natcode of public/data/ltser.topojson.
import { AREA_PHOTOS, type Photo } from "@/lib/photos";

export interface Platform {
  slug: string;
  explorerId: number;
  name: string;
  region: string;
  kind: string;
  summary: string;
  figures: { value: string; label: string }[];
  paragraphs: string[];
  highlights: string[];
  deims: { label: string; url: string }[];
  photo: Photo;
  stations: string[];
}

export const PLATFORMS: Platform[] = [
  {
    slug: "delta-dunarii",
    explorerId: 1,
    name: "Rezervația Biosferei Delta Dunării",
    region: "Delta Dunării, Tulcea",
    kind: "Deltă și zone umede",
    summary: "Zonă umedă cu canale, lacuri și țărm marin, formată din aluviunile Dunării.",
    figures: [
      { value: "≈580.000 ha", label: "suprafața rezervației" },
      { value: "3", label: "tipuri principale de sol" },
    ],
    paragraphs: [
      "Rețeaua de canale, lacuri și zone costiere a deltei s-a construit în mii de ani din sedimentele aduse de Dunăre. Solurile sunt dominate de depozite aluviale, soluri gleice și histosoluri formate în condiții de exces de apă.",
      "Stația Sfântu Gheorghe studiază zona de contact dintre deltă și mare, inclusiv efectul furtunilor, al viiturilor și al creșterii nivelului mării asupra țărmului.",
    ],
    highlights: ["Zone umede, canale și lacuri", "Țărmul Mării Negre", "Soluri aluviale, gleice și histosoluri"],
    deims: [],
    photo: AREA_PHOTOS[1],
    stations: ["sfantu-gheorghe"],
  },
  {
    slug: "insulele-brailei",
    explorerId: 2,
    name: "Insulele Brăilei",
    region: "Sud-estul României, Dunărea între Hârșova și Brăila",
    kind: "Luncă și agricultură",
    summary: "Sector de 78 km al Dunării cu insule naturale, lunci inundabile, zone umede și incinte agricole create după 1960.",
    figures: [
      { value: "> 2.600 km²", label: "suprafața platformei" },
      { value: "≈300.000", label: "locuitori" },
      { value: "78 km", label: "de fluviu" },
      { value: "> 79%", label: "din sector îndiguit sau regularizat" },
    ],
    paragraphs: [
      "Platforma urmărește un sistem socio-ecologic în care o mare parte a luncii a fost transformată în teren agricol, începând cu anii 1960. Îndiguirile și regularizările afectează peste 79% din sectorul de fluviu.",
      "În zonă trăiesc circa 300.000 de oameni, în patru județe. Teritoriul include situri Ramsar și Natura 2000, iar aici s-au derulat proiecte de capacitate și infrastructură pentru LTSER.",
    ],
    highlights: ["Insule naturale și lunci inundabile", "Incinte agricole îndiguite", "Situri Ramsar și Natura 2000"],
    deims: [
      { label: "Fișa DEIMS a platformei", url: "https://deims.org/d4854af8-9d9f-42a2-af96-f1ed9cb25712" },
      { label: "Fișă DEIMS asociată", url: "https://deims.org/4050c5c8-fccc-4a3c-af65-7507a064d5f5" },
    ],
    photo: AREA_PHOTOS[2],
    stations: ["braila", "sinaia"],
  },
  {
    slug: "neajlov",
    explorerId: 3,
    name: "Bazinul Neajlovului",
    region: "Sudul României, Câmpia Română",
    kind: "Câmpie și păduri de luncă",
    summary: "Bazin hidrografic de câmpie, cu lucrări hidrotehnice, terenuri agricole și lacurile de acumulare Grădinari și Făcău.",
    figures: [
      { value: "2", label: "lacuri de acumulare principale" },
      { value: "2", label: "tipuri dominante de sol" },
    ],
    paragraphs: [
      "Lucrările hidrotehnice din ultimele decenii au modificat regimul apei în bazin. Principalele lacuri de acumulare sunt Grădinari și Făcău.",
      "Solurile agricole sunt dominate de luvisoluri și cernoziomuri. Platforma a beneficiat, ca și Insulele Brăilei, de proiecte de capacitate și infrastructură pentru LTSER.",
    ],
    highlights: ["Bazin hidrografic de câmpie", "Lacurile Grădinari și Făcău", "Luvisoluri și cernoziomuri"],
    deims: [
      { label: "Fișa DEIMS a platformei", url: "https://deims.org/a6af4965-8352-461a-84b0-0cac30559ad7" },
      { label: "Fișă DEIMS asociată", url: "https://deims.org/41d84799-0ef0-48a0-ac20-ae192850c895" },
    ],
    photo: AREA_PHOTOS[3],
    stations: ["sinaia"],
  },
  {
    slug: "bucegi-piatra-craiului",
    explorerId: 4,
    name: "Bucegi-Piatra Craiului",
    region: "Carpații Meridionali, centrul țării",
    kind: "Munte și carst",
    summary: "Două arii protejate cu păduri montane, pajiști alpine și relief carstic, monitorizate ca sit ILTER din 2003.",
    figures: [
      { value: "32.500 ha", label: "Parcul Natural Bucegi" },
      { value: "13.800 ha", label: "Parcul Național Piatra Craiului" },
      { value: "2003", label: "sit ILTER" },
      { value: "2008", label: "în LTER-Europe" },
    ],
    paragraphs: [
      "Platforma reunește pădurile montane, pajiștile alpine și relieful carstic din Bucegi și Piatra Craiului. A devenit sit ILTER în 2003 și face parte din LTER-Europe din 2008.",
      "Fauna include specii protejate precum capra neagră, ursul, râsul și lupul. Stațiunea Sinaia, aflată la poalele Bucegilor, deservește platforma prin centrul său de date.",
    ],
    highlights: ["Păduri montane și pajiști alpine", "Relief carstic", "Capră neagră, urs, râs, lup"],
    deims: [],
    photo: AREA_PHOTOS[4],
    stations: ["sinaia"],
  },
  {
    slug: "rodna-calimani",
    explorerId: 5,
    name: "Rodna-Călimani",
    region: "Nordul Carpaților Orientali",
    kind: "Munte vulcanic și alpin",
    summary: "Masive montane cu peste 50% pădure, lacuri glaciare și carst, cu suprafețe permanente de cercetare din 1976.",
    figures: [
      { value: "> 50%", label: "acoperit de pădure" },
      { value: "> 1.100", label: "specii de plante cu flori" },
      { value: "1976", label: "primele suprafețe permanente" },
      { value: "2007", label: "cercetare pe termen lung" },
    ],
    paragraphs: [
      "Platforma include două parcuri naționale și rezervația biosferei Pietrosul Rodnei. Pădurile acoperă peste jumătate din teritoriu, iar la altitudine apar lacuri glaciare și forme carstice.",
      "Suprafețele permanente de cercetare funcționează din 1976, iar programul de cercetare pe termen lung a pornit în 2007. Flora numără peste 1.100 de specii de plante cu flori.",
    ],
    highlights: ["Două parcuri naționale", "Rezervația biosferei Pietrosul Rodnei", "Lacuri glaciare și carst"],
    deims: [{ label: "Fișa DEIMS a platformei", url: "https://deims.org/9350a1d0-a835-408f-a96c-7454e24368f5" }],
    photo: AREA_PHOTOS[5],
    stations: [],
  },
  {
    slug: "retezat",
    explorerId: 6,
    name: "Rezervația Biosferei Retezat",
    region: "Vestul Carpaților Meridionali",
    kind: "Munte alpin și glaciar",
    summary: "Rezervație a biosferei din 1979, cu păduri, pajiști alpine, lacuri glaciare și peste 1.190 de specii de plante.",
    figures: [
      { value: "> 1.190", label: "specii de plante" },
      { value: "> 90", label: "specii endemice" },
      { value: "11", label: "suprafețe de cercetare" },
      { value: "1979", label: "rezervație a biosferei" },
    ],
    paragraphs: [
      "Retezatul a devenit rezervație a biosferei în 1979, iar rețeaua de cercetare pe termen lung funcționează din 2000, cu 11 suprafețe de studiu.",
      "Ecosistemele forestiere și alpine, cu numeroase lacuri glaciare, includ peste 1.190 de specii de plante, dintre care peste 90 sunt endemice.",
    ],
    highlights: ["Păduri și pajiști alpine", "Lacuri glaciare", "Peste 90 de specii endemice"],
    deims: [],
    photo: AREA_PHOTOS[6],
    stations: [],
  },
];

export const findPlatform = (slug: string) => PLATFORMS.find((p) => p.slug === slug) ?? null;

export const LTSER_FACTS = [
  { value: "11", label: "platforme LTSER în România" },
  { value: "52", label: "platforme LTSER în Europa, în mai 2021" },
  { value: "2007", label: "anul conceptului LTSER" },
  { value: "2001", label: "România în ILTER" },
];
