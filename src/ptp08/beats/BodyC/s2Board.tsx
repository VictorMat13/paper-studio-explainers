// Scene 2, BOARD: C04a, C04b, C05a, C06a, C07a, C07b. One world, one kit Camera that travels across it. Captions in
// the hud top band (screen 290-500); the board lives below it (world y 520-1300) at every camera pose, so nothing ever
// crosses a caption (the slab leaves sideways before the camera zooms onto the tag).
//   C04a  the GitHub slab (hero, 380 wide) drops in and lands with a 2-frame squash; two pills 'broken prompt' / 'dead
//         laptop' pop under it and get a black tick each.
//   C04b  the slab shrinks to 220 and rises to the top; a 7 px wire draws under it, five commit cards land one per word
//         (alternating above / below, each with a squash); 'snapshot': the newest card opens its file tree, the camera
//         leans onto it; 'bad prompt': a black bubble 'add dark mode', the card cracks and tilts; 'one step back': a ring
//         marker slides back exactly one node, the cracked card drops off the wire.
//   C05a  a big laptop rises at the left and the timeline shrinks onto its glass; the slab slides right and a white
//         'online' card slides in under it; a dashed arrow draws from the laptop to the card, a 'push' chip pops on it,
//         copies of the four cards fly along it and land as rows in the card; 'dead': the glass cracks and goes dark;
//         'computer costs you nothing': the laptop sinks off the bottom, a 'nothing' pill with a struck coin sets down.
//   C06a  the slab moves back, the timeline draws out under it again; 'solid': a tick on the last card; before 'tag' the
//         slab slides out left; 'tag it v1': the paper tag swings onto the last node and 'v1' inks in (zoom 1.3);
//         'always': a newer node extends the wire; 'get back to it': a curved dashed arrow back to the tag, the ring rides back.
//   C07a  the camera tracks right along the wire: a branch forks off at 30 deg, a 'branch' chip, a small app card on the
//         branch with a bubble 'try dark mode'.
//   C07b  'works out': a tick on the branch card; 'merge it in': the branch curves back into the main wire (merge node,
//         'merge' chip), the card lands on the main line as a commit; 'flops': a second branch with its own card, which
//         cracks; 'throw it away': the scissors straddle that branch's wire, open and close, the cut opens behind the
//         tips and the cut-off branch with its card drops off the bottom.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, ChatBubble, DashedArrow, EASE, MONO, PaperCard, Scissors, ShatterOverlay, WireNode, WirePath, camAtKeys, camPath, mix, prog, theme } from "../../../paperstudio";
import { WordChip } from "../Shared/wordChip";
import type { BC } from "./cues";
import { AppCard, InkPill, Laptop, SCREEN, screenPoint } from "./firstCard";
import { BackSheets, CommitCard, Coin, GithubSlab, PaperTag, Place, RingMarker, TagPhoto, TickChip } from "./objects";
import { PHOTOS } from "./assets";
import { capLayout, Pages, SMOOTH, sway, swell, wsFrom, type CapBlock } from "./parts";
import { CAP_TOP } from "./s1Laptop";

// ------------------------------------------------------------------ world layout
const WY = 980;
/** the timeline is wider than the frame (cards 460 x 145): the camera tracks along it at zoom 1.2-1.35 */
const NX = [490, 790, 1090, 1390, 1690];
const CARD_W = 460;
const CARD_FS = 44;
const STEM = 36;
const CARDS = [
  { hash: "3f9a1c2", msg: "first version", above: false, dx: 0 },
  { hash: "8b2e7d4", msg: "add login page", above: true, dx: 0 },
  { hash: "c71d0a9", msg: "change colours", above: false, dx: -14 },
  { hash: "e5a38f1", msg: "save progress", above: true, dx: 0 },
  { hash: "2d6b4e8", msg: "add dark mode", above: false, dx: 0 },
];
const BASE_H = CARD_FS * 3.3;
const cardCy = (above: boolean) => (above ? WY - STEM - BASE_H / 2 : WY + STEM + BASE_H / 2);

const SLAB_HERO = { x: 540, y: 800, w: 380 };
/** C04b and C06a: the slab sits inline at the wire's left end, the timeline grows out of it (the repo) */
const SLAB_TOP = { x: 140, y: WY, w: 220 };
const SLAB_RIGHT = { x: 805, y: 640, w: 220 };
/** the C05a laptop (left) and the 'online' card (right, under the slab) */
const LB = { x: 20, y: 800, w: 560, h: 560 / (1890 / 1506) };
const ONLINE = { x: 625, y: 800, w: 360, h: 390 };
const ROW = { x0: ONLINE.x + 34, y0: ONLINE.y + 70, h: 76 };
/** the tag hangs from node 4 */
const TAG_W = 120;
/** the branch geometry (world px, right of the first screen) */
const T30 = Math.tan((30 * Math.PI) / 180);
const FORK = { x: NX[4], y: WY };
const B1 = { x: FORK.x + 160, y: WY + 160 * T30 };
const B2 = { x: 2110, y: B1.y };
const MERGE = { x: 2250, y: WY };
const BCARD = { cx: 2000, cy: 1262, w: 420, h: 300 };
const MCARD_X = 2490;
const FORK2 = { x: 2580, y: WY };
const C1 = { x: FORK2.x + 160, y: WY + 160 * T30 };
const C2 = { x: 3000, y: C1.y };
const CCARD = { cx: 2890, cy: 1262, w: 420, h: 300 };
const CUT = { x: FORK2.x + 70, y: WY + 70 * T30 };

