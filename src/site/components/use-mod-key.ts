import { useEffect, useState } from "react";

/** Shortcut label for the search button. The server renders the Mac label; the browser corrects it. */
export function useShortcutLabel() {
  const [label, setLabel] = useState("⌘K");
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setLabel("Ctrl K");
  }, []);
  return label;
}

/** Calls handler on ⌘K or Ctrl+K. */
export function useSearchShortcut(handler: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}
