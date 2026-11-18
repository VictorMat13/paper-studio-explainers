// BodyA motion helpers (local). Bezier only, no springs.
import { EASE, mix, prog } from "../../../paperstudio";

export type K = { f: number; v: number };
/** eased path through {f, v} keys (holds outside; keys forced forward so a squeezed timing never runs backwards) */
export const path = (keys: K[], f: number, ease: (t: number) => number = EASE.cam) => {
  if (!keys.length) return 0;
  const ks = keys.map((k, i) => ({ ...k, f: Math.max(k.f, ...keys.slice(0, i).map((p) => p.f)) }));
  if (f <= ks[0].f) return ks[0].v;
  for (let i = 1; i < ks.length; i++) if (f <= ks[i].f) return mix(ks[i - 1].v, ks[i].v, prog(f, ks[i - 1].f, ks[i].f, ease));
  return ks[ks.length - 1].v;
};
/** the same for arrays of numbers (all keys the same length) */
export const pathV = (keys: { f: number; v: readonly number[] }[], f: number, ease: (t: number) => number = EASE.cam) =>
  keys[0].v.map((_, i) => path(keys.map((k) => ({ f: k.f, v: k.v[i] })), f, ease));
/** 0 -> 1 -> 0 over [a, a + d) */
export const pulse = (f: number, a: number, d: number) => (f < a || f >= a + d ? 0 : Math.sin(Math.PI * ((f - a) / d)));
/** gentle sine drift */
export const sway = (f: number, amp: number, period: number, seed = 0) => amp * Math.sin(((f + seed * 23) / period) * Math.PI * 2);
/** damped swing (a tag on a string): starts at `amp` deg at `at`, settles over `dur` */
export const swing = (f: number, at: number, amp: number, period = 22, dur = 60) => {
  if (f < at) return 0;
  const t = f - at;
  const decay = 1 - prog(f, at, at + dur, EASE.drift);
  return amp * Math.sin((t / period) * Math.PI * 2) * decay;
};
/** polyline helpers */
export type P = [number, number];
export const polyLen = (pts: P[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** the polyline drawn up to fraction t of its length, and its tip */
export const polyUpTo = (pts: P[], t: number): { pts: P[]; tip: P } => {
  const L = polyLen(pts) * Math.max(0, Math.min(1, t));
  const out: P[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= L) {
      const u = seg > 0 ? (L - acc) / seg : 0;
      const tip: P = [mix(pts[i - 1][0], pts[i][0], u), mix(pts[i - 1][1], pts[i][1], u)];
      out.push(tip);
      return { pts: out, tip };
    }
    acc += seg;
    out.push(pts[i]);
  }
  return { pts: out, tip: pts[pts.length - 1] };
};
export const dOf = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

/** mix two #RRGGBB colours, returning #RRGGBB (so mixes can be chained; the kit's mixColor returns rgb()) */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(mix(v, pb[i], Math.max(0, Math.min(1, t)))).toString(16).padStart(2, "0")).join("")}`;
};

/** SMOOTHNESS (Victor 2026-11-07): the one in-out curve for entrances, exits, pops and fades (zero velocity at both
 *  ends, no overshoot); camera moves keep EASE.cam, drifts EASE.drift */
import { Easing } from "remotion";
export const SM = Easing.bezier(0.4, 0, 0.2, 1);

/** a smooth pop: children scale 0.6 -> 1 about (ox, oy) over `dur` (>= 12) frames from `at`, opacity rising with it */
export const popP = (f: number, at: number, dur = 12) => {
  const t = Math.max(0, Math.min(1, (f - at) / dur));
  return SM(t);
};
