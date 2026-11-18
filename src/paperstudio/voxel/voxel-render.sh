#!/bin/zsh
# Renders of the voxel kit demo (VoxelDemo in src/paperstudio/entry.tsx), one at a time through Victor's shared
# render lock /tmp/victor-remotion-render.lock (flocked plain file or mkdir directory, as E8/dispatch/_ptp-lib.sh).
# WebGL: every render passes --gl=${GLFLAG:-angle}.
#   zsh voxel-render.sh stills <name> <frame> [<frame> ...]   -> E/dispatch/stills/<name>-f<frame>.png (+ seconds per still)
#   zsh voxel-render.sh preview <name> [from-to]              -> E/dispatch/previews/<name>.mp4 (half size, silent)
#   zsh voxel-render.sh bench <from-to>                       -> full-size render to /tmp, prints seconds per frame
# PROPS='{"crt":false,"resolution":1}' overrides the demo props; COMP=VoxelSpecTest PROPS='{"spec":{...}}' renders any spec.
LOCK=/tmp/victor-remotion-render.lock
ROOT="$(git rev-parse --show-toplevel)"
E="$(git rev-parse --show-toplevel)/episodes/ep09-minecraft"
STILLS="$E/dispatch/stills"; PREVIEWS="$E/dispatch/previews"
BUNDLE="/private/tmp/claude-501/voxel-bundle-$$"
GLF="--gl=${GLFLAG:-angle}"
# the public folder is 4 GB and bundling copies it: always bundle against the symlink mirror INFRA keeps
PUBLIC_LINKS=/private/tmp/claude-501/ptp09-public
PUBDIR="--public-dir=$PUBLIC_LINKS"
P=${PROPS:-'{"crt":false,"resolution":1}'}
COMP=${COMP:-VoxelDemo}
MODE=${1:?mode: stills|preview|bench}; shift
cd "$ROOT" || exit 1
mkdir -p "$STILLS" "$PREVIEWS" /private/tmp/claude-501

busy() { ps -axo pid=,ppid=,ucomm= | awk '$3 ~ /^(node|ffmpeg|ffprobe|remotion|compositor|chrome-headless|Chromium|Google Chrome H)/ && !($3 ~ /^chrome-headless/ && $2 == 1) {print $1}' | while read p; do ps -o args= -p "$p" 2>/dev/null | head -1; done | grep -i -E "remotion|ffmpeg" | grep -v -E "remotion studio|tsc|eslint|voxel-render" ; }

zmodload zsh/system zsh/datetime
LOCKMODE=""; said=0
while true; do
  if [ -f "$LOCK" ]; then
    [ $said -eq 0 ] && echo "waiting for the render lock (flock on $LOCK)..." && said=1
    if zsystem flock "$LOCK" 2>/dev/null; then LOCKMODE=flock; break; fi
  elif mkdir "$LOCK" 2>/dev/null; then
    LOCKMODE=dir; break
  else
    [ $said -eq 0 ] && echo "waiting for the render lock ($LOCK)..." && said=1
  fi
  sleep 3
done
release() { [ "$LOCKMODE" = dir ] && rmdir "$LOCK" 2>/dev/null; rm -rf "$BUNDLE"; return 0; }
trap release EXIT
trap "exit 130" INT TERM
echo "lock taken ($LOCKMODE) $(date +%H:%M:%S)"
while [ -n "$(busy)" ]; do sleep 4; done
while [ "$(memory_pressure | tail -1 | grep -oE '[0-9]+')" -lt 20 ]; do sleep 5; done

mkdir -p "$PUBLIC_LINKS"
for f in "$ROOT/public"/*(N); do [ -L "$PUBLIC_LINKS/${f:t}" ] || ln -s "$f" "$PUBLIC_LINKS/${f:t}" 2>/dev/null; done
npx remotion bundle src/paperstudio/entry.tsx --out-dir="$BUNDLE" $PUBDIR 2>&1 | grep -iE "rror" | head -5
[ -f "$BUNDLE/index.html" ] || { echo "bundle FAILED" >&2; exit 1; }
FAIL=0
case "$MODE" in
  stills)
    NAME=$1; shift
    for fr in "$@"; do
      OUT="$STILLS/$NAME-f$fr.png"; TMP="$STILLS/.$NAME-f$fr.rendering.png"; rm -f "$TMP"
      T0=$EPOCHREALTIME
      npx remotion still "$BUNDLE" "$COMP" "$TMP" --frame="$fr" --concurrency=1 $GLF $PUBDIR --props="$P" 2>&1 | grep -v "^    at " | grep -iE "rror|warn" | tail -4
      RC=${pipestatus[1]}
      T1=$EPOCHREALTIME
      if [ "$RC" -eq 0 ] && [ -s "$TMP" ]; then mv -f "$TMP" "$OUT"; printf "%s  %.1f s\n" "$OUT" $(( T1 - T0 ))
      else rm -f "$TMP"; echo "still FAILED: f$fr (exit $RC)" >&2; FAIL=1; fi
    done ;;
  preview)
    NAME=$1; RANGE=${2:-0-179}
    OUT="$PREVIEWS/$NAME.mp4"; TMP="$PREVIEWS/.$NAME.rendering.mp4"; rm -f "$TMP"
    T0=$EPOCHREALTIME
    npx remotion render "$BUNDLE" "$COMP" "$TMP" --frames="$RANGE" --scale=0.5 --muted --concurrency=1 --crf=20 $GLF $PUBDIR --props="$P" 2>&1 | grep -E "Encoded|Rendered|rror" | tail -3
    RC=${pipestatus[1]}
    T1=$EPOCHREALTIME
    if [ "$RC" -eq 0 ] && [ -s "$TMP" ]; then mv -f "$TMP" "$OUT"; printf "%s  %.1f s total\n" "$OUT" $(( T1 - T0 )); else rm -f "$TMP"; echo "preview FAILED (exit $RC)" >&2; FAIL=1; fi ;;
  bench)
    RANGE=${1:-0-29}
    OUT="/private/tmp/claude-501/voxel-bench-$$.mp4"
    T0=$EPOCHREALTIME
    npx remotion render "$BUNDLE" "$COMP" "$OUT" --frames="$RANGE" --muted --concurrency=1 $GLF $PUBDIR --props="$P" 2>&1 | grep -E "Encoded|Rendered|rror" | tail -3
    RC=${pipestatus[1]}
    T1=$EPOCHREALTIME
    printf "bench %s: %.1f s total (exit %s)\n" "$RANGE" $(( T1 - T0 )) "$RC"; rm -f "$OUT"; [ "$RC" -eq 0 ] || FAIL=1 ;;
  *) echo "unknown mode $MODE" >&2; FAIL=2 ;;
esac
exit $FAIL
