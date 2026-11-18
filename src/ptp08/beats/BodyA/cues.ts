// BodyA cues: every frame BodyA uses, from timing.ts (group-local), never hard-coded. Shots that are missing in a
// variant fall back to an even split so a still never crashes; words fall back to an offset inside their shot.
import { useShot, useWords, type Span, type Word } from "../../timing";
import { findWord } from "./captions";

export const IDS = [
  "A01a",
  "A02a",
  "A03a",
  "A04a",
  "A05a",
  "A05b",
  "A06a",
  "A07a",
  "A07b",
  "A08a",
  "A08b",
  "A09a",
  "A09b",
  "A10a",
  "A10b",
  "A11a",
  "A11b",
  "A12a",
  "A12b",
  "A13a",
  "A14a",
  "A14b",
  "A15a",
  "A15x",
] as const;
export type BodyAId = (typeof IDS)[number];

export type Cues = {
  s: Record<BodyAId, Span>;
  w: Record<BodyAId, Word[]>;
  /** first word in shot `id` matching re (or the shot start + fallback) */
  at: (id: BodyAId, re: RegExp, fb?: number, after?: number) => number;
  /** the n-th spoken word of a shot (or the shot start + fallback) */
  nth: (id: BodyAId, n: number, fb?: number) => number;
  /** the part boundaries of a shot (starts of parts 2..n) */
  cuts: (id: BodyAId) => number[];
  /** frame of the last spoken word of a shot (its start) */
  last: (id: BodyAId) => number;
  end: number;
};

export const useCues = (): Cues => {
  const spans = {} as Record<BodyAId, Span>;
  const words = {} as Record<BodyAId, Word[]>;
  IDS.forEach((id, i) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useShot(id);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    words[id] = useWords(id);
    spans[id] = s ?? ({ id, kind: "spoken", text: "", start: i * 80, end: i * 80 + 80, dur: 80, parts: [{ id, start: i * 80, end: i * 80 + 80 }], merged: [] } as Span);
  });
  const at = (id: BodyAId, re: RegExp, fb = 4, after = -Infinity) => findWord(words[id], re, after)?.f ?? spans[id].start + fb;
  const nth = (id: BodyAId, n: number, fb = 4) => words[id][n]?.f ?? spans[id].start + fb;
  const cuts = (id: BodyAId) => spans[id].parts.slice(1).map((p) => p.start);
  const last = (id: BodyAId) => {
    const ws = words[id];
    return ws.length ? ws[ws.length - 1].f : spans[id].end - 10;
  };
  return { s: spans, w: words, at, nth, cuts, last, end: spans.A15x.end };
};
