// BodyB motion helpers and the scene camera wrapper. Frame-driven, bezier easing, no springs.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BLUR } from "../../crossBreak";
import { CAM_BOX, Camera, EASE, boxCentre, camPath, mix, prog, useCamera, type CamFollow, type CamKey } from "../../../paperstudio";
import { SHOTS, type Cues } from "./cues";
import { EIO, PAPER_TEX } from "./paper";
export { PAPER_TEX, PaperFace } from "./paper";

export const ID = { ...boxCentre(CAM_BOX.body), zoom: 1 };

/** 1 at the cue easing to 0 over dur */
/** a smooth bell 0 -> 1 -> 0 starting at `at` over max(dur, 12) frames (cosine: zero velocity at both ends) */
export const bump = (f: number, at: number, dur = 12) => {
  const d = Math.max(12, dur);
  return f < at || f > at + d ? 0 : 0.5 * (1 - Math.cos(((f - at) / d) * Math.PI * 2));
};
/** soft 0 -> 1 -> 0 swell over dur */
export const swell = (f: number, at: number, dur = 14) => {
  const d = Math.max(12, dur);
  return f < at || f > at + d ? 0 : 0.5 * (1 - Math.cos(((f - at) / d) * Math.PI * 2));
};
/** gentle sine drift */
export const sway = (f: number, amp: number, period: number, seed = 0) => amp * Math.sin(((f + seed * 23) / period) * Math.PI * 2);
/** eased value through {f, v} keys */
export const keyed = (keys: { f: number; v: number }[], f: number, ease: (t: number) => number = EASE.cam) => {
  if (!keys.length) return 0;
  if (f <= keys[0].f) return keys[0].v;
  for (let i = 1; i < keys.length; i++) if (f <= keys[i].f) return mix(keys[i - 1].v, keys[i].v, prog(f, keys[i - 1].f, keys[i].f, ease));
  return keys[keys.length - 1].v;
};
/** pop progress (no overshoot, 12 frames, in-out) */
export const pop = (f: number, at: number, dur = 12) => prog(f, at, at + Math.max(12, dur), EIO);
/** a damped swing (tags on strings): deg amplitude, settles over `dur` frames, bezier-shaped envelope */
export const swing = (f: number, at: number, amp = 14, period = 16, dur = 46) => {
  if (f < at) return 0;
  // the envelope rises in over 8 frames and decays smoothly, so the swing starts and ends at rest
  const env = prog(f, at, at + 8, EIO) * (1 - prog(f, at + 8, at + dur, EIO));
  return amp * env * Math.sin(((f - at) / period) * Math.PI * 2);
};

/** a camera path with a drift that restarts at every split boundary (the visible change at each part) */
export const driftThrough = (p: ReturnType<typeof camPath>, until: number, bounds: number[], amount = 0.015) => {
  const pts = [...bounds.filter((b) => b > p.keys[p.keys.length - 1].f + 4 && b < until - 4), until];
  let sgn = 1;
  for (const b of pts) {
    p.push(b, amount * sgn);
    sgn = 1;
  }
  return p;
};

/** every split-part start inside [from, to) (not the shot starts): the boundaries that need a visible change */
export const partBounds = (c: Cues, from: number, to: number) => {
  const out: number[] = [];
  for (const id of SHOTS) for (const p of c.s[id].parts.slice(1)) if (p.start > from + 2 && p.start < to - 2) out.push(p.start);
  return out;
};
/** a small extra push of the world that starts at every split boundary (+0.8% each, eased over 14 frames), so each
 *  part opens on a visible change even where no word event lands on it */
export const boundaryPush = (f: number, bounds: number[]) => 1 + bounds.reduce((a, b) => a + 0.008 * prog(f, b - 4, b + 20, EASE.drift), 0);

/**
 * A layer that moves at `rate` of the camera (1 = the world, 0.7 = background, 1.15 = foreground): it is offset by the
 * part of the camera move it should not follow and scaled about the camera's focal point, so the layers slide past
 * each other on every pan and push.
 */
