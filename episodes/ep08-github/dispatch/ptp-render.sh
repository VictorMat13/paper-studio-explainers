#!/bin/zsh
# Final full-size render of one video of GithubEp08 WITH its voiceover, through the shared lock, then the frame QA.
# usage: [MUTE=1] zsh ptp-render.sh <variant> "<out.mp4>"
#   variant: A B C AB AC BA BC CA CB, or the YouTube cut of any of them (AYT ... CBYT); AB = hook A + body B
# MUTE=1 renders the graphic silent (no voiceover, no audio stream) for the timeline build.
# Refuses when that variant's timeline is still provisional (storyboard ranges, not the voice) or its
# voiceover is missing; FORCE=1 renders anyway (a provisional timeline always renders silent: the shell skips the voice).
source "${0:A:h}/_ptp-lib.sh"
V=${1:?usage: zsh ptp-render.sh <variant> <out.mp4>}; check_variant "$V"
OUT=${2:?usage: zsh ptp-render.sh <variant> <out.mp4>}
[[ "$OUT" = /* ]] || OUT="$PWD/$OUT"
PROV=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['variants'][sys.argv[2]]['provisional'])" "$TL" "$V")
if [ "$PROV" = "True" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "timeline for $V is provisional; re-run tools/make_ep08_timeline.py after the voice lands (or FORCE=1)" >&2; exit 3
fi
MUTED=false; [ "${MUTE:-0}" = "1" ] && MUTED=true
if [ "$MUTED" = false ] && [ "$PROV" != "True" ] && [ ! -f "$VO/$V.wav" ]; then echo "missing voiceover public/ptp08/vo/$V.wav" >&2; exit 3; fi
mkdir -p "${OUT:h}"
cd "$C" || exit 1
# Render to a temp file and replace OUT only after a successful render, so a failed render never leaves QA
# running on (or a caller trusting) an older file at OUT.
TMP="${OUT:r}.rendering.mp4"; rm -f "$TMP"
take_lock; trap 'rm -f "$TMP"; release' EXIT; trap "exit 130" INT TERM
npx remotion render "$ENTRY" "$COMP" "$TMP" --concurrency=1 --crf=16 --props="$(props "$V" $MUTED)" 2>&1 | grep -E "Rendered [0-9]+/|Encoded|rror" | tail -3
RC=${pipestatus[1]}
if [ "$RC" -ne 0 ] || [ ! -s "$TMP" ]; then
  echo "render FAILED for $V (renderer exit $RC); $OUT left untouched" >&2; exit $(( RC ? RC : 1 ))
fi
mv -f "$TMP" "$OUT"
QA="$(git rev-parse --show-toplevel)/tools/qa.sh"
[ -f "$QA" ] && bash "$QA" "$OUT"
