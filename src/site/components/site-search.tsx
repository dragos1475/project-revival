// ⌘K search across the site: pages, stations, platforms, datasets, questions and explorer modules.
import { useMemo } from "react";
import { Command } from "cmdk";
import { ArrowUpRight, CornerDownLeft, FileText, HelpCircle, Layers, MapPin, Mountain, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";
import { STATIONS } from "../content/stations";
import { PLATFORMS } from "../content/platforms";
import { DATASETS } from "../content/data";
import { FAQ } from "../content/faq";
import { EXPLORER_MODULES } from "../nav";
import { CAT, LW_POINTS, sheetKey } from "../content/lw";
import { CatShape } from "./lw-shapes";
import { explorerHref, pageHref, useRouter } from "../router";
import { BASE_ROUTES as SITE_ROUTES } from "../routes";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const searchable = (...parts: string[]) => {
  const text = parts.join(" ");
  return `${text} ${fold(text)}`;
};
/** Every typed word must appear in the item text; diacritics are ignored, so "orsova" finds "Orșova". */
const filter = (value: string, search: string) => {
  const words = fold(search).toLowerCase().split(/\s+/).filter(Boolean);
  const text = value.toLowerCase();
  return words.every((w) => text.includes(w)) ? 1 : 0;
};

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground outline-none data-[selected=true]:bg-surface-2 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-subtle";
const groupClass =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-subtle";

export function SiteSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { navigate } = useRouter();
  const pages = useMemo(() => SITE_ROUTES.filter((r) => r.searchable), []);

  const go = (key: string, hash?: string) => {
    onOpenChange(false);
    navigate(pageHref(key, hash));
  };
  const goExplorer = (path: string, query?: Record<string, string | number>) => {
    onOpenChange(false);
    window.location.assign(explorerHref(path, query));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent label="Căutare">
        <DialogTitle className="sr-only">Căutare în site</DialogTitle>
        <Command filter={filter} loop>
          <div className="flex items-center gap-2.5 border-b border-border px-3.5">
            <Search className="size-4 shrink-0 text-subtle" strokeWidth={1.75} />
            <Command.Input autoFocus placeholder="Caută un sit, o stațiune, o pagină sau un set de date" className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-subtle focus-visible:!shadow-none" />
            <Kbd>Esc</Kbd>
          </div>
          <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto overscroll-contain p-1.5">
            <Command.Empty className="px-3 py-10 text-center text-[13px] text-muted">Niciun rezultat. Încercați alt cuvânt.</Command.Empty>

            <Command.Group heading="Pagini" className={groupClass}>
              {pages.map((r) => (
                <Command.Item key={r.key || "home"} value={searchable(r.title, r.description)} onSelect={() => go(r.key)} className={itemClass}>
                  <FileText strokeWidth={1.75} />
                  <span className="flex-1 truncate">{r.title}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Stații de cercetare" className={groupClass}>
              {STATIONS.map((s) => (
                <Command.Item key={s.slug} value={searchable(s.name, s.county, s.setting, ...s.focus)} onSelect={() => go(`statiuni/${s.slug}`)} className={itemClass}>
                  <MapPin strokeWidth={1.75} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular text-[11px] text-subtle">{s.founded}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Situri și stații (fișe de date)" className={groupClass}>
              {LW_POINTS.map((p) => (
                <Command.Item key={p.key} value={searchable(p.ro, p.fullName ?? "", CAT[p.cat].one, ...(p.ecosystems ?? []))} onSelect={() => go(sheetKey(p))} className={itemClass}>
                  <CatShape cat={p.cat} size={14} />
                  <span className="flex-1 truncate">{p.ro}</span>
                  <span className="text-[11px] text-subtle">{CAT[p.cat].one}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Platforme LTSER" className={groupClass}>
              {PLATFORMS.map((p) => (
                <Command.Item key={p.slug} value={searchable(p.name, p.region, p.kind)} onSelect={() => go(`platforme/${p.slug}`)} className={itemClass}>
                  <Mountain strokeWidth={1.75} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-[11px] text-subtle">{p.kind}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Seturi de date" className={groupClass}>
              {DATASETS.map((d) => (
                <Command.Item key={d.id} value={searchable(d.title, d.summary, ...d.variables)} onSelect={() => go("date", d.id)} className={itemClass}>
                  <Layers strokeWidth={1.75} />
                  <span className="flex-1 truncate">{d.title}</span>
                  <span className="text-[11px] text-subtle">{d.service}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Exploratorul LTSER" className={groupClass}>
              {EXPLORER_MODULES.map((m) => (
                <Command.Item key={m.id} value={searchable("explorator", m.title, m.body)} onSelect={() => goExplorer(m.path)} className={itemClass}>
                  <m.icon strokeWidth={1.75} />
                  <span className="flex-1 truncate">{m.title}</span>
                  <ArrowUpRight className="size-3.5 text-subtle" strokeWidth={1.75} />
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Întrebări frecvente" className={groupClass}>
              {FAQ.map((f) => (
                <Command.Item key={f.id} value={searchable(f.q, f.a)} onSelect={() => go("intrebari-frecvente", f.id)} className={itemClass}>
                  <HelpCircle strokeWidth={1.75} />
                  <span className="flex-1 truncate">{f.q}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-border px-3.5 py-2 text-[11px] text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              pentru selecție
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CornerDownLeft className="size-3" strokeWidth={1.75} />
              pentru deschidere
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
