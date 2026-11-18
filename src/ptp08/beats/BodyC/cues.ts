// BodyC cues: every frame the beat uses comes from ../../timing (group-local), never hard-coded.
// Shots by storyboard id (all parts merged, `parts` lists the split parts); words found by walking the spoken words
// of a shot in order (case, punctuation and apostrophes ignored), so the cues survive the real voice. A word that is
// not found falls back to its position in the storyboard text spread over the shot (never on a healthy timeline).
import { isYT, useGroupShots, useVariant, useWords, type Span, type Word } from "../../timing";

export const SHOTS = ["C01a", "C01b", "C02a", "C03a", "C04a", "C04b", "C05a", "C06a", "C07a", "C07b", "C08a", "C08b", "C09a", "C10a", "C10x"] as const;
export type ShotId = (typeof SHOTS)[number];

/** normalise a spoken word: lowercase letters and digits only ("Tuesday's" -> "tuesdays") */
export const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, "");

export type BC = {
  /** group length in frames */
  len: number;
  yt: boolean;
  s: Record<ShotId, Span>;
  /** spoken words inside a shot (group-local) */
  ws: (id: ShotId) => Word[];
  /** the nth spoken word in a shot matching `tok` ("nine|9" = alternatives), or undefined */
  word: (id: ShotId, tok: string, nth?: number) => Word | undefined;
  /** start frame of that word (fallback: its place in the storyboard text over the shot) */
  at: (id: ShotId, tok: string, nth?: number) => number;
  /** end frame of that word */
  end: (id: ShotId, tok: string, nth?: number) => number;
  /** start of the n-th part of a split shot (the shot start when it has fewer parts) */
  part: (id: ShotId, n: number) => number;
};

const STUB = (id: string, start: number, dur = 30): Span => ({ id, kind: "spoken", text: "", start, end: start + dur, dur, parts: [{ id, start, end: start + dur }], merged: [] });

export const useBodyC = (): BC => {
  const shots = useGroupShots("BodyC");
  const v = useVariant();
  const len = shots.length ? shots[shots.length - 1].end : 1757;
  const all = useWords({ from: 0, to: len + 1 });

  const byId: Record<string, Span> = {};
  for (const s of shots) byId[s.id] = s;
  const s = {} as Record<ShotId, Span>;
  let prevEnd = 0;
  for (const id of SHOTS) {
    if (byId[id]) s[id] = byId[id];
    else {
      const host = shots.find((h) => h.merged.some((m) => m.id === id));
      if (host) {
        const a = host.merged.find((m) => m.id === id)!.f;
        s[id] = { ...host, id, start: a, dur: host.end - a, parts: [{ id, start: a, end: host.end }], merged: [], mergedInto: host.id };
      } else s[id] = STUB(id, prevEnd);
    }
    prevEnd = s[id].end;
  }

  const ws = (id: ShotId) => all.filter((w) => w.f >= s[id].start && w.f < s[id].end);
  const word = (id: ShotId, tok: string, nth = 0) => {
    const alts = tok.split("|").map(norm);
    let k = 0;
    for (const w of ws(id)) {
      if (alts.indexOf(norm(w.w)) >= 0) {
        if (k === nth) return w;
        k++;
      }
    }
    return undefined;
  };
  const fallback = (id: ShotId, tok: string, nth: number) => {
    const sp = s[id];
    const text = sp.text.split(/\s+/).map(norm).filter(Boolean);
    const alts = tok.split("|").map(norm);
    let k = 0;
    let idx = -1;
    for (let i = 0; i < text.length; i++)
      if (alts.indexOf(text[i]) >= 0) {
        if (k === nth) {
          idx = i;
          break;
        }
        k++;
      }
    const frac = idx < 0 || !text.length ? 0.5 : idx / text.length;
    return Math.round(sp.start + 2 + frac * (sp.dur - 4));
  };
  const at = (id: ShotId, tok: string, nth = 0) => word(id, tok, nth)?.f ?? fallback(id, tok, nth);
  const end = (id: ShotId, tok: string, nth = 0) => {
    const w = word(id, tok, nth);
    return w ? Math.max(w.f + 2, w.e) : fallback(id, tok, nth) + 6;
  };
  const part = (id: ShotId, n: number) => (s[id].parts[n] ? s[id].parts[n].start : s[id].start);
  return { len, yt: isYT(v), s, ws, word, at, end, part };
};
