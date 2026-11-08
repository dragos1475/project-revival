// Date and time-slot picker for snapshot maps, with previous / next step and "latest".
// Works on wall-clock strings (YYYY-MM-DDTHH:mm) so the dataset's own zone is preserved.
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { addMinutes, clampWall, wallDate, wallTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { inputClass } from "@/components/ui/misc";

export function TimeStepper({ value, min, max, stepMinutes, onChange }: { value: string | null; min?: string; max?: string; stepMinutes: number; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const daily = stepMinutes >= 1440;
  const slots = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    if (daily) return out;
    for (let m = 0; m < 1440; m += stepMinutes) {
      const v = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      out.push({ value: v, label: v });
    }
    return out;
  }, [stepMinutes, daily]);

  const commit = (wall: string) => {
    let v = wall;
    if (daily) v = `${wallDate(v)}T00:00`;
    else {
      const [hh, mm] = wallTime(v).split(":").map(Number);
      const mins = Math.floor((hh * 60 + mm) / stepMinutes) * stepMinutes;
      v = `${wallDate(v)}T${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    }
    v = clampWall(v, min, max);
    if (v !== value) onChange(v);
  };

  if (!value) return <div className="h-8 rounded-lg bg-surface-2" />;
  const prevDisabled = !!min && addMinutes(value, -stepMinutes) < min;
  const nextDisabled = !!max && addMinutes(value, stepMinutes) > max;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="icon" aria-label={t("time.prev")} disabled={prevDisabled} onClick={() => commit(addMinutes(value, -stepMinutes))}>
          <ChevronLeft strokeWidth={1.75} />
        </Button>
        <input
          type="date"
          aria-label={t("time.date")}
          value={wallDate(value)}
          min={min ? wallDate(min) : undefined}
          max={max ? wallDate(max) : undefined}
          onChange={(e) => e.target.value && commit(`${e.target.value}T${daily ? "00:00" : wallTime(value)}`)}
          className={cn(inputClass, "tabular flex-1")}
        />
        {!daily ? (
          <div className="w-[84px]">
            <Select ariaLabel={t("time.time")} value={wallTime(value)} onValueChange={(v) => commit(`${wallDate(value)}T${v}`)} options={slots} className="tabular" />
          </div>
        ) : null}
        <Button variant="secondary" size="icon" aria-label={t("time.next")} disabled={nextDisabled} onClick={() => commit(addMinutes(value, stepMinutes))}>
          <ChevronRight strokeWidth={1.75} />
        </Button>
      </div>
      <Button variant="link" size="sm" className="justify-self-start text-xs" disabled={!max || value === max} onClick={() => max && commit(max)}>
        <SkipForward strokeWidth={1.75} />
        {t("time.latest")}
      </Button>
    </div>
  );
}
