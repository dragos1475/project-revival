// Scenes for the general pages: each one draws what the page is about, in the same line-and-wash style.
import {
  Birds, cloud, Drift, blob, conifers, crowns, dots, Flow, grass, H, Hut, n, poly, poplars, type Pt, reeds, ridge, rng, sample, scatter, smooth, Tower, under, W,
} from "./kit";

export type Topic = "about" | "infrastructure" | "platforms" | "data" | "api" | "docs" | "services" | "network" | "projects" | "faq" | "contact" | "not-found";

type Art = { id: string };

const Glow = ({ id, x, y, rx = 140, ry = 76 }: { id: string; x: number; y: number; rx?: number; ry?: number }) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-glow)`} />;
const BlueprintGrid = ({ step = 20, opacity = 0.5 }: { step?: number; opacity?: number }) => (
  <path d={Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => `M${i * step} -10V${H + 10}`).join("") + Array.from({ length: Math.ceil(H / step) + 1 }, (_, i) => `M-10 ${i * step}H${W + 10}`).join("")} stroke="var(--border)" strokeOpacity={opacity * 2} strokeWidth={0.6} fill="none" />
);

/* About: Romania from the Carpathians to the Black Sea in one panorama. */
function About({ id }: Art) {
  const mtn = ridge(101, 132, [{ x: 18, h: 74, w: 70 }, { x: 74, h: 60, w: 58 }, { x: 122, h: 40, w: 50 }], 2);
  const hills = (x: number) => 134 + 5 * Math.sin(x / 40 + 1) + 2 * Math.sin(x / 17) + Math.max(0, x - 196) * 0.34;
  const plain = (x: number) => 145 + 1.5 * Math.sin(x / 30);
  const seaTop = 124;
  const coast: Pt[] = [[292, seaTop], [312, 134], [326, 146], [352, 162], [376, 184], [394, H + 8]];
  const r = rng(103);
  const pines = sample(mtn, 5, -10, 130).map(([x, y]) => [x + r() * 2, y + 9 + r() * 6] as Pt).filter(([, y]) => y < 140);
  const oaks = sample(hills, 7, 116, 214).map(([x, y]) => [x, y + 3] as Pt);
  const reed = reeds(268, 326, () => 147, 30, 12, 104);
  const danube = smooth([[178, 166], [214, 152], [252, 156], [286, 148], [312, 150], [334, 146]]);
  return (
    <>
      <Glow id={id} x={314} y={66} />
      <circle cx={318} cy={70} r={9} fill="var(--brand-sand)" fillOpacity={0.4} />
      <Birds flock={[{ x: 0, y: 56 }, { x: -12, y: 62, s: 0.8 }, { x: -24, y: 66, s: 0.75 }, { x: -6, y: 70, s: 0.7 }, { x: -32, y: 58, s: 0.7 }]} delay={22} duration={66} />
      <path d={under(sample(plain, 10))} fill={`url(#${id}-sand)`} fillOpacity={0.2} />
      <path d={under(sample(mtn, 3), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.17} />
      <path d={poly(sample(mtn, 3))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.36} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={conifers(pines, 9, 0.4, 105)} fill="var(--brand-green)" fillOpacity={0.42} />
      <path d={under(sample(hills, 6, -12, 250))} fill={`url(#${id}-green)`} fillOpacity={0.22} />
      <path d={smooth(sample(hills, 6, -12, 250))} fill="none" stroke="var(--brand-green)" strokeOpacity={0.4} strokeWidth={0.9} />
      <path d={crowns(oaks, 4.2, 106)} fill="var(--brand-green)" fillOpacity={0.36} />
      <path d={Array.from({ length: 7 }, (_, i) => `M${206 + i * 10} ${152 + i * 0.4}L${236 + i * 13} ${178}`).join("")} stroke="var(--brand-sand)" strokeOpacity={0.4} strokeWidth={0.7} />
      <Hut x={232} y={146} w={12} />
      <Hut x={248} y={147} w={10} />
      <path d={poplars([[262, 146], [268, 146], [274, 147]], 13, 107)} fill="var(--brand-green)" fillOpacity={0.35} />
      <path d={danube} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={2.4} strokeLinecap="round" />
      <Flow d={danube} color="var(--surface)" opacity={0.9} dash="4 26" duration={16} />
      <g className="scene-sway" style={{ animationDuration: "9s" }}>
        <path d={reed.stems} fill="none" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={0.8} strokeLinecap="round" />
        <path d={reed.heads} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.8} strokeWidth={2} strokeLinecap="round" />
      </g>
      <path d={`${smooth(coast)}L${W + 12} ${H + 8}L${W + 12} ${seaTop}Z`} fill={`url(#${id}-water)`} />
      <path d={`M280 ${seaTop}H${W + 12}`} stroke="var(--brand-navy)" strokeOpacity={0.25} strokeWidth={0.8} />
      {[129, 137, 147, 160].map((y, i) => (
        <Flow key={y} d={`M${310 + i * 12} ${y}H${W + 12}`} dash={i < 2 ? "4 26" : "10 20"} duration={22 - i * 2} delay={i * 4} reverse={i % 2 === 1} opacity={0.45} />
      ))}
    </>
  );
}

