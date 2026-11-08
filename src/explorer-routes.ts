import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { Database, Info, LayoutGrid, RadioTower, Satellite, Users, type LucideIcon } from "lucide-react";
import type { Route } from "@/hooks/use-route";

export interface ViewProps {
  route: Route;
}

export interface RouteDef {
  path: string;
  title: string;
  group: string | null;
  view: LazyExoticComponent<ComponentType<ViewProps>>;
}

export const ROUTES: RouteDef[] = [
  { path: "", title: "nav.overview", group: null, view: lazy(() => import("@/views/overview")) },
  { path: "teledetectie/national", title: "nav.rs.national", group: "rs", view: lazy(() => import("@/views/remote-national")) },
  { path: "teledetectie/administrativ", title: "nav.rs.admin", group: "rs", view: lazy(() => import("@/views/remote-admin")) },
  { path: "retele/meteo", title: "nav.net.meteo", group: "net", view: lazy(() => import("@/views/network-weather")) },
  { path: "retele/eddy", title: "nav.net.eddy", group: "net", view: lazy(() => import("@/views/network-eddy")) },
  { path: "retele/metadate", title: "nav.net.meta", group: "net", view: lazy(() => import("@/views/network-metadata")) },
  { path: "platforma/statii", title: "nav.platform.stations", group: "platform", view: lazy(() => import("@/views/platform-explorer")) },
  { path: "platforma/disponibilitate", title: "nav.platform.availability", group: "platform", view: lazy(() => import("@/views/platform-availability")) },
  { path: "social", title: "nav.social", group: "social", view: lazy(() => import("@/views/social")) },
  { path: "despre", title: "nav.about", group: "about", view: lazy(() => import("@/views/about")) },
];

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: { path: string; title: string }[];
}

export const NAV: NavGroup[] = [
  { id: "overview", label: "nav.overview", icon: LayoutGrid, items: [{ path: "", title: "nav.overview" }] },
  { id: "rs", label: "nav.rs", icon: Satellite, items: [{ path: "teledetectie/national", title: "nav.rs.national" }, { path: "teledetectie/administrativ", title: "nav.rs.admin" }] },
  { id: "net", label: "nav.net", icon: RadioTower, items: [{ path: "retele/meteo", title: "nav.net.meteo" }, { path: "retele/eddy", title: "nav.net.eddy" }, { path: "retele/metadate", title: "nav.net.meta" }] },
  { id: "platform", label: "nav.platform", icon: Database, items: [{ path: "platforma/statii", title: "nav.platform.stations" }, { path: "platforma/disponibilitate", title: "nav.platform.availability" }] },
  { id: "social", label: "nav.social", icon: Users, items: [{ path: "social", title: "nav.social" }] },
  { id: "about", label: "nav.about", icon: Info, items: [{ path: "despre", title: "nav.about" }] },
];

export const findRoute = (path: string) => ROUTES.find((r) => r.path === path) ?? null;
