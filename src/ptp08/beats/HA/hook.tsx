// ===========================================================================
// HA shared helpers (builder HA, ep08 hook A). Local to HA, not kit.
// Adapted from ep07 HA's hook.tsx: caption blocks that never overlap (ep06 fix round 2 rules), word lookups, the
// hook spans and the camera's identity pose. Every frame comes from ../../timing (group-local), so the hook follows
// the real voice.
// ===========================================================================
import React from "react";
import { EASE, KineticCaption, captionHeight, prog, theme, zoomAt, type CapStyle, type CapWord } from "../../../paperstudio";
import { useGroupShots, useShot, useWords, type Span, type Word } from "../../timing";

// ------------------------------------------------------------------ words
const PROPER: Record<string, string> = { github: "GitHub", ai: "AI", claude: "Claude" };
/** caption text for a spoken word: no surrounding punctuation, lower case except names */
export const cleanWord = (w: string) => {
  const t = w.replace(/^[^\w$]+/, "").replace(/[.,!?;:]+$/g, "");
  return PROPER[t.toLowerCase()] ?? t.toLowerCase();
};
/** first word matching re (on the cleaned word, case-insensitive by the caller's regex), at or after frame `after` */
export const findWord = (ws: Word[], re: RegExp, after = -Infinity): Word | undefined => ws.find((w) => w.f >= after && re.test(cleanWord(w.w)));

/** caption tokens for a list of spoken words; style decides each word's look (null drops it) */
export const toLine = (ws: Word[], style: (word: string, i: number) => CapStyle | null = () => "reg"): CapWord[] => {
  const out: CapWord[] = [];
  ws.forEach((w, i) => {
    const t = cleanWord(w.w);
    const s = style(t, i);
    if (s) out.push({ t, s, at: w.f });
  });
  return out;
};

/** set the style of the tokens matching re */
export const restyle = (line: CapWord[], re: RegExp, s: CapStyle): CapWord[] => line.map((tk) => (typeof tk.t === "string" && re.test(tk.t) ? { ...tk, s } : tk));

/** capitalise the first token */
export const cap1 = (line: CapWord[]): CapWord[] =>
  line.map((tk, i) => (i === 0 && typeof tk.t === "string" ? { ...tk, t: tk.t.charAt(0).toUpperCase() + tk.t.slice(1) } : tk));

// ------------------------------------------------------------------ timing
/** the hook's shots, its end and the hand-off start (group-local); a missing shot falls back to an even split so a
 *  still never crashes. `handoff` = frames of the hand-off, cut to the pause after the last word (at least `minAfter`
 *  frames after it starts). */
export const useHook = (ids: string[], handoff: number) => {
  const all = useGroupShots("HA");
  const spans = ids.map((id, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useShot(id);
    return s ?? ({ id, kind: "spoken", text: "", start: i * 40, end: i * 40 + 40, dur: 40, parts: [{ id, start: i * 40, end: i * 40 + 40 }], merged: [] } as Span);
  });
  const end = all.length ? all[all.length - 1].end : spans[spans.length - 1].end;
  const words = useWords({ from: 0, to: end });
  return { spans, end, words, ho: end - handoff };
};

/** start of the n-th part of a split shot (or `fallback` frames into the shot when it is not split) */
export const partStart = (sp: Span, n: number, fallback: number) => (sp.parts[n] ? sp.parts[n].start : sp.start + fallback);

// ------------------------------------------------------------------ captions
/** caption block bottom in hud px (the shell pads by 0.9 about the safe-box centre: about y 1232 on screen) */
export const CAP_BOTTOM = 1284;
/** hud drawn at the shell's 0.9 pad: 1.667 gives connectors 60, bold italic 96 px on screen (STYLE UPLIFT: the top of
 *  the skill's range) */
export const CAP_SCALE = 1.667;
const CAP_GAP = 4;

/**
 * Caption blocks that replace each other on the voice (ep06/ep07 HA rules):
 * - a word never appears before it is spoken; it may only be delayed (at most 5 frames) when the block before it
 *   must clear first;
 * - a block is completely gone (5-frame fade, in place) before the next block's first word appears, and its last
 *   word stays at least 6 frames;
 * - each block is laid out at its final height from its first frame (its bottom at `y`).
 * The last block leaves at `lastExit`.
 */
