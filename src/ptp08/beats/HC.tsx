import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, EASE, camPath, drift, mix, prog, type CapWord } from "../../paperstudio";
import { bodyOf, useVariant, useWords } from "../timing";
import { CaptionBlocks, HOOK_ID, IO, bump, cap1, findWord, hookPose, only, restyle, turnHandoff, useHook, useLine } from "./HC/hook";
import {
  COL,
  COL_RECT,
  DrawWire,
  Depth,
  GROUND,
  ICONS,
  Laptop,
  Node,
  Robot,
  SHEET_COL,
  SHEET_STAGE,
  SLOT_SCALE,
  SLOT_X,
  Sheet,
  Spine,
  TalkBubble,
  TwoFaceChip,
  UNIT_CX,
  UNIT_DEPTH,
  UPPER,
  WORDS,
  blinkAt,
  mixPose,
} from "./HC/parts";
import { wordChipSize } from "./Shared/wordChip";
// the bodies' first cards (read-only imports; each body builder owns its card's look)
import { FIRST_CARD as A_CARD, FirstCard as FirstCardA } from "./BodyA/firstCard";
import { FIRST_CARD as B_CARD, FirstCard as FirstCardB } from "./BodyB/firstCard";
import { FC as C_FC, FirstCard as FirstCardC } from "./BodyC/firstCard";

// ===========================================================================
// HC "the words" (ep08 hook 3, variant C; also CA, CB and their YT cuts). "Everyone building with AI keeps saying
// commit, push and branch. This is what those words actually mean."
//   FRAME 0 IS THE COVER (Victor 2026-11-07): a finished poster. A kraft paper stage (a white sheet peeking behind
//        it, parallax 0.75), the three robot-at-a-laptop units already standing on the drawn ground wire (the middle
//        one a step back), a Claude chip on each laptop screen, the drawn upper wire with the three word chips
//        (commit, push, branch; BA's shared WordChip) already on it, the first caption word fully on. From frame 0
//        the scene settles over 20 frames (eased) and breathes.
//   HC1  each robot hops on its word ("Everyone" middle, "building" left, "with" right); on "AI" the Claude chips on
//        the screens pulse.
//   HC2  "keeps saying": a black typing bubble (three dots) pops out of each robot. On "commit", "push", "branch" the
//        speaking robot hops, its dots turn into the word and its chip on the wire pulses (lift and swell); the
//        camera tracks along the chips.
//   HC3  the bubbles shrink back into the robots, the units shrink back and slide off sideways, the chips leave the
//        wire (branch, push, commit: their paths never cross) and grow into a column of big buttons (104 px type)
//        while the kraft sheet swings round under them as their page; the camera pulls back to 0.95. On "those words"
//        a git-log spine draws down the page with a travelling puck and a node pops beside each chip.
//   HC4  "actually mean": the chips flip over (split-flap, top to bottom) and show a solid icon each (instant camera,
//        up arrow, forked wire); their nodes fill. Hand-off (last HANDOFF_LEN frames, camera at identity, caption
//        gone): the page turns over and the body's first card comes round on its back (bodyOf(variant)): BodyC's
//        laptop card (C), BodyA's GitHub-on-Git stack card (CA), BodyB's terminal card (CB), full size and drawn with
//        no transform on the last hook frame, so it equals the body's frame 0.
// SMOOTHNESS (Victor 2026-11-07): entrances and exits 14-18 frames, pops 12-14, chip flips 18, camera moves 20-24,
// the hand-off one 18-frame eased motion; cubic in-out everywhere (IO = bezier(0.4, 0, 0.2, 1), EASE.travel for
// moves), bumps are (1 - cos) so they start and end at rest, ambient drift is sine only, nothing rounded.
// Every frame from ../timing (group-local); the shell draws the overlay (y 290-440) and the CRT pass. Camera blur off
// (the world carries text).
// ===========================================================================

/** hand-off targets per body (the card's centre, which is also its own transform origin, and its width) */
const TARGET = {
  A: { x: A_CARD.cx, y: A_CARD.cy, w: A_CARD.w },
  B: { x: B_CARD.centre.x, y: B_CARD.centre.y, w: B_CARD.term.w },
  C: { x: C_FC.centre.x, y: C_FC.centre.y, w: C_FC.laptop.w },
} as const;
/** units leave sideways in HC3: the left two to the left, the right one to the right */
const UNIT_DX = [-1180, -1180, 780];

