import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

/** Radius math: track rounded-lg (8px) with p-0.5 (2px), pill rounded-md (6px). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  fill = false,
  className,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  fill?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-lg border border-border bg-surface-2 p-0.5", fill && "grid w-full auto-cols-fr grid-flow-col", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(o.value)}
            className="relative h-7 whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted transition-colors hover:text-foreground aria-checked:text-foreground"
          >
            {active ? <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-md bg-surface shadow-card ring-1 ring-border" /> : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
