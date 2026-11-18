// ===========================================================================
// HB hand-offs (ep08): the hook hands off into each body's first card, branching on bodyOf(variant).
// HB's language is the TIP-OVER, one continuous motion (SMOOTHNESS rule 9): over the last HANDOFF_LEN hook frames
// the paper the hook played on turns over its top edge like one board (rotateX 0 -> 180 deg about (540, 890), cubic
// ease in-out, dipping to 0.9 scale at edge-on): the front (the laptop and the grey remains) shows until edge-on, the
// body's own first card shows on the back after it, and lands at zero velocity untransformed on the hook's last frame,
// which is drawn by the body's own <FirstCard t={0} /> (camera at identity), so the last hook frame IS the body's
// frame 0. One object goes its own way, per body:
//   A (BodyA's GitHub-on-Git card): the grey struck GitHub chip flies to the card's GitHub slot while it turns with
//     the board (the strike bar lifts off); at edge-on it is exactly where the card's clean GitHub chip comes round.
//   B (BodyB's terminal card): the laptop's glass is a terminal and the Claude chip on its lid sits where the card's
//     corner chip comes round, so the whole front simply turns over into the terminal card.
//   C (BodyC's laptop with one app card): the laptop itself never turns: it glides and grows into BodyC's laptop over
//     the whole window; its glass turns over from the wiped terminal to BodyC's app screen, and the Claude chip on the
//     lid turns over into BodyC's '1 copy' pill.
// The cards are the bodies' own components, imported read-only.
// ===========================================================================
import React from "react";
import { EASE, LogoDisc, mix, prog } from "../../../paperstudio";
import { FC as FC_A, FirstCard as FirstCardA } from "../BodyA/firstCard";
import { FirstCard as FirstCardB } from "../BodyB/firstCard";
import { AppScreen, FC as FC_C, FirstCard as FirstCardC, InkPill, LAP as LAP_C } from "../BodyC/firstCard";
import { GLASS, HbLaptop, LAPTOP_AR, StrikeBar, type Box } from "./objects";

export type BodyLetter = "A" | "B" | "C";

/** the tip-over: the scale at edge-on, the perspective, the pivot (the hand-off point) */
export const HO = { sMid: 0.9, persp: 2400, pivot: { x: 540, y: 890 } } as const;

/** CSS for a turn about an origin: perspective, then rotateX, then scale (applied right to left) */
export const tipTf = (deg: number, s = 1, persp: number = HO.persp) => `perspective(${persp}px) rotateX(${deg.toFixed(3)}deg) scale(${s.toFixed(5)})`;

/** where a world point lands on screen (world px) under tipTf(deg, s) about `pv` (rotateX: y' = dy cos, z' = dy sin) */
export const proj = (p: { x: number; y: number }, deg: number, s: number, pv: { x: number; y: number } = HO.pivot) => {
  const a = (deg * Math.PI) / 180;
  const dx = (p.x - pv.x) * s;
  const dy = (p.y - pv.y) * s;
  const z = dy * Math.sin(a);
  const k = HO.persp / (HO.persp - z);
  return { x: pv.x + dx * k, y: pv.y + dy * Math.cos(a) * k, k };
};

/** the board's turn at group frame f: one cubic in-out from ho (0 deg) to end - 1 (180 deg, at rest) */
export const handoffState = (f: number, ho: number, end: number) => {
  const t = prog(f, ho, end - 1, EASE.cam);
  const th = 180 * t;
  return {
    on: f > ho,
    t,
    th,
    front: th < 90,
    back: th >= 90,
    last: f >= end - 1,
    frontDeg: th,
    backDeg: th - 180,
    s: 1 - (1 - HO.sMid) * Math.sin(Math.PI * t),
  };
};

/** the first frame the board is past edge-on (the back shows) */
export const edgeFrame = (ho: number, end: number) => {
  for (let f = ho; f < end; f++) if (handoffState(f, ho, end).back) return f;
  return end - 1;
};

// ------------------------------------------------------------------ A: the travelling GitHub chip
export type ChipPose = { cx: number; cy: number; r: number };

/** the GitHub slot of BodyA's card on the board's edge-on frame (where the card's chip comes round) */
export const slotAtEdge = (): ChipPose => {
  const p = proj({ x: FC_A.chipX, y: FC_A.githubY }, -90, HO.sMid);
  return { cx: p.x, cy: p.y, r: FC_A.r * HO.sMid * p.k };
};

/**
 * The struck GitHub chip leaving the struck-out spot: it flies (cubic in-out, a small lift) to the card's GitHub slot
 * as the slot will be at edge-on, turning with the board, and is gone exactly when the board is edge-on (the card's
 * own clean chip takes over there). Its strike bar lifts off over the first frames.
 */
