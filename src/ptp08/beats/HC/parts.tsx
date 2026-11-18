// ===========================================================================
// HC parts (local to HC): the stage layout, the robot-at-a-laptop unit, the typing bubble that turns into a word, the
// two-faced word chip (BA's shared WordChip on the front, the same button with a solid icon on the back), the git-log
// spine, the paper sheets the scene stands on and a parallax layer. World px (before the shell's 0.9 pad); the hook
// box is world y 446-1293, and with one-line captions the world composition lives in y 446-1150.
// STYLE UPLIFT (2026-11-07): bigger robots and chips, a kraft sheet stage with a white sheet behind it (parallax 0.75),
// the middle unit standing a step back (parallax 0.9), robots blink, laptop screens show a blinking caret, wires draw
// with a travelling ink puck, sheets settle a little when something lands near them.
// SMOOTHNESS (2026-11-07): every pop is a 12-14 frame cubic in-out (scale 0.6 -> 1, no overshoot, opacity eased),
// the chip flip is one continuous 18-frame turn (no skipped angles), the caret and the blink are smooth pulses, the
// wire's puck fades in and out, no rounding on animated transforms.
// ===========================================================================
import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { INTER, LogoDisc, ScreenInset, WirePath, mix, mixColor, prog, theme, useCamera } from "../../../paperstudio";
import { WordChip, wordChipSize } from "../Shared/wordChip";
import { HC_LOGO, HC_PHOTO, LAPTOP_AR, ROBOT_AR } from "./assets";
import { SolidIcon, type IconKind } from "./icons";
import { IO } from "./hook";

// ------------------------------------------------------------------ layout (world px, on an 8 px grid where it matters)
/** HC1-HC2: the ground wire the three units stand on, and the upper wire the words land on */
export const GROUND = { y: 1128, x0: 24, x1: 1056 } as const;
export const UPPER = { y: 520, x0: 56, x1: 1024 } as const;
/** unit centres (laptop + robot) and the word slots on the upper wire */
export const UNIT_CX = [210, 520, 830] as const;
export const SLOT_X = [254, 547, 832] as const;
/** the laptop (in the unit, behind the robot) and the robot: box x = cx + dx, standing on the unit's ground */
export const LAP = { w: 256, h: 256 / LAPTOP_AR, dx: -188 } as const;
export const BOT = { h: 384, w: 384 * ROBOT_AR, dx: -56 } as const;
/** the middle unit stands a step back: scaled 0.9 about its foot, 28 px further up the paper */
export const UNIT_DEPTH = [
  { s: 1, dy: 0 },
  { s: 0.9, dy: -28 },
  { s: 1, dy: 0 },
] as const;
/** a point of unit i's local drawing (its own ground at GROUND.y) in world px, after its depth transform */
export const unitPt = (i: number, x: number, y: number) => {
  const cx = UNIT_CX[i];
  const d = UNIT_DEPTH[i];
  return { x: cx + (x - cx) * d.s, y: GROUND.y + d.dy + (y - GROUND.y) * d.s };
};
/** the robot's head top (where its bubble's tail points), world px */
export const headTop = (i: number) => unitPt(i, UNIT_CX[i] + BOT.dx + 0.56 * BOT.w, GROUND.y - BOT.h + 6);
/** bubbles: tail side per unit (the right unit's tail is on the right so its bubble stays inside the frame) */
export const BUBBLE_SIDE = ["left", "left", "right"] as const;
export const BUBBLE_FS = 44;

/** HC3-HC4: the column of big word chips on a git-log spine */
export const WORDS = ["commit", "push", "branch"] as const;
export const ICONS: IconKind[] = ["camera", "push", "branch"];
export const COL = { x: 272, w: 616, cx: 580, ys: [560, 776, 992], size: 104, spineX: 200, spineY0: 472, spineY1: 1080 } as const;
/** the chips' scale on the upper wire (60 px type; the column is 104 px) */
export const SLOT_SCALE = 0.58;
/** the column's bounds (spine to chip right edge), for the hand-off flip */
export const COL_RECT = { x: COL.spineX - 24, y: COL.ys[0] - 96, w: COL.x + COL.w - (COL.spineX - 24), h: COL.ys[2] + 96 - (COL.ys[0] - 96) };