export const Parallax: React.FC<{ rate: number; children: React.ReactNode }> = ({ rate, children }) => {
  const { pose, anchor } = useCamera();
  const k = 1 - rate;
  const dx = (pose.x - anchor.x) * k;
  const dy = (pose.y - anchor.y) * k;
  const s = Math.pow(pose.zoom, -k);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) scale(${s.toFixed(5)})`, transformOrigin: `${pose.x.toFixed(1)}px ${pose.y.toFixed(1)}px` }}>
      {children}
    </div>
  );
};

export type Sheet = { x: number; y: number; w: number; h: number; rot: number };
/** the default background stage: two big blank paper sheets peeking in at the edges behind the subject */
export const SHEETS_DEFAULT: Sheet[] = [
  { x: -260, y: 150, w: 560, h: 720, rot: -7 },
  { x: 760, y: 560, w: 620, h: 640, rot: 6 },
];
/** blank paper sheets on the ground (background layer, parallax 0.7): stacked edge, soft shadow, slow drift */
export const BackSheets: React.FC<{ sheets?: Sheet[]; f: number; inAt?: number }> = ({ sheets = SHEETS_DEFAULT, f, inAt }) => (
  <Parallax rate={0.7}>
    {sheets.map((sh, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: sh.x + (inAt === undefined ? 0 : (sh.x + sh.w / 2 < 540 ? -700 : 700) * (1 - prog(f, inAt + i * 3, inAt + i * 3 + 22, EIO))),
          top: sh.y + 1.2 * Math.sin((f + i * 37) / 70),
          width: sh.w,
          height: sh.h,
          transform: `rotate(${(sh.rot + 0.25 * Math.sin((f + i * 53) / 90)).toFixed(3)}deg)`,
          borderRadius: 16,
          background: "#FDFDFC",
          backgroundImage: PAPER_TEX,
          boxShadow: "2px 2px 0 #E2E0DD,4px 4px 0 #D8D6D3,14px 22px 40px rgba(0,0,0,.10),40px 60px 100px rgba(0,0,0,.06)",
          opacity: 0.92,
        }}
      />
    ))}
  </Parallax>
);

/** SMOOTHNESS: frames of every scene crossing, centred on the scene boundary (no scene ever cuts in one frame) */
export const CROSS = 16;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * One scene under one kit Camera (paper + grid drawn by the camera; blur off because every scene carries text).
 * Renders inside [from, to) plus CROSS / 2 frames either side for the blurred crossings with its neighbours: as the
 * incoming scene (drawn on top) it fades in across the middle of the crossing while it clears from 14 px to sharp; as
 * the outgoing scene it blurs to 14 px over the first half and keeps moving under the incoming one. Both scenes keep
 * running through the crossing. Under the world: the background paper sheets (parallax 0.7) unless `sheets={false}`.
 */
export const Scene: React.FC<{
  from: number;
  to: number;
  keys: CamKey[];
  follow?: CamFollow[];
  world: React.ReactNode;
  hud?: React.ReactNode;
  breathe?: number;
  /** the cues: the split boundaries inside [from, to) get a small world push each (partBounds) */
  c?: Cues;
  /** the point the boundary pushes scale about (default the safe-box centre) */
  pushAt?: { x: number; y: number };
  /** background sheets (default two at the edges); false = none */
  sheets?: Sheet[] | false;
  /** frame the background sheets slide in from the edges (undefined = already there) */
  sheetsIn?: number;
  /** cross in from the previous scene / out into the next one (default both) */
  crossIn?: boolean;
  crossOut?: boolean;
}> = ({ from, to, keys, follow, world, hud, breathe = 1.2, c, pushAt = { x: 540, y: 758.5 }, sheets, sheetsIn, crossIn = true, crossOut = true }) => {
  const f = useCurrentFrame();
  const half = CROSS / 2;
  const lo = crossIn ? from - half : from;
  const hi = crossOut ? to + half : to;
  if (f < lo || f >= hi) return null;
  let blur = 0;
  let opacity = 1;
  if (crossIn && f < from + half) {
    const u = clamp01((f - (from - half) + 1) / (CROSS + 1));
    blur = BLUR * (1 - EASE.travel(clamp01((u - 0.5) / 0.5)));
    opacity = EASE.travel(clamp01((u - 0.2) / 0.6));
  }
  if (crossOut && f >= to - half) {
    const u = clamp01((f - (to - half) + 1) / (CROSS + 1));
    blur = Math.max(blur, BLUR * EASE.travel(clamp01(u / 0.5)));
  }
  const k = c ? boundaryPush(f, partBounds(c, from, to)) : 1;
  const push = 0.03 * (blur / BLUR);
  return (
    <AbsoluteFill
      style={{
        opacity,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        transform: push > 0.0005 ? `scale(${(1 + push).toFixed(4)})` : undefined,
      }}
    >
      <Camera keys={keys} follow={follow} blur={false} breathe={breathe} hud={hud}>
        {sheets === false ? null : <BackSheets sheets={sheets} f={f} inAt={sheetsIn} />}
        <div style={{ position: "absolute", inset: 0, transform: k > 1.0001 ? `scale(${k.toFixed(5)})` : undefined, transformOrigin: `${pushAt.x}px ${pushAt.y}px` }}>{world}</div>
      </Camera>
    </AbsoluteFill>
  );
};
