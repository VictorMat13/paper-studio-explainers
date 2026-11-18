# Jerk scan (SMOOTHNESS.md, Victor 2026-11-07: "100% smooth, no glitches, not choppy or fast").
# Mean absolute luma difference per frame over the safe box (270x480 scale: x 16-254, y 67-312, overlay band kept
# because hook overlays fade smoothly). A frame whose diff is more than RATIO x the median of its 8 neighbours is a
# FLAG unless it is a declared cut (--cuts) or within 1 frame of one; a diff under FREEZE_EPS for more than
# FREEZE_RUN consecutive frames is a FREEZE. Exit 1 when anything is flagged.
# usage: python3.14 -I scan_jerk.py <video.mp4> [--cuts 201,640] [--ratio 3] [--freeze-run 8] [--csv out.csv]
import subprocess, sys
import numpy as np

args = sys.argv[1:]
p = args[0]
def opt(name, default):
    if name in args:
        return args[args.index(name) + 1]
    return default
cuts = {int(x) for x in opt("--cuts", "").split(",") if x.strip()}
RATIO = float(opt("--ratio", 3)); FREEZE_RUN = int(opt("--freeze-run", 8)); FREEZE_EPS = 0.15
csv = opt("--csv", None)

r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", "scale=270:480,format=gray", "-f", "rawvideo", "-"], capture_output=True)
raw, fsz = r.stdout, 480 * 270
if r.returncode != 0 or len(raw) < 2 * fsz or len(raw) % fsz:
    sys.exit(f"scan FAILED for {p}: ffmpeg exit {r.returncode}, {len(raw)} bytes decoded; " + r.stderr.decode(errors="replace").strip()[-300:])
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
box = fr[:, 67:312, 16:254]
d = np.abs(np.diff(box, axis=0)).mean(axis=(1, 2))  # d[i] = change between frame i and i+1
n = len(d)
flags, freezes = [], []
for i in range(n):
    lo, hi = max(0, i - 4), min(n, i + 5)
    neigh = np.concatenate([d[lo:i], d[i + 1:hi]])
    med = np.median(neigh) if len(neigh) else 0.0
    base = max(med, 0.6)  # a quiet hold has a tiny median; need an absolute floor so drift is not flagged
    if d[i] > RATIO * base and d[i] > 2.5:
        f = i + 1  # the frame that arrived
        if not any(abs(f - c) <= 1 for c in cuts):
            flags.append((f, d[i], med))
run = 0
for i in range(n):
    if d[i] < FREEZE_EPS:
        run += 1
        if run == FREEZE_RUN:
            freezes.append(i + 1 - FREEZE_RUN + 1)
    else:
        run = 0
if csv:
    np.savetxt(csv, np.c_[np.arange(1, n + 1), d], fmt=["%d", "%.3f"], delimiter=",", header="frame,diff", comments="")
name = p.split("/")[-1]
print(f"{name}: {len(fr)} frames, diff median {np.median(d):.2f}, p95 {np.percentile(d, 95):.2f}, max {d.max():.2f} at f{int(d.argmax()) + 1}; "
      f"{len(flags)} FLAG, {len(freezes)} FREEZE (cuts declared: {sorted(cuts) or 'none'})")
for f, v, med in flags:
    print(f"  FLAG   f{f}: diff {v:.2f} vs neighbours {med:.2f}")
for f in freezes:
    print(f"  FREEZE from f{f}: no change for {FREEZE_RUN}+ frames")
sys.exit(1 if flags or freezes else 0)
