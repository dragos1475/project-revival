// Translates the text children and the readable attributes of a host element as it is created.
import { Fragment } from "react";
import { getLang, t } from "./core";

const ATTRS = ["title", "alt", "aria-label", "placeholder", "aria-description", "aria-roledescription", "label"] as const;

function trChildren(c: unknown): unknown {
  if (typeof c === "string") return t(c);
  if (Array.isArray(c)) {
    let changed = false;
    const out = c.map((x) => {
      const y = typeof x === "string" ? t(x) : Array.isArray(x) ? trChildren(x) : x;
      if (y !== x) changed = true;
      return y;
    });
    return changed ? out : c;
  }
  return c;
}

export function translateProps(type: unknown, props: Record<string, unknown>) {
  if (getLang() !== "en" || !props || (typeof type !== "string" && type !== Fragment)) return props;
  // Skip content that must stay verbatim: code samples, scripts and form values.
  if (type === "code" || type === "pre" || type === "script" || type === "style" || type === "textarea" || props["data-no-tr"] != null) return props;
  let next: Record<string, unknown> | null = null;
  const children = trChildren(props.children);
  if (children !== props.children) next = { ...props, children };
  if (typeof type === "string") {
    for (const a of ATTRS) {
      const v = props[a];
      if (typeof v === "string") {
        const tv = t(v);
        if (tv !== v) (next ??= { ...props })[a] = tv;
      }
    }
  }
  return next ?? props;
}