/* Infrastructure: a cross-section of the terrain with the four stations, linked by their data. */
function Infrastructure({ id }: Art) {
  const prof: Pt[] = [[-12, 92], [20, 70], [52, 58], [86, 66], [104, 60], [126, 82], [142, 120], [152, 126], [164, 118], [182, 98], [206, 104], [236, 122], [262, 132], [292, 134], [318, 139], [334, 142], [W + 12, 142]];
  const offs = [8, 16, 25].map((o) => smooth(prof.map(([x, y]) => [x, y + o] as Pt)));
  const y = (x: number) => {
    for (let i = 0; i < prof.length - 1; i++) if (x >= prof[i][0] && x <= prof[i + 1][0]) return prof[i][1] + ((prof[i + 1][1] - prof[i][1]) * (x - prof[i][0])) / (prof[i + 1][0] - prof[i][0]);
    return 140;
  };
  const stations = [96, 152, 266, 318].map((x) => [x, y(x)] as Pt);
  const arcs = stations.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = stations[i + 1];
    return `M${n(x0)} ${n(y0 - 18)}Q${n((x0 + x1) / 2)} ${n(Math.min(y0, y1) - 56)} ${n(x1)} ${n(y1 - 18)}`;
  });
  return (
    <>
      <path d={[64, 84, 104, 124, 144].map((v) => `M-10 ${v}H${W + 10}`).join("")} stroke="var(--border)" strokeWidth={0.7} />
      <path d={`M70 50V160M70 160H${W + 10}` + [60, 80, 100, 120, 140].map((v) => `M67 ${v}h3`).join("") + Array.from({ length: 14 }, (_, i) => `M${70 + i * 24} 160v3`).join("")} stroke="var(--border-strong)" strokeWidth={0.8} fill="none" />
      <path d={`${smooth(prof)}L${W + 12} ${H + 8}L-12 ${H + 8}Z`} fill={`url(#${id}-sand)`} fillOpacity={0.24} />
      <path d={offs.join("")} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.4} strokeWidth={0.7} strokeDasharray="2 3" />
      <path d={`M334 142H${W + 12}V${H + 8}H334Z`} fill={`url(#${id}-water)`} />
      <path d={smooth(prof)} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={conifers(sample(y, 6, 20, 120).map(([x, v]) => [x, v + 2] as Pt), 8, 0.4, 111)} fill="var(--brand-green)" fillOpacity={0.4} />
      <path d={crowns(sample(y, 9, 178, 236).map(([x, v]) => [x, v + 1.5] as Pt), 3.4, 112)} fill="var(--brand-green)" fillOpacity={0.35} />
      {arcs.map((d, i) => (
        <Flow key={i} d={d} color="var(--brand-orange)" opacity={0.6} dash="3 12" duration={9} delay={i * 3} />
      ))}
      {stations.map(([x, v], i) => (
        <g key={i}>
          <path d={`M${n(x)} ${n(v)}V160`} stroke="var(--brand-navy)" strokeOpacity={0.3} strokeWidth={0.7} strokeDasharray="2 2" />
          <Tower x={x} y={v} h={18} />
        </g>
      ))}
    </>
  );
}

/* Platforms: a socio-ecological landscape mosaic in plan, with the platform boundary and monitoring sites. */
function Platforms({ id }: Art) {
  const patches = [
    { d: blob(96, 70, 52, 30, 121, 0.2), kind: "forest" },
    { d: blob(214, 64, 58, 24, 122, 0.18), kind: "field" },
    { d: blob(326, 78, 52, 30, 123, 0.2), kind: "pasture" },
    { d: blob(120, 138, 56, 26, 124, 0.2), kind: "field2" },
    { d: blob(236, 132, 40, 22, 125, 0.22), kind: "wet" },
    { d: blob(330, 146, 48, 22, 126, 0.2), kind: "forest" },
  ] as const;
  const fill = { forest: ["var(--brand-green)", 0.14], field: ["var(--brand-sand)", 0.16], field2: ["var(--brand-sand)", 0.1], pasture: ["var(--brand-green)", 0.07], wet: ["var(--brand-teal)", 0.12] } as const;
  const clip = (k: string) => patches.filter((p) => p.kind === k || (k === "field" && p.kind === "field2")).map((p) => p.d).join("");
  const river = smooth([[-12, 112], [40, 104], [92, 112], [150, 102], [196, 108], [236, 128], [276, 112], [320, 116], [W + 12, 104]]);
  const road = smooth([[60, H + 8], [96, 150], [150, 104], [206, 96], [262, 94], [330, 40], [350, -8]]);
  const lake = blob(238, 133, 14, 7, 127, 0.2);
  const village: Pt[] = scatter(128, 16, 180, 216, 98, 116);
  const sites: Pt[] = [[100, 72], [212, 66], [318, 80], [126, 136], [258, 128], [326, 146]];
  return (
    <>
      {patches.map((p, i) => (
        <path key={i} d={p.d} fill={fill[p.kind][0]} fillOpacity={fill[p.kind][1]} stroke="var(--border-strong)" strokeWidth={0.7} />
      ))}
      <clipPath id={`${id}-fields`}>
        <path d={clip("field")} />
      </clipPath>
      <path d={Array.from({ length: 70 }, (_, i) => `M${-60 + i * 7} 20l50 150`).join("")} clipPath={`url(#${id}-fields)`} stroke="var(--brand-sand)" strokeOpacity={0.45} strokeWidth={0.6} />
      <clipPath id={`${id}-forest`}>
        <path d={clip("forest")} />
      </clipPath>
      <path d={crowns(scatter(129, 160, -10, W + 10, 20, 190), 2.4, 130)} clipPath={`url(#${id}-forest)`} fill="var(--brand-green)" fillOpacity={0.4} />
      <clipPath id={`${id}-pasture`}>
        <path d={clip("pasture")} />
      </clipPath>
      <path d={grass(260, W + 10, (x) => 50 + ((x * 7) % 60), 60, 4, 131)} clipPath={`url(#${id}-pasture)`} fill="none" stroke="var(--brand-green)" strokeOpacity={0.5} strokeWidth={0.7} />
      <path d={lake} fill="var(--brand-teal)" fillOpacity={0.22} stroke="var(--brand-teal)" strokeOpacity={0.5} strokeWidth={0.8} />
      <path d={river} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.55} strokeWidth={2.2} strokeLinecap="round" />
      <Flow d={river} color="var(--surface)" opacity={0.9} dash="4 26" duration={18} />
      <path d={road} fill="none" stroke="var(--border-strong)" strokeWidth={2.6} />
      <path d={road} fill="none" stroke="var(--surface)" strokeWidth={1.1} />
      <path d={village.map(([x, y]) => `M${n(x - 1.4)} ${n(y - 1.4)}h2.8v2.8h-2.8Z`).join("")} fill="var(--brand-navy)" fillOpacity={0.5} />
      <path d={blob(206, 102, 148, 66, 132, 0.08, 32)} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.6} strokeWidth={1} strokeDasharray="6 4" />
      {sites.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5.5} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.45} className="scene-breathe" style={{ animationDelay: `${-i * 1.5}s` }} />
          <path d={`M${x} ${y - 2.6}L${x + 2.6} ${y}L${x} ${y + 2.6}L${x - 2.6} ${y}Z`} fill="var(--brand-orange)" fillOpacity={0.8} />
        </g>
      ))}
    </>
  );
}

