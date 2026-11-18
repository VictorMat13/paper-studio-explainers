#!/usr/bin/env python3
"""What GitHub actually is, ep08 (Paper Studio): storyboard shots + word timings -> src/ptp08/timeline.ts

Three hooks and three bodies, every hook with every body from the first generation (Victor 2026-11-07: "3 hooks 3
bodies"). A variant is (hook letter, body letter), hook letter first:
  hooks:  HA (H1 the reel's hook kept close), HB (H2 fear of loss), HC (H3 the words)
  bodies: BodyA (what it actually is), BodyB (the routine), BodyC (what goes wrong without it)
  the 9 Instagram videos A B C AB AC BA BC CA CB (A = HA + BodyA, AB = HA + BodyB ...) and the YouTube Shorts cut of
  each, AYT BYT CYT ABYT ACYT BAYT BCYT CAYT CBYT (subscribe CTA).
A combo's shots are its hook's storyboard shots, then its body's storyboard shots moved so the body starts where the
hook's own video's body starts (the same pause after the hook's last word): with storyboard ranges (provisional, the
12-frame pause) and with real timing alike. Output order: the nine Instagram videos, then their nine YT cuts.
Voice: E/timing/words_<v>.json + public/ptp08/vo/<v>.wav (VOICE-ASSEMBLE writes all 18) make a variant real. A combo
without its own words file but with its hook's and its body's is "joined" (provisional: true, the shell plays no
audio): its hook's words from words_<hook>.json up to that file's body_start, then its body's words from
words_<body>.json (words_<body>YT.json for a YT cut) from that file's body_start on, moved so the body's first word
sits where the hook's own body did. The two WAVs are joined the same way, sample-exact, for the onset envelope.

Every shot in storyboard/STORYBOARD.md is an anchor: its id (HA1, A07b ...), its spoken line (the first words are
the storyboard's "anchor phrase") and a lead (frames the picture lands before the word). The storyboard is parsed
on every run, so it stays the source of truth for the shot list (no shot count is hard-coded). The anchors are found
in the voice's word timings by aligning the whole storyboard text against the transcript (tolerant of
"twenty-five" / "twenty five" / "25", "GitHub" / "Git Hub", "Here's" / "Here is", "v1" / "v one", punctuation and
case), so a different Whisper spelling never breaks the build.

Storyboard layout: one "### A:" / "### B:" / "### C:" section per version, each with one "#### Hook group" and one
"#### Body group". Shot lines (extra " · " fields such as "beat X" or an "R2" tag are fine):
  **HA1** · f 0-38 (39) · beat HA · anchor "What actually is" · What actually is GitHub,
  **A07b** · f 680-795 (116) · beat A07 · anchor "you tell Claude" · you tell Claude to go back to the last ...
  **A15x** · f 2093-2132 (40) · beat CTA · (tail hold, no words)
Groups by id prefix: HA* -> HA, A* -> BodyA, HB* -> HB, B* -> BodyB, HC* -> HC, C* -> BodyC. A storyboard range is
the shot's spoken words; a gap before the next shot (the 12-frame pause after the hook, the 3 frames before the tail
hold) belongs to the shot before it (a shot ends where the next one starts, as with real timing).

Shot kinds:
  spoken  starts LEAD frames before its first word, ends where the next shot starts
  break   (blur break, no words; none in ep08's R1) the BREAK frames just before the next spoken shot, taken from the
          tail of the shot before it; it belongs to the group of the shot BEFORE it. ep08 has no group-edge breaks:
          the hook hands off into the body's first card, and the shell draws no blur. A builder can still put a
          break inside its own group with crossBreak.tsx.
  hold    (A15x, B10x, C10x: tail hold, no words) starts POST frames after the last word, HOLD frames long

CTA: the shot whose line starts with "Comment" (A15a, B10a, C10a; found by its text, never by the keyword) to the
last spoken shot. The YT cut swaps its text for "Subscribe to learn more about AI." (see YT below).

Body start: provisional = the storyboard's (12 frames after the hook's last word); real = the body's first word,
BODY_LEAD (0) frames before it, locked (the hook-to-body gap the assembler leaves goes to the hook). The hook's last
shot runs through that pause (its hand-off) and splits there when it is over MAX. Each run prints the hand-off pause,
measured from where the voice really stops (audio_end on the WAV), and warns under 10 frames.
If words_<v>.json carries "body_start" (s), the body's first anchor word is checked against it.

The 45-frame cap (Victor: no shot over 1.5 s) is met in this order, never by ignoring it:
  1. LEADS: per-shot lead overrides (the next shot lands earlier, in the pause, so a long shot ends sooner).
     AUTO_LEAD does this automatically on real timing: a spoken shot over MAX gives frames to the next spoken
     shot's lead (up to LEAD_MAX, and only while that shot stays under MAX), or lands later itself.
  2. SPLIT: anything still over MAX is split into parts (A07b.1, A07b.2 ...) and reported. Builders look shots up
     by storyboard id (A07b), which spans every part; put a visible change at each part boundary.
     Split points sit on word starts (minus LEAD), or on the end of the shot's last word when a pause follows it
     (the hook's hand-off), keeping every part between SHORT and MAX. Among those, the most even split wins, with
     a PHRASE_BONUS for each cut on a phrase boundary (after a comma or full stop, or after a pause of PAUSE_F+),
     and a FIGURE_PENALTY for each cut inside a spoken figure ("two | hundred", "twenty-five | million",
     "hundred | and twenty").
Shots under SHORT frames (blur breaks exempt) are reported. MERGE folds a short shot into the spoken shot before it
(one cut-list unit, so the cap counts them together); the merged id keeps a mark at its own anchor frame, so
useShot(id) still returns its span (from its mark to the unit's end).

Usage:
  python3 make_ep08_timeline.py                 real timings where E/timing/words_<variant>.json exists, a combo
                                                without one joined from its hook's and body's words (provisional),
                                                storyboard (provisional) ranges for the rest
  python3 make_ep08_timeline.py --provisional   storyboard ranges for all 18 (combos joined from the storyboard)
  python3 make_ep08_timeline.py --variants A,AB rebuild only these; every other variant is copied from timeline.json
  python3 make_ep08_timeline.py --check         print only, write nothing
  python3 make_ep08_timeline.py --table         also print every shot (id, frames, length, text)
  python3 make_ep08_timeline.py --out-dir DIR   write timeline.ts / .json to DIR instead (dry runs, diffs)
  python3 make_ep08_timeline.py --joined        combos joined from their hook's and body's words even when their own
                                                words file exists (a combo voice build still in progress)
  python3 make_ep08_timeline.py --md FILE       also write the timeline and split tables as markdown (for the
                                                completion note): every variant, every split of the home videos,
                                                and every body part count that differs behind another hook

Writes:
  <remotion>/src/ptp08/timeline.ts     (imported by the composition)
  <remotion>/src/ptp08/timeline.json   (same data, read by the dispatch/*.sh scripts)
Both are written next to the target and renamed over it (atomic), so a render bundling at that moment never reads
half a file.
"""
import argparse
import difflib
import json
import math
import re
import sys
from pathlib import Path

FPS = 30
WPS = 3.1  # the storyboard's provisional pace (words per second from the first word); used for the YT CTA
LEAD = 2  # frames a spoken shot lands before its first word
LEAD_MAX = 10  # AUTO_LEAD never lands a picture more than this many frames before its word
LEAD_MIN = 0  # ... nor after it
AUTO_LEAD = True
MAX = 45  # Victor: no shot over 1.5 s
BREAK = 8  # blur break length (kept for in-group breaks; ep08 R1 has none)
HOLD = 40  # tail hold after the last word (storyboard A15x, B10x, C10x)
POST = 3  # frames between the last word's end and the tail hold
SHORT = 10  # shots under this many frames are reported (too quick to read)
PHRASE_BONUS = 24  # frames of evenness a split gives up to cut on a phrase boundary
PAUSE_F = 5  # a silence of this many frames before a word makes it a phrase boundary (real timing)
FIGURE_PENALTY = 24  # frames of evenness a split gives up to keep a spoken figure whole ("nine | percent" is avoided)
UNITS = {"percent", "minutes", "dollars", "dollar", "trillion", "billion", "million", "thousand", "hundred"}
# ep08: Body C says "over two hundred and twenty-five million developers": a cut between two number words, or at the
# "and" inside a figure, splits it too (see figure_cut)
HANDOFF_BONUS = 100  # the hook's last shot splits at the pause after its last word whenever that fits (the hand-off part)
# ep08 final pass: a body behind another hook sits on frames shifted by a fraction of a frame, so near-equal split scores
# could tip the other way (AB's B01b.2 "tell Claude to set up" vs B's "tell Claude to set"). A combo's body split takes
# the cut words its home video took (same word, same place in the line) whenever they fit the cap there; this bonus
# per matching cut outweighs every other term, so a body's parts land on the same words behind every hook.
HOME_BONUS = 200
# Per-shot lead overrides (they win over AUTO_LEAD). None by id in ep08; see BODY_LEAD.
LEADS: dict = {}
# Real timing: each body's first shot (A01a, B01a, C01a) lands ON its first word, locked, so AUTO_LEAD can never eat the
# hook's hand-off pause. Its card is already full size on the hook's last frame (the hook hands off into it), so there
# is nothing to land early; the 2 frames go to the hook's hand-off (ep07 final pass 2026-11-05: 9 -> 11 audible frames).
BODY_LEAD = 0
# Short shots folded into the spoken shot before them (real timing only; skipped with a warning if the result would
# be over MAX). Only shots the storyboard draws as one continuous composition with the shot before them.
MERGE: list = []

