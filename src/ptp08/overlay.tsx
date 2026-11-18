import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { KitHookOverlay } from "./kit";

// The shared hook overlay (STORYBOARD.md "Shared hook overlay"): the same end-result line on all 18 videos, in the
// band y 290-440, Inter 800 56 px, two lines, centred, #111. On screen from frame 0 (so the first frame already says
// what the viewer gets) until the body's first shot (A01a, B01a, C01a), fading over the last FADE frames. Body shots
// carry no overlay. The shell owns it (drawn with the kit's HookOverlay); hook beats keep the band clear and never
// draw it.
export const HOOK_OVERLAY = ["How to use GitHub", "when you build with AI"] as const;
const FADE = 6;

export const HookOverlay: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", transform: `translateY(${(-6 * (1 - out)).toFixed(2)}px)` }}>
      <KitHookOverlay opacity={out} text={<>{HOOK_OVERLAY[0]}<br />{HOOK_OVERLAY[1]}</>} />
    </AbsoluteFill>
  );
};
