import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CAM_BOX, Camera, EASE, camPath, zoomAt, mix, prog, type CamFollow } from "../../paperstudio";
import { CrossBreak } from "../crossBreak";
import { SM } from "./BodyA/util";
import { CaptionBlocks } from "./BodyA/captions";
import { useCues } from "./BodyA/cues";
import { FIRST_CARD } from "./BodyA/firstCard";
import { useBodyACaptions } from "./BodyA/lines";
import { A11Z, BranchScene, OV, TAGZOOM, branchCues } from "./BodyA/sBranch";
import { ClaudeScene, claudeCues } from "./BodyA/sClaude";
import { CommitScene, SQUEEZE, commitCues, rowStates } from "./BodyA/sCommit";
import { IntroScene, ROW_CAM, introCues } from "./BodyA/sIntro";
import { LaptopScene, laptopCues, laptopSqueeze } from "./BodyA/sLaptop";
import { MAIN_NODES, N4ZOOM, PAIR23, PAIR34, PAIR34T } from "./BodyA/timeline";
import { CtaScene } from "./Shared/cta";

// ===========================================================================
// BodyA (builder BA): storyboard A01a-A15a + A15x, "Body A: what it actually is" (video A = HA + BodyA; BA = HB +
// BodyA; CA = HC + BodyA; and their YT cuts). Frame 0 is the GitHub-on-Git first card every hook hands off onto
// (BodyA/firstCard.tsx, centre (540, 890), identity camera). One kit Camera carries the body world from A01a to A14b
// (scenes slide in and out; no camera motion blur, so text never smears); the shared CTA (beats/Shared/cta.tsx) has its
// own Camera and crosses in through an 8-frame blurred break (crossBreak.tsx) in the pause after "for you.". Every
// frame comes from ../timing via useCues (group-local); captions are the real spoken words in the hud band above the
// visual. No CrtPass here (the shell has the only one). Starts and ends at the identity pose.
// ===========================================================================

const ID = { x: (CAM_BOX.body.x0 + CAM_BOX.body.x1) / 2, y: (CAM_BOX.body.y0 + CAM_BOX.body.y1) / 2, zoom: 1 };

