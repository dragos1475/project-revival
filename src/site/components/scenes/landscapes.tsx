// Landscapes for the station and platform pages. Six are views across the land, four are small maps.
import {
  band, Birds, blob, cloud, conifers, crowns, densify, dots, Drift, Flow, Graticule, grass, H, Hut, marsh, n, near, NorthArrow, poly, poplars, type Pt, reeds, ridge, rng, rolling, sample, ScaleBar, scatter, smooth, Tower, trunks, under, W,
} from "./kit";

export type Habitat = "danube" | "coast" | "mountain" | "gorge" | "wetland" | "islands" | "watershed" | "alpine" | "volcanic" | "glacial";

type Art = { id: string };

const Glow = ({ id, x, y, rx = 140, ry = 76 }: { id: string; x: number; y: number; rx?: number; ry?: number }) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-glow)`} />;

const Sun = ({ x, y, r = 10 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r + 6} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.22} />
    <circle cx={x} cy={y} r={r} fill="var(--brand-sand)" fillOpacity={0.42} />
  </g>
);

/** Vertical cliff hatching below the high parts of a ridge. */
function hatch(f: (x: number) => number, below: number, step = 3, k = 0.32) {
  let d = "";
  for (let x = -10; x <= W + 10; x += step) {
    const y = f(x);
    if (y < below) d += `M${n(x)} ${n(y + 1.5)}V${n(y + 3 + (below - y) * k)}`;
  }
  return d;
}

/** Short horizontal glints under the sun. */
function Glints({ x, y0, rows, gap = 5, width = 16, shrink = 2 }: { x: number; y0: number; rows: number; gap?: number; width?: number; shrink?: number }) {
  return (
    <g stroke="var(--brand-sand)" strokeWidth={1.2} strokeLinecap="round">
      {Array.from({ length: rows }, (_, i) => {
        const half = Math.max(2, width / 2 - i * shrink);
        return <path key={i} d={`M${n(x - half)} ${y0 + i * gap}H${n(x + half)}`} strokeOpacity={0.6 - i * 0.06} className="scene-breathe" style={{ animationDelay: `${-i * 1.7}s` }} />;
      })}
    </g>
  );
}

const Boat = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={0.9} strokeLinejoin="round">
    <path d="M-9 0H9L6.5 3H-6.5Z" fill="var(--brand-navy)" fillOpacity={0.35} />
    <path d="M-4 0V-3.5H3V0M-1 -3.5V-8" fill="var(--surface)" />
  </g>
);

/* Lunca Dunării at Brăila: a wide river, poplars on the far bank, reeds and willows on the near one. */
function Danube({ id }: Art) {
  const far = rolling(11, 104, 1.2, 60);
  const top = rolling(12, 111, 1.4, 80);
  const bank = (x: number) => 148 + 4 * Math.sin(x / 64 + 1.1) + 2 * Math.sin(x / 23);
  const mid = (x: number, k: number) => top(x) + (bank(x) - top(x)) * k;
  const trees = sample(far, 6.5).filter(([x]) => !(x > 148 && x < 176) && !(x > 268 && x < 286));
  const tall = trees.filter((_, i) => i % 3 === 0).map(([x, y]) => [x, y + 1] as Pt);
  const round = trees.filter((_, i) => i % 3 !== 0).map(([x, y]) => [x, y + 1] as Pt);
  const left = reeds(56, 132, (x) => bank(x) + 1, 30, 13, 4);
  const right = reeds(252, 334, (x) => bank(x) + 1, 28, 12, 7);
  const willows: Pt[] = [[18, bank(18) + 22], [40, bank(40) + 16], [372, bank(372) + 18], [392, bank(392) + 24]];
  return (
    <>
      <Glow id={id} x={292} y={78} />
      <Sun x={292} y={80} r={10} />
      <Birds flock={[{ x: 0, y: 58 }, { x: -14, y: 64, s: 0.8 }, { x: -24, y: 54, s: 0.85 }]} delay={18} />
      <path d={poplars(tall, 19, 13)} fill="var(--brand-green)" fillOpacity={0.24} />
      <path d={crowns(round, 5.2, 14)} fill="var(--brand-green)" fillOpacity={0.18} />
      <path d={band(sample(far, 10), sample(top, 10))} fill="var(--brand-green)" fillOpacity={0.12} />
      <path d={band(sample(top, 10), sample(bank, 10))} fill={`url(#${id}-water)`} />
      <path d={smooth(sample(top, 10))} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.45} strokeWidth={0.8} />
      <Flow d={smooth(sample((x) => mid(x, 0.25), 14))} dash="6 24" duration={22} opacity={0.5} />
      <Flow d={smooth(sample((x) => mid(x, 0.52), 14))} dash="12 18" duration={28} delay={6} opacity={0.42} />
      <Flow d={smooth(sample((x) => mid(x, 0.78), 14))} dash="4 26" duration={18} delay={3} opacity={0.5} />
      <Glints x={292} y0={116} rows={6} />
      <Drift duration={70} distance={20}>
        <Boat x={226} y={mid(226, 0.48)} />
      </Drift>
      <path d={under(sample(bank, 10))} fill={`url(#${id}-green)`} fillOpacity={0.2} />
      <path d={smooth(sample(bank, 10))} fill="none" stroke="var(--brand-green)" strokeOpacity={0.4} strokeWidth={0.9} />
      <g className="scene-sway" style={{ animationDuration: "9s" }}>
        <path d={left.stems} fill="none" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={0.9} strokeLinecap="round" />
        <path d={left.heads} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.85} strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <g className="scene-sway" style={{ animationDuration: "11s", animationDelay: "-4s" }}>
        <path d={right.stems} fill="none" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={0.9} strokeLinecap="round" />
        <path d={right.heads} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.85} strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <Hut x={186} y={bank(186) + 9} w={22} />
      <Tower x={212} y={bank(212) + 9} h={36} />
      <path d={trunks(willows, 10)} stroke="var(--brand-navy)" strokeOpacity={0.35} strokeWidth={1.2} />
      <path d={crowns(willows.map(([x, y]) => [x, y - 6] as Pt), 11, 15)} fill="var(--brand-green)" fillOpacity={0.3} />
      <path d={grass(140, 250, (x) => bank(x) + 14, 26, 6, 16)} fill="none" stroke="var(--brand-green)" strokeOpacity={0.45} strokeWidth={0.8} />
    </>
  );
}

