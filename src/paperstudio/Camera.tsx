// ===========================================================================
// Paper Studio camera (2026-10-31, Victor: "smoother zoom-ins ... tracking on the animations").
// One world under a virtual camera, after the Liam cinematic-camera rig
// (~/.claude/skills/liam-remotion-graphics/reference/upstream/cinematic-camera.md) and the Victor-approved
// fish8 "very clean" reference (bezier only, follow rig, camera-only motion blur).
//
//   <Camera keys={camPath({ f: 0 }).push(40, 0.04).to(40, { x: 540, y: 520, zoom: 1.5 }, 18).keys}
//           follow={[{ from: 70, to: 110, target: cardPos, lag: 4 }]}
//           hud={<KineticCaption ... />}>
//     {...world content in world px...}
//   </Camera>
//
// Conventions
// - World px = reel px. A key's (x, y) is the WORLD point placed at the camera anchor (default: the centre of
//   the safe box, 540 x 758.5), so { x: 540, y: 758.5, zoom: 1 } is "no camera". Keys inherit missing fields
//   from the key before, so `{ f: 0 }` alone is the identity.
// - Frames are relative to the enclosing <Sequence> (useCurrentFrame), like every other kit `at`.
// - Moves ease with EASE.cam (in-out cubic family), zoom interpolates in log space (even perceived speed),
//   no springs, nothing overshoots. Holds = repeated poses. Moves 14-24 frames.
// - The ground (lit paper + grid) stays put: the grid only parallaxes a little (default 0.15 of the pan) and
//   never scales, so a zoom reads as a camera, not as a page being scaled. The shell's single CrtPass sits
//   outside all of this and never moves.
// - `hud` is drawn in screen space above the world (captions, pills that must not zoom).
// - Motion blur only during fast camera moves: the world is drawn `samples` times at sub-frame times inside one
//   shutter centred on the frame (camera AND world time, so a tracked card stays sharp while the paper smears),
//   summed with plus-lighter. Slow frames draw once, so holds cost nothing extra.
// ===========================================================================
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { Grid, Ground } from "./Ground";
import { EASE, mix, prog, theme } from "./theme";

export type CamPose = { x: number; y: number; zoom: number; rot: number };
/** a camera keyframe; missing fields inherit from the key before. `ease` shapes the segment ARRIVING at this key */
export type CamKey = { f: number; x?: number; y?: number; zoom?: number; rot?: number; ease?: (t: number) => number };
export type Box = { x0: number; x1: number; y0: number; y1: number };
export type Pt = { x: number; y: number };

/** the boxes a camera frames into: body shots use the whole safe box, hooks the space under the overlay band */
export const CAM_BOX = {
  body: { x0: theme.safe.x0, x1: theme.safe.x1, y0: theme.safe.y0, y1: theme.safe.y1 },
  hook: { x0: theme.safe.x0, x1: theme.safe.x1, y0: 460, y1: theme.safe.y1 },
} as const;
export const boxCentre = (b: Box): Pt => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });

/** extra breathing room around everything a Camera draws except the ground: 0.9 = 5% padding each side,
 *  scaled about the safe-box centre. The shell provides it once (Victor 2026-10-31: "a little 5% padding") */
export const PadCtx = createContext(1);

/** a target the camera tracks: `target(f)` is the moving thing's WORLD position at (possibly fractional) frame f */
export type CamFollow = {
  from: number;
  to: number;
  target: (f: number) => Pt;
  /** 0..1 how much the camera locks on (default 1); 0.6 = it leans toward the target but keeps the composition */
  weight?: number;
  /** frames the lock eases in after `from` and out before `to` (default 10) */
  ramp?: number;
  /** lag smoothing in frames (default 4): the camera trails the target like a real operator; 0 = rigid */
  lag?: number;
  /** offset added to the target (e.g. lead ahead of the motion) */
  dx?: number;
  dy?: number;
  /** track only one axis */
  axis?: "xy" | "x" | "y";
};

