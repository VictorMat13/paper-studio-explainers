// BodyA captions (local, copied from ep07 BodyA, after ep06 HA's CaptionBlocks): spoken words from timing.ts become kinetic caption blocks
// in the Camera hud, centred in the band above the visual (hud y 240-540 = screen about 290-560; the body's cards sit
// lower because the hook hands off at (540, 890)).
// Rules: a word never appears before it is spoken (it may wait at most a few frames for the block before it to
// clear); a block is completely gone (3-frame fade in place) before the next block's first word appears; each block
// is laid out at its final height from its first frame, so a new line appears in place under the one before.
import React from "react";
import { type CapStyle, type CapWord } from "../../../paperstudio";
import { SmoothCaption, sineEase, smoothCaptionHeight } from "../Shared/smoothCaption";
import { useWords, type Word } from "../../timing";
import { SM } from "./util";

/** hud scale (STYLE UPLIFT): on screen (with the shell's 0.9 pad) connectors 60, bold italic 97, bold 85, black bar 67 */
export const CAP_SCALE = 1.68;
/** frames a caption block takes to fade out (eased), and how early a word starts its ease before it is spoken */
const FADE = 10;
export const PRE = 3;
/** the caption band (hud px) */
export const BAND = { y0: 240, y1: 540 };

const PROPER = new Set(["Claude", "GitHub", "Git", "AI", "COMMIT", "I'll", "I", "Code"]);
const PROPER_LC: Record<string, string> = { github: "GitHub", git: "Git", claude: "Claude", ai: "AI", "i'll": "I'll", i: "I" };
/** caption text for a spoken word: no trailing punctuation, lower case except names */
export const cleanWord = (w: string) => {
  const t = w.replace(/[.,!?;:"]+$/g, "").replace(/^["]+/, "");
  if (PROPER.has(t)) return t;
  return PROPER_LC[t.toLowerCase()] ?? t.toLowerCase();
};
export const norm = (w: string) => w.replace(/[.,!?;:"]+/g, "").toLowerCase();

/** spoken words of a shot as caption tokens; `style` decides each word's look (null drops it) */
export const useLine = (id: string, style: (word: string, i: number) => CapStyle | null = () => "reg"): CapWord[] => {
  const ws = useWords(id);
  const out: CapWord[] = [];
  ws.forEach((w, i) => {
    const t = cleanWord(w.w);
    const s = style(norm(w.w), i);
    if (s) out.push({ t, s, at: w.f });
  });
  return out;
};

/** the first word of a sentence starts with a capital */
export const cap1 = (line: CapWord[]): CapWord[] =>
  line.map((tk, i) => (i === 0 && typeof tk.t === "string" ? { ...tk, t: tk.t.charAt(0).toUpperCase() + tk.t.slice(1) } : tk));

/** set the style of the tokens matching re (on the lower-case word) */
export const restyle = (line: CapWord[], re: RegExp, s: CapStyle): CapWord[] => line.map((tk) => (typeof tk.t === "string" && re.test(norm(tk.t)) ? { ...tk, s } : tk));

/** replace a run of spoken words (each matching its regex, in order) with one figure token landing on word `atIndex` */
export const figure = (line: CapWord[], re: RegExp[], t: string, s: CapStyle, atIndex = 0): CapWord[] => {
  const out: CapWord[] = [];
  for (let i = 0; i < line.length; i++) {
    const run = re.every((r, k) => {
      const tk = line[i + k];
      return tk && typeof tk.t === "string" && r.test(norm(tk.t));
    });
    if (run) {
      out.push({ t, s, at: line[i + Math.min(atIndex, re.length - 1)].at });
      i += re.length - 1;
    } else out.push(line[i]);
  }
  return out;
};

/** split a token list into lines: a new line starts at each token whose word matches one of `breaks` */
export const splitAt = (line: CapWord[], breaks: RegExp[]): CapWord[][] => {
  const out: CapWord[][] = [[]];
  line.forEach((tk, i) => {
    if (i > 0 && typeof tk.t === "string" && breaks.some((b) => b.test(norm(tk.t as string)))) out.push([]);
    out[out.length - 1].push(tk);
  });
  return out.filter((l) => l.length);
};

/** tokens from frame range [from, to) of a list */
export const between = (line: CapWord[], from: number, to: number) => line.filter((tk) => tk.at >= from && tk.at < to);

/** first spoken word matching re in a word list (frames group-local) */
export const findWord = (ws: Word[], re: RegExp, after = -Infinity): Word | undefined => ws.find((w) => w.f >= after && re.test(norm(w.w)));

export type Block = { lines: CapWord[][]; /** takes part in the schedule but draws nothing (the words are drawn in the world) */ hidden?: boolean; size?: CapStyle; align?: "center" | "left"; x?: number; w?: number; /** centre of the block (hud y); default the band centre */ cy?: number; scale?: number };

/**
 * Caption blocks replacing each other on the voice, for the Camera hud. Each block's words keep their spoken frames;
 * the next block's first word waits (at most a few frames) until the block before has faded.
 */
export const CaptionBlocks: React.FC<{ f: number; blocks: Block[]; lastExit?: number }> = ({ f, blocks, lastExit }) => {
  const firstAt = (b: CapWord[][]) => Math.min(...b.flat().map((w) => w.at));
  const lastAt = (b: CapWord[][]) => Math.max(...b.flat().map((w) => w.at));
  // RED TEAM RT-A-1: every word starts its ease PRE frames before it is spoken (readable on its frame); a block is
  // gone (FADE-frame eased fade) by the frame before the next block's first word starts
  const live = blocks
    .map((b) => ({ ...b, lines: b.lines.filter((l) => l.length).map((l) => l.map((tk) => ({ ...tk, at: tk.at - PRE }))) }))
    .filter((b) => b.lines.flat().length);
  const starts: number[] = [];
  const exits: number[] = [];
  const fades: number[] = [];
  live.forEach((b, j) => {
    const start = j === 0 ? firstAt(b.lines) : Math.max(firstAt(b.lines), exits[j - 1] + fades[j - 1] + 1);
    starts.push(start);
    const last = Math.max(lastAt(b.lines), start);
    const next = live[j + 1];
    if (next) {
      const nr = firstAt(next.lines);
      // the longest eased fade the voice leaves room for (8-14 frames, sine in-out); the block is gone by
      // the frame before the next block's first word starts, but its own last word stays at least 4 frames
      const fade = Math.max(8, Math.min(14, nr - 1 - (last + 4)));
      fades.push(fade);
      exits.push(Math.max(last + 4, nr - 1 - fade));
    } else {
      fades.push(FADE);
      exits.push(lastExit ?? Infinity);
    }
  });
  return (
    <>
      {live.map((b, j) => {
        const start = starts[j];
        const exitAt = exits[j];
        const leaves = exitAt < Infinity;
        const fade = fades[j];
        if (b.hidden || f < start - 1 || (leaves && f >= exitAt + fade)) return null;
        const lines = b.lines.map((l) => l.map((tk) => (tk.at < start ? { ...tk, at: start } : tk)));
        const k = b.scale ?? CAP_SCALE;
        const hh = smoothCaptionHeight(lines, 4, k);
        const cy = b.cy ?? (BAND.y0 + BAND.y1) / 2;
        // a faint white paper lane behind the block (it reads on a busy ground), easing in with the first word and out
        // with the block
        const laneIn = SM(Math.min(1, Math.max(0, (f - start + 1) / 10)));
        const laneOut = leaves ? 1 - sineEase(f, exitAt, fade) : 1;
        const lane = (
          <div
            key={`lane${j}`}
            style={{
              position: "absolute",
              left: 24,
              width: 1032,
              top: cy - hh / 2 - 26,
              height: hh + 52,
              borderRadius: 40,
              background: "radial-gradient(ellipse 52% 50% at 50% 50%, rgba(255,255,255,.62) 0%, rgba(255,255,255,.45) 55%, rgba(255,255,255,0) 100%)",
              opacity: laneIn * laneOut,
            }}
          />
        );
        return [
          lane,
          <SmoothCaption key={j} lines={lines} y={cy - hh / 2} x={b.x ?? 40} w={b.w ?? 1000} align={b.align ?? "center"} scale={k} lineGap={4} exit={leaves ? { at: exitAt, dur: fade } : undefined} />,
        ];
      })}
    </>
  );
};
