// Reusable content blocks: service status, copyable code, photo with credit, arrow links.
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Photo as PhotoFrame } from "@/components/ui/photo";
import { StatusDot } from "@/components/ui/misc";
import { photoSrc, photoSrcSet, type Photo } from "@/lib/photos";
import { Link } from "../router";

type Status = { mode: "pending" | "live" | "demo"; latency: number | null };

/** Probes GET /health on the LifeWatch API through the same-origin proxy. Browser only. */
export function useLifewatchStatus() {
  const [status, setStatus] = useState<Status>({ mode: "pending", latency: null });
  useEffect(() => {
    const base = (window.LTSER_CONFIG?.lifewatchApi ?? "/lifewatch-api").replace(/\/+$/, "");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), window.LTSER_CONFIG?.probeTimeoutMs ?? 2500);
    const started = performance.now();
    fetch(`${base}/health`, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { status?: string } | null) => setStatus({ mode: body?.status === "healthy" ? "live" : "demo", latency: Math.round(performance.now() - started) }))
      .catch(() => setStatus({ mode: "demo", latency: null }))
      .finally(() => window.clearTimeout(timer));
    return () => ctrl.abort();
  }, []);
  return status;
}

export function ServiceStatus({ className }: { className?: string }) {
  const s = useLifewatchStatus();
  const label = s.mode === "live" ? "API LifeWatch activ" : s.mode === "demo" ? "API indisponibil, date demonstrative" : "Se verifică API-ul LifeWatch";
  const title = s.mode === "demo" ? "Serviciul LifeWatch nu răspunde acum. Exploratorul afișează date demonstrative, marcate ca atare." : undefined;
  return (
    <span role="status" title={title} className={cn("inline-flex items-center gap-2 rounded-md border border-border bg-surface/90 px-2 py-1 text-[12px] text-muted shadow-card backdrop-blur", className)}>
      <StatusDot mode={s.mode} />
      <span className="truncate">{label}</span>
      {s.mode === "live" && s.latency !== null ? <span className="tabular text-[11px] text-subtle">{s.latency} ms</span> : null}
    </span>
  );
}

export function CodeBlock({ code, label, className }: { code: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copiat în clipboard", { description: label });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copierea nu este permisă de browser");
    }
  };
  return (
    <div className={cn("group/code relative overflow-hidden rounded-xl border border-border bg-surface-2/70", className)}>
      {label ? <div className="flex h-8 items-center border-b border-border px-3 text-[12px] text-subtle">{label}</div> : null}
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-foreground"><code>{code}</code></pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiază"
        className={cn("absolute right-1.5 grid size-6 place-items-center rounded-md border border-border bg-surface text-subtle shadow-card transition-colors hover:text-foreground", label ? "top-1" : "top-1.5")}
      >
        {copied ? <Check className="size-3.5 text-accent" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.75} />}
      </button>
    </div>
  );
}

export function CopyValue({ value, display, label }: { value: string; display?: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value).then(() => toast.success(`${label} copiat`, { description: value }), () => toast.error("Copierea nu este permisă de browser"))}
      className="group inline-flex items-center gap-1.5 text-left text-foreground"
    >
      <span>{display ?? value}</span>
      <Copy className="size-3 text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={1.75} />
    </button>
  );
}

/** Photograph with a fixed ratio, hover zoom and the photographer's credit. */
/** credit: "corner" links to the photo page; "label" is plain text, for photos inside another link. */
/** creditClassName styles the credit, for example to hide it on thumbnails at small widths. */
export function CreditedPhoto({ photo, alt, className, sizes = "100vw", priority, credit = "corner", creditClassName }: { photo: Photo; alt: string; className?: string; sizes?: string; priority?: boolean; credit?: "corner" | "label" | "none"; creditClassName?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <PhotoFrame src={photoSrc(photo, 1200)} srcSet={photoSrcSet(photo)} sizes={sizes} alt={alt} fallback={photo.location} className="size-full" priority={priority} />
      {credit === "corner" ? (
        <a href={photo.page} target="_blank" rel="noreferrer" className={cn("absolute right-2.5 bottom-2.5 rounded-md bg-zinc-950/50 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur transition-colors hover:bg-zinc-950/70", creditClassName)}>
          {photo.author} · Unsplash
        </a>
      ) : credit === "label" ? (
        <span className={cn("absolute right-2.5 bottom-2.5 rounded-md bg-zinc-950/50 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur", creditClassName)}>{photo.author} · Unsplash</span>
      ) : null}
    </div>
  );
}

export function ArrowLink({ to, hash, children, className }: { to: string; hash?: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} hash={hash} className={cn("group inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground", className)}>
      {children}
      <ArrowRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} />
    </Link>
  );
}

export function ExplorerArrow({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} className={cn("group inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground", className)}>
      {children}
      <ArrowUpRight className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.75} />
    </a>
  );
}
