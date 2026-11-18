// The GitHub slab in BodyA: HA's slab (beats/HA/slab.tsx, the contract's 180 px charcoal slab with GitHub's white
// Invertocat and 'github' under it) imported read-only so every group draws the same slab, positioned by its centre
// with a uniform scale (the kit's heavy-chip treatment: never squashed).
import React from "react";
import { GithubSlab, SLAB } from "../HA/slab";

export { SLAB };

export const Slab: React.FC<{ cx: number; cy: number; s?: number; rot?: number; opacity?: number; sheen?: number }> = ({ cx, cy, s = 1, rot = 0, opacity = 1, sheen = -1 }) => {
  if (opacity <= 0.001 || s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - SLAB.w / 2,
        top: cy - SLAB.h / 2,
        width: SLAB.w,
        height: SLAB.h,
        transform: `rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})`,
        transformOrigin: "50% 50%",
        opacity,
      }}
    >
      <GithubSlab sheen={sheen} />
    </div>
  );
};