/* Sfântu Gheorghe: sunrise over the Black Sea, the beach, dunes and an observation tower. */
function Coast({ id }: Art) {
  const shore = (x: number) => 140 + 5 * Math.sin(x / 52 + 0.6) + 2.5 * Math.sin(x / 19);
  const dune = (x: number) => 161 - 15 * Math.exp(-(((x - 300) / 66) ** 2)) - 7 * Math.exp(-(((x - 206) / 38) ** 2)) + 1.2 * Math.sin(x / 11);
  const horizon = 96;
  const sea = band(sample(() => horizon, 20), sample(shore, 10));
  const waves = [101, 106, 112, 119, 127, 135];
  const reed = reeds(-12, 104, () => 164, 44, 18, 21);
  const base = dune(296);
  return (
    <>
      <Glow id={id} x={126} y={92} rx={150} ry={70} />
      <Sun x={126} y={horizon} r={13} />
      <Birds flock={[{ x: 0, y: 62 }, { x: -12, y: 68, s: 0.8 }, { x: 10, y: 70, s: 0.75 }, { x: -22, y: 60, s: 0.7 }]} delay={30} duration={58} />
      <Drift duration={90} distance={24}>
        <g transform={`translate(318 ${horizon})`} stroke="var(--brand-navy)" strokeOpacity={0.4} strokeWidth={0.8} fill="var(--brand-navy)" fillOpacity={0.25}>
          <path d="M-9 0H9L7 2H-7Z" />
          <path d="M-5 0V-3H2V0M-2 -3V-6" fill="none" />
        </g>
      </Drift>
      <path d={sea} fill={`url(#${id}-water)`} />
      <path d={`M-10 ${horizon}H${W + 10}`} stroke="var(--brand-navy)" strokeOpacity={0.3} strokeWidth={0.8} />
      <clipPath id={`${id}-sea`}>
        <path d={sea} />
      </clipPath>
      <g clipPath={`url(#${id}-sea)`}>
        {waves.map((y, i) => (
          <Flow key={y} d={smooth(sample((x) => y + (0.5 + i * 0.25) * Math.sin(x / (8 + i * 2) + i), 6))} dash={i < 2 ? "3 27" : i < 4 ? "8 22" : "14 16"} duration={34 - i * 3} delay={i * 4} reverse={i % 2 === 1} opacity={0.32 + i * 0.05} />
        ))}
        <Glints x={126} y0={100} rows={7} gap={4.6} width={12} shrink={-1.4} />
      </g>
      <Flow d={smooth(sample((x) => shore(x) - 1.6, 10))} dash="3 9" duration={12} opacity={0.6} />
      <path d={band(sample(shore, 10), sample(dune, 10))} fill="var(--brand-sand)" fillOpacity={0.14} />
      <path d={under(sample(dune, 6))} fill={`url(#${id}-sand)`} fillOpacity={0.32} />
      <path d={smooth(sample(dune, 6))} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.55} strokeWidth={0.9} />
      <g className="scene-sway" style={{ animationDuration: "10s" }}>
        <path d={grass(176, 404, (x) => dune(x) + 1, 46, 7, 22)} fill="none" stroke="var(--brand-green)" strokeOpacity={0.5} strokeWidth={0.8} />
      </g>
      <g stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M288 ${base}L291 ${base - 24}M304 ${base}L301 ${base - 24}M289 ${base - 4}L302 ${base - 18}M303 ${base - 4}L290 ${base - 18}`} />
        <path d={`M285 ${base - 24}H307M287 ${base - 24}V${base - 30}M305 ${base - 24}V${base - 30}M287 ${base - 29}H305`} strokeWidth={1.1} />
        <path d={`M284 ${base - 31}L296 ${base - 37}L308 ${base - 31}Z`} fill="var(--brand-orange)" fillOpacity={0.22} />
      </g>
      <g className="scene-sway" style={{ animationDuration: "8s", animationDelay: "-3s" }}>
        <path d={reed.stems} fill="none" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={0.9} strokeLinecap="round" />
        <path d={reed.heads} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.85} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    </>
  );
}

/* Sinaia: Bucegi cliffs above the Prahova valley, cloud between the ridges, forest on the slopes. */
function Mountain({ id }: Art) {
  const far = ridge(21, 106, [{ x: 40, h: 50, w: 70 }, { x: 128, h: 62, w: 76 }, { x: 184, h: 46, w: 40 }, { x: 262, h: 56, w: 72 }, { x: 352, h: 44, w: 64 }], 2);
  const mid = ridge(22, 131, [{ x: 8, h: 40, w: 92 }, { x: 110, h: 28, w: 70 }, { x: 210, h: 16, w: 60 }, { x: 306, h: 40, w: 92 }, { x: 402, h: 30, w: 60 }], 2.5);
  const valley = rolling(23, 151, 2.5, 60);
  const r = rng(24);
  const row1 = sample(mid, 5.2).map(([x, y]) => [x + r() * 2, y + 5 + r() * 3] as Pt);
  const row2 = sample(mid, 6.4).map(([x, y]) => [x + 2 + r() * 2, y + 13 + r() * 3] as Pt);
  const river: Pt[] = [[-12, 161], [60, 157], [120, 160], [190, 155], [260, 157], [330, 153], [412, 156]];
  return (
    <>
      <Glow id={id} x={112} y={62} />
      <path d={under(sample(far, 4), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.16} />
      <path d={poly(sample(far, 4))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.34} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={hatch(far, 80, 3.4, 0.26)} stroke="var(--brand-navy)" strokeOpacity={0.14} strokeWidth={0.7} />
      <Drift duration={46} distance={16}>
        <path d={cloud(54, 100, 104, 9)} fill="var(--scene-mist)" fillOpacity={0.88} />
      </Drift>
      <Drift duration={58} delay={20} distance={20}>
        <path d={cloud(232, 94, 120, 10)} fill="var(--scene-mist)" fillOpacity={0.82} />
      </Drift>
      <g className="scene-orbit" style={{ transformOrigin: "300px 62px", transformBox: "view-box", animationDuration: "52s" }}>
        <g transform="translate(316 62) scale(1.1)" fill="none" stroke="var(--foreground)" strokeOpacity={0.45} strokeWidth={1.1} strokeLinecap="round">
          <path d="M-5.5 0.6Q-2.8 -2 0 0.2Q2.8 -2 5.5 0.6" />
        </g>
      </g>
      <path d={under(sample(mid, 5), H + 6, false)} fill={`url(#${id}-green)`} fillOpacity={0.2} />
      <path d={poly(sample(mid, 5))} fill="none" stroke="var(--brand-green)" strokeOpacity={0.36} strokeWidth={0.9} />
      <path d={conifers(row1, 10, 0.4, 25)} fill="var(--brand-green)" fillOpacity={0.32} />
      <path d={conifers(row2, 11.5, 0.4, 26)} fill="var(--brand-green)" fillOpacity={0.46} />
      <path d={under(sample(valley, 10))} fill={`url(#${id}-green)`} fillOpacity={0.14} />
      <path d={smooth(sample(valley, 10))} fill="none" stroke="var(--brand-green)" strokeOpacity={0.3} strokeWidth={0.8} />
      <path d={smooth(river)} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.45} strokeWidth={1.8} />
      <Flow d={smooth(river)} dash="6 24" duration={14} opacity={0.9} />
      <Hut x={232} y={valley(232) + 3} w={20} />
      <Tower x={254} y={valley(254) + 3} h={30} />
      <path d={crowns([[206, valley(206) + 4], [276, valley(276) + 4], [288, valley(288) + 5]], 5, 27)} fill="var(--brand-green)" fillOpacity={0.35} />
    </>
  );
}

