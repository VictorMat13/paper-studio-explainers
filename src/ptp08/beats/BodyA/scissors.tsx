// Scissors split at the screw into their two rigid pieces (each blade with the opposite handle), the kit Scissors'
// bow-tie clip, so a caller can draw one piece UNDER the wire and the other OVER it: the wire really passes between
// the blades (the ep06 lesson, "the scissors are cutting through, but it's not actually cutting").
import React from "react";
import { Img } from "remotion";
import { META06 } from "../../../paperstudio";

export const SC = META06.scissors;
/** blade length from the screw to the tips, px at width w (tips about 905 px from the screw on the 1888 px photo) */
export const bladeLen = (w: number) => (905 / 1888) * w;

/**
 * One piece of the scissors, drawn so its SCREW sits at (px, py) in the parent and the blades point along `dir`
 * (deg, clockwise from +x). `opening` = the angle between the blades now (SC.open = as photographed).
 */
export const ScissorsPiece: React.FC<{ src: string; w: number; px: number; py: number; dir: number; opening: number; piece: "A" | "B"; opacity?: number }> = ({
  src,
  w,
  px,
  py,
  dir,
  opening,
  piece,
  opacity = 1,
}) => {
  const h = w / SC.aspect;
  const sx = SC.pivot[0] * w;
  const sy = SC.pivot[1] * h;
  const L = Math.max(w, h) * 3;
  const a = (SC.axis * Math.PI) / 180;
  const rot = (x: number, y: number) => `${(sx + x * Math.cos(a) - y * Math.sin(a)).toFixed(1)}px ${(sy + x * Math.sin(a) + y * Math.cos(a)).toFixed(1)}px`;
  const poly =
    piece === "A"
      ? `polygon(${rot(0, 0)}, ${rot(L, 0)}, ${rot(L, -L)}, ${rot(0, -L)}, ${rot(0, 0)}, ${rot(-L, 0)}, ${rot(-L, L)}, ${rot(0, L)})`
      : `polygon(${rot(0, 0)}, ${rot(L, 0)}, ${rot(L, L)}, ${rot(0, L)}, ${rot(0, 0)}, ${rot(-L, 0)}, ${rot(-L, -L)}, ${rot(0, -L)})`;
  const turn = (SC.open - Math.max(0, Math.min(SC.open + 20, opening))) / 2;
  const own = piece === "A" ? turn : -turn;
  // the shadow sits on an untransformed wrapper so the light stays top-left whatever the scissors' angle
  return (
    <div style={{ position: "absolute", left: 0, top: 0, filter: "drop-shadow(10px 14px 10px rgba(0,0,0,.22)) drop-shadow(3px 4px 3px rgba(0,0,0,.12))", opacity }}>
      <div style={{ position: "absolute", left: px - sx, top: py - sy, width: w, height: h, transformOrigin: `${sx}px ${sy}px`, transform: `rotate(${(dir - SC.axis).toFixed(3)}deg)` }}>
        <div style={{ position: "absolute", inset: 0, clipPath: poly, transform: `rotate(${own.toFixed(3)}deg)`, transformOrigin: `${sx}px ${sy}px` }}>
          <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      </div>
    </div>
  );
};
