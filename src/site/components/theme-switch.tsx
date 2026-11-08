// Theme controls: a one-click switch for the header and a three-way choice for menus and footer.
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setThemePref, useTheme, useThemePref, type ThemePref } from "@/lib/theme";
import { Segmented } from "@/components/ui/segmented";
import { SPRING } from "./primitives";

export function ThemeButton({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setThemePref(dark ? "light" : "dark")}
      aria-label={dark ? "Comută la modul luminos" : "Comută la modul întunecat"}
      title={dark ? "Mod luminos" : "Mod întunecat"}
      className={cn("grid size-9 place-items-center overflow-hidden rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={SPRING} className="grid place-items-center">
          {dark ? <Sun className="size-4" strokeWidth={1.75} /> : <Moon className="size-4" strokeWidth={1.75} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "system", label: "Sistem" },
  { value: "light", label: "Luminos" },
  { value: "dark", label: "Întunecat" },
];

export function ThemeChoice({ fill, className }: { fill?: boolean; className?: string }) {
  const pref = useThemePref();
  return <Segmented ariaLabel="Mod de afișare" value={pref} onChange={setThemePref} options={OPTIONS} fill={fill} className={className} />;
}
