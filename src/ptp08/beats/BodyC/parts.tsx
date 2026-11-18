// BodyC shared pieces (adapted from ep07 BodyC/parts.tsx, same builder role): caption pages from the spoken words,
// motion helpers, the robot with its blink, a logo chip that can grey out, a text chip, a big figure. Frame-driven,
// bezier easing only.
import React from "react";
import { Easing, Img, useCurrentFrame } from "remotion";
import { EASE, INTER, LOGO, LogoDisc, PHOTO05, mix, mixColor, prog, theme, type CapStyle, type CapWord, type Exit } from "../../../paperstudio";
import { LOGOS, PHOTOS } from "./assets";
import { SmoothCaption, smoothCaptionHeight } from "../Shared/smoothCaption";
import type { Word } from "../../timing";
import { norm } from "./cues";

// ------------------------------------------------------------------ motion helpers
/** SMOOTHNESS (Victor 2026-11-07): the one ease for entrances, pops, fades and exits in BodyC: cubic in-out, zero velocity
 *  at both ends (moves between rests use EASE.travel / EASE.cam, also in-out). Never linear, never a spring. */
export const SMOOTH = Easing.bezier(0.4, 0, 0.2, 1);
/** gentle sine drift */
export const sway = (f: number, amp: number, period: number, seed = 0) => amp * Math.sin(((f + seed * 23) / period) * Math.PI * 2);
/** 1 at the cue, easing back to 0 over `dur` */
export const bump = (f: number, at: number, dur = 10) => (f < at ? 0 : 1 - prog(f, at, at + dur, SMOOTH));
/** 0 -> 1 -> 0 over [at, at + dur) */
export const swell = (f: number, at: number, dur = 14) => (f < at || f >= at + dur ? 0 : Math.sin(Math.PI * ((f - at) / dur)));
/** eased path through {f, v} keys, holding outside */
export const path = (keys: { f: number; v: number }[], f: number, ease: (t: number) => number = EASE.cam) => {
  if (!keys.length) return 0;
  if (f <= keys[0].f) return keys[0].v;
  for (let i = 1; i < keys.length; i++) if (f <= keys[i].f) return mix(keys[i - 1].v, keys[i].v, prog(f, keys[i - 1].f, keys[i].f, ease));
  return keys[keys.length - 1].v;
};

// ------------------------------------------------------------------ assets
/** official logo URL: this folder's copies (ep08 storyboard/assets/logos), else the kit's */
export const logo = (name: string): string | undefined => {
  if (name === "GitHub") return LOGOS.github;
  if (name === "Git") return LOGOS.git;
  if (name === "Claude") return LOGOS.claude ?? LOGO.Claude;
  return LOGO[name];
};
export const ROBOT = { src: () => PHOTOS.robot ?? PHOTO05.robot, w: 1134, h: 1574 };

// ------------------------------------------------------------------ captions
/** caption draw scale (STYLE UPLIFT, Victor 2026-11-07: captions with presence): reg 66, bold italic 106, bar 73 in
 *  world px = 60 / 96 / 66 on screen through the shell's 0.9 pad (the top of the skill's range). */
export const CAP_K = 1.66;
export const LINE_H = { reg: (40 * 1.12 + 12) * CAP_K, bi: (64 * 1.12 + 12) * CAP_K, bar: (44 * 1.12 + 22) * CAP_K };

/**
 * Caption lines from a layout string matched to the spoken words in order:
 *   "There are *two* / *different things*"   "/" = new line, *word* = bold italic, [several words] = black bar words,
 *   {word} = bold upright, ~word = big upright, show=said = a figure shown as `show` on the spoken word `said`
 *   ("*9%,=nine*" shows "9%," on "nine"; the rest of the spoken number, e.g. "percent", is skipped).
 * The text shown is the layout's (so figures and punctuation are ours); each word lands on its spoken word's frame.
 * Every word inside [...] is its own bar token on its own spoken word (fix round 2, RED TEAM B-03/B-04/B-05: a whole
 * bar on its first word showed the later words before they were said); Pages joins neighbouring bar words into one
 * bar that grows word by word (see barGap).
 * A layout word that is not spoken nearby falls back to 5 frames after the previous one.
 */
