// Scene HABIT:
//   B09a "That's the whole habit."  text beat (about 115 px on screen, upright Inter 800) in the hud; the step strip,
//        all four steps filled, slides up under it and its nodes pulse left to right.
//   B09b "Commit, push, branch and tag, and the AI types every command."  four word chips (BA's shared WordChip) pop
//        onto a wire one per spoken word; the terminal under them types one git line per chip word, each with a tick
//        (git commit, git push, git switch -c dark-mode, git tag v1); the robot rises at the right and nods on "AI";
//        the history lines pulse once on "every command".
import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { PHOTO, WirePath, camPath, prog, theme, zoomAt } from "../../../paperstudio";
import { WordChip, wordChipSize } from "../Shared/wordChip";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { StepStrip } from "./firstCard";
import { TerminalPrompt } from "./terminalPrompt";
import { Scene, swell, sway } from "./util";

// ------------------------------------------------------------- B09a
const habitBeats = (c: Cues) => ({ start: c.s.B09a.start, whole: c.w("B09a", "whole"), habit: c.w("B09a", "habit"), end: c.s.B09b.start });

const HabitWorld: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = habitBeats(c);
  const up = prog(f, b.start - 10, b.start + 12, EIO);
  const pulse = [0, 1, 2, 3].map((i) => 1 + 0.12 * swell(f, b.habit - 2 + i * 5, 18));
  // the four habit words pop in place under the strip, one after another (14 frames each, in-out, never overlapping)
  const xs = chipRowXs(48, 22);
  return (
    <>
      <StepStrip x={140} y={740 + 300 * (1 - up) + sway(f, 3, 80)} w={800} h={130} fills={[1, 1, 1, 1]} pulse={pulse} tf="scale(1.28)" />
      <WirePath d={`M40 990 L1040 990`} p={prog(f, b.start - 4, b.start + 24, EASE_W)} />
      {WORDS.map((w, i) => {
        const at = b.start + 4 + i * 5;
        return <WordChip key={w} x={xs[i] + sway(f, 1.2, 70, i)} y={990} word={w} size={48} at={at} dur={14} />;
      })}
    </>
  );
};
const EASE_W = EIO;
/** centres of the four habit chips laid out in one centred row */
const chipRowXs = (size: number, gap: number) => {
  const ws = WORDS.map((w) => wordChipSize(w, size).w);
  const total = ws.reduce((a, x) => a + x, 0) + gap * (ws.length - 1);
  let x = 540 - total / 2;
  return ws.map((w) => {
    const cx = x + w / 2;
    x += w + gap;
    return cx;
  });
};

export const habitBlocks = (): BlockSpec[] => [{ shots: ["B09a"], spec: "^That's ^the | ^whole ^habit.", y: 290, k: 1.5 }];

export const SceneHabit: React.FC<{ c: Cues }> = ({ c }) => {
  const b = habitBeats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 540, y: 760 }, 1.0) }).push(b.end, 0.04).keys;
  return <Scene c={c} from={b.start} to={b.end} keys={keys} world={<HabitWorld c={c} />} />;
};

// ------------------------------------------------------------- B09b (the hands scene, once in this body)
// The human hand comes in from the left edge holding the four word chips on their wires (two rows) and pushes them in;
// each chip turns black on its spoken word. The terminal types one git line per chip word, each with a tick. The
// robot hand comes in from the right and its index finger taps the terminal's input box on every line and on
// "types every command".
const ROWS: { w: (typeof WORDS)[number]; row: number }[] = [
  { w: "commit", row: 0 },
  { w: "push", row: 0 },
  { w: "branch", row: 1 },
  { w: "tag", row: 1 },
];
const WORDS = ["commit", "push", "branch", "tag"] as const;
const LINES = ["git commit", "git push", "git switch -c dark", "git tag v1"];
const CHIP_SIZE = 48;
const ROW_Y = [284, 378];
const ROW_X0 = 336;
const chipPos = () => {
  const xs: { x: number; y: number }[] = [];
  const cursor = [ROW_X0, ROW_X0];
  for (const r of ROWS) {
    const w = wordChipSize(r.w, CHIP_SIZE).w;
    xs.push({ x: cursor[r.row] + w / 2, y: ROW_Y[r.row] });
    cursor[r.row] += w + 24;
  }
  return xs;
};
const T = { x: 100, y: 432, w: 780, h: 466 };
const HUMAN = { w: 440, rot: 45, tip: { x: 322, y: 298 } };
const ROBOT = { x: 618, y: 540, h: 520 };

