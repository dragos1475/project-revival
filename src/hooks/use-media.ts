import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "@/lib/theme";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => window.matchMedia(query).matches,
  );
}

/** True when the dark theme is in effect (stored choice or system setting, see src/lib/theme.ts). */
export const useDarkMode = () => useTheme() === "dark";

/** Calls `handler` on ⌘K / Ctrl+K (or another key with the platform modifier). */
export function useModKey(key: string, handler: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler]);
}

export const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
