import type { ReactNode } from "react";
import * as RP from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export const Popover = RP.Root;
export const PopoverTrigger = RP.Trigger;

export function PopoverContent({ children, className, align = "end" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <RP.Portal>
      <RP.Content align={align} sideOffset={6} className={cn("z-[1200] w-64 rounded-xl border border-border bg-surface p-1 shadow-float animate-pop-in focus:outline-none", className)}>
        {children}
      </RP.Content>
    </RP.Portal>
  );
}
