// A14a-A14b, the hands scene (STYLE UPLIFT: once per body, at its "tell Claude" beat, ep04 style). The Claude Code
// terminal arrives in the pan from the branch scene, big and tilted, then settles; the robot hand comes in from the
// right under its lower edge and holds it up; the human hand slides in from the left carrying the 'commit' and 'push'
// word chips on its fingertips, and on each spoken word the chip flies up into the prompt, which types it. Then the two
// commands run as mono lines with a tick (git commit, git push) and the robot hand lifts the terminal a touch on each.
// The Claude chip sits on the terminal's corner. World px; hands are the kit Cutout photos (arms bleed off the edges).
import React from "react";
import { EASE, LogoChip, PHOTO, mix, prog, theme } from "../../../paperstudio";
import { Img } from "remotion";
import { Pop } from "./pop";
import type { Cues } from "./cues";
import { LOGOS } from "./assets";
import { TerminalPrompt, typedChars } from "../BodyB/terminalPrompt";
import { WordChip } from "../Shared/wordChip";
import { pulse, SM } from "./util";
import { PAN, panOut } from "./sLaptop";
import { Sheets } from "./depth";

export const T14 = { x: 150, y: 592, w: 780, h: 340 } as const;
/** hand photos (kit): hand-human.png 1490 x 1310 (fingertips top right), hand-robot.png 1592 x 1308 (top left) */
const HUMAN = { w: 720, h: (720 * 1310) / 1490, tip: { u: 0.97, v: 0.03 } } as const;
const ROBOT = { w: 720, h: (720 * 1308) / 1592, tip: { u: 0.02, v: 0.05 } } as const;
/** where the fingertips go */
const HUMAN_TIP = { x: 430, y: 930 } as const;
const ROBOT_TIP = { x: 700, y: T14.y + T14.h - 12 } as const;
/** the chips ride on the human fingertips */
const CHIP_AT_HAND = [
  { x: 470, y: 990 },
  { x: 420, y: 1098 },
] as const;
/** where a chip lands in the prompt line (it shrinks into the typed text) */
const PROMPT_AT = [
  { x: 300, y: T14.y + T14.h - 70 },
  { x: 560, y: T14.y + T14.h - 70 },
] as const;

/** the hands' ambient drift: slow sines, a different phase per hand */
const handDrift = (f: number, seed: number) => ({ x: 2 * Math.sin((f + seed * 41) / 71), y: 1.5 * Math.cos((f + seed * 29) / 93) });

/** a hand photo floating over the paper (the kit Cutout's look: hairline white edge and the cut-out shadow stack),
 *  sliding in from its frame edge with the in-out curve (the kit's slide starts at full speed) */
const Hand: React.FC<{ src: string; x: number; y: number; w: number; h: number; dx: number; f: number; seed: number }> = ({ src, x, y, w, h, dx, f, seed }) => {
  const d = handDrift(f, seed);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, filter: theme.shadow.cutout, transform: `translate(${(dx + d.x).toFixed(2)}px, ${d.y.toFixed(2)}px)`, willChange: "transform" }}>
      <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

export const claudeCues = (c: Cues) => {
  const a14 = c.s.A14a.start;
  const claude = c.at("A14a", /^claude$/, 80);
  const commit = c.at("A14a", /^commit$/, 104);
  const and = c.at("A14a", /^and$/, 110, commit);
  const push = c.at("A14a", /^push$/, 118);
  const a14b = c.s.A14b.start;
  const runs = c.at("A14b", /^runs$/, 4);
  const commands = c.at("A14b", /^commands$/, 16);
  const forYou = c.at("A14b", /^you$/, 30);
  const a15 = c.s.A15a.start;
  return { a14, claude, commit, and, push, a14b, runs, commands, forYou, a15 };
};
export type ClaudeCues = ReturnType<typeof claudeCues>;

