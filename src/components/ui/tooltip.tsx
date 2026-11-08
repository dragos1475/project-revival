import type { ReactNode } from "react";
import * as RT from "@radix-ui/react-tooltip";

export const TooltipProvider = RT.Provider;

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RT.Root delayDuration={250}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content side={side} sideOffset={6} className="z-[1300] rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-float animate-pop-in">
          {content}
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