export type CamGround = {
  /** fraction of the camera pan the grid follows (default 0.15; 0 = locked to the screen) */
  parallax?: number;
  grid?: boolean;
  swoosh?: boolean;
  swooshDrift?: number;
  dark?: boolean;
  gridOpacity?: number;
};

export type CamBlur = {
  /** most sub-frame samples on the fastest moves (default 10); the count adapts to the speed (3 at least) */
  samples?: number;
  /** shutter in frames (default 0.5 = 180 degrees) */
  shutter?: number;
  /** screen px per frame above which blur kicks in (default 5) */
  threshold?: number;
  /**
   * sample the world's own time too (default true), like a real shutter: a card the camera tracks stays sharp
   * while the paper behind it smears, and things that move on their own blur with their motion. false samples
   * only the camera (a tracked card would smear with the background).
   */
  content?: boolean;
};

// --------------------------------------------------------------------- pure camera maths
const resolve = (keys: CamKey[], anchor: Pt): (Required<Omit<CamKey, "ease">> & { ease?: (t: number) => number })[] => {
  const sorted = [...keys].sort((a, b) => a.f - b.f);
  const out: (Required<Omit<CamKey, "ease">> & { ease?: (t: number) => number })[] = [];
  let prev = { x: anchor.x, y: anchor.y, zoom: 1, rot: 0 };
  for (const k of sorted) {
    const cur = { f: k.f, x: k.x ?? prev.x, y: k.y ?? prev.y, zoom: k.zoom ?? prev.zoom, rot: k.rot ?? prev.rot, ease: k.ease };
    const last = out[out.length - 1];
    if (last && cur.f <= last.f) {
      if (cur.f === last.f) out[out.length - 1] = cur; // same frame: the later key wins (a cut)
      else continue;
    } else out.push(cur);
    prev = cur;
  }
  if (!out.length) out.push({ f: 0, ...prev });
  return out;
};

/** camera pose from keys at frame f (fractional frames allowed), before follow and breathe */
export const camAtKeys = (keys: CamKey[], f: number, anchor: Pt = boxCentre(CAM_BOX.body)): CamPose => {
  const k = resolve(keys, anchor);
  if (f <= k[0].f) return { x: k[0].x, y: k[0].y, zoom: k[0].zoom, rot: k[0].rot };
  const last = k[k.length - 1];
  if (f >= last.f) return { x: last.x, y: last.y, zoom: last.zoom, rot: last.rot };
  let i = 0;
  while (i < k.length - 2 && f >= k[i + 1].f) i++;
  const a = k[i];
  const b = k[i + 1];
  const t = (b.ease ?? EASE.cam)(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    zoom: Math.exp(mix(Math.log(a.zoom), Math.log(b.zoom), t)),
    rot: mix(a.rot, b.rot, t),
  };
};

const smoothTarget = (fl: CamFollow, f: number): Pt => {
  const lag = fl.lag ?? 4;
  if (lag <= 0.01) return fl.target(f);
  // FIR approximation of an exponential follow (deterministic: no state between frames)
  const n = Math.max(2, Math.ceil(lag * 3));
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.exp(-i / lag);
    const p = fl.target(f - i);
    sx += p.x * w;
    sy += p.y * w;
    sw += w;
  }
  return { x: sx / sw, y: sy / sw };
};

export type CamSpec = { keys: CamKey[]; follow?: CamFollow[]; anchor?: Pt; breathe?: number };

/** the full camera pose at frame f: keys, then follows, then the ambient breathe */
export const camAt = (spec: CamSpec, f: number): CamPose => {
  const anchor = spec.anchor ?? boxCentre(CAM_BOX.body);
  const p = camAtKeys(spec.keys, f, anchor);
  for (const fl of spec.follow ?? []) {
    const ramp = fl.ramp ?? 10;
    const w = (fl.weight ?? 1) * prog(f, fl.from, fl.from + ramp, EASE.cam) * (1 - prog(f, fl.to - ramp, fl.to, EASE.cam));
    if (w <= 0) continue;
    const t = smoothTarget(fl, f);
    const tx = t.x + (fl.dx ?? 0);
    const ty = t.y + (fl.dy ?? 0);
    if (fl.axis !== "y") p.x = mix(p.x, tx, w);
    if (fl.axis !== "x") p.y = mix(p.y, ty, w);
  }
  const b = spec.breathe ?? 0;
  if (b) {
    p.x += b * Math.sin((f / 150) * Math.PI * 2);
    p.y += b * 0.6 * Math.cos((f / 190) * Math.PI * 2);
  }
  return p;
};

