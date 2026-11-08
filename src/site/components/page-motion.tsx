// One small animated scene per inner page: a landscape for every station and platform, a drawing of
// the subject for the other pages. Scenes are pure SVG with CSS motion (see .scene-* in index.css),
// so they render in the prerendered HTML, move before hydration and stop under reduced motion.
import { baseKey } from "../i18n/core";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SceneDefs } from "./scenes/kit";
import { type Habitat, Landscape } from "./scenes/landscapes";
import { type Topic, TopicArt } from "./scenes/topics";

export type PageMotionScene = { kind: Topic } | { kind: "landscape"; habitat: Habitat };

const stationHabitats: Record<string, Habitat> = {
  braila: "danube",
  "sfantu-gheorghe": "coast",
  sinaia: "mountain",
  orsova: "gorge",
};

const platformHabitats: Record<string, Habitat> = {
  "delta-dunarii": "wetland",
  "insulele-brailei": "islands",
  neajlov: "watershed",
  "bucegi-piatra-craiului": "alpine",
  "rodna-calimani": "volcanic",
  retezat: "glacial",
};

const routeScenes: Record<string, Topic> = {
  despre: "about",
  statiuni: "infrastructure",
  infrastructura: "services",
  acces: "contact",
  platforme: "platforms",
  date: "data",
  "date/api": "api",
  "date/documentatie": "docs",
  servicii: "services",
  retea: "network",
  proiecte: "projects",
  "intrebari-frecvente": "faq",
  contact: "contact",
};

/** Scene for a route key; `null` means the route does not exist. The home page has the tree instead. */
export function sceneForRoute(key: string | null): PageMotionScene | null {
  if (key === null) return { kind: "not-found" };
  const routeKey = baseKey(key);
  if (!routeKey) return null;
  const station = routeKey.match(/^statiuni\/([^/]+)$/)?.[1];
  if (station) return stationHabitats[station] ? { kind: "landscape", habitat: stationHabitats[station] } : null;
  const platform = routeKey.match(/^platforme\/([^/]+)$/)?.[1];
  if (platform) return platformHabitats[platform] ? { kind: "landscape", habitat: platformHabitats[platform] } : null;
  return routeScenes[routeKey] ? { kind: routeScenes[routeKey] } : null;
}

const PageMotionContext = createContext<PageMotionScene | null>(null);

export function PageMotionProvider({ scene, children }: { scene: PageMotionScene | null; children: ReactNode }) {
  return <PageMotionContext.Provider value={scene}>{children}</PageMotionContext.Provider>;
}

export function usePageMotionScene() {
  return useContext(PageMotionContext);
}

/** The scene box. It has no height of its own: the layout around it decides the size, and the drawing
 *  is cropped to fill it ("slice"), with the subject kept in the middle of the canvas. */
export function PageMotionGraphic({ scene, className }: { scene: PageMotionScene; className?: string }) {
  const id = `sc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div
      aria-hidden
      className={cn("scene-art pointer-events-none relative isolate overflow-hidden rounded-2xl border border-border", className)}
      style={{ background: "radial-gradient(ellipse at 50% 38%, var(--surface) 0%, var(--surface-2) 62%, var(--background) 100%)" }}
    >
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" focusable="false">
        <SceneDefs id={id} />
        {scene.kind === "landscape" ? <Landscape habitat={scene.habitat} id={id} /> : <TopicArt topic={scene.kind} id={id} />}
      </svg>
    </div>
  );
}
