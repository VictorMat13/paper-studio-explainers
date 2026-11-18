# Find empty or near-empty frames in a silent render: share of pixels (outside the hook overlay band and the frame
# edge) that stand out from the smooth ground (|pixel - 15 px box blur| > 25). An empty grid frame reads about 1.0.
# usage: python3.14 -I scan_empty_frames.py <video.mp4> [threshold=1.5]  -> runs of frames under the threshold
import subprocess, sys
import numpy as np
from scipy.ndimage import uniform_filter
p = sys.argv[1]; th = float(sys.argv[2]) if len(sys.argv) > 2 else 1.5
r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", "scale=270:480,format=gray", "-f", "rawvideo", "-"], capture_output=True)
raw, fsz = r.stdout, 480 * 270
# A failed or partial decode must never read as a clean scan: exit non-zero so callers report SCAN FAILED.
if r.returncode != 0 or len(raw) < fsz or len(raw) % fsz:
    sys.exit(f"scan FAILED for {p}: ffmpeg exit {r.returncode}, {len(raw)} bytes decoded ({len(raw) / fsz:.2f} frames); "
             + r.stderr.decode(errors="replace").strip()[-300:])
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
m = np.zeros((480, 270), bool); m[8:-8, 8:-8] = True; m[60:118] = False
v = np.array([(np.abs(g - uniform_filter(g, 15))[m] > 25).mean() * 100 for g in fr])
low = np.where(v < th)[0]
runs = []
for i in low:
    if runs and i == runs[-1][1] + 1: runs[-1][1] = i
    else: runs.append([i, i])
print(f"{p.split('/')[-1]}: {len(fr)} frames, content median {np.median(v):.2f}, {len(low)} frames under {th}")
for a, b in runs:
    print(f"  frames {a}-{b}: " + " ".join(f"{x:.2f}" for x in v[a:b + 1][:12]))
if "/silent/" in p:  # keep the curve next to silent renders only (never beside a deliverable)
    np.save(p.rsplit("/", 1)[0] + "/" + p.rsplit("/", 1)[1].replace(".mp4", "-content.npy"), v)