/* Orșova: the Danube between the walls of the gorge, with the far ridges framed by the cliffs. */
function Gorge({ id }: Art) {
  const far = ridge(31, 112, [{ x: 118, h: 58, w: 96 }, { x: 292, h: 62, w: 96 }], 2);
  const wall = ridge(32, 143, [{ x: 24, h: 99, w: 152 }, { x: 386, h: 97, w: 160 }], 3);
  const lx = 178, rx = 232;
  const left: Pt[] = [...sample(wall, 4, -12, lx), [lx, 143], [-12, 198]];
  const right: Pt[] = [[rx, 143], ...sample(wall, 4, rx, W + 12), [W + 12, 196]];
  const leftD = poly(left, true), rightD = poly(right, true);
  const river = poly([[lx, 143], [rx, 143], [W + 12, 196], [W + 12, H + 8], [-12, H + 8], [-12, 198]], true);
  const strata = Array.from({ length: 34 }, (_, i) => smooth(sample((x) => -30 + i * 7 + 0.16 * x + 1.6 * Math.sin(x / 14 + i), 10))).join("");
  const r = rng(33);
  const ledges = sample(wall, 9).filter(([x, y]) => (x < lx - 20 || x > rx + 20) && y < 120).map(([x, y]) => [x + r() * 3, y + 3] as Pt);
  const inner = scatter(34, 46, -10, W + 10, 60, 170, (x, y) => (x < lx - 6 && y > wall(x) + 10 && y < 143 + ((lx - x) * 55) / 190 - 6) || (x > rx + 6 && y > wall(x) + 10 && y < 143 + ((x - rx) * 53) / 180 - 6));
  const vx = 205;
  return (
    <>
      <Glow id={id} x={vx} y={72} rx={110} ry={60} />
      <path d={under(sample(far, 4), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.14} />
      <path d={poly(sample(far, 4))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.28} strokeWidth={0.8} />
      <Birds flock={[{ x: 0, y: 70 }, { x: -12, y: 76, s: 0.8 }]} delay={12} duration={50} />
      <path d={river} fill={`url(#${id}-water)`} />
      {[-0.7, -0.35, 0, 0.35, 0.7].map((t, i) => (
        <Flow key={t} d={`M${n(vx + t * 18)} 145L${n(vx + t * 250)} ${H + 6}`} dash={i % 2 ? "8 22" : "4 26"} duration={13 + i * 2} delay={i * 3} opacity={0.5} />
      ))}
      <Drift duration={64} distance={18}>
        <Boat x={214} y={166} />
      </Drift>
      <Drift duration={50} delay={12} distance={22}>
        <path d={cloud(128, 132, 156, 8)} fill="var(--scene-mist)" fillOpacity={0.7} />
      </Drift>
      <clipPath id={`${id}-walls`}>
        <path d={leftD + rightD} />
      </clipPath>
      <path d={leftD + rightD} fill={`url(#${id}-navy)`} fillOpacity={0.2} />
      <g clipPath={`url(#${id}-walls)`}>
        <path d={strata} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.4} strokeWidth={0.7} />
      </g>
      <path d={poly(sample(wall, 4, -12, lx)) + poly(sample(wall, 4, rx, W + 12))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.4} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={crowns(ledges, 3.6, 35)} fill="var(--brand-green)" fillOpacity={0.4} />
      <path d={crowns(inner, 2.4, 36)} fill="var(--brand-green)" fillOpacity={0.3} />
    </>
  );
}

