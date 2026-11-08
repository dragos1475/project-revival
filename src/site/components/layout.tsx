// Site chrome: navy top bar (search, help, theme), main bar with mega menu, mobile sheet, footer and
// the help widget.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Menu as MenuIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";
import { asset, formatDay, LW_GENERATED } from "../content/lw";
import { LOGOS } from "../content/site-photos";
import { activeMenu, MENUS, type MenuLink } from "../nav";
import { explorerHref, Link, useRouter } from "../router";
import { Container } from "./primitives";
import { SiteSearch } from "./site-search";
import { ThemeButton, ThemeChoice } from "./theme-switch";
import { useSearchShortcut, useShortcutLabel } from "./use-mod-key";
import { HelpProvider, useHelp } from "./help-widget";
import { LangPrompt, LangSwitch } from "./lang";

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="" className={cn("flex min-w-0 shrink-0 items-center gap-3 rounded-lg", inverse ? "text-white" : "text-navy dark:text-foreground")} aria-label="LifeWatch România, pagina principală">
      <LogoMark className="size-11 shrink-0" />
      <span className="grid min-w-0 leading-tight">
        <span className="font-display text-[21px] leading-[1.1] font-extrabold">LifeWatch România</span>
        <span className={cn("hidden text-[12px] sm:block", inverse ? "text-white/70" : "text-subtle")}>Infrastructură de cercetare pentru biodiversitate și ecosisteme</span>
      </span>
    </Link>
  );
}

