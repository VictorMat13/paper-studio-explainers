#!/bin/zsh
# Sheets for the nine frame-0 covers in graphics/covers/: a 3x3 contact sheet (each cell 360 x 640, rows = hook,
# columns = body) and the grid-size sheet (each cover at 270 x 480 cropped to its 3:4 centre, 270 x 360, which is how
# the profile grid shows it). Laid out as HTML and captured with Remotion's headless Chrome shell (no window).
E="$(git rev-parse --show-toplevel)/episodes/ep08-github"; D="$E/graphics/covers"
CHROME="$(git rev-parse --show-toplevel)/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell"
typeset -A WORDS; WORDS=(A "What actually is GitHub" B "If you're building apps with AI" C "Everyone building with AI keeps saying commit")
T="/private/tmp/claude-501/ptp08-f0sheets-$$"; mkdir -p "$T"
src() { local v=$1; echo "file://$D/${WORDS[${v[1]}]} ($v, cover, 9x16).png" | sed 's/ /%20/g; s/'"'"'/%27/g'; }
order=(A AB AC BA B BC CA CB C)   # rows: hook A, B, C; columns: body A, B, C
grid=""; thumbs=""
for v in "${order[@]}"; do
  grid+="<figure><div class=c style=\"width:360px;height:640px\"><img src=\"$(src $v)\" style=\"width:360px;top:0\"></div><figcaption>$v</figcaption></figure>"
  thumbs+="<figure><div class=c style=\"width:270px;height:360px\"><img src=\"$(src $v)\" style=\"width:270px;top:-60px\"></div><figcaption>$v</figcaption></figure>"
done
page() { cat <<HTML
<!doctype html><html><head><meta charset=utf-8><style>
@font-face{font-family:I;src:url('file://$HOME/Library/Fonts/Inter_18pt-Bold.ttf')}
html,body{margin:0;background:#EDEBE9;font-family:I,Helvetica,sans-serif;color:#111}
.g{display:grid;grid-template-columns:repeat(3,auto);gap:$2;padding:36px 40px;justify-content:start}
figure{margin:0}figcaption{font-size:26px;margin-top:10px}
.c{position:relative;overflow:hidden;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.18)}
.c img{position:absolute;left:0;display:block}
</style></head><body><div class=g>$1</div></body></html>
HTML
}
page "$grid" "28px 36px" > "$T/grid.html"; page "$thumbs" "22px 30px" > "$T/thumbs.html"
shot() { "$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --user-data-dir="$T/profile" --window-size=$2 --screenshot="$T/$1.png" "file://$T/$1.html" >/dev/null 2>&1; }
shot grid 1232,2226 && sips -s format jpeg -s formatOptions 92 "$T/grid.png" --out "$D/_contact-sheet.jpg" >/dev/null && echo "$D/_contact-sheet.jpg"
shot thumbs 950,1330 && sips -s format jpeg -s formatOptions 92 "$T/thumbs.png" --out "$D/_grid-size-sheet.jpg" >/dev/null && echo "$D/_grid-size-sheet.jpg"
rm -rf "$T"
