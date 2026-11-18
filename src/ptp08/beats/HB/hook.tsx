// ===========================================================================
// HB local helpers (ep08 hook 2 "fear of loss"). Not kit. Everything reads the
// timeline through ../../timing, so the hook follows the real voice: shot
// spans, word frames and the hand-off into each body's first card.
// Caption logic is the ep07 HB version (ep06 fix round 2): a word never
// appears before it is spoken, a block is fully gone before the next block's
// first word, blocks are laid out at their final height.
// ===========================================================================
import React from "react";
import { getStaticFiles, staticFile } from "remotion";
import { EASE, prog, zoomAt, type CapStyle, type CapWord } from "../../../paperstudio";
import { SmoothCaption, smoothCaptionHeight } from "../Shared/smoothCaption";
import { useGroupShots, useShot, useWords, type Span, type Word } from "../../timing";

// ------------------------------------------------------------------ assets (copied into public/ptp08/HB)
let present: Set<string> | null = null;
const has = (p: string) => {
  if (!present) {
    try {
      present = new Set((getStaticFiles() ?? []).map((f) => f.name.replace(/\\/g, "/")));
    } catch {
      present = new Set();
    }
  }
  return present.has(p);
};
/** URL of a bundled public file, or null while it is missing (a drawn fallback is used) */
export const pub = (path: string): string | null => (has(path) ? staticFile(path) : null);
/** URL of one of HB's copied assets (github.svg = GitHub's own Invertocat, claude.svg, eraser.png) */
export const hbAsset = (name: string): string | null => pub(`ptp08/HB/${name}`);
/** the kit's laptop cut-out: the same file BodyC's first card draws, so the C hand-off lands on identical pixels */
export const kitLaptop = (): string | null => pub("paperstudio/photos/laptop.png");

// ------------------------------------------------------------------ captions
/** caption block bottom in hud px (the shell pads by 0.9 about the safe-box centre: about y 1232 on screen) */
export const CAP_BOTTOM = 1284;
/** hud scale (STYLE UPLIFT: the top of the skill's range): on screen connectors 60, bold italic 96, black bar 66 px
 *  (the shell's 0.9 pad included) */
export const CAP_SCALE = 1.667;
export const CAP_GAP = 4;

const PROPER: Record<string, string> = { github: "GitHub", ai: "AI", claude: "Claude" };

