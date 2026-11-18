// A11a-A13a: back on the timeline. A tick on the last version that works, a dashed stub forking off at 30 deg, the
// branch drawing solid with two commits of its own, curving back in (merge), then the other ending: the scissors cut
// the branch off and it drops away; a paper tag reads v1 on the last main node, a newer commit lands, and a curved
// dashed arrow brings a ring marker back to the tag. World px; cards hang over the main wire and under the branch.
import React from "react";
import { DashedArrow, EASE, INTER, PaperCard, WireNode, WirePath, mix, prog, theme } from "../../../paperstudio";
import { COMMITS, CH, CW, CommitCard, Stem } from "./commit";
import type { Cues } from "./cues";
import { PaperTag, RingMarker, TickChip } from "./objects";
import { PHOTOS } from "./assets";
import { ScissorsPiece, SC, bladeLen } from "./scissors";
import { WordChip } from "../Shared/wordChip";
import { popP, pulse, swing, SM } from "./util";
import { PAN, panOut } from "./sLaptop";
import { Sheets } from "./depth";

/** world layout */
// coordinator fix round: big kit commit cards (460 x 170). The fork node N1 carries the last version that works (card
// over the wire); the branch forks at 30 deg to B1 (its commit card hangs under it), runs on flat to B2 (the second
// timeline continuing) and curves back up into the main wire at M (the merged card over the wire). Bare nodes run
// off the left edge (older history). One overview framing shows every card whole; the zooms never cut a card's text.
export const MW = 800;
export const N0 = 40;
export const N1 = 340;
export const MX = 960;
export const B1 = { x: 640, y: 973 } as const;
export const B2 = { x: 820, y: 973 } as const;
const MAIN_STEM = 40;
const mainCardY = MW - MAIN_STEM - CH / 2;
const B1C = { x: 640, y: B1.y + 40 + CH / 2 };
const B2C = { x: 99999, y: 0 };
const MERGE_D = `M${B2.x} ${B2.y} C ${B2.x + 110} ${B2.y}, ${MX} ${MW + 110}, ${MX} ${MW}`;
const STUB_END = { x: N1 + 80, y: MW + 46 };
/** the cut point (half way along N1 -> B1) and the scissors' pose: the blades cross the wire at a right angle (the wire
 *  runs at 30 deg, the blades point up-right at 300 deg), the handles down-left, below the wire: the scissors come in
 *  from the lower left and never reach the caption band */
const CUT = { x: (N1 + B1.x) / 2, y: (MW + B1.y) / 2 };
const SC_W = 480;
const SC_DIR = 300;
const toHandles = { x: Math.cos((120 * Math.PI) / 180), y: Math.sin((120 * Math.PI) / 180) };
/** the overview pose of this scene (pull back) */
export const OV = { x: 640, y: 748, zoom: 1.0 } as const;
/** in on the fork's card ("works") and on the tag (framed left, so the newer card at the right is fully off frame) */
export const N1ZOOM = { x: 340, y: 764, zoom: 1.1 } as const;
/** A11a opens close on the fork: the card big, the stub and the ghost card beside it (RED TEAM RT-A-2) */
export const A11Z = { x: 480, y: 756, zoom: 1.15 } as const;
export const TAGZOOM = { x: 240, y: 764, zoom: 1.1 } as const;
/** the tag on N1 and the return arrow */
const TAG = { len: 70, w: 140 } as const;
const N3 = 960;
const RETURN_D = `M1100 ${MW + 26} C 1090 ${MW + 290}, 720 ${MW + 330}, ${N1 + 110} ${MW + 240}`;