/**
 * A bar word starts BAR_LEAD frames before its spoken word: the kit's bar wipe takes 10 frames (EASE.travel), so 3 frames
 * in it is about 12% across, still inside the bar's left padding (18 px of the box at scale 1). No letter shows before
 * the word is said, and the word reads 2-5 frames after it (instead of 7-9 when the wipe starts on the word).
 */
const BAR_LEAD = -3;

/** RED TEAM RT-C-1: every word starts its 10-frame ease 2 frames before it is spoken, so it reads on the spoken frame */
export const capLayout = (ws: Word[], layout: string, lead = -2): CapWord[][] => {
  const toks = layout.split(/\s+/).filter(Boolean);
  const lines: CapWord[][] = [[]];
  let j = 0;
  let prevAt = ws.length ? ws[0].f : 0;
  let mode: CapStyle | null = null;
  let inBar = false;
  const matchAt = (raw: string) => {
    const n = norm(raw);
    for (let k = j; k < Math.min(ws.length, j + 5); k++) {
      if (norm(ws[k].w) === n) {
        j = k + 1;
        prevAt = ws[k].f;
        return ws[k].f;
      }
    }
    prevAt += 5;
    return prevAt;
  };
  for (const tok of toks) {
    if (tok === "/") {
      lines.push([]);
      continue;
    }
    let t = tok;
    let style: CapStyle = mode ?? "reg";
    let close = false;
    if (t.startsWith("[")) {
      inBar = true;
      t = t.slice(1);
    }
    if (t.startsWith("*")) {
      mode = "bi";
      style = "bi";
      t = t.slice(1);
    } else if (t.startsWith("{")) {
      mode = "bold";
      style = "bold";
      t = t.slice(1);
    } else if (t.startsWith("~")) {
      style = "big";
      t = t.slice(1);
    }
    if (t.endsWith("]")) {
      close = true;
      t = t.slice(0, -1);
    }
    if (t.endsWith("*") || t.endsWith("}")) {
      t = t.slice(0, -1);
      mode = null;
    }
    const eq = t.indexOf("=");
    const show = eq < 0 ? t : t.slice(0, eq);
    const at = matchAt(eq < 0 ? t : t.slice(eq + 1)) + lead + (inBar ? BAR_LEAD : 0);
    lines[lines.length - 1].push({ t: show, s: inBar ? "bar" : style, at });
    if (close) inBar = false;
  }
  return lines.filter((l) => l.length);
};

/** the spoken words from the nth one matching `tok` on (all of them when it is not found) */
export const wsFrom = (ws: Word[], tok: string, nth = 0): Word[] => {
  let k = 0;
  for (let i = 0; i < ws.length; i++) {
    if (norm(ws[i].w) === norm(tok)) {
      if (k === nth) return ws.slice(i);
      k++;
    }
  }
  return ws;
};

/** first frame a caption page shows a word */
export const firstAt = (lines: CapWord[][]) => Math.min(...lines.flat().map((w) => w.at));
/** last word's frame on a caption page */
export const lastAt = (lines: CapWord[][]) => Math.max(...lines.flat().map((w) => w.at));


/** the caption at the reel scale, centred on cx in a box `w` wide (world px, hud). RED TEAM RT-C-10: drawn with BA's
 *  shared SmoothCaption (every word holds its slot from the block's first frame, so a row's baseline never moves when a
 *  bigger word joins it; words ease in over 12 frames). */
export const Cap: React.FC<{ lines: CapWord[][]; y: number; cx?: number; w?: number; k?: number; exit?: Exit; anchor?: "top" | "bottom"; lineGap?: number; opacity?: number; align?: "center" | "left" }> = ({
  lines,
  y,
  cx = 540,
  w = 950,
  k = CAP_K,
  anchor,
  lineGap = 12,
  opacity,
  align,
}) => (
  <SmoothCaption lines={lines} x={cx - w / 2} y={anchor === "bottom" ? y - smoothCaptionHeight(lines, lineGap, k) : y} w={w} scale={k} lineGap={lineGap} align={align} opacity={opacity} />
);

