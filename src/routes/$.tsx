import { createFileRoute } from "@tanstack/react-router";
import { loadSitePage, siteHead, SitePage } from "@/site/tanstack";

// Every public-site page (Romanian and /en/) is resolved from the page table in src/site/routes.tsx.
export const Route = createFileRoute("/$")({
  loader: ({ location }) => loadSitePage(location.pathname),
  head: ({ loaderData }) => (loaderData ? siteHead(loaderData.key, loaderData.lang) : {}),
  component: SiteSplat,
});

function SiteSplat() {
  const { key, lang } = Route.useLoaderData();
  return <SitePage siteKey={key} lang={lang} />;
}
