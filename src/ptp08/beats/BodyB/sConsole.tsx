// Scene CONSOLE: the Claude Code terminal at its first-card place with the 1 2 3 4 step strip. It is on screen in five
// windows (each its own kit Camera, hard cuts in and out on a word):
//   W1 B01a + B01b  "Here's the exact routine. Before you build anything, tell Claude to set up Git and connect ..."
//                   frame 0 = FirstCard t 0 at identity (the hand-off target); B01a caption on top, nodes pulse on
//                   "routine"; B01b tilts the camera (caption at the bottom), the prompt types word by word, the Git
//                   and GitHub chips pop on a wire above the terminal, step 1 fills on "GitHub"
//   W2 "you say commit."                      types 'commit', step 2 fills
//   W3 "Next, say push,"                      types 'push', step 3 fills
//   W4 "Tell Claude to go back to the last commit that worked,"   types it word by word
//   W5 B06a "Want to test a risky idea? Ask for a branch."         types 'make a branch for dark mode', step 4 fills
// Every frame from the cues (group-local). Captions in the hud (bottom except B01a).
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, PaperCard, WirePath, camPath, mix, prog } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { FIRST_CARD, FirstCard, chipBob, stepFill, stepPulse } from "./firstCard";
import { typedChars } from "./terminalPrompt";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { Logo } from "./objects";
import { ID, PaperFace, Scene, bump, sway, swell } from "./util";

/** world y of the input box centre (welcome box on) and the screen y it is framed at while the caption is at the bottom */
const PROMPT_Y = 883;
const FRAME_Y = 710;
/** the console pose with the caption at the bottom: the prompt framed at FRAME_Y at zoom z */
export const consolePose = (z = 1) => ({ x: 540, y: PROMPT_Y + (758.5 - FRAME_Y) / z, zoom: z });

/** the chain above the terminal: Claude chip (the card's corner chip) -> Git -> GitHub */
const CHAIN = {
  git: { x: 400, y: 484, r: 44 },
  github: { x: 780, y: 484, r: 44 },
};
const wireA = () => {
  const c = FIRST_CARD.chip;
  return `M${c.cx + 30} ${c.cy - 30} C ${c.cx + 120} ${CHAIN.git.y + 10}, ${CHAIN.git.x - 170} ${CHAIN.git.y}, ${CHAIN.git.x - CHAIN.git.r} ${CHAIN.git.y}`;
};
const wireB = () => `M${CHAIN.git.x + CHAIN.git.r} ${CHAIN.git.y} L${CHAIN.github.x - CHAIN.github.r} ${CHAIN.github.y}`;

export type ConsoleWin = { id: 1 | 2 | 3 | 4 | 5; from: number; to: number };

/** the console holds a few frames past "and" so the filled step and the typed command read, then the board cuts in */
export const pushCut = (c: Cues) => Math.min(c.w("B04a", "and") + 6, c.w("B04a", "save") - 4);
export const backCut = (c: Cues) => Math.min(c.w("B05b", "and") + 3, c.w("B05b", "there") - 6);

export const consoleBeats = (c: Cues) => {
  const gitAt = c.w("B01b", "git");
  const ghAt = c.w("B01b", "github");
  return {
    routine: c.w("B01a", "routine"),
    tell: c.w("B01b", "tell"),
    claude: c.w("B01b", "claude"),
    gitAt,
    ghAt,
    // each step fills on its spoken command word (visible for the rest of its window)
    fill: [Math.min(c.w("B01b", "github") + 3, c.s.B02a.start - 6), c.w("B03a", "commit") + 1, c.w("B04a", "push") + 1, c.w("B06a", "branch") - 1],
    wins: [
      { id: 1, from: 0, to: c.s.B02a.start },
      { id: 2, from: c.w("B03a", "you") - 1, to: c.s.B03b.start },
      { id: 3, from: c.s.B04a.start, to: pushCut(c) },
      { id: 4, from: c.s.B05b.start, to: backCut(c) },
      { id: 5, from: c.s.B06a.start, to: c.s.B06b.start },
    ] as ConsoleWin[],
  };
};

