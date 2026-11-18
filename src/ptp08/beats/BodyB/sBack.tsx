// Scene BACK, B05b from "and you're there in seconds." (after the console typed 'go back to the last commit that
// worked'). The board: node 1 (history, bleeding off left), node 2 'add login page', and the uncommitted working
// state at a dashed node 3 with a dashed, cracked 'add dark mode' card. The ring marker sits on node 3 and slides back
// one node onto node 2 on "there" (camera follows); the dashed card fades out behind it. Below, the phone swaps the
// cracked app for a clean one (the clean phone slides in from the left, the cracked one slides out right) and a clock
// chip ticks three times on "in seconds".
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, ShatterOverlay, WireNode, WirePath, camPath, mix, prog, theme, zoomAt } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { backCut } from "./sConsole";
import { Btn, ClockGlyph, CommitCard, RingMarker } from "./objects";
import { Phone } from "./sApp";
import { Scene, bump, sway } from "./util";

const G = {
  wireY: 380,
  n: [40, 330, 810],
  cardY: 380 + 30 + 85,
  phone: { x: 150, y: 590, w: 280 },
  clock: { cx: 790, cy: 810, r: 150 },
};
const CW = 460;
const CH = 170;

const beats = (c: Cues) => ({
  start: backCut(c),
  there: c.w("B05b", "there"),
  in: c.w("B05b", "in"),
  seconds: c.w("B05b", "seconds"),
  end: c.s.B06a.start,
});

/** the ring marker's x at frame f (node 3 -> node 2 on "there") */
const markerX = (c: Cues, f: number) => {
  const b = beats(c);
  return mix(G.n[2], G.n[1], prog(f, b.there - 2, b.there + 18, EASE.travel));
};

const DashedCard: React.FC<{ cx: number; cy: number; text: string; opacity: number; crackAt: number }> = ({ cx, cy, text, opacity, crackAt }) => {
  if (opacity <= 0.001) return null;
  const w = CW;
  const h = CH;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, border: `5px dashed ${theme.color.ink}`, background: "rgba(255,255,255,.72)", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 38, color: "#444" }}>{text}</div>
      <ShatterOverlay x={0} y={0} w={w} h={h} ox={w * 0.7} oy={h * 0.35} seed={3} at={crackAt} dur={1} radius={12} />
    </div>
  );
};

const World: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = beats(c);
  const swap = prog(f, b.there + 2, b.there + 26, EASE.travel);
  const ghost = 1 - prog(f, b.there + 4, b.there + 20, EIO);
  const ticks = [b.in, b.seconds, b.seconds + 7];
  const ang = ticks.reduce((a, at) => a + 30 * prog(f, at - 2, at + 8, EIO), 0);
  const P = G.phone;
  return (
    <>
      <WirePath d={`M-60 ${G.wireY} L${G.n[1] + 20} ${G.wireY}`} w={9} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ghost }}>
        <line x1={G.n[1] + 20} y1={G.wireY} x2={G.n[2]} y2={G.wireY} stroke={theme.color.ink} strokeWidth={9} strokeDasharray="18 14" strokeLinecap="round" />
      </svg>
      <WireNode cx={G.n[0]} cy={G.wireY} r={17} ring={7} />
      <WireNode cx={G.n[1]} cy={G.wireY} r={17} ring={7} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ghost }}>
        <circle cx={G.n[2]} cy={G.wireY} r={15} fill="#F3F3F3" stroke={theme.color.ink} strokeWidth={6} strokeDasharray="8 6" />
      </svg>
      <CommitCard c={{ hash: "b7e21d4", msg: "add login page", tone: 0.4 }} cx={G.n[1]} cy={G.cardY + sway(f, 2, 70)} w={CW} h={CH} tf={`scale(${(1 + 0.05 * bump(f, b.there + 13, 12)).toFixed(4)})`} />
      <DashedCard cx={G.n[2]} cy={G.cardY} text="add dark mode" opacity={ghost} crackAt={b.start - 30} />
      <RingMarker cx={markerX(c, f)} cy={G.wireY} />
      {/* the phone: the cracked app slides out right, the clean one slides in from the left */}
      {/* a conveyor: the cracked app slides out to the left edge, the clean one slides in after it from the left */}
      <Phone P={{ ...P, x: P.x - 520 * prog(swap, 0, 0.55, EIO) }} ticks={3} dark={0.42} crack={b.start - 30} rot={-5 * swap} seed={7} />
      <Phone P={{ ...P, x: P.x - 520 * (1 - prog(swap, 0.4, 1, EIO)) }} ticks={3} dy={sway(f, 3, 90)} rot={4 * (1 - swap)} />
      <Btn cx={G.clock.cx} cy={G.clock.cy} r={G.clock.r} p={prog(f, b.start - 10, b.start + 6, EIO)} s={1 + 0.06 * bump(f, b.seconds, 16)}>
        <ClockGlyph a={ang} h={300} />
      </Btn>
    </>
  );
};

export const backBlocks = (): BlockSpec[] => [{ shots: ["B05b"], spec: "and you're there | in *seconds.", y: 1296, anchor: "bottom" }];

export const SceneBack: React.FC<{ c: Cues }> = ({ c }) => {
  const b = beats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 640, y: 1060 }, 1.02) })
    .to(b.there - 4, zoomAt({ x: 480, y: 1060 }, 1.015), 24)
    .push(b.end, 0.02).keys;
  return (
    <Scene
      c={c}
      from={b.start}
      to={b.end}
      keys={keys}
      world={<World c={c} />}
    />
  );
};