export const GithubTraveller: React.FC<{ f: number; ho: number; end: number; lead: number; from: ChipPose; src?: string; bar: { len: number; rot: number } }> = ({
  f,
  ho,
  end,
  lead,
  from,
  src,
  bar,
}) => {
  const st = handoffState(f, ho, end);
  if (!st.front) return null;
  const T = slotAtEdge();
  const t = prog(f, ho - lead, edgeFrame(ho, end) - 1, EASE.cam);
  const cx = mix(from.cx, T.cx, t);
  const cy = mix(from.cy, T.cy, t) - 40 * Math.sin(Math.PI * t);
  const r = mix(from.r, T.r, t);
  const barP = prog(f, ho - lead, ho - lead + 12, EASE.cam);
  return (
    <>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, transformOrigin: "50% 50%", transform: tipTf(st.th, 1, 900) }}>
        <LogoDisc name="GitHub" r={r} src={src} grey />
      </div>
      {barP < 1 ? <StrikeBar cx={cx} cy={cy} len={bar.len * (r / from.r)} p={1} rot={bar.rot} opacity={1 - barP} dy={-34 * barP} /> : null}
    </>
  );
};

// ------------------------------------------------------------------ A and B: the body's card on the board's back
/** the body's own first card on the back of the board; untransformed (exactly the body's frame 0) on the last frame */
export const BackCard: React.FC<{ body: "A" | "B"; deg: number; s: number; last: boolean }> = ({ body, deg, s, last }) => {
  const card = body === "A" ? <FirstCardA t={0} /> : <FirstCardB t={0} />;
  if (last) return card;
  return <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${HO.pivot.x}px ${HO.pivot.y}px`, transform: tipTf(deg, s) }}>{card}</div>;
};

// ------------------------------------------------------------------ C: the laptop glides into BodyC's laptop
/** box-relative point (fractions of the laptop box) */
const rel = (b: Box, u: number, v: number) => ({ x: b.x + u * b.w, y: b.y + (v * b.w) / LAPTOP_AR });

/**
 * BodyC hand-off layer (drawn above the background sheets and under the turning remains, from ho on): the laptop glides
 * from the hook's box to BodyC's LAP over the whole window (the board's own ease, so it lands at rest on the last
 * frame); its glass turns over from `glassFront` (the wiped terminal) to BodyC's AppScreen; the Claude chip on the lid
 * corner turns over into BodyC's '1 copy' pill while the spot slides from the chip's place to the pill's.
 */
export const CHandoff: React.FC<{
  f: number;
  ho: number;
  end: number;
  from: Box;
  chip: { u: number; v: number; r: number; src?: string };
  glassFront: React.ReactNode;
}> = ({ f, ho, end, from, chip, glassFront }) => {
  const st = handoffState(f, ho, end);
  if (st.last) return <FirstCardC t={0} />;
  const g = st.t;
  const b: Box = { x: mix(from.x, LAP_C.x, g), y: mix(from.y, LAP_C.y, g), w: mix(from.w, LAP_C.w, g) };
  const kc = b.w / from.w; // the chip keeps its hook size relative to the laptop
  const kp = b.w / LAP_C.w; // the pill is full size on BodyC's laptop
  // the pill's spot as a fraction of the laptop box (BodyC's frame 0 geometry)
  const pu = (FC_C.pill.cx - LAP_C.x) / LAP_C.w;
  const pv = ((FC_C.pill.cy - LAP_C.y) / LAP_C.w) * LAPTOP_AR;
  const sp = rel(b, mix(chip.u, pu, g), mix(chip.v, pv, g));
  return (
    <>
      <HbLaptop b={b}>
        <div style={{ position: "absolute", left: 0, top: 0, width: GLASS.w, height: GLASS.h, transformOrigin: "50% 50%", transform: tipTf(st.front ? st.frontDeg : st.backDeg, 1, 2200) }}>
          {st.front ? glassFront : <AppScreen t={0} />}
        </div>
      </HbLaptop>
      {st.front ? (
        <div style={{ position: "absolute", left: sp.x - chip.r * kc, top: sp.y - chip.r * kc, width: 2 * chip.r * kc, height: 2 * chip.r * kc, transformOrigin: "50% 50%", transform: tipTf(st.frontDeg, 1, 900) }}>
          <LogoDisc name="Claude" r={chip.r * kc} src={chip.src} />
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${sp.x}px ${sp.y}px`, transform: tipTf(st.backDeg, 1, 900) }}>
          <InkPill cx={sp.x} cy={sp.y} text={FC_C.pill.text} fs={FC_C.pill.fs} rot={FC_C.pill.rot} scale={kp} />
        </div>
      )}
    </>
  );
};
