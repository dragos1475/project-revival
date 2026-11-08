import { Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useRoute } from "@/hooks/use-route";
import { useTheme } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/misc";
import { AppShell } from "@/components/app-shell";
import { resolveBackend } from "@/api/status";
import { findRoute, ROUTES } from "@/explorer-routes";

function ViewFallback() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const { t, lang } = useI18n();
  const def = findRoute(route.path) ?? ROUTES[0];
  const theme = useTheme();

  useEffect(() => {
    void resolveBackend("lifewatch");
    void resolveBackend("ltser");
  }, []);

  useEffect(() => {
    document.title = def.path ? `${t(def.title)} · LTSER Explorer` : "LTSER Explorer · LifeWatch România";
  }, [def, t]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [def.path]);

  const View = def.view;
  return (
    <TooltipProvider>
      <AppShell path={def.path}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${def.path}:${lang}:${route.path === def.path ? route.query.get("statie") ?? "" : ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Suspense fallback={<ViewFallback />}>
              <View route={route} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <Toaster position="bottom-right" theme={theme} toastOptions={{ classNames: { toast: "!rounded-xl !border-border !bg-surface !text-foreground !shadow-float font-sans", description: "!text-muted" } }} />
    </TooltipProvider>
  );
}
