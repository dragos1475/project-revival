// Searchable, sortable, paginated table with Copy, CSV and Excel export
// (the DT::datatable "Buttons" configuration used throughout ltser).
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, FileSpreadsheet, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { copyRows, downloadCSV, downloadXLSX } from "@/lib/export";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { inputClass } from "@/components/ui/misc";

export interface TableColumn<Row> {
  key: keyof Row & string;
  label: string;
  numeric?: boolean;
  wrap?: boolean;
  render?: (value: Row[keyof Row], row: Row) => ReactNode;
}

type Sort = { key: string; dir: 1 | -1 } | null;

export function DataTable<Row extends Record<string, unknown>>({
  columns, rows, filename, pageSizes = [10, 25, 100, -1], initialPageSize = 10, onRowClick, activeRow, toolbar,
}: {
  columns: TableColumn<Row>[];
  rows: Row[];
  filename: string;
  pageSizes?: number[];
  initialPageSize?: number;
  onRowClick?: (row: Row) => void;
  activeRow?: (row: Row) => boolean;
  toolbar?: ReactNode;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [size, setSize] = useState(initialPageSize);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;
    if (query) {
      const q = query.toLowerCase();
      out = out.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
    }
    if (sort) {
      const { key, dir } = sort;
      out = [...out].sort((a, b) => {
        const x = a[key], y = b[key];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
    }
    return out;
  }, [rows, columns, query, sort]);

  const per = size === -1 ? Math.max(1, filtered.length) : size;
  const pages = Math.max(1, Math.ceil(filtered.length / per));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * per, current * per + per);
  const exportCols = columns.map((c) => ({ key: c.key, label: c.label }));

  const onSort = (key: string) => {
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
    setPage(0);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={t("table.search")}
              aria-label={t("table.search")}
              className={cn(inputClass, "w-56 pl-8")}
            />
          </div>
          <div className="w-32">
            <Select
              ariaLabel={t("table.pageSize")}
              value={String(size)}
              onValueChange={(v) => {
                setSize(Number(v));
                setPage(0);
              }}
              options={pageSizes.map((n) => ({ value: String(n), label: n === -1 ? t("table.all") : t("table.rows", { n }) }))}
            />
          </div>
          {toolbar}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={async () => {
              try {
                await copyRows(exportCols, filtered);
                toast.success(t("table.copied", { n: filtered.length }));
              } catch {
                toast.error(t("table.copyFailed"));
              }
            }}
          >
            <Copy strokeWidth={1.75} />
            {t("table.copy")}
          </Button>
          <Button size="sm" onClick={() => {
            downloadCSV(exportCols, filtered, `${filename}.csv`);
            toast.success(t("table.downloaded", { file: `${filename}.csv` }));
          }}>
            <FileText strokeWidth={1.75} />
            CSV
          </Button>
          <Button size="sm" onClick={() => {
            downloadXLSX(exportCols, filtered, `${filename}.xlsx`);
            toast.success(t("table.downloaded", { file: `${filename}.xlsx` }));
          }}>
            <FileSpreadsheet strokeWidth={1.75} />
            Excel
          </Button>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : "none"} className={cn("border-b border-border px-3 py-2 text-left text-[11px] font-medium whitespace-nowrap text-muted", c.numeric && "text-right")}>
                    <button type="button" onClick={() => onSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", c.numeric && "flex-row-reverse")}>
                      {c.label}
                      {active ? (sort!.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.length ? (
              slice.map((r, i) => (
                <tr
                  key={i}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn("border-b border-border last:border-0 transition-colors hover:bg-surface-2/70", onRowClick && "cursor-pointer", activeRow?.(r) && "bg-accent-soft")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2 align-top", c.numeric ? "tabular text-right whitespace-nowrap" : c.wrap ? "min-w-[240px] text-muted" : "whitespace-nowrap")}>
                      {c.render ? c.render(r[c.key], r) : String(r[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">{t("table.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-subtle">
        <span className="tabular">{t("table.info", { from: filtered.length ? current * per + 1 : 0, to: Math.min(filtered.length, (current + 1) * per), total: filtered.length })}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={t("table.prev")} disabled={current === 0} onClick={() => setPage(current - 1)}>
            <ChevronLeft strokeWidth={1.75} />
          </Button>
          <span className="tabular px-1">{current + 1} / {pages}</span>
          <Button variant="ghost" size="icon-sm" aria-label={t("table.next")} disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            <ChevronRight strokeWidth={1.75} />
          </Button>
        </div>
      </div>
    </div>
  );
}