export const HC: React.FC = () => {
  const f = useCurrentFrame();
  const body = bodyOf(useVariant());
  const { spans, end, ho } = useHook("HC", ["HC1", "HC2", "HC3", "HC4"]);
  const [s1, s2, s3, s4] = spans;

  // ---- word cues (group-local), found in order on the real transcript; fallbacks never fire on a healthy timeline
  const ws = useWords({ from: 0, to: end });
  let cursor = -Infinity;
  const cue = (re: RegExp, fb: number) => {
    const w = findWord(ws, re, cursor);
    if (!w) return fb;
    cursor = w.f + 1;
    return w.f;
  };
  const everyoneAt = cue(/^everyone$/, s1.start + 2);
  const buildingAt = cue(/^building$/, everyoneAt + 9);
  const withAt = cue(/^with$/, buildingAt + 9);
  const aiAt = cue(/^ai$/, withAt + 6);
  const keepsAt = cue(/^keeps$/, s2.start + 1);
  const sayingAt = cue(/^saying$/, keepsAt + 9);
  const commitAt = cue(/^commit$/, sayingAt + 8);
  const pushAt = cue(/^push$/, commitAt + 12);
  const branchAt = cue(/^branch$/, pushAt + 15);
  const thisAt = cue(/^this$/, s3.start + 8);
  const thoseAt = cue(/^those$/, thisAt + 16);
  const wordsAt = cue(/^words$/, thoseAt + 6);
  const actuallyAt = cue(/^actually$/, s4.start + 2);

  // ---- frame 0 is the poster: everything placed; from frame 0 it settles over 20 frames (eased) and breathes
  const settle0 = 1 - prog(f, 0, 20, IO);
  // ---- HC1: each robot hops on its word (middle, left, right); the Claude chips on the screens pulse on "AI"
  const unitWord = [buildingAt, everyoneAt, withAt];
  const unitHop = unitWord.map((a) => bump(prog(f, a - 3, a + 13, EASE.linear)));
  const chipOn = [0, 1, 2].map(() => 1);
  const aiPulse = [0, 1, 2].map((i) => bump(prog(f, aiAt - 3 + 2 * i, aiAt + 13 + 2 * i, EASE.linear)));
  const landAt = 0;
  // the wires are drawn on the cover frame
  const groundP = 1;

  // ---- HC2: typing bubbles on "keeps saying" (14 f pops), each turns into its word (12 f); the word chip rises out
  // of the bubble and settles on its node (16 f) with a soft squash
  const bubAt = [keepsAt - 2, keepsAt + 4, sayingAt - 2];
  const bubPop = bubAt.map((a) => prog(f, a, a + 14, IO));
  const bubFadeIn = bubAt.map((a) => prog(f, a, a + 7, IO));
  const wordAts = [commitAt, pushAt, branchAt];
  const morph = wordAts.map((a) => prog(f, a - 4, a + 8, EASE.travel));
  // each chip is on the wire from frame 0; it pulses (lifts and swells, 18 f) when its word is said
  const chipPulse = wordAts.map((a) => bump(prog(f, a - 2, a + 16, EASE.linear)));
  const hop = wordAts.map((a, i) => Math.max(bump(prog(f, a - 3, a + 13, EASE.linear)), unitHop[i]));
  const bubHop = bubAt.map((a) => bump(prog(f, a, a + 14, EASE.linear)));

  // ---- HC3: the bubbles shrink back into the robots (14 f), the units shrink back (16 f) and slide off (18 f), the
  // chips leave the wire branch first, then push, then commit (20 f each; their paths never cross, and no chip passes
  // over a bubble's word); the kraft sheet swings under the column (28 f); spine (24 f) and nodes on "those words"
  const out0 = s3.start;
  const bubOut = [0, 1, 2].map((i) => prog(f, out0 - 4 + i, out0 + 10 + i, IO));
  const shrink = prog(f, out0, out0 + 16, EASE.travel);
  const slide = [out0 + 2, out0 + 4, out0 + 2].map((a) => prog(f, a, a + 18, EASE.travel));
  const c3 = Math.max(out0 + 5, branchAt + 18);
  const COL_DUR = 20;
  const colAt = [c3 + 11, c3 + 4, c3];
  const col = colAt.map((a) => prog(f, a, a + COL_DUR, EASE.travel));
  const colSq = colAt.map((a) => bump(prog(f, a + COL_DUR - 6, a + COL_DUR + 6, EASE.linear)));
  const sheetP = prog(f, c3 - 2, c3 + 26, EASE.travel);
  const upperOut = prog(f, c3 + 8, c3 + 24, EASE.travel);
  const spineP = prog(f, thoseAt - 8, wordsAt + 10, EASE.travel);
  // a node pops beside each chip (12 f) on "those", "words", +5, never before its chip has arrived, top to bottom
  const nodeAt: number[] = [];
  [thoseAt - 1, wordsAt - 1, wordsAt + 5].forEach((a, i) => nodeAt.push(Math.max(a, colAt[i] + COL_DUR - 4, i ? nodeAt[i - 1] + 3 : -Infinity)));
  const nodeP = nodeAt.map((a) => prog(f, a, a + 12, IO));
  const stub = nodeAt.map((a) => prog(f, a + 2, a + 14, IO));
  const nodeBump = nodeAt.map((a) => 1 + 0.025 * bump(prog(f, a + 2, a + 16, EASE.linear)));

  // ---- HC4: the chips turn over top to bottom (18 f each, 3 f apart), all done before the hand-off; nodes fill as
  // each chip turns
  const flipAt = [actuallyAt - 3, actuallyAt, actuallyAt + 3].map((a) => Math.min(a, ho - 19));
  const flipP = flipAt.map((a) => prog(f, a, a + 18, EASE.travel));
  const nodeFill = flipP.map((p) => prog(p, 0.45, 1, IO));

  // ---- the sheets settle 1.5 px (a smooth bump) when something lands near them
  const lands = [landAt + 6, ...wordAts.map((a) => a + 6), ...colAt.map((a) => a + COL_DUR)];
  const settle = lands.reduce((acc, a) => acc + 1.5 * bump(prog(f, a - 4, a + 12, EASE.linear)), 0);

  // ---- hand-off: one continuous 18-frame eased move from the page to the body's first card (at rest on end - 1)
  const ho2 = turnHandoff(f, ho, end, COL_RECT, TARGET[body]);
  const last = f >= end - 1;

  // ---- captions: one line per beat (on screen: 58 regular, 92 bold italic), each on its own paper lane; the three
  // words themselves ride the bubbles and chips, so the caption does not repeat them
  // the cover: the caption lane is empty on frame 0 (the overlay carries the message); the first word's 10-frame
  // reveal starts at frame 1, so it is fully on by frame 11, still in sync with "Everyone"
  const l1 = cap1(useLine("HC1")).map((tk, k) => (k === 0 ? { ...tk, at: Math.max(1, Math.min(tk.at, 1)) } : tk));
  const b1: CapWord[][] = [[...only(l1, /^(everyone|building)$/i), ...restyle(only(l1, /^(with|AI)$/), /.*/, "bi")]];
  const b2: CapWord[][] = [restyle(only(useLine("HC2"), /^(keeps|saying)$/), /.*/, "bi")];
  const l3 = cap1(useLine("HC3"));
  const b3: CapWord[][] = [[...only(l3, /^(this|is|what)$/i), ...restyle(only(l3, /^(those|words)$/), /.*/, "bi")]];
  const b4: CapWord[][] = [restyle(useLine("HC4"), /.*/, "bi")];
  // the last line leaves as the hand-off starts (gone before the card's lower edge reaches the caption band)
  const lastExit = ho + 3;

  // ---- camera (hooks: at most 1.03 so nothing is ever cut by the frame edge, small lateral leans; blur off; moves
  // 20-24 f, one at a time; holds drift): identity on the cover frame, push 1.00 -> 1.03 over HC1; lean onto chip 1 on "commit"; a slow pan right along the chips to land as "branch" lands;
  // pull back to 0.95 for the column as the chips leave the wire; drift; identity from "actually", still through the
  // hand-off
  const P = { x: 540, y: 880 };
  const lean1 = commitAt - 6;
  const panA = lean1 + 20;
  const panB = Math.max(panA + 20, branchAt + 12);
  const pullAt = Math.max(panB + 1, c3 - 2);
  const homeAt = Math.max(pullAt + 25, actuallyAt - 4);
  const keys = camPath({ f: 0, ...hookPose(P, 1.0) })
    .push(lean1, 0.03)
    .to(lean1, hookPose(P, 1.03, -10), 20)
    .to(panA, hookPose(P, 1.03, 10), panB - panA, EASE.drift)
    .to(pullAt, hookPose({ x: 540, y: 800 }, 0.95), 24)
    .push(homeAt, 0.02)
    .to(homeAt, HOOK_ID, Math.max(20, Math.min(24, ho - 1 - homeAt)))
    .hold(end).keys;

  // ---- the ground wire: drawn on the cover frame; in HC3 its two halves leave with the units
  const groundSplit = slide[0] > 0 || slide[2] > 0;
  const gy = GROUND.y;
  const GroundWire = groundSplit ? (
    <>
      <DrawWire a={{ x: GROUND.x0, y: gy }} b={{ x: 540, y: gy }} p={1 - slide[1]} />
      <DrawWire a={{ x: GROUND.x1, y: gy }} b={{ x: 540, y: gy }} p={1 - slide[2]} />
    </>
  ) : (
    <>
      <DrawWire a={{ x: 540, y: gy }} b={{ x: GROUND.x0, y: gy }} p={groundP} />
      <DrawWire a={{ x: 540, y: gy }} b={{ x: GROUND.x1, y: gy }} p={groundP} />
    </>
  );

  // ---- the upper wire: drawn on the cover frame; retracts back into the centre in HC3 as the chips leave it, each
  // node shrinking (12 f) as the tip passes back
  const up = 1 - upperOut;
  const reach = (x: number) => Math.max(0.02, Math.abs(x - 540) / (540 - UPPER.x0));
  const passOut = (x: number) => {
    for (let k = c3 + 8; k <= c3 + 24; k++) if (1 - prog(k, c3 + 8, c3 + 24, EASE.travel) <= reach(x)) return k;
    return c3 + 24;
  };
  const UpperWire =
    up > 0.001 || f < c3 + 40 ? (
      <>
        {up > 0.001 ? (
          <>
            <DrawWire a={{ x: 540, y: UPPER.y }} b={{ x: UPPER.x0, y: UPPER.y }} p={up} />
            <DrawWire a={{ x: 540, y: UPPER.y }} b={{ x: UPPER.x1, y: UPPER.y }} p={up} />
          </>
        ) : null}
        {SLOT_X.map((x, i) => {
          const b = passOut(x);
          const p = 1 - prog(f, b - 6, b + 6, IO);
          return <Node key={i} cx={x} cy={UPPER.y} p={p} />;
        })}
      </>
    ) : null;

  // ---- the units (back one first, then the front two)
  const unit = (i: number) => {
    const cx = UNIT_CX[i];
    if (slide[i] >= 0.999) return null;
    const d = UNIT_DEPTH[i];
    const enterDx = 0;
    const lean = 0;
    // the cover-frame settle: each unit eases the last few px down onto the wire over frames 0-20
    const dropY = -(i === 1 ? 6 : 8) * settle0;
    const sq = 0;
    const sc = d.s * mix(1, 0.84, shrink);
    const o = 1;
    const sway = 0.7 * Math.sin(((f + i * 37) / 140) * Math.PI * 2);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${cx}px ${GROUND.y}px`,
          transform: `translate(${(UNIT_DX[i] * slide[i] + enterDx).toFixed(3)}px,${(d.dy + dropY).toFixed(3)}px) rotate(${lean.toFixed(4)}deg) scale(${(sc * (1 + 0.03 * sq)).toFixed(5)},${(sc * (1 - 0.04 * sq)).toFixed(5)})`,
          opacity: o,
          willChange: "transform",
        }}
      >
        <Laptop cx={cx} chip={chipOn[i]} pulse={aiPulse[i]} f={f} seed={i} />
        <Robot cx={cx} rot={sway - 2.5 * hop[i]} dy={-14 * hop[i] - 7 * bubHop[i] + 1.5 * Math.sin(((f + i * 41) / 120) * Math.PI * 2)} blink={blinkAt(f, i + 1)} />
      </div>
    );
  };

  // ---- the chips: out of the bubble onto the upper wire (HC2), into the column (HC3), turned over (HC4)
  const chips = WORDS.map((w, i) => {
    // on the wire from the cover frame (settling the last 6 px), lifting 10 px and swelling as its word is said
    const x0 = SLOT_X[i];
    const y0 = UPPER.y - 6 * settle0 - 10 * chipPulse[i];
    // into the column: it travels small and only grows over the last 70% (so it never swells into a neighbour);
    // branch drops first and only then slides left
    const c = col[i];
    const g = prog(c, 0.3, 1, IO);
    const cxP = i === 2 ? prog(c, 0.25, 1, IO) : c;
    const arc = [20, 0, 0][i];
    const dr = drift(f, 2, 120, 3 + i * 2);
    const x = mix(x0, COL.cx, cxP) + dr.x * c;
    const y = mix(y0, COL.ys[i], c) - arc * Math.sin(Math.PI * c) + dr.y * c + (1 - c) * 1.5 * Math.sin(((f + i * 29) / 96) * Math.PI * 2);
    const natural = wordChipSize(w, COL.size).w;
    return (
      <TwoFaceChip
        key={w}
        cx={x}
        cy={y}
        word={w}
        icon={ICONS[i]}
        scale={mix(SLOT_SCALE, 1, g) * nodeBump[i] * (1 + 0.08 * chipPulse[i])}
        minW={mix(natural, COL.w, g)}
        flip={flipP[i]}
        squash={colSq[i]}
      />
    );
  });

  const sheet = mixPose(SHEET_STAGE, SHEET_COL, sheetP);
  const sheetBack = { ...sheet, x: sheet.x + 26, y: sheet.y - 22, rot: sheet.rot + 3.5 };
  const sIn = 4 * settle0;

  const scene = (
    <>
      <Depth d={0.75}>
        <Sheet p={sheetBack} dy={sIn * 1.3 + settle * 0.6} seed={7} />
        <Sheet p={sheet} kraft dy={sIn + settle} seed={3} />
      </Depth>
      {UpperWire}
      {GroundWire}
      <Depth d={0.9}>{unit(1)}</Depth>
      {unit(0)}
      {unit(2)}
      {WORDS.map((w, i) => (
        <TalkBubble key={w} i={i} f={f} word={w} pop={bubPop[i] * (1 - bubOut[i])} fade={bubFadeIn[i] * (1 - bubOut[i])} morph={morph[i]} />
      ))}
      <Spine p={spineP} node={nodeP} stub={stub} fill={nodeFill} />
      {chips}
    </>
  );

  const cardTf = last ? undefined : ho2.cardTf;
  const card =
    body === "A" ? (
      <FirstCardA t={0} tf={cardTf} />
    ) : body === "C" ? (
      <FirstCardC t={0} tf={cardTf} />
    ) : (
      // BodyB's card has no transform prop: turn it in a wrapper about its centre (none on the last frame)
      <AbsoluteFill style={{ transformOrigin: `${B_CARD.centre.x}px ${B_CARD.centre.y}px`, transform: cardTf }}>
        <FirstCardB t={0} />
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill>
      <Camera box="hook" keys={keys} blur={false} hud={<CaptionBlocks f={f} blocks={[b1, b2, b3, b4]} lastExit={lastExit} />}>
        {/* the body's first card rides under the page during the hand-off */}
        {ho2.cardShown ? <AbsoluteFill style={{ opacity: last ? undefined : ho2.cardO }}>{card}</AbsoluteFill> : null}
        {ho2.objShown ? (
          <AbsoluteFill style={{ transformOrigin: ho2.objOrigin, transform: f >= ho ? ho2.objTf : undefined, opacity: f >= ho ? ho2.objO : 1 }}>{scene}</AbsoluteFill>
        ) : null}
      </Camera>
    </AbsoluteFill>
  );
};
