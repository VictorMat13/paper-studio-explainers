// BodyB paper material (pure, no timing): the faint fibre texture and the soft inner edge for card faces.
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { mix, prog, theme } from "../../../paperstudio";

/** SMOOTHNESS: the one in-out curve for every BodyB motion (starts and ends at rest; no linear, no springs) */
export const EIO = Easing.bezier(0.4, 0, 0.2, 1);

/** faint paper fibre (SVG noise, about 5% ink) for card faces */
export const PAPER_TEX = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.26  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}")`;

/** paper material over a card face: fibre texture + a soft inner edge (put it first inside the face) */
export const PaperFace: React.FC<{ radius?: number }> = ({ radius = theme.radius.card }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      backgroundImage: PAPER_TEX,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.035),inset 0 -8px 16px rgba(0,0,0,.035),inset 0 2px 0 rgba(255,255,255,.9)",
      pointerEvents: "none",
    }}
  />
);


/** SMOOTHNESS: a pop with no overshoot: scale 0.6 -> 1 and opacity 0 -> 1 about (ox, oy) over `dur` (>= 12) frames,
 *  in-out. Wrap a kit element drawn without its own `at` (Pill, WireNode ...). */
export const PopIn: React.FC<{ at?: number; dur?: number; ox: number; oy: number; children: React.ReactNode }> = ({ at, dur = 12, ox, oy, children }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + Math.max(12, dur), EIO);
  if (p <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, transform: p < 1 ? `scale(${mix(0.6, 1, p).toFixed(5)})` : undefined, transformOrigin: `${ox}px ${oy}px`, opacity: p }}>
      {children}
    </div>
  );
};
