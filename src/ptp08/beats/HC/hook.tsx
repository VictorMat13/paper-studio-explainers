// ===========================================================================
// HC shared helpers (local to HC; not kit): caption tokens from the real voice words, the caption blocks, the hook
// span and hand-off timing, the hook camera poses and the flip maths. Adapted from ep07 HC's hook.tsx (the ep06
// fix-round-2 caption rules: a word never shows before it is said, a block is fully gone before the next one lands,
// blocks are laid out at their final height from their first frame).
// ===========================================================================
import React from "react";
import { Easing } from "remotion";
import { EASE, mix, prog, zoomAt, type CapStyle, type CapWord } from "../../../paperstudio";
import { SmoothCaption, smoothCaptionHeight } from "../Shared/smoothCaption";
import { useGroupShots, useShot, useTiming, useWords, type GroupId, type Span, type Word } from "../../timing";

/** caption block bottom in hud px (the shell pads by 0.9 about the safe-box centre: about y 1232 on screen) */
export const CAP_BOTTOM = 1284;
/** caption scale: the hud is drawn at the shell's 0.9 pad, so 1.6 gives connectors 58, bold italic 92 px on screen */
export const CAP_SCALE = 1.6;
/** frames of the hand-off (the page turning onto the body's first card), at the very end of the group: the 11 silent
 *  frames plus the tail of "mean." (SMOOTHNESS: one continuous eased motion of 18 frames, landing at rest) */
export const HANDOFF_LEN = 18;
/** caption block fade out (SMOOTHNESS: nothing under 6-8 frames) */
export const CAP_EXIT = 6;

/** SMOOTHNESS easing: cubic in-out, zero velocity at both ends (entrances, pops); EASE.travel for moves */
export const IO = Easing.bezier(0.4, 0, 0.2, 1);
/** a there-and-back bump 0 -> 1 -> 0 with zero velocity at both ends and at the peak (hops, squashes, settles) */
export const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : (1 - Math.cos(2 * Math.PI * t)) / 2);

const PROPER = new Set(["AI", "Claude"]);

/** caption text for a spoken word: no trailing punctuation, lower case except names */
export const cleanWord = (w: string) => {
  const t = w.replace(/[.,!?;:]+$/g, "");
  return PROPER.has(t) ? t : t.toLowerCase();
};

/** first word matching re (on the cleaned word, case-insensitive) at or after `after` */
export const findWord = (ws: Word[], re: RegExp, after = -Infinity): Word | undefined => ws.find((w) => w.f >= after && re.test(cleanWord(w.w).toLowerCase()));

/** the hook's shots, its end (the group's last frame + 1, group-local) and the hand-off start */
export const useHook = (group: GroupId, ids: string[]) => {
  const t = useTiming();
  const all = useGroupShots(group);
  const spans = ids.map((id, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useShot(id);
    return s ?? ({ id, kind: "spoken", text: "", start: i * 40, end: i * 40 + 40, dur: 40, parts: [{ id, start: i * 40, end: i * 40 + 40 }], merged: [] } as Span);
  });
  const g = t.groups.find((x) => x.id === group);
  const end = g ? g.end - g.start : all.length ? all[all.length - 1].end : spans[spans.length - 1].end;
  return { spans, end, ho: end - HANDOFF_LEN };
};

/** spoken words of a shot as caption tokens; style decides each word's look (null drops it) */
export const useLine = (id: string, style: (word: string, i: number) => CapStyle | null = () => "reg"): CapWord[] => {
  const ws = useWords(id);
  const out: CapWord[] = [];
  ws.forEach((w, i) => {
    const t = cleanWord(w.w);
    const s = style(t, i);
    if (s) out.push({ t, s, at: w.f });
  });
  return out;
};

/** capitalise the first token (a sentence start) */
export const cap1 = (line: CapWord[]): CapWord[] =>
  line.map((tk, i) => (i === 0 && typeof tk.t === "string" ? { ...tk, t: tk.t.charAt(0).toUpperCase() + tk.t.slice(1) } : tk));

/** set the style of the tokens matching re */
export const restyle = (line: CapWord[], re: RegExp, s: CapStyle): CapWord[] => line.map((tk) => (typeof tk.t === "string" && re.test(tk.t) ? { ...tk, s } : tk));

/** keep only the tokens matching re */
export const only = (line: CapWord[], re: RegExp): CapWord[] => line.filter((tk) => typeof tk.t === "string" && re.test(tk.t));

