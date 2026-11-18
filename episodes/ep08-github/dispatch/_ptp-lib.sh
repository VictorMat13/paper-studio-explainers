#!/bin/zsh
# Shared bits for the ep08 render scripts (sourced, not run). Same rules as ep01's mba-*.sh:
# one render at a time on this Mac through the shared lock, nothing else rendering, >= 20% memory free.
LOCK=/tmp/victor-remotion-render.lock
C="$(git rev-parse --show-toplevel)"
E="$(git rev-parse --show-toplevel)/episodes/ep08-github"
ENTRY=src/ptp08/entry.tsx
COMP=GithubEp08
TL="$C/src/ptp08/timeline.json"
STILLS="$E/dispatch/stills"
PREVIEWS="$E/dispatch/previews"
VO="$C/public/ptp08/vo"
TOOL="$E/tools/make_ep08_timeline.py"

# 18 variants, all from day one: the Instagram videos A B C AB AC BA BC CA CB (hook letter first: AB = HA + BodyB),
# and the YouTube Shorts cut of each (<variant>YT).
VARIANTS_ALL=(A B C AB AC BA BC CA CB AYT BYT CYT ABYT ACYT BAYT BCYT CAYT CBYT)
check_variant() { case "$1" in A|B|C|AB|AC|BA|BC|CA|CB|AYT|BYT|CYT|ABYT|ACYT|BAYT|BCYT|CAYT|CBYT) ;; *) echo "variant must be one of: ${VARIANTS_ALL[*]} (got '$1')" >&2; exit 2 ;; esac; }

# Orphaned headless Chrome (parent pid 1, left behind by a killed render) is ignored, or the queue deadlocks forever.
busy() { ps -axo pid=,ppid=,ucomm= | awk '$3 ~ /^(node|ffmpeg|ffprobe|remotion|compositor|chrome-headless|Chromium|Google Chrome H)/ && !($3 ~ /^chrome-headless/ && $2 == 1) {print $1}' | while read p; do ps -o args= -p "$p" 2>/dev/null | head -1; done | grep -i -E "remotion|ffmpeg" | grep -v -E "remotion studio|tsc|eslint" ; }

LOCKMODE=""
release() { [ "$LOCKMODE" = dir ] && rmdir "$LOCK" 2>/dev/null; [ -n "${BUNDLE:-}" ] && rm -rf "$BUNDLE"; return 0; }
# Take the shared lock (waits for any other agent's render), then wait until nothing else renders and memory is free.
# Two conventions share this path on Victor's Mac: most dispatch scripts mkdir it (a directory), some batch
# renderers flock it as a plain file (and leave the file behind). A plain file makes mkdir fail forever, so when
# the path is a file we flock it instead (zsystem flock, held until this script exits).
# Call it at the script's top level and set the trap right after it (zsh runs an EXIT trap set inside a function
# when that function returns, which would drop the lock early):
#   take_lock; trap release EXIT; trap "exit 130" INT TERM
take_lock() {
  zmodload zsh/system
  local said=0
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
  while [ -n "$(busy)" ]; do sleep 4; done
  while [ "$(memory_pressure | tail -1 | grep -oE '[0-9]+')" -lt 20 ]; do sleep 5; done
}

props() { echo "{\"variant\":\"$1\",\"mute\":$2}"; }
