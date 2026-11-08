import { useEffect, useState } from "react";

export interface Route {
  path: string;
  query: URLSearchParams;
}
type Query = Record<string, string | number | null | undefined>;

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  return { path: path.replace(/\/+$/, ""), query: new URLSearchParams(qs) };
}

export function hashFor(path: string, query: Query = {}) {
  const entries = Object.entries(query).filter(([, v]) => v !== null && v !== undefined && v !== "") as [string, string | number][];
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  return `#/${path}${qs ? `?${qs}` : ""}`;
}

export function navigate(path: string, query?: Query) {
  window.location.hash = hashFor(path, query);
}

/** Updates the query of the current route without a navigation (no remount, no history entry). */
export function replaceQuery(patch: Query) {
  const { path, query } = parse();
  const merged: Query = Object.fromEntries(query.entries());
  Object.assign(merged, patch);
  history.replaceState(null, "", hashFor(path, merged));
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
