import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The explorer reads window config at import time and uses Leaflet, so it only loads in the browser.
const ExplorerApp = lazy(() => import("@/explorer-app"));

export const Route = createFileRoute("/explorator")({
  head: () => ({
    meta: [
      { title: "LTSER Explorer · LifeWatch România" },
      { name: "description", content: "Teledetecție, stații meteorologice, eddy covariance, date brute și indicatori sociali pentru cele șase zone LTSER din România." },
      { property: "og:title", content: "LTSER Explorer · LifeWatch România" },
      { property: "og:description", content: "Teledetecție, stații meteorologice, eddy covariance, date brute și indicatori sociali pentru cele șase zone LTSER din România." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <ExplorerApp />
      </Suspense>
    </ClientOnly>
  );
}