export const branchCues = (c: Cues) => {
  const a11 = c.s.A11a.start;
  const fresh = c.at("A11a", /^new$/, 30);
  const works = c.at("A11a", /^works$/, 100);
  const a11b = c.s.A11b.start;
  const branch = c.at("A11b", /^branch$/, 6);
  const timeline = c.at("A11b", /^timeline$/, 46);
  const a12 = c.s.A12a.start;
  const merge = c.at("A12a", /^merge$/, 48);
  const backIn = c.at("A12a", /^in$/, 80);
  const a12b = c.s.A12b.start;
  const not = c.at("A12b", /^not$/, 2);
  const del = c.at("A12b", /^delete$/, 22);
  const a13 = c.s.A13a.start;
  const solid = c.at("A13a", /^solid$/, 40);
  const tag = c.at("A13a", /^tag$/, 56);
  const v1 = c.at("A13a", /^(v1|v)$/, 80);
  const so = c.at("A13a", /^so$/, 96);
  const come = c.at("A13a", /^come$/, 120);
  const back = c.at("A13a", /^back$/, 134);
  const anytime = c.at("A13a", /^anytime$/, 156);
  const a14 = c.s.A14a.start;
  return { a11, fresh, works, a11b, branch, timeline, a12, merge, backIn, a12b, not, del, a13, solid, tag, v1, so, come, back, anytime, a14 };
};
export type BranchCues = ReturnType<typeof branchCues>;

/** close / cut / fall frames of the snip */
const snip = (q: BranchCues) => {
  const enter = q.a12b - 6;
  const close = q.del - 4;
  const cut = close + 10;
  const fall = cut + 2;
  return { enter, close, cut, fall };
};

