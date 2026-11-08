// Language switch (top bar) and the question asked on the first visit when the browser language
// differs from the page. The choice is remembered in localStorage ("lw-lang").
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getLang, type Lang } from "../i18n/core";
import { hrefIn, useRouter } from "../router";

const PREF = "lw-lang";
const readPref = () => {
  try {
    return localStorage.getItem(PREF);
  } catch {
    return null;
  }
};
const writePref = (v: Lang) => {
  try {
    localStorage.setItem(PREF, v);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
};

function useOtherHref(lang: Lang) {
  const { key, hash } = useRouter();
  return hrefIn(key === "__404__" ? "" : key, lang, hash || undefined);
}

/** RO | EN links. Switching loads the page in the other language. */
export function LangSwitch({ className }: { className?: string }) {
  const current = getLang();
  const ro = useOtherHref("ro");
  const en = useOtherHref("en");
  const item = "grid h-8 min-w-9 place-items-center rounded-md px-2 text-[12.5px] font-bold tracking-[0.04em] transition-colors";
  return (
    <nav aria-label={current === "en" ? "Site language" : "Limba site-ului"} className={cn("flex items-center gap-0.5", className)}>
      {(["ro", "en"] as const).map((l) => (
        <a
          key={l}
          href={l === "ro" ? ro : en}
          hrefLang={l}
          lang={l}
          aria-current={l === current ? "true" : undefined}
          onClick={() => writePref(l)}
          className={cn(item, l === current ? "bg-white/12 text-white" : "text-[#A9BCC5] hover:text-white")}
          data-no-tr
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}

function browserLang() {
  const l = (navigator.languages?.[0] || navigator.language || "en").slice(0, 2).toLowerCase();
  return l;
}
function langName(code: string) {
  try {
    const n = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    return n.charAt(0).toUpperCase() + n.slice(1);
  } catch {
    return code.toUpperCase();
  }
}
const canMachineTranslate = () => /^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) && !location.hostname.endsWith(".localhost");

/** Asks once which language to use, when the browser language is not the page language. */
export function LangPrompt() {
  const [code, setCode] = useState<string | null>(null);
  const current = getLang();
  const ro = useOtherHref("ro");
  const en = useOtherHref("en");

  useEffect(() => {
    if (readPref()) return;
    const bl = browserLang();
    if (bl === current) return;
    if (current === "en" && bl !== "ro") return; // English pages already suit other languages
    setCode(bl);
  }, [current]);

  if (!code) return null;
  const other = code !== "ro" && code !== "en";
  const native = other ? langName(code) : "";
  const mt = other && canMachineTranslate() ? `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(new URL(en, location.href).href)}` : null;
  const close = () => {
    writePref(current);
    setCode(null);
  };
  const btn = "inline-flex h-11 items-center justify-center rounded-lg px-4 text-[15px] font-semibold transition-colors";
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="p-6 sm:p-7">
        <p className="mb-1.5 text-[12.5px] font-semibold tracking-[0.1em] text-accent uppercase" data-no-tr>
          LifeWatch România
        </p>
        <DialogTitle className="font-display text-[22px] leading-tight font-bold text-navy dark:text-foreground" data-no-tr>
          Choose your language · Alegeți limba
        </DialogTitle>
        <DialogDescription className="mt-2 text-[15px] leading-[1.6] text-muted" data-no-tr>
          {other ? `This site is available in English and Romanian. You can also read it in ${native} with automatic translation.` : "This site is available in English and Romanian."}
        </DialogDescription>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a href={en} onClick={() => writePref("en")} className={cn(btn, "bg-navy text-white hover:bg-navy-2 dark:bg-lime dark:text-navy")} data-no-tr>
            English
          </a>
          <a href={ro} onClick={() => writePref("ro")} className={cn(btn, "border border-navy text-navy hover:bg-surface-2 dark:border-border-strong dark:text-foreground")} data-no-tr>
            Română
          </a>
          {mt ? (
            <a href={mt} lang={code} onClick={() => writePref("en")} className={cn(btn, "bg-[#2f7d4f] text-white hover:bg-[#1f5a37]")} data-no-tr>
              {native} (automatic translation)
            </a>
          ) : null}
        </div>
        {other && !mt ? (
          <p className="mt-3 text-[13px] text-subtle" data-no-tr>
            Automatic translation into {native} becomes available once the site is published online.
          </p>
        ) : null}
        <p className="mt-3 text-[13px] text-subtle" data-no-tr>
          You can change the language at any time from the top bar · Puteți schimba limba oricând din bara de sus.
        </p>
      </DialogContent>
    </Dialog>
  );
}