/** the paper sheets the scene stands on: the stage behind the robots (HC1-HC2) and the page under the column (HC3-HC4) */
export type SheetPose = { x: number; y: number; w: number; h: number; rot: number };
export const SHEET_STAGE: SheetPose = { x: 96, y: 640, w: 888, h: 456, rot: -2 };
export const SHEET_COL: SheetPose = { x: 128, y: 448, w: 824, h: 664, rot: 1.5 };
export const mixPose = (a: SheetPose, b: SheetPose, t: number): SheetPose => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t), rot: mix(a.rot, b.rot, t) });

// ------------------------------------------------------------------ parallax layer
/** a layer that moves at `d` of the camera (1 = the world, 0.75 = the background): it follows the camera's pan by
 *  (1 - d) and zooms less. Identity when the camera is at identity (so the hand-off frames are untouched). */
export const Depth: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const { pose, anchor } = useCamera();
  const k = 1 - d;
  const tx = k * (pose.x - anchor.x);
  const ty = k * (pose.y - anchor.y);
  const s = Math.pow(pose.zoom, -k);
  if (Math.abs(tx) < 0.01 && Math.abs(ty) < 0.01 && Math.abs(s - 1) < 1e-5) return <AbsoluteFill>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{ transformOrigin: `${pose.x}px ${pose.y}px`, transform: `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.toFixed(5)})` }}>{children}</AbsoluteFill>;
};

// ------------------------------------------------------------------ paper sheets
const KRAFT = "#DCC7A2";
/** a paper sheet with a hard thickness edge, the card shadow, a faint fibre texture and a soft inner edge */
export const Sheet: React.FC<{ p: SheetPose; kraft?: boolean; dy?: number; seed?: number; opacity?: number }> = ({ p, kraft, dy = 0, seed = 3, opacity = 1 }) => {
  const id = `hcsheet${seed}${kraft ? "k" : "w"}`;
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y + dy,
        width: p.w,
        height: p.h,
        transform: `rotate(${p.rot.toFixed(3)}deg)`,
        borderRadius: theme.radius.card,
        background: kraft ? KRAFT : theme.color.sheet,
        boxShadow: kraft
          ? "3px 3px 0 #C4AC84,5px 5px 0 #B59D76,18px 28px 50px rgba(0,0,0,.18),48px 70px 120px rgba(0,0,0,.10)"
          : theme.shadow.card,
        overflow: "hidden",
        opacity,
      }}
    >
      <svg width={p.w} height={p.h} style={{ position: "absolute", inset: 0 }} aria-hidden>
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.16  0 0 0 0.55 0" />
        </filter>
        <rect width={p.w} height={p.h} filter={`url(#${id})`} opacity={kraft ? 0.32 : 0.12} />
      </svg>
      {/* soft inner edge and the top-left light */}
      <div style={{ position: "absolute", inset: 0, borderRadius: theme.radius.card, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.35), inset 0 -10px 24px rgba(0,0,0,.05)", background: "linear-gradient(135deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 50%)" }} />
    </div>
  );
};

// ------------------------------------------------------------------ the unit: a laptop with a Claude chip on its screen, a robot beside it
const CUTOUT = "drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(7px 9px 5px rgba(0,0,0,.16)) drop-shadow(20px 30px 20px rgba(0,0,0,.18))";

export const Laptop: React.FC<{ cx: number; chip: number; pulse?: number; f: number; seed: number }> = ({ cx, chip, pulse = 0, f, seed }) => {
  // a soft caret pulse (never a hard on/off toggle)
  const caret = 0.5 + 0.45 * Math.cos(((f + seed * 9) / 32) * Math.PI * 2);
  return (
    <ScreenInset x={cx + LAP.dx} y={GROUND.y - LAP.h} w={LAP.w} h={LAP.h} src={HC_PHOTO.laptop} contentW={1600} contentH={1000} screenBg="#111215" sheenStrength={0.1}>
      {chip > 0.001 ? (
        <div style={{ position: "absolute", left: 800 - 270, top: 430 - 270, width: 540, height: 540, transform: `scale(${(mix(0.6, 1, chip) * (1 + 0.12 * pulse)).toFixed(5)})`, opacity: chip }}>
          <LogoDisc name="Claude" r={270} src={HC_LOGO.claude} />
        </div>
      ) : null}
      {/* a prompt line with a blinking caret under the chip */}
      <div style={{ position: "absolute", left: 470, top: 790, width: 520, height: 26, borderRadius: 13, background: "#3A3B40" }} />
      <div style={{ position: "absolute", left: 1020, top: 760, width: 34, height: 86, background: "#E8E8EA", opacity: caret }} />
    </ScreenInset>
  );
};

