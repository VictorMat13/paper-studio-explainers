#!/bin/zsh
# Frame-0 covers (Victor 2026-11-07: "make them only the first frame, only one frame"): render frame 0 of the real
# GithubEp08 composition (hook overlay, ground, CRT pass included) for each Instagram variant through the shared
# render lock (bundles once, one still at a time), then save PNG + JPG (quality 95) into graphics/covers/ named by
# the hook's opening words.
# usage: zsh frame0-covers.sh [variant ...]        (default: A B C AB AC BA BC CA CB)
source "$(git rev-parse --show-toplevel)/episodes/ep08-github/dispatch/_ptp-lib.sh"
OUTD="$E/graphics/covers"; mkdir -p "$OUTD"
VS=("$@"); [ ${#VS[@]} -gt 0 ] || VS=(A B C AB AC BA BC CA CB)
typeset -A WORDS; WORDS=(A "What actually is GitHub" B "If you're building apps with AI" C "Everyone building with AI keeps saying commit")
for v in "${VS[@]}"; do case "$v" in A|B|C|AB|AC|BA|BC|CA|CB) ;; *) echo "variant must be an Instagram variant (got $v)" >&2; exit 2 ;; esac; done
BUNDLE="/private/tmp/claude-501/ptp08-f0covers-bundle-$$"
cd "$C" || exit 1
take_lock; trap release EXIT; trap "exit 130" INT TERM
npx remotion bundle "$ENTRY" --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
[ -f "$BUNDLE/index.html" ] || { echo "bundle FAILED" >&2; exit 1; }
FAIL=0
for v in "${VS[@]}"; do
  base="$OUTD/${WORDS[${v[1]}]} ($v, cover, 9x16)"; TMP="$OUTD/.f0-$v.rendering.png"; rm -f "$TMP"
  npx remotion still "$BUNDLE" "$COMP" "$TMP" --frame=0 --concurrency=1 --props="$(props "$v" true)" 2>&1 | grep -v "^    at " | grep -iE "rror" | tail -2
  RC=${pipestatus[1]}
  if [ "$RC" -eq 0 ] && [ -s "$TMP" ]; then
    mv -f "$TMP" "$base.png" && sips -s format jpeg -s formatOptions 95 "$base.png" --out "$base.jpg" >/dev/null && echo "$base.png"
  else rm -f "$TMP"; echo "still FAILED: $v (exit $RC)" >&2; FAIL=1; fi
done
exit $FAIL
