#!/usr/bin/env python3
"""Ep08 "What GitHub actually is": one hook take + one body take -> a finished voiceover, with word timings.

Three hooks x three bodies (DISPATCH.md): every hook pairs with every body. A version is named hook letter then body
letter (AB = hookA + bodyB); a hook with its own body keeps the single letter (A = hookA + bodyA). Nine versions:
A B C AB AC BA BC CA CB. CTA keyword COMMIT ("Comment COMMIT and I'll send you the exact prompts to set up GitHub with
Claude Code."). Each line is cut once from its picked take; a version is that hook part and that body part joined with
the same hand-off (END_HOOK of the hook's room tone + LEAD before the body), then the gain match and the levelling.

Copied from ep07's assemble_vo_ep07.py (its final, combo-aware form). The cutter is ep07's v2 rule, unchanged:
  - NATURAL SPEED ONLY. No Rubber Band, no atempo, no tempo change (Victor, 2026-10-27). Only dead air is removed.
  - No word loses its tail. A word's end is the later of Whisper's end and the energy tail (the envelope must stay
    under SIL for 30 ms; a release burst within RELEASE after a silent closure is still the word). No cut starts closer
    than TAIL_GUARD after a word's end or ends closer than HEAD_GUARD before the next word's start, and cuts only remove
    frames quieter than CLICK_MAX (true silence, faint clicks, hum; never a breath), measured on 5 ms halves, each cut
    point keeping EDGE_MARGIN under EDGE_QUIET on its kept side (the current cut rule; no LEGACY_CUT).
  - Pause limits follow the approved script's punctuation: SENT after . ? !, COMMA after , ; :, WORD inside a sentence.
    A pause is found from the first word's energy end to the next word's energy onset when that stretch holds GAP_MIN
    of unbroken true silence (Whisper often hides a pause inside a word: bodyC_t4's "And" starts at 29.04 s inside the
    pause after "nothing."; the energy finds the pause). Every removable run in a pause is cut, down to the limit, and
    hum before a word counts as pause. The guards win over the limits.
  - The CTA keyword (COMMIT after "Comment") keeps every frame within CTA_GUARD of its full sound on both sides.
  - Every take is cut at its last word's energy end: everything after it (room tone, Fish's made-up tails, Whisper's
    hallucinations) is dropped. Each hook keeps END_HOOK of its own room tone after its last word, each body END_BODY
    after the final "Code." (the take's own audio if it is silent there, else its room tone).
  - The first frame is a word, not a breath (the first word starts at its energy onset, LEAD of quiet before it).
  - The hook's speech level is matched to its body's before the final levelling (MATCH, as ep06 and ep07), each final
    is levelled to -16 LUFS with true peaks at or under -1.5 dBTP (limiter latency compensated), Whisper-checked
    against the script, and every edit point is checked for clipped word edges (timing/edge_check_<version>.json).

ep08 changes (alignment and checks only; the audio rules are ep07 v2's):
  1. Whisper pre-pass equivalences (AGENT-VOICE-ASSEMBLE.md), as spoken-token rules: "GitHub" = "Github" = "git hub";
     "Git" = "git" = "get" (only where the script says Git); "Claude" = "Cloud" = "Claud"; "v1" = "V1" = "vee one" =
     "v one" = "version one"; "225 million" = "two hundred and twenty-five million" (also "twenty five"); "COMMIT" =
     "commit"; "repo" = "rep-o"; apostrophes and case ignored. ep07's dollar and percent rules are gone (no money or
     percent in this script). Every equivalence that fires is logged per take and per final.
  2. Flags left after the pre-pass are real errors unless listed in JUDGED with the evidence that they are Whisper.
  3. Whisper runs seeded and without conditioning on previous text, on takes cropped 0.15 s past their last sound.
  4. The report adds how Whisper wrote the watched names per final (GitHub, Git, Claude, v1, repo, commit).

usage: /opt/homebrew/opt/python@3.14/bin/python3.14 assemble_vo_ep08.py      (all nine versions)
  EP08_ONLY=A,CB         build only these versions (the report keeps the others' entries)
  EP08_PICKS=bodyA=bodyA_t2.wav,hookC=hookC_t1.wav   try other takes without editing PICKS
  EP08_DRY=<dir>         write wavs, report and timing files to <dir> only (no E/timing, no public copies)
  EP08_MATCH=vrms|lufs|none   hook-to-body gain match before levelling (default vrms, as ep06 and ep07)
writes:
  E/voice/GitHub voiceover v1 (<version>).wav       version = A, B, C, AB, AC, BA, BC, CA, CB
  E/voice/GitHub voiceover v1 report.json
  E/timing/words_<version>.json                     {"text", "words": [{"w","s","e"}], "hook_end", "body_start", "duration"}
  E/timing/edge_check_<version>.json
  C/public/ptp08/vo/<version>.wav
It does not run the timeline tool (INFRA regenerates C/src/ptp08/timeline.* from the words files).
Then: E/voice/yt/make_yt_vo.py builds the nine YouTube cuts from these files.
"""
import difflib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

E = Path(__file__).resolve().parent.parent
PUB = E.parent.parent / "public" / "ptp08" / "vo"
# ep08 builds one voice, tagged v1 in its file names, with ep07's current cutter (ep07's "v2" rule: every pause cut
# down to its limit across faint clicks, hum before a word counted as pause, word edges from the cutter). ep07's first
# ("v1") cut rule is not carried over.
TAG = "v1"
V2 = True
CUT_RULE = "ep07 v2 (5 ms halves, EDGE_MARGIN, every removable run of a pause cut to its limit; no LEGACY_CUT)"
NAME = "GitHub voiceover"
TAKES = E / "voice" / "takes"
# Winning take per line (E/voice/takes/PICK-<line>.json and dispatch/COMPLETION-VOICE-<line>.md say why). No splices.
PICKS = {"hookA": "hookA_t7.wav", "hookB": "hookB_t3.wav", "hookC": "hookC_t3.wav",
         "bodyA": "bodyA_t1.wav", "bodyB": "bodyB_t4.wav", "bodyC": "bodyC_t4.wav"}
for _kv in filter(None, os.environ.get("EP08_PICKS", "").split(",")):
    _k, _v = _kv.split("=")
    assert _k in PICKS, _k
    PICKS[_k] = _v
# every hook with every body: hook letter + body letter (AB = hookA + bodyB); a hook with its own body keeps one letter
VERSIONS = {(h if h == b else h + b): (f"hook{h}", f"body{b}") for h in "ABC" for b in "ABC"}
VERSIONS = {v: VERSIONS[v] for v in ["A", "B", "C", "AB", "AC", "BA", "BC", "CA", "CB"]}
ONLY = [v for v in os.environ.get("EP08_ONLY", "").split(",") if v]
assert all(v in VERSIONS for v in ONLY), ONLY
DRY = os.environ.get("EP08_DRY")
OUT_VOICE = Path(DRY) if DRY else E / "voice"
OUT_TIMING = Path(DRY) if DRY else E / "timing"
MATCH = os.environ.get("EP08_MATCH", "vrms")
LAST, KEY = "code", "commit"  # each body's final word ("Code."), and the CTA keyword that follows "Comment"
WHISPER = "mlx-community/whisper-large-v3-turbo"
# ep07: Whisper's temperature fallback samples from MLX's random generator, which is seeded differently in every
# process, so the same take came back clean in one run and with "and check it down" or "across across ..." in the CTA
# of bodyB in another (the CTA segment fails the temperature-0 checks when it is decoded conditioned on the text before
# it). Decoded without that conditioning (ep06's final-check setting; the bodyB take agent's second pass), no segment of
# any ep07 take or final falls back, for seeds 0, 1 and 2. The seed makes any fallback that does happen repeatable.
WHISPER_KW = {"condition_on_previous_text": False}
SEED = 0
STATIC = str(E.parent.parent / "tools")  # optional take scorer (score.py), not shipped
SCRATCH = Path("/private/tmp")