/** the prompt typed in each window, and the frames its words start on */
const promptOf = (c: Cues, id: ConsoleWin["id"]): { text: string; starts: number[] } => {
  switch (id) {
    case 1:
      return {
        text: "set up git and connect this project to GitHub",
        starts: [c.w("B01b", "set"), c.w("B01b", "up"), c.w("B01b", "git"), c.w("B01b", "and"), c.w("B01b", "connect"), c.w("B01b", "the"), c.w("B01b", "project"), c.w("B01b", "to", 1), c.w("B01b", "github")],
      };
    case 2:
      return { text: "commit", starts: [c.w("B03a", "commit")] };
    case 3:
      return { text: "push", starts: [c.w("B04a", "push")] };
    case 4:
      return {
        text: "go back to the last commit that worked",
        starts: ["go", "back", "to", "the", "last", "commit", "that", "worked"].map((k) => c.w("B05b", k, k === "to" ? 1 : 0)),
      };
    default:
      return {
        text: "make a branch for dark mode",
        starts: [c.w("B06a", "test"), c.w("B06a", "a"), c.w("B06a", "risky"), c.w("B06a", "idea"), c.w("B06a", "ask"), c.w("B06a", "for")],
      };
  }
};

const World: React.FC<{ c: Cues; win: ConsoleWin }> = ({ c, win }) => {
  const f = useCurrentFrame();
  const b = consoleBeats(c);
  const pr = promptOf(c, win.id);
  const typed = typedChars(pr.text, pr.starts, f);
  const fills = b.fill.map((at) => stepFill(f, at));
  // B01a: the four steps pulse one after another on "routine"; elsewhere the step that fills swells
  const pulse = b.fill.map((at, i) => (win.id === 1 ? 1 + 0.08 * swell(f, b.routine - 2 + i * 4, 14) : 1) * stepPulse(f, at));
  // the chain above the terminal (W1 pops it on "Git" / "GitHub"; later windows show it built)
  const built = win.id > 1;
  const pGit = built ? 1 : prog(f, b.gitAt - 2, b.gitAt + 12, EIO);
  const pGh = built ? 1 : prog(f, b.ghAt - 2, b.ghAt + 12, EIO);
  const wA = built ? 1 : prog(f, b.gitAt - 12, b.gitAt + 2, EASE.travel);
  const wB = built ? 1 : prog(f, b.ghAt - 16, b.ghAt + 2, EASE.travel);
  const claudeK = win.id === 1 ? 1 + 0.12 * swell(f, b.claude - 4, 22) : 1;
  // W2-W5 cut in on the console already landing: a 10 deg lean and a slide from the right that settle in 12 frames
  const land = win.id === 1 ? 1 : prog(f, win.from - 4, win.from + 16, EIO);
  const lean = win.id === 1 ? "" : `perspective(2200px) translateX(${(110 * (1 - land)).toFixed(2)}px) rotateY(${(-10 * (1 - land)).toFixed(3)}deg)`;
  // the console's stage: a big paper sheet behind the terminal and the strip (fades and rises in after frame 0, so
  // BodyB frame 0 is exactly the first card)
  const stageIn = win.id === 1 ? prog(f, 2, 26, EIO) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, transform: lean || undefined, transformOrigin: "540px 890px" }}>
    {stageIn > 0.001 ? (
      <div style={{ position: "absolute", inset: 0, opacity: stageIn, transform: `translateY(${(90 * (1 - stageIn)).toFixed(2)}px) rotate(-1.2deg)`, transformOrigin: "540px 900px" }}>
        <PaperCard x={50} y={520} w={980} h={740} sheets={2}>
          <PaperFace />
        </PaperCard>
      </div>
    ) : null}
    <FirstCard t={f} prompt={pr.text} typed={typed} fills={fills} pulse={pulse} chipDy={chipBob(f)}>
      {wA > 0 ? <WirePath d={wireA()} p={wA} /> : null}
      {wB > 0 ? <WirePath d={wireB()} p={wB} /> : null}
      <Logo k="git" cx={CHAIN.git.x} cy={CHAIN.git.y + sway(f, 2.5, 64, 1)} r={CHAIN.git.r} p={pGit} s={1 + 0.1 * bump(f, b.gitAt + 6, 10)} />
      <Logo k="github" cx={CHAIN.github.x} cy={CHAIN.github.y + sway(f, 2.5, 64, 2)} r={CHAIN.github.r} p={pGh} s={1 + 0.1 * bump(f, b.ghAt + 6, 10)} />
      {/* B01b "tell Claude": the corner chip swells (drawn by FirstCard; a soft ring echoes it) */}
      {claudeK > 1.001 ? (
        <div
          style={{
            position: "absolute",
            left: FIRST_CARD.chip.cx - 60,
            top: FIRST_CARD.chip.cy - 60 + chipBob(f),
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "5px solid rgba(17,17,17,.55)",
            transform: `scale(${mix(0.8, 1.25, (claudeK - 1) / 0.12).toFixed(3)})`,
            opacity: (claudeK - 1) / 0.12,
          }}
        />
      ) : null}
    </FirstCard>
    </div>
  );
};