/* Data: a satellite passing over a vegetation-index raster seen at an angle. */
function Data({ id }: Art) {
  const rows = 9, cols = 26;
  const yAt = (r: number) => 104 + 100 * (r / rows) ** 1.35;
  const xAt = (c: number, r: number) => 200 + (c * (W + 40) / cols - (W + 40) / 2) * (0.5 + 0.5 * (r / rows));
  const tones = ["var(--brand-teal)", "var(--brand-sand)", "var(--brand-green)"];
  const cells: { d: string; tone: number; o: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const v = Math.sin(c * 0.45 + r * 0.3) * 0.5 + Math.sin(c * 0.17 - r * 0.6 + 1.2) * 0.35 + Math.sin(c * 0.9 + r * 1.1) * 0.15;
      const tone = v < -0.35 ? 0 : v < 0.05 ? 1 : 2;
      cells.push({ d: poly([[xAt(c, r), yAt(r)], [xAt(c + 1, r), yAt(r)], [xAt(c + 1, r + 1), yAt(r + 1)], [xAt(c, r + 1), yAt(r + 1)]], true), tone, o: 0.1 + Math.abs(v) * 0.32 });
    }
  return (
    <>
      <Glow id={id} x={200} y={60} rx={170} ry={60} />
      {cells.map((c, i) => (
        <path key={i} d={c.d} fill={tones[c.tone]} fillOpacity={c.o} stroke="var(--surface)" strokeOpacity={0.6} strokeWidth={0.5} />
      ))}
      <path d={`M-20 70Q200 22 420 70`} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.25} strokeWidth={0.8} strokeDasharray="2 4" />
      <path d={`M-20 92Q200 50 420 92`} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.12} strokeWidth={0.8} strokeDasharray="2 6" />
      <Drift duration={44} distance={26}>
        <path d={cloud(78, 86, 70, 8)} fill="var(--scene-mist)" fillOpacity={0.92} stroke="var(--border-strong)" strokeWidth={0.6} />
        <ellipse cx={120} cy={150} rx={34} ry={7} fill="var(--brand-navy)" fillOpacity={0.12} />
      </Drift>
      <Drift duration={56} delay={18} distance={20}>
        <path d={cloud(272, 76, 54, 6)} fill="var(--scene-mist)" fillOpacity={0.9} stroke="var(--border-strong)" strokeWidth={0.6} />
        <ellipse cx={306} cy={128} rx={24} ry={4.5} fill="var(--brand-navy)" fillOpacity={0.1} />
      </Drift>
      <g stroke="var(--brand-navy)" strokeOpacity={0.55} strokeWidth={0.9} strokeLinecap="round" fill="none">
        <path d="M337 108L344 98L351 108M344 98V93" />
        <path d="M334 94A11 4.6 -38 0 0 354 79Z" fill="var(--surface)" />
        <path d="M344 87L350 80" strokeOpacity={0.4} />
        <path d="M355 76Q360 74 361 69M358 80Q365 77 366 70" strokeOpacity={0.35} className="scene-breathe" />
      </g>
      <g className="scene-pass" style={{ animationDuration: "30s" }}>
        <path d="M200 52L170 106L232 106Z" fill="var(--brand-teal)" fillOpacity={0.1} />
        <path d="M164 104H238L246 116H156Z" fill="var(--brand-teal)" fillOpacity={0.2} stroke="var(--brand-teal)" strokeOpacity={0.55} strokeWidth={0.8} />
        <g transform="translate(200 46)" stroke="var(--brand-navy)" strokeOpacity={0.6} strokeWidth={0.8} strokeLinejoin="round">
          <rect x={-3.5} y={-3} width={7} height={6} fill="var(--surface)" />
          <path d="M-4 0H-7M4 0H7" />
          <rect x={-17} y={-2.6} width={10} height={5.2} fill="var(--brand-teal)" fillOpacity={0.35} />
          <rect x={7} y={-2.6} width={10} height={5.2} fill="var(--brand-teal)" fillOpacity={0.35} />
          <path d="M0 3V6" />
        </g>
      </g>
    </>
  );
}

