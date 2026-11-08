import type { ReactNode } from "react";
import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;
export const DialogTitle = RD.Title;
export const DialogDescription = RD.Description;

const overlay = "fixed inset-0 z-[1400] bg-zinc-950/40 backdrop-blur-[2px] animate-fade-in";

export function DialogContent({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <RD.Portal>
      <RD.Overlay className={overlay} />
      <RD.Content
        aria-label={label}
        className={cn("fixed top-[14vh] left-1/2 z-[1410] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface shadow-float animate-pop-in focus:outline-none", className)}
      >
        {children}
      </RD.Content>
    </RD.Portal>
  );
}

/** Left sheet for the mobile navigation. */
export function SheetContent({ children, title }: { children: ReactNode; title: string }) {
  return (
    <RD.Portal>
      <RD.Overlay className={overlay} />
      <RD.Content className="fixed inset-y-0 left-0 z-[1410] flex w-[min(300px,86vw)] flex-col border-r border-border bg-background shadow-float animate-fade-in focus:outline-none">
        <RD.Title className="sr-only">{title}</RD.Title>
        <RD.Close className="absolute top-3 right-3 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground" aria-label="Închide">
          <X className="size-4" strokeWidth={1.75} />
        </RD.Close>
        {children}
      </RD.Content>
    </RD.Portal>
  );
}
