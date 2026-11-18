import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE } from "../paperstudio";

// ===========================================================================
// The ep06 blur break as a BLURRED CROSSING (ep06 fix round 2; kept for ep07 and ep08 builders). Over the break's frames:
//   - the outgoing scene blurs from sharp to BLUR (14 px) over the first half of the break;
//   - across the middle the incoming scene, still at BLUR, fades in on top of it (the outgoing is under it, also at
//     BLUR, so it fades out behind it);
//   - over the second half the incoming scene clears from BLUR to sharp.
// The two scenes are only on screen together while both are fully blurred (at least about 12 px), so no two sharp
// texts ever overlap, and the ground is never empty. The incoming scene is nearly sharp on the break's last frame.
//
// ep07 and ep08: the shell draws NO group-edge breaks (the hook hands off into the body's first card). A builder who wants a
// break inside its own group uses <CrossBreak>: pass the outgoing scene (live) and the incoming scene (as it looks on
// its first frame after the break), with `at` / `dur` in the same (group-local) frames as useCurrentFrame().
// breakMix, BreakLayer and BreakShade are exported for a custom layout.
// ===========================================================================

/** the blur both scenes reach in the middle of the break, px */
export const BLUR = 14;
/** the crossing (incoming fades in over the outgoing) runs over this part of the break, as fractions of it */
export const CROSS = [0.35, 0.65] as const;
/** darken at the middle of the break (storyboard S04x: "the ground darkens 4% during the blur") */
export const DARKEN = 0.04;
/** the kit BlurBreak's grey vignette, at the middle of the break */
export const VIGNETTE = 0.22;
/** scale push on a blurred scene (kit BlurBreak), in proportion to its blur */
export const PUSH = 0.03;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** the crossing at frame f of a break [at, at + dur). u runs from 1/(dur+1) to dur/(dur+1), so the first break
 *  frame already starts blurring and the last is nearly sharp.
 *  out*: the outgoing scene (blur, push); in*: the incoming scene drawn on top (blur, push, opacity). */
export const breakMix = (f: number, at: number, dur: number) => {
  const u = clamp01((f - at + 1) / (dur + 1));
  const outK = EASE.travel(clamp01(u / 0.5)); // 0 -> 1 over the first half
  const inK = 1 - EASE.travel(clamp01((u - 0.5) / 0.5)); // 1 -> 0 over the second half
  return {
    u,
    mid: 4 * u * (1 - u),
    outBlur: BLUR * outK,
    outPush: PUSH * outK,
    inBlur: BLUR * inK,
    inPush: PUSH * inK,
    inAlpha: EASE.travel(clamp01((u - CROSS[0]) / (CROSS[1] - CROSS[0]))),
  };
};

/** one blurred, pushed, faded layer; the tree has the same shape on every frame, so children never remount */
export const BreakLayer: React.FC<{ blur: number; push: number; opacity?: number; children: React.ReactNode }> = ({ blur, push, opacity = 1, children }) => (
  <AbsoluteFill
    style={{
      opacity,
      filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
      transform: push > 0.0005 ? `scale(${(1 + push).toFixed(4)})` : undefined,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** the darken and vignette that peak at the middle of a break (drawn over both layers) */
export const BreakShade: React.FC<{ mid: number }> = ({ mid }) =>
  mid > 0.01 ? (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,.22) 100%)", opacity: (VIGNETTE / 0.22) * mid }} />
      <AbsoluteFill style={{ background: "#2A2826", opacity: DARKEN * mid }} />
    </>
  ) : null;

/** a whole break inside one component: `out` blurs out, `in` crosses in on top of it while both are blurred, then
 *  clears. Outside [at, at + dur) it renders `out` before the break and `in` after it, untouched. */
export const CrossBreak: React.FC<{ at: number; dur: number; out: React.ReactNode; in: React.ReactNode }> = ({ at, dur, out, in: inc }) => {
  const f = useCurrentFrame();
  if (f < at) return <AbsoluteFill>{out}</AbsoluteFill>;
  if (f >= at + dur) return <AbsoluteFill>{inc}</AbsoluteFill>;
  const m = breakMix(f, at, dur);
  return (
    <AbsoluteFill>
      <BreakLayer blur={m.outBlur} push={m.outPush}>{out}</BreakLayer>
      <BreakLayer blur={m.inBlur} push={m.inPush} opacity={m.inAlpha}>{inc}</BreakLayer>
      <BreakShade mid={m.mid} />
    </AbsoluteFill>
  );
};