/* Bucegi and Piatra Craiului: a long serrated limestone crest above alpine meadows. */
function Alpine({ id }: Art) {
  const back = ridge(40, 98, [{ x: 40, h: 34, w: 90 }, { x: 350, h: 42, w: 96 }], 2);
  // Piatra Craiului: one long crest that climbs to the south-west summit, notched by a few saddles.
  const crest = ridge(42, 110, [
    { x: 20, h: 22, w: 60 }, { x: 70, h: 30, w: 50 }, { x: 112, h: 38, w: 46 }, { x: 150, h: 44, w: 40 }, { x: 186, h: 50, w: 44 },
    { x: 222, h: 48, w: 30 }, { x: 250, h: 58, w: 46 }, { x: 292, h: 46, w: 40 }, { x: 330, h: 36, w: 50 }, { x: 380, h: 26, w: 60 },
  ], 3);
  const slope = rolling(43, 127, 5, 70);
  const front = rolling(44, 147, 4, 50);
  const pines = scatter(45, 60, -10, W + 10, 120, 150, (x, y) => y > slope(x) + 4 && y < slope(x) + 20);
  const fl = (seed: number) => scatter(seed, 22, -10, W + 10, 150, 190, (x, y) => y > front(x) + 4);
  const trail: Pt[] = [[96, 196], [128, 170], [104, 160], [150, 150], [128, 144], [200, 138], [250, slope(250) + 4]];
  return (
    <>
      <Glow id={id} x={300} y={62} />
      <path d={under(sample(back, 6))} fill="var(--brand-navy)" fillOpacity={0.06} />
      <path d={under(sample(crest, 2.5), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.17} />
      <path d={poly(sample(crest, 2.5))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.38} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={hatch(crest, 88, 3.6, 0.22)} stroke="var(--brand-navy)" strokeOpacity={0.13} strokeWidth={0.7} />
      <Drift duration={60} distance={22}>
        <path d={cloud(120, 80, 130, 10)} fill="var(--scene-mist)" fillOpacity={0.86} />
      </Drift>
      <Birds flock={[{ x: 0, y: 56 }, { x: -14, y: 62, s: 0.8 }]} delay={26} duration={56} />
      <path d={under(sample(slope, 8))} fill={`url(#${id}-green)`} fillOpacity={0.2} />
      <path d={smooth(sample(slope, 8))} fill="none" stroke="var(--brand-green)" strokeOpacity={0.4} strokeWidth={0.9} />
      <path d={crowns(pines, 2.8, 46)} fill="var(--brand-green)" fillOpacity={0.48} />
      <Hut x={258} y={slope(258) + 4} w={18} />
      <path d={smooth(trail)} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.7} strokeWidth={0.9} strokeDasharray="2 3" />
      <path d={under(sample(front, 8))} fill={`url(#${id}-green)`} fillOpacity={0.14} />
      <path d={dots(fl(47), 1.1)} fill="var(--brand-orange)" fillOpacity={0.55} />
      <path d={dots(fl(48), 1.1)} fill="var(--brand-sand)" fillOpacity={0.7} />
      <path d={dots(fl(49), 1)} fill="var(--brand-teal)" fillOpacity={0.55} />
      <g className="scene-sway" style={{ animationDuration: "9s" }}>
        <path d={grass(-10, W + 10, (x) => front(x) + 10, 60, 7, 50)} fill="none" stroke="var(--brand-green)" strokeOpacity={0.4} strokeWidth={0.8} />
      </g>
    </>
  );
}

