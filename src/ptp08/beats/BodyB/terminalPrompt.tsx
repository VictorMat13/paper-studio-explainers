// ===========================================================================
// ep08 terminal prompt look (owner: BB). The Claude Code style terminal used in HB, BodyA, BodyB and BodyC: the kit
// TerminalCard's white bezel and deep shadow around a DRAWN face (no screenshot of anyone's repo):
//   title bar   #1B1B1E, three grey dots, "Claude Code" in JetBrains Mono 38 (34 on screen after the 0.9 pad)
//   welcome box the official Claude mark + "Welcome to Claude Code!" and "cwd: ~/my-app" (optional)
//   history     submitted prompts ("> commit") and result lines with a white tick ("git commit")
//   input box   rounded 2 px border, the ">" prompt, the typed text (mono 46, white) and a block cursor that blinks
//               (on 16 frames, off 14, ON at f = 0) and stays solid while characters are landing
//   hint        "? for shortcuts" under the box
// Import from another group:  import { TerminalPrompt, typedChars } from "./BodyB/terminalPrompt";
//   <TerminalPrompt x={110} y={567} w={860} h={520} f={f} prompt="commit and push" typed={typedChars("commit and push", [a, b, c], f)} />
// Everything is frame-driven (pass the group-local frame as `f` and frames for `typed`, `submitAt`, `results[].at`).
// Text never goes below 38 world px (34 px on screen). Pure: no timing hooks inside.
// ===========================================================================
import React from "react";
import { Img, staticFile } from "remotion";
import { MONO, TerminalCard, hasStatic, mix, prog, type Enter, type Exit } from "../../../paperstudio";
import { EIO } from "./paper";

export const TERM_FACE = {
  bg: "#0E0E10",
  bar: "#1B1B1E",
  barH: 64,
  dot: "#46464B",
  title: "#A9A9AD",
  titleFs: 38,
  border: "#4E4E53",
  caret: "#8E8E93",
  /** the one colour accent: the Claude orange on the prompt caret and the welcome mark */
  accent: "#D97757",
  text: "#F4F4F4",
  dim: "#A3A3A8",
  faint: "#6E6E73",
  fs: 46,
  /** inner padding of the face content (px at the face's own scale) */
  pad: 30,
  /** JetBrains Mono advance width per em */
  adv: 0.6,
} as const;

/** a solid face colour for the kit TerminalCard's capture slot (we draw our own face over it) */
const SOLID = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${TERM_FACE.bg}"/></svg>`)}`;

/** the official Claude mark: ep08's copy if bundled, else the kit's */
export const claudeMark = (): string | undefined =>
  hasStatic("ptp08/BodyB/claude.svg") ? staticFile("ptp08/BodyB/claude.svg") : hasStatic("paperstudio/logos/claude.svg") ? staticFile("paperstudio/logos/claude.svg") : undefined;

/** cursor on/off: blinks 16 on / 14 off, on at f = 0 (negative frames fine) */
export const cursorOn = (f: number) => ((Math.floor(f) % 30) + 30) % 30 < 16;
/** SMOOTHNESS: the cursor's opacity on a smooth sine (period 32 frames, full at f = 0, never a hard flip) */
export const cursorLevel = (f: number) => 0.625 + 0.375 * Math.cos((f / 40) * Math.PI * 2); // 40-frame cosine pulse, 0.25 to 1, full at f = 0

/**
 * How many characters of `text` are typed at frame f, typing word by word: word i starts at starts[i] (or right after
 * the previous word when starts runs out or is earlier), `fpc` frames per character (default 1.4).
 * Pass the spoken frames of the words the prompt is typed on, e.g. typedChars("commit", [w("commit")], f).
 */
