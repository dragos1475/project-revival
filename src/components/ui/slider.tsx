import * as RSlider from "@radix-ui/react-slider";

export function Slider({ value, onValueChange, min = 0, max = 1, step = 0.1, ariaLabel }: { value: number; onValueChange: (v: number) => void; min?: number; max?: number; step?: number; ariaLabel: string }) {
  return (
    <RSlider.Root value={[value]} onValueChange={(v) => onValueChange(v[0])} min={min} max={max} step={step} className="relative flex h-5 w-full touch-none select-none items-center">
      <RSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-surface-3">
        <RSlider.Range className="absolute h-full rounded-full bg-accent" />
      </RSlider.Track>
      <RSlider.Thumb aria-label={ariaLabel} className="block size-4 rounded-full border border-border-strong bg-surface shadow-card transition-transform hover:scale-110 active:scale-95" />
    </RSlider.Root>
  );
}