SR = 44100
HOP = 441  # 10 ms frames
SIL = -52.0  # true silence; the clone's gaps sit at -60 to -95 dB, soft word tails at -40 to -50
SENT, COMMA, WORD = 0.24, 0.14, 0.05
TAIL_GUARD, HEAD_GUARD = 0.12, 0.06
CTA_GUARD = 0.30
LEAD = 0.06  # kept before the first word of each take
END_HOOK, END_BODY = 0.30, 0.50
MIN_CUT = 0.02
EDGE_MARGIN = 0.02  # a cut starts and ends at least this far inside true silence
RELEASE = 10  # frames (100 ms): a word-final release burst this soon after a silent closure is still the word
GAP_MIN = 0.20  # a true-silence run this long between two words is the pause, wherever Whisper put the boundary
FADE = 0.006
LUFS, TP_MAX = -16.0, -1.5
LONG_GAP = 0.30  # report every true-silence run longer than this left in a final (besides the end pad)
CLICK_MAX = -40.0  # v2: between the guards, anything quieter than this (5 ms halves) is static or hum, never a word
CLICK_LEN = 3  # frames (30 ms): a click this short does not break the unbroken silence a pause needs (GAP_MIN)
# v2: a sustained stretch whose 5 ms halves stay under HUM_MAX and that falls back into 30 ms of true silence before the
# next word is hum, not that word's onset ("Congress. | Hundreds" in A: -50 to -57 dB for 0.2 s, 80 ms of silence, then
# the word; ep06's onset took the hum as the word, so 0.3 s of dead air sat behind a pause measured at 0.24 s). A soft
# word onset (h, th) runs into its vowel without 30 ms of true silence, so it stays the word.
HUM_MAX = -45.0
# v2: a cut point keeps EDGE_MARGIN on its kept side under EDGE_QUIET, measured as the edge check measures (5 ms RMS at
# 1 ms steps); v1 asked for true silence on 5 ms halves. Room tone that hovers on the -52 dB line ("percent, | AMD" in
# A: -46 to -53 dB for 0.2 s) left no point to start a cut, so a comma pause stayed at 0.31 s. EDGE_QUIET is the edge
# check's level (SIL + 3) less 2 dB for the levelling gain applied afterwards (up to +1.4 dB in ep07). Cut points still
# sit TAIL_GUARD after a word's end and HEAD_GUARD before the next onset, and the edge check still measures every edit.
EDGE_QUIET = SIL + 1
# v2: ffmpeg's alimiter delays its output by its lookahead (131 samples, 2.97 ms at attack=3) unless latency=1, so every
# levelled final (ep06 and ep07 v1 too) sat 3 ms later than its word timings and edge checks. v2 compensates.
LIMITER_LATENCY = ":latency=1"
MIN_CUT_V2 = 0.005  # v2 cuts down to 5 ms, so a pause 10 ms over its limit is still brought to it
# The shortest a cut pause can end: v2 keeps the 20 ms of true silence on each kept side, which may lie inside the
# (silent) guard, so the guards alone set it (0.18 s).
GUARD_FLOOR = TAIL_GUARD + HEAD_GUARD

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
SCALES = ("million", "billion", "trillion")
NUMWORDS = set(ONES + TENS[2:] + ["hundred", "thousand"] + list(SCALES))

# Flags left after the pre-pass that were proved to be Whisper, not the audio: {(version, op, script, whisper): evidence}.
# Filled only after a check on the finished file (see dispatch/COMPLETION-VOICE-ASSEMBLE.md).
JUDGED: dict = {}

# ep08 equivalences on spoken tokens: (script token, Whisper token) pairs that are the same spoken word. "get" counts as
# "git" only where the script says Git (a Whisper "git" for bodyC's scripted "get back to it" stays an error);
# "cloud" / "claud" count as "claude"; "vee" counts as the "v" of "v1" ("version one" is turned into "v one" by
# hyp_pass). "GitHub" and "Github" are one token after lower-casing; "git hub", "rep o" and "ClaudeCode" are joined or
# split by fix_splits; "225" is said "two hundred twenty five" by norm_tokens, the script's "two hundred and
# twenty-five" the same once canon drops the "and"; "COMMIT" is "commit" after lower-casing.
EQUIV = {("git", "get"), ("claude", "cloud"), ("claude", "claud"), ("v", "vee")}
KEYS = {"get": "git", "cloud": "claude", "claud": "claude", "vee": "v"}
# how Whisper wrote the watched names, per final (report "whisper_names")
NAME_RE = re.compile(r"(?i)^(git|get|github|hub|claude?|cloud|claud|v1|vee|repo|rep-o|commit|comit|comet|version)\b")