/* Retezat: cirques below sharp peaks, a chain of glacial lakes with the peaks mirrored in them. */
function Glacial({ id }: Art) {
  const crest = ridge(51, 101, [{ x: 70, h: 46, w: 56 }, { x: 134, h: 57, w: 50 }, { x: 198, h: 40, w: 42 }, { x: 264, h: 58, w: 56 }, { x: 338, h: 44, w: 58 }], 2);
  const floor = rolling(52, 121, 3, 60);
  const upper = blob(264, 121, 24, 4.6, 53, 0.22);
  const lower = blob(152, 139, 42, 7.6, 54, 0.2);
  const inLake = (x: number, y: number) => ((x - 264) / 30) ** 2 + ((y - 121) / 8) ** 2 < 1 || ((x - 152) / 48) ** 2 + ((y - 139) / 12) ** 2 < 1;
  const boulders = scatter(55, 46, -10, W + 10, 126, 158, (x, y) => !inLake(x, y) && y > floor(x) + 3);
  const r = rng(56);
  const treesL = sample(() => 164, 6.5, -12, 82).map(([x, y]) => [x, y - r() * 8 + (x < 30 ? 0 : (x - 30) * 0.12)] as Pt);
  const treesR = sample(() => 166, 6.5, 312, W + 12).map(([x, y]) => [x, y - r() * 8 - (x - 312) * 0.08] as Pt);
  return (
    <>
      <Glow id={id} x={120} y={58} />
      <path d={under(sample(crest, 3), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.17} />
      <path d={poly(sample(crest, 3))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.36} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={hatch(crest, 82, 4, 0.22)} stroke="var(--brand-navy)" strokeOpacity={0.12} strokeWidth={0.7} />
      <path d="M100 112Q134 129 168 110M226 110Q264 127 302 108M304 112Q338 124 372 110" fill="none" stroke="var(--brand-navy)" strokeOpacity={0.24} strokeWidth={0.8} />
      <Drift duration={54} distance={18}>
        <path d={cloud(170, 104, 120, 7)} fill="var(--scene-mist)" fillOpacity={0.75} />
      </Drift>
      <Birds flock={[{ x: 0, y: 60 }]} delay={8} duration={60} />
      <path d={under(sample(floor, 10))} fill={`url(#${id}-sand)`} fillOpacity={0.14} />
      <path d={smooth(sample(floor, 10))} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.35} strokeWidth={0.8} />
      <clipPath id={`${id}-lakes`}>
        <path d={upper + lower} />
      </clipPath>
      <path d={upper + lower} fill={`url(#${id}-water)`} stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.8} />
      <g clipPath={`url(#${id}-lakes)`}>
        <path d="M118 132L136 150L160 132ZM244 117L264 129L286 117Z" fill="var(--brand-navy)" fillOpacity={0.14} />
        <Glints x={176} y0={136} rows={3} gap={3} width={14} shrink={3} />
      </g>
      <Flow d={smooth([[244, 124], [230, 128], [222, 126], [206, 132], [192, 135]])} dash="4 8" duration={10} opacity={0.7} />
      <Flow d={smooth([[112, 142], [96, 146], [84, 152], [60, 156], [30, 164]])} dash="4 8" duration={10} delay={3} opacity={0.7} />
      <path d={dots(boulders, 1.3)} fill="var(--brand-sand)" fillOpacity={0.22} stroke="var(--brand-sand)" strokeOpacity={0.55} strokeWidth={0.6} />
      <path d={conifers(treesL, 13, 0.35, 57) + conifers(treesR, 13, 0.35, 58)} fill="var(--brand-green)" fillOpacity={0.42} />
    </>
  );
}

