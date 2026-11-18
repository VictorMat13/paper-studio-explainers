// Scene PUSH, from "and that save lands on GitHub," (B04a, after the console's "push") through B04b "so your work
// survives even if your laptop doesn't."
// The laptop cut-out (bottom left) shows the local timeline on its screen (kit ScreenInset); the charcoal GitHub slab
// sits at the top right with a landing card under it. A 7 px dashed arrow draws from the screen up to the card; on
// "save" the newest commit card ('add login page') lifts off the screen and flies along the arrow (camera follows),
// landing in the GitHub card on "GitHub". B04b: a white 'safe' pill sets down on the card on "survives"; on "laptop"
// a crack web runs over the laptop's screen, on "doesn't" the screen goes dark grey and the laptop sinks into the
// paper (down, tilting, fading to a ghost) while the GitHub card keeps the commit.
import React from "react";
import { useCurrentFrame } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { DashedArrow, EASE, META06, PaperCard, Pill, ScreenInset, ShatterOverlay, camPath, mix, prog, zoomAt, type Quad } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { pushCut } from "./sConsole";
import { A, CommitCard, GitHubSlab, LAPTOP_ASPECT } from "./objects";
import { PaperFace, Scene, bump, sway } from "./util";
import { PopIn } from "./paper";

export const PUSH = {
  laptop: { x: -30, y: 490, w: 720 },
  slab: { cx: 795, cy: 372 },
  card: { x: 500, y: 590, w: 560, h: 240 },
  land: { cx: 780, cy: 700 },
};
const QUAD: Quad = META06.laptop.quad;
const CW = 1600;
const CH = 1000;

/** world point of a content point (u, v in content px) on the laptop screen (bilinear on the screen quad) */
export const onScreen = (L: { x: number; y: number; w: number }, u: number, v: number) => {
  const h = L.w / LAPTOP_ASPECT;
  const s = u / CW;
  const t = v / CH;
  const [tl, tr, br, bl] = QUAD;
  const top = [tl[0] + s * (tr[0] - tl[0]), tl[1] + s * (tr[1] - tl[1])];
  const bot = [bl[0] + s * (br[0] - bl[0]), bl[1] + s * (br[1] - bl[1])];
  return { x: L.x + (top[0] + t * (bot[0] - top[0])) * L.w, y: L.y + (top[1] + t * (bot[1] - top[1])) * h };
};
/** world scale of content px on the screen (about) */
const screenScale = (L: { w: number }) => ((QUAD[1][0] - QUAD[0][0]) * L.w) / CW;

