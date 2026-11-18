// ===========================================================================
// HA hand-offs (builder HA, ep08; SMOOTHNESS 2026-11-07): every body's first card, branching on
// bodyOf(useVariant()). HA's language is the turn, now one continuous eased flip over the whole hand-off window
// (the last word's tail plus the silent frames, 17-18 frames): the hook's objects turn away (rotateY 0 -> 90 deg,
// ease in-out over the first 75% of the window) while the body's first card comes round on their back (rotateY
// -90 -> 0, scale 0.9 -> 1, ease in-out over the last 76%); the two overlap through the middle, and one signature
// object rides in front of both without turning (A the slab, B the Claude chips, C the laptop), so no frame is ever
// thin or empty. Everything lands at zero velocity, untransformed, on the last hook frame (the body's frame 0).
// The bodies' FirstCard components are imported read-only (never copied).
// ===========================================================================
import { mix } from "../../../paperstudio";
import { io } from "./smooth";

/** the hand-off point (world px = the body's identity camera) */
export const HO_POINT = { x: 540, y: 890 } as const;
export const PERSP = 2400;

export type Rect = { x: number; y: number; w: number; h: number };
export const centreOf = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** the hand-off clock over [ho, end - 1]: tOut (objects turning away) and tIn (the card coming round), both eased */
export const handoffClock = (f: number, ho: number, end: number) => {
  const last = end - 1;
  const outEnd = ho + Math.round((last - ho) * 0.75);
  const inStart = ho + Math.round((last - ho) * 0.24);
  const tOut = io(f, ho, outEnd);
  const tIn = io(f, inStart, last);
  return {
    started: f >= ho,
    last: f >= last,
    outEnd,
    inStart,
    tOut,
    tIn,
    /** the hook's objects still drawn (until about 85 deg, no hairline frames) */
    objShown: tOut < 0.95,
    /** the body's card drawn (past edge-on) */
    cardShown: f > inStart,
  };
};

/** where an object folds away from: its left edge at its vertical centre (the hook folds away to the left like a door,
 *  so its last slivers sit at the left edge, clear of the card coming round in the middle) */
export const hingeOf = (r: Rect) => ({ x: r.x, y: r.y + r.h / 2 });

/** an object's turn-away transform (origin = hingeOf(rect)): 0 -> 90 deg about its left edge, scale 1 -> 0.92 */
export const turnAwayTf = (tOut: number, objScale = 0.92) =>
  `perspective(${PERSP}px) rotateY(${(90 * tOut).toFixed(2)}deg) scale(${mix(1, objScale, tOut).toFixed(4)})`;

/** the card's come-round pose (origin = HO_POINT): -90 -> 0 deg, scale `from` -> 1 */
export const comeRound = (tIn: number, from = 0.9) => ({
  deg: -90 * (1 - tIn),
  s: mix(from, 1, tIn),
  tf: tIn >= 1 ? "" : `perspective(${PERSP}px) rotateY(${(-90 * (1 - tIn)).toFixed(2)}deg) scale(${mix(from, 1, tIn).toFixed(4)})`,
});

/** where a world point of a card drawn with comeRound(deg, s) about HO_POINT appears on the world plane (CSS
 *  perspective(P) rotateY(deg) scale(s), origin HO_POINT) */
export const projectRound = (p: { x: number; y: number }, deg: number, s: number) => {
  const th = (deg * Math.PI) / 180;
  const dx = (p.x - HO_POINT.x) * s;
  const dy = (p.y - HO_POINT.y) * s;
  const x1 = dx * Math.cos(th);
  const z1 = -dx * Math.sin(th);
  const k = PERSP / (PERSP - z1);
  return { x: HO_POINT.x + x1 * k, y: HO_POINT.y + dy * k, k };
};