/**
 * Caption blocks that replace each other on the voice (in the Camera's hud):
 * - a word never appears before it is spoken; it may only be delayed (at most 5 frames) when the block before it
 *   must clear first (so a block's last word is never faded out before it is readable);
 * - a block is completely gone (3-frame fade, in place) before the next block's first word appears;
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
    const start = j === 0 ? firstAt(b) : Math.max(firstAt(b), exits[j - 1] + CAP_EXIT + 1);
    starts.push(start);
    const last = Math.max(lastAt(b), start);
    const next = live[j + 1];
    if (next) {
      const nr = firstAt(next.b);
      // the old block is gone before the new one's first word shows, and the new block starts at most 5 frames after
      // its first spoken word (RED TEAM limit about 6); where the voice leaves less room than a readable last word plus
      // a 6-frame fade ("AI" 27 -> "keeps" 34, "words" 144 -> "actually" 153), the last word keeps 5-6 readable frames
      exits.push(Math.min(Math.max(last + 8, nr - CAP_EXIT - 1), nr - 2));
    } else exits.push(lastExit ?? Infinity);
  });
  return (
    <>
      {live.map(({ b, i }, j) => {
        const start = starts[j];
        const exitAt = exits[j];
        const leaves = exitAt < Infinity;
        if (f < start - 1 || (leaves && f >= exitAt + CAP_EXIT)) return null;
        const lines = b.map((l) => l.map((tk) => (tk.at < start ? { ...tk, at: start } : tk)));
        const ch = smoothCaptionHeight(lines, 4, CAP_SCALE);
        // the caption's own paper lane: a faint white band behind the words, in with the first word, out with the block
        const laneO = prog(f, start - 1, start + 7, IO) * (leaves ? 1 - prog(f, exitAt, exitAt + CAP_EXIT, IO) : 1);
        return (
          <React.Fragment key={i}>
            {laneO > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: 40,
                  width: 1000,
                  top: y - ch - 14,
                  height: ch + 22,
                  borderRadius: 32,
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.66) 16%, rgba(255,255,255,.66) 84%, rgba(255,255,255,0) 100%)",
                  filter: "blur(3px)",
                  opacity: laneO,
                }}
              />
            ) : null}
          {/* BA's shared SmoothCaption (RT-HC-1): every line laid out at its final width from the block's first frame, so
              no baseline snap or re-centring when a bold word lands; words ease in over 12 frames */}
          <SmoothCaption lines={lines} y={y - ch} x={20} w={1040} scale={CAP_SCALE} lineGap={4} align="center" exit={leaves ? { at: exitAt, dur: CAP_EXIT } : undefined} />
          </React.Fragment>
        );
      })}
    </>
  );
};

/** the hook camera's identity pose (kit Camera, box "hook": anchor 540 x 854) */
export const HOOK_ID = { x: 540, y: 854, zoom: 1 };
/** zoomAt about p in the hook box, then lean the focal `lean` px sideways (a lateral track) */
export const hookPose = (p: { x: number; y: number }, zoom: number, lean = 0) => {
  const z = zoomAt(p, zoom, "hook");
  return { ...z, x: z.x + lean };
};

export type Rect = { x: number; y: number; w: number; h: number };
/**
 * The hand-off as ONE continuous eased motion (SMOOTHNESS rule 9): over [ho, end - 1] the hook's page and the body's
 * first card share one path (centre and width, from the page's to the card's), eased in-out (EASE.travel) so it
 * starts and lands at rest. The card rides UNDER the page, turning in from -10 deg and fading in over the first 9
 * frames; the page on top turns away (0 -> `ang` deg), shrinks a little inside the card's outline and fades out over
 * frames 2-12 (a 10-frame dissolve, both moving, never edge-on, so no frame is a sliver or empty). On the last hook
 * frame the card is full size, flat, opaque and at rest.
 */
export const turnHandoff = (f: number, ho: number, end: number, r: Rect, target: { x: number; y: number; w: number }, ang = 28) => {
  const u = prog(f, ho, end - 1, EASE.travel);
  // the downward part of the path starts 4 frames later (same landing frame, still eased in-out), so the card's lower
  // edge stays above the caption band until the last caption has gone
  const uy = prog(f, ho + 4, end - 1, EASE.travel);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const W = mix(r.w, target.w, u);
  const px = mix(cx, target.x, u);
  const py = mix(cy, target.y, uy);
  const objO = 1 - prog(f, ho + 2, ho + 12, IO);
  const cardO = prog(f, ho, ho + 9, IO);
  const objTf = `translate(${(px - cx).toFixed(3)}px,${(py - cy).toFixed(3)}px) perspective(2400px) rotateY(${(ang * u).toFixed(3)}deg) scale(${((W / r.w) * mix(1, 0.86, u)).toFixed(5)})`;
  const cardTf = `translate(${(px - target.x).toFixed(3)}px,${(py - target.y).toFixed(3)}px) perspective(2400px) rotateY(${(-10 * (1 - u)).toFixed(3)}deg) scale(${(W / target.w).toFixed(5)})`;
  return { started: f >= ho, objShown: f < ho || objO > 0.001, cardShown: f >= ho, objO, cardO, objTf, cardTf, objOrigin: `${cx}px ${cy}px`, u };
};