const lerpPt = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
/** a 2-frame squash on landing (1 -> 0.94 -> 1 in y), for things that drop onto the paper */
const squash = (f: number, at: number) => 1 - 0.04 * swell(f, at, 10);

const cues = (c: BC) => {
  const S = c.s;
  return {
    S,
    fixes: c.at("C04a", "fixes"),
    both: c.at("C04a", "both"),
    every: c.at("C04b", "every"),
    words5: [c.at("C04b", "every"), c.at("C04b", "commit"), c.at("C04b", "is"), c.at("C04b", "a"), c.at("C04b", "snapshot")],
    snapshot: c.at("C04b", "snapshot"),
    so: c.at("C04b", "so"),
    bad: c.at("C04b", "bad"),
    prompt: c.at("C04b", "prompt"),
    one: c.at("C04b", "one"),
    step: c.at("C04b", "step"),
    push: c.at("C05a", "push"),
    fly: [c.at("C05a", "sends"), c.at("C05a", "that"), c.at("C05a", "history"), c.at("C05a", "online")],
    online: c.at("C05a", "online"),
    dead: c.at("C05a", "dead"),
    computer: c.at("C05a", "computer"),
    nothing: c.at("C05a", "nothing"),
    solid: c.at("C06a", "solid"),
    tag: c.at("C06a", "tag"),
    v1: c.at("C06a", "v1"),
    always: c.at("C06a", "always"),
    get: c.at("C06a", "get"),
    branch: c.at("C07a", "branch"),
    risky: c.at("C07a", "risky"),
    copy: c.at("C07a", "copy"),
    works: c.at("C07b", "works"),
    merge: c.at("C07b", "merge"),
    flops: c.at("C07b", "flops"),
    throw: c.at("C07b", "throw"),
  };
};

/** a hollow wire node that pops over 12 frames (cubic in-out, scale 0.6 -> 1), instead of the kit's 8-frame pop */
const Node: React.FC<{ cx: number; cy: number; at?: number; r?: number; opacity?: number }> = ({ cx, cy, at, r, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + 12, SMOOTH);
  return (
    <Place cx={cx} cy={cy} p={p} opacity={opacity}>
      <WireNode cx={0} cy={0} r={r} />
    </Place>
  );
};

/** a mini app window (the to-do app at a small size, world px), centred */
const MiniApp: React.FC<{ w: number; h: number; t: number; grey?: number; crackAt?: number }> = ({ w, h, t, grey = 0, crackAt }) => {
  const s = w / 860;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, filter: grey > 0.01 ? `grayscale(1) opacity(${(1 - 0.4 * grey).toFixed(3)})` : undefined }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 860, height: 760, transform: `scale(${s.toFixed(4)}, ${(h / 760).toFixed(4)})`, transformOrigin: "0 0", borderRadius: 30, boxShadow: theme.shadow.card }}>
        <AppCard t={t} x={0} y={0} />
      </div>
      {crackAt !== undefined ? <ShatterOverlay x={0} y={0} w={w} h={h} ox={w * 0.7} oy={h * 0.3} seed={31} at={crackAt} dur={16} radius={12} /> : null}
    </div>
  );
};

