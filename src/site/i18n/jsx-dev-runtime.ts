// Development JSX runtime: React's, with English text swapped in on English pages.
import { Fragment, jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import { translateProps } from "./translate-props";

export const jsxDEV: typeof reactJsxDEV = (type, props, key, isStatic, source, self) =>
  reactJsxDEV(type, translateProps(type, props as Record<string, unknown>), key, isStatic, source, self);
export { Fragment };
export type { JSX } from "react/jsx-dev-runtime";