/* API: the measuring stations and the satellite feed one service, which answers with structured data. */
function Api({ id: _id }: Art) {
  const src: Pt[] = [[94, 64], [94, 100], [94, 136]];
  const hub = { x: 172, y: 72, w: 56, h: 56 };
  return (
    <>
      <BlueprintGrid />
      <path d="M-10 64H70M-10 136H70M330 80H410M330 120H410" stroke="var(--brand-teal)" strokeOpacity={0.2} strokeWidth={0.8} strokeDasharray="2 4" />
      {src.map(([x, y], i) => (
        <Flow key={i} d={`M${x + 11} ${y}C${x + 44} ${y} ${hub.x - 30} 100 ${hub.x} 100`} dash="6 24" duration={10} delay={i * 3} opacity={0.65} track />
      ))}
      <Flow d={`M${hub.x + hub.w} 100C${hub.x + hub.w + 22} 100 244 100 262 100`} color="var(--brand-orange)" dash="6 24" duration={8} opacity={0.7} track />
      {src.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={11} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
          {i === 0 ? <path d={`M${x - 3} ${y + 6}L${x} ${y - 6}L${x + 3} ${y + 6}M${x - 2} ${y + 2}H${x + 2}M${x} ${y - 6}H${x + 4}`} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.6} strokeWidth={0.9} strokeLinejoin="round" /> : null}
          {i === 1 ? <g stroke="var(--brand-navy)" strokeOpacity={0.6} strokeWidth={0.8}><rect x={x - 2} y={y - 2} width={4} height={4} fill="none" /><rect x={x - 8} y={y - 1.6} width={5} height={3.2} fill="var(--brand-teal)" fillOpacity={0.4} /><rect x={x + 3} y={y - 1.6} width={5} height={3.2} fill="var(--brand-teal)" fillOpacity={0.4} /></g> : null}
          {i === 2 ? <path d={`M${x - 5} ${y + 5}C${x - 5} ${y - 4} ${x + 2} ${y - 6} ${x + 6} ${y - 6}C${x + 6} ${y + 2} ${x + 1} ${y + 5} ${x - 5} ${y + 5}ZM${x - 5} ${y + 5}L${x + 3} ${y - 3}`} fill="var(--brand-green)" fillOpacity={0.3} stroke="var(--brand-green)" strokeOpacity={0.7} strokeWidth={0.8} /> : null}
        </g>
      ))}
      <rect x={hub.x} y={hub.y} width={hub.w} height={hub.h} rx={10} fill="var(--surface)" stroke="var(--brand-teal)" strokeOpacity={0.6} strokeWidth={1} />
      <path d={`M${hub.x + 22} 88C${hub.x + 17} 88 ${hub.x + 19} 100 ${hub.x + 14} 100C${hub.x + 19} 100 ${hub.x + 17} 112 ${hub.x + 22} 112M${hub.x + 34} 88C${hub.x + 39} 88 ${hub.x + 37} 100 ${hub.x + 42} 100C${hub.x + 37} 100 ${hub.x + 39} 112 ${hub.x + 34} 112`} fill="none" stroke="var(--brand-teal)" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={hub.x + hub.w - 8} cy={hub.y + 8} r={2.2} fill="var(--brand-green)" className="scene-breathe" />
      <g>
        <rect x={262} y={56} width={68} height={88} rx={7} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
        {[
          [0, 16, 22, "navy"], [1, 22, 18, "teal"], [1, 22, 26, "orange"], [1, 22, 14, "green"], [2, 28, 20, "teal"], [2, 28, 16, "sand"], [1, 22, 20, "navy"],
        ].map(([indent, x, w, c], i) => (
          <g key={i}>
            <rect x={262 + Number(x) - 6 + Number(indent) * 2} y={66 + i * 7.4} width={10} height={2.8} rx={1} fill="var(--brand-navy)" fillOpacity={0.3} />
            <rect x={262 + Number(x) + 6 + Number(indent) * 2} y={66 + i * 7.4} width={Number(w)} height={2.8} rx={1} fill={`var(--brand-${c})`} fillOpacity={0.6} />
          </g>
        ))}
        <path d="M270 136L280 128L290 131L300 121L310 125L322 116" fill="none" stroke="var(--brand-teal)" strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M270 138H322" stroke="var(--border-strong)" strokeWidth={0.7} />
      </g>
    </>
  );
}

