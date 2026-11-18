#!/bin/zsh
# Stills of the ep06 kit demo (PaperStudioDemo06), serialised through Victor's shared render lock (one render at a time).
# usage: zsh demo06-stills.sh <name> <frame> [<frame> ...]  -> src/paperstudio/stills/<name>-f<frame>.png
# CRT=false renders without the CRT pass.
# The lock /tmp/victor-remotion-render.lock is either a plain file other sessions flock(2) or a directory older
# scripts mkdir; this handles both (same logic as ep04's _ptp-lib.sh take_lock), then waits until nothing else
# renders and at least 20% memory is free.
LOCK=/tmp/victor-remotion-render.lock
ROOT="$(git rev-parse --show-toplevel)"
OUT="$ROOT/src/paperstudio/stills"
BUNDLE="/private/tmp/claude-501/ps06-bundle-$$"
NAME=$1; shift
mkdir -p "$OUT"
cd "$ROOT" || exit 1

busy() { ps -axo pid=,ppid=,ucomm= | awk '$3 ~ /^(node|ffmpeg|ffprobe|remotion|compositor|chrome-headless|Chromium|Google Chrome H)/ && !($3 ~ /^chrome-headless/ && $2 == 1) {print $1}' | while read p; do ps -o args= -p "$p" 2>/dev/null | head -1; done | grep -i -E "remotion|ffmpeg" | grep -v -E "remotion studio|tsc|eslint|demo06-stills" ; }

zmodload zsh/system
LOCKMODE=""
said=0
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
echo "lock taken ($LOCKMODE)"
while [ -n "$(busy)" ]; do sleep 4; done
while [ "$(memory_pressure | tail -1 | grep -oE '[0-9]+')" -lt 20 ]; do sleep 5; done

npx remotion bundle src/paperstudio/entry.tsx --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
for fr in "$@"; do
  npx remotion still "$BUNDLE" PaperStudioDemo06 "$OUT/$NAME-f$fr.png" --frame="$fr" --concurrency=1 --props="{\"crt\":${CRT:-true}}" 2>&1 | grep -v "^    at " | grep -iE "rror|Rendered|written" | tail -2
done
