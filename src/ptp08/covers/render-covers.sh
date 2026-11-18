#!/bin/zsh
# Render the ep08 Reel covers through the shared render lock (bundles once, then one still at a time).
# usage: zsh render-covers.sh <outDir> <prefix> [A] [B] [C]
#   -> <outDir>/<prefix>-<hook>.png  (each still renders to a temp file and replaces the old one only on a clean exit)
source "$(git rev-parse --show-toplevel)/episodes/ep08-github/dispatch/_ptp-lib.sh"
OUT=${1:?usage: render-covers.sh <outDir> <prefix> [hooks...]}; PFX=${2:?prefix}; shift 2
HOOKS=("$@"); [ ${#HOOKS[@]} -gt 0 ] || HOOKS=(A B C)
mkdir -p "$OUT"
BUNDLE="/private/tmp/claude-501/ptp08-covers-bundle-$$"
cd "$C" || exit 1
take_lock; trap release EXIT; trap "exit 130" INT TERM
npx remotion bundle src/ptp08/covers/entry.tsx --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
[ -f "$BUNDLE/index.html" ] || { echo "bundle FAILED" >&2; exit 1; }
FAIL=0
for h in "${HOOKS[@]}"; do
  DST="$OUT/$PFX-$h.png"; TMP="$OUT/.$PFX-$h.rendering.png"; rm -f "$TMP"
  npx remotion still "$BUNDLE" GithubEp08Cover "$TMP" --frame=0 --concurrency=1 --props="{\"hook\":\"$h\"}" 2>&1 | grep -v "^    at " | grep -iE "rror" | tail -3
  RC=${pipestatus[1]}
  if [ "$RC" -eq 0 ] && [ -s "$TMP" ]; then mv -f "$TMP" "$DST"; echo "$DST"
  else rm -f "$TMP"; echo "still FAILED: $h (exit $RC)" >&2; FAIL=1; fi
done
exit $FAIL