/* Delta Dunării as a small map: three arms to the sea, lakes, marsh and canals. */
function Wetland({ id: _id }: Art) {
  const coast = (y: number) => 350 + 6 * Math.sin(y / 26) + 3 * Math.sin(y / 9);
  const sea: Pt[] = [...Array.from({ length: 23 }, (_, i) => [coast(-10 + i * 10), -10 + i * 10] as Pt), [W + 12, H + 10], [W + 12, -10]];
  const arms = {
    main: [[-12, 104], [40, 100], [90, 106], [120, 102]] as Pt[],
    chilia: [[120, 102], [150, 86], [190, 64], [240, 54], [300, 50], [356, 52]] as Pt[],
    sulina: [[120, 102], [170, 99], [260, 97], [356, 96]] as Pt[],
    sfg: [[120, 102], [140, 118], [172, 128], [196, 148], [222, 138], [252, 150], [288, 144], [322, 154], [356, 148]] as Pt[],
  };
  const lakes = [[215, 78, 18, 8], [282, 72, 14, 6.5], [326, 80, 9, 5], [190, 116, 11, 6], [252, 121, 22, 8.5], [312, 127, 10, 5.5], [92, 132, 16, 7], [70, 76, 13, 6]] as const;
  const water = [...Object.values(arms).flatMap((a) => densify(a, 4))];
  const inLake = (x: number, y: number) => lakes.some(([cx, cy, rx, ry]) => ((x - cx) / (rx + 5)) ** 2 + ((y - cy) / (ry + 4)) ** 2 < 1);
  const marshPts = scatter(61, 120, -10, 344, 34, 172, (x, y) => x < coast(y) - 8 && !inLake(x, y) && !near(water, x, y, 7));
  return (
    <>
      <Graticule xs={[100, 200, 300]} ys={[70, 130]} />
      <path d={poly(sea, true)} fill="var(--brand-teal)" fillOpacity={0.12} />
      <path d={smooth(sea.slice(0, 23))} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.9} />
      {[10, 22, 36].map((o, i) => (
        <path key={o} d={smooth(Array.from({ length: 23 }, (_, k) => [coast(-10 + k * 10) + o, -10 + k * 10] as Pt))} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.28 - i * 0.06} strokeWidth={0.7} strokeDasharray="3 4" />
      ))}
      <path d={marsh(marshPts)} fill="none" stroke="var(--brand-green)" strokeOpacity={0.5} strokeWidth={0.7} strokeLinecap="round" />
      {lakes.map(([cx, cy, rx, ry], i) => (
        <path key={i} d={blob(cx, cy, rx, ry, 62 + i, 0.2)} fill="var(--brand-teal)" fillOpacity={0.18} stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.8} />
      ))}
      <path d="M215 86V97M252 112V98M282 79V97M190 110V100M92 125L104 107M70 83L84 101" fill="none" stroke="var(--brand-teal)" strokeOpacity={0.45} strokeWidth={0.7} strokeDasharray="2 2" />
      <path d={smooth(arms.main) + smooth(arms.chilia) + smooth(arms.sfg)} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
      <path d={poly(arms.sulina)} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={2.2} />
      <Flow d={smooth(arms.main) + smooth(arms.chilia)} color="var(--surface)" opacity={0.9} dash="4 26" duration={20} />
      <Flow d={poly(arms.sulina)} color="var(--surface)" opacity={0.9} dash="4 26" duration={18} delay={5} />
      <Flow d={smooth(arms.sfg)} color="var(--surface)" opacity={0.9} dash="4 26" duration={24} delay={9} />
      <Birds flock={[{ x: 0, y: 112 }, { x: -10, y: 118, s: 0.85 }, { x: -18, y: 108, s: 0.8 }, { x: 8, y: 122, s: 0.75 }]} delay={20} duration={70} opacity={0.4} />
      <NorthArrow x={84} y={58} />
      <ScaleBar x={78} y={150} />
    </>
  );
}

/* Insulele Brăilei as a small map: two Danube arms around the islands, embanked fields and wild floodplain. */
function Islands({ id }: Art) {
  const nTop = (x: number) => 54 + 6 * Math.sin(x / 70 + 0.4);
  const nBot = (x: number) => nTop(x) + 12 + 3 * Math.sin(x / 40);
  const sTop = (x: number) => 138 + 5 * Math.sin(x / 60 + 2);
  const sBot = (x: number) => sTop(x) + 13;
  const north = band(sample(nTop, 10), sample(nBot, 10));
  const south = band(sample(sTop, 10), sample(sBot, 10));
  const polder = `${smooth(sample((x) => nBot(x) + 6, 10, -12, 184))}C196 90 196 112 ${n(184)} ${n(sTop(184) - 6)}${smooth(sample((x) => sTop(x) - 6, 10, -12, 184).reverse()).replace(/^M/, "L")}Z`;
  const r = rng(63);
  const fields: string[] = [];
  const tones = ["var(--brand-sand)", "var(--brand-green)", "var(--brand-sand)", "var(--brand-teal)"];
  for (let i = -2; i < 14; i++)
    for (let j = 0; j < 7; j++) {
      const x = i * 16 + j * 3.4, y = 64 + j * 11, w = 15, h = 10;
      fields.push(`M${n(x)} ${n(y)}l${w} -3.2l0 ${h}l-${w} 3.2Z|${Math.floor(r() * tones.length)}|${(0.08 + r() * 0.14).toFixed(2)}`);
    }
  const lakes = [[240, 100, 20, 8.5], [298, 86, 13, 5.5], [334, 114, 15, 6.5], [268, 124, 9, 4.5], [372, 92, 11, 5]] as const;
  const inLake = (x: number, y: number) => lakes.some(([cx, cy, rx, ry]) => ((x - cx) / (rx + 4)) ** 2 + ((y - cy) / (ry + 4)) ** 2 < 1);
  const braids = ["M202 70C220 80 230 94 238 100", "M254 106C270 118 288 128 300 140", "M310 72C318 82 322 98 330 112", "M346 120C356 128 362 134 370 140", "M312 90C324 92 330 100 334 108"];
  const forest = scatter(64, 120, 192, W + 10, 70, 136, (x, y) => y > nBot(x) + 3 && y < sTop(x) - 3 && !inLake(x, y));
  return (
    <>
      <Graticule xs={[120, 280]} ys={[100]} />
      <path d={dots(scatter(65, 70, -10, W + 10, 30, nTop(200) - 2, (x, y) => y < nTop(x) - 3), 0.6)} fill="var(--brand-navy)" fillOpacity={0.25} />
      <path d={dots(scatter(66, 70, -10, W + 10, 150, 175, (x, y) => y > sBot(x) + 3), 0.6)} fill="var(--brand-navy)" fillOpacity={0.25} />
      <clipPath id={`${id}-polder`}>
        <path d={polder} />
      </clipPath>
      <g clipPath={`url(#${id}-polder)`}>
        {fields.map((f, i) => {
          const [d, tone, o] = f.split("|");
          return <path key={i} d={d} fill={tones[Number(tone)]} fillOpacity={Number(o)} stroke="var(--brand-sand)" strokeOpacity={0.25} strokeWidth={0.5} />;
        })}
      </g>
      <path d={polder} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.45} strokeWidth={0.9} strokeDasharray="3 3" />
      <path d={braids.join("")} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.55} strokeWidth={1.1} strokeLinecap="round" />
      {lakes.map(([cx, cy, rx, ry], i) => (
        <path key={i} d={blob(cx, cy, rx, ry, 67 + i, 0.2)} fill="var(--brand-teal)" fillOpacity={0.2} stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.8} />
      ))}
      <path d={crowns(forest, 2.2, 68)} fill="var(--brand-green)" fillOpacity={0.36} />
      <path d={north + south} fill="var(--brand-teal)" fillOpacity={0.22} stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.8} />
      <Flow d={smooth(sample((x) => (nTop(x) + nBot(x)) / 2, 10))} color="var(--surface)" opacity={0.9} dash="6 24" duration={20} />
      <Flow d={smooth(sample((x) => (sTop(x) + sBot(x)) / 2, 10))} color="var(--surface)" opacity={0.9} dash="6 24" duration={24} delay={7} />
      <Birds flock={[{ x: 0, y: 94 }, { x: -12, y: 100, s: 0.8 }, { x: -20, y: 90, s: 0.75 }]} delay={14} duration={66} opacity={0.4} />
      <NorthArrow x={84} y={44} />
      <ScaleBar x={78} y={160} />
    </>
  );
}

