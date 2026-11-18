#!/bin/zsh
# Contact sheet of the three ep08 covers, one column per hook: the full 9:16 cover, the centred 4:5 feed crop
# (1080x1350, y 285), the centred 3:4 profile-grid crop (1080x1440, y 240) and that crop at 25% (270 px wide, the grid
# thumbnail test). Laid out as an HTML page and captured with Remotion's headless Chrome shell (no window), then saved
# as JPG (quality 92).
# usage: zsh sheet-covers.sh <A.png> <B.png> <C.png> <out.jpg>
A=${1:A}; B=${2:A}; CC=${3:A}; OUT=${4:?}
CHROME="$(git rev-parse --show-toplevel)/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"
T="/private/tmp/claude-501/ptp08-covers-sheet-$$"; mkdir -p "$T"
cell() { # src w h top
  echo "<div class=c style=\"width:${2}px;height:${3}px\"><img src=\"file://$1\" style=\"width:${2}px;top:-${4}px\"></div>"; }
col() { # src label
  echo "<div class=col><h2>$2</h2>$(cell "$1" 480 853 0)<h3>4:5 feed crop</h3>$(cell "$1" 480 600 127)<h3>3:4 profile grid crop</h3>$(cell "$1" 480 640 107)<h3>25% grid thumbnail</h3><div class=q>$(cell "$1" 270 360 60)</div></div>"; }
cat > "$T/sheet.html" <<HTML
<!doctype html><html><head><meta charset=utf-8><style>
@font-face{font-family:I;src:url('file://$HOME/Library/Fonts/Inter_18pt-Bold.ttf')}
html,body{margin:0;background:#EDEBE9;font-family:I,Helvetica,sans-serif;color:#111}
.row{display:flex;gap:40px;padding:28px 40px 40px}
h2{font-size:38px;margin:0 0 18px;letter-spacing:-.5px}
h3{font-size:24px;margin:30px 0 12px;color:#4E4A48;font-weight:700}
.c{position:relative;overflow:hidden;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.c img{position:absolute;left:0;display:block}
.q{width:480px;display:flex;justify-content:center}
</style></head><body><div class=row>
$(col "$A" "Cover A")$(col "$B" "Cover B")$(col "$CC" "Cover C")
</div></body></html>
HTML
"$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --user-data-dir="$T/profile" \
  --window-size=1600,2810 --screenshot="$T/sheet.png" "file://$T/sheet.html" >/dev/null 2>&1
[ -s "$T/sheet.png" ] || { echo "sheet capture FAILED" >&2; rm -rf "$T"; exit 1; }
sips -s format jpeg -s formatOptions 92 "$T/sheet.png" --out "$OUT" >/dev/null && echo "$OUT"
rm -rf "$T"
