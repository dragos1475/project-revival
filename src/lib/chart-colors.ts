// Series colours derived from the LifeWatch logo palette, lifted to read on both the light and the
// dark surface. Keys keep their historical names: "emerald" is the brand green, "sky" the brand
// blue, "rose" the brand orange, "amber" the brand sand.
export const SERIES = {
  emerald: "#479a55",
  amber: "#e49950",
  sky: "#4f79c4",
  rose: "#d55a2b",
  teal: "#4aa4a6",
  orange: "#e07b3f",
  slate: "#94a3b8",
  lime: "#8bb33c",
} as const;

export const SERIES_CYCLE = [SERIES.emerald, SERIES.sky, SERIES.amber, SERIES.rose, SERIES.teal, SERIES.orange, SERIES.lime, SERIES.slate];