/** the robot cut-out with an eyelid blink (b 0..1) drawn over its two eyes in the visor's colour */
export const Robot: React.FC<{ cx: number; rot?: number; dy?: number; blink?: number }> = ({ cx, rot = 0, dy = 0, blink = 0 }) => {
  const k = BOT.w / 1134;
  const lid = (ex: number, ey: number, rx: number, ry: number) => (
    <div
      style={{
        position: "absolute",
        left: (ex - rx) * k,
        top: (ey - ry) * k,
        width: 2 * rx * k,
        height: 2 * ry * k,
        borderRadius: "50%",
        background: "#2C2B2D",
        transformOrigin: "50% 0%",
        transform: `scaleY(${blink.toFixed(3)})`,
      }}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: cx + BOT.dx,
        top: GROUND.y - BOT.h,
        width: BOT.w,
        height: BOT.h,
        transformOrigin: "50% 100%",
        transform: `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`,
        filter: CUTOUT,
      }}
    >
      {HC_PHOTO.robot ? (
        <Img src={HC_PHOTO.robot} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <div style={{ position: "absolute", inset: "8% 10% 0 10%", borderRadius: "40% 40% 30% 30%", background: "#fff" }} />
      )}
      {blink > 0.02 ? (
        <>
          {lid(413, 362, 50, 80)}
          {lid(778, 388, 50, 80)}
        </>
      ) : null}
    </div>
  );
};

/** blink amount (0..1) at frame f for robot `seed`: a smooth 8-frame blink (1 - cos, rest at both ends) every
 *  70-95 frames, each robot on its own phase */
export const blinkAt = (f: number, seed: number) => {
  const period = 70 + ((seed * 17) % 26);
  const t = (((f + seed * 23) % period) + period) % period;
  return t < 8 ? (1 - Math.cos((2 * Math.PI * t) / 8)) / 2 : 0;
};

// ------------------------------------------------------------------ the typing bubble that turns into a word
const Tail: React.FC<{ side: "left" | "right"; s: number }> = ({ side, s }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 40 40"
    style={{ position: "absolute", bottom: -s * 0.42, [side]: -s * 0.38, transform: side === "right" ? "scaleX(-1)" : undefined }}
    aria-hidden
  >
    <path d="M40 0 C 34 18, 22 30, 0 36 C 18 36, 32 30, 40 22 Z" fill={theme.color.ink} />
  </svg>
);

/** bubble geometry for a word at the bubble font size: height, side padding, dots width, word width */
export const bubbleGeom = (word: string, fs = BUBBLE_FS) => {
  const h = Math.round(fs * 1.2 + fs * 0.62 * 2);
  const padX = Math.round(fs * 0.72);
  const cw = wordChipSize(word, fs);
  return { h, padX, dotsW: fs * 1.55, wordW: (cw.w - 2 * cw.padX) * 0.95 };
};

/** where a unit's bubble rests (its box) when it shows `word` (morph 1) or its dots (morph 0) */
export const bubbleRect = (i: number, word: string, morph = 1, fs = BUBBLE_FS) => {
  const g = bubbleGeom(word, fs);
  const w = mix(g.dotsW, g.wordW, morph) + 2 * g.padX;
  const head = headTop(i);
  const side = BUBBLE_SIDE[i];
  const bottom = head.y - 22;
  const x = side === "left" ? head.x - 34 : head.x + 34 - w;
  return { x, y: bottom - g.h, w, h: g.h, side };
};

