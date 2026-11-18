#!/bin/zsh
# Stills of the Paper Studio kit demo, serialised through Victor's shared render lock (one render at a time).
# usage: zsh demo-stills.sh <name> <frame> [<frame> ...]  -> src/paperstudio/stills/<name>-f<frame>.png
# CRT=false renders without the CRT pass.
# The lock /tmp/victor-remotion-render.lock is a plain file other sessions hold with flock(2) (and older
# scripts used mkdir on the same path), so this script takes an exclusive flock on it via python3, then also
# waits until no other remotion/ffmpeg process is running and at least 20% memory is free.
LOCK=/tmp/victor-remotion-render.lock
if [ -z "$PS_LOCKED" ]; then
  exec /usr/bin/env python3 -c '
import fcntl, os, sys, subprocess
f = open(sys.argv[1], "a"); fcntl.flock(f, fcntl.LOCK_EX)
env = dict(os.environ, PS_LOCKED="1")
sys.exit(subprocess.run(["zsh", sys.argv[2]] + sys.argv[3:], env=env).returncode)
' "$LOCK" "$0" "$@"
fi
ROOT="$(git rev-parse --show-toplevel)"
OUT="$ROOT/src/paperstudio/stills"
BUNDLE="/private/tmp/claude-501/ps-bundle-$$"
NAME=$1; shift
mkdir -p "$OUT"
cd "$ROOT" || exit 1
trap 'rm -rf "$BUNDLE"' EXIT INT TERM
# a render is running if a remotion compositor, an ffmpeg, or a node render/still/bundle process is alive
# (chrome-headless shells are ignored: an orphaned one from another project has been idle for days)
busy() { ps -axo ucomm=,args= | grep -E '^(remotion|ffmpeg|node) ' | grep -E '^(remotion|ffmpeg) |remotion (render|still|bundle)|render_[a-z0-9]*\.mjs|renderMedia' | grep -v -E 'remotion studio' ; }
while [ -n "$(busy)" ]; do sleep 4; done
while [ "$(memory_pressure | tail -1 | grep -oE '[0-9]+')" -lt 20 ]; do sleep 5; done
npx remotion bundle src/paperstudio/entry.tsx --out-dir="$BUNDLE" 2>&1 | grep -iE "rror" | head -5
for fr in "$@"; do
  npx remotion still "$BUNDLE" PaperStudioDemo "$OUT/$NAME-f$fr.png" --frame="$fr" --concurrency=1 --props="{\"crt\":${CRT:-true}}" 2>&1 | grep -v "^    at " | grep -iE "rror|Rendered|written" | tail -2
done