/** caption text for a spoken word: no trailing punctuation, lower case except names */
export const cleanWord = (w: string) => {
  const t = w.replace(/^[^\w']+/, "").replace(/[.,!?;:]+$/g, "");
  return PROPER[t.toLowerCase()] ?? t.toLowerCase();
};

/** first word matching re (on the cleaned word, case-insensitive), optionally at or after frame `after` */
export const findWord = (ws: Word[], re: RegExp, after = -Infinity): Word | undefined => ws.find((w) => w.f >= after && re.test(cleanWord(w.w).toLowerCase()));

/** spoken words of a shot as caption tokens; style decides each word's look (null drops it) */
export const useLine = (id: string, style: (word: string, i: number) => CapStyle | null = () => "reg"): CapWord[] => {
  const ws = useWords(id);
  const out: CapWord[] = [];
  ws.forEach((w, i) => {
    const t = cleanWord(w.w);
    const s = style(t.toLowerCase(), i);
    if (s) out.push({ t, s, at: w.f });
  });
  return out;
};

/** capitalise the first token */
export const cap1 = (line: CapWord[]): CapWord[] =>
  line.map((tk, i) => (i === 0 && typeof tk.t === "string" ? { ...tk, t: tk.t.charAt(0).toUpperCase() + tk.t.slice(1) } : tk));

/** split a line into [before, from] at the first token matching re (case-insensitive); no match: [line, []] */
export const splitAt = (line: CapWord[], re: RegExp): [CapWord[], CapWord[]] => {
  const i = line.findIndex((tk) => typeof tk.t === "string" && re.test(tk.t.toLowerCase()));
  return i < 0 ? [line, []] : [line.slice(0, i), line.slice(i)];
};

/** set the style of the tokens matching re (case-insensitive) */
export const restyle = (line: CapWord[], re: RegExp, s: CapStyle): CapWord[] => line.map((tk) => (typeof tk.t === "string" && re.test(tk.t.toLowerCase()) ? { ...tk, s } : tk));

/** frames a caption block takes to fade out (SMOOTHNESS: nothing under 5-6 frames on text); the next block waits for it */
const FADE = 6;

/**
 * Caption blocks that replace each other on the voice, for the Camera's hud, drawn with BA's shared SmoothCaption:
 * - a word never appears before it is spoken; a block's first word lands on its spoken frame, at most 3 frames after;
 * - the block before fades out over FADE frames (in-out) and is gone before the next block's first word;
 * - every word holds its slot from the block's first frame, so the baseline and the centring never move;
 * - a faint white paper lane sits behind each block. The last block leaves at `lastExit`.
 */
export const CaptionBlocks: React.FC<{ f: number; blocks: CapWord[][][]; y?: number; lastExit?: number }> = ({ f, blocks, y = CAP_BOTTOM, lastExit }) => {
  const firstAt = (b: CapWord[][]) => Math.min(...b.flat().map((w) => w.at));
  const lastAt = (b: CapWord[][]) => Math.max(...b.flat().map((w) => w.at));
  const live = blocks.map((b, i) => ({ b: b.filter((l) => l.length), i })).filter(({ b }) => b.flat().length);
  // RED TEAM RT-HB-4: a block's first word lands on its spoken frame, at most 3 frames after it (when the block before
  // needs that long to show its last word for 6 frames); the block before has faded out completely by then
  const starts: number[] = live.map(({ b }, j) => {
    if (j === 0) return firstAt(b);
    const nr = firstAt(b);
    return Math.min(nr + 3, Math.max(nr, lastAt(live[j - 1].b) + 6 + FADE));
  });
  const exits: number[] = live.map((_, j) => (j < live.length - 1 ? starts[j + 1] - FADE : (lastExit ?? Infinity)));
  return (
    <>
      {live.map(({ b, i }, j) => {
        const start = starts[j];
        const exitAt = exits[j];
        const leaves = exitAt < Infinity;
        if (f < start - 1 || (leaves && f >= exitAt + FADE)) return null;
        const lines = b.map((l) => l.map((tk) => (tk.at < start ? { ...tk, at: start } : tk)));
        const hgt = smoothCaptionHeight(lines, CAP_GAP, CAP_SCALE);
        const lo = (f < start ? 0 : prog(f, start - 1, start + 9, EASE.cam)) * (leaves ? 1 - prog(f, exitAt, exitAt + FADE, EASE.cam) : 1);
        return (
          <React.Fragment key={i}>
            {/* a faint paper lane behind the words, so they read on the busy grid */}
            {lo > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  width: 1020,
                  top: y - hgt - 26,
                  height: hgt + 44,
                  background: "radial-gradient(ellipse 50% 50% at 50% 52%, rgba(255,255,255,.78) 0%, rgba(255,255,255,.55) 55%, rgba(255,255,255,0) 100%)",
                  opacity: lo,
                }}
              />
            ) : null}
            {/* RED TEAM RT-HB-3: BA's shared SmoothCaption lays every word out from the block's first frame (unspoken words
                hold their slot invisibly), so the baseline and the centring never move when a bold word lands */}
            <SmoothCaption lines={lines} x={20} y={y - hgt} w={1040} scale={CAP_SCALE} lineGap={CAP_GAP} align="center" exit={leaves ? { at: exitAt, dur: FADE } : undefined} />
          </React.Fragment>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ timing
const SHOTS = ["HB1", "HB2", "HB3", "HB4"] as const;
export type HbShot = (typeof SHOTS)[number];
/** frames of the hand-off (one continuous tip-over onto the body's first card, SMOOTHNESS rule 9), counted back from the
 *  hook's end: the silent pause plus the tail of the last word */
export const HANDOFF_LEN = 20;

/** the hook's shots and its end (group-local); a missing shot falls back to an even split so a still never crashes */
export const useHookSpans = () => {
  const all = useGroupShots("HB");
  const spans = {} as Record<HbShot, Span>;
  SHOTS.forEach((id, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useShot(id);
    spans[id] = s ?? ({ id, kind: "spoken", text: "", start: i * 50, end: i * 50 + 50, dur: 50, parts: [{ id, start: i * 50, end: i * 50 + 50 }], merged: [] } as Span);
  });
  const end = all.length ? all[all.length - 1].end : spans.HB4.end;
  return { s: spans, end, ho: end - HANDOFF_LEN };
};

/** start of the n-th part of a split shot (or a frame `fallback` into the shot when it is not split) */
export const partStart = (sp: Span, n: number, fallback: number) => (sp.parts[n] ? sp.parts[n].start : sp.start + fallback);

// ------------------------------------------------------------------ camera
/** the hook camera's identity pose (kit Camera, box "hook": anchor 540 x 854) */
export const HOOK_ID = { x: 540, y: 854, zoom: 1 };
/** zoomAt about p in the hook box, then lean the focal `lean` px sideways (a lateral track) */
export const hookPose = (p: { x: number; y: number }, zoom: number, lean = 0) => {
  const z = zoomAt(p, zoom, "hook");
  return { ...z, x: z.x + lean };
};