/** A menu entry: site page, explorer or external address. */
function MenuAnchor({ link, className, onClick, children }: { link: MenuLink; className?: string; onClick?: () => void; children: ReactNode }) {
  if (link.href) {
    const external = link.href !== "explorer";
    return (
      <a href={external ? link.href : explorerHref()} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={link.to ?? ""} hash={link.hash} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const shortcut = useShortcutLabel();
  const { toggleHelp } = useHelp();
  return (
    <div className="bg-navy text-[13px] text-[#DCE7EB]">
      <Container className="flex items-center justify-end gap-x-6 gap-y-2 py-[7px] md:justify-between">
        <span className="hidden truncate md:block">Universitatea din București · Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate (RCSES)</span>
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
          <Link to="" className="hidden text-[#DCE7EB] hover:text-white hover:underline sm:inline">
            Acasă
          </Link>
          <button type="button" onClick={onSearch} className="flex h-8 w-[170px] items-center gap-2 rounded-md bg-navy-2 px-2.5 text-left text-[#A9BCC5] transition-colors hover:text-white sm:w-[230px]">
            <Search className="size-3.5 shrink-0 text-[#DCE7EB]" strokeWidth={2} />
            <span className="flex-1 truncate">Caută situri, stațiuni…</span>
            <Kbd className="hidden border-white/15 bg-white/5 text-[#A9BCC5] sm:inline-flex">{shortcut}</Kbd>
          </button>
          <button type="button" onClick={toggleHelp} className="hidden h-8 rounded-md border border-[#4E6B7C] px-3 text-white transition-colors hover:bg-navy-2 md:block">
            Ai nevoie de ajutor?
          </button>
          <LangSwitch />
          <ThemeButton className="size-8 text-[#DCE7EB] hover:bg-navy-2 hover:text-white" />
        </div>
      </Container>
    </div>
  );
}

function MegaPanel({ menuId, onClose }: { menuId: string; onClose: () => void }) {
  const menu = MENUS.find((m) => m.id === menuId)!;
  return (
    <div id="mega" className="absolute inset-x-0 top-full border-t border-border bg-background shadow-[0_18px_40px_rgba(14,42,59,0.14)]">
      <Container className="flex flex-wrap gap-8 pt-7 pb-8">
        <div className="max-w-[340px] flex-[1_1_260px]">
          <p className="mb-2.5 text-[13px] font-semibold tracking-[0.1em] text-accent uppercase">{menu.label}</p>
          <p className="mb-3.5 text-[15px] leading-[1.55] text-muted">{menu.desc}</p>
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-navy px-3 text-[14px] font-semibold text-navy hover:bg-surface-2 dark:border-border-strong dark:text-foreground">
            Închide meniul
          </button>
        </div>
        <ul className="grid flex-[2_1_480px] grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-6 gap-y-0.5">
          {menu.links.map((l) => (
            <li key={l.label}>
              <MenuAnchor link={l} onClick={onClose} className="flex min-h-[52px] flex-col justify-center border-b border-border py-1.5 font-semibold text-navy transition-colors hover:text-accent dark:text-foreground dark:hover:text-accent">
                <span>
                  {l.label}
                  {l.href && l.href !== "explorer" ? " ↗" : ""}
                </span>
                <small className="text-[13px] font-normal text-subtle">{l.note}</small>
              </MenuAnchor>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

function MobileNav({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-5">
      <Brand />
      <button type="button" onClick={onSearch} className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[14px] text-subtle">
        <Search className="size-4" strokeWidth={1.75} />
        Caută situri, stațiuni…
      </button>
      <nav aria-label="Meniu principal" className="grid gap-4">
        {MENUS.map((m) => (
          <div key={m.id} className="grid gap-0.5">
            <p className="px-1 pb-1 text-[12px] font-semibold tracking-[0.1em] text-accent uppercase">{m.label}</p>
            {m.links.map((l) => (
              <MenuAnchor key={l.label} link={l} onClick={onNavigate} className="flex min-h-10 items-center rounded-md px-2 text-[15px] font-medium text-foreground hover:bg-surface-2">
                {l.label}
              </MenuAnchor>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-auto grid gap-2.5">
        <ThemeChoice fill />
        <a href={explorerHref()} className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-navy text-[15px] font-semibold text-white dark:bg-lime dark:text-navy">
          Deschide exploratorul
          <ArrowUpRight className="size-4" strokeWidth={1.75} />
        </a>
        <Link to="acces" onClick={onNavigate} className="flex h-11 items-center justify-center rounded-lg bg-[#2f7d4f] text-[15px] font-semibold text-white">
          Acces la stațiuni
        </Link>
      </div>
    </div>
  );
}

function Header({ onSearch }: { onSearch: () => void }) {
  const { key } = useRouter();
  const current = activeMenu(key);
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => setOpen(null), [key]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header ref={ref} className="sticky top-0 z-[1000] border-b border-border bg-background">
      <Container className="flex items-center justify-between gap-7 py-3">
        <Brand />
        <nav aria-label="Meniu principal" className="hidden items-center gap-0.5 xl:flex">
          {MENUS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-expanded={open === m.id}
              aria-controls="mega"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(open === m.id ? null : m.id);
              }}
              className={cn(
                "inline-flex h-11 items-center gap-1.5 rounded-md px-2.5 text-[15px] font-semibold text-navy transition-colors hover:bg-surface-2 hover:text-accent aria-expanded:bg-surface-2 aria-expanded:text-accent 2xl:px-3 dark:text-foreground dark:hover:text-accent",
                current === m.id && "text-accent dark:text-accent",
              )}
            >
              {m.label}
              <ChevronDown className={cn("size-3 transition-transform", open === m.id && "rotate-180")} strokeWidth={2.5} />
            </button>
          ))}
          <a href={explorerHref()} className="inline-flex h-11 items-center rounded-md px-2.5 text-[15px] font-semibold text-navy transition-colors hover:bg-surface-2 hover:text-accent 2xl:px-3 dark:text-foreground">
            Explorator
          </a>
          <Link to="acces" className="ml-1.5 inline-flex h-11 items-center rounded-lg bg-[#2f7d4f] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1f5a37]">
            Acces la stațiuni
          </Link>
        </nav>
        <Dialog open={sheet} onOpenChange={setSheet}>
          <DialogTrigger asChild>
            <button type="button" aria-label="Deschide meniul" className="grid size-11 shrink-0 place-items-center rounded-lg border border-border text-navy xl:hidden dark:text-foreground">
              <MenuIcon className="size-5" strokeWidth={2} />
            </button>
          </DialogTrigger>
          <SheetContent title="Meniu">
            <MobileNav
              onNavigate={() => setSheet(false)}
              onSearch={() => {
                setSheet(false);
                onSearch();
              }}
            />
          </SheetContent>
        </Dialog>
      </Container>
      {open ? <MegaPanel menuId={open} onClose={() => setOpen(null)} /> : null}
    </header>
  );
}

const FOOTER: { title: string; links: MenuLink[] }[] = [
  {
    title: "Infrastructură",
    links: [
      { label: "Proiectul și infrastructura", note: "", to: "infrastructura" },
      { label: "Stațiunile de cercetare", note: "", to: "statiuni" },
      { label: "Acces la infrastructură", note: "", to: "acces" },
      { label: "Siturile noastre", note: "", to: "situri", hash: "noastre" },
      { label: "Rețeaua LTER România", note: "", to: "situri", hash: "retea" },
      { label: "Stațiile ICOS", note: "", to: "situri", hash: "icos" },
      { label: "Platformele LTSER", note: "", to: "platforme" },
    ],
  },
  {
    title: "Date și instrumente",
    links: [
      { label: "Exploratorul LTSER", note: "", href: "explorer" },
      { label: "Geoportalul LifeWatch", note: "", href: "https://map.lifewatch.ro/" },
      { label: "Catalog de date", note: "", to: "date" },
      { label: "API de acces", note: "", to: "date/api" },
      { label: "LTER România în DEIMS", note: "", href: "https://deims.org/networks/4260f964-0ac4-4406-8adc-5afc06e31779" },
      { label: "ICOS Carbon Portal", note: "", href: "https://data.icos-cp.eu/portal/" },
    ],
  },
  {
    title: "Despre",
    links: [
      { label: "Despre LifeWatch România", note: "", to: "despre" },
      { label: "Proiecte", note: "", to: "proiecte" },
      { label: "LifeWatch, eLTER și ICOS", note: "", to: "", hash: "icos-elter" },
      { label: "Ce construim", note: "", to: "", hash: "idei" },
      { label: "Surse de date și licențe", note: "", to: "", hash: "surse" },
      { label: "Contact", note: "", to: "contact" },
    ],
  },
];

/** The university and the research centre behind the infrastructure, above the footer of every page. */
function Institutions() {
  return (
    <section aria-label="Instituții" className="border-t border-border bg-background">
      <Container className="flex flex-wrap items-center justify-between gap-x-12 gap-y-5 py-7">
        <p className="max-w-[560px] text-[15px] leading-[1.55]">LifeWatch România este infrastructura de cercetare colocată LifeWatch, eLTER, ICOS și MIRRI a Universității din București. Stațiunile de la Brăila și Sinaia sunt coordonate de Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate (RCSES) de la Facultatea de Biologie.</p>
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white px-4 py-3">
          <a href="https://unibuc.ro/" target="_blank" rel="noreferrer">
            <img src={asset(LOGOS.ub.src)} alt={LOGOS.ub.alt} width={259} height={58} className="h-[52px] w-auto" />
          </a>
          <a href="https://rcses.unibuc.ro/" target="_blank" rel="noreferrer">
            <img src={asset(LOGOS.rcses.src)} alt={LOGOS.rcses.alt} width={128} height={64} className="h-[58px] w-auto" />
          </a>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  const { openHelp } = useHelp();
  return (
    <footer className="mt-auto bg-panel text-[#DCE7EB]">
      <Container className="flex flex-wrap gap-10 pt-14 pb-7">
        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-3">
          <span className="w-fit rounded-[10px] bg-white px-3 py-2">
            <img src={asset(LOGOS.lifewatch.src)} alt={LOGOS.lifewatch.alt} width={110} height={60} className="h-[60px] w-auto" />
          </span>
          <b className="font-display text-[22px] font-extrabold text-white">LifeWatch România</b>
          <p className="max-w-[400px] text-[14px] leading-[1.6] text-[#CFDCE2]">Infrastructură de cercetare a Universității din București pentru biodiversitate, ecosisteme și sisteme socio-ecologice, conectată la LifeWatch ERIC, eLTER RI și ICOS.</p>
          <p className="max-w-[400px] text-[14px] leading-[1.6] text-[#CFDCE2]">Centrul de Cercetare în Ecologie Sistemică și Sustenabilitate (RCSES), Facultatea de Biologie, Universitatea din București · Splaiul Independenței 91–95, București</p>
          <div>
            <button type="button" onClick={() => openHelp("Întrebare generală")} className="h-9 rounded-md bg-lime px-3 text-[14px] font-bold text-navy hover:bg-[#a8d662]">
              Scrieți-ne
            </button>
          </div>
        </div>
        {FOOTER.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-[1_1_160px] flex-col gap-2.5 text-[14px]">
            <strong className="text-white">{col.title}</strong>
            {col.links.map((l) => (
              <MenuAnchor key={l.label} link={l} className="text-[#CFDCE2] hover:text-white hover:underline">
                {l.label}
                {l.href && l.href !== "explorer" ? " ↗" : ""}
              </MenuAnchor>
            ))}
          </nav>
        ))}
      </Container>
      <div className="border-t border-[#23485C]">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 text-[12.5px] text-[#A9BCC5]">
          <span>© {LW_GENERATED.slice(0, 4)} Universitatea din București · Date: DEIMS-SDR, ICOS Carbon Portal, iNaturalist, GBIF, NASA POWER, EEA/Copernicus, Natural Earth</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span>Instantaneu de date actualizat la {formatDay(LW_GENERATED)}</span>
            <ThemeChoice className="border-white/15 bg-white/5 [&_button]:text-[#A9BCC5] [&_button:hover]:text-white [&_button[aria-checked=true]]:text-foreground" />
          </div>
        </Container>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState(false);
  const toggle = useCallback(() => setSearch((v) => !v), []);
  useSearchShortcut(toggle);
  return (
    <HelpProvider>
      <div className="flex min-h-dvh flex-col text-[15px]">
        <a href="#continut" className="sr-only z-[2000] rounded-lg bg-foreground px-3 py-2 text-background focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Sari la conținut
        </a>
        <TopBar onSearch={() => setSearch(true)} />
        <Header onSearch={() => setSearch(true)} />
        <main id="continut" tabIndex={-1} className="relative flex-1 focus:outline-none">
          {children}
        </main>
        <Institutions />
        <Footer />
        <SiteSearch open={search} onOpenChange={setSearch} />
        <LangPrompt />
      </div>
    </HelpProvider>
  );
}
