// Scene BRANCH, B06b -> B08a (style uplift: the timeline lives on a big leaning paper stage card, 9 px wire, big commit
// cards, the robot at a laptop in front of the branch). One kit Camera.
//   B06b "Claude builds it on the side, and what already works stays untouched."
//        the stage lands (lean settles); the branch wire forks off the last main node (m2) and runs on below the main
//        line, the 'branch' word chip at the fork; a commit card lands above the branch on "builds" and one below it
//        on "side" while the robot types at its laptop in front; on "works" a tick chip pops on m2 (it never moves);
//        the white 'untouched' pill sets down on the main line.
//   B07a "If you like the result, merge it back into the main version."
//        the robot and laptop slide out; the branch curves back up into the main wire, the merge node pops with the
//        'merge' word chip on "merge"; the camera pushes in on the merge.
//   B07b "If you don't, delete the branch and nothing else changes."
//        the merge rewinds (the curve undraws, the node and chip pop off): the other ending. The scissors slide in from
//        below, the blades straddle the branch wire right after the fork, close on "delete", the cut opens behind the
//        tips and the cut-off branch (wire, nodes, cards) drops out of frame; m2, its tick and the main line stay.
//   B08a "And when a version is ready to show people, tag it v1, so you can always find it again."
//        three person chips pop above the main line on "people"; the paper tag swings down from m2 on "tag" and reads
//        v1; the magnifier glides in along the wire on "find" and stops on the tag; zoom 1.3 on the tag.
import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { EASE, PaperCard, Pill, Scissors, WireNode, WirePath, camPath, mix, prog, theme, zoomAt } from "../../../paperstudio";
import { WordChip } from "../Shared/wordChip";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { A, Btn, CommitCard, LAPTOP_ASPECT, Magnifier, PaperTag, PersonGlyph, Robot, TAG_IMG, TickGlyph } from "./objects";
import { PaperFace, Scene, bump, swell, sway, swing } from "./util";
import { PopIn } from "./paper";
import { Phone } from "./sApp";

export const BR = {
  stage: { x: 80, y: 290, w: 920, h: 540 },
  mainY: 382,
  m2: 230,
  branchY: 592,
  b1: 560,
  b2: 790,
  mg: 960,
  cut: 390,
  wire: 9,
};
const CARD = { w: 460, h: 170 };
const node = (cx: number, cy: number, at?: number) => (
  <PopIn at={at === undefined ? undefined : at - 2} dur={12} ox={cx} oy={cy}>
    <WireNode cx={cx} cy={cy} r={17} ring={7} />
  </PopIn>
);
const branchD = () => `M${BR.m2} ${BR.mainY} C ${BR.m2 + 70} ${BR.mainY}, ${BR.m2 + 80} ${BR.branchY}, ${BR.m2 + 150} ${BR.branchY} L ${BR.mg - 120} ${BR.branchY}`;
const mergeD = () => `M${BR.mg - 120} ${BR.branchY} C ${BR.mg - 60} ${BR.branchY}, ${BR.mg - 70} ${BR.mainY}, ${BR.mg} ${BR.mainY}`;

const beats = (c: Cues) => ({
  start: c.s.B06b.start,
  builds: c.w("B06b", "builds"),
  side: c.w("B06b", "side"),
  works: c.w("B06b", "works"),
  untouched: c.w("B06b", "untouched"),
  b7a: c.s.B07a.start,
  merge: c.w("B07a", "merge"),
  main: c.w("B07a", "main"),
  b7b: c.s.B07b.start,
  dont: c.w("B07b", ["don't", "dont"]),
  del: c.w("B07b", "delete"),
  nothing: c.w("B07b", "nothing"),
  b8a: c.s.B08a.start,
  people: c.w("B08a", "people"),
  tag: c.w("B08a", "tag"),
  v1: c.w("B08a", ["v1", "v"]),
  find: c.w("B08a", "find"),
  end: c.s.B09a.start,
});

