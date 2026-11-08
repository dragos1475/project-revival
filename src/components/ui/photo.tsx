import { useCallback, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Image with a fixed aspect ratio, inset ring, hover zoom and a designed fallback state. */
export function Photo({
  src,
  srcSet,
  sizes,
  alt,
  className,
  imgClassName,
  fallback,
  priority = false,
}: {
  src: string | null;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // A prerendered or cached image can finish loading before React attaches onLoad during hydration,
  // which left it at opacity 0. Check once the element is attached; naturalWidth rules out lazy
  // images that have not been fetched yet.
  const syncLoaded = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  const show = src && !failed;
  return (
    <div className={cn("group/photo relative overflow-hidden bg-surface-2", className)}>
      {show ? (
        <img
          ref={syncLoaded}
          data-photo
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "size-full object-cover transition-[transform,opacity] duration-500 ease-out group-hover/photo:scale-[1.02]",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : (
        <div className="relative grid size-full place-items-center">
          <div aria-hidden className="dot-grid absolute inset-0" />
          <div className="relative grid justify-items-center gap-2 px-4 text-center">
            <ImageOff className="size-4 text-subtle" strokeWidth={1.5} />
            <span className="text-xs text-muted">{fallback}</span>
          </div>
        </div>
      )}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10 dark:ring-white/10" />
    </div>
  );
}
