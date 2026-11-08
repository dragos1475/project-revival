// Path router for the public site. Pages are prerendered to /<key>/index.html at build time;
// after the first load, links swap pages in place through the History API.
import { createContext, useCallback, useContext, useMemo, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useRouter as useTanstackRouter, useRouterState } from "@tanstack/react-router";
import { baseKey, getLang, keyFor, type Lang } from "./i18n/core";

const BASE = import.meta.env.BASE_URL;

/** Route key of a pathname: base and slashes stripped, "" for the home page. */
export function toKey(pathname: string) {
  let path = pathname;
  if (BASE !== "/" && path.startsWith(BASE)) path = path.slice(BASE.length - 1);
  return decodeURI(path).replace(/index\.html$/, "").replace(/^\/+|\/+$/g, "");
}

/** Public URL of a page in a given language: ("statiuni/braila", "en") becomes "/en/statiuni/braila/". */
export const hrefIn = (key: string, lang: Lang, hash?: string) => {
  const k = keyFor(baseKey(key), lang);
  return `${BASE}${k ? `${k}/` : ""}${hash ? `#${hash}` : ""}`;
};

/** Public URL of a site page in the current language: "statiuni/braila" becomes "/statiuni/braila/" or "/en/statiuni/braila/". */
export const pageHref = (key: string, hash?: string) => hrefIn(key, getLang(), hash);

/** Deep link into the explorer, which keeps its own hash router. */
export function explorerHref(path = "", query: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
  return `${BASE}explorator/${path || qs ? `#/${path}${qs ? `?${qs}` : ""}` : ""}`;
}

interface RouterValue {
  key: string;
  hash: string;
  navigate: (href: string) => void;
}

const RouterContext = createContext<RouterValue>({ key: "", hash: "", navigate: () => undefined });
export const useRouter = () => useContext(RouterContext);

/** Bridges the site's page keys onto TanStack Router: the URL is the single source of truth. */
export function RouterProvider({ children }: { initialKey?: string; children: ReactNode }) {
  const router = useTanstackRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const key = toKey(pathname);

  const navigate = useCallback(
    (target: string) => {
      const url = new URL(target, window.location.href);
      void router.navigate({ href: url.pathname + url.search + url.hash }).then(() => {
        if (url.hash) document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [router],
  );

  const value = useMemo(() => ({ key, hash, navigate }), [key, hash, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; hash?: string };

/** Link to a site page by route key. Plain clicks stay in the page; modified clicks behave natively. */
export function Link({ to, hash, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter();
  const target = pageHref(to, hash);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target) return;
    e.preventDefault();
    navigate(target);
  };
  return <a href={target} onClick={handle} {...props} />;
}
