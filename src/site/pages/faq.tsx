// Frequently asked questions, as an accessible accordion.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ } from "../content/faq";
import { explorerHref, Link, useRouter } from "../router";
import { Container, PageIntro, SPRING } from "../components/primitives";

export default function FaqPage() {
  const { hash } = useRouter();
  const [open, setOpen] = useState<string | null>(FAQ[0].id);
  useEffect(() => {
    if (!hash || !FAQ.some((f) => f.id === hash)) return;
    setOpen(hash);
    // Re-align once the previous answer has collapsed and this one has opened.
    const timer = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 380);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <PageIntro eyebrow="Ajutor" title="Întrebări frecvente" lede="Despre infrastructură, platformele LTSER, accesul la date și exploratorul LTSER." />
      <Container>
        <ul className="grid max-w-[1100px] border-t border-border">
          {FAQ.map((f) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id} id={f.id} className="scroll-mt-24 border-b border-border">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${f.id}-panel`}
                    onClick={() => setOpen(isOpen ? null : f.id)}
                    className="flex w-full items-center justify-between gap-6 py-3 text-left text-[16px] font-medium tracking-tight"
                  >
                    {f.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={SPRING} className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-subtle">
                      <Plus className="size-3.5" strokeWidth={1.75} />
                    </motion.span>
                  </button>
                </h2>
                {/* Answers stay in the DOM, so prerendered pages carry every answer for search engines. */}
                <motion.div
                  id={`${f.id}-panel`}
                  role="region"
                  aria-label={f.q}
                  inert={!isOpen}
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={SPRING}
                  className={cn("overflow-hidden", !isOpen && "h-0 opacity-0")}
                >
                  <div className="grid gap-2 pr-10 pb-4">
                    <p className="max-w-[90ch] text-[14.5px] leading-[1.7] text-muted">{f.a}</p>
                    {f.link ? (
                      f.link.explorer ? (
                        <a href={explorerHref(f.link.to)} className={cn("group inline-flex w-fit items-center gap-1.5 text-[14px] font-medium")}>
                          {f.link.label}
                          <ArrowUpRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
                        </a>
                      ) : (
                        <Link to={f.link.to} className="group inline-flex w-fit items-center gap-1.5 text-[14px] font-medium">
                          {f.link.label}
                          <ArrowRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
                        </Link>
                      )
                    ) : null}
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