E = Path(__file__).resolve().parent.parent
STORYBOARD = E / "storyboard" / "STORYBOARD.md"
TIMING = E / "timing"
C = E.parent.parent  # repo root
OUT_TS = C / "src" / "ptp08" / "timeline.ts"
OUT_JSON = C / "src" / "ptp08" / "timeline.json"
VO_PREFIX = "ptp08/vo"  # staticFile path of the voiceovers (C/public/ptp08/vo/<variant>.wav)

VERSIONS = ["A", "B", "C"]
# YouTube Shorts cuts: <v>YT is its Instagram video up to the CTA, then a subscribe take ("Subscribe to learn more
# about AI.", as in ep04-ep07) instead of the comment-keyword CTA. Every shot before the CTA is the Instagram shot;
# the CTA's spoken shots (from the shot that starts with "Comment" to the last spoken one; ep08 has one, A15a / B10a /
# C10a) are replaced by YT_CTA_TEXT on the CTA's first ids (with one CTA id the whole line sits on it; with three or
# more, "Subscribe" / "to learn more" / "about AI." sit on the first three, as in ep06), so the body's CTA scene finds
# them; the tail hold follows POST frames after the last word (storyboard: the bubble reads SUBSCRIBE, no guide).
# Provisional YT CTA frames: the storyboard pace (WPS) from the Instagram CTA's first frame. Real timing needs
# E/timing/words_<v>YT.json and public/ptp08/vo/<v>YT.wav: the YT voice is its Instagram voice sample for sample up to
# the CTA, and "Subscribe" starts where "Comment" did. Every spoken shot up to and including the CTA's first shot
# takes the Instagram variant's lead, locked (yt_fixed_leads), so the shots before the CTA and its first frame are the
# Instagram ones; check_yt_against_ig warns on any difference. Without the YT words file a YT cut is provisional.
YT = "YT"
# Combos: <hook letter><body letter>, AB = HA + BodyB; the first letter is always the hook. All 18 exist from the first
# generation. Output order: the nine Instagram videos (A B C AB AC BA BC CA CB), then their nine YT cuts.
COMBOS = [h + b for h in VERSIONS for b in VERSIONS if h != b]  # AB, AC, BA, BC, CA, CB
IG_VARIANTS = VERSIONS + COMBOS  # the nine Instagram videos
VARIANTS = IG_VARIANTS + [v + YT for v in IG_VARIANTS]
CTA_WORD = "comment"  # the CTA's first spoken shot starts with this word
YT_CTA_TEXT = ["Subscribe", "to learn more", "about AI."]
HOOK_GROUP = {v: f"H{v}" for v in VERSIONS}  # HA, HB, HC
BODY_GROUP = {v: f"Body{v}" for v in VERSIONS}  # BodyA, BodyB, BodyC
GROUP_IDS = [HOOK_GROUP[v] for v in VERSIONS] + [BODY_GROUP[v] for v in VERSIONS]

ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
        "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
SCALE = {"k": "thousand", "m": "million", "b": "billion", "t": "trillion"}