/**
 * A black chat bubble (the kit's ChatBubble look: white Inter 700, tail at the bottom corner) popping out of the
 * robot's head (scale 0.2 -> 1 from its tail corner, a short rise); it shows three typing dots that pulse until
 * `morph` turns them into the word (the bubble widens, the dots fade, the word inks in). `pop` back to 0 shrinks it
 * back into the head.
 */
export const TalkBubble: React.FC<{ i: number; f: number; word: string; pop: number; fade: number; morph: number; fs?: number }> = ({ i, f, word, pop, fade, morph, fs = BUBBLE_FS }) => {
  if (pop <= 0.001 || fade <= 0.001) return null;
  const g = bubbleGeom(word, fs);
  const r = bubbleRect(i, word, morph, fs);
  const side = r.side;
  const rise = 26 * (1 - pop);
  const dotsO = 1 - prog(morph, 0, 0.5, IO);
  const wordO = prog(morph, 0.35, 1, IO);
  const ink = mixColor("#8A8A8A", "#FFFFFF", wordO);
  const bob = 1.5 * Math.sin(((f + i * 19) / 84) * Math.PI * 2);
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y + rise + bob,
        width: r.w,
        height: g.h,
        transformOrigin: side === "left" ? "0% 100%" : "100% 100%",
        transform: `scale(${mix(0.6, 1, pop).toFixed(5)})`,
        opacity: fade,
        filter: "drop-shadow(8px 14px 14px rgba(0,0,0,.20)) drop-shadow(2px 4px 3px rgba(0,0,0,.12))",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: theme.color.ink, borderRadius: 24, boxShadow: "inset 0 2px 0 rgba(255,255,255,.10)" }}>
        <Tail side={side} s={Math.round(fs * 0.9)} />
        {/* three typing dots, pulsing one after another */}
        {dotsO > 0.001
          ? [0, 1, 2].map((k) => {
              const ph = Math.sin(((f - k * 4) / 18) * Math.PI * 2);
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: r.w / 2 + (k - 1) * fs * 0.48 - fs * 0.13,
                    top: g.h / 2 - fs * 0.13 - 3 * Math.max(0, ph),
                    width: fs * 0.26,
                    height: fs * 0.26,
                    borderRadius: fs * 0.13,
                    background: "#FFFFFF",
                    opacity: dotsO * (0.55 + 0.45 * Math.max(0, ph)),
                  }}
                />
              );
            })
          : null}
        {wordO > 0.001 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: INTER,
              fontWeight: 700,
              fontSize: fs,
              letterSpacing: -0.5,
              whiteSpace: "nowrap",
              color: ink,
              opacity: wordO,
              transform: `translateY(${(5 * (1 - wordO)).toFixed(2)}px)`,
            }}
          >
            {word}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ the two-faced word chip
/** the chip's drawn width at the column size (both faces share it) */
export const chipW = (word: string, minW: number, size: number = COL.size) => Math.max(minW, wordChipSize(word, size).w);

/**
 * BA's shared WordChip (front, drawn at rest) and the same button with a solid icon (back), turning over about its
 * horizontal axis like a split-flap card: `flip` 0..1 is one continuous 0 -> 180 deg turn (front up to 90, then the
 * back), with a gentle lift. `pop` 0..1 grows it 0.6 -> 1 and `fade` is its opacity (both eased by the caller);
 * `squash` (0..1, a bump) flattens it a little as it settles. (cx, cy) is the centre; `scale` scales about it.
 */