const cmdBeats = (c: Cues) => ({
  start: c.s.B09b.start,
  words: [c.w("B09b", "commit"), c.w("B09b", "push"), c.w("B09b", "branch"), c.w("B09b", "tag")],
  ai: c.w("B09b", "ai"),
  types: c.w("B09b", "types"),
  every: c.w("B09b", "every"),
  end: c.s.B10a.start,
});

const CmdWorld: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = cmdBeats(c);
  const pos = chipPos();
  const slide = prog(f, b.start - 12, b.start + 10, EIO);
  const dx = -560 * (1 - slide);
  // the human hand: rotated 45 deg so its fingers point right; box placed so the fingertips sit at the rows' left end
  const hw = HUMAN.w;
  const hh = hw / HUMAN_ASPECT;
  const a = (HUMAN.rot * Math.PI) / 180;
  const ox = 0.48 * hw;
  const oy = -0.48 * hh;
  const cx = HUMAN.tip.x - (ox * Math.cos(a) - oy * Math.sin(a));
  const cy = HUMAN.tip.y - (ox * Math.sin(a) + oy * Math.cos(a));
  // the robot finger taps on every line and on "types every command"
  const taps = [...b.words.map((w) => w + 1), b.types, b.every];
  const tap = taps.reduce((acc, t) => acc + swell(f, t - 2, 8), 0);
  const robotIn = prog(f, b.start - 12, b.start + 10, EIO);
  const termIn = prog(f, b.start - 12, b.start + 8, EIO);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `perspective(2200px) translateY(${(60 * (1 - termIn)).toFixed(2)}px) rotateX(${(10 * (1 - termIn)).toFixed(3)}deg)`, transformOrigin: `${T.x + T.w / 2}px ${T.y + T.h / 2}px` }}>
        <TerminalPrompt x={T.x} y={T.y} w={T.w} h={T.h} f={f} welcome={false} hint={false} history={LINES.map((t, i) => ({ text: t, at: b.words[i] + 2, tick: true }))} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${dx.toFixed(2)}px)` }}>
        {ROW_Y.map((y, r) => (
          <WirePath key={r} d={`M${ROW_X0 - 40} ${y} L${ROW_X0 + (r ? 440 : 500)} ${y}`} />
        ))}
        {ROWS.map((r, i) => (
          <WordChip key={r.w} x={pos[i].x} y={pos[i].y + sway(f, 1.5, 64, i)} word={r.w} size={CHIP_SIZE} darken={prog(f, b.words[i] - 4, b.words[i] + 18, EIO)} scale={1 + 0.05 * swell(f, b.words[i] - 4, 24)} />
        ))}
        <div style={{ position: "absolute", left: cx - hw / 2, top: cy - hh / 2, width: hw, height: hh, transform: `rotate(${HUMAN.rot}deg) translate(${sway(f, 2, 90).toFixed(2)}px,0)`, filter: theme.shadow.cutout }}>
          {PHOTO.human ? <Img src={PHOTO.human} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
        </div>
      </div>
      <div style={{ position: "absolute", left: ROBOT.x + 520 * (1 - robotIn), top: ROBOT.y + 10 * tap + sway(f, 2, 80, 3), width: ROBOT.h * ROBOT_HAND_ASPECT, height: ROBOT.h, filter: theme.shadow.cutout }}>
        {PHOTO.robot ? <Img src={PHOTO.robot} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
      </div>
    </>
  );
};
const HUMAN_ASPECT = 1490 / 1310;
const ROBOT_HAND_ASPECT = 1592 / 1308;

export const cmdBlocks = (): BlockSpec[] => [
  { shots: ["B09b"], spec: "*Commit, *push,", y: 1296, anchor: "bottom" },
  { shots: ["B09b"], spec: "*branch *and *tag,", y: 1296, anchor: "bottom" },
  { shots: ["B09b"], spec: "and the AI types | *every *command.", y: 1296, anchor: "bottom" },
];

export const SceneCommands: React.FC<{ c: Cues }> = ({ c }) => {
  const b = cmdBeats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 540, y: 640 }, 0.98) })
    .push(b.ai - 8, 0.02)
    .to(b.ai - 8, zoomAt({ x: 560, y: 760 }, 1.03), 24)
    .push(b.end, 0.01).keys;
  return (
    <Scene
      c={c}
      from={b.start}
      to={b.end}
      keys={keys}
      sheets={[
        { x: -200, y: 700, w: 640, h: 520, rot: -5 },
        { x: 820, y: 180, w: 520, h: 420, rot: 7 },
      ]}
      crossOut={false}
      world={<CmdWorld c={c} />}
    />
  );
};
