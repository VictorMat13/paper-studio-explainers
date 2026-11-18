// ep08 shared word chip (owner BA; BB and BC import it from here, never copy it): the white button chip holding one
// black Inter 800 lowercase word (commit, push, clone, branch, merge, tag, v1). Same physical button as the kit's
// LogoChip (white body, a thick rim about 11% of the height, a faint inner highlight, a soft shadow down-right), as a
// pill. Pops in with no overshoot (scale 0.6 -> 1 over 12 frames, in-out) and the word lands like a caption word (grey to black).
//
//   <WordChip x={540} y={600} word="commit" at={wordFrame} />          // x, y = the chip's centre (world or hud px)
//   <WordChip x={540} y={600} word="push" size={72} dark />            // dark = black face, white word (a "done" state)
//
// Width comes from the word (Inter 800 at `size`), so a chip never clips its word; `minW` keeps a row even.
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { INTER, mix, mixColor, prog, theme } from "../../../paperstudio";

/** SMOOTHNESS: the in-out curve (zero velocity at both ends, no overshoot) */
const SMOOTH = Easing.bezier(0.4, 0, 0.2, 1);

/** approximate Inter 800 advance per character, as a fraction of the font size (lowercase, -2% tracking) */
const ADV: Record<string, number> = {
  a: 0.6, b: 0.63, c: 0.57, d: 0.63, e: 0.6, f: 0.38, g: 0.63, h: 0.62, i: 0.28, j: 0.28, k: 0.58, l: 0.28, m: 0.92,
  n: 0.62, o: 0.62, p: 0.63, q: 0.63, r: 0.41, s: 0.55, t: 0.39, u: 0.62, v: 0.58, w: 0.84, x: 0.58, y: 0.58, z: 0.53,
  "1": 0.52, " ": 0.26,
};
/** chip geometry for a word at a font size (exported so callers can lay rows out) */
export const wordChipSize = (word: string, size = 60) => {
  const tw = word.split("").reduce((a, c) => a + (ADV[c.toLowerCase()] ?? 0.62), 0) * size;
  const h = Math.round(size * 1.72);
  const padX = Math.round(size * 0.78);
  return { w: Math.round(tw + 2 * padX), h, padX };
};

export type WordChipProps = {
  /** centre, px in whatever layer it sits in */
  x: number;
  y: number;
  word: string;
  /** word font size (default 60) */
  size?: number;
  /** frame it pops in (undefined = already there) */
  at?: number;
  /** pop duration (default 9) */
  dur?: number;
  /** black face, white word */
  dark?: boolean;
  /** 0..1 cross-fade from white to the dark face (overrides `dark` while animating) */
  darken?: number;
  /** minimum width (to keep a row of chips even) */
  minW?: number;
  /** extra rotation, deg */
  rot?: number;
  /** extra scale (1 = rest) */
  scale?: number;
  opacity?: number;
};

export const WordChip: React.FC<WordChipProps> = ({ x, y, word, size = 60, at, dur = 12, dark, darken, minW = 0, rot = 0, scale = 1, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + dur, SMOOTH);
  if (p <= 0.001 || opacity <= 0.001) return null;
  const ink = at === undefined ? 1 : prog(f, at + 1, at + 1 + theme.caption.settle, SMOOTH);
  const g = wordChipSize(word, size);
  const w = Math.max(minW, g.w);
  const h = g.h;
  const rim = Math.max(4, Math.round(h * 0.11));
  const dk = darken ?? (dark ? 1 : 0);
  const face = mixColor("#FFFFFF", "#151515", dk);
  const text = dk > 0.5 ? mixColor(theme.color.ghost, "#FFFFFF", ink) : mixColor(theme.color.ghost, theme.color.ink, ink);
  const s = mix(0.6, 1, p) * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})`,
        opacity: Math.min(1, p * 1.6) * opacity,
        willChange: "transform",
      }}
    >
      {/* the button body: white rim with its soft shadow down-right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: h / 2,
          background: "#FFFFFF",
          boxShadow: `0 0 0 1px rgba(0,0,0,.05),${Math.round(h * 0.11)}px ${Math.round(h * 0.16)}px ${Math.round(h * 0.3)}px rgba(0,0,0,.20),${Math.round(h * 0.03)}px ${Math.round(
            h * 0.04,
          )}px ${Math.round(h * 0.06)}px rgba(0,0,0,.10),inset 0 2px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.05)`,
        }}
      />
      {/* the inner face */}
      <div
        style={{
          position: "absolute",
          inset: rim,
          borderRadius: (h - 2 * rim) / 2,
          background: face,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,.10),inset 0 -2px 2px rgba(255,255,255,.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: -size * 0.02,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: text,
        }}
      >
        <span style={{ display: "inline-block", transform: `translateY(${(theme.caption.rise * 0.6 * (1 - ink)).toFixed(2)}px)` }}>{word}</span>
      </div>
    </div>
  );
};