/** CSS transform (origin 0 0) that puts world point (pose.x, pose.y) on the anchor, zoomed and rotated about it */
export const camTransform = (p: CamPose, anchor: Pt) =>
  `translate(${anchor.x.toFixed(2)}px,${anchor.y.toFixed(2)}px) rotate(${p.rot.toFixed(3)}deg) scale(${p.zoom.toFixed(5)}) translate(${(-p.x).toFixed(2)}px,${(-p.y).toFixed(2)}px)`;

/** world point -> screen point under a pose */
export const toScreen = (p: CamPose, anchor: Pt, w: Pt): Pt => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (w.x - p.x) * p.zoom;
  const dy = (w.y - p.y) * p.zoom;
  return { x: anchor.x + dx * Math.cos(r) - dy * Math.sin(r), y: anchor.y + dx * Math.sin(r) + dy * Math.cos(r) };
};
/** screen point -> world point under a pose */
export const toWorld = (p: CamPose, anchor: Pt, s: Pt): Pt => {
  const r = (-p.rot * Math.PI) / 180;
  const dx = s.x - anchor.x;
  const dy = s.y - anchor.y;
  return { x: p.x + (dx * Math.cos(r) - dy * Math.sin(r)) / p.zoom, y: p.y + (dx * Math.sin(r) + dy * Math.cos(r)) / p.zoom };
};

/** screen px a frame the camera is moving at frame f (max over the safe-box corners and centre) */
export const camSpeed = (spec: CamSpec, f: number): number => {
  const anchor = spec.anchor ?? boxCentre(CAM_BOX.body);
  const now = camAt(spec, f);
  const a = camAt(spec, f - 0.5);
  const b = camAt(spec, f + 0.5);
  const s = CAM_BOX.body;
  let m = 0;
  for (const sp of [
    { x: s.x0, y: s.y0 },
    { x: s.x1, y: s.y0 },
    { x: s.x0, y: s.y1 },
    { x: s.x1, y: s.y1 },
    anchor,
  ]) {
    const w = toWorld(now, anchor, sp);
    const pa = toScreen(a, anchor, w);
    const pb = toScreen(b, anchor, w);
    m = Math.max(m, Math.hypot(pb.x - pa.x, pb.y - pa.y));
  }
  return m;
};

/**
 * The pose that frames a world rect inside a box (default the body safe box) with a margin, capped at `max` zoom.
 * Use with the same box as the Camera's (`box` prop), e.g. `.to(at, frameRect(DOLLAR, { margin: 80 }), 18)`.
 */
export const frameRect = (
  r: { x: number; y: number; w: number; h: number },
  o: { box?: Box; margin?: number; max?: number; min?: number } = {},
): { x: number; y: number; zoom: number } => {
  const box = o.box ?? CAM_BOX.body;
  const m = o.margin ?? 40;
  const z = Math.min((box.x1 - box.x0 - 2 * m) / r.w, (box.y1 - box.y0 - 2 * m) / r.h);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2, zoom: Math.min(o.max ?? 2.4, Math.max(o.min ?? 0.6, z)) };
};

/**
 * The pose that zooms by `zoom` about world point `p` while keeping `p` exactly where it is on screen (at rest).
 * "Push in on the crack" without the crack sliding: `.to(at, zoomAt({ x: 540, y: 600 }, 1.18, "hook"), 16)`.
 * Pass the same box as the Camera's `box` prop.
 */
