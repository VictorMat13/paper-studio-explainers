// ep08 shared smooth caption (owner BA; SMOOTHNESS, Victor 2026-11-07). The kit KineticCaption's look (Inter, the
// theme caption styles: reg / bi / bold / bar / big / huge, grey settling to ink, a small rise and a blur clearing), with
// two changes that remove the per-frame jumps the jerk scan found:
//   - every line is laid out at its FINAL width from the block's first frame (words not yet spoken hold their slot,
//     invisible), so a line never re-centres or glides while words arrive;
//   - each word eases in with an in-out curve over 12 frames from rest (opacity, 7 px rise, 6 px blur, grey to ink); a
//     black bar wipes open over 12 frames the same way.
// Same props as the kit caption for what BodyA and the CTA use: lines, x / y / w (frame px), scale, lineGap, align,
// exit { at, dur }. Text never moves with left/top: only transforms.
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { INTER, mixColor, theme, type CapStyle, type CapWord } from "../../../paperstudio";

const SM = Easing.bezier(0.4, 0, 0.2, 1);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (f: number, a: number, d: number) => SM(clamp01((f - a) / d));
export const sineEase = (f: number, a: number, d: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01((f - a) / d));
/** frames a word takes to settle */
export const WORD_IN = 12;

const BAR_PAD_X = 18;
const WORD_SPACE = 0.32;

/** the block's settled height (same formula as the kit's captionHeight) */
export const smoothCaptionHeight = (lines: CapWord[][], lineGap = 12, scale = 1) =>
  lines.reduce((a, l) => a + (Math.max(...l.map((wd) => theme.caption[wd.s ?? "reg"].size)) * 1.12 + (l.some((wd) => wd.s === "bar") ? 10 : 0) + lineGap) * scale, 0);

const Word: React.FC<{ word: CapWord; f: number; k: number; first: boolean }> = ({ word, f, k, first }) => {
  const s: CapStyle = word.s ?? "reg";
  const c = theme.caption[s];
  const p = ease(f, word.at, WORD_IN);
  const ink = word.color ?? theme.color.ink;
  const box: React.CSSProperties = {
    display: "inline-block",
    flex: "none",
    whiteSpace: "nowrap",
    marginLeft: first ? 0 : s === "bar" ? 12 * k : c.size * k * WORD_SPACE,
    fontSize: c.size * k,
    fontWeight: c.weight,
    fontStyle: c.italic ? "italic" : "normal",
    letterSpacing: c.ls * k,
    lineHeight: 1.12,
  };
  const inner: React.CSSProperties = {
    display: "inline-block",
    transform: `translateY(${(theme.caption.rise * (1 - p)).toFixed(3)}px)`,
    filter: p < 0.995 ? `blur(${(theme.caption.blur * (1 - p)).toFixed(3)}px)` : undefined,
    opacity: p,
    willChange: "transform",
  };
  if (s === "bar") {
    return (
      <span style={box}>
        <span style={{ ...inner, position: "relative", padding: `${4 * k}px ${BAR_PAD_X * k}px ${6 * k}px` }}>
          <span style={{ position: "absolute", inset: 0, background: mixColor(theme.color.ghost, theme.color.ink, p), borderRadius: 4 * k, transform: `scaleX(${p.toFixed(4)})`, transformOrigin: "left center" }} />
          <span style={{ position: "relative", color: "#fff", clipPath: `inset(-10px ${((1 - p) * 100).toFixed(2)}% -10px -10px)`, display: "inline-block" }}>{word.t}</span>
        </span>
      </span>
    );
  }
  return (
    <span style={box}>
      <span style={{ ...inner, color: mixColor(theme.color.ghost, ink, p) }}>{word.t}</span>
    </span>
  );
};

export const SmoothCaption: React.FC<{
  lines: CapWord[][];
  x?: number;
  y: number;
  w?: number;
  scale?: number;
  lineGap?: number;
  align?: "center" | "left";
  /** fade out (in-out) over `dur` frames from `at` */
  exit?: { at: number; dur?: number };
  opacity?: number;
}> = ({ lines, x = 100, y, w = 880, scale = 1, lineGap = 12, align = "center", exit, opacity = 1 }) => {
  const f = useCurrentFrame();
  const k = scale;
  // the block fades out on a sine in-out (zero velocity at both ends and the lowest peak speed of the in-out curves)
  const out = exit ? 1 - sineEase(f, exit.at, exit.dur ?? 8) : 1;
  if (out * opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: INTER, color: theme.color.ink, opacity: out * opacity }}>
      {lines.map((l, i) => {
        const h = (Math.max(...l.map((wd) => theme.caption[wd.s ?? "reg"].size)) * 1.12 + (l.some((wd) => wd.s === "bar") ? 10 : 0) + lineGap) * k;
        return (
          <div key={i} style={{ height: h, paddingTop: (lineGap / 2) * k, display: "flex", alignItems: "baseline", justifyContent: align === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
            {l.map((wd, j) => (
              <Word key={j} word={wd} f={f} k={k} first={j === 0} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