def say(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + say(n % 100))
    if n < 1000000:
        return say(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + say(n % 1000))
    return say(n // 1000000) + " million" + ("" if n % 1000000 == 0 else " " + say(n % 1000000))


# ---------- text ----------
def clean_script(t):
    t = re.sub(r"<emphasis>\s*commit\s*</emphasis>", "COMMIT", t, flags=re.I)
    return re.sub(r"<[^>]+>", "", t).strip()


def norm_tokens(word):
    """One written word (script or Whisper) -> spoken tokens. Case and apostrophes are ignored ("you're" = "youre")."""
    t = word.replace("’", "'")
    t = re.sub(r"(\d),(\d{3})\b", r"\1\2", t)
    t = t.replace("%", " percent ").replace("&", " and ")
    t = re.sub(r"\d+", lambda m: " " + say(int(m.group())) + " ", t).lower()  # "225" -> "two hundred twenty five", "v1" -> "v one"
    t = re.sub(r"\b([a-z])\.(?=[a-z]\b|\s|$)", r"\1", t)  # "A.I." -> "ai"
    return [w for w in (x.replace("'", "") for x in re.findall(r"[a-z0-9']+", t)) if w]


def canon(words):
    """Written words -> [(spoken token, [word indices])]. 'a hundred' = 'one hundred'; 'hundred and five' = 'hundred five'."""
    toks = [(t, [i]) for i, w in enumerate(words) for t in norm_tokens(w)]
    out = []
    for k, (t, o) in enumerate(toks):
        nxt = toks[k + 1][0] if k + 1 < len(toks) else ""
        prv = out[-1][0] if out else ""
        if t == "a" and nxt in ("hundred", "thousand") + SCALES:
            t = "one"
        if t == "and" and prv == "hundred" and nxt in NUMWORDS:
            out[-1] = (prv, out[-1][1] + o)  # the dropped "and" belongs with "hundred"
            continue
        out.append((t, o))
    return out


def _wtext(hyp_words, o):
    return " ".join(hyp_words[h]["w"] for h in sorted(set(o)))


def hyp_pass(hyp, hyp_words):
    """Whisper-side spellings of the spoken "vee one": "version one" -> "v one" ("vee" is mapped by EQUIV, "v1" / "V1" /
    "v one" are already "v one"). Returns (tokens, log)."""
    out, log = [], []
    for k, (t, o) in enumerate(hyp):
        nxt = hyp[k + 1][0] if k + 1 < len(hyp) else ""
        if t == "version" and nxt == "one":
            log.append({"rule": "version one = v1", "whisper": _wtext(hyp_words, o + hyp[k + 1][1]), "t": round(hyp_words[o[0]]["s"], 2)})
            t = "v"
        out.append((t, o))
    return out, log


def fix_splits(hyp, vocab, pairs, hyp_words):
    """Whisper splits or joins words differently from the script ('git hub', 'rep o', 'ClaudeCode').
    Join two Whisper tokens when the joined form is a script token and the pair is not adjacent in the script;
    split one Whisper token when it is two adjacent script tokens. Returns (tokens, log)."""
    out, log, k = [], [], 0
    while k < len(hyp):
        t, o = hyp[k]
        if k + 1 < len(hyp) and (t + hyp[k + 1][0]) in vocab and (t, hyp[k + 1][0]) not in pairs:
            out.append((t + hyp[k + 1][0], o + hyp[k + 1][1]))
            log.append({"rule": f"{t} {hyp[k + 1][0]} = {t + hyp[k + 1][0]}", "whisper": _wtext(hyp_words, o + hyp[k + 1][1]), "t": round(hyp_words[o[0]]["s"], 2)})
            k += 2
            continue
        if t not in vocab:
            for c in range(1, len(t)):
                if (t[:c], t[c:]) in pairs:
                    out += [(t[:c], o), (t[c:], o)]
                    log.append({"rule": f"{t} = {t[:c]} {t[c:]}", "whisper": _wtext(hyp_words, o), "t": round(hyp_words[o[0]]["s"], 2)})
                    break
            else:
                out.append((t, o))
        else:
            out.append((t, o))
        k += 1
    return out, log


def key(t):
    return KEYS.get(t, t)


def align(hyp_words, text):
    """Time the script's words from Whisper's. Returns ([{"w","s","e"}] in script spelling, errors, equivalences fired)."""
    ref_words = clean_script(text).split()
    ref = canon(ref_words)
    hyp, eq = hyp_pass(canon([w["w"] for w in hyp_words]), hyp_words)
    vocab = {t for t, _ in ref}
    pairs = {(ref[k][0], ref[k + 1][0]) for k in range(len(ref) - 1)}
    hyp, slog = fix_splits(hyp, vocab, pairs, hyp_words)
    eq += slog
    sm = difflib.SequenceMatcher(a=[key(t) for t, _ in ref], b=[key(t) for t, _ in hyp], autojunk=False)
    errs = []
    owners = [set() for _ in ref_words]
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                rt, ht = ref[i1 + k][0], hyp[j1 + k][0]
                if rt != ht:
                    if (rt, ht) in EQUIV:  # e.g. Whisper "get" where the script says Git
                        eq.append({"rule": f"{ht} = {rt}", "script": ref_words[ref[i1 + k][1][0]], "whisper": _wtext(hyp_words, hyp[j1 + k][1]),
                                   "t": round(hyp_words[hyp[j1 + k][1][0]]["s"], 2)})
                    else:  # the reverse ("git" where the script says "get") is a real error
                        errs.append(("replace", rt, ht))
                for r in ref[i1 + k][1]:
                    owners[r].update(hyp[j1 + k][1])
        else:
            errs.append((op, " ".join(t for t, _ in ref[i1:i2]), " ".join(t for t, _ in hyp[j1:j2])))
    # a script word with no matched token that sits inside one Whisper word ('and' in '225') joins that word
    for i, o in enumerate(owners):
        if not o:
            p = next((owners[j] for j in range(i - 1, -1, -1) if owners[j]), set())
            n = next((owners[j] for j in range(i + 1, len(owners)) if owners[j]), set())
            if p & n:
                owners[i] = {max(p & n)}
    span = [None] * len(ref_words)
    i = 0
    while i < len(ref_words):
        o = owners[i]
        if not o:
            i += 1
            continue
        # consecutive script words timed by the same Whisper word(s) share that time, split by length
        j = i
        while j + 1 < len(ref_words) and owners[j + 1] == o:
            j += 1
        s0, e0 = min(hyp_words[h]["s"] for h in o), max(hyp_words[h]["e"] for h in o)
        wts = [max(1, len(re.sub(r"\W", "", w))) for w in ref_words[i : j + 1]]
        t, tot = s0, sum(wts)
        for k, wt in enumerate(wts):
            d = (e0 - s0) * wt / tot
            span[i + k] = (t, t + d)
            t += d
        i = j + 1
    for i, s in enumerate(span):  # unmatched script words (real errors): fill the gap between neighbours
        if s is None:
            a = next((span[j][1] for j in range(i - 1, -1, -1) if span[j]), hyp_words[0]["s"] if hyp_words else 0.0)
            b = next((span[j][0] for j in range(i + 1, len(span)) if span[j]), a)
            span[i] = (a, max(a, b))
    for i in range(1, len(span)):  # keep the timings in order
        if span[i][0] < span[i - 1][1]:
            span[i] = (span[i - 1][1], max(span[i - 1][1], span[i][1]))
    words = [{"w": w, "s": round(s, 3), "e": round(e, 3)} for w, (s, e) in zip(ref_words, span)]
    return words, errs, eq


def prep_whisper(ws):
    """ep08 pre-pass on Whisper's words (timings kept). Nothing is rewritten here: every ep08 equivalence is a
    spoken-token rule (norm_tokens, canon, hyp_pass, fix_splits, EQUIV) logged by align. This logs the written forms that
    rely on norm_tokens: numbers in digits ("225 million", "v1" / "V1"). Returns (words, log)."""
    log = [{"rule": "digits = spoken number", "whisper": w["w"], "t": round(w["s"], 2)} for w in ws if re.search(r"\d", w["w"])]
    return [dict(w) for w in ws], log


def name_forms(ws):
    """how Whisper wrote each watched name in a decode: {written form: count}"""
    out = {}
    for w in ws:
        if NAME_RE.match(w["w"]):
            out[w["w"]] = out.get(w["w"], 0) + 1
    return dict(sorted(out.items()))


def fix_zero_words(words, db):
    """Timings only: Whisper sometimes gives a word no length ("it" 4.36-4.38 s in bodyB t1, after a 0.26 s gap that
    is the end of "Thursday,"), so a caption would flash it for no frames. With a gap before it, the word starts at the
    deepest energy dip in that gap (the boundary with the word before; 4.27 s for that "it"); with none, it shares the
    next word's span, split by length. The audio is untouched (no cut is made inside a word pair without true silence)."""
    out = [dict(w) for w in words]
    fixed = []
    for i, w in enumerate(out):
        if w["e"] - w["s"] >= 0.03:
            continue
        prev_e = out[i - 1]["e"] if i else 0.0
        if w["s"] - prev_e > 0.05:
            a, b = int(round(prev_e * 100)), int(round(w["s"] * 100))
            w["s"] = round((a + int(np.argmin(db[a:b]))) * 0.01, 3)
        elif i + 1 < len(out):
            n = out[i + 1]
            a, b = len(re.sub(r"\W", "", w["w"])) or 1, len(re.sub(r"\W", "", n["w"])) or 1
            mid = round(w["s"] + (n["e"] - w["s"]) * a / (a + b), 3)
            w["e"], n["s"] = mid, mid
        fixed.append({"word": w["w"], "whisper": [words[i]["s"], words[i]["e"]], "now": [w["s"], w["e"]]})
    return out, fixed


def trim_tail(hyp_words):
    """Drop everything Whisper heard after the CTA's last word (Fish room tone hallucinated as speech after 'Code.')."""
    toks = [(re.sub(r"[^a-z']", "", w["w"].lower()), i) for i, w in enumerate(hyp_words)]
    ci = max(i for k, (t, i) in enumerate(toks) if t == "comment" and k + 1 < len(toks) and toks[k + 1][0] == KEY)
    last = min(i for t, i in toks if i > ci and (t == LAST or t.endswith(LAST)))  # "Code." (or a joined "ClaudeCode.")
    return hyp_words[: last + 1], [w["w"] for w in hyp_words[last + 1 :]]


# ---------- audio ----------
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def env_db(x):
    n = len(x) // HOP
    e = np.sqrt((x[: n * HOP].reshape(n, HOP) ** 2).mean(1))
    return 20 * np.log10(e + 1e-9)


def strict_db(x):
    """per 10 ms frame, the louder of its two 5 ms halves: a 5 ms click or breath that averages under SIL over 10 ms
    still marks its frame as not silent"""
    n = len(x) // HOP
    fr = x[: n * HOP].reshape(n, HOP)
    a = np.sqrt((fr[:, : HOP // 2] ** 2).mean(1))
    b = np.sqrt((fr[:, HOP // 2 :] ** 2).mean(1))
    return 20 * np.log10(np.maximum(a, b) + 1e-9)


def level_near(x, t, half=0.02):
    """loudest 5 ms RMS (1 ms steps) within +-half of t: the edge-check level, independent of the 10 ms frame grid"""
    a, b = max(0, int((t - half) * SR)), min(len(x), int((t + half) * SR))
    seg = x[a:b]
    w = int(0.005 * SR)
    if len(seg) < w:
        return -99.0
    sq = np.concatenate([[0.0], np.cumsum(seg.astype(np.float64) ** 2)])
    rms = np.sqrt((sq[w:] - sq[:-w])[:: int(0.001 * SR)] / w)
    return float(20 * np.log10(rms.max() + 1e-9))


def whisper_words(path, **kw):
    """Whisper words, seeded and without conditioning on previous text (WHISPER_KW). Returns (words, text, the
    temperatures of any segment that fell back to sampling: none in every ep07 run)."""
    import mlx.core as mx
    import mlx_whisper

    mx.random.seed(SEED)
    r = mlx_whisper.transcribe(str(path), path_or_hf_repo=WHISPER, word_timestamps=True, language="en", **{**WHISPER_KW, **kw})
    out = []
    for s in r["segments"]:
        for w in s["words"]:
            w = {"w": w["word"].strip(), "s": float(w["start"]), "e": float(w["end"])}
            # "140" + ",000", "71" + ".5", "15" + "%": one written number
            if out and re.search(r"\d$", out[-1]["w"]) and re.match(r"^([,.]\d|%)", w["w"]):
                out[-1] = {"w": out[-1]["w"] + w["w"], "s": out[-1]["s"], "e": w["e"]}
            else:
                out.append(w)
    return out, r["text"], [round(float(s["temperature"]), 1) for s in r["segments"] if s["temperature"] > 0]


def quiet_after(db, t, limit_t):
    """Energy end of the word ending near t: first frame from t on that starts 30 ms under SIL (bounded by limit_t).
    A burst within RELEASE after that quiet run still belongs to the word (stop closure + release of a final plosive)."""
    i, stop = int(t * 100), min(len(db) - 3, int(limit_t * 100))
    while True:
        while i < stop and not (db[i : i + 3] < SIL).all():
            i += 1
        burst = next((j for j in range(i + 3, min(stop, i + RELEASE)) if db[j] > SIL + 6), None)
        if burst is None:
            return max(t, i * 0.01)
        i = burst


def quiet_before(db, t, limit_t):
    """Energy start of the word starting near t: scanning back from t, the frame after a 30 ms run under SIL."""
    i, stop = int(t * 100), max(2, int(limit_t * 100))
    while i > stop and not (db[i - 3 : i] < SIL).all():
        i -= 1
    return min(t, i * 0.01)


def room_tone(x, db, n):
    """n samples of the take's own room tone: its longest run of true silence, tiled."""
    best, run, at = 0, 0, 0
    for i, q in enumerate(db < SIL):
        run = run + 1 if q else 0
        if run > best:
            best, at = run, i
    seg = x[(at - best + 2) * HOP : (at - 1) * HOP] if best > 4 else np.zeros(HOP, np.float32)
    return np.resize(seg, n).astype(np.float32)


def removable(sdb):
    """v2: per 10 ms frame, True for true silence (5 ms halves under SIL) or a faint click: a run of at most CLICK_LEN
    frames over SIL whose 5 ms halves all stay under CLICK_MAX (Fish static in a pause; not speech, not a breath)"""
    q = sdb < SIL
    out = q.copy()
    i, n = 0, len(sdb)
    while i < n:
        if q[i]:
            i += 1
            continue
        j = i
        while j < n and not q[j]:
            j += 1
        if j - i <= CLICK_LEN and (sdb[i:j] < CLICK_MAX).all():
            out[i:j] = True
        i = j
    return out


def level_ms(x):
    """5 ms RMS in dB at 1 ms steps (window k starts at k ms): the edge check's own measure (level_near)"""
    w = int(0.005 * SR)
    sq = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    idx = (np.arange(int((len(x) - w) * 1000 / SR)) * SR / 1000).astype(int)
    return 20 * np.log10(np.sqrt((sq[idx + w] - sq[idx]) / w) + 1e-9)


def v2_cuts(sdb, lev, z0, z1, need):
    """v2: cuts inside the guard zone [z0, z1] (TAIL_GUARD after the word end, HEAD_GUARD before the next word's onset,
    outside the CTA guard) removing up to `need` seconds. A cut may remove anything quieter than CLICK_MAX (true silence,
    faint clicks and hum: Fish static between words) but never a louder sound (a breath stays). Each cut point keeps
    EDGE_MARGIN under EDGE_QUIET (the edge check's level) on its kept side (before c0, after c1), inside the guard if need be.
    Stretches are used largest first; a cut is centred in its stretch when it has room to spare. Returns [(c0, c1)]."""
    rem = sdb < CLICK_MAX
    lo, hi = z0, z1
    nl = len(lev)

    def quiet(a, b):  # every 5 ms window (1 ms steps, as the edge check measures) inside [a, b] is under EDGE_QUIET
        ka, kb = int(round(a * 1000)), int(round(b * 1000)) - 5
        return 0 <= ka and kb < nl and bool((lev[ka : kb + 1] < EDGE_QUIET).all())

    segs, f = [], int(np.floor(lo * 100))
    while f < int(np.ceil(hi * 100)):
        if not rem[f]:
            f += 1
            continue
        g = f
        while g < int(np.ceil(hi * 100)) and rem[g]:
            g += 1
        segs.append((max(lo, f * 0.01), min(hi, g * 0.01)))
        f = g
    cand = []
    for a, b in segs:
        grid = np.round(np.arange(a, b + 1e-9, 0.001), 3)
        c0s = [t for t in grid if quiet(t - EDGE_MARGIN, t)]
        c1s = [t for t in grid if quiet(t, t + EDGE_MARGIN)]
        if c0s and c1s and c1s[-1] - c0s[0] >= MIN_CUT_V2 - 1e-6:
            cand.append((c1s[-1] - c0s[0], a, b, c0s, c1s))
    cuts = []
    for cap, a, b, c0s, c1s in sorted(cand, key=lambda c: -c[0]):
        if need < MIN_CUT_V2 - 1e-6:
            break
        want = min(need, cap)
        c1a = np.array(c1s)
        best = None
        for c0 in c0s:
            k = np.searchsorted(c1a, c0 + want + 1e-9) - 1
            if k < 0 or c1a[k] <= c0:
                continue
            L = c1a[k] - c0
            off = abs((c0 + c1a[k]) / 2 - (a + b) / 2)
            if best is None or L > best[0] + 1e-9 or (abs(L - best[0]) <= 1e-9 and off < best[1]):
                best = (L, off, c0, float(c1a[k]))
        if best and best[0] >= MIN_CUT_V2 - 1e-6:
            cuts.append((float(best[2]), float(best[3])))
            need -= best[0]
    return sorted(cuts)


def tighten(x, words, end_pad, protect_word=None):
    """Cut dead air between words under the guards (ep06's current rule: 5 ms halves, EDGE_MARGIN). Returns audio,
    shifted words, the speech spans (start, end, word) in output time for the edge check, the edit times and info."""
    db = env_db(x)
    sdb = strict_db(x)
    T = len(x) / SR
    starts = [quiet_before(db, w["s"], (words[i - 1]["e"] if i else 0.0)) for i, w in enumerate(words)]
    ends = [quiet_after(db, w["e"], (words[i + 1]["s"] if i + 1 < len(words) else T)) for i, w in enumerate(words)]
    # ep05: Whisper often starts the first word at 0.00 s while the take is still silent; start at the energy onset.
    f = int(starts[0] * 100)
    while f < int(ends[0] * 100) and db[f] < SIL:
        f += 1
    if f * 0.01 > starts[0]:
        starts[0] = f * 0.01
        words = [{**words[0], "s": max(words[0]["s"], starts[0])}] + words[1:]
    # ep06: a pause hidden inside a Whisper word is found from the first word's energy end to the next word's onset.
    # v2: a faint click no longer breaks the unbroken silence GAP_MIN asks for (it held pauses open in v1)
    rem = (removable(sdb) | (sdb < HUM_MAX)) if V2 else (db < SIL)
    lev = level_ms(x) if V2 else None
    last_onset = starts[0]
    for i in range(len(words) - 1):
        stop = min(int((words[i + 1]["e"] + 0.15) * 100), int(words[i + 2]["s"] * 100) if i + 2 < len(words) else len(db) - 3)
        tail = quiet_after(db, words[i]["e"], stop * 0.01)
        f = g = int(round(tail * 100))
        while g < stop and not (db[g : g + 3] >= SIL).all():  # the first 30 ms of sustained sound
            g += 1
        while V2 and g < stop:  # v2: skip hum (see HUM_MAX)
            h = g
            while h < stop and sdb[h] < HUM_MAX and not (db[h : h + 3] < SIL).all():
                h += 1
            if not (h < stop and h > g and (db[h : h + 3] < SIL).all()):
                break
            g = h + 3
            while g < stop and not (db[g : g + 3] >= SIL).all():
                g += 1
        # back over any flicker before it, to the last 30 ms under SIL. v2: int(g * 0.01 * 100) can round down to g - 1,
        # which put the onset 10 ms early, in silence (so a pause measured 0.24 s while the sound came 0.25 s after)
        onset = quiet_before(db, g * 0.01 + (1e-6 if V2 else 0.0), tail)
        best = run = 0
        for v in rem[f : int(round(onset * 100))]:
            run = run + 1 if v else 0
            best = max(best, run)
        if g < stop and best >= GAP_MIN * 100 and tail > last_onset:
            ends[i] = max(words[i]["e"], tail)
            starts[i + 1] = onset
        last_onset = starts[i + 1]
    protect = []
    if protect_word is not None:  # the CTA keyword: CTA_GUARD around its full sound (energy and Whisper edges)
        k = protect_word
        protect = [(min(starts[k], words[k]["s"]) - CTA_GUARD, max(ends[k], words[k]["e"]) + CTA_GUARD)]
    cuts = []
    for i in range(len(words) - 1):
        a = words[i]
        p = a["w"][-1:]
        limit = SENT if p in ".?!" else COMMA if p in ",;:" else WORD
        z0, z1 = ends[i] + TAIL_GUARD, starts[i + 1] - HEAD_GUARD
        for p0, p1 in protect:  # keep everything near the CTA keyword
            if z0 < p1 and z1 > p0:
                if p0 - z0 >= z1 - p1:
                    z1 = min(z1, p0)
                else:
                    z0 = max(z0, p1)
        if z1 - z0 < (MIN_CUT_V2 if V2 else MIN_CUT):
            continue
        if V2:  # every removable stretch of the pause, across faint clicks, down to the limit
            cuts += v2_cuts(sdb, lev, z0, z1, (starts[i + 1] - ends[i]) - limit)
            continue
        # v1: only true silence: the longest all-quiet run inside the zone (5 ms halves), less EDGE_MARGIN at each end
        f0, f1 = int(np.ceil(z0 * 100)), int(z1 * 100)
        best, run, at = 0, 0, f0
        for f in range(f0, f1):
            run = run + 1 if sdb[f] < SIL else 0
            if run > best:
                best, at = run, f
        q0, q1 = (at - best + 1) * 0.01 + EDGE_MARGIN, (at + 1) * 0.01 - EDGE_MARGIN
        if q1 - q0 < MIN_CUT:
            continue
        cut = min(q1 - q0, (starts[i + 1] - ends[i]) - limit)
        if cut < MIN_CUT:
            continue
        c0 = q0 + (q1 - q0 - cut) / 2
        cuts.append((c0, c0 + cut))
    assert all(c1 <= n0 for (_, c1), (n0, _) in zip(cuts, cuts[1:])), "overlapping cuts"
    on = max(0.0, starts[0] - LEAD)
    lead_fill = LEAD - (starts[0] - on)  # the take starts speaking before LEAD: fill the rest with its room tone
    off = ends[-1]  # the take is cut here: the energy end of its last word
    keep, cur = [], on
    for c0, c1 in cuts:
        keep.append((cur, c0))
        cur = c1
    keep.append((cur, off))
    f = int(FADE * SR)
    parts = []
    if lead_fill > 0.005:
        rt = room_tone(x, db, int(lead_fill * SR))
        rt[:f] *= np.linspace(0, 1, f)
        parts.append(rt)
    else:
        lead_fill = 0.0
    for s, e in keep:
        seg = x[int(s * SR) : int(e * SR)].copy()
        if len(seg) > 2 * f:
            seg[:f] *= np.linspace(0, 1, f)
            seg[-f:] *= np.linspace(1, 0, f)
        parts.append(seg)
    # end pad: the take's own audio after the last word if it is silent, else room tone
    n = int(end_pad * SR)
    raw = x[int(off * SR) : int(off * SR) + n]
    if len(raw) == n and (env_db(raw) < SIL).all():
        pad = raw.copy()
        pad_src = "take"
    else:
        pad = room_tone(x, db, n)
        pad_src = "room tone"
    pad[-f:] *= np.linspace(1, 0, f)
    parts.append(pad)

    def shift(t):
        return t + lead_fill - on - sum(min(c1, t) - c0 for c0, c1 in cuts if t > c0)

    # Timings only: a word whose Whisper start sits in the pause before it starts at its first non-silent frame.
    onsets = []
    for w, st in zip(words, starts):
        f, stop = int(round(max(w["s"], st) * 100)), int(round(w["e"] * 100)) - 5
        while f < stop and db[f] < SIL:
            f += 1
        onsets.append(max(w["s"], st, f * 0.01) if f < stop else max(w["s"], st))
    if V2:
        # v2 (INFRA: "dollars." ended at f965 in words_A while the voice ran to f983): a word ends where the cutter ends
        # it, the later of Whisper's end and the energy tail; after a real pause (30 ms or more of silence) a word
        # starts at its acoustic onset (ep06's onset: first 30 ms of sound, walked back over faint flicker)
        s_out = [max(0.0, shift(min(o, st) if i and st - ends[i - 1] >= 0.03 and db[min(len(db) - 1, int(round(st * 100)))] >= SIL else o))
                 for i, (o, st) in enumerate(zip(onsets, starts))]
        e_out = [max(0.0, shift(max(w["e"], e))) for w, e in zip(words, ends)]
        for i in range(len(words) - 1):
            e_out[i] = min(e_out[i], s_out[i + 1])
            s_out[i] = min(s_out[i], e_out[i])
        moved = [{"w": w["w"], "s": round(a, 3), "e": round(b, 3)} for w, a, b in zip(words, s_out, e_out)]
        corr_e = [(round(b - max(0.0, shift(w["e"])), 3), w["w"]) for w, b in zip(words, e_out)]
        corr_s = [(round(max(0.0, shift(o)) - a, 3), w["w"]) for w, o, a in zip(words, onsets, s_out)]
    else:
        moved = [{"w": w["w"], "s": round(max(0.0, shift(o)), 3), "e": round(max(0.0, shift(w["e"])), 3)} for w, o in zip(words, onsets)]
        corr_e = corr_s = [(0.0, "")]
    spans = [(round(shift(s), 3), round(shift(e), 3), w["w"]) for s, e, w in zip(starts, ends, words)]
    edits = [round(shift(c0), 3) for c0, _ in cuts]
    # every pause on ep06's measure (cutter's word end to next onset), before and after the cuts, with what is inside
    pauses = []
    for i in range(len(words) - 1):
        a, b = ends[i], starts[i + 1]
        if b - a <= 0.005:
            continue
        p = words[i]["w"][-1:]
        limit = SENT if p in ".?!" else COMMA if p in ",;:" else WORD
        removed = sum(max(0.0, min(c1, b) - max(c0, a)) for c0, c1 in cuts)
        fa, fb = int(round(a * 100)), int(round(b * 100))
        inside = sdb[fa + int(TAIL_GUARD * 100) : max(fa + int(TAIL_GUARD * 100), fb - int(HEAD_GUARD * 100))]
        pauses.append({"i": i, "after": words[i]["w"], "before": words[i + 1]["w"], "t_out": round(shift(a), 3), "limit": limit,
                       "src_gap": round(b - a, 3), "removed": round(removed, 3), "gap": round(b - a - removed, 3),
                       "loudest_between_guards_db": round(float(inside.max()), 1) if len(inside) else None,
                       "clicks_removed": int(sum(1 for c0, c1 in cuts if a <= c0 < b for f in range(int(c0 * 100), int(c1 * 100)) if not sdb[f] < SIL and (f == int(c0 * 100) or sdb[f - 1] < SIL)))})
    # the take's tail as cut: what was dropped after the last word, and the loudest frame in it
    tail = x[int(off * SR) :]
    info = {"speech_onset_s": round(starts[0], 3), "cut_at_s": round(off, 3), "take_s": round(T, 3), "dropped_tail_s": round(T - off, 3),
            "dropped_tail_max_db": round(float(env_db(tail).max()), 1) if len(tail) >= HOP else None, "pad_src": pad_src,
            "removed_s": round(sum(c1 - c0 for c0, c1 in cuts), 3), "lead_fill_s": round(lead_fill, 3), "cuts": len(cuts),
            "largest_word_end_correction": max(corr_e), "largest_word_start_correction": max(corr_s), "pauses": pauses}
    return np.concatenate(parts), moved, spans, edits, info


def vrms(x):
    e = 10 ** (env_db(x) / 20)
    e = e[e > 10 ** (-40 / 20)]
    return np.sqrt((e**2).mean())


def measure(src, is_file=True):
    """Integrated LUFS and true peak (dBTP) via ffmpeg ebur128."""
    if is_file:
        p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True)
    else:
        p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128=peak=true", "-f", "null", "-"],
                           input=src.astype(np.float32).tobytes(), capture_output=True)
    err = p.stderr.decode()
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", err)[-1])


def write_level(x, path):
    """Gain to -16 LUFS through a peak limiter; re-aim the gain until -16.0 (+-0.1) LUFS, lower the ceiling if TP > -1.5."""
    gain = LUFS - measure(x, False)[0]
    limit_db = TP_MAX - 0.3
    for _ in range(10):
        y = x * 10 ** (gain / 20)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", f"alimiter=limit={10 ** (limit_db / 20):.4f}:attack=3:release=40:level=disabled{LIMITER_LATENCY}", "-c:a", "pcm_s16le", str(path)],
                       input=y.astype(np.float32).tobytes(), check=True)
        lu, tp = measure(path)
        if tp > TP_MAX:
            limit_db -= 0.2
        elif abs(lu - LUFS) <= 0.1:
            return lu, tp
        gain += LUFS - lu
    return lu, tp


def clicks(x):
    """Static: crackle events per second (ep01 static_metrics), gain-matched to -18 LUFS. Victor's real voice: 5.2."""
    sys.path.insert(0, STATIC)
    from static_metrics import analyse

    lu = measure(x, False)[0]
    return round(float(analyse(x.astype(np.float64) * 10 ** ((-18 - lu) / 20))["click"]), 2)


def f0_median(x):
    """median pitch of voiced frames (Hz): autocorrelation, 70-400 Hz, loud frames with periodicity over 0.5"""
    a = x.astype(np.float64)
    n, hop = 2048, 512
    W = np.lib.stride_tricks.sliding_window_view(a, n)[::hop]
    rms = 20 * np.log10(np.sqrt((W**2).mean(1)) + 1e-12)
    loud = rms > np.percentile(rms, 95) - 30
    F = np.fft.rfft((W - W.mean(1, keepdims=True)) * np.hanning(n), 2 * n, axis=1)
    ac = np.fft.irfft(np.abs(F) ** 2, axis=1)[:, :n]
    lo, hi = SR // 400, SR // 70
    lag = lo + np.argmax(ac[:, lo:hi], axis=1)
    r = ac[np.arange(len(ac)), lag] / (ac[:, 0] + 1e-12)
    return round(float(np.median((SR / lag)[loud & (r > 0.5)])), 1)


def edge_check(final, spans, edits, check_words):
    """For every edit point (cuts, the hook/body join, file end): distance to the previous word's energy end, distance to
    the next word's energy start, and the level around the edit. For each named word: its tail level and gap to the next edit."""
    db = env_db(final)
    T = len(final) / SR
    rows, bad = [], []
    for t, kind in edits + [(T, "file end")]:
        prev = max((s for s in spans if s[1] <= t + 1e-6), key=lambda s: s[1], default=None)
        nxt = min((s for s in spans if s[0] >= t - 1e-6), key=lambda s: s[0], default=None)
        lvl = level_near(final, t)
        d_prev = round(t - prev[1], 3) if prev else None
        d_next = round(nxt[0] - t, 3) if nxt else None
        ok = bool((d_prev is None or d_prev >= TAIL_GUARD - 0.011) and (d_next is None or d_next >= HEAD_GUARD - 0.011) and lvl < SIL + 3)
        rows.append({"t": round(t, 3), "kind": kind, "after": prev[2] if prev else None, "gap_after_word": d_prev,
                     "before": nxt[2] if nxt else None, "gap_before_word": d_next, "level_db": round(lvl, 1), "ok": ok})
        if not ok:
            bad.append(rows[-1])
    words = []
    all_edits = sorted([t for t, _ in edits] + [T])
    for s, e, w in spans:
        if any(re.match(p, w) for p in check_words):
            nxt_edit = min((t for t in all_edits if t >= e - 1e-6), default=T)
            i = int(e * 100)
            words.append({"word": w, "energy_end": e, "next_edit_in": round(nxt_edit - e, 3),
                          "level_10ms_before_end": round(float(db[max(0, i - 1)]), 1), "ok": bool(nxt_edit - e >= TAIL_GUARD - 0.011)})
    return rows, bad, words


def long_gaps(final, spans, end_t):
    """every run of true silence (5 ms halves) longer than LONG_GAP before end_t, with the words around it"""
    sdb = strict_db(final)
    out, run = [], 0
    n = min(len(sdb), int(end_t * 100))
    for f in range(n + 1):
        if f < n and sdb[f] < SIL:
            run += 1
            continue
        if run * 0.01 > LONG_GAP:
            a, b = (f - run) * 0.01, f * 0.01
            prev = max((s for s in spans if s[1] <= b), key=lambda s: s[1], default=None)
            nxt = min((s for s in spans if s[0] >= a), key=lambda s: s[0], default=None)
            out.append({"from": round(a, 2), "to": round(b, 2), "s": round(b - a, 2), "after": prev[2] if prev else None, "before": nxt[2] if nxt else None})
        run = 0
    return out


def sentence_steps(final, words, n_hook, hook_gain):
    """Is the hook-to-body step bigger than the voice's own steps between sentences? Per script sentence (split after
    . ? !): speech level (dB RMS of frames over -40 dB) and median pitch; then the step from each sentence to the next
    inside the body, against the step from the hook's last sentence to the body's first."""
    sents, cur = [], []
    for k, w in enumerate(words):
        cur.append((k, w))
        if w["w"][-1:] in ".?!" or k == n_hook - 1:
            sents.append(cur)
            cur = []
    rows = []
    for sw in sents:
        a, b = sw[0][1]["s"], sw[-1][1]["e"]
        seg = final[int(a * SR) : int(b * SR)]
        rows.append({"first_word": sw[0][1]["w"], "s": a, "e": b, "hook": sw[0][0] < n_hook,
                     "level_db": round(float(20 * np.log10(vrms(seg))), 2), "f0_hz": f0_median(seg) if b - a >= 0.5 else None})
    j = next(i for i, r in enumerate(rows) if not r["hook"])
    lv = [rows[i + 1]["level_db"] - rows[i]["level_db"] for i in range(j, len(rows) - 1)]
    st = [12 * np.log2(rows[i + 1]["f0_hz"] / rows[i]["f0_hz"]) for i in range(j, len(rows) - 1) if rows[i]["f0_hz"] and rows[i + 1]["f0_hz"]]
    jl = rows[j]["level_db"] - rows[j - 1]["level_db"]
    js = 12 * np.log2(rows[j]["f0_hz"] / rows[j - 1]["f0_hz"])

    def dist(v, x):
        a = np.abs(v)
        return {"median": round(float(np.median(a)), 2), "p90": round(float(np.percentile(a, 90)), 2), "max": round(float(a.max()), 2),
                "share_of_body_steps_bigger": round(float((a > abs(x)).mean()), 2)}

    return {"join_level_step_db": round(jl, 2), "join_level_step_db_without_match": round(jl + hook_gain, 2),
            "body_sentence_level_steps_abs_db": dist(lv, jl), "body_sentence_level_steps_abs_db_vs_no_match": dist(lv, jl + hook_gain),
            "join_pitch_step_semitones": round(float(js), 2), "body_sentence_pitch_steps_abs_semitones": dist(st, js),
            "hook_last_sentence": rows[j - 1], "body_first_sentence": rows[j], "sentences": len(rows)}



def pause_report(final, hinfo, binfo, L, n_hook, kw_body, join_gap):
    """Every pause of the finished file on ep06's measure (the cutter's word end, the later of Whisper's end and the
    energy tail, to the next word's onset), with the pure energy gap beside it (last sound to first sound in the final,
    faint clicks counted as silence), and each pause still over its limit with the reason."""
    sdb = strict_db(final)
    rem = removable(sdb)
    rows = []
    for part, off, info in (("hook", 0.0, hinfo), ("body", L, binfo)):
        for p in info["pauses"]:
            rows.append(dict(p, part=part, t=round(p["t_out"] + off, 3)))
    rows.append({"part": "join", "after": "(hook)", "before": "(body)", "t": round(L - join_gap, 3), "limit": SENT, "src_gap": join_gap,
                 "removed": 0.0, "gap": join_gap, "loudest_between_guards_db": None, "clicks_removed": 0})
    for r in rows:
        a, b = r["t"], r["t"] + r["gap"]
        m = int((a + b) / 2 * 100)
        if 0 <= m < len(rem) and rem[m]:
            i = j = m
            while i > 0 and rem[i - 1]:
                i -= 1
            while j < len(rem) and rem[j]:
                j += 1
            r["energy_gap"] = round((j - i) * 0.01, 2)
        else:
            r["energy_gap"] = None
        why = None
        if r["gap"] > r["limit"] + 0.005:
            if r["part"] == "join":
                why = "hook/body join: END_HOOK 0.30 s of the hook's room tone + LEAD 0.06 s (as ep05 to ep07)"
            elif r["part"] == "body" and r["i"] in (kw_body - 1, kw_body):
                why = "CTA guard: nothing is cut within 0.3 s of COMMIT"
            elif r["gap"] <= GUARD_FLOOR + 0.011:
                why = f"guard floor: 120 ms after the word end + 60 ms before the next word = {GUARD_FLOOR:.2f} s"
            elif r["loudest_between_guards_db"] is not None and r["loudest_between_guards_db"] >= CLICK_MAX:
                why = f"a sound at {r['loudest_between_guards_db']} dB between the guards is kept (breath, not static)"
            elif r["loudest_between_guards_db"] is not None:
                why = ("the room tone here hovers around the -52 dB line, so few points have the 20 ms under EDGE_QUIET (-51 dB) "
                       "a cut point keeps on its kept side; the cuts stop short of the guard floor")
            else:
                why = "other (check)"
        r["over_limit_because"] = why
    return rows


def seg_lufs(x, a, b):
    """integrated LUFS of x between a and b seconds"""
    return measure(x[int(a * SR) : int(b * SR)], False)[0]


def crop_text(wav, a, b, tag):
    """Whisper (no conditioning) on a crop of the finished file: evidence for a pre-pass equivalence"""
    crop = SCRATCH / f"_ep08_crop_{tag}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ss", f"{max(0.0, a):.3f}", "-t", f"{b - max(0.0, a):.3f}", str(crop)], check=True)
    ws, text, _ = whisper_words(crop)
    crop.unlink()
    return text.strip()


def pick_cut_point(line):
    """the cut point the take agent wrote in PICK-<line>.json (seconds from the take's start), for comparison"""
    p = json.load(open(TAKES / f"PICK-{line}.json"))
    for k in ("last_word_end_s", "pick_speech_end_s"):
        if k in p:
            return p[k]
    t = next((t for t in p["takes"] if t["file"] == p["pick"]), {})
    return t.get("speech_end_s", t.get("last_word_end_s"))


def take_line(line, pick, text):
    """Whisper a take, align to the script, tighten. Returns (audio, words, spans, edits, info, errs, prepass log)."""
    is_body = line.startswith("body")
    x = load(TAKES / pick)
    # Whisper the take only up to 0.15 s past its last sound (the room-tone tail is where Fish's takes collect Whisper
    # hallucinations: "Captions by GetTranscribed.com", "You are not going away" x6); the cut itself is still set by
    # the last word's energy end in tighten()
    last_sound = (np.nonzero(env_db(x) >= SIL)[0].max() + 1) * 0.01
    crop = SCRATCH / f"_ep08_take_{line}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(TAKES / pick), "-t", f"{last_sound + 0.15:.3f}", str(crop)], check=True)
    ws, _, fallback = whisper_words(crop)
    crop.unlink()
    dropped = []
    if is_body:  # cut everything after the CTA's last word; guard the keyword
        ws, dropped = trim_tail(ws)
    names = name_forms(ws)
    ws, plog = prep_whisper(ws)
    ws, errs, eq = align(ws, text)
    plog += eq
    ws, zfix = fix_zero_words(ws, env_db(x))
    kw = None
    if is_body:
        kw = next(i for i, w in enumerate(ws) if w["w"] == "COMMIT" and ws[i - 1]["w"] == "Comment")
    audio, moved, spans, edits, info = tighten(x, ws, END_BODY if is_body else END_HOOK, kw)
    info.update({"last_sound_s": round(last_sound, 2), "whisper_fallback_temps": fallback, "whisper_names": names, "zero_length_words_fixed": zfix, "whisper_words_dropped_after_last_word": dropped, "raw_lufs": measure(x[int(info["speech_onset_s"] * SR) : int(info["cut_at_s"] * SR)], False)[0],
                 "f0_median_hz": f0_median(x[int(info["speech_onset_s"] * SR) : int(info["cut_at_s"] * SR)]), "pick_file_cut_s": pick_cut_point(line)})
    return audio, moved, spans, edits, info, errs, plog


def main():
    texts = {k: (TAKES / f"{k}.txt").read_text().strip() for k in PICKS}
    versions = {v: hb for v, hb in VERSIONS.items() if not ONLY or v in ONLY}
    lines = {}
    for v, (h, b) in versions.items():
        for k in (h, b):
            if k in lines:  # versions share lines: each take is Whispered and cut once (the result is the same each time)
                continue
            audio, moved, spans, edits, info, errs, plog = take_line(k, PICKS[k], texts[k])
            lines[k] = (audio, moved, spans, edits, info, errs, plog)
            print(f"{k:5s} {PICKS[k]:13s} speech {info['speech_onset_s']:.2f}-{info['cut_at_s']:.2f} s (pick file {info['pick_file_cut_s']}) -> "
                  f"{len(audio) / SR:.2f} s ({len(edits)} pauses shortened, {info['removed_s']:.2f} s removed, end pad from {info['pad_src']}), "
                  f"take diff errors: {errs}", flush=True)
    rpath = OUT_VOICE / f"{NAME} {TAG} report.json"
    report = json.load(open(rpath)) if ONLY and rpath.exists() else {}
    for ver, (h, b) in versions.items():
        hook, hw, hspans, hedits, hinfo, herrs, hlog = lines[h]
        body, bw, bspans, bedits, binfo, berrs, blog = lines[b]
        # the hook-to-body step: the raw takes as cut, then the gain match (MATCH) before the shared levelling
        h_lu, b_lu = measure(hook, False)[0], measure(body, False)[0]
        h_vr, b_vr = 20 * np.log10(vrms(hook)), 20 * np.log10(vrms(body))
        g = {"vrms": b_vr - h_vr, "lufs": b_lu - h_lu, "none": 0.0}[MATCH]
        hook = hook * 10 ** (g / 20)
        L = len(hook) / SR
        out = np.concatenate([hook, body])
        OUT_VOICE.mkdir(parents=True, exist_ok=True)
        wav = OUT_VOICE / f"{NAME} {TAG} ({ver}).wav"
        lu, tp = write_level(out, wav)
        words = [dict(w) for w in hw] + [{"w": w["w"], "s": round(w["s"] + L, 3), "e": round(w["e"] + L, 3)} for w in bw]
        dur = round(len(out) / SR, 3)
        OUT_TIMING.mkdir(parents=True, exist_ok=True)
        wpath = OUT_TIMING / f"words_{ver}.json"  # written next to the target and renamed over it (renders read these)
        json.dump({"text": " ".join(w["w"] for w in words), "words": words, "hook_end": hw[-1]["e"], "body_start": round(L, 3), "duration": dur},
                  open(wpath.with_name(wpath.name + ".tmp"), "w"), indent=1)
        os.replace(wpath.with_name(wpath.name + ".tmp"), wpath)
        if not DRY:
            PUB.mkdir(parents=True, exist_ok=True)
            subprocess.run(["cp", str(wav), str(PUB / f"{ver}.tmp.wav")], check=True)
            os.replace(PUB / f"{ver}.tmp.wav", PUB / f"{ver}.wav")
        # edge check on the finished, levelled file
        final = load(wav)
        spans = list(hspans) + [(s + L, e + L, w) for s, e, w in bspans]
        edits = [(t, "cut") for t in hedits] + [(L, "hook/body join")] + [(t + L, "cut") for t in bedits]
        sent_ends = [re.escape(w["w"]) + "$" for w in bw if w["w"][-1:] in ".?!"]
        checks = ["^Comment", "^COMMIT", "^GitHub", "^Git", "^Claude", "^Code", "^v1", "^repo", "^commit", "^Commit", "^push",
                  "^branch", "^tag", "^AI", "^million", "^nothing", "^laptop", "^online", re.escape(hw[-1]["w"]) + "$"] + sent_ends
        rows, bad, cw = edge_check(final, spans, edits, checks)
        g0, g1, _ = next(s for s in spans if s[2] == "COMMIT")
        cta_gap = round(min(g0 - t if t <= g0 else t - g1 for t, _ in edits), 3)  # nearest edit to the keyword's sound
        if cta_gap < CTA_GUARD - 0.011:
            bad.append({"kind": "CTA guard", "nearest_edit_to_COMMIT": cta_gap})
        epath = OUT_TIMING / f"edge_check_{ver}.json"
        json.dump({"edits": rows, "words": cw}, open(epath.with_name(epath.name + ".tmp"), "w"), indent=1)
        os.replace(epath.with_name(epath.name + ".tmp"), epath)
        # final Whisper check on the finished file up to 0.15 s past the last word's energy end (Whisper loops on the
        # 0.5 s room-tone tail, a known artefact on near-silence; the tail itself is checked by level)
        crop = SCRATCH / f"_ep08_check_{ver}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-t", f"{spans[-1][1] + 0.15:.3f}", str(crop)], check=True)
        fw, ftext, ffall = whisper_words(crop)
        crop.unlink()
        fnames = name_forms(fw)
        fw, flog = prep_whisper(fw)
        _, ferrs, feq = align(fw, texts[h] + " " + texts[b])
        flog += feq
        judged = [{"flag": e, "evidence": JUDGED[(ver,) + tuple(e)]} for e in ferrs if (ver,) + tuple(e) in JUDGED]
        real = [e for e in ferrs if (ver,) + tuple(e) not in JUDGED]
        # every sound-alike equivalence that fires in a final (get / Cloud / Claud / vee / version one / a join or split) is
        # re-read on a crop of the finished file, as evidence
        for item in flog:
            if item["rule"] != "digits = spoken number":
                item["crop_whisper"] = crop_text(wav, item["t"] - 0.9, item["t"] + 0.9, f"{ver}_{int(item['t'] * 100)}")
        # the hook/body step in the finished file: whole parts, and the 3 s either side of the join
        hs0, hs1 = hspans[0][0], hspans[-1][1]
        bs0, bs1 = spans[len(hspans)][0], spans[-1][1]
        step = {"raw_hook_lufs": round(h_lu, 2), "raw_body_lufs": round(b_lu, 2), "raw_step_lu": round(b_lu - h_lu, 2),
                "raw_hook_speech_rms_db": round(float(h_vr), 2), "raw_body_speech_rms_db": round(float(b_vr), 2), "raw_step_speech_rms_db": round(float(b_vr - h_vr), 2),
                "match": MATCH, "hook_gain_db": round(float(g), 2),
                "final_hook_lufs": round(seg_lufs(final, hs0, hs1), 2), "final_body_lufs": round(seg_lufs(final, bs0, bs1), 2),
                "final_last3s_hook_lufs": round(seg_lufs(final, max(hs0, hs1 - 3), hs1), 2), "final_first3s_body_lufs": round(seg_lufs(final, bs0, bs0 + 3), 2),
                "hook_f0_hz": f0_median(final[int(hs0 * SR) : int(hs1 * SR)]), "body_f0_hz": f0_median(final[int(bs0 * SR) : int(bs1 * SR)]),
                "last3s_hook_f0_hz": f0_median(final[int(max(hs0, hs1 - 3) * SR) : int(hs1 * SR)]), "first3s_body_f0_hz": f0_median(final[int(bs0 * SR) : int((bs0 + 3) * SR)])}
        step["final_step_lu"] = round(step["final_body_lufs"] - step["final_hook_lufs"], 2)
        step["final_join_step_lu"] = round(step["final_first3s_body_lufs"] - step["final_last3s_hook_lufs"], 2)
        step["step_hz"] = round(step["body_f0_hz"] - step["hook_f0_hz"], 1)
        step["step_semitones"] = round(12 * np.log2(step["body_f0_hz"] / step["hook_f0_hz"]), 2)
        step["join_step_hz"] = round(step["first3s_body_f0_hz"] - step["last3s_hook_f0_hz"], 1)
        step["sentence_steps"] = sentence_steps(final, words, len(hw), float(g))
        gaps = long_gaps(final, spans, spans[-1][1])
        kb = next(i for i, sp in enumerate(bspans) if sp[2] == "COMMIT")
        prow = pause_report(final, hinfo, binfo, L, len(hspans), kb, round(spans[len(hspans)][0] - spans[len(hspans) - 1][1], 3))
        over = [r for r in prow if r["over_limit_because"]]
        sent = [r for r in prow if r["limit"] == SENT and r["part"] != "join"]
        comma = [r for r in prow if r["limit"] == COMMA]
        pstat = {"sentence_pauses": len(sent), "sentence_max_gap": max(r["gap"] for r in sent), "sentence_over_0.24": sum(r["gap"] > SENT + 0.005 for r in sent),
                 "comma_pauses": len(comma), "comma_max_gap": max(r["gap"] for r in comma), "comma_over_0.14": sum(r["gap"] > COMMA + 0.005 for r in comma),
                 "sentence_max_energy_gap": max((r["energy_gap"] or 0) for r in sent), "comma_max_energy_gap": max((r["energy_gap"] or 0) for r in comma),
                 "clicks_removed": sum(r["clicks_removed"] for r in prow)}
        db = env_db(final)
        report[ver] = {"hook": PICKS[h], "body": PICKS[b], "duration": dur, "hook_part": round(L, 3), "body_part": round(dur - L, 3),
                       "hook_end": hw[-1]["e"], "body_start": round(L, 3),
                       "hook_pauses_shortened": len(hedits), "body_pauses_shortened": len(bedits),
                       "hook_take": hinfo, "body_take": binfo,
                       "first_word_at": spans[0][0], "lead_max_db": round(float(db[: max(1, int(spans[0][0] * 100))].max()), 1),
                       "tail_after_last_word": round(dur - spans[-1][1], 3), "tail_max_db": round(float(env_db(final[int(spans[-1][1] * SR):]).max()), 1),
                       "hook_end_to_body_start": round(L - hw[-1]["e"], 3), "hook_last_word_to_body_first_word": round(L + bw[0]["s"] - hw[-1]["e"], 3),
                       "hook_energy_end_to_body_energy_onset": round(bs0 - hs1, 3),
                       "lufs": lu, "true_peak": tp, "clicks_per_s": clicks(final), "f0_median_hz": f0_median(final), "join": step,
                       "whisper_errors": ferrs, "whisper_real_errors": real, "whisper_judged_quirks": judged, "whisper_equivalences_fired": flog,
                       "whisper_names": fnames, "whisper_text": ftext.strip(), "whisper_fallback_temps": ffall,
                       "whisper_settings": {"model": WHISPER, **WHISPER_KW, "seed": SEED, "crop": "to 0.15 s past the last word's energy end"}, "take_diff_errors": {h: herrs, b: berrs},
                       "take_equivalences_fired": {h: hlog, b: blog},
                       "edits": len(rows), "edit_violations": bad, "checked_words": len(cw), "word_violations": [w for w in cw if not w["ok"]],
                       "nearest_edit_after_word_end": min(r["gap_after_word"] for r in rows if r["gap_after_word"] is not None),
                       "nearest_edit_before_word_start": min(r["gap_before_word"] for r in rows if r["gap_before_word"] is not None),
                       "loudest_edit_db": max(r["level_db"] for r in rows if r["kind"] != "file end"), "nearest_edit_to_COMMIT": cta_gap,
                       "gaps_over_%.2f_s" % LONG_GAP: gaps, "cut_rule": CUT_RULE, "pause_stats": pstat, "pauses_over_limit": over, "pauses": prow,
                       "largest_word_end_correction": max(hinfo["largest_word_end_correction"], binfo["largest_word_end_correction"]),
                       "largest_word_start_correction": max(hinfo["largest_word_start_correction"], binfo["largest_word_start_correction"])}
        print(f"{ver}  {dur:6.2f} s (hook {L:.2f}) | {lu:.1f} LUFS, {tp:.1f} dBTP | clicks/s {report[ver]['clicks_per_s']} | Whisper flags {len(ferrs)} {ferrs}, "
              f"real {len(real)} | edits {len(rows)}, edge violations {len(bad)}, words checked {len(cw)}, word violations {len(report[ver]['word_violations'])} | "
              f"join raw {step['raw_step_lu']:+.2f} LU -> final {step['final_step_lu']:+.2f} LU, {step['step_hz']:+.1f} Hz | {pstat} | "
              f"word end corr {report[ver]['largest_word_end_correction']}", flush=True)
        for r in over:
            print(f"   OVER {r['after']} | {r['before']} at {r['t']:.2f} s: {r['gap']:.3f} s (limit {r['limit']}, energy gap {r['energy_gap']}) {r['over_limit_because']}", flush=True)
        for e in bad:
            print("   EDGE", e)
        for item in flog:
            if "crop_whisper" in item:
                print("   EQUIV", item, flush=True)
    json.dump(report, open(rpath, "w"), indent=1)


if __name__ == "__main__":
    main()