export const zoomAt = (p: Pt, zoom: number, box: Box | "body" | "hook" = "body"): { x: number; y: number; zoom: number } => {
  const c = boxCentre(typeof box === "string" ? CAM_BOX[box] : box);
  return { x: p.x - (p.x - c.x) / zoom, y: p.y - (p.y - c.y) / zoom, zoom };
};

// --------------------------------------------------------------------- key builder
type PoseIn = { x?: number; y?: number; zoom?: number; rot?: number };
/**
 * Chainable key builder for the hold -> move -> hold grammar.
 *   camPath({ f: 0, zoom: 1 })        start pose (identity if empty)
 *     .push(60, 0.04)                 slow drift-in (zoom x1.04) from the last key to frame 60 (EASE.drift)
 *     .to(60, { y: 520, zoom: 1.5 }, 18)   hold until 60, then move for 18 frames (EASE.cam)
 *     .hold(100)                      explicit hold to frame 100
 *     .cut(120, { zoom: 1 })          hard cut (no move) at 120
 *     .keys
 * Frames that would run backwards are clamped, so a re-timed shot never produces an invalid key list.
 */
export const camPath = (start: PoseIn & { f?: number } = {}) => {
  const keys: CamKey[] = [{ f: start.f ?? 0, x: start.x, y: start.y, zoom: start.zoom, rot: start.rot }];
  const lastF = () => keys[keys.length - 1].f;
  const zoomNow = () => {
    for (let i = keys.length - 1; i >= 0; i--) if (keys[i].zoom !== undefined) return keys[i].zoom!;
    return 1;
  };
  const api = {
    keys,
    hold(until: number) {
      if (until > lastF()) keys.push({ f: until });
      return api;
    },
    to(at: number, pose: PoseIn, dur = 18, ease: (t: number) => number = EASE.cam) {
      const a = Math.max(at, lastF());
      api.hold(a);
      keys.push({ f: a + Math.max(1, dur), ...pose, ease });
      return api;
    },
    /** zoom drift by `amount` (0.04 = +4%) from the last key until `until`, optionally drifting the focal too */
    push(until: number, amount = 0.04, pose: { x?: number; y?: number } = {}) {
      if (until > lastF()) keys.push({ f: until, ...pose, zoom: zoomNow() * (1 + amount), ease: EASE.drift });
      return api;
    },
    cut(at: number, pose: PoseIn) {
      const a = Math.max(at, lastF() + 1);
      api.hold(a - 1);
      keys.push({ f: a, ...pose, ease: (t) => (t >= 1 ? 1 : 0) });
      return api;
    },
  };
  return api;
};

// --------------------------------------------------------------------- React
type CamCtxValue = { pose: CamPose; anchor: Pt; toScreen: (w: Pt) => Pt; toWorld: (s: Pt) => Pt };
const CamCtx = createContext<CamCtxValue | null>(null);
/** inside a <Camera>: the current pose and world/screen converters (null-safe identity outside a camera) */
export const useCamera = (): CamCtxValue => {
  const c = useContext(CamCtx);
  if (c) return c;
  const anchor = boxCentre(CAM_BOX.body);
  const pose = { x: anchor.x, y: anchor.y, zoom: 1, rot: 0 };
  return { pose, anchor, toScreen: (w) => w, toWorld: (s) => s };
};

export type CameraProps = CamSpec & {
  children: React.ReactNode;
  /** frame box: "body" (safe box) or "hook" (under the overlay band); sets the anchor to its centre */
  box?: "body" | "hook" | Box;
  /** paper + grid drawn under the world (default on, 0.15 parallax); false when the beat draws its own ground */
  ground?: CamGround | false;
  /** screen-space layer above the world (captions, the hook band, anything that must not zoom) */
  hud?: React.ReactNode;
  /** camera-only motion blur on fast moves (default on); false = never */
  blur?: CamBlur | false;
  /** dev: outline the safe box and the anchor */
  showSafe?: boolean;
};

