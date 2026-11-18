// ===========================================================================
// HA smooth-motion helpers (builder HA, ep08, SMOOTHNESS 2026-11-07): every animated value here eases in and out
// (the kit's cubic in-out EASE.travel), starts and ends at zero velocity, and never runs under the directive's
// minimums (pops 12 frames, entrances 14). Local re-draws of three kit pieces whose built-in pops start at full speed
// (LogoChip 9 frames, WireNode 8, ChatBubble's ease-out): same looks, smooth timing.
// ===========================================================================
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, LogoChip, WireNode, mix, prog, theme } from "../../../paperstudio";

/** eased in-out progress of f over [a, b] (zero velocity at both ends) */
export const io = (f: number, a: number, b: number) => prog(f, a, b, EASE.travel);

/** a smooth one-off bump 0 -> 1 -> 0 over [at, at + dur] with zero velocity at both ends (settles, flutters, bobs) */
export const bump = (f: number, at: number, dur: number) => {
  if (f <= at || f >= at + dur) return 0;
  return 0.5 * (1 - Math.cos((2 * Math.PI * (f - at)) / dur));
};

/** pop: scale 0.6 -> 1 and opacity over 12 frames, eased in-out (no overshoot) */
export const popState = (f: number, at: number, dur = 12) => {
  const p = io(f, at, at + dur);
  return { p, s: mix(0.6, 1, p), o: Math.min(1, p * 2.2) };
};

/** the kit LogoChip (drawn at rest) with a smooth 12-frame pop about its centre */
export const PopChip: React.FC<{ cx: number; cy: number; name: string; src?: string; r: number; at: number }> = ({ cx, cy, name, src, r, at }) => {
  const f = useCurrentFrame();
  const st = popState(f, at);
  if (st.p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cx}px ${cy}px`, transform: st.p < 1 ? `scale(${st.s.toFixed(4)})` : undefined, opacity: st.o }}>
      <LogoChip cx={cx} cy={cy} name={name} src={src} r={r} label={false} />
    </div>
  );
};

/** the kit WireNode (drawn at rest) with a smooth 12-frame pop */
export const PopNode: React.FC<{ cx: number; cy: number; at: number }> = ({ cx, cy, at }) => {
  const f = useCurrentFrame();
  const st = popState(f, at);
  if (st.p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cx}px ${cy}px`, transform: st.p < 1 ? `scale(${st.s.toFixed(4)})` : undefined, opacity: st.o }}>
      <WireNode cx={cx} cy={cy} />
    </div>
  );
};

/** bubble height for a font size (the kit's ChatBubble geometry) */
export const bubbleH = (fs: number) => fs * 1.2 + fs * 0.62 * 2;

const Tail: React.FC<{ side: "left" | "right"; s: number }> = ({ side, s }) => (
  <svg width={s} height={s} viewBox="0 0 40 40" style={{ position: "absolute", bottom: -s * 0.42, [side]: -s * 0.38, transform: side === "right" ? "scaleX(-1)" : undefined }} aria-hidden>
    <path d="M40 0 C 34 18, 22 30, 0 36 C 18 36, 32 30, 40 22 Z" fill={theme.color.ink} />
  </svg>
);

/**
 * The kit's black chat bubble (white Inter 700, tail at a bottom corner), popping out of a source point along a
 * short arc over `dur` frames, eased in and out: scale 0.6 -> 1 from its tail corner, then a slow sine drift.
 */
export const Bubble: React.FC<{
  text: string;
  x: number;
  y: number;
  ox: number;
  oy: number;
  at: number;
  dur?: number;
  arc?: number;
  tail?: "left" | "right";
  fs?: number;
  seed?: number;
  /** the bubble shrinks back toward its tail and fades over 8 frames from here (eased) */
  exitAt?: number;
}> = ({
  text,
  x,
  y,
  ox,
  oy,
  at,
  dur = 14,
  arc = 50,
  tail = "left",
  fs = 40,
  seed = 0,
  exitAt,
}) => {
  const f = useCurrentFrame();
  const p = io(f, at, at + dur);
  const q = exitAt === undefined ? 0 : io(f, exitAt, exitAt + 8);
  if (p <= 0 || q >= 1) return null;
  const h = bubbleH(fs);
  const sx = ox - x;
  const sy = oy - (y + h);
  const lift = arc * Math.sin(Math.PI * p);
  const cx = mix(sx, 0, p) - lift * 0.35;
  const cy = mix(sy, 0, p) - lift;
  const dx = 1.6 * Math.sin(((f + seed * 31) / 92) * Math.PI * 2);
  const dy = 1.2 * Math.cos(((f + seed * 47) / 118) * Math.PI * 2);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${(cx + dx).toFixed(2)}px,${(cy + dy).toFixed(2)}px) scale(${(mix(0.6, 1, p) * mix(1, 0.6, q)).toFixed(4)})`,
        transformOrigin: tail === "left" ? "0% 100%" : "100% 100%",
        opacity: Math.min(1, p * 2.2) * (1 - q),
        filter: "drop-shadow(8px 14px 14px rgba(0,0,0,.20)) drop-shadow(2px 4px 3px rgba(0,0,0,.12))",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "relative",
          height: h,
          display: "inline-flex",
          alignItems: "center",
          padding: `0 ${(fs * 0.72).toFixed(1)}px`,
          background: theme.color.ink,
          color: "#fff",
          borderRadius: h * 0.42,
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: fs,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
        }}
      >
        <Tail side={tail} s={fs * 0.9} />
        <span style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
};
