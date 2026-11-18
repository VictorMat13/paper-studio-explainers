// SMOOTHNESS: a 12+ frame pop wrapper for kit pieces whose own pop is shorter (LogoChip, Pill, WireNode pop in 8-9
// frames): draw them at rest and scale them in here, 0.6 -> 1 with the in-out curve, no overshoot.
import React from "react";
import { useCurrentFrame } from "remotion";
import { mix } from "../../../paperstudio";
import { popP } from "./util";

export const Pop: React.FC<{ at: number; dur?: number; ox: number; oy: number; children: React.ReactNode; opacity?: number }> = ({ at, dur = 12, ox, oy, children, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = popP(f, at, dur);
  if (p <= 0.001 || opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${ox}px ${oy}px`, transform: `scale(${mix(0.6, 1, p).toFixed(4)})`, opacity: Math.min(1, p * 1.6) * opacity, willChange: "transform" }}>
      {children}
    </div>
  );
};
