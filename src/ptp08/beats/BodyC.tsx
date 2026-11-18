import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BLUR, BreakLayer, BreakShade } from "../crossBreak";
import { EASE } from "../../paperstudio";
import { CtaScene } from "./Shared/cta";
import { useBodyC, type BC } from "./BodyC/cues";
import { LaptopScene } from "./BodyC/s1Laptop";
import { BoardScene } from "./BodyC/s2Board";
import { TerminalScene } from "./BodyC/s3Terminal";
import { FreeScene } from "./BodyC/s4Free";

// ===========================================================================
// BodyC (builder BC, ep08 "What GitHub actually is", body C "what goes wrong without it"): storyboard C01a-C10a + C10x.
//   LAPTOP    C01a-C03a  frame 0 = the first card (./BodyC/firstCard.tsx, the hooks' hand-off target): the laptop with
//                        the to-do app on its glass and the '1 copy' pill; the text beat; robots behind the lid; every
//                        request reshuffles the files; the crack, the clock winding back an hour, the struck ghost; the
//                        laptop dies and sinks.
//   BOARD     C04a-C07b  the GitHub slab; the commit timeline, one step back; push from a laptop that dies into the
//                        'online' card; the v1 tag; a branch, the merge, the second branch cut off by the scissors.
//   TERMINAL  C08a-C08b  BodyC's hands scene: the human hand with the struck keyboard, the robot hand on BB's Claude Code
//                        terminal (beats/BodyB/terminalPrompt.tsx), the prompt and three result lines.
//   FREE      C09a       the GitHub card, the 'free' stamp, 225M+, the robot grid and the GitHub chip.
//   CTA       C10a-C10x  BA's shared CTA (beats/Shared/cta.tsx).
// SMOOTHNESS (Victor 2026-11-07): the scenes never cut. Each change is a 16-frame blurred crossing centred on the shot
// boundary (crossBreak.tsx: the outgoing scene blurs out while it keeps moving, the incoming one, already moving, crosses
// in on top while both are blurred, then clears), so both sides move through it. Each outgoing scene's captions leave
// 6 frames before its end, so no two captions are ever on screen together.
// Every frame from ../timing via ./BodyC/cues.ts (group-local). One kit Camera per scene (they draw the ground), captions
// in each camera's hud, no CrtPass. Frame 0 is the first card at identity; the CTA ends at identity.
// ===========================================================================
/** frames of each scene crossing, centred on the shot boundary */
const CROSS = 16;

/** BodyC's own blurred crossing (the shell's crossBreak look, with a slower hand-over for SMOOTHNESS): the outgoing
 *  scene blurs to BLUR over the first half, the incoming one (at BLUR) fades in across the middle 60% of the crossing
 *  (about 10 frames, so no frame jumps), then clears over the second half; both keep moving underneath. */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const Crossing: React.FC<{ at: number; dur: number; out: React.ReactNode; inc: React.ReactNode }> = ({ at, dur, out, inc }) => {
  const f = useCurrentFrame();
  const u = clamp01((f - at + 1) / (dur + 1));
  const outK = EASE.travel(clamp01(u / 0.5));
  const inK = 1 - EASE.travel(clamp01((u - 0.5) / 0.5));
  const alpha = EASE.travel(clamp01((u - 0.2) / 0.6));
  return (
    <AbsoluteFill>
      <BreakLayer blur={BLUR * outK} push={0.03 * outK}>
        {out}
      </BreakLayer>
      <BreakLayer blur={BLUR * inK} push={0.03 * inK} opacity={alpha}>
        {inc}
      </BreakLayer>
      <BreakShade mid={4 * u * (1 - u)} />
    </AbsoluteFill>
  );
};

const SCENES: { from: (c: BC) => number; render: (c: BC) => React.ReactNode }[] = [
  { from: () => 0, render: (c) => <LaptopScene c={c} /> },
  { from: (c) => c.s.C04a.start, render: (c) => <BoardScene c={c} /> },
  { from: (c) => c.s.C08a.start, render: (c) => <TerminalScene c={c} /> },
  { from: (c) => c.s.C09a.start, render: (c) => <FreeScene c={c} /> },
  { from: (c) => c.s.C10a.start, render: () => <CtaScene ctaShot="C10a" tailShot="C10x" /> },
];

export const BodyC: React.FC = () => {
  const c = useBodyC();
  const f = useCurrentFrame();
  // the scene whose span holds f, and a crossing when f is within CROSS / 2 of a boundary
  let i = 0;
  for (let j = 1; j < SCENES.length; j++) if (f >= SCENES[j].from(c)) i = j;
  const half = CROSS / 2;
  const next = i + 1 < SCENES.length ? SCENES[i + 1].from(c) : Infinity;
  const here = SCENES[i].from(c);
  if (i > 0 && f < here + half) {
    return <Crossing at={here - half} dur={CROSS} out={SCENES[i - 1].render(c)} inc={SCENES[i].render(c)} />;
  }
  if (f >= next - half) {
    return <Crossing at={next - half} dur={CROSS} out={SCENES[i].render(c)} inc={SCENES[i + 1].render(c)} />;
  }
  return <AbsoluteFill>{SCENES[i].render(c)}</AbsoluteFill>;
};