const TAG_W = 190;
const TAG_REST = 2;
const TAG_HANG = { x: BR.m2, y: BR.mainY + 8 };
/** the tag face centre (world) at its resting swing angle */
const tagFace = () => {
  const k = TAG_W / TAG_IMG.w;
  const fx = (TAG_IMG.face.cx - TAG_IMG.hang.x) * k;
  const fy = TAG_IMG.face.cy * k;
  const a = (TAG_REST * Math.PI) / 180;
  return { x: TAG_HANG.x + fx * Math.cos(a) - fy * Math.sin(a), y: TAG_HANG.y + fx * Math.sin(a) + fy * Math.cos(a) };
};
/** magnifier lens centre: glides in from the right along the main wire, then down onto the tag face */
// RED TEAM RT-B-3: the lens comes in from the empty lower-left corner straight onto the tag face, its handle pointing
// down and left off the frame, so neither the lens nor the handle ever crosses a text
const lensAt = (c: Cues, f: number) => {
  const b = beats(c);
  const t = tagFace();
  const p = prog(f, b.find - 16, b.find + 8, EASE.travel);
  return { x: mix(-180, t.x + 4, p), y: mix(t.y + 260, t.y, p) };
};
/** the branch tip while it draws (for the camera follow) */
const tipAt = (c: Cues, f: number) => {
  const b = beats(c);
  const d = branchD();
  return getPointAtLength(d, getLength(d) * prog(f, b.start - 2, b.side + 4, EASE.travel));
};