/** A wandering stream from `a` to `b`, with optional side branches. */
function stream(a: Pt, b: Pt, seed: number, depth: number, out: string[], widths: number[]) {
  const r = rng(seed);
  const pts: Pt[] = [a];
  const nx = -(b[1] - a[1]), ny = b[0] - a[0], len = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < 5; i++) {
    const t = i / 5, wob = (r() - 0.5) * 0.18 * len;
    pts.push([a[0] + (b[0] - a[0]) * t + (nx / len) * wob, a[1] + (b[1] - a[1]) * t + (ny / len) * wob]);
  }
  pts.push(b);
  out.push(smooth(pts));
  widths.push(depth);
  if (depth > 0)
    [0.45, 0.72].forEach((t, k) => {
      const i = Math.round(t * 5), p = pts[i], side = k ? 1 : -1;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const end: Pt = [p[0] + dx * 0.35 + side * (nx / len) * 0.4 * Math.hypot(dx, dy), p[1] + dy * 0.35 + side * (ny / len) * 0.4 * Math.hypot(dx, dy)];
      stream(p, end, seed * 7 + k, depth - 1, out, widths);
    });
}

/* Neajlov as a small map: the basin divide, a branching river network, forests, fields and villages. */
function Watershed({ id }: Art) {
  const divide = blob(200, 100, 184, 66, 71, 0.1, 32);
  const main: Pt[] = [[34, 80], [70, 86], [104, 82], [140, 94], [176, 98], [214, 96], [250, 106], [290, 108], [330, 114], [372, 116], [412, 120]];
  const tribs: [Pt, Pt][] = [
    [[104, 82], [84, 48]], [[176, 98], [156, 50]], [[250, 106], [236, 50]], [[330, 114], [326, 60]],
    [[140, 94], [118, 148]], [[214, 96], [192, 158]], [[290, 108], [266, 158]], [[372, 116], [352, 152]],
  ];
  const paths: string[] = [], depth: number[] = [];
  tribs.forEach(([a, b], i) => stream(a, b, 72 + i, 1, paths, depth));
  const contours = [0.84, 0.66, 0.48, 0.3].map((k, i) => blob(200 + i * 4, 104 - i * 2, 184 * k, 66 * k, 73 + i, 0.14, 32));
  const fieldsA = blob(150, 64, 36, 11, 77, 0.2), fieldsB = blob(304, 136, 34, 11, 78, 0.2);
  const forestA = blob(84, 122, 30, 13, 79, 0.25), forestB = blob(282, 76, 38, 13, 80, 0.25);
  const stripes = Array.from({ length: 60 }, (_, i) => `M${-40 + i * 8} 30l40 140`).join("");
  const villages: Pt[] = [[196, 110], [122, 102], [318, 124], [262, 92], [64, 96]];
  const r = rng(81);
  const houses = villages.flatMap(([vx, vy]) => Array.from({ length: 7 }, () => [vx + (r() - 0.5) * 16, vy + (r() - 0.5) * 9] as Pt));
  const road = smooth([[-12, 112], [64, 96], [122, 102], [196, 110], [262, 92], [318, 124], [412, 130]]);
  return (
    <>
      <Graticule xs={[110, 290]} ys={[60, 140]} />
      {contours.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.42} strokeWidth={0.7} />
      ))}
      <clipPath id={`${id}-fields`}>
        <path d={fieldsA + fieldsB} />
      </clipPath>
      <path d={fieldsA + fieldsB} fill="var(--brand-sand)" fillOpacity={0.12} />
      <path d={stripes} clipPath={`url(#${id}-fields)`} stroke="var(--brand-sand)" strokeOpacity={0.45} strokeWidth={0.6} />
      <path d={forestA + forestB} fill="var(--brand-green)" fillOpacity={0.14} />
      <path d={crowns(scatter(82, 70, 40, 330, 50, 140, (x, y) => ((x - 84) / 28) ** 2 + ((y - 122) / 12) ** 2 < 1 || ((x - 282) / 36) ** 2 + ((y - 76) / 12) ** 2 < 1), 2, 83)} fill="var(--brand-green)" fillOpacity={0.4} />
      <path d={divide} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="5 4" />
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.6} strokeWidth={depth[i] ? 1.2 : 0.7} strokeLinecap="round" />
      ))}
      <path d={smooth(main)} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.6} strokeWidth={2.2} strokeLinecap="round" />
      <Flow d={smooth(main)} color="var(--surface)" opacity={0.9} dash="4 26" duration={18} />
      <path d={road} fill="none" stroke="var(--border-strong)" strokeWidth={2.6} />
      <path d={road} fill="none" stroke="var(--surface)" strokeWidth={1.1} />
      <path d={houses.map(([x, y]) => `M${n(x - 1.3)} ${n(y - 1.3)}h2.6v2.6h-2.6Z`).join("")} fill="var(--brand-navy)" fillOpacity={0.45} />
      <g>
        <circle cx={352} cy={115} r={6} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.5} className="scene-breathe" />
        <path d="M352 111L355.5 117H348.5Z" fill="var(--brand-orange)" fillOpacity={0.8} />
      </g>
      <NorthArrow x={84} y={50} />
      <ScaleBar x={78} y={156} />
    </>
  );
}

