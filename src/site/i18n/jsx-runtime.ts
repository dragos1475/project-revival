// JSX runtime of the project: React's, with English text swapped in on English pages.
import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { translateProps } from "./translate-props";

type Jsx = typeof reactJsx;
export const jsx: Jsx = (type, props, key) => reactJsx(type, translateProps(type, props as Record<string, unknown>), key);
export const jsxs: Jsx = (type, props, key) => reactJsxs(type, translateProps(type, props as Record<string, unknown>), key);
export { Fragment };
export type { JSX } from "react/jsx-runtime";