export const BranchScene: React.FC<{ f: number; q: BranchCues }> = ({ f, q }) => {
  if (f < q.a11 - 7 || f >= q.a14 + 13) return null;
  const inP = panOut(f, q.a11);
  const outP = panOut(f, q.a14);
  const dx = PAN * (1 - inP) - PAN * outP;

  // A11a: the stub and the tick
  // RED TEAM RT-A-2: the whole fork layout (stub, ghost card, tick) arrives with the pan, so A11a opens full
  const stubP = prog(f, q.a11 - 12, q.a11 + 4, EASE.travel);
  const stubO = 1 - prog(f, q.branch - 4, q.branch + 6, SM);
  const tick = prog(f, q.a11 - 8, q.a11 + 4, SM);
  const tickHit = pulse(f, q.works - 2, 16);
  // A11b: the branch draws to B1, then B2, cards land
  const toB1 = prog(f, q.branch - 5, q.branch + 9, EASE.travel);
  const toB2 = prog(f, q.timeline - 6, q.timeline + 8, EASE.travel);
  const landB1 = prog(f, q.branch + 2, q.branch + 16, SM);
  const landB2 = prog(f, q.timeline + 2, q.timeline + 16, SM);
  // A12a: the merge curve, node and card
  const mergeP = prog(f, q.merge - 4, q.merge + 12, EASE.travel);
  const mNode = prog(f, q.merge + 8, q.merge + 20, SM);
  const mCard = prog(f, Math.max(q.merge + 12, q.backIn - 4), Math.max(q.merge + 12, q.backIn - 4) + 14, SM);
  // A12b: the merge becomes a ghost, the snip, the fall
  const ghost = prog(f, q.not - 2, q.not + 10, SM);
  const S = snip(q);
  const scIn = prog(f, S.enter, S.enter + 14, SM);
  const closing = prog(f, S.close, S.cut, EASE.cam);
  // the scissors rest by the cut (half open) until the newer commit lands, then slide out
  const scOut = prog(f, q.a13 + 2, q.a13 + 20, SM);
  const scRest = prog(f, S.cut + 2, S.cut + 14, SM);
  const opening = f < S.close ? SC.open * (0.94 + 0.06 * Math.cos((f - S.enter) / 3)) : mix(SC.open, 2, closing) + 8 * scRest;
  const cut = f >= S.cut;
  const fall1 = prog(f, S.fall, Math.max(S.fall + 18, q.a13), EASE.cam);
  const fall2 = prog(f, q.a13 + 2, q.a13 + 22, EASE.cam);
  const fallY = 260 * fall1 + 900 * fall2;
  const fallRot = 6 * fall1 + 6 * fall2;
  const ghostGone = prog(f, q.a13 + 2, q.a13 + 18, SM);
  const gap = cut ? 10 * prog(f, S.cut, S.cut + 8, SM) : 0;
  const stubFade = prog(f, q.a13 + 2, q.a13 + 16, SM);
  // A13a: N1 rings, the tag, the new commit, the return arrow and marker
  const ring = prog(f, q.solid - 4, q.solid + 8, SM);
  const tagIn = prog(f, q.tag - 4, q.tag + 10, EASE.travel);
  const tagRot = f < q.tag - 4 ? -110 : mix(-110, 0, tagIn) + swing(f, q.tag + 10, 10, 26, 70) * prog(f, q.tag + 8, q.tag + 20, SM);
  const v1Ink = prog(f, q.v1 - 1, q.v1 + 11, SM);
  const n3 = prog(f, q.a13 + 2, q.a13 + 16, SM);
  const retP = prog(f, q.back - 8, q.back + 8, EASE.travel);
  const mk = prog(f, q.back + 4, q.anytime + 6, EASE.cam);

  // the branch layer: everything beyond the cut (wire N1 -> B1 -> B2, the cards, the merge ghost, the branch chip)
  const branchPts = { d1: `M${N1} ${MW} L${B1.x} ${B1.y}`, d2: `M${B1.x} ${B1.y} L${B2.x} ${B2.y}` };
  const cutD = `M${CUT.x + 6} ${CUT.y + 3.5} L${B1.x} ${B1.y}`;
  const stubD = `M${N1} ${MW} L${CUT.x - 6} ${CUT.y - 3.5}`;
  const handOff = { x: CUT.x + toHandles.x * bladeLen(SC_W) * 0.5, y: CUT.y + toHandles.y * bladeLen(SC_W) * 0.5 };
  const scAway = 520 * (1 - scIn) + 620 * scOut;
  const screw = { x: handOff.x + toHandles.x * scAway, y: handOff.y + toHandles.y * scAway };
  const showSc = PHOTOS.scissors && f >= S.enter && scOut < 0.999;

  const mergeO = 1 - 0.75 * ghost;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${dx.toFixed(1)}px)` }}>
      {/* the stage: two paper sheets peeking behind at parallax and a long white stage card with a lean */}
      <Sheets
        f={f}
        sheets={[
          { x: -560, y: 600, w: 600, h: 640, rot: -5, tone: 1 },
          { x: 1080, y: 640, w: 560, h: 620, rot: 6 },
        ]}
      />
      <PaperCard x={-420} y={556 + 0.8 * Math.sin(f / 61)} w={1960} h={708} sheets={2} tf={`perspective(2600px) rotateX(${(4 + 0.3 * Math.sin(f / 83)).toFixed(3)}deg)`} />
      {/* main wire and its two older commits (cards over the wire) */}
      <WirePath d={`M-250 ${MW} L1180 ${MW}`} />
      {/* the older history runs off the left edge as bare nodes (no card there, so the zooms on the fork never cut a
          card's text at the frame edge) */}
      <Stem x={N1} y0={MW} y1={MW - MAIN_STEM} />
      <CommitCard cx={N1} cy={mainCardY + 0.8 * Math.sin(f / 41)} c={COMMITS[1]} rot={0.3 * Math.sin(f / 53)} />
      <TickChip cx={N1 + 204} cy={mainCardY - CH / 2 + 14} r={28 * (1 + 0.12 * tickHit)} p={tick} />

      {/* scissors' lower piece goes UNDER the branch wire */}
      {showSc ? <ScissorsPiece src={PHOTOS.scissors!} w={SC_W} px={screw.x} py={screw.y} dir={SC_DIR} opening={opening} piece="B" /> : null}

      {/* the dashed stub (A11a) with a dashed ghost card under it: the new feature, not built yet */}
      {stubP > 0.001 && stubO > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, opacity: stubO }}>
          <DashedArrow d={`M${N1} ${MW} L${STUB_END.x} ${STUB_END.y}`} p={stubP} head={false} w={6} />
          <WireNode cx={STUB_END.x} cy={STUB_END.y} r={theme.wire.nodeR * mix(0.4, 1, popP(f, q.a11 - 4))} opacity={Math.min(1, popP(f, q.a11 - 4) * 2)} />
          <GhostCard cx={B1C.x} cy={B1C.y + 18 * (1 - prog(f, q.a11 - 10, q.a11 + 6, SM))} p={prog(f, q.a11 - 10, q.a11 + 6, SM)} f={f} />
        </div>
      ) : null}

      {/* the branch: before the cut one piece from N1; after it the far piece falls */}
      {!cut && toB1 > 0.001 ? <WirePath d={branchPts.d1} p={toB1} /> : null}
      {cut ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - stubFade }}>
          <WirePath d={stubD} />
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CUT.x}px ${CUT.y}px`, transform: `translate(${(gap * 0.866).toFixed(2)}px, ${(fallY + gap * 0.5).toFixed(1)}px) rotate(${fallRot.toFixed(2)}deg)`, opacity: 1 - prog(f, q.a13 + 10, q.a13 + 22, SM) }}>
        {cut ? <WirePath d={cutD} /> : null}
        {toB2 > 0.001 ? <WirePath d={branchPts.d2} p={toB2} /> : null}
        {mergeP > 0.001 && ghostGone < 0.999 ? (
          <div style={{ position: "absolute", inset: 0, opacity: mergeO * (1 - ghostGone) }}>
            {ghost > 0.5 ? <DashedArrow d={MERGE_D} head={false} w={7} /> : <WirePath d={MERGE_D} p={mergeP} />}
          </div>
        ) : null}
        {f >= q.branch ? <WireNode cx={B1.x} cy={B1.y} r={theme.wire.nodeR * mix(0.4, 1, popP(f, q.branch + 2))} opacity={Math.min(1, popP(f, q.branch + 2) * 2)} /> : null}
        {f >= q.timeline ? <WireNode cx={B2.x} cy={B2.y} r={theme.wire.nodeR * mix(0.4, 1, popP(f, q.timeline + 2))} opacity={Math.min(1, popP(f, q.timeline + 2) * 2)} /> : null}
      </div>
      {/* the merge node and the merged card on the main line (ghosted with the merge) */}
      {mNode > 0.001 && ghostGone < 0.999 ? (
        <div style={{ position: "absolute", inset: 0, opacity: mergeO * (1 - ghostGone) }}>
          {mCard > 0.001 ? (
            <>
              <Stem x={MX} y0={MW} y1={MW - MAIN_STEM} p={mCard} />
              <CommitCard cx={MX} cy={mainCardY - 40 * (1 - mCard)} c={COMMITS[6]} opacity={Math.min(1, mCard * 2)} />
            </>
          ) : null}
          <WireNode cx={MX} cy={MW} r={theme.wire.nodeR * mix(0.4, 1, mNode)} />
          {f >= q.merge ? <WordChip x={968} y={1064} word="merge" size={42} at={q.merge} /> : null}
        </div>
      ) : null}

      {/* main nodes (drawn over the stems and the branch start) */}
      <WireNode cx={N0} cy={MW} />
      <WireNode cx={N0 - 300} cy={MW} />
      <WireNode cx={N1} cy={MW} ring={theme.wire.nodeRing + 4 * ring} r={theme.wire.nodeR + 3 * ring} />

      {/* scissors' upper piece goes OVER the branch wire (the branch cards hang in front of the scissors, so no card
          text is ever crossed by a blade) */}
      {showSc ? <ScissorsPiece src={PHOTOS.scissors!} w={SC_W} px={screw.x} py={screw.y} dir={SC_DIR} opening={opening} piece="A" /> : null}
      {/* the branch's cards and its chip, falling with the branch */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CUT.x}px ${CUT.y}px`, transform: `translate(${(gap * 0.866).toFixed(2)}px, ${(fallY + gap * 0.5).toFixed(1)}px) rotate(${fallRot.toFixed(2)}deg)`, opacity: 1 - prog(f, q.a13 + 10, q.a13 + 22, SM) }}>
        {landB1 > 0.001 ? (
          <>
            <Stem x={B1.x} y0={B1.y} y1={B1C.y - CH / 2} p={landB1} />
            <CommitCard cx={B1C.x} cy={B1C.y + 40 * (1 - landB1)} c={COMMITS[4]} opacity={Math.min(1, landB1 * 2)} />
          </>
        ) : null}
        {landB2 > 0.001 && B2C.x < 5000 ? (
          <>
            <Stem x={B2.x} y0={B2.y} y1={B2C.y - CH / 2} p={landB2} />
            <CommitCard cx={B2C.x} cy={B2C.y + 40 * (1 - landB2)} c={COMMITS[6]} opacity={Math.min(1, landB2 * 2)} />
          </>
        ) : null}
        {f >= q.branch ? <WordChip x={196} y={930} word="branch" size={50} at={q.branch} opacity={1 - prog(f, q.a12, q.a12 + 8, SM)} /> : null}
      </div>

      {/* A13a: the newer commit, the tag, the return arrow with its marker */}
      {n3 > 0.001 ? (
        <>
          <Stem x={N3} y0={MW} y1={MW - MAIN_STEM} p={n3} />
          <CommitCard cx={N3} cy={mainCardY - 40 * (1 - n3)} c={COMMITS[5]} opacity={Math.min(1, n3 * 2)} />
          <WireNode cx={N3} cy={MW} r={theme.wire.nodeR * mix(0.4, 1, popP(f, q.a13 + 2))} opacity={Math.min(1, popP(f, q.a13 + 2) * 2)} />
        </>
      ) : null}
      {f >= q.tag - 4 ? <PaperTag sx={N1} sy={MW + 12} len={TAG.len} w={TAG.w} rot={tagRot} ink={v1Ink} opacity={prog(f, q.tag - 4, q.tag, SM)} /> : null}
      {retP > 0.001 ? <DashedArrow d={RETURN_D} p={retP} w={6} /> : null}
      {mk > 0.001 && mk < 0.999 ? <RingMarkerOnPath d={RETURN_D} p={mk} /> : null}
      {void RingMarker}
    </div>
  );
};

/** a dashed outline of a commit card (the feature that does not exist yet), with a faint "new feature" label */
const GhostCard: React.FC<{ cx: number; cy: number; p: number; f: number }> = ({ cx, cy, p, f }) => {
  if (p <= 0.001) return null;
  const w = CW;
  const h = CH;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2 + 1.2 * Math.sin(f / 23), width: w, height: h, opacity: p }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={12} fill="rgba(255,255,255,.55)" stroke="#8C8C8C" strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-f * 0.8} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 36, color: "#8C8C8C" }}>new feature</div>
    </div>
  );
};

/** a ring marker riding a cubic path (eval by sampling the bezier) */
const RingMarkerOnPath: React.FC<{ d: string; p: number }> = ({ d, p }) => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const [x0, y0, x1, y1, x2, y2, x3, y3] = n;
  const u = 1 - p;
  const x = u * u * u * x0 + 3 * u * u * p * x1 + 3 * u * p * p * x2 + p * p * p * x3;
  const y = u * u * u * y0 + 3 * u * u * p * y1 + 3 * u * p * p * y2 + p * p * p * y3;
  return <RingMarker cx={x} cy={y} p={Math.min(1, p * 8, (1 - p) * 8)} />;
};