export const BodyA: React.FC = () => {
  const f = useCurrentFrame();
  const c = useCues();
  const i = introCues(c);
  const m = commitCues(c);
  const l = laptopCues(c);
  const b = branchCues(c);
  const k = claudeCues(c);
  const blocks = useBodyACaptions(c);
  const s = c.s;
  const brkDur = 12;
  const brkAt = s.A15a.start - 8;
  const ctaLead = 12;

  const cuts2 = c.cuts("A02a");
  const cuts5 = c.cuts("A05a");
  // SMOOTHNESS: every move 20-26 frames (EASE.cam, zero velocity at both ends), started early enough to land as the
  // thing lands; holds drift (push); camPath never runs two moves at once (a late key waits for the move before it)
  // the camera path: a move-then-drift builder that tracks the last key frame, so every hold drifts at one gentle rate
  // (0.06% zoom per frame) however long it is; a short hold never becomes a fast push (jerk scan, SMOOTHNESS 3)
  const P = camPath({ f: 0 });
  let lastF = 0;
  const to = (at: number, pose: Parameters<typeof P.to>[1], dur: number, ease?: (t: number) => number) => {
    P.to(at, pose, dur, ease);
    lastF = Math.max(lastF, at) + dur;
  };
  const drift = (until: number) => {
    const d = until - lastF;
    if (d > 3) {
      P.push(until, 0.0006 * d);
      lastF = until;
    }
  };
    // A01a: the first card, a slow push about its centre
    to(0, zoomAt({ x: FIRST_CARD.cx, y: FIRST_CARD.cy }, 1.03), Math.max(8, i.a2 - 10), EASE.drift);
    // A02a: pull back for the robot row; a push at the part boundary
    drift(i.a2 - 8);
    to(i.a2 - 8, ROW_CAM, 24);
    drift(cuts2[0] ?? i.almost);
    drift(i.here - 12);
    // A03a: back to identity as the text card comes in
    to(i.here - 12, ID, 26);
    drift(m.a4 - 4);
    // A04a: a lean to the camera on "save", in on the print on "commit"
    drift(m.save - 12);
    to(m.save - 12, zoomAt({ x: 790, y: 860 }, 1.05), 22);
    drift(m.commit - 10);
    to(m.commit - 10, zoomAt({ x: 620, y: 1150 }, 1.1), 24);
    drift(m.a5 - 8);
    // A05a: in on the snapshot, a push at the part boundary
    to(m.a5 - 8, zoomAt({ x: 560, y: 920 }, 1.15), 24);
    drift(cuts5[0] ?? m.every);
    drift(m.a5b - 8);
    // A05b: onto the pair, then along the link
    to(m.a5b - 8, PAIR34, 24);
    drift(m.before - 8);
    to(m.before - 8, { ...PAIR34, zoom: 1.02 }, 22);
    // A06a: a dolly left along the line as the older card lands, and back to the newest pair on "timeline"
    drift(m.land6[0] - 16);
    to(m.land6[0] - 16, PAIR23, 24);
    drift(m.timeline - 18);
    to(m.timeline - 18, PAIR34, 24);
    drift(m.prompt - 10);
    // A07a: in on the newest card alone (nodes are 600 apart, so no neighbour's text is cut at the frame edge)
    to(m.prompt - 10, N4ZOOM, 22);
    drift(m.a7b - 8);
    // A07b: the pair with the terminal under it; a slow push while the ring marker goes back one node
    to(m.a7b - 8, PAIR34T, 24);
    drift(m.lastW - 8);
    to(m.lastW - 8, { ...PAIR34T, zoom: 1.02 }, 22);
    drift(l.a8 - 6);
    // A08a: down onto the laptop
    to(l.a8 - 6, { x: 540, y: 800, zoom: 1.0 }, 24);
    drift(l.a8b);
    drift(l.a9 - 4);
    // A09a: onto L1 as the laptop moves, then up to the slab with the cards
    to(l.a9 - 4, zoomAt({ x: 235, y: 1100 }, 1.1), 22);
    drift(l.push + 2);
    to(l.push + 2, zoomAt({ x: 330, y: 840 }, 1.05), 24);
    drift(l.a9b - 8);
    // A09b: in on the GitHub card
    to(l.a9b - 8, zoomAt({ x: 680, y: 740 }, 1.05), 22);
    drift(l.a10 - 8);
    // A10a: the whole picture, then down the arrow to L2
    to(l.a10 - 8, { x: 540, y: 800, zoom: 1.0 }, 24);
    drift(l.reverse - 12);
    to(l.reverse - 12, zoomAt({ x: 800, y: 980 }, 1.04), 22);
    drift(l.computer - 10);
    // A10b: back out as the copies land
    to(l.computer - 10, { x: 540, y: 800, zoom: 1.0 }, 22);
    // A11a: the pan lands close on the fork (its card big, the stub and the ghost card beside it); a slow push to "works"
    drift(b.a11 - 10);
    to(b.a11 - 10, A11Z, 26);
    drift(b.works + 6);
    // A11b: back to the overview as the branch draws and its card lands
    drift(b.branch - 14);
    to(b.branch - 14, OV, 24);
    drift(b.tag - 12);
    // A13a: in on the tag (framed left), out again for the way back
    to(b.tag - 12, TAGZOOM, 24);
    drift(b.so - 10);
    to(b.so - 10, OV, 24);
    drift(k.a14 - 10);
    // A14a: identity for the hands scene (during the pan); A14b in a little for the commands
    to(k.a14 - 10, ID, 26);
    drift(k.a14b - 8);
    to(k.a14b - 8, zoomAt({ x: 540, y: 980 }, 1.05), 24);
    drift(brkAt - 24);
    to(brkAt - 24, ID, 22);
    P.hold(brkAt + brkDur + 2);
  const keys = P.keys;

  // A07b: lean toward the ring marker as it slides back along the (squeezed) wire
  const markerWorldX = (fr: number) => {
    const p = prog(fr, m.lastW - 2, m.worked + 4, EASE.cam);
    const x = mix(MAIN_NODES[4].x, MAIN_NODES[2].x, p);
    return SQUEEZE.ox + (x - SQUEEZE.ox) * SQUEEZE.s;
  };
  const follow: CamFollow[] = [];
  void markerWorldX;

  const breathe = SM(Math.min(1, f / 40));
  const main =
    f < brkAt + brkDur ? (
      <Camera keys={keys} follow={follow} blur={false} hud={<CaptionBlocks f={f} blocks={blocks} lastExit={brkAt} />}>
        {/* ambient breathing of the whole world (every hold drifts), zero offset and zero velocity at frame 0 so the
            body's first frame is exactly the hooks' hand-off card */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${(2.5 * breathe * Math.sin((f / 150) * Math.PI * 2)).toFixed(3)}px, ${(1.6 * breathe * Math.sin((f / 190) * Math.PI * 2)).toFixed(3)}px)` }}>
        <IntroScene f={f} q={i} />
        <CommitScene f={f} q={m} laptopSqueeze={laptopSqueeze(l)} />
        <LaptopScene f={f} q={l} broken={rowStates(f, m)} />
        <CommitScene f={f} q={m} laptopSqueeze={laptopSqueeze(l)} layer="top" />
        <BranchScene f={f} q={b} />
        <ClaudeScene f={f} q={k} />
        </div>
      </Camera>
    ) : null;
  const cta = f >= brkAt ? <CtaScene ctaShot="A15a" tailShot="A15x" lead={ctaLead} /> : null;
  if (f < brkAt) return <AbsoluteFill>{main}</AbsoluteFill>;
  if (f >= brkAt + brkDur) return <AbsoluteFill>{cta}</AbsoluteFill>;
  return <CrossBreak at={brkAt} dur={brkDur} out={main} in={cta} />;
};
