import { EASE, mix, prog } from "./theme";

/**
 * Shared entrance description. Frames are relative to the enclosing <Sequence>.
 * Leave `enter` undefined on a component to draw it already at rest.
 */
export type Enter = {
  /** frame the entrance starts */
  at: number;
  /** frames it takes (default 14) */
  dur?: number;
  /** direction it arrives from (default "bottom") */
  from?: "bottom" | "top" | "left" | "right" | "scale" | "fade";
  /** travel distance in px (default 60; edges use the full distance given) */
  dist?: number;
  /** fade in with the move (default true; cut-outs and wide pans set false) */
  fade?: boolean;
};

export type Exit = {
  at: number;
  dur?: number;
  to?: "bottom" | "top" | "left" | "right" | "scale" | "fade";
  dist?: number;
  fade?: boolean;
};

/** translate/scale/opacity of an entrance (then optional exit) at frame f */
export const enterState = (f: number, enter?: Enter, exit?: Exit) => {
  let dx = 0;
  let dy = 0;
  let s = 1;
  let o = 1;
  if (enter) {
    const p = prog(f, enter.at, enter.at + (enter.dur ?? 14), EASE.enter);
    const d = enter.dist ?? 60;
    const r = 1 - p;
    switch (enter.from ?? "bottom") {
      case "bottom":
        dy = d * r;
        break;
      case "top":
        dy = -d * r;
        break;
      case "left":
        dx = -d * r;
        break;
      case "right":
        dx = d * r;
        break;
      case "scale":
        s = mix(0.6, 1, p);
        break;
      case "fade":
        break;
    }
    if (enter.fade !== false) o = Math.min(1, p * 1.6);
  }
  if (exit) {
    const q = prog(f, exit.at, exit.at + (exit.dur ?? 12), EASE.exit);
    const d = exit.dist ?? 60;
    switch (exit.to ?? "fade") {
      case "bottom":
        dy += d * q;
        break;
      case "top":
        dy -= d * q;
        break;
      case "left":
        dx -= d * q;
        break;
      case "right":
        dx += d * q;
        break;
      case "scale":
        s *= mix(1, 0.3, q);
        break;
      case "fade":
        break;
    }
    if (exit.fade !== false) o *= 1 - q;
  }
  return { dx, dy, s, o, transform: `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) scale(${s.toFixed(4)})` };
};

/** a gentle ambient drift of a few px (layer 3 of every shot); seed offsets the phase */
export const drift = (f: number, amp = 3, period = 90, seed = 0) => ({
  x: amp * Math.sin(((f + seed * 17) / period) * Math.PI * 2),
  y: amp * 0.6 * Math.cos(((f + seed * 29) / (period * 1.3)) * Math.PI * 2),
});
