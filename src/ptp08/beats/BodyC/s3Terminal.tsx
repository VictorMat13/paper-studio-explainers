// Scene 3, TERMINAL + HANDS: C08a, C08b (one kit Camera). STYLE UPLIFT: BodyC's one hands scene (ep04's human hand vs
// robot hand, the kit's photo cut-outs, big from the frame edges, fingertips near the centre under the terminal).
//   C08a  the Claude Code terminal (BB's shared TerminalPrompt look) rises and settles out of a 12 deg tilt; the human
//         hand slides in from the left holding a keyboard chip, the robot hand slides in from the right with its
//         fingertips on the terminal's bottom edge; 'type' / 'yourself': a black bar strikes across the keyboard chip.
//   C08b  'Claude': a Claude chip pops on the terminal's top-left corner; the robot hand taps (a small typing bob) while
//         the prompt types 'commit, push, make a branch' on the spoken words, submits on 'and', and three result lines
//         type in with a tick each (git commit, git push, git switch -c idea) on 'it', 'runs', 'commands'. Push 5%.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, Cutout, EASE, LogoChip, camPath, prog, zoomAt } from "../../../paperstudio";
import { TerminalPrompt, typedChars } from "../BodyB/terminalPrompt";
import type { BC } from "./cues";
import { LOGOS } from "./assets";
import { BackSheets, KeyboardChip, Place, StrikeBar } from "./objects";
import { capLayout, Pages, SMOOTH, sway, swell, wsFrom, type CapBlock } from "./parts";
import { CAP_TOP } from "./s1Laptop";

const TERM = { x: 110, y: 510, w: 860, h: 440 };
const HUMAN = { x: -170, y: 935, w: 600 };
const ROBOT_H = { x: 650, y: 905, w: 620 };
const KEYS = { cx: 300, cy: 1110, w: 230 };
const PROMPT = "commit, push, make a branch";

export const TerminalScene: React.FC<{ c: BC }> = ({ c }) => {
  const f = useCurrentFrame();
  const S = c.s;
  const k = {
    type: c.at("C08a", "type"),
    yourself: c.at("C08a", "yourself"),
    claude: c.at("C08b", "claude"),
    commit: c.at("C08b", "commit"),
    push: c.at("C08b", "push"),
    make: c.at("C08b", "make"),
    a: c.at("C08b", "a"),
    branch: c.at("C08b", "branch"),
    and: c.at("C08b", "and"),
    it: c.at("C08b", "it"),
    runs: c.at("C08b", "runs"),
    commands: c.at("C08b", "commands"),
  };
  const s0 = S.C08a.start;
  // the terminal rises out of a tilt (already well in on the cut)
  const termUp = prog(f, s0 - 8, s0 + 10, SMOOTH);
  const settle = prog(f, s0 - 6, s0 + 16, SMOOTH);
  // the robot hand taps while the prompt types and the results print
  const typingOn = f >= k.commit - 2 && f < k.commands + 12;
  // a slow typing bob (period 16 frames), eased in and out of the typing window so it starts and stops from rest
  const tapEnv = prog(f, k.commit - 4, k.commit + 10, SMOOTH) * (1 - prog(f, k.commands + 4, k.commands + 18, SMOOTH));
  const tap = typingOn || tapEnv > 0 ? (0.5 - 0.5 * Math.cos(((f - k.commit) / 16) * Math.PI * 2)) * 6 * tapEnv : 0;
  // the hands slide in from the frame edges (ease in-out, 20 frames), already under way on the crossing
  const handL = prog(f, s0 - 10, s0 + 10, SMOOTH);
  const handR = prog(f, s0 - 7, s0 + 13, SMOOTH);
  const keysP = prog(f, k.type - 2, k.type + 12, SMOOTH);
  const strike = prog(f, k.yourself - 2, k.yourself + 12, EASE.travel);
  const claudeP = prog(f, k.claude - 2, k.claude + 12, SMOOTH);
  const typed = typedChars(PROMPT, [k.commit, k.push, k.make, k.a, k.branch], f, 1.2);

  const keys = camPath({ f: s0, x: 540, y: 758.5, zoom: 1 })
    .push(S.C08b.start - 3, 0.03)
    .to(S.C08b.start - 2, zoomAt({ x: 540, y: 620 }, 1.05), 22)
    .push(S.C08b.end + 10, 0.024).keys;

  const w8a = c.ws("C08a");
  const w8b = c.ws("C08b");
  const top = (lines: ReturnType<typeof capLayout>): CapBlock => ({ lines, y: CAP_TOP, anchor: "top", w: 1000 });
  const pages: CapBlock[][] = [
    [top(capLayout(w8a, "You don't type any / *of this yourself.*"))],
    [top(capLayout(w8b, "Tell *Claude* to / *commit, push*"))],
    [top(capLayout(wsFrom(w8b, "or"), "or *make a branch,*"))],
    [top(capLayout(wsFrom(w8b, "and"), "and it / *runs the commands.*"))],
  ];

  return (
    <Camera keys={keys} blur={false} hud={<Pages pages={pages} until={S.C08b.end - 6} />}>
      <BackSheets f={f} layout={2} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(460 * (1 - termUp)).toFixed(2)}px)` }}>
        <TerminalPrompt
          x={TERM.x}
          y={TERM.y}
          w={TERM.w}
          h={TERM.h}
          f={f}
          fs={42}
          welcome={false}
          hint={false}
          tiltX={12 * (1 - settle)}
          prompt={PROMPT}
          typed={f >= k.and ? Math.max(0, PROMPT.length * (1 - prog(f, k.and, k.and + 12, SMOOTH))) : typed}
          history={[
            { text: PROMPT, kind: "prompt", tick: false, at: k.and },
            { text: "git commit", at: k.it },
            { text: "git push", at: k.runs },
            { text: "git switch -c idea", at: k.commands },
          ]}
        />
      </div>
      {/* the hands: human from the left (with the keyboard chip), robot from the right on the terminal's edge */}
      <Cutout kind="human" x={HUMAN.x - 700 * (1 - handL)} y={HUMAN.y + sway(f, 2, 90, 1)} w={HUMAN.w} h={HUMAN.w / (1490 / 1310)} />
      <Place cx={KEYS.cx} cy={KEYS.cy + sway(f, 2, 64, 3)} p={keysP} rot={-8}>
        <KeyboardChip w={KEYS.w} />
        <StrikeBar x0={-KEYS.w / 2 - 26} x1={KEYS.w / 2 + 26} y={0} p={strike} h={20} rot={-14} />
      </Place>
      <Cutout kind="robot" x={ROBOT_H.x + 700 * (1 - handR)} y={ROBOT_H.y - tap + sway(f, 1.5, 80, 2)} w={ROBOT_H.w} h={ROBOT_H.w / (1592 / 1308)} />
      {/* the Claude chip on the terminal's top-left corner */}
      {claudeP > 0 ? (
        <Place cx={TERM.x + 18} cy={TERM.y + 14} p={claudeP} k={1 + 0.06 * swell(f, k.claude + 6, 14)}>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <LogoChip cx={0} cy={0} name="Claude" src={LOGOS.claude} r={56} label={false} />
          </div>
        </Place>
      ) : null}
    </Camera>
  );
};
