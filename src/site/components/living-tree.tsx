// Animated tree for the home page hero (ported from v0). Purely decorative, so it is hidden from
// screen readers. The canopy runs through the four seasons in one slow CSS cycle (.season-leaf in
// src/index.css), which also works before hydration; with reduced motion it stays in summer.
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const branches = [
  "M280 278 C250 259 231 235 208 206",
  "M276 244 C248 224 230 199 220 171",
  "M279 216 C249 201 231 181 218 151",
  "M282 274 C311 256 334 232 354 204",
  "M282 240 C311 219 332 194 340 164",
  "M281 211 C308 192 328 169 337 141",
  "M268 186 C265 163 269 141 279 119",
  "M296 190 C306 169 309 150 306 132",
];

const roots = [
  "M279 359 C250 375 228 391 191 404",
  "M281 359 C311 374 338 390 374 401",
  "M277 364 C255 385 250 404 246 425",
  "M284 364 C300 386 303 405 307 424",
  "M274 366 C231 376 212 382 178 382",
  "M286 366 C327 377 350 381 390 381",
];

// Tone "a" leans green, tone "b" leans teal in summer and orange in autumn.
const canopy = [
  { cx: 279, cy: 116, rx: 50, ry: 42, tone: "a", opacity: 0.26, delay: 0.16 },
  { cx: 230, cy: 151, rx: 54, ry: 40, tone: "b", opacity: 0.22, delay: 0.24 },
  { cx: 326, cy: 148, rx: 54, ry: 42, tone: "a", opacity: 0.24, delay: 0.3 },
  { cx: 185, cy: 191, rx: 43, ry: 34, tone: "a", opacity: 0.21, delay: 0.38 },
  { cx: 372, cy: 190, rx: 44, ry: 35, tone: "b", opacity: 0.21, delay: 0.42 },
  { cx: 235, cy: 199, rx: 49, ry: 36, tone: "a", opacity: 0.23, delay: 0.48 },
  { cx: 326, cy: 197, rx: 50, ry: 38, tone: "a", opacity: 0.23, delay: 0.52 },
  { cx: 280, cy: 174, rx: 62, ry: 47, tone: "b", opacity: 0.15, delay: 0.58 },
] as const;

// Outer clusters change colour first, the centre of the crown last.
const leafStyle = (c: (typeof canopy)[number]) => {
  const shift = (Math.hypot(c.cx - 280, c.cy - 174) / 100) * 4;
  return {
    "--leaf-spring": `var(--season-spring-${c.tone})`,
    "--leaf-summer": `var(--season-summer-${c.tone})`,
    "--leaf-autumn": `var(--season-autumn-${c.tone})`,
    "--leaf-winter": `var(--season-winter-${c.tone})`,
    "--leaf-o": c.opacity,
    "--leaf-shift": `-${shift.toFixed(2)}s`,
    transformOrigin: `${c.cx}px ${c.cy}px`,
  } as CSSProperties;
};

const observations = [
  { cx: 204, cy: 165, delay: 0.3 },
  { cx: 243, cy: 132, delay: 0.7 },
  { cx: 301, cy: 112, delay: 1.1 },
  { cx: 350, cy: 166, delay: 0.5 },
  { cx: 231, cy: 221, delay: 1.4 },
  { cx: 329, cy: 225, delay: 0.9 },
  { cx: 280, cy: 184, delay: 1.7 },
];

export function LivingTree({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <div
      className={cn("relative isolate overflow-hidden rounded-[14px] border border-border bg-surface-2", className)}
      style={{ background: "radial-gradient(ellipse at 50% 38%, var(--surface) 0%, var(--surface-2) 62%, var(--background) 100%)" }}
    >
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
      <svg viewBox="96 24 368 412" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id="tree-glow">
            <stop offset="0%" stopColor="var(--brand-green)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--brand-green)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tree-trunk" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-sand)" />
            <stop offset="100%" stopColor="var(--brand-green)" />
          </linearGradient>
        </defs>

        <circle cx="280" cy="198" r="205" fill="url(#tree-glow)" />
        <motion.circle
          cx="280"
          cy="203"
          r="172"
          fill="none"
          stroke="var(--accent)"
          strokeDasharray="1 10"
          strokeOpacity="0.24"
          strokeWidth="1.5"
          initial={false}
          animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 48, ease: "linear", repeat: Infinity }}
          style={{ transformOrigin: "280px 203px" }}
        />
        <path d="M72 359 C158 346 212 350 280 358 C353 349 408 346 488 359" fill="none" stroke="var(--border-strong)" strokeWidth="1.2" />
        <path d="M74 363 C164 354 213 357 280 364 C351 356 405 353 486 363" fill="none" stroke="var(--brand-sand)" strokeOpacity="0.28" strokeWidth="1" />

        {roots.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="var(--brand-sand)"
            strokeLinecap="round"
            strokeWidth={index < 2 ? 3 : 1.8}
            strokeOpacity={index < 2 ? 0.72 : 0.46}
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0.25 }}
            animate={{ pathLength: 1, opacity: index < 2 ? 0.72 : 0.46 }}
            transition={{ duration: reduceMotion ? 0 : 1.15, delay: reduceMotion ? 0 : 0.55 + index * 0.08, ease: "easeOut" }}
          />
        ))}

        <motion.path
          d="M280 365 C279 322 282 281 280 239 C278 202 278 165 281 126"
          fill="none"
          stroke="url(#tree-trunk)"
          strokeLinecap="round"
          strokeWidth="13"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.5, ease: "easeInOut" }}
        />
        {branches.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="var(--brand-green)"
            strokeLinecap="round"
            strokeWidth={index < 2 ? 6 : 4.5}
            strokeOpacity="0.76"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.05, delay: reduceMotion ? 0 : 0.34 + index * 0.08, ease: "easeOut" }}
          />
        ))}

        {canopy.map((cluster) => (
          <motion.ellipse
            key={`${cluster.cx}-${cluster.cy}`}
            className="season-leaf"
            cx={cluster.cx}
            cy={cluster.cy}
            rx={cluster.rx}
            ry={cluster.ry}
            stroke="var(--surface)"
            strokeOpacity="0.48"
            strokeWidth="1.2"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.88, y: 7 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, scale: 1, y: [0, -2, 0], rotate: [0, 0.5, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { opacity: { duration: 0.45, delay: cluster.delay }, scale: { duration: 0.6, delay: cluster.delay }, y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: cluster.delay }, rotate: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: cluster.delay } }
            }
            style={leafStyle(cluster)}
          />
        ))}

        {observations.map((point) => (
          <g key={`${point.cx}-${point.cy}`}>
            <circle cx={point.cx} cy={point.cy} r="5" fill="var(--brand-orange)" fillOpacity="0.12" />
            <motion.circle
              cx={point.cx}
              cy={point.cy}
              r="2.4"
              fill="var(--brand-orange)"
              initial={reduceMotion ? false : { opacity: 0.55, scale: 0.9 }}
              animate={reduceMotion ? { opacity: 0.9, scale: 1 } : { opacity: [0.55, 1, 0.55], scale: [0.9, 1.35, 0.9] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: point.delay }}
              style={{ transformOrigin: `${point.cx}px ${point.cy}px` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
