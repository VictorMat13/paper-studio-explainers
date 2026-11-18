import React from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { EASE, INTER, fontsReady, mixColor, prog, theme } from "./theme";
import { Exit, enterState } from "./motion";

export type CapStyle = "reg" | "bi" | "bold" | "big" | "huge" | "bar";

export type CapWord = {
  /** the word or phrase (a phrase in one token stays on one line); or a node such as <InlineChip/> */
  t: React.ReactNode;
  /** reg 40 / bi bold italic 64 / bold 56 / big 96 / huge 128 / bar (white on a black bar that wipes in) 44 */
  s?: CapStyle;
  /** frame the word starts entering (relative to the Sequence) */
  at: number;
  /** width in px for a non-text token at scale 1 (e.g. an inline chip: 2 * r) */
  w?: number;
  /** override the settled colour */
  color?: string;
};

// ------------------------------------------------------------ measuring
const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;
const fontFor = (s: CapStyle) => {
  const c = theme.caption[s];
  return { css: `${c.italic ? "italic " : ""}${c.weight} ${c.size}px "${INTER}"`, ls: c.ls, size: c.size };
};
/** text width at scale 1 */
const measure = (text: string, s: CapStyle) => {
  const key = `${s}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  const fnt = fontFor(s);
  let wpx = text.length * fnt.size * 0.55;
  if (ctx) {
    ctx.font = fnt.css;
    ctx.letterSpacing = `${fnt.ls}px`;
    wpx = ctx.measureText(text).width;
  }
  cache.set(key, wpx);
  return wpx;
};

/** re-render once the kit fonts are in so measurements use the real metrics */
let fontsDone = false;
const useFontsReady = () => {
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    if (fontsDone) return;
    const h = delayRender("paperstudio fonts");
    fontsReady
      .then(() => document.fonts.ready)
      .then(() => {
        fontsDone = true;
        cache.clear();
        bump((n) => n + 1);
        continueRender(h);
      })
      .catch(() => continueRender(h));
  }, []);
};

const styleOf = (s: CapStyle, k: number): React.CSSProperties => {
  const c = theme.caption[s];
  return { fontSize: c.size * k, fontWeight: c.weight, fontStyle: c.italic ? "italic" : "normal", letterSpacing: c.ls * k };
};

const BAR_PAD_X = 18;
/** word space for text tokens, in em (one space before every word but the first) */
const WORD_SPACE = 0.32;

type Laid = { word: CapWord; s: CapStyle; isText: boolean; boxW: number; lead: number; slot: number };

const layLine = (l: CapWord[], gap: number, k: number): Laid[] =>
  l.map((word, j) => {
    const s = word.s ?? "reg";
    const isText = typeof word.t === "string";
    const textW = isText ? measure(word.t as string, s) * k : (word.w ?? 64) * k;
    const boxW = s === "bar" ? textW + BAR_PAD_X * 2 * k : textW;
    const lead = j === 0 ? 0 : isText && s !== "bar" ? theme.caption[s].size * k * WORD_SPACE : gap * k;
    return { word, s, isText, boxW, lead, slot: boxW + lead };
  });

const Word: React.FC<{ L: Laid; f: number; settle: number; blur: number; rise: number; k: number }> = ({ L, f, settle, blur, rise, k }) => {
  const { word, s, isText, boxW, lead } = L;
  // one soft ease-out over `settle` frames: grey -> black, `rise` px low -> home, `blur` px -> sharp
  const p = prog(f, word.at, word.at + settle, EASE.soft);
  const o = prog(f, word.at, word.at + Math.max(4, Math.round(settle * 0.6)), EASE.soft);
  const ink = word.color ?? theme.color.ink;
  const inner: React.CSSProperties = {
    display: "inline-block",
    whiteSpace: "nowrap",
    transform: `translateY(${(rise * (1 - p)).toFixed(2)}px)`,
    filter: p < 0.995 ? `blur(${(blur * (1 - p)).toFixed(2)}px)` : undefined,
    opacity: o,
  };
  let content: React.ReactNode;
  if (s === "bar") {
    const b = prog(f, word.at, word.at + 10, EASE.travel);
    content = (
      <span style={{ ...inner, position: "relative", padding: `${4 * k}px ${BAR_PAD_X * k}px ${6 * k}px`, lineHeight: 1.12 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: mixColor(theme.color.ghost, theme.color.ink, Math.min(1, p * 1.4)),
            borderRadius: 4 * k,
            transform: `scaleX(${b.toFixed(4)})`,
            transformOrigin: "left center",
          }}
        />
        <span style={{ position: "relative", color: "#fff", clipPath: `inset(-10px ${((1 - b) * 100).toFixed(2)}% -10px -10px)`, display: "inline-block" }}>{word.t}</span>
      </span>
    );
  } else if (isText) {
    content = <span style={{ ...inner, color: mixColor(theme.color.ghost, ink, p), lineHeight: 1.12 }}>{word.t}</span>;
  } else {
    // node token (InlineChip etc.): drawn at scale 1 and scaled with the caption
    content = (
      <span style={{ ...inner, color: mixColor(theme.color.ghost, ink, p), lineHeight: 1.12 }}>
        <span style={{ display: "inline-block", transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "left center" }}>{word.t}</span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-block", flex: "none", width: boxW, marginLeft: lead, whiteSpace: "nowrap", overflow: "visible", ...styleOf(s, k) }}>
      {content}
    </span>
  );
};

/**
 * Word-by-word caption on the voice (camera pass 2026-10-31: smoother).
 * - Each word eases in over `settle` (10) frames with one soft ease-out: opacity, a `rise` (7 px) lift, blur
 *   `blur` (6 px) -> 0, colour light grey -> black.
 * - Glyphs never move sideways: a word takes its full slot the moment it starts (so fast words never overlap).
 *   A line whose words all arrive within `cluster` (12) frames is laid out at its final centred width as soon as
 *   its first word appears (key phrases reveal in place); words arriving later make the line glide, re-centring
 *   over `reflow` (8) frames, always clamped so the line's full width stays inside x..x+w.
 *   A new line glides the block (anchor "bottom" rises over `reflow` frames).
 * - `scale` draws the whole caption bigger at full sharpness (x, y, w stay frame px); use it instead of
 *   wrapping the caption in a CSS scale. `rise` and `blur` are screen px and do not scale.
 * `anchor: "bottom"` grows the block upward from y (the hook caption block), "top" grows it down.
 */
export const KineticCaption: React.FC<{
  lines: CapWord[][];
  y: number;
  x?: number;
  w?: number;
  align?: "center" | "left";
  anchor?: "top" | "bottom";
  gap?: number;
  /** extra space between lines */
  lineGap?: number;
  settle?: number;
  blur?: number;
  rise?: number;
  /** frames a line takes to re-centre / the block to re-flow */
  reflow?: number;
  /** words arriving within this many frames of their line's first word are laid out at the final width at once */
  cluster?: number;
  /** draw size multiplier (1.4 gives the ep04 body sizes: reg 56, bi 90, bar 62) */
  scale?: number;
  exit?: Exit;
  opacity?: number;
}> = ({
  lines,
  y,
  x = 100,
  w = 880,
  align = "center",
  anchor = "top",
  gap = 20,
  lineGap = 12,
  settle = theme.caption.settle,
  blur = theme.caption.blur,
  rise = theme.caption.rise,
  reflow = theme.caption.reflow,
  cluster = theme.caption.cluster,
  scale = 1,
  exit,
  opacity = 1,
}) => {
  useFontsReady();
  const f = useCurrentFrame();
  const k = scale;
  const e = enterState(f, undefined, exit);
  if (e.o * opacity <= 0.001) return null;

  const rows = lines.map((l) => {
    const laid = layLine(l, gap, k);
    const first = l.length ? Math.min(...l.map((wd) => wd.at)) : Infinity;
    const size = l.length ? Math.max(...l.map((wd) => theme.caption[wd.s ?? "reg"].size)) : 0;
    const hasBar = l.some((wd) => wd.s === "bar");
    const h = (size * 1.12 + (hasBar ? 10 : 0) + lineGap) * k;
    // the width the centring sees. Words that arrive within `cluster` frames of the line's first word are laid out
    // at their final centred width from the moment the line appears (a key phrase reveals in place, no sideways
    // drift); only words arriving later glide in, each slot easing into the centring over `reflow` frames.
    // Glyphs themselves never slide.
    const wSmooth = laid.reduce((a, L) => a + (L.word.at <= first + cluster ? L.slot : L.slot * prog(f, L.word.at, L.word.at + reflow, EASE.cam)), 0);
    // a new line lifts the block with a soft ease-out (most of the way up before its first word is readable)
    return { laid, first, h, shown: f >= first, wSmooth, grow: prog(f, first, first + reflow, EASE.soft) };
  });
  const totalSmooth = rows.reduce((a, r) => a + r.h * r.grow, 0);
  const top = anchor === "bottom" ? y - totalSmooth : y;

  let rowTop = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        fontFamily: INTER,
        color: theme.color.ink,
        opacity: e.o * opacity,
        transform: e.transform,
        transformOrigin: `${(x + w / 2).toFixed(1)}px ${(top + totalSmooth / 2).toFixed(1)}px`,
      }}
    >
      {rows.map((r, i) => {
        if (!r.shown) return null;
        const t = rowTop;
        rowTop += r.h;
        // the centring glides on the eased width, but the line's FULL current width (an entering word already takes
        // its whole slot) is clamped inside the caption box, so a wide line never overhangs an edge mid-glide
        const wNow = r.laid.reduce((a, L) => a + (f >= L.word.at ? L.slot : 0), 0);
        let left = align === "center" ? x + (w - r.wSmooth) / 2 : x;
        if (align === "center") left = wNow <= w ? Math.min(Math.max(left, x), x + w - wNow) : x + (w - wNow) / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top: top + t,
              height: r.h,
              paddingTop: (lineGap / 2) * k,
              display: "flex",
              alignItems: "baseline",
              whiteSpace: "nowrap",
            }}
          >
            {r.laid.map((L, j) => (f >= L.word.at ? <Word key={j} L={L} f={f} settle={settle} blur={blur} rise={rise} k={k} /> : null))}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Helper: turn "one developer built something" into words spaced `step` frames apart from `at`.
 * Use `phrase()` when a group of words should land as one token (bold italic key phrases).
 */
export const words = (text: string, at: number, step = 8, s: CapStyle = "reg"): CapWord[] =>
  text
    .split(" ")
    .filter(Boolean)
    .map((t, i) => ({ t, s, at: at + i * step }));
export const phrase = (t: string, at: number, s: CapStyle = "bi"): CapWord => ({ t, s, at });

/** the settled height of a caption block (for layouts), at `scale` */
export const captionHeight = (lines: CapWord[][], lineGap = 12, scale = 1) =>
  lines.reduce((a, l) => a + (Math.max(...l.map((wd) => theme.caption[wd.s ?? "reg"].size)) * 1.12 + (l.some((wd) => wd.s === "bar") ? 10 : 0) + lineGap) * scale, 0);
