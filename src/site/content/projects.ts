// Projects supported by the infrastructure, with the stations where each one works.
// From the colleagues' static site (Primit de la colegi, 7 noiembrie 2026).
export interface Project {
  name: string;
  /** Funding programme and grant number. */
  funding: string;
  years: string;
  role: string;
  /** Station slugs (statiuni/<slug>). */
  stations: string[];
  where: string;
  summary: string;
  /** External site, or a site route key with an optional #anchor. */
  url: string;
}

export const PROJECTS: Project[] = [
  { name: "LifeWatch România", funding: "POC 2014–2020, FEDR · POC/448/1/1/126867", years: "2020–2023", role: "Universitatea din București, beneficiar", stations: ["sinaia", "braila", "orsova", "sfantu-gheorghe"], where: "Toate cele patru stațiuni și centrul de date de la Sinaia", summary: "Proiectul care a construit infrastructura: 11 laboratoare, rețeaua de stații din teren și centrul de date.", url: "infrastructura#proiect" },
  { name: "Restore4Life", funding: "Horizon Europe · GA 101112736", years: "2023–2027", role: "Coordonat de Universitatea din București (RCSES)", stations: ["braila", "sfantu-gheorghe"], where: "Coordonarea de la RCSES și Brăila, sit demonstrativ pe Canalul Enisala, în Delta Dunării", summary: "Restaurarea zonelor umede din bazinul Dunării și Wetland Restoration Hub, sistemul de sprijin pentru decizie.", url: "https://www.restore4life.eu/" },
  { name: "RESTORE4Cs", funding: "Horizon Europe · GA 101056782", years: "2023–2025", role: "Partener, echipa RCSES", stations: ["sfantu-gheorghe", "braila"], where: "Pilotul românesc din Delta Dunării", summary: "Rolul restaurării zonelor umede costiere în stocarea carbonului, emisiile de gaze și serviciile ecosistemice.", url: "https://www.restore4cs.eu/" },
  { name: "CROSSEU", funding: "Horizon Europe", years: "", role: "Partener, echipa RCSES", stations: ["braila"], where: "Studiul de caz 6, Dunărea de Jos, cu studiul hidrologic de la Brăila", summary: "Riscurile climatice în cascadă și schimbările hidrologice viitoare pe Dunărea de Jos.", url: "https://crosseu.eu/" },
  { name: "EMPOWERALL", funding: "Horizon Europe", years: "", role: "Partener, echipa RCSES", stations: ["braila"], where: "Living lab de agroecologie în platforma LTSER Insulele Brăilei", summary: "Living lab-uri de agroecologie conduse de tineri, găzduite de platformele LTSER.", url: "" },
  { name: "ROWER", funding: "Proiect european de restaurare", years: "", role: "Universitatea din București conduce studiul de caz din Delta Dunării", stations: ["sfantu-gheorghe", "braila"], where: "Delta Dunării, cu Carasuhat ca sit principal", summary: "Restaurarea zonelor umede, împreună cu INCDDD și Administrația Rezervației Biosferei Delta Dunării.", url: "" },
  { name: "SELINA", funding: "Horizon Europe", years: "2022–2027", role: "Partener, prin RCSES", stations: ["braila"], where: "Echipa RCSES", summary: "Serviciile ecosistemice și capitalul natural în deciziile publice și private.", url: "https://project-selina.eu/" },
  { name: "eLTER", funding: "Horizon 2020 și Horizon Europe", years: "", role: "RCSES coordonează echipa românească", stations: ["braila", "sinaia"], where: "Platformele LTSER, cu Insulele Brăilei ca platformă de referință", summary: "Infrastructura europeană de cercetare ecologică pe termen lung.", url: "https://elter-ri.eu/" },
  { name: "RIVER-EYE", funding: "Horizon Europe · Twinning", years: "", role: "Universitatea din București, cu WSL, UFZ, LifeWatch ERIC și Eratosthenes", stations: ["sinaia", "braila"], where: "Echipa RCSES, cu sprijinul centrului de date de la Sinaia", summary: "Proiect de înfrățire care consolidează capacitatea de cercetare a universității împreună cu parteneri europeni de vârf.", url: "" },
  { name: "PathChange", funding: "Biodiversa+", years: "", role: "Partener, echipa RCSES", stations: ["braila"], where: "Studiul de caz din România", summary: "Transformarea conflictelor din proiectele de restaurare a zonelor umede.", url: "" },
  { name: "MARCO-BOLO", funding: "Horizon Europe", years: "", role: "Partener, echipa RCSES", stations: ["sfantu-gheorghe"], where: "Sistemul Dunăre–Marea Neagră", summary: "Observarea biodiversității marine și costiere, de la ariile protejate din amonte la coastă.", url: "https://marcobolo-project.eu/" },
  { name: "BioAgora", funding: "Horizon Europe", years: "", role: "Partener, echipa RCSES", stations: [], where: "Echipa RCSES", summary: "Interfața dintre știința biodiversității și politici.", url: "https://bioagora.eu/" },
  { name: "DANUBIUS-RO-2", funding: "Program național", years: "din 2025", role: "Universitatea din București, partener în consorțiul național", stations: ["sfantu-gheorghe", "braila", "orsova"], where: "Sistemul Dunăre–Deltă–Marea Neagră", summary: "Consolidarea DANUBIUS-RO, nodul românesc al infrastructurii europene pentru sistemele fluviu–mare.", url: "https://www.danubius-ri.eu/" },
];

export const projectsAt = (station: string) => PROJECTS.filter((p) => p.stations.includes(station));

export const PROJECTS_SOURCE = "https://rcses.unibuc.ro/projects/";
