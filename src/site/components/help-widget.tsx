// "Ai nevoie de ajutor?": floating button and contact form, sent through Netlify Forms (name
// "contact"). The form is always in the prerendered HTML, hidden, so Netlify finds it at deploy.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const HELP_TOPICS = ["Întrebare generală", "Acces la date", "Acces la stațiuni", "Colaborare în proiecte", "Presă"] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

const HelpContext = createContext<{ openHelp: (topic?: HelpTopic) => void; toggleHelp: () => void }>({ openHelp: () => undefined, toggleHelp: () => undefined });
export const useHelp = () => useContext(HelpContext);

const field = "rounded-md border border-border-strong bg-surface px-2.5 py-2 text-[14px] font-normal text-foreground outline-none focus-visible:border-accent";

export function HelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic>("Întrebare generală");
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [sending, setSending] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const openHelp = useCallback((t?: HelpTopic) => {
    if (t) setTopic(t);
    setResult(null);
    setOpen(true);
  }, []);
  const toggleHelp = useCallback(() => {
    setResult(null);
    setOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!open) return;
    form.current?.querySelector<HTMLElement>("select, input, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = new URLSearchParams(Array.from(data.entries()).map(([k, v]) => [k, String(v)])).toString();
    setSending(true);
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then((r) => {
        setResult(r.ok ? "ok" : "fail");
        if (r.ok) form.current?.reset();
      })
      .catch(() => setResult("fail"))
      .finally(() => setSending(false));
  };

  return (
    <HelpContext.Provider value={{ openHelp, toggleHelp }}>
      {children}
      <div className="fixed right-4 bottom-4 z-[2000] flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5">
        <div id="help-panel" role="dialog" aria-labelledby="help-title" hidden={!open} className="w-[330px] max-w-[calc(100vw-32px)] rounded-xl border border-border bg-surface p-5 text-foreground shadow-[0_20px_48px_rgba(14,42,59,0.28)]">
          <strong id="help-title" className="font-display text-[18px] font-bold">Ai nevoie de ajutor?</strong>
          <form ref={form} name="contact" method="POST" action="/" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submit} hidden={result !== null} className="mt-2.5 grid gap-2.5">
            <input type="hidden" name="form-name" value="contact" />
            <p hidden>
              <label>
                Nu completați
                <input name="bot-field" />
              </label>
            </p>
            <label className="grid gap-1 text-[13px] font-semibold">
              Subiect
              <select name="subiect" value={topic} onChange={(e) => setTopic(e.target.value as HelpTopic)} className={field}>
                {HELP_TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[13px] font-semibold">
              Nume
              <input type="text" name="nume" required autoComplete="name" className={field} />
            </label>
            <label className="grid gap-1 text-[13px] font-semibold">
              E-mail
              <input type="email" name="email" required autoComplete="email" className={field} />
            </label>
            <label className="grid gap-1 text-[13px] font-semibold">
              Mesaj
              <textarea name="mesaj" rows={3} required className={field} />
            </label>
            <label className="flex items-start gap-2 text-[13px] text-muted">
              <input type="checkbox" name="acord" required className="mt-0.5 size-4 accent-[#2f7d4f]" />
              Sunt de acord ca datele mele să fie folosite pentru a primi un răspuns.
            </label>
            <button type="submit" disabled={sending} className="h-10 rounded-lg bg-navy px-4 text-[14px] font-semibold text-white transition-colors hover:bg-navy-2 disabled:opacity-60 dark:bg-lime dark:text-navy">
              {sending ? "Se trimite…" : "Trimite"}
            </button>
          </form>
          {result ? (
            <p role="status" className="mt-2.5 text-[14px] text-muted">
              {result === "ok"
                ? "Mulțumim! Mesajul a fost trimis și vă răspundem în cel mai scurt timp."
                : "Mesajul nu a putut fi trimis de aici. Pe site-ul publicat pe Netlify formularul trimite mesajele direct echipei."}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleHelp}
          aria-controls="help-panel"
          aria-expanded={open}
          className={cn("h-11 rounded-lg bg-lime px-4 text-[14px] font-bold text-navy shadow-[0_8px_24px_rgba(14,42,59,0.25)] transition-colors hover:bg-[#a8d662]", open && "bg-surface text-foreground hover:bg-surface-2")}
        >
          {open ? "Închide" : "Ai nevoie de ajutor?"}
        </button>
      </div>
    </HelpContext.Provider>
  );
}