/* Documentation: an open field notebook with a pressed leaf, a measurement table and a pencil. */
function Docs({ id: _id }: Art) {
  const leaf = "M138 64C120 74 112 96 120 118C124 128 132 134 140 136C150 124 158 108 156 90C154 78 148 70 138 64Z";
  const veins = "M140 136C140 112 140 88 138 64M139 120L126 110M139 108L124 96M139 96L127 84M139 112L152 102M139 98L154 88M139 86L150 76M140 136L141 148";
  const rowsY = [62, 72, 82, 92, 102, 112];
  const r = rng(141);
  return (
    <>
      <path d="M86 52Q143 46 200 54L200 152Q143 144 86 150Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
      <path d="M200 54Q257 46 314 52L314 150Q257 144 200 152Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
      <path d="M200 54V152" stroke="var(--border-strong)" strokeWidth={1.2} />
      <path d="M194 56Q197 104 194 150M206 56Q203 104 206 150" stroke="var(--border)" strokeWidth={2} fill="none" />
      <path d={Array.from({ length: 9 }, (_, i) => `M94 ${62 + i * 10}Q143 ${57 + i * 10} 192 ${63 + i * 10}`).join("")} stroke="var(--brand-teal)" strokeOpacity={0.14} strokeWidth={0.6} fill="none" />
      <path d={leaf} fill="var(--brand-green)" fillOpacity={0.2} stroke="var(--brand-green)" strokeOpacity={0.7} strokeWidth={1} />
      <path d={veins} fill="none" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={0.7} strokeLinecap="round" />
      <path d="M118 76L104 70M156 120L172 126" stroke="var(--brand-navy)" strokeOpacity={0.35} strokeWidth={0.6} />
      <rect x={96} y={66} width={10} height={2.4} rx={1} fill="var(--brand-navy)" fillOpacity={0.3} />
      <rect x={168} y={128} width={16} height={2.4} rx={1} fill="var(--brand-navy)" fillOpacity={0.3} />
      <rect x={96} y={140} width={34} height={2.6} rx={1} fill="var(--brand-orange)" fillOpacity={0.45} />
      <g>
        <path d={rowsY.map((y) => `M212 ${y}H304`).join("") + "M238 58V116M270 58V116"} stroke="var(--border-strong)" strokeWidth={0.6} />
        {rowsY.slice(1).map((y, i) => (
          <g key={y}>
            <rect x={214} y={y - 6.4} width={14 + r() * 8} height={2.4} rx={1} fill="var(--brand-navy)" fillOpacity={0.28} />
            <rect x={242} y={y - 6.4} width={8 + r() * 18} height={2.4} rx={1} fill="var(--brand-teal)" fillOpacity={0.55} />
            <rect x={274} y={y - 6.4} width={6 + r() * 20} height={2.4} rx={1} fill={i % 2 ? "var(--brand-sand)" : "var(--brand-green)"} fillOpacity={0.55} />
          </g>
        ))}
        <rect x={210} y={63} width={96} height={9} fill="var(--brand-sand)" fillOpacity={0.2} className="scene-scan" />
        <path d="M214 140L230 132L244 136L258 124L274 128L290 118L304 121" fill="none" stroke="var(--brand-teal)" strokeWidth={1.1} strokeLinejoin="round" />
        <path d={dots([[230, 132], [258, 124], [290, 118]], 1.4)} fill="var(--brand-teal)" />
        <path d="M212 144H306" stroke="var(--border-strong)" strokeWidth={0.6} />
      </g>
      <path d="M284 52V74L289 69L294 74V52" fill="var(--brand-orange)" fillOpacity={0.55} />
      <g className="scene-bob" style={{ animationDuration: "7s" }}>
        <g transform="rotate(-24 330 148)">
          <rect x={286} y={145} width={48} height={6} rx={1} fill="var(--brand-sand)" fillOpacity={0.55} stroke="var(--brand-navy)" strokeOpacity={0.4} strokeWidth={0.7} />
          <path d="M334 145L344 148L334 151Z" fill="var(--surface)" stroke="var(--brand-navy)" strokeOpacity={0.4} strokeWidth={0.7} />
          <path d="M341 147.1L344 148L341 148.9Z" fill="var(--brand-navy)" fillOpacity={0.6} />
          <rect x={282} y={145} width={5} height={6} rx={1} fill="var(--brand-orange)" fillOpacity={0.5} />
        </g>
      </g>
    </>
  );
}

