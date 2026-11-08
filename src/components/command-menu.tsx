// ⌘K command palette: sections, stations of every network, LTSER areas and language.
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { CornerDownLeft, Languages, MapPin, Mountain, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LTSER_AREAS } from "@/lib/catalog";
import { loadNetworks, type StationFeature } from "@/lib/geo";
import { lifewatch } from "@/api/lifewatch";
import type { LwStation } from "@/api/types";
import { navigate } from "@/hooks/use-route";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";
import { NAV } from "@/explorer-routes";

/** Search text with and without diacritics, so "padis" finds "Padiș". */
const searchable = (...parts: (string | number)[]) => {
  const text = parts.join(" ");
  return `${text} ${text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
};

/** Every typed word must appear in the item text; diacritics are ignored. */
const filter = (value: string, search: string) => {
  const words = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
  const text = value.toLowerCase();
  return words.every((w) => text.includes(w)) ? 1 : 0;
};

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[selected=true]:bg-surface-2 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-subtle";
const groupClass = "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle";

const OPEN_EVENT = "ltser:command-menu";
/** Opens the palette from anywhere (buttons outside the shell). */
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onOpenCommandMenu = (fn: () => void) => {
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
};

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, L, setLang, lang } = useI18n();
  const [ws, setWs] = useState<StationFeature[]>([]);
  const [ec, setEc] = useState<StationFeature[]>([]);
  const [lw, setLw] = useState<LwStation[]>([]);

  useEffect(() => {
    if (!open) return;
    loadNetworks().then((n) => {
      setWs(n.ws.features);
      setEc(n.ec.features);
    });
    lifewatch.stations().then(setLw, () => setLw([]));
  }, [open]);

  const go = (path: string, query?: Record<string, string | number>) => {
    onOpenChange(false);
    navigate(path, query);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent label={t("cmd.title")}>
        <DialogTitle className="sr-only">{t("cmd.title")}</DialogTitle>
        <Command label={t("cmd.title")} loop filter={filter} className="flex max-h-[min(70vh,520px)] flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3.5">
            <Search className="size-4 text-subtle" strokeWidth={1.75} />
            <Command.Input autoFocus placeholder={t("cmd.placeholder")} className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle focus-visible:shadow-none" />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted">{t("cmd.empty")}</Command.Empty>
            <Command.Group heading={t("cmd.sections")} className={groupClass}>
              {NAV.flatMap((g) =>
                g.items.map((it) => (
                  <Command.Item key={it.path || "home"} value={searchable(t(g.label), t(it.title), it.path)} onSelect={() => go(it.path)} className={itemClass}>
                    <g.icon strokeWidth={1.75} />
                    <span className="flex-1">{g.items.length > 1 ? `${t(g.label)} · ${t(it.title)}` : t(it.title)}</span>
                    <span className="tabular text-[11px] text-subtle">/{it.path}</span>
                  </Command.Item>
                )),
              )}
            </Command.Group>
            <Command.Group heading={t("cmd.areas")} className={groupClass}>
              {Object.entries(LTSER_AREAS).map(([id, area]) => (
                <Command.Item key={id} value={searchable("area", area.ro, area.en)} onSelect={() => go("teledetectie/administrativ", { unitate: "ltser", id })} className={itemClass}>
                  <Mountain strokeWidth={1.75} />
                  <span className="flex-1">{L(area)}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={t("cmd.weather")} className={groupClass}>
              {ws.map((f) => (
                <Command.Item key={f.properties.dataId} value={searchable("ws", f.properties.name, f.properties.locality, f.properties.county)} onSelect={() => go("retele/meteo", { statie: f.properties.dataId })} className={itemClass}>
                  <MapPin strokeWidth={1.75} />
                  <span className="flex-1">{f.properties.locality}, {f.properties.county}</span>
                  <span className="tabular text-[11px] text-subtle">{f.properties.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={t("cmd.eddy")} className={groupClass}>
              {ec.map((f) => (
                <Command.Item key={f.properties.dataId} value={searchable("ec", f.properties.name, f.properties.locality, f.properties.county)} onSelect={() => go("retele/eddy", { statie: f.properties.dataId })} className={itemClass}>
                  <MapPin strokeWidth={1.75} />
                  <span className="flex-1">{f.properties.locality}, {f.properties.county}</span>
                  <span className="tabular text-[11px] text-subtle">{f.properties.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={t("cmd.platform")} className={groupClass}>
              {lw.map((s) => (
                <Command.Item key={s.id} value={searchable("lw", s.id, s.name)} onSelect={() => go("platforma/statii", { statie: s.id })} className={itemClass}>
                  <MapPin strokeWidth={1.75} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular text-[11px] text-subtle">#{s.id}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading={t("cmd.language")} className={groupClass}>
              {(["ro", "en"] as const).map((code) => (
                <Command.Item key={code} value={searchable("lang", code, code === "ro" ? "română" : "english")} onSelect={() => { setLang(code); onOpenChange(false); }} className={itemClass}>
                  <Languages strokeWidth={1.75} />
                  <span className="flex-1">{code === "ro" ? "Română" : "English"}</span>
                  {lang === code ? <span className="text-[11px] text-accent">{t("cmd.current")}</span> : null}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-border px-3.5 py-2 text-[11px] text-subtle">
            <span className="inline-flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> {t("cmd.move")}</span>
            <span className="inline-flex items-center gap-1.5"><Kbd><CornerDownLeft className="size-3" /></Kbd> {t("cmd.open")}</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
