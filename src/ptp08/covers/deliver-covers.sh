#!/bin/zsh
# Deliver the ep08 covers: render A, B, C through the lock, then write each as PNG + JPG (quality 95) into
# graphics/finals/covers/ named by the hook's opening words, plus _contact-sheet.jpg (full 9:16, 4:5 and 3:4 crops).
# usage: zsh deliver-covers.sh                 (render fresh)
#        zsh deliver-covers.sh <dir> <prefix>  (reuse <dir>/<prefix>-A.png, -B.png, -C.png from a render of the same code)
E="$(git rev-parse --show-toplevel)/episodes/ep08-github"
HERE="${0:A:h}"
OUT="$E/graphics/finals/covers"
TMP="/private/tmp/claude-501/ptp08-covers-final-$$"
mkdir -p "$OUT" "$TMP"
if [ -n "${1:-}" ]; then
  for h in A B C; do cp -f "$1/${2:?prefix}-$h.png" "$TMP/final-$h.png" || { echo "missing $1/$2-$h.png" >&2; exit 1; }; done
else
  zsh "$HERE/render-covers.sh" "$TMP" final A B C || { echo "render FAILED" >&2; exit 1; }
fi
typeset -A NAME
NAME=(A "What actually is GitHub" B "If you're building apps with AI" C "Everyone building with AI keeps saying commit")
for h in A B C; do
  base="$OUT/${NAME[$h]} (cover $h, 9x16)"
  cp -f "$TMP/final-$h.png" "$base.png"
  sips -s format jpeg -s formatOptions 95 "$base.png" --out "$base.jpg" >/dev/null || { echo "jpg FAILED: $h" >&2; exit 1; }
  echo "$base.png"; echo "$base.jpg"
done
zsh "$HERE/sheet-covers.sh" "$TMP/final-A.png" "$TMP/final-B.png" "$TMP/final-C.png" "$OUT/_contact-sheet.jpg"
rm -rf "$TMP"
