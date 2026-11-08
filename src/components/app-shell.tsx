import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Menu, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBackend } from "@/hooks/use-backend";
import { hashFor } from "@/hooks/use-route";
import { isMac, useModKey } from "@/hooks/use-media";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Kbd, StatusDot } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { CommandMenu, onOpenCommandMenu } from "./command-menu";
import { LogoMark } from "./logo";
import { NAV } from "@/explorer-routes";
import { setThemePref, useThemePref } from "@/lib/theme";

function BackendRow({ name, label }: { name: "lifewatch" | "ltser"; label: string }) {
  const { t } = useI18n();
  const s = useBackend(name);
  return (
    <li className="flex items-center gap-2 text-xs">
      <StatusDot mode={s.mode} />
      <span className="flex-1 text-muted">{label}</span>
      <span className={cn("tabular text-[11px]", s.mode === "live" ? "text-accent" : s.mode === "demo" ? "text-warning" : "text-subtle")}>{t(`source.short.${s.mode}`)}</span>
    </li>
  );
}

function SidebarContent({ path, onSearch, onNavigate }: { path: string; onSearch: () => void; onNavigate?: () => void }) {
  const { t, lang, setLang } = useI18n();
  const themePref = useThemePref();
  return (
    <div className="flex h-full flex-col gap-5 px-3 py-4">
      <a href={hashFor("")} onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
        <LogoMark className="size-7" />
        <span className="grid leading-tight">
          <span className="text-[13px] font-semibold tracking-tight">LTSER Explorer</span>
          <span className="text-[11px] text-subtle">LifeWatch România</span>
        </span>
      </a>

      <a href={import.meta.env.BASE_URL} className="group -mt-2 flex items-center gap-1.5 px-1.5 text-[12px] text-subtle transition-colors hover:text-foreground">
        <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
        {t("rail.site")}
      </a>

      <button
        type="button"
        onClick={onSearch}
        className="flex h-8 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-[13px] text-subtle shadow-card transition-colors hover:border-border-strong hover:text-muted"
      >
        <Search className="size-3.5" strokeWidth={1.75} />
        <span className="flex-1 text-left">{t("cmd.search")}</span>
        <Kbd>{isMac() ? "⌘K" : "Ctrl K"}</Kbd>
      </button>

      <nav aria-label={t("rail.nav")} className="grid gap-4 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.id} className="grid gap-0.5">
            {g.items.length > 1 ? <p className="px-2 pb-1 text-[11px] font-medium text-subtle">{t(g.label)}</p> : null}
            {g.items.map((it) => {
              const active = it.path === path;
              const Icon = g.icon;
              return (
                <a
                  key={it.path || "home"}
                  href={hashFor(it.path)}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className="relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] text-muted transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                >
                  {active ? <motion.span layoutId="nav-active" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-border" /> : null}
                  <Icon className={cn("relative size-4", active ? "text-accent" : "text-subtle")} strokeWidth={1.75} />
                  <span className="relative truncate">{t(it.title)}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto grid gap-3 border-t border-border pt-4">
        <ul className="grid gap-2" aria-label={t("rail.backends")}>
          <BackendRow name="lifewatch" label={t("rail.backend.lifewatch")} />
          <BackendRow name="ltser" label={t("rail.backend.ltser")} />
        </ul>
        <Segmented ariaLabel={t("rail.language")} value={lang} onChange={setLang} options={[{ value: "ro", label: "Română" }, { value: "en", label: "English" }]} fill />
        <Segmented
          ariaLabel={t("rail.theme")}
          value={themePref}
          onChange={setThemePref}
          options={[{ value: "system", label: t("theme.system") }, { value: "light", label: t("theme.light") }, { value: "dark", label: t("theme.dark") }]}
          fill
        />
      </div>
    </div>
  );
}

export function AppShell({ path, children }: { path: string; children: ReactNode }) {
  const { t } = useI18n();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useModKey("k", () => setCmdOpen((v) => !v));
  useEffect(() => onOpenCommandMenu(() => setCmdOpen(true)), []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <a href="#main" className="sr-only z-[2000] rounded-lg bg-foreground px-3 py-2 text-background focus:not-sr-only focus:fixed focus:top-3 focus:left-3">{t("rail.skip")}</a>

      <aside className="sticky top-0 hidden h-dvh border-r border-border lg:block">
        <SidebarContent path={path} onSearch={() => setCmdOpen(true)} />
      </aside>

      <header className="sticky top-0 z-[1100] flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:hidden">
        <a href={hashFor("")} className="flex items-center gap-2">
          <LogoMark className="size-7" />
          <span className="text-[13px] font-semibold tracking-tight">LTSER Explorer</span>
        </a>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={t("cmd.search")} onClick={() => setCmdOpen(true)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground">
            <Search className="size-4" strokeWidth={1.75} />
          </button>
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <button type="button" aria-label={t("rail.menu")} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground">
                <Menu className="size-4" strokeWidth={1.75} />
              </button>
            </DialogTrigger>
            <SheetContent title={t("rail.nav")}>
              <SidebarContent path={path} onSearch={() => { setMenuOpen(false); setCmdOpen(true); }} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Dialog>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="relative min-w-0 focus:outline-none">
        <div aria-hidden className="dot-grid fade-mask pointer-events-none absolute inset-x-0 top-0 h-72" />
        <div className="relative mx-auto max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:px-12">{children}</div>
      </main>

      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
