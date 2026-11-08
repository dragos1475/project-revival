// Photo grid with a lightbox: arrows and keys move through the list, Esc closes it.
import { useCallback, useEffect, useState } from "react";
import * as RD from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { asset, type LwImage } from "../content/lw";

export function useLightbox(list: LwImage[]) {
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((i: number) => setIndex(i), []);
  const node = <Lightbox list={list} index={index} onIndex={setIndex} />;
  return { open, node };
}

function Lightbox({ list, index, onIndex }: { list: LwImage[]; index: number | null; onIndex: (i: number | null) => void }) {
  const n = list.length;
  const go = useCallback((d: number) => onIndex(index == null ? null : (index + d + n) % n), [index, n, onIndex]);
  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);
  const it = index == null ? null : list[index];
  const btn = "absolute grid size-12 place-items-center rounded-lg border border-[#4E6B7C] bg-navy/60 text-white transition-colors hover:bg-navy-2";
  return (
    <RD.Root open={index != null} onOpenChange={(o) => !o && onIndex(null)}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[3000] bg-[rgba(6,18,26,0.92)] animate-fade-in" />
        <RD.Content aria-describedby={undefined} className="fixed inset-0 z-[3001] flex items-center justify-center px-2 py-14 focus:outline-none sm:px-16">
          <RD.Title className="sr-only">Galerie foto</RD.Title>
          {it ? (
            <figure className="m-0 flex max-h-full max-w-full flex-col items-center gap-2.5">
              <img src={asset(it.src)} alt={it.alt} className="max-h-[calc(100vh-150px)] max-w-full rounded-md" />
              <figcaption className="text-center text-[14px] text-[#DCE7EB]">
                {it.alt}
                {it.credit ? ` · ${it.credit}` : ""} ({(index ?? 0) + 1} / {n})
              </figcaption>
            </figure>
          ) : null}
          <RD.Close className={cn(btn, "top-4 right-4")} aria-label="Închide galeria">
            <X className="size-5" strokeWidth={2} />
          </RD.Close>
          {n > 1 ? (
            <>
              <button type="button" className={cn(btn, "top-1/2 left-3 -translate-y-1/2")} aria-label="Fotografia anterioară" onClick={() => go(-1)}>
                <ChevronLeft className="size-5" strokeWidth={2} />
              </button>
              <button type="button" className={cn(btn, "top-1/2 right-3 -translate-y-1/2")} aria-label="Fotografia următoare" onClick={() => go(1)}>
                <ChevronRight className="size-5" strokeWidth={2} />
              </button>
            </>
          ) : null}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Grid of thumbnails; a click opens the lightbox at that photo. */
export function Gallery({ list, onOpen, start = 0, className }: { list: LwImage[]; onOpen: (i: number) => void; start?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2", className)}>
      {list.slice(start).map((im, i) => (
        <button key={im.src} type="button" onClick={() => onOpen(i + start)} aria-label={`Mărește fotografia: ${im.alt}`} className="group aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg bg-surface-3">
          <img loading="lazy" src={asset(im.thumb || im.src)} alt={im.alt} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </button>
      ))}
    </div>
  );
}
