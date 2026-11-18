# Padding QA: look for a faint inset rectangle where a full-frame layer now ends after the 90% pad (PadCtx 0.9 about the
# safe-box centre 540,758.5): edges at x 54 and 1026, y 76 and 1804. For each frame, the luma step across each edge
# line (median over the line, 3 px either side) against the same step measured 14 px further out (the ground's own
# texture). Prints frames where a straight step stands out.
# usage: python3.14 -I scan_pad_edges.py <video.mp4> [threshold=2.0]
import subprocess, sys
import numpy as np
p = sys.argv[1]; th = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
def band(crop, w, h):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", f"crop={crop},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
res = {}
L = band("40:1700:34:120", 40, 1700); R = band("40:1700:1006:120", 40, 1700)
T = band("900:40:90:56", 900, 40); B = band("900:40:90:1784", 900, 40)
def vstep(a, c):  # vertical edge at column c of the band
    return np.median(np.abs(a[:, :, c - 4:c - 1].mean(2) - a[:, :, c + 1:c + 4].mean(2)), axis=1)
def hstep(a, r):
    return np.median(np.abs(a[:, r - 4:r - 1, :].mean(1) - a[:, r + 1:r + 4, :].mean(1)), axis=1)
res["left x54"] = vstep(L, 20) - vstep(L, 6)
res["right x1026"] = vstep(R, 20) - vstep(R, 34)
res["top y76"] = hstep(T, 20) - hstep(T, 6)
res["bottom y1804"] = hstep(B, 20) - hstep(B, 34)
print(p.split("/")[-1])
for k, v in res.items():
    bad = np.where(v > th)[0]
    print(f"  {k}: max {v.max():.2f} at f{int(v.argmax())}, frames over {th}: {len(bad)}" + (f" (first {bad[:12].tolist()})" if len(bad) else ""))
