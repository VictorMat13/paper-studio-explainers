// BodyB captions: blocks built from the REAL spoken words (their frames come from the transcript), laid out with
// the kit KineticCaption at scale K = 1.6 (world: connectors 64, bold italic 102, bold 90, bar 70; on screen after the 0.9 pad: 58, 92, 81, 63 px). A block is written as
// a small spec string:
//   "Before you | build *anything,"
//     |      line break
//     *w     bold italic         !w  bold          #w  black bar
//     ^w     big upright (text beats)
//     [a b]  phrase token (lands whole on its first spoken word)
//     {v1=v1/v}  figure token: shows "v1", lands on the spoken word "v1" (or "v")
// Each token is timed on its first spoken word, found by walking the shot's words in order. Block swaps: the old
// block fades out and is fully gone (opacity 0) the frame before the new block's first word starts (ep06 fix-round-2
// rule 2); if speech is too fast for that, the new block waits until the old one is gone.
import React from "react";
import { useCurrentFrame } from "remotion";
import { prog, type CapStyle, type CapWord } from "../../../paperstudio";
import { SmoothCaption, smoothCaptionHeight } from "../Shared/smoothCaption";
import { norm, type Cues, type ShotId } from "./cues";
import { EIO } from "./paper";

export const K = 1.67;
const LINE_GAP = 6;

type Tok = { show: string; keys: string[]; s?: CapStyle; br?: boolean };

