// BodyB cues (ep08, copied from ep07 BB and adapted): every frame this beat uses comes from ../../timing (group-local), never hard-coded.
// Words are found inside a shot by their normalised text (case and punctuation ignored, number words also
// matched as digits), so the cues survive a re-cut voice. A missing word falls back to its position in the
// storyboard text spread over the shot (never fires on a healthy timeline).
import { useGroupShots, useWords, type Span, type Word } from "../../timing";

export const SHOTS = [
  "B01a", "B01b", "B02a", "B03a", "B03b", "B04a", "B04b", "B05a", "B05b", "B06a", "B06b",
  "B07a", "B07b", "B08a", "B09a", "B09b", "B10a", "B10x",
] as const;
export type ShotId = (typeof SHOTS)[number];

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export type Cues = {
  /** shots, all parts merged (group-local) */
  s: Record<ShotId, Span>;
  /** group length in frames */
  len: number;
  /** all words of the group (group-local) */
  all: Word[];
  /** start frame of a spoken word inside a shot: keys are alternatives ("nine" or "9"); n = the nth match */
  w: (shot: ShotId, keys: string | string[], n?: number) => number;
  /** end frame of that word */
  e: (shot: ShotId, keys: string | string[], n?: number) => number;
  /** start of the n-th part of a shot (or its start) */
  part: (shot: ShotId, n: number) => number;
  /** every part start of a shot after the first (the split boundaries) */
  bounds: (shot: ShotId) => number[];
};

export const useBBCues = (): Cues => {
  const shots = useGroupShots("BodyB");
  const len = shots.length ? shots[shots.length - 1].end : 1891;
  const all = useWords({ from: -30, to: len + 30 });

  const byId: Record<string, Span> = {};
  for (const sp of shots) byId[sp.id] = sp;
  const s = {} as Record<ShotId, Span>;
  for (const id of SHOTS) {
    if (byId[id]) {
      s[id] = byId[id];
      continue;
    }
    const host = shots.find((h) => h.merged.some((m) => m.id === id));
    if (host) {
      const a = host.merged.find((m) => m.id === id)!.f;
      s[id] = { ...host, id, start: a, dur: host.end - a, parts: [{ id, start: a, end: host.end }], merged: [], mergedInto: host.id };
      continue;
    }
    const prevId = SHOTS[SHOTS.indexOf(id) - 1];
    const st = prevId ? s[prevId].end : 0;
    s[id] = { id, kind: "spoken", text: "", start: st, end: st + 30, dur: 30, parts: [{ id, start: st, end: st + 30 }], merged: [] };
  }

  const inShot = (id: ShotId) => {
    const sp = s[id];
    return all.filter((w) => w.f >= sp.start - 1 && w.f < sp.end);
  };
  const find = (id: ShotId, keys: string | string[], n = 0): Word | null => {
    const ks = (Array.isArray(keys) ? keys : [keys]).map(norm);
    let k = 0;
    for (const wd of inShot(id)) {
      const t = norm(wd.w);
      if (ks.some((x) => t === x || (x.length > 2 && /^\d/.test(x) && t.startsWith(x)))) {
        if (k === n) return wd;
        k++;
      }
    }
    return null;
  };
  const guess = (id: ShotId, keys: string | string[], n = 0) => {
    const sp = s[id];
    const toks = (sp.text || "").split(/\s+/).map(norm).filter(Boolean);
    const ks = (Array.isArray(keys) ? keys : [keys]).map(norm);
    let k = 0;
    let idx = -1;
    for (let i = 0; i < toks.length; i++)
      if (ks.includes(toks[i])) {
        if (k === n) {
          idx = i;
          break;
        }
        k++;
      }
    const frac = idx < 0 ? 0.5 : idx / Math.max(1, toks.length);
    return Math.round(sp.start + 2 + frac * (sp.dur - 4));
  };
  const w = (id: ShotId, keys: string | string[], n = 0) => find(id, keys, n)?.f ?? guess(id, keys, n);
  const e = (id: ShotId, keys: string | string[], n = 0) => {
    const hit = find(id, keys, n);
    return hit ? Math.max(hit.f + 3, hit.e) : guess(id, keys, n) + 8;
  };
  const part = (id: ShotId, n: number) => (s[id].parts[n] ? s[id].parts[n].start : s[id].start);
  const bounds = (id: ShotId) => s[id].parts.slice(1).map((p) => p.start);
  return { s, len, all, w, e, part, bounds };
};