export const BoardScene: React.FC<{ c: BC }> = ({ c }) => {
  const f = useCurrentFrame();
  const k = cues(c);
  const S = k.S;

  // ---------------------------------------------------------------- slab pose
  const land = S.C04a.start + 8;
  const drop = prog(f, S.C04a.start - 10, land, SMOOTH);
  const toTop = prog(f, S.C04b.start - 14, S.C04b.start + 8, EASE.travel);
  const toRight = prog(f, S.C05a.start - 4, S.C05a.start + 16, EASE.travel);
  const backTop = prog(f, S.C06a.start - 20, S.C06a.start, EASE.travel);
  const slabOut = 0;
  let slab = { x: SLAB_HERO.x, y: mix(SLAB_HERO.y - 420, SLAB_HERO.y, drop), w: SLAB_HERO.w };
  if (toTop > 0) slab = { x: mix(SLAB_HERO.x, SLAB_TOP.x, toTop), y: mix(SLAB_HERO.y, SLAB_TOP.y, toTop), w: mix(SLAB_HERO.w, SLAB_TOP.w, toTop) };
  if (toRight > 0) slab = { x: mix(SLAB_TOP.x, SLAB_RIGHT.x, toRight), y: mix(SLAB_TOP.y, SLAB_RIGHT.y, toRight), w: SLAB_TOP.w };
  if (backTop > 0) slab = { x: mix(SLAB_RIGHT.x, SLAB_TOP.x, backTop) - 760 * slabOut, y: mix(SLAB_RIGHT.y, SLAB_TOP.y, backTop), w: SLAB_TOP.w };
  const slabBump = k.fly.reduce((a, t) => a + 0.05 * swell(f, t + 13, 14), 0);
  const slabSquash = squash(f, land - 1);

  // ---------------------------------------------------------------- C04a pills
  const pillsOut = prog(f, S.C04b.start - 20, S.C04b.start - 4, EASE.travel);
  // the two pills rise with the slab (no beat with the slab alone); their ticks pop on 'fixes' / 'both'
  const pL = prog(f, S.C04a.start - 10, S.C04a.start + 8, SMOOTH);
  const pR = prog(f, S.C04a.start - 7, S.C04a.start + 11, SMOOTH);
  const tL = prog(f, k.fixes - 1, k.fixes + 13, SMOOTH);
  const tR = prog(f, k.both - 1, k.both + 13, SMOOTH);

  // ---------------------------------------------------------------- timeline (C04b, and again from C06a)
  const W0 = SLAB_TOP.x + 122;
  const W1 = NX[4] + 80;
  const W_BACK = NX[3] + 70;
  const W_NEW = NX[4] + 90;
  const drawA = Math.min(k.every - 4, S.C04b.start - 25);
  const wireDraw = prog(f, drawA, drawA + Math.ceil(((W1 - W0) * 30) / 900), EASE.travel);
  const retract = prog(f, k.step - 1, k.step + 13, EASE.travel);
  const wire2 = prog(f, S.C06a.start - 16, S.C06a.start - 16 + Math.ceil(((W_BACK - W0) * 30) / 900), EASE.travel);
  const extend = prog(f, k.always - 2, k.always + 12, EASE.travel);
  const branchPan = prog(f, S.C07a.start - 6, S.C07a.start + 34, EASE.travel);
  /** the C06a redraw starts 10 frames before C06a (the timeline is in 'redraw' mode from R6 on) */
  const R6 = S.C06a.start - 16;
  const wireX0 = W0;
  let wireX1 = f < R6 ? mix(W0, W1, wireDraw) - (W1 - W_BACK) * retract : mix(W0, W_BACK, wire2) + (W_NEW - W_BACK) * extend;
  wireX1 += (3160 - W_NEW) * branchPan;
  const drawnTo = f < R6 ? mix(W0, W1, wireDraw) : mix(W0, W_BACK, wire2);
  /** the frame the drawing tip passes x (C04b draw, or the C06a redraw), for node pops and card drops */
  const tipAt = (x: number, redraw: boolean) => {
    const a = redraw ? R6 : drawA;
    const to = redraw ? W_BACK : W1;
    const len = Math.ceil(((to - W0) * 30) / 900);
    for (let t = 0; t <= len; t++) if (mix(W0, to, EASE.travel(t / len)) >= x) return a + t;
    return a + len;
  };
  const nodeOn = (x: number) => (f < R6 ? x <= drawnTo + 1 : x >= wireX0 - 1 && x <= wireX1 + 1);
  // each card drops onto its node as the drawing tip passes it
  const cardAt = (i: number) => tipAt(NX[i], f >= R6) + 1;
  const cardIn = (i: number) => prog(f, cardAt(i), cardAt(i) + 14, SMOOTH);
  const treeAt = Math.max(k.snapshot + 1, tipAt(NX[4], false) + 14);
  const treeOpen = prog(f, treeAt, treeAt + 16, EASE.travel) * (1 - prog(f, k.so - 3, k.so + 11, EASE.travel));
  const fall5 = prog(f, k.step - 1, k.step + 18, EASE.travel);
  // shrink onto the laptop's glass (C05a)
  const shrink = f < R6 ? prog(f, S.C05a.start - 8, S.C05a.start + 8, EASE.travel) : 0;
  const shrinkO = 1 - prog(f, S.C05a.start + 4, S.C05a.start + 18, SMOOTH);
  const glassC = screenPoint(SCREEN.w / 2, SCREEN.h / 2, LB);
  const TL_C = { x: (W0 + NX[4] + CARD_W / 2) / 2, y: WY };
  const tlScale = mix(1, 0.3, shrink);
  const tlShift = lerpPt({ x: 0, y: 0 }, { x: glassC.x - TL_C.x, y: glassC.y - TL_C.y }, shrink);
  const showTimeline = (f < S.C05a.start + 16 && f >= drawA - 1) || f >= R6;
  // while it shrinks onto the C05a laptop's glass the timeline is drawn above the rising laptop (the laptop slides in under it)
  const timelineOnTop = f >= S.C05a.start - 8 && f < R6;

  // markers
  const mIn = prog(f, treeAt + 4, treeAt + 18, SMOOTH);
  const mBack = prog(f, k.one - 2, k.one + 12, EASE.travel);
  const marker = { x: mix(NX[4], NX[3], mBack), o: f >= S.C05a.start ? 0 : mIn };
  const tick4 = prog(f, k.solid - 1, k.solid + 13, SMOOTH);
  const tagIn = prog(f, k.tag - 4, k.tag + 16, EASE.travel);
  const tagInk = prog(f, k.v1 - 1, k.v1 + 13, SMOOTH);
  const tagRot = -6 - 46 * (1 - tagIn) + sway(f, 1.4, 64, 2) * tagIn;
  const arrowD = `M ${W_NEW - 12} ${WY + 26} C ${W_NEW + 30} ${WY + 200}, ${NX[3] + 260} ${WY + 300}, ${NX[3] + 110} ${WY + 250}`;
  const arrowP = prog(f, k.get - 4, k.get + 14, EASE.travel);
  const ride = prog(f, k.get + 8, k.get + 22, EASE.travel);
  const m2In = prog(f, k.always + 6, k.always + 20, SMOOTH) * (1 - prog(f, k.get + 22, k.get + 36, SMOOTH));
  const m2 = { x: mix(NX[4], NX[3], ride), o: m2In };

  // ---------------------------------------------------------------- C05a: laptop, online card, arrow, flying copies
  const lapUp = prog(f, S.C05a.start - 6, S.C05a.start + 10, SMOOTH);
  const lapDead = prog(f, k.dead - 2, k.dead + 12, SMOOTH);
  const lapSink = prog(f, k.computer - 2, k.nothing + 2, EASE.travel);
  const lapBox = { ...LB, y: LB.y + 600 * (1 - lapUp) + 820 * lapSink };
  const miniTl = prog(f, S.C05a.start - 4, S.C05a.start + 10, SMOOTH);
  const onlineIn = prog(f, S.C05a.start + 2, S.C05a.start + 16, SMOOTH) * (1 - prog(f, S.C06a.start - 2, S.C06a.start + 12, EASE.travel));
  const a0 = screenPoint(1460, 120, LB);
  const FP = { a: a0, c1: { x: a0.x + 40, y: a0.y - 220 }, c2: { x: 590, y: 690 }, b: { x: ROW.x0 + 6, y: ROW.y0 + 10 } };
  const bez = (t: number) => {
    const u = 1 - t;
    const { a, c1, c2, b } = FP;
    return { x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y };
  };
  const pushD = `M ${FP.a.x} ${FP.a.y} C ${FP.c1.x} ${FP.c1.y}, ${FP.c2.x} ${FP.c2.y}, ${FP.b.x} ${FP.b.y}`;
  const pushArrow = prog(f, k.push - 3, k.push + 13, EASE.travel);
  const arrowGone = prog(f, k.computer - 2, k.computer + 12, SMOOTH);
  const onlineP = prog(f, k.online + 6, k.online + 20, SMOOTH) * (1 - prog(f, S.C06a.start - 2, S.C06a.start + 12, EASE.travel));
  const nothingP = prog(f, k.nothing - 2, k.nothing + 12, SMOOTH);
  const nothingOut = prog(f, S.C06a.start - 12, S.C06a.start + 4, EASE.travel);
  const coinStrike = prog(f, k.nothing + 4, k.nothing + 18, EASE.travel);

  // ---------------------------------------------------------------- C07: branch, merge, second branch, scissors
  const br = prog(f, k.branch - 3, k.branch + 14, EASE.travel);
  const bcardP = prog(f, k.risky - 2, k.risky + 12, SMOOTH);
  const bTick = prog(f, k.works - 1, k.works + 13, SMOOTH);
  const mergeP = prog(f, k.merge - 3, k.merge + 12, EASE.travel);
  const cardToMain = prog(f, k.merge + 4, k.merge + 18, EASE.travel);
  const br2 = prog(f, k.flops - 18, k.flops - 2, EASE.travel);
  const c2P = prog(f, k.flops - 12, k.flops + 2, SMOOTH);
  // the cut, in order and never faster than 14 frames per motion: the scissors slide in open, close across the wire, the
  // cut opens behind the tips, the scissors slide back out, the cut-off branch drops away
  const snipIn = prog(f, k.throw - 18, k.throw - 2, SMOOTH);
  const snipClose = prog(f, k.throw - 2, k.throw + 12, EASE.travel);
  const cutOpen = prog(f, k.throw + 6, k.throw + 20, EASE.travel);
  const dropCut = prog(f, k.throw + 12, Math.max(k.throw + 34, S.C07b.end + 10), EASE.travel);
  const snipOut = prog(f, k.throw + 14, k.throw + 30, EASE.travel);

  // ---------------------------------------------------------------- camera (hold, move, hold; the board stays under the caption band)
  const P_ID = { x: 540, y: 758.5, zoom: 1 };
  /** zoom 1.3 on the timeline: above-card tops stay under the caption band, the opened tree above the safe bottom */
  const P_SNAP = { x: 1540, y: 990, zoom: 1.2 };
  const P_STEP = { x: 1460, y: 990, zoom: 1.2 };
  const P_PUSH = { x: 520, y: 770, zoom: 1.0 };
  const P_TL2 = { x: 690, y: 1000, zoom: 1.15 };
  const P_SOLID = { x: 1233, y: 1000, zoom: 1.15 };
  const P_TAG = { x: 1390, y: 960, zoom: 1.3 };
  const P_ARROW = { x: 1490, y: 1000, zoom: 1.15 };
  const P_BR = { x: 1805, y: 1000, zoom: 1.15 };
  const P_BR2 = { x: 1810, y: 1000, zoom: 1.15 };
  const P_MERGE = { x: 2265, y: 1000, zoom: 1.15 };
  const P_FLOP = { x: 2680, y: 1000, zoom: 1.15 };
  const keys = camPath({ f: S.C04a.start, ...P_ID })
    // identity while the slab settles and cards 1-2 land, then one slow tracking pan (32 frames) along the drawing
    // wire onto cards 4-5 as card 5 drops
    .push(tipAt(NX[1], false) + 2, 0.03)
    .to(tipAt(NX[1], false) + 2, P_SNAP, 32)
    .push(k.one - 2, 0.045)
    .to(k.one - 2, P_STEP, 22)
    .push(Math.max(k.step + 8, k.one + 20), 0.006)
    .to(Math.max(k.step + 8, k.one + 20), P_PUSH, 24)
    .push(S.C06a.start - 18, 0.045)
    .to(S.C06a.start - 18, P_TL2, 24)
    .push(Math.max(S.C06a.start + 22, k.solid - 6), 0.008)
    .to(Math.max(S.C06a.start + 22, k.solid - 6), P_SOLID, 22)
    .push(k.tag - 3, 0.006)
    .to(k.tag - 3, P_TAG, 22)
    .push(k.always - 3, 0.01)
    .to(k.always - 3, P_ARROW, 22)
    .push(S.C07a.start - 6, 0.008)
    .to(S.C07a.start - 6, P_BR, 26)
    .push(k.risky - 2, 0.01)
    .to(k.risky - 2, P_BR2, 22)
    .push(k.merge - 4, 0.01)
    .to(k.merge - 4, P_MERGE, 24)
    .push(k.flops - 14, 0.01)
    .to(k.flops - 14, P_FLOP, 24)
    .push(S.C07b.end + 10, 0.018).keys;

  // RED TEAM RT-C-2: nothing that carries text may hang off the frame edges. Each text-carrying object fades out (eased,
  // by its screen position under the camera of this frame) as its edge nears x 65 or x 1015 on screen, and is fully
  // there only while it sits whole inside x 70-1010. The camera poses above keep the active cards whole.
  const camPose = camAtKeys(keys, f, { x: 540, y: 758.5 });
  const sx = (wx: number) => 540 + (wx - camPose.x) * camPose.zoom * 0.9;
  const edge = (x0: number, x1: number) => {
    if (shrink > 0.001) return 1;
    const a = Math.min(1, Math.max(0, (sx(x0) - 22) / 48));
    const b = Math.min(1, Math.max(0, (1058 - sx(x1)) / 48));
    return SMOOTH(a) * SMOOTH(b);
  };

  // ---------------------------------------------------------------- captions (hud, top band)
  const top = (lines: ReturnType<typeof capLayout>): CapBlock => ({ lines, y: CAP_TOP, anchor: "top", w: 1000 });
  const w4a = c.ws("C04a");
  const w4b = c.ws("C04b");
  const w5 = c.ws("C05a");
  const w6 = c.ws("C06a");
  const w7a = c.ws("C07a");
  const w7b = c.ws("C07b");
  const pages: CapBlock[][] = [
    [top(capLayout(w4a, "*GitHub* fixes both."))],
    [top(capLayout(w4b, "Every *commit* is / a *snapshot*"))],
    [top(capLayout(wsFrom(w4b, "of"), "of your / *entire project,*"))],
    [top(capLayout(wsFrom(w4b, "so"), "so a bad prompt / is [one step back.]"))],
    [top(capLayout(w5, "*Push* sends that / *history online,*"))],
    [top(capLayout(wsFrom(w5, "so"), "so a dead computer / costs you *nothing.*"))],
    [top(capLayout(w6, "And when a version / is *solid,*"))],
    [top(capLayout(wsFrom(w6, "tag"), "*tag it v1,*"))],
    [top(capLayout(wsFrom(w6, "so"), "so you can always / *get back to it.*"))],
    [top(capLayout(w7a, "A *branch* gives / a *risky idea*"))],
    [top(capLayout(wsFrom(w7a, "its"), "its own copy / *to play in.*"))],
    [top(capLayout(w7b, "If it works out, / you *merge it in,*"))],
    [top(capLayout(wsFrom(w7b, "and"), "and if it *flops,* / you *throw it away.*"))],
  ];

  // ---------------------------------------------------------------- the timeline drawing (world px)
  const timeline = (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: `${TL_C.x}px ${TL_C.y}px`,
        transform: `translate(${tlShift.x.toFixed(2)}px,${tlShift.y.toFixed(2)}px) scale(${tlScale.toFixed(4)})`,
        opacity: f < R6 ? shrinkO : 1,
      }}
    >
      {wireX1 > wireX0 + 1 ? <WirePath d={`M ${wireX0.toFixed(1)} ${WY} L ${wireX1.toFixed(1)} ${WY}`} p={1} /> : null}
      {/* a highlight node travelling along the freshly drawn wire (C04b) */}
      {wireDraw > 0 && wireDraw < 1 && f < S.C05a.start ? <div style={{ position: "absolute", left: drawnTo - 11, top: WY - 11, width: 22, height: 22, borderRadius: 11, background: theme.color.ink, boxShadow: "4px 6px 6px rgba(0,0,0,.25)" }} /> : null}
      {br > 0 ? <WirePath d={`M ${FORK.x} ${FORK.y} L ${B1.x} ${B1.y} L ${B2.x} ${B2.y}`} p={br} /> : null}
      {mergeP > 0 ? <WirePath d={`M ${B2.x} ${B2.y} C ${B2.x + 80} ${B2.y}, ${MERGE.x - 70} ${MERGE.y}, ${MERGE.x} ${MERGE.y}`} p={mergeP} /> : null}
      {br2 > 0 ? (
        <>
          <WirePath d={`M ${FORK2.x} ${FORK2.y} L ${CUT.x - 8} ${CUT.y - 8 * T30}`} p={Math.min(1, br2 * 3)} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${CUT.x}px ${CUT.y}px`, transform: `translate(${(cutOpen * 14).toFixed(2)}px,${(cutOpen * 6 + dropCut * 1100).toFixed(2)}px) rotate(${(dropCut * 14).toFixed(2)}deg)` }}>
            <WirePath d={`M ${CUT.x + 4} ${CUT.y + 4 * T30} L ${C1.x} ${C1.y} L ${C2.x} ${C2.y}`} p={Math.max(0, br2 * 1.5 - 0.5)} />
            {c2P > 0 ? <Node cx={C1.x} cy={C1.y} at={k.flops - 12} /> : null}
            {c2P > 0 ? <WirePath d={`M ${CCARD.cx} ${C1.y} L ${CCARD.cx} ${CCARD.cy - CCARD.h / 2}`} w={4} /> : null}
            <Place cx={CCARD.cx} cy={CCARD.cy} p={c2P} rot={-2 + sway(f, 0.6, 70, 5)} opacity={edge(CCARD.cx - CCARD.w / 2, CCARD.cx + CCARD.w / 2)}>
              <MiniApp w={CCARD.w} h={CCARD.h} t={f} crackAt={k.flops} grey={prog(f, k.flops + 2, k.flops + 16, SMOOTH)} />
            </Place>
          </div>
        </>
      ) : null}
      {/* nodes */}
      {NX.map((x, i) => {
        if (i === 4 && f < R6) {
          const o = 1 - retract;
          return nodeOn(x) && o > 0.01 ? <Node key={i} cx={x} cy={WY} opacity={o} at={tipAt(x, false)} /> : null;
        }
        if (i === 4) return extend > 0.6 ? <Node key={i} cx={x} cy={WY} at={k.always + 4} /> : null;
        const popAt = tipAt(x, f >= R6);
        return nodeOn(x) ? <Node key={i} cx={x} cy={WY} at={popAt} /> : null;
      })}
      {br > 0.4 ? <Node cx={B1.x} cy={B1.y} at={k.branch + 4} /> : null}
      {mergeP > 0.85 ? <Node cx={MERGE.x} cy={MERGE.y} at={k.merge + 8} r={18} /> : null}
      {br2 > 0.05 ? <Node cx={FORK2.x} cy={FORK2.y} at={k.flops - 18} /> : null}
      {/* commit cards on stems */}
      {CARDS.map((cd, i) => {
        if (i === 4 && f >= S.C05a.start) return null;
        const p = cardIn(i);
        if (p <= 0.001) return null;
        const cy = cardCy(cd.above);
        const isLast = i === 4;
        const tilt = isLast ? 6 * prog(f, k.prompt, k.prompt + 14, EASE.travel) + 12 * fall5 : sway(f, 0.3, 80 + 9 * i, i);
        const fy = isLast ? 800 * fall5 : 0;
        const o = Math.min(1, p * 2) * (isLast ? 1 - prog(f, k.step + 8, k.step + 22, SMOOTH) : 1) * edge(NX[i] + cd.dx - CARD_W / 2, NX[i] + cd.dx + CARD_W / 2);
        const stemTop = cd.above ? WY - STEM : WY;
        const sq = squash(f, cardAt(i) + 11);
        return (
          <React.Fragment key={i}>
            {!isLast || fall5 < 0.05 ? <WirePath d={`M ${NX[i]} ${stemTop} L ${NX[i]} ${stemTop + STEM}`} w={4} p={p} /> : null}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: o,
                willChange: "transform",
                transform: `translate(${(NX[i] + cd.dx).toFixed(3)}px,${(cy + fy - 40 * (1 - p)).toFixed(3)}px) rotate(${tilt.toFixed(3)}deg) scale(1, ${sq.toFixed(4)})`,
                transformOrigin: `0 ${-BASE_H / 2}px`,
              }}
            >
              <CommitCard w={CARD_W} hash={cd.hash} msg={cd.msg} tree={isLast ? treeOpen : 0} fs={CARD_FS} grey={isLast ? prog(f, k.one, k.one + 14, SMOOTH) : 0} />
              {isLast ? <ShatterOverlay x={-CARD_W / 2} y={-BASE_H / 2} w={CARD_W} h={BASE_H} ox={CARD_W * 0.8} oy={BASE_H * 0.2} seed={5} at={k.prompt} dur={16} radius={14} /> : null}
            </div>
          </React.Fragment>
        );
      })}
      {/* the merged card lands on the main line after the merge node */}
      {cardToMain > 0 ? (
        <>
          <WirePath d={`M ${MCARD_X} ${WY - STEM} L ${MCARD_X} ${WY}`} w={4} p={cardToMain} />
          <Node cx={MCARD_X} cy={WY} at={k.merge + 14} />
          <div style={{ position: "absolute", left: 0, top: 0, willChange: "transform", transform: `translate(${mix(BCARD.cx, MCARD_X, cardToMain).toFixed(3)}px,${mix(BCARD.cy, cardCy(true), cardToMain).toFixed(3)}px)`, opacity: Math.min(1, cardToMain * 2) * edge(MCARD_X - CARD_W / 2, MCARD_X + CARD_W / 2) }}>
            <CommitCard w={CARD_W} hash="9c4f2a7" msg="try dark mode" fs={CARD_FS} />
          </div>
        </>
      ) : null}
      {/* the branch card */}
      {bcardP > 0 && cardToMain < 1 ? (
        <>
          <WirePath d={`M ${BCARD.cx} ${B1.y} L ${BCARD.cx} ${BCARD.cy - BCARD.h / 2}`} w={4} opacity={1 - cardToMain} />
          <Place cx={mix(BCARD.cx, MCARD_X, cardToMain)} cy={mix(BCARD.cy, cardCy(true), cardToMain)} p={bcardP} k={mix(1, 0.7, cardToMain)} rot={2 + sway(f, 0.6, 72, 3)} opacity={(1 - cardToMain) * edge(mix(BCARD.cx, MCARD_X, cardToMain) - BCARD.w / 2, mix(BCARD.cx, MCARD_X, cardToMain) + BCARD.w / 2)}>
            <MiniApp w={BCARD.w} h={BCARD.h} t={f} />
            {bTick > 0 ? (
              <Place cx={BCARD.w / 2 - 6} cy={-BCARD.h / 2 + 6} p={bTick}>
                <TickChip r={32} p={bTick} />
              </Place>
            ) : null}
          </Place>
        </>
      ) : null}
      {/* tick on the last card (C06a) */}
      {tick4 > 0 && f >= S.C06a.start ? (
        <Place cx={NX[3] + CARD_W / 2 - 10} cy={cardCy(true) - BASE_H / 2 + 8} p={tick4}>
          <TickChip r={28} p={tick4} />
        </Place>
      ) : null}
      {/* the tag hanging from node 4 */}
      {tagIn > 0 && f >= S.C06a.start ? (
        <div style={{ position: "absolute", left: NX[3], top: WY, transform: `rotate(${tagRot.toFixed(3)}deg)`, transformOrigin: "0 0", opacity: Math.min(1, tagIn * 2.5) * edge(NX[3] - 60, NX[3] + 80) }}>
          {PHOTOS.tag ? <TagPhoto w={TAG_W} src={PHOTOS.tag} text="v1" ink={tagInk} /> : <PaperTag w={200} len={90} text={tagInk > 0.01 ? "v1" : ""} />}
        </div>
      ) : null}
      {arrowP > 0 ? <DashedArrow d={arrowD} p={arrowP} w={7} opacity={1 - prog(f, S.C07a.start + 4, S.C07a.start + 18, SMOOTH)} /> : null}
      {marker.o > 0.01 ? (
        <Place cx={marker.x} cy={WY} p={marker.o}>
          <RingMarker r={34} />
        </Place>
      ) : null}
      {m2.o > 0.01 ? (
        <Place cx={m2.x} cy={WY} p={m2.o}>
          <RingMarker r={34} />
        </Place>
      ) : null}
    </div>
  );

  // ---------------------------------------------------------------- render
  const flyRows = k.fly.map((t) => prog(f, t + 8, t + 22, SMOOTH));
  return (
    <Camera keys={keys} blur={false} hud={<Pages pages={pages} until={S.C07b.end - 6} />}>
      <BackSheets f={f} layout={1} />
      <BackSheets f={f} layout={2} dx={1180} />
      {/* landing shadow under the dropping hero slab */}
      {f < S.C04b.start + 4 ? (
        <div style={{ position: "absolute", left: SLAB_HERO.x - 230, top: SLAB_HERO.y + 200, width: 460, height: 50, borderRadius: "50%", background: "rgba(0,0,0,.2)", filter: "blur(16px)", opacity: drop * (1 - toTop) }} />
      ) : null}
      {showTimeline && !timelineOnTop ? timeline : null}
      {/* C05a: the 'online' card under the slab, with the arriving rows */}
      {onlineIn > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${ONLINE.x + ONLINE.w / 2}px ${ONLINE.y + ONLINE.h}px`, transform: `translate(${(520 * (1 - onlineIn)).toFixed(2)}px,${sway(f, 2.5, 96, 4).toFixed(3)}px) rotate(${sway(f, 0.5, 120, 2).toFixed(3)}deg)` }}>
          <PaperCard x={ONLINE.x} y={ONLINE.y} w={ONLINE.w} h={ONLINE.h} sheets={1} />
          <InkPill cx={SLAB_RIGHT.x} cy={ONLINE.y} text="online" fs={50} p={onlineP} rot={-3} />
          {CARDS.slice(0, 4).map((cd, i) =>
            flyRows[i] > 0 ? (
              <div key={i} style={{ position: "absolute", left: ROW.x0, top: ROW.y0 + i * ROW.h, opacity: flyRows[i], display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: "#2A2A2C" }} />
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: theme.color.ink, letterSpacing: -0.5 }}>{cd.hash}</div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
      {/* the C05a laptop with the mini timeline on its glass */}
      {lapUp > 0 && f < S.C06a.start ? (
        <div style={{ position: "absolute", inset: 0, willChange: "transform", transform: `translateY(${(lapBox.y - LB.y).toFixed(3)}px)` }}>
        <Laptop
          t={f}
          box={LB}
          power={1 - lapDead}
          glass={
            lapDead > 0 ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w / 2.4, height: SCREEN.h / 2.4, transform: "scale(2.4)", transformOrigin: "0 0" }}>
                <ShatterOverlay x={0} y={0} w={SCREEN.w / 2.4} h={SCREEN.h / 2.4} ox={(SCREEN.w * 0.4) / 2.4} oy={(SCREEN.h * 0.5) / 2.4} seed={41} at={k.dead} dur={16} radius={0} />
              </div>
            ) : null
          }
        >
          <div style={{ position: "absolute", inset: 0, background: "#F4F3F2", opacity: miniTl }}>
            <svg width={SCREEN.w} height={SCREEN.h} style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1={120} y1={520} x2={1480} y2={520} stroke="#111" strokeWidth={22} strokeLinecap="round" />
              {[240, 560, 880, 1200].map((x, i) => (
                <g key={x}>
                  <circle cx={x} cy={520} r={44} fill="#F3F3F3" stroke="#111" strokeWidth={18} />
                  <rect x={x - 200} y={i % 2 ? 230 : 620} width={400} height={170} rx={24} fill="#fff" stroke="#DDD" strokeWidth={6} />
                  <rect x={x - 160} y={(i % 2 ? 230 : 620) + 50} width={220} height={30} rx={8} fill="#111" />
                  <rect x={x - 160} y={(i % 2 ? 230 : 620) + 104} width={300} height={22} rx={8} fill="#9A9A9A" />
                </g>
              ))}
            </svg>
          </div>
        </Laptop>
        </div>
      ) : null}
      {showTimeline && timelineOnTop ? timeline : null}
      {/* the push arrow, its chip and the flying copies */}
      {pushArrow > 0 && arrowGone < 1 && f < S.C06a.start ? <DashedArrow d={pushD} p={pushArrow} w={7} opacity={1 - arrowGone} /> : null}
      {f < k.computer + 14 ? <WordChip x={bez(0.42).x + 20} y={bez(0.42).y - 86} word="push" at={k.push} dur={12} scale={mix(1, 0.8, arrowGone)} opacity={1 - arrowGone} /> : null}
      {k.fly.map((t, i) => {
        const p = prog(f, t, t + 14, EASE.travel);
        if (p <= 0 || p >= 1) return null;
        const pt = bez(p);
        return (
          <Place key={i} cx={pt.x + 120 * p} cy={pt.y + i * ROW.h * p} k={mix(0.78, 0.5, p)} rot={mix(-6, 0, p)} opacity={1 - prog(p, 0.7, 1, SMOOTH)}>
            <CommitCard w={CARD_W} hash={CARDS[i].hash} msg={CARDS[i].msg} fs={CARD_FS} />
          </Place>
        );
      })}
      {/* the slab */}
      {slabOut < 1 ? (
        <Place cx={slab.x} cy={slab.y + (f > land + 6 ? sway(f, 2, 80, 1) : 0)} k={1 + slabBump} opacity={edge(slab.x - slab.w / 2, slab.x + slab.w / 2)}>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(1, ${slabSquash.toFixed(4)})`, transformOrigin: `0 ${slab.w * 0.52}px` }}>
            <GithubSlab w={slab.w} />
          </div>
        </Place>
      ) : null}
      {/* 'nothing' pill with a struck coin where the laptop was */}
      {nothingP > 0 && nothingOut < 1 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(500 * nothingOut).toFixed(1)}px)` }}>
          <Place cx={120} cy={1090} p={nothingP}>
            <Coin r={56} strike={coinStrike} />
          </Place>
          <InkPill cx={370} cy={1094} text="nothing" fs={58} p={nothingP} rot={-3} />
        </div>
      ) : null}
      {/* C04a pills with their ticks */}
      {pillsOut < 1 ? (
        <>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${(-700 * pillsOut).toFixed(1)}px)` }}>
            <InkPill cx={290} cy={1150} text="broken prompt" fs={54} p={pL} rot={-2} />
            <Place cx={470} cy={1098} p={tL}>
              <TickChip r={34} p={tL} />
            </Place>
          </div>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${(700 * pillsOut).toFixed(1)}px)` }}>
            <InkPill cx={795} cy={1150} text="dead laptop" fs={54} p={pR} rot={2} />
            <Place cx={958} cy={1098} p={tR}>
              <TickChip r={34} p={tR} />
            </Place>
          </div>
        </>
      ) : null}
      {f >= S.C04b.start && f < S.C05a.start ? (
        <ChatBubble text="add dark mode" x={NX[4] - 300} y={cardCy(false) + BASE_H / 2 + 16} ox={NX[4]} oy={cardCy(false) + BASE_H / 2} at={k.bad - 2} dur={16} arc={30} fs={42} opacity={(1 - prog(f, k.one + 2, k.one + 2 + 16, EASE.drift)) * edge(NX[4] - 300, NX[4] + 70)} />
      ) : null}
      {br > 0 && f < k.merge + 4 ? <WordChip x={FORK.x + 175} y={WY - 92} word="branch" at={k.branch + 2} dur={12} scale={mix(1, 0.6, prog(f, k.merge - 6, k.merge + 8, EASE.travel))} opacity={(1 - prog(f, k.merge - 6, k.merge + 8, EASE.travel)) * edge(FORK.x + 20, FORK.x + 330)} /> : null}
      {bcardP > 0 && f >= S.C07a.start ? (
        <ChatBubble text="try dark mode" tail="right" x={BCARD.cx - 600} y={BCARD.cy - 96} ox={BCARD.cx + 110} oy={BCARD.cy - 30} at={k.copy - 2} dur={16} arc={30} fs={42} opacity={(1 - prog(f, k.works - 2, k.works - 2 + 16, EASE.drift)) * edge(BCARD.cx - 600, BCARD.cx - 240)} />
      ) : null}
      {mergeP > 0 ? <WordChip x={MERGE.x - 150} y={WY - 92} word="merge" at={k.merge + 2} dur={12} opacity={edge(MERGE.x - 300, MERGE.x)} /> : null}
      {snipIn > 0 && snipOut < 1 ? <ScissorsAt cx={CUT.x} cy={CUT.y} wireDeg={30} inP={snipIn} close={snipClose} outP={snipOut} /> : null}
    </Camera>
  );
};

