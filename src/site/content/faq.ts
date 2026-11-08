// Questions and answers written for the new site from the facts on the other pages.
export interface Faq {
  id: string;
  q: string;
  a: string;
  link?: { label: string; to: string; explorer?: boolean };
}

export const FAQ: Faq[] = [
  {
    id: "ce-este",
    q: "Ce este LifeWatch România?",
    a: "Este infrastructura națională de cercetare e-Science pentru biodiversitate și ecosisteme, găzduită de Universitatea din București. Reunește patru stații de teren, platforme de monitorizare pe termen lung și centrul de date de la Sinaia și contribuie la LifeWatch ERIC, eLTER, ICOS și DANUBIUS-RI.",
    link: { label: "Despre infrastructură", to: "despre" },
  },
  {
    id: "lter-ltser",
    q: "Ce înseamnă LTER și LTSER?",
    a: "LTER desemnează cercetarea ecologică pe termen lung, în situri urmărite timp de decenii. LTSER adaugă dimensiunea socială: o platformă LTSER studiază un teritoriu împreună cu oamenii și activitățile care îl modelează. Conceptul a fost introdus de LTER-Europe în 2007.",
    link: { label: "Platformele LTSER", to: "platforme" },
  },
  {
    id: "acces-date",
    q: "Cum pot consulta datele?",
    a: "Exploratorul LTSER afișează în browser produsele de teledetecție, rețelele de stații, măsurătorile brute și indicatorii sociali. Hărțile, graficele și tabelele se pot descărca în CSV, XLSX, GeoTIFF, GeoJSON sau PNG, după tipul datelor.",
    link: { label: "Deschide exploratorul", to: "", explorer: true },
  },
  {
    id: "api",
    q: "Pot prelua datele automat, din scripturi?",
    a: "Da. Măsurătorile brute sunt disponibile prin API-ul LifeWatch, un serviciu HTTP care răspunde în JSON: lista stațiilor, variabilele fiecărei stații și seriile de timp pe intervalul cerut.",
    link: { label: "Documentația API", to: "date/api" },
  },
  {
    id: "sapte-zile",
    q: "De ce o interogare de date brute acoperă cel mult 7 zile?",
    a: "Senzorii eddy covariance înregistrează de mai multe ori pe secundă, deci câteva zile înseamnă deja sute de mii de rânduri. Serviciul întoarce cel mult 50.000 de rânduri pe cerere și, pentru eddy covariance, păstrează un rând din 50. Pentru perioade mai lungi, faceți mai multe cereri consecutive.",
    link: { label: "Limitele serviciului", to: "date/documentatie" },
  },
  {
    id: "fus-orar",
    q: "În ce fus orar sunt exprimate orele?",
    a: "Datele stațiilor meteorologice sunt în UTC. Datele eddy covariance sunt în ora României (EET). Exploratorul afișează fusul lângă fiecare grafic și în antetul tabelelor exportate.",
    link: { label: "Convenții de date", to: "date/documentatie" },
  },
  {
    id: "demo",
    q: "Ce înseamnă eticheta „Date demonstrative”?",
    a: "Când un serviciu de date nu răspunde, exploratorul rămâne utilizabil cu valori generate local, marcate vizibil drept demonstrative. Ele arată funcționarea interfeței și nu trebuie folosite în analize.",
  },
  {
    id: "deims",
    q: "Unde găsesc fișele siturilor în rețeaua europeană?",
    a: "Platformele românești sunt descrise în registrul DEIMS-SDR al eLTER, cu metadate despre amplasament, parametri urmăriți și seturi de date.",
    link: { label: "Rețea și comunitate", to: "retea" },
  },
  {
    id: "contact",
    q: "Cum iau legătura cu o stație de cercetare?",
    a: "Fiecare stație are adresa și telefonul pe pagina de contact. Pentru Sfântu Gheorghe și Orșova există și site-uri proprii ale echipelor.",
    link: { label: "Contact", to: "contact" },
  },
];