/** one caption block on a page: lines plus where it sits (hud px) */
export type CapBlock = {
  lines: CapWord[][];
  y: number;
  cx?: number;
  w?: number;
  anchor?: "top" | "bottom";
  k?: number;
  /** no word of this page lands before this frame (e.g. until a card has slid out of the caption's place) */
  from?: number;
  /** the page starts leaving no later than this frame (e.g. before a card slides into its place) */
  end?: number;
};

/** conservative width estimate (scale 1 px) of a caption line: em per character by style, plus word spaces and bar
 *  padding; used to shrink a block whose longest line would pass 960 world px (the caption must stay in the safe box) */
const EM: Record<string, number> = { reg: 0.5, bi: 0.55, bold: 0.55, big: 0.56, huge: 0.56, bar: 0.55 };
const lineW = (l: CapWord[]) =>
  l.reduce((acc, w, j) => {
    const st = w.s ?? "reg";
    const size = theme.caption[st].size;
    const t = typeof w.t === "string" ? w.t : "";
    return acc + t.length * EM[st] * size + (st === "bar" ? 36 : 0) + (j ? 0.32 * size : 0);
  }, 0);
export const fitK = (lines: CapWord[][], k: number, maxW = 960) => {
  const w = Math.max(0, ...lines.map(lineW));
  return w * k > maxW ? maxW / w : k;
};

/** clamp every word on a page to land no earlier than `from` */
const clampPage = (p: CapBlock[], from: number): CapBlock[] => p.map((b) => ({ ...b, lines: b.lines.map((l) => l.map((w) => (w.at < from ? { ...w, at: from } : w))) }));

/**
 * Caption pages that replace each other. A page (one or more blocks shown together) lands on its words and leaves
 * over `out` frames just before the next page's first word; the old page is always fully gone (plus `gap` frames)
 * before the next page's first word lands, and every page's last word is readable for at least `minShow` frames:
 * when the speech runs straight on, the next page's first words wait (they land together a few frames late, never
 * early). The last page stays until `until`, then fades over `out`.
 */