const parse = (spec: string): Tok[] => {
  const out: Tok[] = [];
  const re = /\|\s*|([*#!^]?)(\[[^\]]+\][^\s|]*|\{[^}]+\}[^\s|]*|[^\s|]+)\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(spec))) {
    if (m[0].startsWith("|")) {
      out.push({ show: "", keys: [], br: true });
      continue;
    }
    const pre = m[1];
    const body = m[2];
    const s: CapStyle | undefined = pre === "*" ? "bi" : pre === "#" ? "bar" : pre === "!" ? "bold" : pre === "^" ? "big" : undefined;
    if (body.startsWith("[")) {
      const close = body.indexOf("]");
      const t = body.slice(1, close);
      out.push({ show: t + body.slice(close + 1), keys: [t.split(/\s+/)[0]], s });
    } else if (body.startsWith("{")) {
      const close = body.indexOf("}");
      const [show, say] = body.slice(1, close).split("=");
      out.push({ show: show + body.slice(close + 1), keys: (say ?? show).split("/"), s });
    } else out.push({ show: body, keys: [body], s });
  }
  return out;
};

export type BlockSpec = {
  /** the shots whose words this block uses (searched in order) */
  shots: ShotId[];
  spec: string;
  /** hud placement: top y (anchor "top") or bottom y (anchor "bottom") */
  y: number;
  anchor?: "top" | "bottom";
  x?: number;
  w?: number;
  /** override the first frame (e.g. a block that waits for an object to clear) */
  minAt?: number;
  align?: "center" | "left";
  /** caption scale for this block (default K) */
  k?: number;
};

/** does spoken word `w` match one of the token keys (case and punctuation ignored, "9%" matches "9") */
const hit = (w: string, keys: string[]) => {
  const n = norm(w);
  return keys.some((x) => n === x || (/^\d/.test(x) && n.startsWith(x)));
};

/** greedy in-order match of the tokens from spoken word k: returns each token's word index (-1 = not found) */
const walk = (words: { w: string }[], toks: Tok[], k: number) => {
  const idx: number[] = [];
  let j = k;
  for (const t of toks) {
    if (t.br) continue;
    const ks = t.keys.map(norm);
    let h = -1;
    for (let q = j; q < Math.min(words.length, j + 6); q++)
      if (hit(words[q].w, ks)) {
        h = q;
        break;
      }
    idx.push(h);
    if (h >= 0) j = h + 1;
  }
  return idx;
};

/** turn a spec into timed caption lines. The block is anchored where its token sequence matches the spoken words
 *  best (so a second block in the same shot, or one that starts with a repeated word like "and", lands on its own
 *  words, not the shot's first ones); each token is timed on its first spoken word. */
export const timed = (c: Cues, b: BlockSpec): CapWord[][] => {
  const words = c.all.filter((w) => b.shots.some((id) => w.f >= c.s[id].start - 1 && w.f < c.s[id].end));
  const toks = parse(b.spec);
  const first = toks.find((t) => !t.br);
  let best: number[] = [];
  let bestN = -1;
  for (let k = 0; k < words.length; k++) {
    if (!first || !hit(words[k].w, first.keys.map(norm))) continue;
    const idx = walk(words, toks, k);
    const found = idx.filter((x) => x >= 0);
    // most tokens matched first, then the tightest run of words (two blocks that both start with "and")
    const n = found.length * 1000 - (found.length ? found[found.length - 1] - k : 0);
    if (n > bestN) {
      bestN = n;
      best = idx;
    }
  }
  if (bestN < 0) best = walk(words, toks, 0);
  const lines: CapWord[][] = [[]];
  let prev = words.length ? words[0].f : c.s[b.shots[0]].start;
  let i = 0;
  for (const t of toks) {
    if (t.br) {
      lines.push([]);
      continue;
    }
    const h = best[i++];
    const at = h !== undefined && h >= 0 ? words[h].f : prev + 5;
    prev = at;
    lines[lines.length - 1].push({ t: t.show, s: t.s, at });
  }
  return lines.filter((l) => l.length);
};

const firstAt = (ls: CapWord[][]) => Math.min(...ls.flat().map((w) => w.at));
const lastAt = (ls: CapWord[][]) => Math.max(...ls.flat().map((w) => w.at));

/**
 * A run of caption blocks in one scene's hud. Blocks follow each other in time; each is fully gone the frame before
 * the next one's first word. `until` = the frame the last block must be gone (the scene's exit).
 */
export const CaptionRun: React.FC<{ c: Cues; blocks: BlockSpec[]; until?: number; from?: number }> = ({ c, blocks, until, from }) => {
  const f = useCurrentFrame();
  const laid = blocks.map((b) => ({ b, lines: timed(c, b) })).filter((x) => x.lines.length);
  const starts: number[] = [];
  const exits: number[] = [];
  const durs: number[] = [];
  laid.forEach((x, i) => {
    // RED TEAM / SMOOTHNESS: a block starts on its first spoken word; its exit is scheduled from the NEXT block's first
    // spoken word: a 10-frame in-out fade that is over by that frame minus 1 (never doubled, never late)
    const st = Math.max(firstAt(x.lines), x.b.minAt ?? -1e9, from ?? -1e9);
    starts.push(st);
    const next = laid[i + 1];
    if (next) {
      const nf = Math.max(firstAt(next.lines), next.b.minAt ?? -1e9);
      const ex = Math.max(st + 6, nf - 11);
      exits.push(ex);
      durs.push(Math.max(2, Math.min(10, nf - 1 - ex)));
    } else {
      exits.push(until !== undefined ? Math.max(lastAt(x.lines) + 6, until - 7) : Infinity);
      durs.push(6);
    }
  });
  return (
    <>
      {laid.map((x, i) => {
        const st = starts[i];
        const ex = exits[i];
        const dur = durs[i];
        if (f < st - 6 || f >= ex + dur) return null;
        const lines = x.lines.map((l) => l.map((wd) => (wd.at < st ? { ...wd, at: st } : wd)));
        const h = smoothCaptionHeight(lines, LINE_GAP, x.b.k ?? K);
        const top = x.b.anchor === "bottom" ? x.b.y - h : x.b.y;
        // the caption's own paper lane: a soft white band behind the text so it reads on a busy board
        const laneO = prog(f, Math.max(st - 6, 1), Math.max(st + 6, 12), EIO) * (ex < Infinity ? 1 - prog(f, ex, ex + dur, EIO) : 1);
        return (
          <React.Fragment key={i}>
            {laneO > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  width: 1040,
                  top: top - 22,
                  height: h + 40,
                  borderRadius: 60,
                  background: "radial-gradient(ellipse 52% 50% at 50% 50%, rgba(253,253,252,.86) 0%, rgba(253,253,252,.62) 55%, rgba(253,253,252,0) 100%)",
                  opacity: laneO,
                }}
              />
            ) : null}
            {/* BA's shared smooth caption: every line at its final width from the first frame, words eased in over 12 f */}
            <SmoothCaption
              lines={lines}
              y={top}
              x={x.b.x ?? 40}
              w={x.b.w ?? 1000}
              scale={x.b.k ?? K}
              lineGap={LINE_GAP}
              align={x.b.align ?? "center"}
              exit={ex < Infinity ? { at: ex, dur } : undefined}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/** the frames each block of a run is on screen [start, gone) (for scenes that keep objects clear of captions) */
export const runSpans = (c: Cues, blocks: BlockSpec[], until?: number) => {
  const laid = blocks.map((b) => timed(c, b));
  const out: { start: number; gone: number }[] = [];
  let prevExit = -1e9;
  laid.forEach((lines, i) => {
    const st = Math.max(firstAt(lines), blocks[i].minAt ?? -1e9, i ? prevExit + 5 : -1e9);
    const nl = laid[i + 1];
    const ex = nl ? Math.max(lastAt(lines) + 6, st + 10, Math.max(firstAt(nl), blocks[i + 1].minAt ?? -1e9) - 5) : until !== undefined ? until - 5 : 1e9;
    out.push({ start: st, gone: ex + 4 });
    prevExit = ex;
  });
  return out;
};