export const ClaudeScene: React.FC<{ f: number; q: ClaudeCues }> = ({ f, q }) => {
  if (f < q.a14 - 7 || f >= q.a15 + 4) return null;
  // the terminal arrives in the pan from the branch scene (tilted), and settles flat-ish
  const tIn = panOut(f, q.a14);
  const dx = PAN * (1 - tIn);
  const settle = prog(f, q.a14 + 6, q.a14 + 26, EASE.cam);
  const tilt = mix(-12, -3, settle) + 0.4 * Math.sin((f - q.a14) / 23);
  const typed = typedChars("commit and push", [q.commit, q.and, q.push], f);
  // the hands slide in from their edges once the pan has landed (no fade: they slide, arms bleeding off the frame)
  const handsAt = q.a14 + 8;
  const robotAt = handsAt + 4;
  // the robot hand lifts the terminal a touch on each command
  const lift = 6 * pulse(f, q.runs - 2, 12) + 6 * pulse(f, q.commands - 2, 12) + 1.2 * Math.sin((f - q.a14) / 17);
  // the chips: ride the human fingertips, fly into the prompt on their words
  const chipFly = [prog(f, q.commit - 6, q.commit + 8, EASE.travel), prog(f, q.push - 6, q.push + 8, EASE.travel)];
  const handIn = prog(f, handsAt, handsAt + 22, SM);
  const handDx = -700 * (1 - handIn) + handDrift(f, 0).x;
  const handDy = handDrift(f, 0).y;
  const chipEl = (i: number, word: string) => {
    const p = chipFly[i];
    if (p >= 0.999) return null;
    const a = CHIP_AT_HAND[i];
    const b = PROMPT_AT[i];
    const x = mix(a.x + handDx, b.x, p);
    const y = mix(a.y + handDy, b.y, p) - 120 * Math.sin(Math.PI * p);
    return <WordChip key={word} x={x} y={y} word={word} size={56} scale={mix(1, 0.55, p)} opacity={1 - prog(f, (i ? q.push : q.commit) + 2, (i ? q.push : q.commit) + 10, SM)} rot={mix(-6 + 4 * i, 0, p)} />;
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <Sheets f={f} sheets={[{ x: 50, y: 556, w: 990, h: 470, rot: 2.5, tone: 1 }]} dx={dx} />
      {/* the robot hand goes BEHIND the terminal: its fingertips tuck under the lower edge and hold it up */}
      <Hand src={PHOTO.robot} x={ROBOT_TIP.x - ROBOT.tip.u * ROBOT.w} y={ROBOT_TIP.y - ROBOT.tip.v * ROBOT.h - lift} w={ROBOT.w} h={ROBOT.h} dx={760 * (1 - prog(f, robotAt, robotAt + 22, SM))} f={f} seed={3} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${dx.toFixed(1)}px, ${(-lift).toFixed(2)}px)` }}>
        <TerminalPrompt
          x={T14.x}
          y={T14.y}
          w={T14.w}
          h={T14.h}
          f={f}
          tiltY={tilt}
          tiltX={2 * (1 - settle)}
          prompt="commit and push"
          typed={typed}
          hint={false}
          fs={40}
          welcome={false}
          history={[
            { text: 'git commit -m "save progress"', at: q.runs - 2 },
            { text: "git push", at: q.commands - 2 },
          ]}
        />
        <Pop at={Math.min(q.claude, q.a14 + 12) - 2} ox={T14.x + 16} oy={T14.y + 62}>
          <LogoChip cx={T14.x + 16} cy={T14.y + 62} r={56} name="Claude" src={LOGOS.claude} label={false} />
        </Pop>
      </div>
      {/* the human hand from the left with the two word chips on its fingertips */}
      <Hand src={PHOTO.human} x={HUMAN_TIP.x - HUMAN.tip.u * HUMAN.w} y={HUMAN_TIP.y - HUMAN.tip.v * HUMAN.h} w={HUMAN.w} h={HUMAN.h} dx={-700 * (1 - handIn)} f={f} seed={0} />
      {f >= handsAt ? chipEl(0, "commit") : null}
      {f >= handsAt ? chipEl(1, "push") : null}
    </div>
  );
};