export const CaptionBlocks: React.FC<{ f: number; blocks: CapWord[][][]; y?: number; lastExit?: number }> = ({ f, blocks, y = CAP_BOTTOM, lastExit }) => {
  const firstAt = (b: CapWord[][]) => Math.min(...b.flat().map((w) => w.at));
  const lastAt = (b: CapWord[][]) => Math.max(...b.flat().map((w) => w.at));
  const live = blocks.map((b, i) => ({ b: b.filter((l) => l.length), i })).filter(({ b }) => b.flat().length);
  const starts: number[] = [];
  const exits: number[] = [];
  live.forEach(({ b }, j) => {
    const start = j === 0 ? firstAt(b) : Math.max(firstAt(b), exits[j - 1] + 5);
    starts.push(start);
    const last = Math.max(lastAt(b), start);
    const next = live[j + 1];
    if (next) {
      const nr = firstAt(next.b);
      exits.push(Math.min(Math.max(last + 6, nr - 4), nr + 1));
    } else exits.push(lastExit ?? Infinity);
  });
  return (
    <>
      {live.map(({ b, i }, j) => {
        const start = starts[j];
        const exitAt = exits[j];
        const leaves = exitAt < Infinity;
        if (f < start - 1 || (leaves && f >= exitAt + 5)) return null;
        const lines = b.map((l) => strut(l.map((tk) => (tk.at < start ? { ...tk, at: start } : tk))));
        const top = y - captionHeight(lines, CAP_GAP, CAP_SCALE);
        const laneO = prog(f, start - 1, start + 7, EASE.travel) * (leaves ? 1 - prog(f, exitAt, exitAt + 5, EASE.travel) : 1);
        return (
          <React.Fragment key={i}>
            {/* a faint white paper lane behind the line, so the words sit on their own space over the grid */}
            {laneO > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: 540 - laneW(lines) / 2,
                  top: top - 6,
                  width: laneW(lines),
                  height: y - top + 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.42)",
                  boxShadow: "0 0 30px 12px rgba(255,255,255,.38)",
                  opacity: laneO,
                }}
              />
            ) : null}
            <KineticCaption
              lines={lines}
              y={top}
              x={20}
              w={1040}
              align="center"
              scale={CAP_SCALE}
              anchor="top"
              lineGap={CAP_GAP}
              cluster={999}
              exit={leaves ? { at: exitAt, dur: 5, to: "fade" } : undefined}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

/** an estimate of a caption block's widest line in hud px (Inter: about 0.52 em per character upright, 0.6 em bold
 *  italic, 0.32 em between words) plus the lane's padding */
const laneW = (lines: CapWord[][]) => {
  const w = Math.max(
    ...lines.map((l) =>
      l.reduce((a, tk) => {
        if (typeof tk.t !== "string") return a;
        const st = theme.caption[tk.s ?? "reg"];
        const em = st.size * CAP_SCALE;
        return a + tk.t.length * em * (st.italic || st.weight >= 700 ? 0.6 : 0.52) + 0.32 * em;
      }, 0),
    ),
  );
  return Math.min(1040, w + 90);
};

/** top of a caption block in hud px (to keep the world clear of it) */
export const capTop = (lines: CapWord[][]) => CAP_BOTTOM - captionHeight(lines.filter((l) => l.length), CAP_GAP, CAP_SCALE);

/**
 * A line mixing styles gets an invisible strut token in its biggest style from its first frame (ep07 HA): the kit
 * lays a caption row out on the baseline of the words already shown, so without it the small words drop when the big
 * key phrase arrives. It goes last with w = -gap, so its slot is 0: the line's centring and width are unchanged.
 */
const STRUT_GAP = 20;
const strut = (line: CapWord[]): CapWord[] => {
  if (line.length < 2) return line;
  const st = (tk: CapWord) => tk.s ?? "reg";
  if (line.every((tk) => st(tk) === st(line[0]))) return line;
  const size = (tk: CapWord) => theme.caption[st(tk)].size;
  const big = line.reduce((a, tk) => (size(tk) > size(a) ? tk : a), line[0]);
  const s: CapStyle = line.some((tk) => st(tk) === "bar") ? "bold" : st(big);
  return [...line, { t: <span style={{ display: "inline-block", width: 0 }} />, w: -STRUT_GAP, s, at: Math.min(...line.map((tk) => tk.at)) }];
};

// ------------------------------------------------------------------ camera
/** the hook camera's identity pose (kit Camera, box "hook": anchor 540 x 854) */
export const HOOK_ID = { x: 540, y: 854, zoom: 1 };
/** zoomAt about p in the hook box, then lean the focal `lean` px sideways (a lateral track) */
export const hookPose = (p: { x: number; y: number }, zoom: number, lean = 0) => {
  const z = zoomAt(p, zoom, "hook");
  return { ...z, x: z.x + lean };
};
