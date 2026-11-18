# SMOOTHNESS (Victor, 2026-11-07, about 02:45 CT): "Make sure every animation is 100% smooth and no glitches and doesn't seem choppy/fast, want everything to be incredibly smooth"

Applies to every builder and to RED TEAM and FINAL. Auto-approved; no gate. These rules sit on top of `STYLE-UPLIFT.md` and the Paper Studio skill.

## Rules for every motion

1. **Nothing is instant.** Minimum durations: an object entrance or exit 14 frames, a card flip or turn 18 frames, a camera move 20-28 frames, a caption word reveal 10 frames, a chip or bubble pop 12 frames (scale 0.6 to 1.0, no overshoot), a counter 26+ frames, a wire draw at most 900 px per 30 frames. Anything that happens in under 8 frames reads as a glitch: lengthen it or cross-fade it.
2. **Ease everything, in and out.** Every interpolation uses a cubic bezier ease-in-out (the kit's `motion.ts` curves or `Easing.bezier(0.4, 0, 0.2, 1)`); never linear, never springs, never `Easing.ease` alone (it ends hard). A move that starts or stops at full speed is choppy.
3. **No velocity jumps.** When two motions chain (a move then a hold then a move), the velocity at the join is zero on both sides. At a split part boundary the visible change starts a new eased motion from rest; nothing teleports. At a camera path keyframe the path is C1-continuous (the kit's `camPath` handles it; do not add two overlapping camera moves).
4. **Deterministic ambient drift, never noise.** Breathing, sway and float use smooth sines of the frame (periods 60-150 frames, amplitudes 1-6 px, 0.3-0.8 deg); never `Math.random`, never `noise` sampled per frame, never a drift that changes direction more than twice a second. Two objects never share the same phase.
5. **Sub-pixel motion only, no shimmer.** Do not round positions or scales to integers while animating (rounding makes text and edges jitter). Text that moves keeps `will-change: transform` and animates with `transform`, not with `left/top` or font size. Blur values animate continuously too.
6. **Camera: hold, move, hold with real arcs.** Moves 20-28 frames, ease in-out, no zoom under 20 frames, no more than one move in flight at a time; the hold's drift continues through the move so the camera never freezes. Motion blur only on moves faster than about 18 px per frame, with the kit's adaptive samples; never on text (hud).
7. **Nothing too fast.** A caption line that changes faster than its words are spoken is too fast; a card that crosses the frame in under 14 frames is too fast; a flip faster than 18 frames is too fast. When the voice gives you few frames, show less (one object, one motion), not the same motion faster.
8. **No flashes, pops or gaps.** No frame where an object is at opacity 0 or 1 one frame and the opposite the next; no object that disappears without an exit; no empty frame; no frame where a caption is doubled. Crossings between scenes keep both scenes moving while they overlap.
9. **Hand-offs are one continuous motion.** The hook's last objects shrink and flip onto the body's first card over the full hand-off window (the 11 silent frames plus the last word's tail, about 18-24 frames), ease in-out, landing with zero velocity exactly on the body's frame 0; the body's own ambient drift starts from the same pose (zero at t = 0, as BC did).
10. **Every frame rendered.** Renders at 30 fps, no frame skipping; FINAL checks frame counts against the timeline.

## Checks (builders before reporting; RED TEAM for every video; FINAL on every silent render)

- **Jerk scan:** `python3 -I E/dispatch/scan_jerk.py <preview.mp4> [--cuts f1,f2,...]` (RED TEAM writes it from `scan_empty_frames.py`'s frame reader): mean absolute luma difference per frame over the safe box; a frame whose diff is more than 3x the median of its 8 neighbours, and that is not a declared hard cut (shot start of a new scene) or a hand-off landing frame, is a FLAG; a diff that is zero for more than 8 consecutive frames is a FREEZE flag. List every flag with its frame.
- **Every-2nd-frame sheets** at every entrance, exit, flip, split boundary, caption swap and hand-off: look for pops, teleports, doubled text, snapped positions.
- **Play-speed sanity:** at 2 fps the contact sheet should read as a slow story; if two adjacent cells look unrelated inside one shot, the motion between them was too fast.

Builders: add a "SMOOTHNESS" section to your completion note listing the durations you use for entrances, flips, camera moves and hand-offs, the easing you use, the jerk scan result on your preview (or the every-2nd-frame sheets if the scan tool is not there yet), and anything you lengthened.