/** the local timeline drawn in screen content px (1600 x 1000) */
export const LocalTimeline: React.FC<{ hideLast?: boolean; dim?: number }> = ({ hideLast, dim = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, background: "#F2F2F1" }}>
    <svg width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={60} y1={330} x2={1540} y2={330} stroke="#111" strokeWidth={18} strokeLinecap="round" />
      {[420, 1180].map((x) => (
        <circle key={x} cx={x} cy={330} r={34} fill="#F3F3F3" stroke="#111" strokeWidth={14} />
      ))}
    </svg>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${(600 / 380).toFixed(4)})`, transformOrigin: "0 0" }}>
      <CommitCard c={{ hash: "3f9a2c1", msg: "first version", tone: 0.55 }} cx={420 / (600 / 380)} cy={610 / (600 / 380)} />
      {hideLast ? null : <CommitCard c={{ hash: "b7e21d4", msg: "add login page", tone: 0.4 }} cx={1180 / (600 / 380)} cy={610 / (600 / 380)} />}
    </div>
    {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: "#3A3A3D", opacity: dim }} /> : null}
  </div>
);

const beats = (c: Cues) => ({
  start: pushCut(c),
  save: c.w("B04a", "save"),
  github: c.w("B04a", "github"),
  b4b: c.s.B04b.start,
  survives: c.w("B04b", "survives"),
  laptop: c.w("B04b", "laptop"),
  doesnt: c.w("B04b", ["doesn't", "doesnt"]),
  end: c.s.B05a.start,
});

const flightPath = () => {
  const a = onScreen(PUSH.laptop, 1180, 610);
  const L = PUSH.land;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${a.x + 70} ${a.y - 190}, ${L.cx - 240} ${L.cy - 90}, ${L.cx} ${L.cy}`;
};
const ARROW = () => {
  // one smooth arc from just above the laptop screen's right edge into the GitHub card's left side
  const a = onScreen(PUSH.laptop, 1500, 120);
  const e = { x: PUSH.card.x - 16, y: PUSH.card.y + 70 };
  return `M${(a.x + 6).toFixed(1)} ${(a.y - 18).toFixed(1)} C ${(a.x + 40).toFixed(1)} ${(a.y - 120).toFixed(1)}, ${(e.x - 90).toFixed(1)} ${(e.y - 60).toFixed(1)}, ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
};
/** the flying card: progress 0..1 at frame f, its centre and scale */
export const flight = (c: Cues, f: number) => {
  const b = beats(c);
  const p = prog(f, b.save - 1, b.github + 3, EASE.travel);
  const d = flightPath();
  const L = getLength(d);
  const pt = getPointAtLength(d, L * p);
  const s0 = (600 * screenScale(PUSH.laptop)) / 460;
  return { p, x: pt.x, y: pt.y, s: mix(s0, 1, p) };
};

const World: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = beats(c);
  const P = PUSH;
  const fl = flight(c, f);
  const lifted = f >= b.save - 1;
  const crack = b.laptop;
  const dead = prog(f, b.doesnt - 1, b.doesnt + 16, EIO);
  // the laptop slides in from the left edge, the slab drops in from the top and squashes as it lands
  const lapIn = prog(f, b.start - 4, b.start + 16, EIO);
  const slabIn = prog(f, b.start - 2, b.start + 14, EIO);
  const squash = 0.5 * (1 - Math.cos(2 * Math.PI * Math.min(1, Math.max(0, (f - b.start - 10) / 12))));
  const dim = 0.75 * prog(f, b.laptop + 6, b.doesnt + 4, EIO);
  const lh = P.laptop.w / LAPTOP_ASPECT;
  const land = bump(f, b.github + 3, 10);
  return (
    <>
      {/* the laptop sinks into the paper on "doesn't" (down, tilting, fading to a ghost) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${(-560 * (1 - lapIn)).toFixed(2)}px,${(8 * dead + sway(f, 3, 80)).toFixed(2)}px) rotate(${(4 * dead).toFixed(2)}deg) scale(${(1 - 0.2 * dead).toFixed(4)})`,
          transformOrigin: `${P.laptop.x + P.laptop.w / 2}px ${P.laptop.y + lh}px`,
          opacity: 1 - dead,
          filter: dead > 0.01 ? `grayscale(${dead.toFixed(3)})` : undefined,
        }}
      >
        <ScreenInset x={P.laptop.x} y={P.laptop.y} w={P.laptop.w} src={A.laptop()} contentW={CW} contentH={CH} sheen>
          <LocalTimeline hideLast={lifted} dim={dim} />
        </ScreenInset>
        {f >= crack ? (
          <div style={{ position: "absolute", inset: 0, clipPath: `polygon(${QUAD.map((q) => `${(P.laptop.x + q[0] * P.laptop.w).toFixed(1)}px ${(P.laptop.y + q[1] * lh).toFixed(1)}px`).join(",")})` }}>
            <ShatterOverlay x={P.laptop.x} y={P.laptop.y} w={P.laptop.w * 0.75} h={lh * 0.66} ox={P.laptop.w * 0.42} oy={lh * 0.3} seed={11} at={crack} dur={18} radius={0} />
          </div>
        ) : null}
      </div>
      <GitHubSlab cx={P.slab.cx} cy={P.slab.cy - 420 * (1 - slabIn) + sway(f, 2, 74, 1)} s={1 + 0.06 * land} squash={squash} />
      <PaperCard x={P.card.x} y={P.card.y} w={P.card.w} h={P.card.h} sheets={2}>
        <PaperFace />
      </PaperCard>
      <DashedArrow d={ARROW()} at={b.start + 2} dur={18} w={7} />
      {lifted ? (
        <CommitCard
          c={{ hash: "b7e21d4", msg: "add login page", tone: 0.4 }}
          cx={fl.x}
          cy={fl.y}
          w={460}
          h={170}
          tf={`scale(${(fl.s * (1 + 0.05 * land)).toFixed(4)}) rotate(${(-6 * Math.sin(Math.PI * fl.p)).toFixed(2)}deg)`}
        />
      ) : null}
      <PopIn at={b.survives - 2} dur={14} ox={P.land.cx} oy={P.card.y + P.card.h + 10}>
        <Pill x={P.land.cx} y={P.card.y + P.card.h - 22} text="safe" light fs={46} />
      </PopIn>
    </>
  );
};

export const pushBlocks = (): BlockSpec[] => [
  { shots: ["B04a"], spec: "and that save | lands on *GitHub,", y: 1296, anchor: "bottom" },
  { shots: ["B04b"], spec: "so your work | *survives", y: 1296, anchor: "bottom" },
  { shots: ["B04b"], spec: "even if your | #laptop #doesn't.", y: 1296, anchor: "bottom" },
];

export const ScenePush: React.FC<{ c: Cues }> = ({ c }) => {
  const b = beats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 380, y: 830 }, 1.03) })
    .push(b.save - 3, 0.005)
    .to(b.save - 3, zoomAt({ x: 600, y: 1060 }, 1.01), 24)
    .push(b.doesnt + 10, 0.008)
    .to(b.doesnt + 12, zoomAt({ x: 780, y: 300 }, 1.14), 24)
    .push(b.end, 0.015).keys;
  return (
    <Scene
      c={c}
      from={b.start}
      to={b.end}
      keys={keys}
      follow={[{ from: b.save - 1, to: b.github + 8, target: (fr) => { const q = flight(c, fr); return { x: q.x, y: q.y }; }, lag: 4, weight: 0.35, ramp: 16 }]}
      world={<World c={c} />}
    />
  );
};