/* Services: storage, compute and the virtual laboratory of the Sinaia data centre. */
function Services({ id }: Art) {
  const hills = ridge(151, 170, [{ x: 60, h: 60, w: 90 }, { x: 330, h: 70, w: 100 }, { x: 200, h: 30, w: 80 }], 2);
  const leds = Array.from({ length: 6 }, (_, i) => i);
  return (
    <>
      <path d={under(sample(hills, 4), H + 6, false)} fill={`url(#${id}-navy)`} fillOpacity={0.08} />
      <path d={poly(sample(hills, 4))} fill="none" stroke="var(--brand-navy)" strokeOpacity={0.16} strokeWidth={0.8} />
      <Flow d="M118 92C140 92 150 100 176 100" dash="6 24" duration={9} opacity={0.65} track />
      <Flow d="M224 100C238 100 246 100 258 100" color="var(--brand-orange)" dash="6 24" duration={9} delay={4} opacity={0.7} track />
      <g stroke="var(--brand-teal)" strokeOpacity={0.6} strokeWidth={0.9}>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 15})`}>
            <path d="M80 76V86C80 90 118 90 118 86V76" fill="var(--brand-teal)" fillOpacity={0.12} />
            <ellipse cx={99} cy={76} rx={19} ry={4} fill="var(--surface)" />
          </g>
        ))}
        <path d="M80 106V116C80 120 118 120 118 116V106" fill="var(--brand-teal)" fillOpacity={0.12} />
      </g>
      <rect x={176} y={58} width={48} height={90} rx={4} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
      {leds.map((i) => (
        <g key={i}>
          <rect x={181} y={64 + i * 13.6} width={38} height={10} rx={1.5} fill="var(--brand-navy)" fillOpacity={0.06} stroke="var(--border-strong)" strokeWidth={0.6} />
          <path d={`M197 ${67 + i * 13.6}h17M197 ${71 + i * 13.6}h12`} stroke="var(--border-strong)" strokeWidth={0.8} />
          <circle cx={186} cy={69 + i * 13.6} r={1.5} fill={i % 3 === 1 ? "var(--brand-orange)" : "var(--brand-green)"} className="scene-blink" style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${3.4 + (i % 3) * 1.1}s` }} />
          <circle cx={191} cy={69 + i * 13.6} r={1.5} fill="var(--brand-teal)" fillOpacity={0.6} />
        </g>
      ))}
      <rect x={258} y={64} width={74} height={72} rx={6} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
      <path d="M258 74H332" stroke="var(--border-strong)" strokeWidth={0.7} />
      <path d={dots([[264, 69], [269, 69], [274, 69]], 1.3)} fill="var(--brand-navy)" fillOpacity={0.35} />
      <rect x={264} y={80} width={28} height={2.4} rx={1} fill="var(--brand-teal)" fillOpacity={0.55} />
      <rect x={264} y={85} width={20} height={2.4} rx={1} fill="var(--brand-navy)" fillOpacity={0.3} />
      <path d="M266 128L326 98" stroke="var(--brand-orange)" strokeOpacity={0.6} strokeWidth={0.9} />
      <path d={dots(scatter(152, 18, 268, 324, 96, 130, (x, y) => Math.abs(y - (128 - (x - 266) * 0.5)) < 8), 1.2)} fill="var(--brand-teal)" fillOpacity={0.7} />
      <path d="M264 132H328M264 92V132" stroke="var(--border-strong)" strokeWidth={0.6} />
    </>
  );
}

/* Network: research infrastructures across Europe linked to the Romanian node, over a curved graticule. */
function Network({ id: _id }: Art) {
  const meridians = [-80, -40, 0, 40, 80, 120].map((k) => `M${200 + k * 1.6} -10Q${200 + k * 1.1} 100 ${200 + k * 1.6} ${H + 10}`).join("");
  const parallels = [40, 80, 120, 160].map((y) => `M-10 ${y + 14}Q200 ${y - 16} ${W + 10} ${y + 14}`).join("");
  const home: Pt = [226, 112];
  const nodes: Pt[] = [[112, 66], [148, 92], [176, 56], [96, 120], [262, 62], [306, 88], [298, 136], [160, 140], [242, 154], [338, 58], [70, 86], [356, 118], [196, 84]];
  const lines = nodes.map(([x, y]) => `M${home[0]} ${home[1]}Q${n((x + home[0]) / 2)} ${n(Math.min(y, home[1]) - 18)} ${x} ${y}`);
  const side = [[0, 2], [1, 3], [4, 9], [5, 11], [7, 8], [0, 10], [2, 12]].map(([a, b]) => `M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`).join("");
  return (
    <>
      <path d={meridians + parallels} fill="none" stroke="var(--border-strong)" strokeWidth={0.7} />
      <path d={side} stroke="var(--brand-teal)" strokeOpacity={0.25} strokeWidth={0.7} strokeDasharray="2 3" />
      {lines.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.3} strokeWidth={0.8} />
          <Flow d={d} color="var(--brand-teal)" opacity={0.8} dash="3 27" duration={12 + (i % 4) * 3} delay={i * 1.9} />
        </g>
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i % 3 === 0 ? 5 : 3.8} fill="var(--surface)" stroke={i % 2 ? "var(--brand-green)" : "var(--brand-navy)"} strokeOpacity={0.6} strokeWidth={0.9} />
          <circle cx={x} cy={y} r={1.5} fill={i % 2 ? "var(--brand-green)" : "var(--brand-navy)"} fillOpacity={0.7} />
        </g>
      ))}
      <circle cx={home[0]} cy={home[1]} r={12} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.4} className="scene-breathe" />
      <circle cx={home[0]} cy={home[1]} r={6.5} fill="var(--surface)" stroke="var(--brand-orange)" strokeWidth={1.2} />
      <circle cx={home[0]} cy={home[1]} r={2.6} fill="var(--brand-orange)" />
    </>
  );
}

