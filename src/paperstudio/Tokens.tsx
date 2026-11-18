import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { EASE, H, INTER, mix, prog } from "./theme";
import { Exit, enterState } from "./motion";
import { reveal } from "./kit05";
import { hash01 } from "./kit06";

// ------------------------------------------------------------- one token
/** drawn fallback face: muted gold, inner ring, embossed star (no letters, no marks) */
const DrawnFace: React.FC<{ size: number; edge?: boolean }> = ({ size, edge }) => {
  if (edge) return <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #A57B27 0%, #7E5C1A 70%, #5F4413 100%)" }} />;
  const ring = Math.max(2, size * 0.035);
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 34% 28%, #F7E2A0 0%, #E0B85E 34%, #BF9033 70%, #93691F 100%)" }}>
      <div
        style={{
          position: "absolute",
          inset: "11%",
          borderRadius: "50%",
          border: `${ring}px solid rgba(118,82,20,.55)`,
          boxShadow: `inset ${ring * 0.5}px ${ring * 0.5}px 0 rgba(255,238,190,.45), ${ring * 0.4}px ${ring * 0.4}px 0 rgba(255,238,190,.35)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "29%",
          clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
          background: "linear-gradient(135deg, #F6DC93 0%, #D2A44A 45%, #A47A26 100%)",
        }}
      />
    </div>
  );
};

export type TokenProps = {
  /** token cut-out (face-on); undefined draws the built-in gold token */
  src?: string;
  /** diameter px */
  size: number;
  /** tumble angle in degrees: 0 = face-on, 70 = lying on the paper seen from the front, 90 = edge-on */
  tilt?: number;
  /** in-plane rotation, degrees */
  rot?: number;
  /** coin thickness px at face-on size (default 8% of the size) */
  thick?: number;
  /** brightness variation (1 = as is) */
  shade?: number;
};

/**
 * One gold token drawn in 2D: the face squashed by cos(tilt), with its rim (a darker copy) showing below by
 * thick * sin(tilt). Centre-anchored: place it with left/top = centre and it draws around that point.
 */
export const Token: React.FC<TokenProps> = ({ src, size, tilt = 0, rot = 0, thick, shade = 1 }) => {
  const a = (tilt * Math.PI) / 180;
  const sy = Math.max(0.04, Math.abs(Math.cos(a)));
  const t = (thick ?? size * 0.08) * Math.abs(Math.sin(a));
  const copies = sy * size > t * 1.3 ? 1 : 3;
  const face = (edge: boolean) =>
    src ? (
      <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: edge ? "brightness(.58) saturate(1.1)" : shade !== 1 ? `brightness(${shade.toFixed(3)})` : undefined }} />
    ) : (
      <DrawnFace size={size} edge={edge} />
    );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `rotate(${rot.toFixed(3)}deg)` }}>
      {t > 0.3
        ? Array.from({ length: copies }, (_, k) => (
            <div key={k} style={{ position: "absolute", left: -size / 2, top: -size / 2 + (t * (copies - k)) / copies, width: size, height: size, transform: `scaleY(${sy.toFixed(4)})` }}>
              {face(true)}
            </div>
          ))
        : null}
      <div style={{ position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size, transform: `scaleY(${sy.toFixed(4)})` }}>
        {face(false)}
      </div>
    </div>
  );
};

const COIN_SHADOW = "drop-shadow(6px 9px 5px rgba(0,0,0,.20)) drop-shadow(20px 30px 22px rgba(0,0,0,.13))";
const LIE = 70;

// ------------------------------------------------------------- TokenStack
export type TokenStackProps = {
  /** centre x of the stack and the y of the paper it stands on */
  x: number;
  y: number;
  /** token cut-out (undefined = drawn token) */
  src?: string;
  /** token diameter (default 150) */
  size?: number;
  /** coins in the finished stack (default 12); with `grow` the stack keeps growing off the top edge */
  count?: number;
  grow?: boolean;
  /** frame the first coin lands (undefined = stack already built) and frames between coins (default 2; fractions ok) */
  at?: number;
  rate?: number;
  /** px each coin falls before landing (default 170) and frames it takes (default 7) */
  fall?: number;
  fallDur?: number;
  /** coin thickness px (default 9% of the size) */
  thick?: number;
  /** viewing angle of the lying coins (default 70: seen from above-front; the R2 storyboard's chunkier look is
   * about tilt 56 with thick 0.19 x size) */
  tilt?: number;
  /** per-coin jitter seed */
  seed?: number;
  /** label under the stack ("before", "with graphify"), revealing at `labelAt` */
  label?: string;
  labelAt?: number;
  labelSize?: number;
  exit?: Exit;
  opacity?: number;
};

/**
 * A vertical stack of gold tokens built from one token cut-out: coins drop on one by one (accelerating, no bounce)
 * and settle with a little seeded jitter; with `grow` it keeps rising off the top of the frame.
 */
export const TokenStack: React.FC<TokenStackProps> = ({ x, y, src, size = 150, count = 12, grow = false, at, rate = 2, fall = 170, fallDur = 7, thick, tilt = LIE, seed = 1, label, labelAt, labelSize = 46, exit, opacity = 1 }) => {
  const f = useCurrentFrame();
  const ex = enterState(f, undefined, exit);
  if (ex.o * opacity <= 0.001) return null;
  const th = thick ?? size * 0.09;
  const a = (tilt * Math.PI) / 180;
  const ellH = size * Math.cos(a);
  const step = th * Math.sin(a) * 1.02;
  const n = grow ? Math.ceil((y + size) / step) + 2 : count;
  const shown = at === undefined ? n : Math.max(0, Math.min(n, Math.floor((f - at) / Math.max(0.0001, rate)) + 1));
  const coins: React.ReactNode[] = [];
  for (let i = 0; i < shown; i++) {
    const restY = y - ellH / 2 - th * Math.sin(a) - i * step;
    if (restY < -size) continue;
    const t0 = at === undefined ? -1e9 : at + i * rate;
    const q = prog(f, t0, t0 + fallDur, EASE.exit);
    const cy = restY - fall * (1 - q);
    const jx = (hash01(seed, i) - 0.5) * size * 0.05;
    const r = (hash01(seed, i, 1) - 0.5) * 4;
    const o = Math.min(1, prog(f, t0, t0 + 2, EASE.linear) + (at === undefined ? 1 : 0));
    coins.push(
      <div key={i} style={{ position: "absolute", left: x + jx, top: cy, opacity: o }}>
        <Token src={src} size={size} tilt={tilt} rot={r} thick={th} shade={0.94 + hash01(seed, i, 2) * 0.12} />
      </div>,
    );
  }
  const lp = label ? reveal(f, labelAt ?? (at ?? 0), {}) : null;
  return (
    <AbsoluteFill style={{ opacity: ex.o * opacity, transform: ex.transform }}>
      {/* contact shadow on the paper, falling down-right */}
      {shown > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - size * 0.62 + 14,
            top: y - size * 0.1 + 6,
            width: size * 1.3,
            height: size * 0.34,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.26) 0%, rgba(0,0,0,.10) 50%, rgba(0,0,0,0) 72%)",
          }}
        />
      ) : null}
      <AbsoluteFill style={{ filter: COIN_SHADOW }}>{coins}</AbsoluteFill>
      {label && lp ? (
        <div style={{ position: "absolute", left: x - 300, width: 600, top: y + 28, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: labelSize, letterSpacing: -0.5, ...lp.style }}>{label}</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- TokenSpill
export type TokenSpillProps = {
  /** source point coins come out of (e.g. a meter's bottom edge) and the width they spread along it */
  ox: number;
  oy: number;
  ow?: number;
  /** total coins, first launch frame and frames between launches (default 1.5; fractions ok) */
  count?: number;
  at: number;
  rate?: number;
  /** "pile": coins land on a heap at `pile`; "drain": coins tumble down and off the bottom of the frame */
  mode?: "pile" | "drain";
  /** heap: centre x, floor y, base width, height */
  pile?: { x: number; y: number; w: number; h: number };
  /** pile flight time range in frames (default [12, 20]) */
  flight?: [number, number];
  /** drain launch direction (deg, 90 = straight down), spread and speed range px/frame */
  dir?: number;
  spread?: number;
  speed?: [number, number];
  /** gravity px/frame^2 (default 1.6) */
  gravity?: number;
  /** token cut-out (undefined = drawn), diameter (default 96) */
  src?: string;
  size?: number;
  seed?: number;
  /** the heap shrinks away, top coins first */
  shrink?: { at: number; dur?: number; stagger?: number };
  exit?: Exit;
  opacity?: number;
};

/**
 * Coins tumbling out of a source point along ballistic arcs: in "pile" mode each one is aimed at its own slot in a
 * heap and lands lying flat (later coins on top); in "drain" mode they pour down and leave the frame. Deterministic
 * per seed. Put it behind the source card in z so the coins come out from under its edge.
 */
export const TokenSpill: React.FC<TokenSpillProps> = ({
  ox,
  oy,
  ow = 0,
  count = 24,
  at,
  rate = 1.5,
  mode = "pile",
  pile,
  flight = [12, 20],
  dir = 90,
  spread = 50,
  speed = [5, 12],
  gravity = 1.6,
  src,
  size = 96,
  seed = 1,
  shrink,
  exit,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const ex = enterState(f, undefined, exit);
  if (ex.o * opacity <= 0.001) return null;
  const g = gravity;
  const heap = pile ?? { x: ox, y: oy + 420, w: size * 5, h: size * 1.2 };
  const coins: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = at + i * rate;
    const tau = f - t0;
    if (tau < 0) continue;
    const sx = ox + (hash01(seed, i, 3) - 0.5) * ow;
    const sy = oy;
    let cx: number;
    let cy: number;
    let tilt: number;
    let rot: number;
    let s = mix(0.55, 1, prog(f, t0, t0 + 4, EASE.enter));
    if (mode === "pile") {
      const u = hash01(seed, i, 4) + hash01(seed, i, 5) - 1;
      const layer = i / Math.max(1, count - 1);
      const tx = heap.x + u * heap.w * 0.5;
      const ty = heap.y - Math.pow(1 - Math.abs(u), 0.8) * heap.h * (0.2 + 0.8 * layer) - hash01(seed, i, 6) * size * 0.08;
      const T = mix(flight[0], flight[1], hash01(seed, i, 7));
      const vx = (tx - sx) / T;
      const vy = (ty - sy - 0.5 * g * T * T) / T;
      const tt = Math.min(tau, T);
      cx = sx + vx * tt;
      cy = sy + vy * tt + 0.5 * g * tt * tt;
      const spin = (14 + hash01(seed, i, 8) * 14) * (hash01(seed, i, 9) < 0.5 ? -1 : 1);
      tilt = LIE + spin * (tt - T);
      const restRot = (hash01(seed, i, 10) - 0.5) * 28;
      rot = restRot + (hash01(seed, i, 11) - 0.5) * 12 * (tt - T);
      if (shrink) {
        const ts = shrink.at + (count - 1 - i) * (shrink.stagger ?? 0.6);
        s *= 1 - prog(f, ts, ts + (shrink.dur ?? 10), EASE.exit);
      }
    } else {
      const ang = ((dir + (hash01(seed, i, 4) - 0.5) * spread) * Math.PI) / 180;
      const v = mix(speed[0], speed[1], hash01(seed, i, 5));
      cx = sx + Math.cos(ang) * v * tau;
      cy = sy + Math.sin(ang) * v * tau + 0.5 * g * tau * tau;
      if (cy > H + size) continue;
      const spin = (16 + hash01(seed, i, 8) * 16) * (hash01(seed, i, 9) < 0.5 ? -1 : 1);
      tilt = 20 + hash01(seed, i, 6) * 40 + spin * tau;
      rot = (hash01(seed, i, 10) - 0.5) * 40 + (hash01(seed, i, 11) - 0.5) * 10 * tau;
    }
    if (s <= 0.01) continue;
    coins.push(
      <div key={i} style={{ position: "absolute", left: cx, top: cy, transform: `scale(${s.toFixed(4)})` }}>
        <Token src={src} size={size} tilt={tilt} rot={rot} shade={0.94 + hash01(seed, i, 2) * 0.12} />
      </div>,
    );
  }
  return <AbsoluteFill style={{ filter: COIN_SHADOW, opacity: ex.o * opacity, transform: ex.transform }}>{coins}</AbsoluteFill>;
};

/** convenience: a still heap of tokens (pile mode, already landed) */
export const TokenHeap: React.FC<Omit<TokenSpillProps, "at" | "mode" | "ox" | "oy"> & { pile: { x: number; y: number; w: number; h: number } }> = (p) => (
  <TokenSpill {...p} ox={p.pile.x} oy={p.pile.y - 300} at={-1000} rate={0} mode="pile" />
);

