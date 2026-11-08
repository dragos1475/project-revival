import { useMemo, useSyncExternalStore } from "react";
import { getLang, setLang, subscribeLang, type Lang } from "./lang";
import { STRINGS } from "./strings";
import type { Labelled } from "./catalog";

export type Vars = Record<string, string | number>;

export function translate(key: string, vars?: Vars, lang: Lang = getLang()) {
  let s = STRINGS[lang][key] ?? STRINGS.ro[key];
  if (s === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
  return s;
}

export const useLang = () => useSyncExternalStore(subscribeLang, getLang);

export function useI18n() {
  const lang = useLang();
  return useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string, vars?: Vars) => translate(key, vars, lang),
      L: (entry?: Labelled | null) => (entry ? entry[lang] : ""),
    }),
    [lang],
  );
}