/* Projects: a timeline of European projects as bars, with milestones and the current year. */
function Projects({ id }: Art) {
  const bars = [
    { x: 84, w: 132, y: 58, c: "green", m: [150, 200] },
    { x: 128, w: 156, y: 76, c: "teal", m: [190, 250] },
    { x: 104, w: 92, y: 94, c: "sand", m: [160] },
    { x: 176, w: 140, y: 112, c: "orange", m: [230, 290] },
    { x: 212, w: 118, y: 130, c: "navy", m: [270] },
  ];
  const now = 262;
  const clip = bars.map((b) => `M${b.x} ${b.y}h${b.w}v8h-${b.w}Z`).join("");
  return (
    <>
      <path d={Array.from({ length: 11 }, (_, i) => `M${62 + i * 28} 48V146`).join("")} stroke="var(--border)" strokeWidth={0.7} />
      <path d={`M40 150H${W - 30}` + Array.from({ length: 11 }, (_, i) => `M${62 + i * 28} 150v4`).join("") + Array.from({ length: 30 }, (_, i) => `M${62 + i * 9.33} 150v2`).join("")} stroke="var(--border-strong)" strokeWidth={0.8} />
      <path d="M216 62H228V80M284 80H292V116M196 98H204V116" fill="none" stroke="var(--border-strong)" strokeWidth={0.8} strokeDasharray="2 2" />
      {bars.map((b) => (
        <g key={b.y}>
          <rect x={b.x} y={b.y} width={b.w} height={8} rx={2} fill={`var(--brand-${b.c})`} fillOpacity={0.28} stroke={`var(--brand-${b.c})`} strokeOpacity={0.65} strokeWidth={0.9} />
          <rect x={b.x} y={b.y} width={Math.max(0, Math.min(b.w, now - b.x))} height={8} rx={2} fill={`var(--brand-${b.c})`} fillOpacity={0.3} />
          {b.m.map((mx) => (
            <path key={mx} d={`M${mx} ${b.y + 0.6}L${mx + 3.4} ${b.y + 4}L${mx} ${b.y + 7.4}L${mx - 3.4} ${b.y + 4}Z`} fill="var(--surface)" stroke={`var(--brand-${b.c})`} strokeWidth={0.9} />
          ))}
        </g>
      ))}
      <clipPath id={`${id}-bars`}>
        <path d={clip} />
      </clipPath>
      <g clipPath={`url(#${id}-bars)`}>
        <rect x={60} y={40} width={26} height={110} fill="var(--surface)" fillOpacity={0.5} className="scene-sweep" style={{ animationDuration: "16s" }} />
      </g>
      <path d={`M${now} 46V150`} stroke="var(--brand-orange)" strokeOpacity={0.7} strokeWidth={1} strokeDasharray="3 3" />
      <path d={`M${now - 4} 44H${now + 4}L${now} 49Z`} fill="var(--brand-orange)" />
    </>
  );
}

/* FAQ: a question, a typed answer and the dots of a reply on the way. */
function Faq({ id: _id }: Art) {
  return (
    <>
      <path d="M40 120Q120 160 200 140T360 150" fill="none" stroke="var(--border-strong)" strokeWidth={0.8} strokeDasharray="2 4" />
      <g className="scene-bob" style={{ animationDuration: "9s" }}>
        <path d="M104 56H190Q200 56 200 66V104Q200 114 190 114H122L108 126L110 114H104Q94 114 94 104V66Q94 56 104 56Z" fill="var(--surface)" stroke="var(--brand-teal)" strokeOpacity={0.6} strokeWidth={1} />
        <path d="M138 78C138 70 156 69 156 78C156 84 147 85 147 92" fill="none" stroke="var(--brand-teal)" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={147} cy={100} r={1.8} fill="var(--brand-teal)" />
      </g>
      <g className="scene-bob" style={{ animationDuration: "11s", animationDelay: "-4s" }}>
        <path d="M200 96H302Q312 96 312 106V138Q312 148 302 148H296L298 160L284 148H200Q190 148 190 138V106Q190 96 200 96Z" fill="var(--surface)" stroke="var(--brand-green)" strokeOpacity={0.6} strokeWidth={1} />
        <rect x={204} y={108} width={70} height={3} rx={1.2} fill="var(--brand-navy)" fillOpacity={0.32} />
        <rect x={204} y={117} width={86} height={3} rx={1.2} fill="var(--brand-navy)" fillOpacity={0.22} />
        <rect x={204} y={126} width={56} height={3} rx={1.2} fill="var(--brand-navy)" fillOpacity={0.22} />
        <path d="M282 132L288 138L300 124" fill="none" stroke="var(--brand-green)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="scene-bob" style={{ animationDuration: "8s", animationDelay: "-2s" }}>
        <path d="M262 52H318Q326 52 326 60V74Q326 82 318 82H270Q262 82 262 74V60Q262 52 270 52Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.9} />
        {[282, 294, 306].map((x, i) => (
          <circle key={x} cx={x} cy={67} r={2.4} fill="var(--brand-navy)" fillOpacity={0.5} className="scene-blink" style={{ animationDuration: "2.4s", animationDelay: `${i * 0.4}s` }} />
        ))}
      </g>
    </>
  );
}

