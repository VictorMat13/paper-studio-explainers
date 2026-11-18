#!/bin/zsh
# Half-size silent motion preview of a frame range of GithubEp08, through the shared render lock.
# usage: [VARIANT=<variant>] zsh ptp-preview.sh <fromFrame> <toFrame> [name]
#   variant: A B C AB AC BA BC CA CB, or the YouTube cut of any of them (AYT ... CBYT); AB = hook A + body B
#   -> ep08 github/dispatch/previews/<name or VARIANT-from-to>.mp4   (default variant A)
# Use sparingly (at most 2 per builder): it holds the Mac's only render slot.
source "${0:A:h}/_ptp-lib.sh"
V=${VARIANT:-A}; check_variant "$V"
FROM=${1:?usage: zsh ptp-preview.sh <from> <to> [name]}; TO=${2:?usage: zsh ptp-preview.sh <from> <to> [name]}
NAME=${3:-$V-$FROM-$TO}
mkdir -p "$PREVIEWS"
OUT="$PREVIEWS/$NAME.mp4"; TMP="$PREVIEWS/.$NAME.rendering.mp4"; rm -f "$TMP"
cd "$C" || exit 1
take_lock; trap 'rm -f "$TMP"; release' EXIT; trap "exit 130" INT TERM
npx remotion render "$ENTRY" "$COMP" "$TMP" --frames="$FROM-$TO" --scale=0.5 --muted --concurrency=1 --crf=20 --props="$(props "$V" true)" 2>&1 | grep -E "Encoded|rror" | tail -2
RC=${pipestatus[1]}
if [ "$RC" -ne 0 ] || [ ! -s "$TMP" ]; then echo "preview FAILED for $V $FROM-$TO (exit $RC); $OUT left untouched" >&2; exit $(( RC ? RC : 1 )); fi
mv -f "$TMP" "$OUT" && echo "$OUT"
