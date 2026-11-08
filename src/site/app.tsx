import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { SiteLayout } from "./components/layout";
import { SPRING } from "./components/primitives";
import { PageMotionProvider, sceneForRoute } from "./components/page-motion";
import { RouterProvider, useRouter } from "./router";
import { documentTitle, findSiteRoute, NOT_FOUND_DESCRIPTION } from "./routes";
import NotFoundPage from "./pages/not-found";
import { langOfKey, setLang, t } from "./i18n/core";

function Pages() {
  const { key, hash } = useRouter();
  const route = findSiteRoute(key);
  const Page = route?.Page ?? NotFoundPage;
  const first = useRef(true);

  useEffect(() => {
    document.title = documentTitle(route);
    document.querySelector('meta[name="description"]')?.setAttribute("content", t(route?.description ?? NOT_FOUND_DESCRIPTION));
    if (first.current) {
      first.current = false;
      return;
    }
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
    else window.scrollTo({ top: 0 });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SiteLayout>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }} transition={SPRING}>
          <PageMotionProvider scene={sceneForRoute(route ? key : null)}>
            <Page />
          </PageMotionProvider>
        </motion.div>
      </AnimatePresence>
    </SiteLayout>
  );
}

function Toasts() {
  const theme = useTheme();
  return <Toaster position="bottom-right" theme={theme} toastOptions={{ classNames: { toast: "!rounded-xl !border-border !bg-surface !text-foreground !shadow-float font-sans", description: "!text-muted" } }} />;
}

export function SiteApp({ initialKey }: { initialKey: string }) {
  // The language follows the first page; switching language loads the other page from scratch.
  setLang(langOfKey(initialKey));
  return (
    <RouterProvider initialKey={initialKey}>
      <TooltipProvider>
        <Pages />
      </TooltipProvider>
      <Toasts />
    </RouterProvider>
  );
}
