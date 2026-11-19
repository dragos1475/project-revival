import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { LOGO_ARC, LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";

// The intro plays on the first page the visitor opens; later mounts (client-side navigation) show the logo still.
let introPlayed = false;

/**
 * LifeWatch logo: globe, arrow around it, microscope and leaf.
 * `animate` plays the intro (arrow travels round the globe, leaf drifts down under the lens);
 * `hero` also keeps the leaf floating gently afterwards.
 */
export function LogoMark({
  className,
  animate = false,
  variant = "mark",
}: {
  className?: string;
  animate?: boolean | "once";
  variant?: "mark" | "hero";
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const play = animate === "once" ? !introPlayed : animate;
  useEffect(() => {
    if (animate === "once") introPlayed = true;
  }, [animate]);
  const { cx, cy } = LOGO_ARC;
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={cn("lw-logo", className)}
      data-play={play || undefined}
      data-variant={variant}
      aria-hidden
    >
      {play ? (
        <mask
          id={`${id}-reveal`}
          maskUnits="userSpaceOnUse"
          x="-200"
          y="-400"
          width="1400"
          height="1600"
        >
          {/* Follows the band from its tail at the top, anticlockwise to the arrowhead. */}
          <path
            className="lw-logo-reveal"
            d="M448.5 39.9A415 415 0 1 0 549.3 860.5"
            pathLength={1}
            fill="none"
            stroke="#fff"
            strokeWidth="96"
          />
        </mask>
      ) : null}
      <path className="lw-logo-globe" d={LOGO_PATHS.globe} />
      <path
        className="lw-logo-band"
        d={LOGO_PATHS.band}
        mask={play ? `url(#${id}-reveal)` : undefined}
      />
      <g transform={`translate(${cx} ${cy})`}>
        <g className="lw-logo-head">
          <path d={LOGO_PATHS.head} transform={`translate(${-cx} ${-cy})`} />
        </g>
      </g>
      {/* Leaf sits behind the microscope, so while it drifts down it passes behind the arm and comes out under the lens. */}
      <path className="lw-logo-leaf" d={LOGO_PATHS.leaf} />
      <path className="lw-logo-scope" d={LOGO_PATHS.scope} />
    </svg>
  );
}