/* Călimani as a small map: contours around the volcanic caldera, radial streams and the forest belt. */
function Volcanic({ id: _id }: Art) {
  const cx = 214, cy = 96;
  const rings = Array.from({ length: 12 }, (_, i) => {
    const rx = 172 - i * 11.5;
    return blob(200 + i * 1.3, 104 - i * 0.7, rx, rx * 0.4 + 4, 90 + i, 0.08 + i * 0.006, 36);
  });
  const ticks = Array.from({ length: 30 }, (_, i) => {
    const t = (i / 30) * Math.PI * 2;
    const x = cx + Math.cos(t) * 30, y = cy + Math.sin(t) * 13;
    const dx = cx - x, dy = cy - y, l = Math.hypot(dx, dy) || 1;
    return `M${n(x)} ${n(y)}l${n((dx / l) * 3.2)} ${n((dy / l) * 3.2)}`;
  }).join("");
  const r = rng(91);
  const streams = [0.4, 1.3, 2.1, 2.9, 3.6, 4.5, 5.3].map((a, i) => {
    const pts: Pt[] = [];
    for (let k = 0; k <= 6; k++) {
      const rr = 1.12 + k * 0.62, wob = (r() - 0.5) * 0.18;
      pts.push([cx + Math.cos(a + wob) * 30 * rr, cy + Math.sin(a + wob) * 13 * rr * 1.04]);
    }
    return { d: smooth(pts), i };
  });
  const belt = scatter(92, 170, -10, W + 10, 20, 190, (x, y) => {
    const e = ((x - 200) / 150) ** 2 + ((y - 104) / 64) ** 2, f = ((x - 205) / 86) ** 2 + ((y - 100) / 38) ** 2;
    return e < 1 && f > 1;
  });
  return (
    <>
      <Graticule xs={[100, 300]} ys={[50, 150]} />
      <path d={dots(belt, 1)} fill="var(--brand-green)" fillOpacity={0.4} />
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i % 4 === 0 ? "var(--brand-navy)" : "var(--brand-sand)"} strokeOpacity={i % 4 === 0 ? 0.32 : 0.42} strokeWidth={i % 4 === 0 ? 1 : 0.7} />
      ))}
      <ellipse cx={cx} cy={cy} rx={30} ry={13} fill="var(--brand-orange)" fillOpacity={0.06} stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={1.1} />
      <path d={ticks} stroke="var(--brand-navy)" strokeOpacity={0.5} strokeWidth={0.8} />
      <ellipse cx={cx - 2} cy={cy + 1} rx={16} ry={6} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.6} strokeWidth={0.8} strokeDasharray="2 2" />
      {streams.map(({ d, i }) => (i % 2 ? <Flow key={i} d={d} dash="4 8" duration={11 + i} delay={i * 2} opacity={0.75} /> : <path key={i} d={d} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.55} strokeWidth={0.9} />))}
      <path d={`M${cx + 8} ${cy - 18}L${cx + 12} ${cy - 11}H${cx + 4}Z`} fill="var(--brand-navy)" fillOpacity={0.6} />
      <circle cx={cx + 8} cy={cy - 14} r={5} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.5} className="scene-breathe" />
      <NorthArrow x={84} y={54} />
      <ScaleBar x={78} y={154} />
    </>
  );
}

export function Landscape({ habitat, id }: { habitat: Habitat; id: string }) {
  switch (habitat) {
    case "danube": return <Danube id={id} />;
    case "coast": return <Coast id={id} />;
    case "mountain": return <Mountain id={id} />;
    case "gorge": return <Gorge id={id} />;
    case "wetland": return <Wetland id={id} />;
    case "islands": return <Islands id={id} />;
    case "watershed": return <Watershed id={id} />;
    case "alpine": return <Alpine id={id} />;
    case "volcanic": return <Volcanic id={id} />;
    case "glacial": return <Glacial id={id} />;
  }
}