/* Contact: a town map with the river, streets, a park and the station pinned. */
function Contact({ id: _id }: Art) {
  const river = smooth([[-12, 150], [60, 140], [130, 150], [210, 162], [290, 150], [W + 12, 160]]);
  const roads = [
    smooth([[-12, 96], [80, 92], [160, 100], [240, 92], [320, 98], [W + 12, 90]]),
    smooth([[120, -10], [128, 60], [150, 120], [146, H + 10]]),
    smooth([[262, -10], [252, 70], [266, 130], [282, H + 10]]),
    smooth([[160, 100], [206, 76], [252, 70]]),
  ];
  const r = rng(171);
  const blocks: string[] = [];
  for (let gx = -10; gx < W + 10; gx += 15)
    for (let gy = 40; gy < 180; gy += 13) {
      const x = gx + r() * 3, y = gy + r() * 3;
      const onRoad = Math.abs(y - 95) < 9 || Math.abs(x - 132 - (y - 60) * 0.18) < 10 || Math.abs(x - 258) < 10 || y > 132 || (x > 180 && x < 240 && y > 100 && y < 132);
      if (!onRoad && r() > 0.18) blocks.push(`M${n(x)} ${n(y)}h${n(8 + r() * 4)}v${n(6 + r() * 3)}h${n(-(8 + r() * 4))}Z`);
    }
  const pin: Pt = [206, 104];
  const route = smooth([[40, 170], [70, 128], [100, 100], [140, 96], [180, 108], [pin[0], pin[1] + 10]]);
  return (
    <>
      <path d={blocks.join("")} fill="var(--brand-navy)" fillOpacity={0.07} stroke="var(--brand-navy)" strokeOpacity={0.16} strokeWidth={0.6} />
      <path d={blob(210, 118, 26, 11, 172, 0.2)} fill="var(--brand-green)" fillOpacity={0.14} />
      <path d={crowns(scatter(173, 16, 188, 232, 110, 128), 2.6, 174)} fill="var(--brand-green)" fillOpacity={0.4} />
      <path d={river} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.4} strokeWidth={7} />
      <Flow d={river} color="var(--surface)" opacity={0.9} dash="4 26" duration={20} />
      {roads.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="var(--border-strong)" strokeWidth={i === 3 ? 3.4 : 4.6} />
          <path d={d} fill="none" stroke="var(--surface)" strokeWidth={i === 3 ? 1.8 : 2.8} />
        </g>
      ))}
      <Flow d={route} color="var(--brand-orange)" opacity={0.8} width={1.4} dash="3 3" duration={8} />
      <ellipse cx={pin[0]} cy={pin[1] + 10} rx={12} ry={4.2} fill="none" stroke="var(--brand-orange)" strokeOpacity={0.5} className="scene-ripple" />
      <path d={`M${pin[0]} ${pin[1] + 10}C${pin[0] - 3} ${pin[1] + 2} ${pin[0] - 9} ${pin[1] - 2} ${pin[0] - 9} ${pin[1] - 9}A9 9 0 1 1 ${pin[0] + 9} ${pin[1] - 9}C${pin[0] + 9} ${pin[1] - 2} ${pin[0] + 3} ${pin[1] + 2} ${pin[0]} ${pin[1] + 10}Z`} fill="var(--brand-orange)" fillOpacity={0.9} />
      <circle cx={pin[0]} cy={pin[1] - 9} r={3.4} fill="var(--surface)" />
      <g transform="translate(310 62)">
        <circle r={10} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={0.8} />
        <path d="M0 -8L2.6 0L0 -1.6L-2.6 0Z" fill="var(--brand-orange)" fillOpacity={0.85} />
        <path d="M0 8L2.6 0L0 1.6L-2.6 0Z" fill="var(--brand-navy)" fillOpacity={0.4} />
      </g>
    </>
  );
}

/* Not found: a compass looking for the way, over contour lines, with a trail that wandered off. */
function NotFound({ id: _id }: Art) {
  const rings = [0, 1, 2, 3, 4, 5].map((i) => blob(200 + i * 3, 100 - i, 190 - i * 28, 80 - i * 12, 181 + i, 0.14, 32));
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const t = (i / 36) * Math.PI * 2, long = i % 9 === 0;
    return `M${n(200 + Math.cos(t) * 30)} ${n(100 + Math.sin(t) * 30)}L${n(200 + Math.cos(t) * (long ? 24 : 27))} ${n(100 + Math.sin(t) * (long ? 24 : 27))}`;
  }).join("");
  return (
    <>
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--brand-sand)" strokeOpacity={0.4} strokeWidth={0.7} />
      ))}
      <Flow d="M60 160C90 150 96 120 128 126S150 160 166 132" color="var(--brand-orange)" opacity={0.7} width={1.2} dash="3 3" duration={10} />
      <path d="M296 62l8 8m0 -8l-8 8" stroke="var(--brand-orange)" strokeOpacity={0.7} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={200} cy={100} r={34} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth={1} />
      <circle cx={200} cy={100} r={30} fill="none" stroke="var(--brand-teal)" strokeOpacity={0.4} strokeWidth={0.8} />
      <path d={ticks} stroke="var(--brand-navy)" strokeOpacity={0.45} strokeWidth={0.8} />
      <g className="scene-swing" style={{ transformOrigin: "200px 100px", transformBox: "view-box" }}>
        <path d="M200 76L206 100H194Z" fill="var(--brand-orange)" fillOpacity={0.9} />
        <path d="M200 124L206 100H194Z" fill="var(--brand-navy)" fillOpacity={0.45} />
      </g>
      <circle cx={200} cy={100} r={2.6} fill="var(--surface)" stroke="var(--brand-navy)" strokeOpacity={0.6} strokeWidth={0.8} />
    </>
  );
}

export function TopicArt({ topic, id }: { topic: Topic; id: string }) {
  switch (topic) {
    case "about": return <About id={id} />;
    case "infrastructure": return <Infrastructure id={id} />;
    case "platforms": return <Platforms id={id} />;
    case "data": return <Data id={id} />;
    case "api": return <Api id={id} />;
    case "docs": return <Docs id={id} />;
    case "services": return <Services id={id} />;
    case "network": return <Network id={id} />;
    case "projects": return <Projects id={id} />;
    case "faq": return <Faq id={id} />;
    case "contact": return <Contact id={id} />;
    case "not-found": return <NotFound id={id} />;
  }
}