export const typedChars = (text: string, starts: number[], f: number, fpc = 1.4): number => {
  const ws = text.split(" ");
  let n = 0;
  let clock = -Infinity;
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i] + (i < ws.length - 1 ? " " : "");
    const st = Math.max(starts[Math.min(i, starts.length - 1)] ?? 0, clock);
    // words after the last given start follow at the typing rate
    const t0 = i < starts.length ? st : clock;
    for (let k = 0; k < w.length; k++) {
      const at = t0 + k * fpc;
      if (f >= at) n++;
      else return n;
    }
    clock = t0 + w.length * fpc;
  }
  return n;
};

/** n frames spread evenly from `from` to `to` (prompt word starts when no spoken word lines up) */
export const spreadStarts = (from: number, to: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => Math.round(from + (n <= 1 ? 0 : ((to - from) * i) / (n - 1))));

/** wrap `text` into lines of at most `cols` characters, breaking on spaces (a word longer than a line is split) */
export const wrapCols = (text: string, cols: number): string[] => {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const cand = line ? `${line} ${word}` : word;
    if (cand.length <= cols) line = cand;
    else {
      if (line) out.push(line);
      let wd = word;
      while (wd.length > cols) {
        out.push(wd.slice(0, cols));
        wd = wd.slice(cols);
      }
      line = wd;
    }
  }
  out.push(line);
  return out;
};

const Tick: React.FC<{ s: number; color?: string }> = ({ s, color = TERM_FACE.text }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M4.5 12.8 L9.6 17.6 L19.5 6.6" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type ResultLine = {
  text: string;
  /** frame it starts typing in (undefined = already there) */
  at?: number;
  /** a white tick before it (default true) */
  tick?: boolean;
  /** "prompt" = a submitted prompt line ("> text", dim); "result" (default) */
  kind?: "prompt" | "result";
};

export type TerminalPromptProps = {
  /** card box in world px (the kit TerminalCard: bezel max(7, w / 58)) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** frame for the cursor blink and every `at` below (the caller's group-local frame) */
  f: number;
  /** the prompt being typed in the input box */
  prompt?: string;
  /** characters of `prompt` typed so far (default all); use typedChars() */
  typed?: number;
  /** frame the typed prompt is submitted: it moves into the history ("> prompt") and the box empties */
  submitAt?: number;
  /** lines in the history above the input box (submitted prompts, results with ticks); `at` lines type in */
  history?: ResultLine[];
  /** the Claude Code welcome box at the top (default true) */
  welcome?: boolean;
  /** the "? for shortcuts" hint under the input box (default true) */
  hint?: boolean;
  /** input text size (default 46); history lines use 0.88 of it, never below 38 */
  fs?: number;
  title?: string;
  bezel?: number;
  tiltY?: number;
  tiltX?: number;
  tf?: string;
  dim?: number;
  enter?: Enter;
  exit?: Exit;
  /** extra content drawn on the face (face px) */
  children?: React.ReactNode;
};

/** frames a history line takes to type in */
const LINE_IN = 14;
/** frames after a result line settles before its tick pops in, and the tick's own pop */
const TICK_DELAY = 12;
const TICK_IN = 12;