/** The camera rig. See the file header for the conventions. */
export const Camera: React.FC<CameraProps> = ({ children, keys, follow, anchor: anchorIn, breathe, box = "body", ground = {}, hud, blur = {}, showSafe }) => {
  const f = useCurrentFrame();
  const b = typeof box === "string" ? CAM_BOX[box] : box;
  const anchor = anchorIn ?? boxCentre(b);
  const spec: CamSpec = { keys, follow, anchor, breathe };
  const pose = camAt(spec, f);
  const pad = useContext(PadCtx);
  const padO = boxCentre(CAM_BOX.body);

  // camera-only motion blur: sample the camera inside one shutter centred on f
  let offsets = [0];
  const sampleContent = blur ? blur.content !== false : false;
  if (blur) {
    const shutter = blur.shutter ?? 0.5;
    const v = camSpeed(spec, f);
    // adaptive sample count: copies at most ~5 px apart, so a fast move smears instead of ghosting
    const n = Math.min(Math.max(1, Math.round(blur.samples ?? 10)), Math.max(3, Math.ceil((v * shutter) / 5) + 1));
    // above ~150 px/frame it is a cut, not a move: never smear across a cut
    if (n > 1 && v > (blur.threshold ?? 5) && v < 150) offsets = Array.from({ length: n }, (_, i) => shutter * (i / (n - 1) - 0.5));
  }

  const ctx: CamCtxValue = { pose, anchor, toScreen: (w) => toScreen(pose, anchor, w), toWorld: (s) => toWorld(pose, anchor, s) };
  const par = ground ? (ground.parallax ?? 0.15) : 0;
  const gx = -(pose.x - anchor.x) * pose.zoom * par;
  const gy = -(pose.y - anchor.y) * pose.zoom * par;

  return (
    <CamCtx.Provider value={ctx}>
      <AbsoluteFill>
        {ground ? (
          <AbsoluteFill>
            <Ground grid={false} dark={ground.dark} swoosh={ground.swoosh} swooshDrift={(ground.swooshDrift ?? 0) + gx * 0.5} />
            {ground.grid !== false ? <Grid opacity={ground.gridOpacity ?? 1} offsetX={gx} offsetY={gy} /> : null}
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill style={pad === 1 ? undefined : { transformOrigin: `${padO.x}px ${padO.y}px`, transform: `scale(${pad})` }}>
        {offsets.length === 1 ? (
          <AbsoluteFill style={{ transformOrigin: "0 0", transform: camTransform(pose, anchor) }}>{children}</AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ isolation: "isolate" }}>
            {offsets.map((o, i) => (
              <AbsoluteFill
                key={i}
                style={{
                  transformOrigin: "0 0",
                  transform: camTransform(camAt(spec, f + o), anchor),
                  mixBlendMode: "plus-lighter",
                  filter: `opacity(${(1 / offsets.length).toFixed(4)})`,
                }}
              >
                {sampleContent && o !== 0 ? <Freeze frame={f + o}>{children}</Freeze> : children}
              </AbsoluteFill>
            ))}
          </AbsoluteFill>
        )}
        {hud ? <AbsoluteFill style={{ pointerEvents: "none" }}>{hud}</AbsoluteFill> : null}
        </AbsoluteFill>
        {showSafe ? (
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: b.x0, top: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0, outline: "2px dashed rgba(220,0,0,.6)" }} />
            <div style={{ position: "absolute", left: anchor.x - 6, top: anchor.y - 6, width: 12, height: 12, borderRadius: 6, background: "rgba(220,0,0,.6)" }} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </CamCtx.Provider>
  );
};

/**
 * Slow push-in for a beat that has no keyed camera yet: 1.00 -> 1 + amount over [from, to] about a world point.
 * Returns a transform string for a wrapper div (origin 0 0); prefer <Camera> with `.push()` for new work.
 */
export const pushIn = (f: number, from: number, to: number, amount = 0.05, at: Pt = boxCentre(CAM_BOX.body)) => {
  const z = 1 + amount * prog(f, from, to, EASE.drift);
  return `translate(${at.x}px,${at.y}px) scale(${z.toFixed(5)}) translate(${-at.x}px,${-at.y}px)`;
};