export const consoleBlocks = (id: ConsoleWin["id"]): BlockSpec[] => {
  switch (id) {
    case 1:
      return [
        { shots: ["B01a"], spec: "Here's the | *exact *routine.", y: 300 },
        { shots: ["B01b"], spec: "Before you | build *anything,", y: 1296, anchor: "bottom" },
        { shots: ["B01b"], spec: "tell Claude to | *set *up *Git", y: 1296, anchor: "bottom" },
        { shots: ["B01b"], spec: "and connect the project | to *GitHub.", y: 1296, anchor: "bottom" },
      ];
    case 2:
      return [{ shots: ["B03a"], spec: "you say *commit.", y: 1296, anchor: "bottom" }];
    case 3:
      return [{ shots: ["B04a"], spec: "Next, say *push,", y: 1296, anchor: "bottom" }];
    case 4:
      return [
        { shots: ["B05b"], spec: "Tell Claude to | *go *back", y: 1296, anchor: "bottom" },
        { shots: ["B05b"], spec: "to the last commit | *that *worked,", y: 1296, anchor: "bottom" },
      ];
    default:
      return [
        { shots: ["B06a"], spec: "Want to test | a *risky *idea?", y: 1296, anchor: "bottom" },
        { shots: ["B06a"], spec: "Ask for | a *branch.", y: 1296, anchor: "bottom" },
      ];
  }
};

const Win: React.FC<{ c: Cues; win: ConsoleWin }> = ({ c, win }) => {
  const b = consoleBeats(c);
  let keys;
  if (win.id === 1) {
    // identity on frame 0 (the hand-off), a slow push through B01a, then a tilt down so the caption fits under the
    // strip, with a 4% push onto the typing; back to the console pose at 1.0 before the cut
    // the tilt starts while the top caption fades (it is gone by B01b.start - 1), so "Before" lands on its word with
    // the strip already rising clear of the bottom caption
    const tilt = c.s.B01b.start - 8;
    keys = camPath({ f: 0 })
      .push(tilt, 0.015)
      .to(tilt, consolePose(1.0), 24)
      .push(Math.max(tilt + 20, b.gitAt - 8), 0.03)
      .push(win.to, 0.006).keys;
  } else {
    // cut in at the console pose already drifting in on the prompt
    keys = camPath({ f: win.from, ...consolePose(1.0) })
      .push(win.to, win.to - win.from > 60 ? 0.035 : 0.025).keys;
  }
  return (
    <Scene
      c={c}
      from={win.from}
      to={win.to}
      keys={keys}
      breathe={win.id === 1 ? 0 : 1.2}
      crossIn={win.id !== 1}
      sheetsIn={win.id === 1 ? 2 : win.from - 4}
      world={<World c={c} win={win} />}
    />
  );
};

/** the console windows `ids` near f (each crosses with its neighbouring boards; Scene draws only its own span plus the
 *  crossings). BodyB.tsx places each window in time order between the boards, so the incoming scene is always on top. */
export const SceneConsole: React.FC<{ c: Cues; ids: ConsoleWin["id"][] }> = ({ c, ids }) => {
  const f = useCurrentFrame();
  const b = consoleBeats(c);
  const near = b.wins.filter((w) => ids.includes(w.id) && f >= w.from - 8 && f < w.to + 8);
  return (
    <>
      {near.map((w) => (
        <Win key={w.id} c={c} win={w} />
      ))}
    </>
  );
};

export { ID };
