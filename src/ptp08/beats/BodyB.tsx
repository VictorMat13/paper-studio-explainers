import React, { useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PadCtx } from "../../paperstudio";
import { CaptionRun, type BlockSpec } from "./BodyB/caps";
import { type Cues } from "./BodyB/cues";
import { BreakLayer } from "../crossBreak";
import { CtaScene } from "./Shared/cta";
import { useBBCues } from "./BodyB/cues";
import { SceneBreak, SceneWorks, breakBlocks, worksBlocks } from "./BodyB/sApp";
import { SceneBack, backBlocks } from "./BodyB/sBack";
import { SceneBranch, branchBlocks } from "./BodyB/sBranch";
import { SceneConsole, consoleBlocks } from "./BodyB/sConsole";
import { SceneCommands, SceneHabit, cmdBlocks, habitBlocks } from "./BodyB/sHabit";
import { ScenePush, pushBlocks } from "./BodyB/sPush";
import { SceneRepo, repoBlocks } from "./BodyB/sRepo";
import { SceneSnap, snapBlocks } from "./BodyB/sSnap";

// ===========================================================================
// BodyB (builder BB, ep08 "What GitHub actually is", body B "the routine"): storyboard B01a-B10a + B10x.
// Plays behind HB (B), HA (AB), HC (CB) and in their YouTube cuts. Frame 0 = FirstCard t 0 (./BodyB/firstCard.tsx),
// the target every hook hands off into.
// Rhythm for every step of the routine: the CONSOLE (the Claude Code terminal at its first-card place, the command
// typing on the spoken words, the step node filling) then a BOARD (what that command does). Scenes, in order (each
// its own kit Camera; hard cuts on a shot start or a spoken word; the old caption gone the frame before):
//   CONSOLE W1  B01a-B01b   frame 0, "set up git and connect this project to GitHub", Git + GitHub chips, step 1
//   REPO        B02a        the repo card, the main wire, the first commit card
//   WORKS       B03a        the to-do app ticks, a tick chip            CONSOLE W2 "commit", step 2
//   SNAP        B03b        the new commit card grows into the snapshot (file tree + note)
//   CONSOLE W3  B04a        "push", step 3                              PUSH  B04a-B04b  laptop -> GitHub, laptop dies
//   BREAK       B05a        the app cracks, 'fix it' bubbles struck out
//   CONSOLE W4  B05b        "go back to the last commit that worked"    BACK  B05b  ring marker back one node, clock
//   CONSOLE W5  B06a        "make a branch for dark mode", step 4
//   BRANCH      B06b-B08a   branch, merge, scissors cut, tag v1, people, magnifier
//   HABIT       B09a        text beat + the full strip                  COMMANDS B09b  word chips + git lines + robot
//   CTA         B10a-B10x   BA's shared CTA (beats/Shared/cta.tsx), entered by a blurred crossing
// Every frame from ../timing via ./BodyB/cues.ts (group-local). No CrtPass here (the shell has the only one).
// ===========================================================================
/** every caption block of the body in spoken order (one run, so each block's exit is scheduled from the next block's
 *  first word across scene boundaries) */
const allBlocks = (c: Cues): BlockSpec[] => [
  ...consoleBlocks(1),
  ...repoBlocks(),
  ...worksBlocks(),
  ...consoleBlocks(2),
  ...snapBlocks(),
  ...consoleBlocks(3),
  ...pushBlocks(),
  ...breakBlocks(),
  ...consoleBlocks(4),
  ...backBlocks(),
  ...consoleBlocks(5),
  ...branchBlocks(),
  ...habitBlocks(),
  ...cmdBlocks(),
];

/** the captions live in their own layer above the scenes (never blurred by a crossing), padded like the cameras */
const Captions: React.FC<{ c: Cues }> = ({ c }) => {
  const pad = useContext(PadCtx);
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 758.5px", transform: pad === 1 ? undefined : `scale(${pad})`, pointerEvents: "none" }}>
      <CaptionRun c={c} blocks={allBlocks(c)} until={c.s.B10a.start - 6} />
    </AbsoluteFill>
  );
};

export const BodyB: React.FC = () => {
  const c = useBBCues();
  const f = useCurrentFrame();
  // COMMANDS -> CTA: the CTA sits under the outgoing scene, blurred; the outgoing scene stays nearly sharp through the
  // crossing's middle, then blurs and fades out, so no two sharp texts ever overlap and no frame is near-empty
  const X = { at: c.s.B10a.start - 12, dur: 12 };
  const u = Math.min(1, Math.max(0, (f - X.at + 1) / (X.dur + 1)));
  const sm = (a: number, b: number) => {
    const t = Math.min(1, Math.max(0, (u - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const crossing = f >= X.at && f < X.at + X.dur;
  return (
    <AbsoluteFill>
      {/* in time order: during a crossing the incoming scene is drawn on top of the outgoing one */}
      <SceneConsole c={c} ids={[1]} />
      <SceneRepo c={c} />
      <SceneWorks c={c} />
      <SceneConsole c={c} ids={[2]} />
      <SceneSnap c={c} />
      <SceneConsole c={c} ids={[3]} />
      <ScenePush c={c} />
      <SceneBreak c={c} />
      <SceneConsole c={c} ids={[4]} />
      <SceneBack c={c} />
      <SceneConsole c={c} ids={[5]} />
      <SceneBranch c={c} />
      <SceneHabit c={c} />
      {crossing ? (
        <>
          <BreakLayer blur={14 * (1 - sm(0.35, 1))} push={0.02 * (1 - sm(0.35, 1))}>
            <CtaScene ctaShot="B10a" tailShot="B10x" lead={X.dur} />
          </BreakLayer>
          {/* SMOOTHNESS: a real dissolve: the outgoing scene blurs to 14 px over the first half and fades over the middle,
              the CTA clears from 14 px over the second half, so both are soft while they overlap and nothing flips */}
          <BreakLayer blur={14 * sm(0, 0.55)} push={0.015 * sm(0, 0.6)} opacity={1 - sm(0.25, 0.85)}>
            <SceneCommands c={c} />
          </BreakLayer>
        </>
      ) : (
        <>
          <SceneCommands c={c} />
          <CtaScene ctaShot="B10a" tailShot="B10x" lead={X.dur} />
        </>
      )}
      {/* captions on top of every scene (unblurred through the crossings) */}
      {f < c.s.B10a.start ? <Captions c={c} /> : null}
    </AbsoluteFill>
  );
};