export const Pages: React.FC<{ pages: CapBlock[][]; until: number; gap?: number; out?: number; minShow?: number }> = ({ pages, until, out = 8 }) => {
  const f = useCurrentFrame();
  const live = pages.filter((p) => p.some((b) => b.lines.length));
  const first = (p: CapBlock[]) => Math.min(...p.map((b) => (b.lines.length ? firstAt(b.lines) : Infinity)));
  const last = (p: CapBlock[]) => Math.max(...p.map((b) => (b.lines.length ? lastAt(b.lines) : -Infinity)));
  // RED TEAM RT-C-1: a page never waits for the one before it. Each page's first word lands on its own (lead-adjusted)
  // frame; the page before is scheduled backwards from that frame: an eased fade of `out` frames that is over by the
  // next first word minus 1. When the speech runs straight on (less room than that after the last word), the fade
  // starts earlier and runs shorter (never under 5 frames), inside the previous word's tail, never later.
  const laid: { p: CapBlock[]; a: number; exitAt: number; dur: number }[] = [];
  for (let i = 0; i < live.length; i++) {
    const pFrom = Math.max(...live[i].map((b) => b.from ?? -Infinity));
    const p = clampPage(live[i], pFrom);
    const a = first(p);
    const lastW = last(p);
    const pEnd = Math.min(...live[i].map((b) => b.end ?? Infinity));
    let dur = out;
    let exitAt: number;
    if (i + 1 < live.length) {
      const nextFirst = first(live[i + 1]);
      exitAt = nextFirst - 1 - dur;
      if (exitAt < lastW + 3) {
        dur = Math.max(5, nextFirst - 1 - (lastW + 3));
        exitAt = nextFirst - 1 - dur;
      }
    } else exitAt = until;
    exitAt = Math.min(exitAt, pEnd);
    laid.push({ p, a, exitAt, dur });
  }
  return (
    <>
      {laid.map(({ p, a, exitAt, dur: out }, i) => {
        if (f < a || f >= exitAt + out) return null;
        // the paper lane behind the block (STYLE UPLIFT 5): a faint white band, eased in with the first word, out with the page
        const laneO = Math.min(prog(f, a, a + 12, EASE.drift), 1 - prog(f, exitAt, exitAt + out, EASE.drift));
        return (
          <React.Fragment key={i}>
            {p.map((b, j) => {
              if (!b.lines.length) return null;
              const k = fitK(b.lines, b.k ?? CAP_K);
              const h = b.lines.reduce((acc, l) => {
                const size = Math.max(...l.map((w) => theme.caption[w.s ?? "reg"].size));
                return acc + (size * 1.12 + (l.some((w) => w.s === "bar") ? 10 : 0) + 12) * k;
              }, 0);
              const top = b.anchor === "bottom" ? b.y - h : b.y;
              const cx = b.cx ?? 540;
              const lw = Math.min(1060, (b.w ?? 950) + 80);
              return (
                <div
                  key={`lane${j}`}
                  style={{
                    position: "absolute",
                    left: cx - lw / 2,
                    width: lw,
                    top: top - 14,
                    height: h + 22,
                    borderRadius: 40,
                    background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.62) 16%, rgba(255,255,255,.62) 84%, rgba(255,255,255,0) 100%)",
                    filter: "blur(6px)",
                    opacity: laneO,
                  }}
                />
              );
            })}
            {p.map((b, j) =>
              b.lines.length ? <Cap key={j} lines={b.lines} y={b.y} cx={b.cx} w={b.w} k={fitK(b.lines, b.k ?? CAP_K)} anchor={b.anchor} opacity={1 - prog(f, exitAt, exitAt + out, EASE.drift)} /> : null,
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ robot (the ep06 cut-out) with a blink
/** eye boxes in robot.png px (ep06 Cta.tsx), for the blink */
const EYES = [
  { x0: 374, y0: 334, x1: 458, y1: 500 },
  { x0: 732, y0: 383, x1: 823, y1: 546 },
];
/** the robot cut-out `h` px tall, feet at (cx, bottom); blink 0..1 closes the visor eyes; tilt deg about the feet */
export const Robot: React.FC<{ cx: number; bottom: number; h: number; blink?: number; tilt?: number; dy?: number; opacity?: number; shadow?: boolean; scaleY?: number }> = ({
  cx,
  bottom,
  h,
  blink = 0,
  tilt = 0,
  dy = 0,
  opacity = 1,
  shadow = true,
  scaleY = 1,
}) => {
  if (opacity <= 0.001) return null;
  const s = h / ROBOT.h;
  const w = ROBOT.w * s;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: bottom - h,
        width: w,
        height: h,
        transform: `translateY(${dy.toFixed(2)}px) rotate(${tilt.toFixed(3)}deg) scaleY(${scaleY.toFixed(4)})`,
        transformOrigin: "50% 100%",
        opacity,
        filter: shadow ? "drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(12px 18px 14px rgba(0,0,0,.18))" : undefined,
      }}
    >
      <Img src={ROBOT.src()} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {blink > 0.01
        ? EYES.map((e, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (e.x0 - 4) * s,
                top: (e.y0 - 6) * s,
                width: (e.x1 - e.x0 + 8) * s,
                height: (e.y1 - e.y0 + 12) * s * blink,
                background: "#1E1D21",
                borderRadius: `0 0 ${(46 * s).toFixed(1)}px ${(46 * s).toFixed(1)}px / 0 0 ${(30 * s).toFixed(1)}px ${(30 * s).toFixed(1)}px`,
                filter: "blur(1px)",
              }}
            />
          ))
        : null}
    </div>
  );
};

// ------------------------------------------------------------------ chips
/** a logo chip (kit LogoDisc) centred at (cx, cy) with presence p (scale 0.6 -> 1, no overshoot), extra scale k, grey */
export const Chip: React.FC<{ cx: number; cy: number; r: number; name: string; p?: number; k?: number; grey?: number; rot?: number }> = ({ cx, cy, r, name, p = 1, k = 1, grey = 0, rot = 0 }) => {
  if (p <= 0.001) return null;
  const s = mix(0.6, 1, p) * k;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        transform: `rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`,
        opacity: Math.min(1, p * 2),
        filter: grey > 0.01 ? `grayscale(${grey.toFixed(3)}) opacity(${(1 - 0.35 * grey).toFixed(3)})` : undefined,
      }}
    >
      <LogoDisc name={name} r={r} src={logo(name)} />
    </div>
  );
};

