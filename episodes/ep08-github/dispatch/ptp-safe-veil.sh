#!/bin/zsh
# Instagram Reels keep-clear check: a red veil over the zones Instagram's UI covers (Meta spec: top 14% = 269 px,
# bottom 35% = 672 px, sides 6% = 65 px) on each shot's middle frame.
# usage:
#   [VARIANT=<variant>] zsh ptp-safe-veil.sh [shotId ...]   (A B C AB AC BA BC CA CB or their YT cuts AYT ... CBYT)
#        renders the middle frame of every shot part (or only
#        the given storyboard ids, e.g. HA3 A07b) through the render lock -> dispatch/stills/safe/<variant>-<shot>-f<frame>-safe.png
#   zsh ptp-safe-veil.sh <still.png> [...]                    just veils existing stills -> <still>-safe.png beside each
source "${0:A:h}/_ptp-lib.sh"
veil() {
  ffmpeg -nostdin -v error -y -i "$1" -vf "drawbox=x=0:y=0:w=1080:h=269:color=red@0.35:t=fill,drawbox=x=0:y=1248:w=1080:h=672:color=red@0.35:t=fill,drawbox=x=0:y=269:w=65:h=979:color=red@0.35:t=fill,drawbox=x=1015:y=269:w=65:h=979:color=red@0.35:t=fill" "${1%.png}-safe.png" && echo "${1%.png}-safe.png"
}
if [ $# -gt 0 ] && [[ "$1" == *.png ]]; then
  for f in "$@"; do veil "$f"; done
  exit 0
fi
V=${VARIANT:-A}; check_variant "$V"
OUTD="$STILLS/safe"; mkdir -p "$OUTD"
# "<part id> <middle frame>" for every shot part (or the parts of the given base ids)
LIST=$(python3 - "$TL" "$V" "$@" <<'PY'
import json, sys
tl, v, want = sys.argv[1], sys.argv[2], set(sys.argv[3:])
for s in json.load(open(tl))["variants"][v]["shots"]:
    if not want or s["base"] in want or s["id"] in want:
        print(s["id"], (s["start"] + s["end"] - 1) // 2)
PY
)
[ -n "$LIST" ] || { echo "no matching shots for $V" >&2; exit 2; }
BUNDLE="/private/tmp/claude-501/ptp08-veil-bundle-$$"
cd "$C" || exit 1
take_lock; trap release EXIT; trap "exit 130" INT TERM
npx remotion bundle "$ENTRY" --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
[ -f "$BUNDLE/index.html" ] || { echo "bundle FAILED" >&2; exit 1; }
echo "$LIST" | while read id fr; do
  png="$OUTD/$V-$id-f$fr.png"; rm -f "$png"
  npx remotion still "$BUNDLE" "$COMP" "$png" --frame="$fr" --concurrency=1 --props="$(props "$V" true)" </dev/null 2>&1 | grep -v "^    at " | grep -iE "rror" | tail -2
  [ -s "$png" ] && veil "$png" && rm -f "$png"
done
