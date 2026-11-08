import * as RC from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

export function Checkbox({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; id?: string }) {
  return (
    <RC.Root
      id={id}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className="grid size-4 shrink-0 place-items-center rounded-[5px] border border-border-strong bg-surface transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <RC.Indicator>
        <Check className="size-3 text-accent-foreground" strokeWidth={2.5} />
      </RC.Indicator>
    </RC.Root>
  );
}
