#!/bin/zsh
# Check stills of GithubEp08 through the shared render lock (bundles once, then one still at a time).
# usage: [VARIANT=<variant>] zsh ptp-stills.sh <name> <globalFrame> [<globalFrame> ...]
#   variant: A B C AB AC BA BC CA CB, or the YouTube cut of any of them (AYT ... CBYT); AB = hook A + body B
#   -> ep08 github/dispatch/stills/<name>-f<frame>.png   (silent; frames are global for that variant; default A)
# Each still renders to a temp file and replaces the old one only on a clean exit, so a failed still never leaves an
# older PNG that looks new. Exit status: 0 when every still rendered, 1 otherwise.
source "${0:A:h}/_ptp-lib.sh"
V=${VARIANT:-A}; check_variant "$V"
NAME=${1:?usage: zsh ptp-stills.sh <name> <frame> [<frame> ...]}; shift
[ $# -gt 0 ] || { echo "give at least one frame" >&2; exit 2; }
mkdir -p "$STILLS"
BUNDLE="/private/tmp/claude-501/ptp08-bundle-$$"
cd "$C" || exit 1
take_lock; trap release EXIT; trap "exit 130" INT TERM
npx remotion bundle "$ENTRY" --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
[ -f "$BUNDLE/index.html" ] || { echo "bundle FAILED" >&2; exit 1; }
FAIL=0
for fr in "$@"; do
  OUT="$STILLS/$NAME-f$fr.png"; TMP="$STILLS/.$NAME-f$fr.rendering.png"; rm -f "$TMP"
  npx remotion still "$BUNDLE" "$COMP" "$TMP" --frame="$fr" --concurrency=1 --props="$(props "$V" true)" 2>&1 | grep -v "^    at " | grep -iE "rror" | tail -2
  RC=${pipestatus[1]}
  if [ "$RC" -eq 0 ] && [ -s "$TMP" ]; then mv -f "$TMP" "$OUT"; echo "$OUT"
  else rm -f "$TMP"; echo "still FAILED: $V f$fr (exit $RC)" >&2; FAIL=1; fi
done
exit $FAIL
