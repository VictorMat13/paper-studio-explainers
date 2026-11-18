// ===========================================================================
// Paper Studio kit, ep05 additions: shared bits for the new components
// (assets, the condensed caps face, the grey-to-black word reveal).
// Nothing here changes an existing export; theme.ts is untouched.
// ===========================================================================
import { staticFile } from "remotion";
import { loadFont as loadCondensed } from "@remotion/google-fonts/RobotoCondensed";
import { loadFont as loadInterBlack } from "@remotion/google-fonts/Inter";
import { EASE, mixColor, prog, theme } from "./theme";

const condensed = loadCondensed("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });
loadInterBlack("normal", { weights: ["900"], subsets: ["latin"] });

/** bold condensed upright face for StackedCaps (the reference's "ANTHROPIC / HACKATHON / WINNER" stack) */
export const CONDENSED = condensed.fontFamily;

const ps = (p: string) => staticFile(`paperstudio/${p}`);

/** ep05 photo cut-outs bundled with the kit (public/paperstudio/photos) */
export const PHOTO05 = {
  /** the Paper Studio robot (white mascot, dark visor), 1134x1574, cut out */
  robot: ps("photos/robot.png"),
} as const;
export const ROBOT_ASPECT = 1134 / 1574;

/**
 * The house word reveal (same feel as KineticCaption): opacity, a small rise, blur clearing and grey to black,
 * one soft ease-out over `settle` frames from `at`.
 */
export const reveal = (f: number, at: number, opts: { settle?: number; rise?: number; blur?: number; ink?: string; ghost?: string } = {}) => {
  const settle = opts.settle ?? theme.caption.settle;
  const rise = opts.rise ?? theme.caption.rise;
  const blur = opts.blur ?? theme.caption.blur;
  const p = prog(f, at, at + settle, EASE.soft);
  const o = prog(f, at, at + Math.max(4, Math.round(settle * 0.6)), EASE.soft);
  return {
    p,
    style: {
      opacity: o,
      transform: `translateY(${(rise * (1 - p)).toFixed(2)}px)`,
      filter: p < 0.995 ? `blur(${(blur * (1 - p)).toFixed(2)}px)` : undefined,
      color: mixColor(opts.ghost ?? theme.color.ghost, opts.ink ?? theme.color.ink, p),
    } as const,
  };
};

/** piecewise eased path through keys {f, ...values}; holds the first/last key outside the range */
export const keyed = <K extends { f: number }>(keys: K[], f: number, get: (k: K) => number, ease: (t: number) => number = EASE.cam) => {
  if (!keys.length) return 0;
  if (f <= keys[0].f) return get(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].f) {
      const t = prog(f, keys[i - 1].f, keys[i].f, ease);
      return get(keys[i - 1]) + (get(keys[i]) - get(keys[i - 1])) * t;
    }
  }
  return get(keys[keys.length - 1]);
};

/** GitHub-style compact count: 987, 2.5k, 21.3k, 294k */
export const ghCount = (n: number) => {
  const v = Math.max(0, n);
  if (v < 1000) return `${Math.round(v)}`;
  if (v < 100000) return `${(Math.floor(v / 100) / 10).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.floor(v / 1000)}k`;
};