/** a lowercase chip label that lands like a caption word */
export const ChipLabel: React.FC<{ cx: number; top: number; text: string; at: number; size?: number; out?: number }> = ({ cx, top, text, at, size = 44, out }) => {
  const f = useCurrentFrame();
  const r = prog(f, at, at + theme.caption.settle, SMOOTH) * (out === undefined ? 1 : 1 - prog(f, out, out + 6, EASE.travel));
  if (r <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - 220,
        width: 440,
        top: top + theme.caption.rise * (1 - r),
        textAlign: "center",
        fontFamily: INTER,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: -0.3,
        lineHeight: 1.1,
        color: mixColor(theme.color.ghost, theme.color.label, r),
        opacity: Math.min(1, r * 1.6),
        filter: r < 0.995 ? `blur(${(theme.caption.blur * (1 - r)).toFixed(2)}px)` : undefined,
      }}
    >
      {text}
    </div>
  );
};

/** a white paper button with black bold text (the 'S&P 500' / 'tech' text chip look) */
export const TextChip: React.FC<{ cx: number; cy: number; text: string; fs?: number; p?: number; dark?: boolean }> = ({ cx, cy, text, fs = 44, p = 1, dark }) => {
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) scale(${mix(0.6, 1, p).toFixed(4)})`,
        opacity: Math.min(1, p * 2),
        background: dark ? theme.color.ink : "#fff",
        color: dark ? "#fff" : theme.color.ink,
        borderRadius: 999,
        padding: `${Math.round(fs * 0.28)}px ${Math.round(fs * 0.62)}px`,
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: fs,
        letterSpacing: -0.8,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        boxShadow: dark ? theme.shadow.pill : "0 0 0 1px rgba(0,0,0,.05),3px 3px 0 #DCDCDC,10px 16px 26px rgba(0,0,0,.16),inset 0 2px 0 #fff",
      }}
    >
      {text}
    </div>
  );
};

/** a big black figure (Inter 800) landing like a caption word: fade, rise, blur clearing, grey to black */
export const Figure: React.FC<{ x: number; y: number; text: string; at: number; size: number; align?: "left" | "center" | "right"; w?: number; out?: number; color?: string }> = ({
  x,
  y,
  text,
  at,
  size,
  align = "center",
  w = 600,
  out,
  color = theme.color.ink,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const r = prog(f, at, at + theme.caption.settle, SMOOTH);
  const o = prog(f, at, at + 5, SMOOTH) * (out === undefined ? 1 : 1 - prog(f, out, out + 6, EASE.travel));
  if (o <= 0.001) return null;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  return (
    <div
      style={{
        position: "absolute",
        left,
        width: w,
        top: y + theme.caption.rise * (1 - r),
        textAlign: align,
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: -size * 0.04,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: mixColor(theme.color.ghost, color.startsWith("#") ? color : "#111111", r),
        opacity: o,
        filter: r < 0.995 ? `blur(${(theme.caption.blur * (1 - r)).toFixed(2)}px)` : undefined,
        textShadow: "3px 5px 0 rgba(0,0,0,.06)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {text}
    </div>
  );
};
