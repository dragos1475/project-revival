// Light / dark theme shared by the public site and the explorer. The choice is stored in
// localStorage ("system" follows the operating system) and written to <html data-theme>.
// The inline script in index.html applies it before first paint; this module keeps it in sync.
// Safe to import during prerendering: nothing touches the browser at module scope without a check.
import { useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

const KEY = "lw.theme";
const browser = typeof window !== "undefined";
const listeners = new Set<() => void>();
const media = browser ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function readPref(): ThemePref {
  try {
    const value = localStorage.getItem(KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* storage can be blocked */
  }
  return "system";
}

let pref: ThemePref = browser ? readPref() : "system";

const resolve = (p: ThemePref): Theme => (p === "system" ? (media?.matches ? "dark" : "light") : p);

function apply() {
  if (!browser) return;
  const theme = resolve(pref);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0a2130" : "#ffffff");
}

const emit = () => listeners.forEach((fn) => fn());

media?.addEventListener("change", () => {
  if (pref !== "system") return;
  apply();
  emit();
});

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  apply();
  emit();
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** The stored choice. The server snapshot is "system", so prerendered markup never depends on it. */
export const useThemePref = () => useSyncExternalStore(subscribe, () => pref, () => "system" as ThemePref);

/** The theme in effect. The server renders the light variant; the browser corrects it after hydration. */
export const useTheme = () => useSyncExternalStore(subscribe, () => resolve(pref), () => "light" as Theme);
