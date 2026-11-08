// Language store shared by React (via useSyncExternalStore) and plain modules (formatting).
export type Lang = "ro" | "en";

const STORAGE_KEY = "ltser.lang";
const listeners = new Set<() => void>();

function initial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ro" || saved === "en") return saved;
  } catch {
    /* storage can be blocked */
  }
  return "ro";
}

let current: Lang = initial();
document.documentElement.lang = current;

export const getLang = () => current;

export function setLang(next: Lang) {
  if (next === current) return;
  current = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeLang(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
