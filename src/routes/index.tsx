import { createFileRoute } from "@tanstack/react-router";
import { loadSitePage, siteHead, SitePage } from "@/site/tanstack";

export const Route = createFileRoute("/")({
  loader: ({ location }) => loadSitePage(location.pathname),
  head: ({ loaderData }) => (loaderData ? siteHead(loaderData.key, loaderData.lang) : {}),
  component: Home,
});

function Home() {
  const { key, lang } = Route.useLoaderData();
  return <SitePage siteKey={key} lang={lang} />;
}