/** The Claude Code terminal card with the prompt-typing face. */
export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  x,
  y,
  w,
  h,
  f,
  prompt = "",
  typed,
  submitAt,
  history = [],
  welcome = true,
  hint = true,
  fs = TERM_FACE.fs,
  title = "Claude Code",
  bezel,
  tiltY,
  tiltX,
  tf,
  dim,
  enter,
  exit,
  children,
}) => {
  const T = TERM_FACE;
  const bz = bezel ?? Math.max(7, Math.round(w / 58));
  const faceW = w - 2 * bz;
  const faceH = h - 2 * bz;
  const pad = T.pad;
  const hfs = Math.max(38, Math.round(fs * 0.88));
  const lh = 1.3;
  const submitted = submitAt !== undefined && f >= submitAt;
  const nTyped = Math.max(0, Math.min(prompt.length, Math.floor(typed ?? prompt.length)));

  // the history: given lines, plus the prompt once submitted
  const hist: ResultLine[] = [...history];
  if (submitted && prompt) hist.push({ text: prompt, kind: "prompt", tick: false, at: submitAt });

  // input box geometry: "> " prefix then the wrapped prompt (laid out at its final wrap so nothing jumps)
  const boxPadX = 22;
  const boxPadY = 14;
  const charW = fs * T.adv;
  const prefixCols = 2;
  const cols = Math.max(8, Math.floor((faceW - 2 * pad - 2 * boxPadX) / charW) - prefixCols);
  const shown = submitted ? "" : prompt;
  const lines = shown ? wrapCols(shown, cols) : [""];
  // spread the typed count over the wrapped lines (a wrap eats one space)
  let left = submitted ? 0 : nTyped;
  const vis = lines.map((ln, i) => {
    const take = Math.max(0, Math.min(ln.length, left));
    left -= ln.length + (i < lines.length - 1 ? 1 : 0);
    return ln.slice(0, take);
  });
  let curLine = 0;
  for (let i = 0; i < lines.length; i++) if (vis[i].length > 0 || i === 0) curLine = i;
  // keep the cursor on the line being typed (the first line not yet complete)
  for (let i = 0; i < lines.length; i++) {
    if (vis[i].length < lines[i].length) {
      curLine = i;
      break;
    }
    curLine = i;
  }
  // a fresh prompt shows the cursor at the line start
  if (!submitted && nTyped === 0) curLine = 0;
  const lineH = fs * 1.25;
  // the box grows a line when the typing wraps onto it (an empty prompt is one line, like the first card)
  const usedLines = Math.max(1, curLine + 1, vis.reduce((a, v, i) => (v.length > 0 ? i + 1 : a), 0));
  // the newest line opens smoothly as its first characters land (about 8 characters, 11 frames), never in one frame
  const lastLen = usedLines > 1 ? vis[usedLines - 1].length : 8;
  const grow = Math.min(1, (lastLen + 1) / 8);
  const boxH = (usedLines - 1 + grow * grow * (3 - 2 * grow)) * lineH + 2 * boxPadY;
  // the cursor is solid while characters land, blinking otherwise
  const landing = typed !== undefined && !submitted && nTyped > 0 && nTyped < prompt.length;
  const cur = landing ? 1 : cursorLevel(f);

  const histLineH = hfs * lh;
  const welcomeH = welcome ? 2 * hfs * lh + 40 : 0;
  const histLines = hist.map((l) => {
    const p = l.at === undefined ? 1 : prog(f, l.at, l.at + LINE_IN, EIO);
    return { l, p };
  });
  const histVisible = histLines.filter((x) => x.p > 0);
  const histH = histVisible.reduce((a, x) => a + histLineH * x.p, 0);
  const hintH = hint ? histLineH + 6 : 0;
  // the column scrolls up when it would run out of the face (the input box stays in view)
  const contentH = (welcome ? welcomeH + 24 : 0) + histH + (histVisible.length ? 18 : 0) + boxH + hintH;
  const avail = faceH - T.barH - 2 * pad + 8;
  const scroll = Math.max(0, contentH - avail);
  const mark = claudeMark();

  return (
    <TerminalCard x={x} y={y} w={w} h={h} src={SOLID} bezel={bz} tiltY={tiltY} tiltX={tiltX} tf={tf} dim={dim} enter={enter} exit={exit}>
      <div style={{ position: "absolute", inset: 0, background: T.bg }} />
      {/* title bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: faceW, height: T.barH, background: T.bar, borderBottom: "1px solid #2A2A2E" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 76 + i * 30, top: T.barH / 2 - 9, width: 18, height: 18, borderRadius: 9, background: T.dot }} />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: faceW,
            top: 0,
            height: T.barH,
            lineHeight: `${T.barH}px`,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: T.titleFs,
            fontWeight: 500,
            color: T.title,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </div>
      </div>
      {/* content column */}
      <div style={{ position: "absolute", left: pad, top: T.barH + pad - 4, width: faceW - 2 * pad, height: faceH - T.barH - pad, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -scroll, width: "100%" }}>
          {welcome ? (
            <div
              style={{
                position: "relative",
                height: welcomeH,
                border: `2px solid ${T.border}`,
                borderRadius: 12,
                boxSizing: "border-box",
                padding: "18px 22px",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", height: hfs * lh, fontFamily: MONO, fontSize: hfs, fontWeight: 700, color: T.text, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
                {mark ? <Img src={mark} style={{ width: hfs * 0.86, height: hfs * 0.86, marginRight: hfs * 0.4, display: "block" }} /> : null}
                Welcome to Claude Code!
              </div>
              <div style={{ height: hfs * lh, lineHeight: `${hfs * lh}px`, fontFamily: MONO, fontSize: hfs, fontWeight: 400, color: T.dim, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
                cwd: ~/my-app
              </div>
            </div>
          ) : null}
          {histVisible.map(({ l, p }, i) => {
            const isPrompt = l.kind === "prompt";
            const tick = !isPrompt && l.tick !== false;
            // a result types in left to right; a submitted prompt slides up out of the box
            // a result line slides in over LINE_IN frames (its height opens, it rises 10 px and fades up); its text is
            // fully set, so nothing types faster than the eye can follow
            const chars = l.text.length;
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  height: histLineH * p,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: MONO,
                  fontSize: hfs,
                  fontWeight: isPrompt ? 500 : 400,
                  color: isPrompt ? T.dim : T.text,
                  letterSpacing: -0.5,
                  whiteSpace: "nowrap",
                  opacity: p,
                  transform: `translateY(${((1 - p) * 6).toFixed(3)}px)`,
                }}
              >
                {isPrompt ? <span style={{ color: T.caret, marginRight: hfs * 0.6 }}>{">"}</span> : null}
                {tick ? (
                  <span
                    style={{
                      display: "inline-block",
                      marginRight: hfs * 0.42,
                      // the tick pops in (12 frames, in-out) 12 frames after its line has settled
                      opacity: l.at === undefined ? 1 : prog(f, l.at + LINE_IN + TICK_DELAY, l.at + LINE_IN + TICK_DELAY + TICK_IN, EIO),
                      transform: `scale(${mix(0.6, 1, l.at === undefined ? 1 : prog(f, l.at + LINE_IN + TICK_DELAY, l.at + LINE_IN + TICK_DELAY + TICK_IN, EIO)).toFixed(4)})`,
                    }}
                  >
                    <Tick s={hfs * 0.9} />
                  </span>
                ) : null}
                {l.text.slice(0, chars)}
              </div>
            );
          })}
          {histVisible.length ? <div style={{ height: 18 }} /> : null}
          {/* input box */}
          <div
            style={{
              position: "relative",
              height: boxH,
              overflow: "hidden",
              border: `2px solid ${T.border}`,
              borderRadius: 12,
              boxSizing: "border-box",
              padding: `${boxPadY - 2}px ${boxPadX}px`,
              fontFamily: MONO,
              fontSize: fs,
              lineHeight: `${lineH}px`,
              letterSpacing: 0,
              whiteSpace: "pre",
            }}
          >
            {lines.slice(0, usedLines).map((_, i) => (
              <div key={i} style={{ height: lineH, color: T.text, fontWeight: 500 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>{i === 0 ? "> " : "  "}</span>
                {vis[i]}
                {i === curLine ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: charW,
                      height: fs * 1.08,
                      verticalAlign: "middle",
                      marginTop: -fs * 0.12,
                      background: T.text,
                      opacity: cur,
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
          {hint ? (
            <div style={{ height: hintH, paddingTop: 6, boxSizing: "border-box", lineHeight: `${histLineH}px`, fontFamily: MONO, fontSize: hfs, color: T.faint, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
              ? for shortcuts
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </TerminalCard>
  );
};