const World: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = beats(c);
  const S = BR.stage;
  // the stage lands: lean 16 -> 6 deg and a slide up, settling over 14 frames
  const land = prog(f, b.start - 12, b.start + 10, EIO);
  const brP = prog(f, b.start - 8, b.side + 4, EASE.travel);
  // merge, then the rewind on "If you don't"
  const mgIn = prog(f, b.merge - 10, b.merge + 10, EASE.travel);
  const rewind = prog(f, b.b7b, b.b7b + 16, EASE.travel);
  const mgP = mgIn * (1 - rewind);
  const mgNode = prog(f, b.merge + 6, b.merge + 14, EIO) * (1 - prog(f, b.b7b + 2, b.b7b + 14, EIO));
  // the cut
  const close = prog(f, b.del - 4, b.del + 6, EIO);
  const drop = prog(f, b.del + 6, b.del + 30, EIO);
  const scIn = prog(f, Math.min(b.dont - 2, b.del - 22), b.del - 6, EIO);
  const scOut = prog(f, b.del + 14, b.del + 32, EIO);
  const opening = 23.4 * (1 - close) + 23.4 * prog(f, b.del + 8, b.del + 18, EIO);
  // robot + laptop in front during B06b, slide down out on B07a
  const botIn = prog(f, b.start - 14, b.start + 8, EIO) * (1 - prog(f, b.b7a - 4, b.b7a + 20, EIO));
  const typing = f >= b.builds - 2 && f < b.works ? -5 * Math.abs(Math.sin(((f - b.builds) / 5) * Math.PI)) : 0;
  const tagIn = prog(f, b.tag - 4, b.tag + 14, EIO);
  // RED TEAM RT-B-3: the tag swings in from the left (the empty side) and hangs straight down from the main node,
  // clear of the commit card on its right
  const tagRot = mix(64, TAG_REST, tagIn) + swing(f, b.tag + 8, 7, 18, 40);
  const lens = lensAt(c, f);
  const peopleAt = [b.people - 10, b.people + 2, b.people + 14];
  const cardY1 = BR.branchY - 26 - CARD.h / 2; // above the branch
  const cardY2 = BR.branchY + 26 + CARD.h / 2; // below the branch
  const lean = `perspective(2400px) translateY(${(70 * (1 - land)).toFixed(2)}px) rotateX(${mix(16, 6, land).toFixed(3)}deg)`;
  const lapW = 320;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: lean, transformOrigin: `540px ${S.y + S.h / 2}px` }}>
        <PaperCard x={S.x} y={S.y} w={S.w} h={S.h} sheets={2}>
          <PaperFace />
        </PaperCard>
        {/* main line and the last main node m2 */}
        <WirePath d={`M${S.x + 30} ${BR.mainY} L${S.x + S.w - 30} ${BR.mainY}`} w={BR.wire} />
        {node(S.x + 50, BR.mainY)}
        {node(BR.m2, BR.mainY)}
        {/* the branch: the piece before the cut stays, the piece after drops on "delete" */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 2000, height: 1920, clipPath: `inset(0 ${(2000 - BR.cut + 5 * close).toFixed(1)}px 0 0)` }}>
          <WirePath d={branchD()} p={brP} w={BR.wire} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${(14 * close + 30 * drop).toFixed(2)}px,${(420 * drop * drop + 6 * close).toFixed(2)}px) rotate(${(12 * drop).toFixed(2)}deg)`,
            transformOrigin: `${BR.cut}px ${BR.branchY}px`,
            opacity: 1 - prog(f, b.del + 10, b.del + 26, EIO),
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: 2000, height: 1920, clipPath: `inset(0 0 0 ${(BR.cut + 5 * close).toFixed(1)}px)` }}>
            <WirePath d={branchD()} p={brP} w={BR.wire} />
            {mgP > 0 ? <WirePath d={mergeD()} p={mgP} w={BR.wire} /> : null}
          </div>
          {f >= b.builds ? node(BR.b1, BR.branchY, b.builds) : null}
          {f >= b.side ? node(BR.b2, BR.branchY, b.side) : null}
          {f >= b.builds - 2 ? <CommitCard c={{ hash: "c41d0e8", msg: "add dark mode", tone: 0.7 }} cx={BR.b1 + 10} cy={cardY1 + sway(f, 1.5, 70)} w={CARD.w} h={CARD.h} at={b.builds - 2} /> : null}
          {f >= b.side - 2 ? <CommitCard c={{ hash: "e09b5f3", msg: "dark colors", tone: 0.7 }} cx={BR.b2 + 20} cy={cardY2 + sway(f, 1.5, 76, 2)} w={CARD.w} h={CARD.h} at={b.side - 2} /> : null}
        </div>
        {mgNode > 0 ? <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, mgNode * 2), transform: `scale(${mix(0.4, 1, mgNode).toFixed(3)})`, transformOrigin: `${BR.mg}px ${BR.mainY}px` }}>{node(BR.mg, BR.mainY)}</div> : null}
        {/* m2 never moves: the tick chip on it, the 'untouched' pill on the main line */}
        <Btn cx={BR.m2} cy={BR.mainY} r={44} p={prog(f, b.works - 2, b.works + 12, EIO)} s={1 + 0.08 * bump(f, b.works + 10, 16) + 0.06 * swell(f, b.nothing, 20)}>
          <TickGlyph p={prog(f, b.works + 4, b.works + 18, EASE.travel)} />
        </Btn>
        <PopIn at={b.untouched - 2} dur={14} ox={620} oy={BR.mainY}>
          <Pill x={620} y={BR.mainY - 33} text="untouched" light fs={42} />
        </PopIn>
      </div>
      {/* the 'branch' chip goes with the branch: it drops with the cut-off piece on "delete" */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${(14 * close + 30 * drop).toFixed(2)}px,${(420 * drop * drop + 6 * close).toFixed(2)}px) rotate(${(12 * drop).toFixed(2)}deg)`,
          transformOrigin: `${BR.cut}px ${BR.branchY}px`,
          opacity: 1 - prog(f, b.del + 10, b.del + 26, EIO),
        }}
      >
        <WordChip x={370} y={BR.mainY - 84} word="branch" size={48} at={b.start - 8} dur={14} rot={sway(f, 0.6, 80)} />
      </div>
      <WordChip x={830} y={BR.mainY - 84} word="merge" size={48} at={b.merge - 2} dur={14} scale={(1 + 0.06 * swell(f, b.main - 2, 16)) * (1 - 0.999 * prog(f, b.b7b + 2, b.b7b + 14, EIO))} />
      {/* the robot at its laptop, in front of the branch, typing */}
      {botIn > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(-760 * (1 - botIn)).toFixed(2)}px)` }}>
          <div style={{ position: "absolute", left: 318, top: 1068 - lapW / LAPTOP_ASPECT, width: lapW, height: lapW / LAPTOP_ASPECT, filter: theme.shadow.cutout, transform: "scaleX(-1)" }}>
            {A.laptop() ? <Img src={A.laptop()!} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
          </div>
          <Robot cx={180} bottom={1070} h={430} dy={typing} rot={sway(f, 1.2, 64) + (typing ? 2 : 0)} />
        </div>
      ) : null}
      {/* the scissors cut the branch right after the fork */}
      {scIn > 0 && scOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: BR.cut - 186,
            top: BR.branchY + 178 - 101,
            marginLeft: (1 - scIn) * 760 + scOut * 760,
            width: 380,
            height: 204,
            transformOrigin: "186px 101px",
            transform: "rotate(87.4deg)",
            filter: theme.shadow.cutout,
          }}
        >
          <Scissors src={A.scissors()} w={380} opening={opening} />
        </div>
      ) : null}
      {/* after the cut: the main line's working version, unchanged, slides up into the emptied space */}
      {f >= b.del + 20 ? (
        <CommitCard
          c={{ hash: "b7e21d4", msg: "add login page", tone: 0.4 }}
          cx={700}
          cy={725 + 160 * (1 - prog(f, b.del + 20, b.del + 40, EIO)) + sway(f, 1.5, 72, 4)}
          w={440}
          h={170}
          opacity={prog(f, b.del + 20, b.del + 34, EIO)}
          tf={`scale(${(1 + 0.04 * swell(f, b.nothing + 2, 20)).toFixed(4)})`}
        />
      ) : null}
      {/* after the cut: the app still works (the phone slides in from the left edge with all rows ticked); it slides
          back out to the left before the tag swings down into its place (RED TEAM RT-B-3: no tag over its rows) */}
      {f >= b.del + 18 && f < b.tag - 4 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${(-420 * (1 - prog(f, b.del + 18, b.del + 40, EIO)) - 480 * prog(f, b.tag - 24, b.tag - 4, EIO)).toFixed(2)}px) rotate(${(-3 * (1 - prog(f, b.del + 18, b.del + 40, EIO)) - 3 * prog(f, b.tag - 24, b.tag - 4, EIO)).toFixed(3)}deg)`,
          }}
        >
          <Phone P={{ x: 80, y: 580, w: 260 }} ticks={3} dy={sway(f, 2.5, 88, 5)} />
        </div>
      ) : null}
      {/* B08a: people, the tag, the magnifier */}
      {peopleAt.map((at, i) => (
        <Btn key={i} cx={590 + i * 132} cy={BR.mainY + 134} r={55} p={prog(f, at - 4, at + 20, EIO)}>
          <PersonGlyph />
        </Btn>
      ))}
      {tagIn > 0 ? <PaperTag x={TAG_HANG.x} y={TAG_HANG.y} text="v1" w={TAG_W} rot={tagRot} textP={prog(f, b.v1, b.v1 + 12, EIO)} opacity={Math.min(1, tagIn * 3)} /> : null}
      {f >= b.find - 16 ? <Magnifier cx={lens.x} cy={lens.y} r={100} rot={-38} opacity={prog(f, b.find - 16, b.find - 4, EIO)} /> : null}
    </>
  );
};

