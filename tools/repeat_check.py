#!/usr/bin/env python3
# Flags repeated words in a spoken script (Victor's rule, 2026-10-25: "just don't ever repeat words").
#   REPEAT  the same word twice in one sentence ("scripts ... scripts", "talking ... talk")      -> always fix
#   NEXT    the same word in two sentences back to back                                           -> fix unless it's a name
# Function words (the, you, it, ...) never count. Word forms are matched loosely: talk/talking/talks, reel/reels.
# usage: repeat_check.py <script.md | script.txt | -> [--only-spoken]
#   --only-spoken  read only the lines under **[...]** beat headers (the SCRIPT.md layout), skipping notes and overlays
# exit code 1 when anything is flagged, so it can gate a script before delivery.
import re, sys

STOP = set("""a an the and or but so to of in on for with at by as from into onto than then now just like about up out own
off over under again very really also only even still too not no yes all any each every some more most much many one
it it's its this that that's these those there here what which who whom whose when where why how
i i'm i'll i've i'd me my mine we we're our us you you're you'll you've you'd your yours he she they them their
is are was were be been being am do does did done doing have has had having can could will would should may might must
go goes going get gets got make makes made let lets if because while until before after""".split())

def stem(w):
    w = w.lower().strip("'")
    if w.endswith("'s"):
        w = w[:-2]
    for suf in ("ing", "ed", "es", "s"):
        if len(w) > len(suf) + 2 and w.endswith(suf):
            w = w[: -len(suf)]
            break
    # talking -> talk, writes -> writ(e): drop a trailing e so "write"/"writing" meet
    return w[:-1] if len(w) > 3 and w.endswith("e") else w

def words(sentence):
    out = []
    for w in re.findall(r"[A-Za-z][A-Za-z'-]*", sentence):
        if w.lower() in STOP:
            continue
        out.append((w, stem(w)))
    return out

def spoken_text(raw, only_spoken):
    if not only_spoken:
        return raw
    return " ".join(re.findall(r"\*\*\[[^\]]+\][^*]*\*\*\n(.+)", raw))

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    only_spoken = "--only-spoken" in sys.argv
    raw = sys.stdin.read() if not args or args[0] == "-" else open(args[0]).read()
    text = spoken_text(raw, only_spoken)
    sents = [s.strip() for s in re.split(r"(?<=[.?!])\s+|\n+", text) if s.strip()]
    hits = 0
    for i, s in enumerate(sents):
        ws = words(s)
        seen = {}
        for w, st in ws:
            seen.setdefault(st, []).append(w)
        for st, forms in seen.items():
            if len(forms) > 1:
                hits += 1
                print(f'REPEAT  "{" / ".join(forms)}" twice in: {s}')
        if i + 1 < len(sents):
            nxt = {st: w for w, st in words(sents[i + 1])}
            for st in dict.fromkeys(st for _, st in ws):
                if st in nxt:
                    hits += 1
                    print(f'NEXT    "{nxt[st]}" again right after: {s}  ->  {sents[i + 1]}')
    print(f"{hits} flagged" if hits else "clean: no repeated words")
    sys.exit(1 if hits else 0)

main()