/**
 * The scissors photo placed so the wire point (cx, cy) sits between the blades, about 30% of the way from the screw to
 * the tips; the blades point across the wire. They slide in along the blade direction (inP), close (close 0..1) and
 * slide back out (outP).
 */
const ScissorsAt: React.FC<{ cx: number; cy: number; wireDeg: number; inP: number; close: number; outP: number }> = ({ cx, cy, wireDeg, inP, close, outP }) => {
  const W = 460;
  const meta = { aspect: 1888 / 1012, pivot: [0.49, 0.495], axis: 182.6, open: 23.4 };
  const H = W / meta.aspect;
  const blade = wireDeg + 90 + 180; // blades point up-right across the wire, the screw and handles down-left of it
  const a = (blade * Math.PI) / 180;
  const reach = 0.3 * W;
  const back = 280 * (1 - inP) + 320 * outP;
  const px = cx - Math.cos(a) * (reach + back);
  const py = cy - Math.sin(a) * (reach + back);
  const rot = blade - meta.axis;
  const opening = mix(meta.open + 8, 0, close) + 10 * outP;
  return (
    <div
      style={{
        position: "absolute",
        left: px - meta.pivot[0] * W,
        top: py - meta.pivot[1] * H,
        width: W,
        height: H,
        transform: `rotate(${rot.toFixed(3)}deg)`,
        transformOrigin: `${meta.pivot[0] * W}px ${meta.pivot[1] * H}px`,
        opacity: Math.min(1, inP * 3) * (1 - outP),
        filter: theme.shadow.cutout,
      }}
    >
      <Scissors src={PHOTOS.scissors} w={W} opening={opening} />
    </div>
  );
};
