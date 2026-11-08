import * as RS from "@radix-ui/react-select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  hint?: string;
}

/** Radius math: content rounded-xl (12px) with p-1 (4px), items rounded-lg (8px). */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className,
  disabled,
}: {
  value: string | undefined;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const groups = new Map<string, SelectOption[]>();
  for (const o of options) {
    const g = o.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(o);
  }
  return (
    <RS.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RS.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 text-left text-[13px] shadow-card transition-colors hover:border-border-strong disabled:opacity-50 data-[placeholder]:text-subtle",
          className,
        )}
      >
        <span className="min-w-0 truncate">
          <RS.Value placeholder={placeholder} />
        </span>
        <RS.Icon>
          <ChevronsUpDown className="size-3.5 text-subtle" strokeWidth={1.75} />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={4}
          className="z-[1200] max-h-[min(var(--radix-select-content-available-height),380px)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface shadow-float animate-pop-in"
        >
          <RS.Viewport className="p-1">
            {[...groups.entries()].map(([group, items], gi) => (
              <RS.Group key={group || gi}>
                {group ? <RS.Label className="px-2 pt-2 pb-1 text-[11px] font-medium text-subtle">{group}</RS.Label> : null}
                {items.map((o) => (
                  <RS.Item
                    key={o.value}
                    value={o.value}
                    className="relative flex cursor-default select-none items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-[13px] outline-none data-[highlighted]:bg-surface-2 data-[state=checked]:font-medium"
                  >
                    <RS.ItemText>{o.label}</RS.ItemText>
                    {o.hint ? <span className="tabular ml-auto text-[11px] text-subtle">{o.hint}</span> : null}
                    <RS.ItemIndicator className="absolute right-2 inline-flex">
                      <Check className="size-3.5 text-accent" strokeWidth={2} />
                    </RS.ItemIndicator>
                  </RS.Item>
                ))}
              </RS.Group>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