export const branchBlocks = (): BlockSpec[] => [
  { shots: ["B06b"], spec: "*Claude *builds *it", y: 1296, anchor: "bottom" },
  { shots: ["B06b"], spec: "*on *the *side,", y: 1296, anchor: "bottom" },
  { shots: ["B06b"], spec: "and what already works", y: 1296, anchor: "bottom" },
  { shots: ["B06b"], spec: "stays *untouched.", y: 1296, anchor: "bottom" },
  { shots: ["B07a"], spec: "If you like the result,", y: 1296, anchor: "bottom" },
  { shots: ["B07a"], spec: "*merge *it *back", y: 1296, anchor: "bottom" },
  { shots: ["B07a"], spec: "into the main version.", y: 1296, anchor: "bottom" },
  { shots: ["B07b"], spec: "If you don't,", y: 1296, anchor: "bottom" },
  { shots: ["B07b"], spec: "*delete *the *branch", y: 1296, anchor: "bottom" },
  { shots: ["B07b"], spec: "and nothing | *else *changes.", y: 1296, anchor: "bottom" },
  { shots: ["B08a"], spec: "And when a version", y: 1296, anchor: "bottom" },
  { shots: ["B08a"], spec: "is ready to show *people,", y: 1296, anchor: "bottom" },
  { shots: ["B08a"], spec: "tag it *v1,", y: 1296, anchor: "bottom" },
  { shots: ["B08a"], spec: "so you can always", y: 1296, anchor: "bottom" },
  { shots: ["B08a"], spec: "*find *it *again.", y: 1296, anchor: "bottom" },
];

export const SceneBranch: React.FC<{ c: Cues }> = ({ c }) => {
  const b = beats(c);
  const t = tagFace();
  const keys = camPath({ f: b.start, x: 540, y: 758.5, zoom: 1 })
    .push(b.works - 4, 0.012)
    .to(b.works - 6, zoomAt({ x: 230, y: 1060 }, 1.04), 22)
    .push(b.b7a - 2, 0.01)
    .to(b.merge - 10, zoomAt({ x: 900, y: 420 }, 1.15), 24)
    .push(b.b7b - 2, 0.015)
    .to(b.b7b, zoomAt({ x: 540, y: 560 }, 1.0), 22)
    .push(b.del + 22, 0.03)
    .to(b.del + 22, zoomAt({ x: 600, y: 600 }, 1.1), 24)
    .push(b.find - 6, 0.015)
    .to(b.find - 6, { x: 520, y: (t.y + 640) / 2, zoom: 1.08 }, 24)
    .push(b.end, 0.012).keys;
  return (
    <Scene
      c={c}
      from={b.start}
      to={b.end}
      keys={keys}
      follow={[{ from: b.start, to: b.side + 6, target: (fr) => tipAt(c, fr), lag: 5, weight: 0.18, axis: "x", ramp: 16 }]}
      world={<World c={c} />}
    />
  );
};
