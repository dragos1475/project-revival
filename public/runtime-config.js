// Deployment configuration, read at runtime. This is the only file to edit when deploying;
// it is copied to the build output unchanged.
//
// mode: "auto"  probes GET /health and falls back to demo data if the service is unreachable
//       "live"  always calls the service and shows its errors
//       "demo"  never calls the service, uses locally generated demonstration data
// Append ?mod=demo or ?mod=live to the page address to override the mode for one visit.
//
// cartoKey is the CARTO basemaps key (carto.com/basemaps/apikey). It is public by design: it travels
// in every tile URL. The site maps use CARTO Voyager (light) and Dark Matter (dark).
//
// The API addresses are paths on the page's own origin. A reverse proxy forwards them to the
// services (Vite in development, deploy/nginx.conf.example in production), so no CORS is needed.
window.LTSER_CONFIG = {
  lifewatchApi: "/lifewatch-api",
  lifewatchMode: "auto",
  ltserApi: "/ltser-api",
  ltserMode: "auto",
  mediaBaseUrl: null,
  requestTimeoutMs: 20000,
  probeTimeoutMs: 2500,
  cartoKey: "cb1_542i_1_f4d776c9a2d6f958687021cb",
  basemaps: {
    light: "https://basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}{r}.png?key={key}",
    lightLabels: "https://basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}{r}.png?key={key}",
    dark: "https://basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png?key={key}",
    darkLabels: "https://basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png?key={key}",
    imagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};