export const TwoFaceChip: React.FC<{
  cx: number;
  cy: number;
  word: string;
  icon: IconKind;
  scale: number;
  minW: number;
  pop?: number;
  fade?: number;
  flip?: number;
  squash?: number;
}> = ({ cx, cy, word, icon, scale, minW, pop = 1, fade = 1, flip = 0, squash = 0 }) => {
  if (fade <= 0.001) return null;
  const t = Math.max(0, Math.min(1, flip));
  const ang = 180 * t;
  const back = ang > 90;
  // the chip never goes fully edge-on (a thin slat at most 84 deg): it never vanishes for a frame mid-turn
  const a = back ? Math.max(ang - 180, -84) : Math.min(ang, 84);
  const lift = 1 + 0.04 * Math.sin(Math.PI * t);
  const w = chipW(word, minW);
  const h = wordChipSize(word, COL.size).h;
  const s = scale * mix(0.6, 1, pop);
  const sq = squash > 0.0005 ? ` scale(${(1 + 0.04 * squash).toFixed(5)},${(1 - 0.05 * squash).toFixed(5)})` : "";
  const tf = (t > 0 ? `perspective(1500px) rotateX(${a.toFixed(3)}deg) scale(${lift.toFixed(5)})` : "") + sq;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cx}px ${cy + (h * s) / 2}px`, transform: tf || undefined, opacity: fade, willChange: "transform" }}>
      {back ? (
        <>
          <WordChip x={cx} y={cy} word="" size={COL.size} minW={w} scale={s} />
          <SolidIcon kind={icon} cx={cx} cy={cy} h={h * 0.64 * s} />
        </>
      ) : (
        <WordChip x={cx} y={cy} word={word} size={COL.size} minW={minW} scale={s} />
      )}
    </div>
  );
};

// ------------------------------------------------------------------ wires with a travelling puck
/** a 7 px wire drawing on with a small ink puck riding its tip while it draws (a straight segment a -> b) */
export const DrawWire: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; p: number }> = ({ a, b, p }) => {
  if (p <= 0.001) return null;
  const tip = { x: mix(a.x, b.x, p), y: mix(a.y, b.y, p) };
  // the puck fades and grows in at the start of the draw and out at its end (never pops)
  const po = prog(p, 0, 0.12, IO) * (1 - prog(p, 0.86, 1, IO));
  const puck = po > 0.002;
  return (
    <>
      <WirePath d={`M${a.x} ${a.y} L${b.x} ${b.y}`} p={p} />
      {puck ? (
        <div style={{ position: "absolute", left: tip.x - 11, top: tip.y - 11, width: 22, height: 22, borderRadius: 11, background: theme.color.ink, boxShadow: "5px 8px 7px rgba(0,0,0,.22), inset 2px 2px 2px rgba(255,255,255,.25)", opacity: po, transform: `scale(${mix(0.5, 1, po).toFixed(5)})` }} />
      ) : null}
    </>
  );
};

// ------------------------------------------------------------------ nodes and the git-log spine
/** a hollow wire node (r, ring) that pops with an explicit eased progress `p` (scale 0.6 -> 1, opacity), `fill` 0..1
 *  turns its centre solid ink */
export const Node: React.FC<{ cx: number; cy: number; p: number; r?: number; ring?: number; fill?: number }> = ({ cx, cy, p, r = theme.wire.nodeR, ring = theme.wire.nodeRing, fill = 0 }) => {
  if (p <= 0.001) return null;
  const R = r + ring / 2;
  return (
    <svg width={2 * R + 4} height={2 * R + 4} style={{ position: "absolute", left: cx - R - 2, top: cy - R - 2, overflow: "visible", opacity: p, filter: theme.shadow.wire }}>
      <circle cx={R + 2} cy={R + 2} r={r * mix(0.6, 1, p)} fill={mixColor("#F3F3F3", theme.color.ink, fill)} stroke={theme.color.ink} strokeWidth={ring} />
    </svg>
  );
};

/** the vertical spine (draws top to bottom, p 0..1), a hollow node beside each chip (`node` 0..1 pops) with a stub
 *  into it (`stub` 0..1 draws); `fill` 0..1 per node turns it solid ink (the chip has shown its meaning) */
export const Spine: React.FC<{ p: number; node: number[]; stub: number[]; fill: number[] }> = ({ p, node, stub, fill }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <DrawWire a={{ x: COL.spineX, y: COL.spineY0 }} b={{ x: COL.spineX, y: COL.spineY1 }} p={p} />
    {COL.ys.map((y, i) => (
      <React.Fragment key={i}>
        {stub[i] > 0.001 ? <WirePath d={`M${COL.spineX + 10} ${y} L${COL.x + 40} ${y}`} p={stub[i]} /> : null}
        <Node cx={COL.spineX} cy={y} r={18} ring={7} p={node[i]} fill={fill[i]} />
      </React.Fragment>
    ))}
  </div>
);