def say(n):
    """integer -> spoken words list (enough for this script's numbers)"""
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000:
        return [ONES[n // 100], "hundred"] + (say(n % 100) if n % 100 else [])
    if n < 1_000_000:
        return say(n // 1000) + ["thousand"] + (say(n % 1000) if n % 1000 else [])
    if n < 1_000_000_000:
        return say(n // 1_000_000) + ["million"] + (say(n % 1_000_000) if n % 1_000_000 else [])
    return say(n // 1_000_000_000) + ["billion"] + (say(n % 1_000_000_000) if n % 1_000_000_000 else [])


def ig_of(v):
    """the Instagram variant of a YouTube cut (ABYT -> AB, AYT -> A); an Instagram variant is its own"""
    return v[: -len(YT)] if v.endswith(YT) else v


def hook_of(v):
    """the hook's letter (A, AYT, AB, ABYT -> A)"""
    return ig_of(v)[0]


def body_of(v):
    """the body's letter (A, AYT -> A; AB, ABYT -> B)"""
    return ig_of(v)[-1]


def group_of(sid):
    """HA3 -> HA, A07b -> BodyA"""
    return sid[:2] if sid.startswith("H") else BODY_GROUP[sid[0]]


def version_of(sid):
    return sid[1] if sid.startswith("H") else sid[0]


# ----------------------------------------------------------------- storyboard
# a shot line: the bold id, then " · " fields, one of them the frame range "f A-B (N)" (normally the first; a tag
# such as "R2" may sit anywhere). Lines that start with a bold id but have no " · " right after it are prose.
SHOT_HEAD = re.compile(r"^\*\*((?:H[ABC]\d+)|(?:[ABC]\d{2}[a-z]))\*\*\s*·(.*)$")
VERSION_HEAD = re.compile(r"^###\s+([ABC]):")
GROUP_HEAD = re.compile(r"^####\s+(Hook|Body)\s+group", re.I)
OTHER_HEAD = re.compile(r"^#{1,3}\s")  # any other h1-h3 ends the current version
BODY_AT = re.compile(r"Body starts at f\s*(\d+)")
TOTAL_AT = re.compile(r"Provisional total:\s*(\d+)\s*frames")
RANGE = re.compile(r"^f\s*(\d+)\s*-\s*(\d+)\s*\((\d+)\)$")
# a revision tag field: "R2", "[R2]", "**R2**", optionally followed by a note in brackets ("**R2** (scissors enter ...)")
TAG = re.compile(r"^[\[(*]*R\d+[\])*]*(\s*\(.*\))?$")
# the same tag as the line's last field, stripped before splitting so a " · " inside its note never splits it
TAG_TAIL = re.compile(r"\s*·\s*\*\*R\d+\*\*(\s*\(.*\))?\s*$")


def _fields(rest):
    """the " · " fields other than the frame range -> (kind, anchor, text)"""
    fields = [x.strip() for x in rest.split("·")]
    fields = [x for x in fields if x and not TAG.match(x)]  # drop revision tags ("R2", "**R2** (what changed)")
    anchor, kind, text = "", None, None
    for x in fields:
        if re.match(r"^\(?\s*blur break", x, re.I):
            kind, text = "break", ""
        elif re.match(r"^\(?\s*tail hold", x, re.I):
            kind, text = "hold", ""
        elif x.startswith("anchor"):
            m = re.match(r'^anchor\s*"(.*?)"\s*$', x)
            anchor = m.group(1) if m else ""
    if kind is None:
        rest_f = [x for x in fields if not x.startswith("anchor") and not x.startswith("beat ")]
        if not rest_f:
            return None, anchor, None
        text = rest_f[-1].strip()
        if len(text) >= 2 and text[0] == '"' and text[-1] == '"':
            text = text[1:-1]
        kind = "spoken"
    return kind, anchor, text


def parse_storyboard(path=STORYBOARD):
    """-> ({"A": [shot...], "B": [...], "C": [...], "AYT": [...], ...}, info)
    shot = {id, kind, text, anchor, group, start, end, spoken_end} (provisional storyboard frames, end exclusive;
    spoken_end = the storyboard range's end, end = where the next shot starts)"""
    raw = {v: [] for v in VERSIONS}
    notes = {v: {} for v in VERSIONS}
    seen = set()
    cur_v, cur_g = None, None
    for ln in path.read_text().splitlines():
        s = ln.strip()
        mv = VERSION_HEAD.match(s)
        if mv:
            cur_v, cur_g = mv.group(1), None
            continue
        mg = GROUP_HEAD.match(s)
        if mg:
            if cur_v is None:
                raise SystemExit(f"storyboard: '{s}' outside a '### A:' / '### B:' / '### C:' section")
            cur_g = mg.group(1).lower()
            continue
        if OTHER_HEAD.match(s):
            cur_v, cur_g = None, None
            continue
        if cur_v:
            mb, mt = BODY_AT.search(s), TOTAL_AT.search(s)
            if mb and not s.startswith("**"):
                notes[cur_v]["body_at"] = int(mb.group(1))
            if mt and not s.startswith("**"):
                notes[cur_v]["total"] = int(mt.group(1))
        m = SHOT_HEAD.match(s)
        if not m:
            continue
        sid, rest = m.groups()
        if cur_v is None or cur_g is None:
            raise SystemExit(f"storyboard: shot {sid} sits outside a version's '#### Hook group' / '#### Body group'")
        if version_of(sid) != cur_v:
            raise SystemExit(f"storyboard: shot {sid} sits in version {cur_v}")
        if (cur_g == "hook") != sid.startswith("H"):
            raise SystemExit(f"storyboard: shot {sid} sits in version {cur_v}'s {cur_g} group")
        rest = TAG_TAIL.sub("", rest)
        fields = [x.strip() for x in rest.split("·")]
        rng = [RANGE.match(x) for x in fields]
        hit = [k for k, r in enumerate(rng) if r]
        if len(hit) != 1:
            # a shot line in a shape this parser can't read must stop the build, never drop a shot silently
            raise SystemExit(f"storyboard: cannot find one frame range 'f A-B (N)' in this shot line: {s[:120]}")
        a, b, n = rng[hit[0]].groups()
        rest = " · ".join(x for k, x in enumerate(fields) if k != hit[0])
        if sid in seen:
            raise SystemExit(f"storyboard: shot {sid} appears twice")
        seen.add(sid)
        kind, anchor, text = _fields(rest)
        if kind is None:
            raise SystemExit(f"storyboard: {sid} has no spoken line, blur break or tail hold: {s[:120]}")
        raw[cur_v].append(_shot(sid, kind, text, anchor, int(a), int(b), int(n)))

    out, info = {}, {}
    for v, lst in raw.items():
        if not lst:
            raise SystemExit(f"storyboard: no shots parsed for version {v}")
        groups = [g for k, g in enumerate(s["group"] for s in lst) if k == 0 or g != lst[k - 1]["group"]]
        if groups != [HOOK_GROUP[v], BODY_GROUP[v]]:
            raise SystemExit(f"storyboard: version {v} must be its hook group then its body group, found {groups}")
        if lst[0]["start"] != 0:
            raise SystemExit(f"storyboard: version {v} starts at f {lst[0]['start']}, not 0")
        if lst[0]["kind"] != "spoken":
            raise SystemExit(f"storyboard: version {v} must open on a spoken shot")
        if lst[-1]["kind"] != "hold":
            raise SystemExit(f"storyboard: version {v} must end on the tail hold")
        gaps = []
        for p, q in zip(lst, lst[1:]):
            if q["start"] < p["end"]:
                raise SystemExit(f"storyboard: {v} {q['id']} starts at f {q['start']}, {p['id']} ends at f {p['end'] - 1}"
                                 " (shot ranges overlap)")
            if q["start"] > p["end"]:
                gaps.append((p["id"], q["start"] - p["end"]))
                p["end"] = q["start"]  # the pause belongs to the shot before it
        for sh in lst:
            if sh["anchor"] and toks(sh["anchor"]) != toks(sh["text"])[: len(toks(sh["anchor"]))]:
                raise SystemExit(f"storyboard: {sh['id']} anchor {sh['anchor']!r} is not the start of {sh['text']!r}")
        body0 = next(s for s in lst if s["group"] == BODY_GROUP[v])
        hook_last = [s for s in lst if s["group"] == HOOK_GROUP[v]][-1]
        warn = []
        if "body_at" in notes[v] and notes[v]["body_at"] != body0["start"]:
            warn.append(f"'Body starts at f {notes[v]['body_at']}' but {body0['id']} starts at f {body0['start']}")
        if "total" in notes[v] and notes[v]["total"] != lst[-1]["end"]:
            warn.append(f"'Provisional total: {notes[v]['total']} frames' but the shots end at f {lst[-1]['end']}")
        out[v] = lst
        info[v] = {"shots": len(lst), "hook": [s["id"] for s in lst if s["group"] == HOOK_GROUP[v]],
                   "body_first": body0["id"], "pause": body0["start"] - hook_last["spoken_end"],
                   "cta": cta_ids(v, lst), "gaps": gaps, "warnings": warn}
    for v in COMBOS:
        out[v], info[v] = combo_shots(out, info, hook_of(v), body_of(v))
    for v in IG_VARIANTS:
        out[v + YT] = yt_shots(out[v], info[v]["cta"])
    return out, info


def combo_shots(board, info, h, b):
    """a combo's storyboard shots: hook h's shots as in video h (its last shot keeps the pause after its last word, the
    hand-off), then body b's shots moved so the body starts where video h's body starts. -> (shots, info)"""
    hook = [dict(s) for s in board[h] if s["group"] == HOOK_GROUP[h]]
    body = [s for s in board[b] if s["group"] == BODY_GROUP[b]]
    d = hook[-1]["end"] - body[0]["start"]
    body = [{**s, "start": s["start"] + d, "end": s["end"] + d, "spoken_end": s["spoken_end"] + d} for s in body]
    ih, ib = info[h], info[b]
    gaps = [g for g in ih["gaps"] if g[0] in ih["hook"]] + [g for g in ib["gaps"] if g[0] not in ib["hook"]]
    return hook + body, {"shots": len(hook) + len(body), "hook": ih["hook"], "body_first": ib["body_first"],
                         "pause": ih["pause"], "cta": ib["cta"], "gaps": gaps, "warnings": []}


def cta_ids(v, shots):
    """the CTA's spoken shots: from the shot whose line starts with "Comment" to the last spoken shot"""
    sp = [s for s in shots if s["kind"] == "spoken"]
    first = next((i for i, s in enumerate(sp) if toks(s["text"])[:1] == [CTA_WORD]), None)
    if first is None:
        raise SystemExit(f"storyboard: version {v} has no CTA shot (a line starting with 'Comment')")
    return [s["id"] for s in sp[first:]]


def yt_phrases(n_ids):
    """the subscribe line on n_ids CTA ids: one id takes the whole line, two take "Subscribe" + the rest, three or
    more take the three ep06 phrases"""
    if n_ids >= len(YT_CTA_TEXT):
        return list(YT_CTA_TEXT)
    if n_ids == 1:
        return [" ".join(YT_CTA_TEXT)]
    return [YT_CTA_TEXT[0], " ".join(YT_CTA_TEXT[1:])]


def yt_shots(ig, cta):
    """the Instagram shot list with the comment CTA swapped for the subscribe CTA (provisional frames: the
    storyboard pace from the Instagram CTA's first frame, then the tail hold POST frames after the last word)"""
    idx = [k for k, s in enumerate(ig) if s["id"] in cta]
    if [ig[k]["id"] for k in idx] != cta or idx != list(range(idx[0], idx[0] + len(idx))):
        raise SystemExit(f"storyboard: the CTA shots {cta} are not back to back")
    i0, i1 = idx[0], idx[-1]
    tail = ig[i1 + 1 :]
    if [s["kind"] for s in tail] != ["hold"]:
        raise SystemExit(f"storyboard: after the CTA {cta} only the tail hold may follow, found {[s['id'] for s in tail]}")
    t = ig[i0]["start"]
    new = []
    for sid, text in zip(cta, yt_phrases(len(cta))):
        n = max(SHORT, round(len(text.split()) / WPS * FPS))
        new.append({**ig[idx[len(new)]], "text": text, "anchor": text, "start": t, "end": t + n, "spoken_end": t + n})
        t += n
    new[-1]["end"] = t + POST
    hold = tail[0]
    hold_len = hold["end"] - hold["start"]
    return ig[:i0] + new + [{**hold, "start": t + POST, "end": t + POST + hold_len, "spoken_end": t + POST + hold_len}]


def _shot(sid, kind, text, anchor, a, b, n):
    if b - a + 1 != n:
        raise SystemExit(f"storyboard: {sid} range {a}-{b} does not match its length {n}")
    return {"id": sid, "kind": kind, "text": text, "anchor": anchor, "group": group_of(sid), "start": a, "end": b + 1,
            "spoken_end": b + 1}


# ----------------------------------------------------------------- tokens
def num_words(t):
    """a written number token -> spoken words, or None ("$450B" -> four hundred fifty billion, "1.5" -> one point
    five, "49x" -> forty nine times, "22%" -> twenty two percent, "20+" -> twenty)"""
    m = re.fullmatch(r"[-+]?\$?([\d,]*\d[\d,]*)(?:\.(\d+))?([kmbtx%+]?)[.,!?;:]*", t)
    if not m:
        return None
    whole, dec, suf = m.groups()
    n = int(re.sub(r"\D", "", whole))
    out = say(n)
    if dec:
        out += ["point"] + [ONES[int(d)] for d in dec]
    if suf in SCALE:
        out.append(SCALE[suf])
    elif suf == "x":
        out.append("times")
    elif suf == "%":
        out.append("percent")
    return out


# spellings a transcript may use for the script's words (both sides go through toks, so the mapping is symmetric)
CONTRACTIONS = {"here's": "here is", "there's": "there is", "that's": "that is", "it's": "it is", "don't": "do not",
                "doesn't": "does not", "you're": "you are", "i'll": "i will", "what's": "what is", "let's": "let us"}
SPELL = {"cloud": "claude", "claud": "claude", "clawed": "claude", "githubs": "github"}


def toks(text):
    """canonical tokens: lowercase, no punctuation, written numbers -> number words, "Git Hub" -> github,
    contractions expanded ("Here's" -> here is), "v1" -> v one, Whisper's "Cloud" -> claude"""
    out = []
    for t in re.split(r"[\s\-/]+", text.lower().replace("\u2019", "'")):
        nw = num_words(t)
        if nw is not None:
            out += nw
            continue
        c = CONTRACTIONS.get(re.sub(r"[^a-z']", "", t))
        if c:
            out += c.split()
            continue
        t = re.sub(r"[^a-z0-9]", "", t)
        mv = re.fullmatch(r"v(\d+)", t)
        if mv:
            out += ["v"] + say(int(mv.group(1)))
            continue
        t = SPELL.get(t, t)
        if t == "hub" and out and out[-1] == "git":
            out[-1] = "github"
            continue
        if t:
            out.append(t)
    return out


def load_words(path):
    """-> (words, meta); meta holds the assembler's "hook_end" / "body_start" / "duration" (s) when given"""
    data = json.load(open(path))
    words = data["words"] if isinstance(data, dict) else data
    meta = {k: data[k] for k in ("hook_end", "body_start", "duration") if isinstance(data, dict) and k in data}
    out = []
    for w in words:
        text = w.get("w", w.get("word", w.get("text", "")))
        s = w.get("s", w.get("start"))
        e = w.get("e", w.get("end"))
        if s is None or e is None:
            raise SystemExit(f"{path}: word without start/end: {w}")
        out.append({"w": str(text).strip(), "s": float(s), "e": float(e)})
    if not out:
        raise SystemExit(f"{path}: no words")
    return out, meta


# ----------------------------------------------------------------- onsets from the voice file
# Whisper often starts a word that follows a pause at the END of the previous word, so the word "absorbs" the pause
# (ep05: "It" at 59.10-60.03 s when the voice says it at 59.98 s). A picture anchored there lands up to a second early.
# When the voiceover WAV is there, a word whose span opens with a real silence (ONSET_SIL_RUN of windows under
# ONSET_SIL dB) starts at the first window over ONSET_LOUD dB after that silence instead.
VO_DIR = C / "public" / "ptp08" / "vo"
ONSET_SIL = -50.0  # dBFS, 10 ms RMS windows (the voice agent cuts at -52 dB "true silence")
ONSET_SIL_RUN = 10  # 0.10 s of silence inside a word span = a pause Whisper folded into the word (stop closures are shorter)
ONSET_LOUD = -32.0  # the word's real onset
ONSET_PRE = 0.02  # s kept before the onset


def read_pcm(wav):
    """-> (first channel's samples as an array, sample rate, full scale); 16-bit or 24-bit PCM"""
    import array
    import wave

    with wave.open(str(wav)) as w:
        sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(n)
    if sw == 2:
        a = array.array("h", raw)
        full = 32768.0
    elif sw == 3:
        a = array.array("i", (int.from_bytes(raw[i : i + 3], "little", signed=True) for i in range(0, len(raw) - 2, 3)))
        full = 8388608.0
    else:
        raise SystemExit(f"{wav}: expected 16- or 24-bit PCM (sample width {sw})")
    if ch > 1:
        a = a[::ch]
    return a, sr, full


def envelope(wav):
    """10 ms RMS envelope in dBFS (pure python, no numpy needed); 16-bit or 24-bit PCM"""
    return env_of(*read_pcm(wav))


def env_of(a, sr, full):
    """10 ms RMS envelope in dBFS of mono samples"""
    hop = sr // 100
    out = []
    for i in range(0, len(a), hop):
        seg = a[i : i + hop]
        if not seg:
            break
        ms = sum(x * x for x in seg) / len(seg)
        out.append(10 * math.log10(ms / (full * full) + 1e-12))
    return out


def load_env(wav, warn):
    """the voice's 10 ms envelope, or None (with a warning) when the WAV is missing or unreadable"""
    if not wav.exists():
        warn(f"{wav.name} missing: word starts are Whisper's (no onset refinement), split tails use Whisper's ends")
        return None
    try:
        return envelope(wav)
    except Exception as ex:  # e.g. a 32-bit float WAV the wave module cannot read
        warn(f"{wav.name}: cannot read for onsets ({ex}); word starts and ends are Whisper's")
        return None


JOINED_ONLY = False  # --joined: combos always joined (their own words file may be a build in progress)


def voice_source(v):
    """"real" when E/timing/words_<v>.json exists; "joined" for a combo (or its YT cut) whose hook's and body's words
    files exist (provisional until VOICE-COMBO's join lands); None otherwise (storyboard ranges)"""
    if (TIMING / f"words_{v}.json").exists() and not (JOINED_ONLY and ig_of(v) in COMBOS):
        return "real"
    if ig_of(v) in COMBOS:
        b = body_of(v) + (YT if v.endswith(YT) else "")
        if (TIMING / f"words_{hook_of(v)}.json").exists() and (TIMING / f"words_{b}.json").exists():
            return "joined"
    return None


def joined_voice(v, warn):
    """a combo's voice before its own files exist: hook h's words (words_<h>.json) that start before that file's
    body_start, then body b's words (words_<b>.json, words_<b>YT.json for a YT cut) from that file's body_start on,
    moved so the body starts where h's own body started (the real joins leave the same pause: the hook's room tone
    after its last word, then the body's lead). The envelope is the two WAVs joined at the same two points, sample
    exact, so onsets and where the hook's voice stops are measured as on a real join.
    -> (words, meta, env, sources)"""
    h, b = hook_of(v), body_of(v) + (YT if v.endswith(YT) else "")
    hw, hm = load_words(TIMING / f"words_{h}.json")
    bw, bm = load_words(TIMING / f"words_{b}.json")
    for name, m in ((h, hm), (b, bm)):
        if "body_start" not in m or "hook_end" not in m:
            raise SystemExit(f"words_{name}.json: needs hook_end and body_start to join {v}")
    cut_h, cut_b = float(hm["body_start"]), float(bm["body_start"])
    env, start, total = None, cut_h, None
    hwav, bwav = VO_DIR / f"{h}.wav", VO_DIR / f"{b}.wav"
    try:
        ah, sr, full = read_pcm(hwav)
        ab, sr_b, full_b = read_pcm(bwav)
        if (sr, full, ah.typecode) != (sr_b, full_b, ab.typecode):
            raise ValueError(f"{hwav.name} and {bwav.name} differ in rate or sample width")
        nh, nb = round(cut_h * sr), round(cut_b * sr)
        env = env_of(ah[:nh] + ab[nb:], sr, full)
        start, total = nh / sr, (nh + len(ab) - nb) / sr
    except Exception as ex:  # missing or unreadable WAV: Whisper's starts, no onset refinement
        warn(f"{v}: cannot join {hwav.name} + {bwav.name} for onsets ({ex}); word starts and ends are Whisper's")
    shift = start - cut_b
    hook = [w for w in hw if w["s"] < cut_h]
    body = [{**w, "s": round(w["s"] + shift, 4), "e": round(w["e"] + shift, 4)} for w in bw if w["s"] >= cut_b]
    if not hook or not body:
        raise SystemExit(f"{v}: no hook words before {cut_h} s in words_{h}.json or no body words after {cut_b} s in words_{b}.json")
    if hook[-1]["e"] > cut_h:
        warn(f"{v}: the hook's last word '{hook[-1]['w']}' ends after words_{h}.json's body_start")
    meta = {"hook_end": float(hm["hook_end"]), "body_start": round(start, 4)}
    if total is not None:
        meta["duration"] = round(total, 4)
    return hook + body, meta, env, [f"words_{h}.json", f"words_{b}.json"]


def audio_end(env, s, limit):
    """where the voice really stops after a word that starts at s (seconds): the start of the first ONSET_SIL_RUN run of
    windows under ONSET_SIL dB before `limit`; None when there is no such silence. Whisper often ends a word early
    (ep07 A: "dollars." 32.17 s in the words file, voiced to 32.6 s), so a split at the pause after a line uses this."""
    run = 0
    for i in range(int(s * 100), min(len(env), int(limit * 100))):
        run = run + 1 if env[i] < ONSET_SIL else 0
        if run >= ONSET_SIL_RUN:
            return (i - ONSET_SIL_RUN + 1) / 100
    return None


def refine_onsets(words, env):
    if env is None:
        return words, 0
    moved = 0
    out = []
    for w in words:
        a, b = int(w["s"] * 100), min(len(env), int(w["e"] * 100))
        run, onset = 0, None
        for i in range(a, b):
            if env[i] < ONSET_SIL:
                run += 1
            elif env[i] > ONSET_LOUD and run >= ONSET_SIL_RUN:
                onset = i
                break
            elif env[i] > ONSET_LOUD:
                run = 0  # loud before any long silence: the word really starts at s
                if i - a > 3:
                    break
        if onset is not None:
            s = max(w["s"], onset / 100 - ONSET_PRE)
            if s < w["e"] - 0.04:
                out.append({**w, "s": round(s, 3), "whisper_s": w["s"]})
                moved += 1
                continue
        out.append(w)
    return out, moved


# ----------------------------------------------------------------- real timing
def anchor_words(shots, words, warn):
    """-> {shot index: word index} for every spoken shot (its first word in the transcript)"""
    s_tok, s_first = [], {}
    for k, sh in enumerate(shots):
        if sh["kind"] != "spoken":
            continue
        t = toks(sh["text"])
        if not t:
            raise SystemExit(f"{sh['id']}: empty spoken text")
        s_first[k] = len(s_tok)
        s_tok += t
    w_tok, w_idx = [], []
    for i, w in enumerate(words):
        for t in toks(w["w"]):
            w_tok.append(t)
            w_idx.append(i)
    sm = difflib.SequenceMatcher(None, s_tok, w_tok, autojunk=False)
    m = {}
    for blk in sm.get_matching_blocks():
        for j in range(blk.size):
            m[blk.a + j] = blk.b + j
    matched = len(m) / max(1, len(s_tok))
    if matched < 0.85:
        warn(f"only {matched:.0%} of the storyboard words were found in the transcript; check the words file")
    starts, prev_word = {}, -1
    for k, t0 in s_first.items():
        sid = shots[k]["id"]
        if t0 in m:
            wi = w_idx[m[t0]]
        else:
            n_line = len(toks(shots[k]["text"]))
            hit = next((t for t in range(t0 + 1, t0 + n_line) if t in m), None)
            if hit is None:
                hit = next((t for t in range(t0 + 1, len(s_tok)) if t in m), None)
                if hit is None:
                    raise SystemExit(f"{sid}: no words of {shots[k]['text']!r} found in the transcript")
            before = next((w_idx[m[t]] for t in range(t0 - 1, -1, -1) if t in m), -1)
            wi = max(prev_word + 1, before + 1, w_idx[m[hit]] - (hit - t0))
            warn(f"{sid}: first word {s_tok[t0]!r} not in the transcript, anchored on {words[wi]['w']!r}")
        if wi <= prev_word:
            warn(f"{sid}: anchor word {wi} not after the previous anchor {prev_word}")
            wi = prev_word + 1
        prev_word = wi
        starts[k] = wi
    return starts


def lay_out(shots, words, starts, leads):
    """frames for every shot from the anchors and the given leads"""
    out = []
    for k, sh in enumerate(shots):
        if sh["kind"] == "spoken":
            a = 0 if not out else round(words[starts[k]]["s"] * FPS) - leads.get(sh["id"], LEAD)
            out.append({**sh, "start": a, "word": starts[k]})
        else:
            out.append({**sh, "start": None, "word": None})
    last_end = round(words[-1]["e"] * FPS)
    for k, sh in enumerate(out):
        if sh["kind"] == "break":
            nxt = next(s for s in out[k + 1 :] if s["kind"] == "spoken")
            sh["start"] = nxt["start"] - BREAK
        elif sh["kind"] == "hold":
            if k != len(out) - 1:
                raise SystemExit(f"{sh['id']}: a tail hold must be the last shot")
            sh["start"] = last_end + POST
    total = out[-1]["start"] + HOLD if out[-1]["kind"] == "hold" else last_end + POST + 16
    for k in range(1, len(out)):
        if out[k]["start"] <= out[k - 1]["start"]:
            out[k]["start"] = out[k - 1]["start"] + 1
    for k, sh in enumerate(out):
        sh["end"] = out[k + 1]["start"] if k + 1 < len(out) else total
        sh["dur"] = sh["end"] - sh["start"]
    return out, total


def units(out, merge):
    """the cut list: shots in MERGE fold into the spoken shot before them (one unit), each keeps a mark (its own
    anchor frame) so useShot(id) still finds it"""
    res = []
    for sh in out:
        if merge and sh["id"] in MERGE and res and res[-1]["kind"] == "spoken" and sh["kind"] == "spoken":
            u = res[-1]
            if sh["end"] - u["start"] <= MAX:
                u["end"], u["dur"] = sh["end"], sh["end"] - u["start"]
                u["text"] = (u["text"] + " " + sh["text"]).strip()
                u["alias"] = u["alias"] + [{"id": sh["id"], "f": sh["start"], "text": sh["text"]}]
                continue
        res.append({**sh, "alias": []})
    return res


def build_real(shots, words, warn, fixed=None):
    """anchor every spoken shot on its first word, then meet the MAX cap with leads (see the module doc).
    fixed: extra {shot id: lead} that AUTO_LEAD must not change (a YouTube cut passes its Instagram variant's leads
    up to the CTA, so every shot before the CTA lands on the same frame). -> (shots, words, total, auto, leads, starts)"""
    starts = anchor_words(shots, words, warn)
    body0 = next(sh["id"] for sh in shots if sh["group"].startswith("Body"))
    leads = {**LEADS, body0: BODY_LEAD, **(fixed or {})}
    locked = set(leads)
    idx = {sh["id"]: k for k, sh in enumerate(shots)}
    # one change at a time, re-laid out after each, so two fixes never overshoot the same neighbour
    for _ in range(400):
        out, total = lay_out(shots, words, starts, leads)
        us = units(out, True)
        change = None
        for k, u in enumerate(us):
            over = u["dur"] - MAX
            if not AUTO_LEAD or u["kind"] != "spoken" or over <= 0:
                continue
            # 1. the next unit lands earlier (in the pause after this one), up to LEAD_MAX
            if k + 1 < len(us) and us[k + 1]["kind"] == "spoken" and us[k + 1]["id"] not in locked:
                nid = us[k + 1]["id"]
                cur = leads.get(nid, LEAD)
                room = min(LEAD_MAX - cur, MAX - us[k + 1]["dur"], over)
                if room > 0:
                    change = (nid, cur + room)
                    break
            # 2. this unit lands later (down to LEAD_MIN, on its word) if the spoken unit before it has room
            #    (a blur break in between moves with this unit, so the room is the spoken unit's before the break)
            j = k - 1
            while j >= 0 and us[j]["kind"] == "break":
                j -= 1
            if j >= 0 and us[j]["kind"] == "spoken" and u["id"] not in locked:
                cur = leads.get(u["id"], LEAD)
                room = min(cur - LEAD_MIN, MAX - us[j]["dur"], over)
                if room > 0:
                    change = (u["id"], cur - room)
                    break
        if change is None:
            break
        leads[change[0]] = change[1]
    out, total = lay_out(shots, words, starts, leads)
    for k in range(1, len(out)):
        if out[k]["start"] <= out[k - 1]["start"]:
            warn(f"{out[k]['id']}: start not after {out[k - 1]['id']}; nudged")
    for sid in MERGE:
        if sid not in idx:
            warn(f"MERGE {sid}: no such shot in this variant")
    auto = {k: v for k, v in leads.items() if v != LEAD and k not in LEADS and k != body0}
    wl = [{"w": w["w"], "f": round(w["s"] * FPS), "e": round(w["e"] * FPS)} for w in words]
    return out, wl, total, auto, leads, starts


def check_body_start(v, shots, words, starts, meta, warn):
    """the body's first anchor word against the assembler's body_start (s), when the words file gives one"""
    if "body_start" not in meta:
        return
    k = next(i for i, s in enumerate(shots) if s["group"].startswith("Body"))
    if k not in starts:
        return
    s = words[starts[k]]["s"]
    if abs(s - float(meta["body_start"])) > 0.15:
        warn(f"{shots[k]['id']} anchored on {words[starts[k]]['w']!r} at {s:.2f} s, the words file says body_start "
             f"{float(meta['body_start']):.2f} s")


def yt_fixed_leads(ig_leads, shots, cta0):
    """the Instagram variant's leads for every YouTube shot up to and including the CTA's first shot (which lands on
    the same frame: "Subscribe" starts where "Comment" did), locked so AUTO_LEAD keeps them"""
    out = {}
    for sh in shots:
        if sh["kind"] == "spoken":
            out[sh["id"]] = ig_leads.get(sh["id"], LEAD)
        if sh["id"] == cta0:
            break
    return out


def check_yt_against_ig(v, yt, ig, cta0, warn):
    """a YouTube cut must equal its Instagram variant up to the CTA: every shot part before the CTA (same id, kind,
    frames), the CTA's first frame, and every word up to the CTA"""
    pre = lambda r: [(s["id"], s["kind"], s["start"], s["end"]) for s in r["shots"][: next(i for i, s in enumerate(r["shots"]) if s["base"] == cta0)]]
    a, b = pre(yt), pre(ig)
    if a != b:
        diff = next((x, y) for x, y in zip(a + [None] * len(b), b + [None] * len(a)) if x != y)
        warn(f"shots before the CTA differ from {v[:-len(YT)]}: first difference {diff}")
    sa = lambda r: next(s["start"] for s in r["shots"] if s["base"] == cta0)
    if sa(yt) != sa(ig):
        warn(f"{cta0} starts at f {sa(yt)}, {v[:-len(YT)]} at f {sa(ig)}")
    n = next(i for i, w in enumerate(ig["words"]) if w["f"] >= sa(ig))
    if yt["words"][:n] != ig["words"][:n]:
        warn(f"words before the CTA differ from {v[:-len(YT)]}")
    if yt["bodyStart"] != ig["bodyStart"]:
        warn(f"body starts at f {yt['bodyStart']}, {v[:-len(YT)]} at f {ig['bodyStart']}")


# ----------------------------------------------------------------- provisional timing
def build_provisional(shots):
    """storyboard frames; each spoken shot's words spread evenly from start + LEAD over its own range (spoken_end),
    so the pause after a line stays silent"""
    out = [dict(sh, word=None, dur=sh["end"] - sh["start"]) for sh in shots]
    words = []
    for sh in out:
        if sh["kind"] != "spoken":
            continue
        ws = sh["text"].split()
        a = sh["start"] + LEAD
        n = sh["spoken_end"] - a
        for i, w in enumerate(ws):
            words.append({"w": w, "f": a + round(n * i / len(ws)), "e": a + round(n * (i + 1) / len(ws))})
    return out, words, out[-1]["end"]


# ----------------------------------------------------------------- split + groups
PUNCT = re.compile(r"[,.;:!?]['\")]*$")


NUM_WORDS = set(ONES) | set(TENS) | {"half", "hundred", "thousand", "million", "billion", "trillion", "point"}


def figure_cut(words, k):
    """True when a cut before words[k] splits a spoken figure: a unit or a number word right after a number word
    ("nine | percent", "two | hundred", "twenty-five | million"), or either side of the "and" inside a figure
    ("two hundred | and twenty-five", "two hundred and | twenty-five")"""
    tk = lambda i: toks(words[i]["w"]) if 0 <= i < len(words) else []
    first, last = (tk(k)[:1] or [""])[0], (tk(k - 1)[-1:] or [""])[0]
    if last in NUM_WORDS and (first in UNITS or first in NUM_WORDS):
        return True
    if last in NUM_WORDS and first == "and" and (tk(k + 1)[:1] or [""])[0] in NUM_WORDS:
        return True
    return last == "and" and (tk(k - 2)[-1:] or [""])[0] in NUM_WORDS and first in NUM_WORDS


def figure_start(words, k):
    """True when words[k] opens a spoken figure of two or more number words ("| two hundred and twenty-five million"):
    a cut there keeps the figure's words together, so it counts as a phrase boundary"""
    tk = lambda i: toks(words[i]["w"]) if 0 <= i < len(words) else []
    first, nxt = (tk(k)[:1] or [""])[0], (tk(k + 1)[:1] or [""])[0]
    starts = first in NUM_WORDS - {"half", "point"} and (len(tk(k)) > 1 and tk(k)[1] in NUM_WORDS or nxt in NUM_WORDS | UNITS)
    return starts and not figure_cut(words, k) and (tk(k - 1)[-1:] or [""])[0] not in NUM_WORDS


def cut_points(sh, words, parts, tail_f=None, handoff=False, prefer=None):
    """split frames for a unit over MAX -> (cuts, on_words, phrase_cuts).
    Each cut sits on a candidate: a word start, landing LEAD_MIN..LEAD_MAX frames before the word (LEAD preferred,
    like a shot's lead), or the end of the unit's last word when a pause follows it (the hook's hand-off). Every
    part stays between SHORT and MAX. Score: most even (max part - min part), minus PHRASE_BONUS per cut on a phrase
    boundary (after punctuation, after a pause of PAUSE_F+ frames, before a spoken figure (figure_start), or the pause
    after the last word), plus
    FIGURE_PENALTY per cut inside a spoken figure (figure_cut: "nine | percent", "two | hundred"), plus one per
    frame a cut lands away from its preferred frame, minus HOME_BONUS per cut on a word in `prefer` (the positions, in
    the unit's words, where the body's home video cut this shot: a combo's body splits on the same words). When
    `parts` parts cannot sit on words, parts + 1 is tried; only then an even split (reported)."""
    a, b = sh["start"], sh["end"]
    inside = [k for k, w in enumerate(words) if a <= w["f"] < b]
    cands = []  # (lo, pref, hi, bonus): the cut may sit anywhere in [lo, hi], best at pref; bonus > 0 = phrase boundary
    for k in inside[1:]:
        f, prev = words[k]["f"], words[k - 1]
        phrase = bool(PUNCT.search(prev["w"]) or f - prev["e"] >= PAUSE_F or figure_start(words, k))
        # a cut inside a spoken figure ("nine | percent", "two | hundred", "twenty-five | million", "hundred | and")
        figure = not phrase and figure_cut(words, k)
        cands.append((f - LEAD_MAX, f - LEAD, f - LEAD_MIN, PHRASE_BONUS if phrase else -FIGURE_PENALTY if figure else 0,
                      inside.index(k)))
    if inside:
        # the pause after the unit's last word: from Whisper's end, best where the voice really stops (tail_f)
        tail = max(words[k]["e"] for k in inside)
        pref = max(tail, tail_f or tail)
        if tail <= b - SHORT:
            cands.append((tail, min(pref, b - SHORT), b - SHORT, HANDOFF_BONUS if handoff else PHRASE_BONUS, "tail"))
    cands.sort(key=lambda c: (c[0], c[1]))  # by earliest frame, so the search can stop at the first one out of reach

    def place(chosen):
        """the cut frames for one choice of candidates (interval propagation), or None when no placement fits"""
        lo, hi, rng = a, a, []
        for c in chosen:
            lo, hi = max(c[0], lo + SHORT, a + SHORT), min(c[2], hi + MAX)
            if lo > hi:
                return None
            rng.append((lo, hi))
        lo, hi = max(rng[-1][0], b - MAX), min(rng[-1][1], b - SHORT)
        if lo > hi:
            return None
        rng[-1] = (lo, hi)
        cuts = [0] * len(chosen)
        nxt = None
        for j in range(len(chosen) - 1, -1, -1):
            lo, hi = rng[j]
            if nxt is not None:
                lo, hi = max(lo, nxt - MAX), min(hi, nxt - SHORT)
            cuts[j] = min(max(chosen[j][1], lo), hi)
            nxt = cuts[j]
        return cuts

    def search(n_parts):
        best = None

        def rec(start, chosen):
            nonlocal best
            if len(chosen) == n_parts - 1:
                cuts = place(chosen)
                if cuts is None:
                    return
                seg = [y - x for x, y in zip([a] + cuts, cuts + [b])]
                score = (max(seg) - min(seg) - sum(c[3] for c in chosen)
                         + sum(abs(x - c[1]) for x, c in zip(cuts, chosen))
                         - HOME_BONUS * sum(c[4] in (prefer or ()) for c in chosen))
                if best is None or score < best[0]:
                    best = (score, cuts, sum(c[3] > 0 for c in chosen))
                return
            last = chosen[-1][1] if chosen else a
            last_hi = chosen[-1][2] if chosen else a
            for i in range(start, len(cands)):
                c = cands[i]
                if c[0] - last_hi > MAX:
                    break  # every later candidate starts even further away
                if c[1] > last:
                    rec(i + 1, chosen + [c])

        rec(0, [])
        return best

    for n_parts in (parts, parts + 1):
        best = search(n_parts)
        if best:
            return best[1], True, best[2]
    n = b - a
    return [a + round(n * p / parts) for p in range(1, parts)], False, 0


def finish(variant, out, words, total, provisional, warn, tails=None, prefer=None):
    """tails: {shot id: frame where the voice really stops after its line} (real timing with the WAV)"""
    shots = units(out, not provisional)
    res, splits = [], []
    prev_group = None
    handoff = {u["id"] for u, nx in zip(shots, shots[1:]) if u["group"].startswith("H") and nx["group"].startswith("Body")}
    for sh in shots:
        n = sh["end"] - sh["start"]
        parts = 1 if sh["kind"] == "hold" else max(1, math.ceil(n / MAX))
        if n < SHORT and sh["kind"] != "break":
            warn(f"{sh['id']}: only {n} frames")
        if sh["kind"] == "hold" and n > MAX:
            warn(f"{sh['id']}: tail hold runs {n} frames (over {MAX})")
        # a blur break belongs to the group of the shot before it
        group = prev_group if sh["kind"] == "break" and prev_group else sh["group"]
        prev_group = group
        cuts = []
        pf = (prefer or {}).get(sh["id"]) if sh["kind"] == "spoken" else None
        natural = parts
        if pf and len(pf) + 1 > parts:
            parts = len(pf) + 1  # the home video split this shot into more parts than the cap needs here: match it
        if parts > 1:
            tail_f, ho_ = (tails or {}).get(sh["id"]), sh["id"] in handoff
            cuts, on_words, nphr = cut_points(sh, words, parts, tail_f, ho_, pf)
            if not on_words and parts != natural:  # the home's count does not fit on words here: back to the cap's
                parts = natural
                cuts, on_words, nphr = cut_points(sh, words, parts, tail_f, ho_, pf) if parts > 1 else ([], True, 0)
        if parts > 1:
            edges = [sh["start"]] + cuts + [sh["end"]]
            parts = len(cuts) + 1  # parts + 1 when that was the first count that sits on words
            heads = []
            for p in range(parts):
                ws = [w["w"] for w in words if edges[p] <= w["f"] < edges[p + 1]]
                heads.append(" ".join(ws) if ws else "(pause)")
            splits.append({"id": sh["id"], "frames": n, "parts": parts, "cuts": cuts, "on_words": on_words,
                           "phrase_cuts": nphr, "lens": [y - x for x, y in zip(edges, edges[1:])], "words": heads})
        edges = [sh["start"]] + cuts + [sh["end"]]
        for p in range(parts):
            a, b = edges[p], edges[p + 1]
            res.append({
                "id": sh["id"] + (f".{p + 1}" if parts > 1 else ""),
                "base": sh["id"],
                "alias": sh["alias"],
                "part": p,
                "parts": parts,
                "kind": sh["kind"],
                "group": group,
                "text": sh["text"],
                "start": a,
                "end": b,
                "dur": b - a,
            })
    groups = []
    for sh in res:
        if groups and groups[-1]["id"] == sh["group"]:
            groups[-1]["end"] = sh["end"]
        else:
            if any(g["id"] == sh["group"] for g in groups):
                raise SystemExit(f"{variant}: group {sh['group']} is not contiguous (at {sh['id']})")
            groups.append({"id": sh["group"], "start": sh["start"], "end": sh["end"]})
    body_start = next(s["start"] for s in res if s["group"].startswith("Body"))
    hook_words = [w for w in words if w["f"] < body_start]
    hl = next(u for u in shots if u["id"] in handoff) if handoff else None
    ho = None
    if hook_words and hl:
        last_e = hook_words[-1]["e"]
        audio = (tails or {}).get(hl["id"])
        ho = {"hookLast": hl["id"], "lastWord": hook_words[-1]["w"], "wordEnd": last_e, "audioEnd": audio,
              "bodyStart": body_start, "pause": body_start - last_e,
              "audioPause": None if audio is None else body_start - audio,
              "parts": [p["id"] for p in res if p["base"] == hl["id"]]}
    return {
        "variant": variant,
        "provisional": provisional,
        "vo": f"{VO_PREFIX}/{variant}.wav",
        "total": total,
        "bodyStart": body_start,
        "shots": res,
        "groups": groups,
        "words": words,
        "splits": splits,
        "handoff": ho,
    }


def split_line(s):
    lens = " | ".join(map(str, s["lens"]))
    words = " | ".join(f'"{w}"' for w in s["words"])
    note = "" if s["on_words"] else " (even split, no word start fits)"
    return f"{s['id']} {s['frames']} f -> {s['parts']} parts at f {', '.join(map(str, s['cuts']))} ({lens}){note}: {words}"


def home_of(v):
    """the video a combo's body comes from (AB -> B, ABYT -> BYT) and its hook's (AB -> A, ABYT -> AYT)"""
    yt = YT if v.endswith(YT) else ""
    return body_of(v) + yt, hook_of(v) + yt


def cut_words(d):
    """{shot id: [cut positions]} of a timeline entry: for every split shot, where each part after the first starts, as
    the position of its first word among the shot's words ("tail" for a part that holds only the pause after them)"""
    out = {}
    bases = []
    for s in d["shots"]:
        if s["parts"] > 1 and s["base"] not in bases:
            bases.append(s["base"])
    for base in bases:
        ps = [s for s in d["shots"] if s["base"] == base]
        inside = [w for w in d["words"] if ps[0]["start"] <= w["f"] < ps[-1]["end"]]
        pos = []
        for p_ in ps[1:]:
            j = next((i for i, w in enumerate(inside) if w["f"] >= p_["start"]), None)
            pos.append("tail" if j is None else j)
        out[base] = pos
    return out


def body_prefer(data, v):
    """the home video's cut positions for a combo's body shots ({} for a home video or when the home is not built)"""
    if ig_of(v) not in COMBOS:
        return {}
    home = home_of(v)[0]
    if home not in data:
        return {}
    d = data[home]
    body = {s["base"] for s in d["shots"] if s["group"].startswith("Body")}
    return {k: c for k, c in cut_words(d).items() if k in body}


def part_diffs(data, v):
    """[(base, parts in the home video, parts here)] for every shot of a combo whose part count differs from the same
    shot in its body's (or hook's) own video"""
    if ig_of(v) not in COMBOS:
        return []
    out = []
    for home in home_of(v):
        if home not in data:
            continue
        cnt = lambda d: {s["base"]: s["parts"] for s in d["shots"]}
        a, b = cnt(data[home]), cnt(data[v])
        out += [(k, a[k], b[k]) for k in b if k in a and a[k] != b[k]]
        ca, cb = cut_words(data[home]), cut_words(data[v])
        out += [(k, f"cuts at words {ca[k]}", f"{cb[k]}") for k in cb
                if k in ca and a[k] == b[k] and ca[k] != cb[k] and not (k.startswith(tuple("ABC")) and v.endswith(YT)
                                                                          and k in info_cta(data[v]))]
    return out


def info_cta(d):
    """the CTA shot ids of a timeline entry (its spoken shots from the one whose words start with "Comment" or
    "Subscribe")"""
    sp = [s for s in d["shots"] if s["kind"] == "spoken"]
    i = next((k for k, s in enumerate(sp) if toks(s["text"])[:1] in (["comment"], ["subscribe"])), len(sp))
    return {s["base"] for s in sp[i:]}


def md_report(data, path):
    """the timeline and split tables as markdown (the completion note's tables)"""
    L = []
    L.append("| Variant | Groups | Timing | Frames | Seconds | bodyStart | Hook's last word, ends f | Voice stops f | "
             "Hand-off silence (f) | Hook's last shot parts | Shot parts | Split shots |")
    L.append("|---|---|---|---|---|---|---|---|---|---|---|---|")
    for v, d in data.items():
        ho = d.get("handoff") or {}
        timing = "joined (prov.)" if d.get("joinedFrom") else "provisional" if d["provisional"] else "real"
        parts = ", ".join(f"{p['id']} {p['start']}-{p['end'] - 1} ({p['dur']})" for p in d["shots"]
                          if p["base"] == ho.get("hookLast"))
        sil = ho.get("audioPause") if ho.get("audioPause") is not None else ho.get("pause")
        L.append(f"| {v} | H{hook_of(v)} + Body{body_of(v)} | {timing} | {d['total']} | {d['total'] / FPS:.2f} | "
                 f"{d['bodyStart']} | '{ho.get('lastWord', '')}' f {ho.get('wordEnd', '')} | "
                 f"{'-' if ho.get('audioEnd') is None else ho['audioEnd']} | {sil} | {parts} | {len(d['shots'])} | "
                 f"{len(d['splits'])} |")
    L.append("")
    L.append("Hand-off silence = frames from where the hook's voice stops (the WAV, first 100 ms under -50 dB; on a "
             "provisional timeline the hook's last word end) to the body's first frame.")
    L.append("")
    for v in [x for x in data if x in VERSIONS]:
        d = data[v]
        L.append(f"### {v}: every split ({'provisional' if d['provisional'] else 'real'})")
        L.append("")
        L.append("| Shot | Frames | Parts (id: f start-end, length) | Words in each part |")
        L.append("|---|---|---|---|")
        for sp in d["splits"]:
            ps = [p for p in d["shots"] if p["base"] == sp["id"]]
            cell = "<br>".join(f"{p['id']}: {p['start']}-{p['end'] - 1} ({p['dur']})" for p in ps)
            words = " \\| ".join(f'"{w}"' for w in sp["words"])
            note = "" if sp["on_words"] else " (even split)"
            L.append(f"| {sp['id']} | {sp['frames']} | {cell} | {words}{note} |")
        L.append("")
    L.append("### YouTube cuts: the CTA shot")
    L.append("")
    L.append("Every shot before the CTA is its Instagram video's (same ids, parts and frames). The CTA shot carries "
             "\"Subscribe to learn more about AI.\" instead, then the tail hold:")
    L.append("")
    for v in [x for x in data if x.endswith(YT)]:
        d = data[v]
        cta = [s for s in d["shots"] if s["base"] == next(c for c in d["shots"] if c["kind"] == "hold")["base"]
               or (s["kind"] == "spoken" and s["text"].lower().startswith("subscribe"))]
        cells = []
        for p_ in cta:
            ws = [w["w"] for w in d["words"] if p_["start"] <= w["f"] < p_["end"]]
            cells.append(f"{p_['id']} {p_['start']}-{p_['end'] - 1} ({p_['dur']})" + (f' "{" ".join(ws)}"' if ws else ""))
        L.append(f"- {v} ({d['total']} f): " + ", ".join(cells))
    L.append("")
    L.append("### Combos: part counts that differ from the home videos")
    L.append("")
    any_diff = False
    for v in data:
        diffs = part_diffs(data, v)
        if diffs:
            any_diff = True
            L.append(f"- {v}: " + ", ".join(f"{b} {a} -> {n}" + ("" if isinstance(a, str) else " parts") for b, a, n in diffs))
    if not any_diff:
        L.append("- none: every combo's hook and body shots split into the same parts, cut on the same words, as in "
                 "their own videos (the frames move with the body's start).")
    L.append("")
    Path(path).write_text("\n".join(L) + "\n")


def write_atomic(path, text):
    """write next to the target, then rename over it, so a render bundling at that moment never reads half a file"""
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(text)
    tmp.replace(path)


# ----------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--provisional", action="store_true", help="storyboard frame ranges for every variant")
    ap.add_argument("--variants", default=",".join(VARIANTS))
    ap.add_argument("--check", action="store_true", help="print the summary, write nothing")
    ap.add_argument("--table", action="store_true", help="print every shot")
    ap.add_argument("--out-dir", help="write timeline.ts / timeline.json here instead of src/ptp08 (dry runs)")
    ap.add_argument("--joined", action="store_true", help="combos joined from their hook's and body's words even "
                    "when their own words file exists")
    ap.add_argument("--md", help="also write the timeline and split tables as markdown to this file")
    args = ap.parse_args()
    global JOINED_ONLY
    JOINED_ONLY = args.joined
    out_ts, out_json = (OUT_TS, OUT_JSON) if not args.out_dir else (Path(args.out_dir) / OUT_TS.name, Path(args.out_dir) / OUT_JSON.name)
    want = [v.strip() for v in args.variants.split(",") if v.strip()]
    bad = [v for v in want if v not in VARIANTS]
    if bad:
        raise SystemExit(f"unknown variants {bad}; use {VARIANTS}")

    board, info = parse_storyboard()
    for v in VERSIONS:
        i = info[v]
        print(f"storyboard {v}: {i['shots']} shots, hook {i['hook'][0]}-{i['hook'][-1]}, body from {i['body_first']} "
              f"({i['pause']} f after the hook's last word), CTA {', '.join(i['cta'])}"
              + (f"; pauses kept by {', '.join(f'{a} +{n}' for a, n in i['gaps'])}" if i["gaps"] else ""))
        for w in i["warnings"]:
            print(f"         STORYBOARD WARNING: {w}")
    for v in COMBOS:
        if v in want or v + YT in want:
            i = info[v]
            print(f"combo {v}: {i['shots']} shots, hook {i['hook'][0]}-{i['hook'][-1]}, body from {i['body_first']} "
                  f"({i['pause']} f after the hook's last word), CTA {', '.join(i['cta'])}")
    prev = {}
    if OUT_JSON.exists() and set(want) != set(VARIANTS):
        prev = json.loads(OUT_JSON.read_text()).get("variants", {})
    data = {}
    over = 0
    ig_real = {}  # Instagram variant -> (result, leads), real timing only; the YouTube cuts take their leads from it

    def real(v, warn):
        joined = None
        if voice_source(v) == "joined":
            words_in, meta, env, joined = joined_voice(v, warn)
        else:
            words_in, meta = load_words(TIMING / f"words_{v}.json")
            env = load_env(VO_DIR / f"{v}.wav", warn)
        words_in, moved = refine_onsets(words_in, env)
        fixed = None
        ver = ig_of(v)
        cta0 = info[ver]["cta"][0]
        if v.endswith(YT):
            if ver not in ig_real:
                if voice_source(ver) is None:
                    raise SystemExit(f"{v}: needs words_{ver}.json (its Instagram variant) for the shots before the CTA")
                real(ver, lambda m: None)
            fixed = yt_fixed_leads(ig_real[ver][1], board[v], cta0)
        shots, words, total, auto, leads, starts = build_real(board[v], words_in, warn, fixed)
        check_body_start(v, board[v], words_in, starts, meta, warn)
        tails = {}
        if env is not None:
            ks = sorted(starts)  # spoken shot indexes, in order; a line's last word is the one before the next anchor
            for j, k in enumerate(ks):
                last = (starts[ks[j + 1]] if j + 1 < len(ks) else len(words_in)) - 1
                limit = words_in[last + 1]["s"] if last + 1 < len(words_in) else len(env) / 100
                t = audio_end(env, words_in[last]["s"], limit)
                if t is not None:
                    tails[board[v][k]["id"]] = round(t * FPS)
        res = finish(v, shots, words, total, False, warn, tails, body_prefer(data, v))
        if joined:  # timed like a real voice, but provisional until the combo's own voice lands (the shell stays silent)
            res["provisional"] = True
            res["joinedFrom"] = joined
        if v.endswith(YT):
            check_yt_against_ig(v, res, ig_real[ver][0], cta0, warn)
        else:
            ig_real[v] = (res, leads)
        return res, auto, moved

    for v in VARIANTS:
        if v not in want and v in prev:
            data[v] = prev[v]
            continue
        warnings = []
        warn = warnings.append
        wf = TIMING / f"words_{v}.json"
        auto = {}
        source = None if args.provisional else voice_source(v)
        if source:
            res, auto, moved = real(v, warn)
            src = f"{wf.name} ({moved} onsets)" if source == "real" else \
                f"joined {'+'.join(x[6:-5] for x in res['joinedFrom'])} (prov., {moved} onsets)"
        else:
            shots, words, total = build_provisional(board[v])
            res = finish(v, shots, words, total, True, warn, prefer=body_prefer(data, v))
            src = "storyboard (provisional)"
        res["warnings"] = warnings
        res["autoLeads"] = auto
        data[v] = res
        over += len(res["splits"])
        durs = [s["dur"] for s in res["shots"] if s["kind"] != "break"]
        print(f"{v:4} {src:30} {res['total']:5} f = {res['total'] / FPS:5.2f} s  {len(res['shots'])} shot parts  "
              f"body from f {res['bodyStart']}  longest {max(durs)}  shortest {min(durs)}")
        for g in res["groups"]:
            print(f"         {g['id']:6} {g['start']:5}-{g['end']:5}")
        if auto:
            print("         auto leads: " + ", ".join(f"{k} {n}" for k, n in auto.items()))
        ho = res.get("handoff")
        if ho:
            ap = "" if ho["audioPause"] is None else f", voice stops f {ho['audioEnd']} -> {ho['audioPause']} f"
            print(f"         hand-off: {ho['hookLast']} ({' '.join(ho['parts'])}) '{ho['lastWord']}' ends f {ho['wordEnd']}{ap}, "
                  f"body from f {ho['bodyStart']}: {ho['pause']} f of pause after the word")
            if (ho["audioPause"] if ho["audioPause"] is not None else ho["pause"]) < 10:
                warn(f"hand-off pause under 10 frames after the hook's last word")
        for s in res["splits"]:
            print(f"         OVER 45 (split): {split_line(s)}")
        for w in warnings:
            print(f"         WARNING: {w}")
        if args.table:
            for s in res["shots"]:
                print(f"           {s['id']:8} {s['kind']:6} {s['group']:6} {s['start']:5}-{s['end']:5} {s['dur']:3}  {s['text']}")

    for v in data:
        for b, a, n in part_diffs(data, v):
            print(f"{v:4} split differs from its home video: {b} {a} -> {n}")
    if args.md:
        md_report(data, args.md)
        print(f"wrote {args.md}")
    if args.check:
        return
    payload = {"generated_by": "ep08 github/tools/make_ep08_timeline.py", "fps": FPS, "variants": data}
    out_ts.parent.mkdir(parents=True, exist_ok=True)
    write_atomic(out_json, json.dumps(payload, indent=1))
    keys = ("variant", "provisional", "vo", "total", "bodyStart", "shots", "groups", "words")
    ts_data = {v: {k: d[k] for k in keys} for v, d in data.items()}
    gid = " | ".join(f'"{g}"' for g in GROUP_IDS)
    ts = [
        "// GENERATED by CREATORS/Victor/reels/Made By AI/ep08 github/tools/make_ep08_timeline.py. Do not edit by hand.",
        "// Re-run it after a new voiceover or storyboard cut: shot frames move with the words. Frames are global; end is exclusive.",
        "// " + "  ".join(f"{v}: {d['total']} f{' (provisional)' if d['provisional'] else ''}" for v, d in data.items()),
        "",
        f"export const VARIANTS = {json.dumps(VARIANTS)} as const;".replace('","', '", "'),
        "export type Variant = (typeof VARIANTS)[number];",
        f"export type GroupId = {gid};",
        "export type ShotKind = \"spoken\" | \"break\" | \"hold\";",
        "/** one shot (or one part of a split shot): base = storyboard id (A07b), id = A07b.2 when split;",
        " *  alias = storyboard shots merged into this one (MERGE), each with its own anchor frame f (useShot(id) finds it) */",
        "export type Alias = { id: string; f: number; text: string };",
        "export type Shot = { id: string; base: string; alias: Alias[]; part: number; parts: number; kind: ShotKind; group: GroupId; text: string; start: number; end: number; dur: number };",
        "export type Group = { id: GroupId; start: number; end: number };",
        "/** f = first frame, e = end frame (global) */",
        "export type Word = { w: string; f: number; e: number };",
        "export type VariantTiming = { variant: Variant; provisional: boolean; vo: string; total: number; bodyStart: number; shots: Shot[]; groups: Group[]; words: Word[] };",
        f"export const TIMELINE: Record<Variant, VariantTiming> = {json.dumps(ts_data, indent=1)};",
        "",
    ]
    write_atomic(out_ts, "\n".join(ts))
    print(f"wrote {out_ts}")
    print(f"wrote {out_json}")
    if over:
        print(f"{over} shot(s) over {MAX} frames were split (see above)")


if __name__ == "__main__":
    sys.exit(main())
