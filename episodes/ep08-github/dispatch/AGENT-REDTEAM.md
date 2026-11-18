# AGENT RED TEAM (Opus 5.5): adversarial review of the ep08 build, all nine pairings

Read `DISPATCH.md` (decisions, status log), `BUILDER-CONTRACT.md`, every `COMPLETION-*.md` in this folder (newest "Fix round" sections first), `<repo>/skills/paper-studio/SKILL.md` (Hard rules, Layout, Motion and transitions, Camera) and `E/SCRIPT.md` (fact sheet, numbers allowed). Code: `C/src/ptp08/` (beats and shell), kit `C/src/paperstudio/`. You review; you do not edit beat code. You may write only your findings file and renders/sheets under `E/dispatch/redteam/`. ep07's `E7/dispatch/AGENT-REDTEAM.md` + `RED-TEAM-FINDINGS.md` + `RED-TEAM-FINDINGS-2.md` show the bar (round 2 is the combo review).

## What to do

1. `cd C && npx tsc --noEmit -p src/ptp08/tsconfig.json`: list every error with its owner file.
2. Render silent half-size previews of the full **A**, **B** and **C** with `E/dispatch/ptp-preview.sh` (one at a time; the lock serialises them), and the **AYT** CTA region (last 200 frames).
3. For each preview make 2 fps contact sheets and look at every cell. Go through every 5th frame with the safe area cropped and enlarged, and every 2nd frame at every caption swap, entrance, exit, split part boundary and crossing. Run `python3.14 -I E/dispatch/scan_empty_frames.py` and `scan_pad_edges.py` on each.
4. Frame by frame (stills via `ptp-stills.sh`): **all nine hook hand-offs** (A, AB, AC, BA, B, BC, CA, CB, C: last 3 hook frames, first 3 body frames; the card must be identical, PSNR >= 35 dB), every crossing inside a body, the CTA push. Also the split boundaries that differ behind another hook (INFRA's final-pass table lists them): each must carry a visible change.
5. `E/dispatch/ptp-safe-veil.sh` for A, B, C; list anything readable outside x 65-1015, y 269-1248 (hooks: anything in the overlay band y 290-440 other than the overlay).
6. Captions against the voice: spot-check 10 lines per video against `E/timing/words_<v>.json` (words appear as they are said, never before, never more than about 6 frames late; text matches the spoken words; spoken numbers as figures only from the allowed list).

7. **Smoothness (Victor 2026-11-07: "100% smooth, no glitches, not choppy or fast").** Read `SMOOTHNESS.md`. Write `E/dispatch/scan_jerk.py` (from `scan_empty_frames.py`'s frame reader: mean absolute luma difference per frame over the safe box; FLAG a frame whose diff is over 3x the median of its 8 neighbours unless it is a declared hard cut or a hand-off landing; FREEZE flag when the diff is zero for more than 8 consecutive frames) and run it on every preview; list every flag with its frame and what moved. Check every entrance, exit, flip, split boundary and hand-off at every 2nd frame for pops, teleports, snapped positions, motions under 8 frames, linear or springy easing, random jitter.

## BLOCK criteria (any one blocks the merge)

- An empty or near-empty frame (plain paper, a blank card, or one small object alone on paper) anywhere, including the first frame of every version, hand-offs and crossings.
- A shot over 45 frames without a visible change, a frozen frame, or a hold with no motion for more than about 10 frames.
- Readable content outside the safe zone, or covering the hook overlay.
- Text overlapped or crossed by any object or by the next caption line; smeared or doubled text; a physical action that does not read as real (scissors that do not cut, an eraser that does not erase, a card that flies through text).
- An on-screen number not in the storyboard's allowed list; any invented fact; anything that contradicts the fact sheet; a real repo's hash or name; star or follower counts.
- Any em or en dash in on-screen text; any follow ask; any comment, keyword, guide or DM in a YouTube version; a non-official logo; the reference reel's footage or dark look.
- A caption out of sync with the voice or not matching the spoken words.
- A hook hand-off with a jump, gap or flash, in any of the nine pairings.
- Type-check errors.
- A jerk-scan FLAG or FREEZE that is not a declared cut; any motion under 8 frames; any linear or spring easing on a subject; random per-frame jitter; a hand-off that does not land with zero velocity on the body's frame 0.

Also list WARN items (composition small or unbalanced, captions under the skill sizes or inconsistent between groups, weak secondary motion, text under 34 px, a camera move that jars, a visual that does not match its words, the same object looking different between videos: the commit card, the timeline wire, the terminal card, the GitHub slab, the word chips, the CTA).

## Report

`E/dispatch/RED-TEAM-FINDINGS.md`: a table per finding (id, BLOCK/WARN, variant, frame(s), owner group, what is wrong, the still or sheet path that shows it, suggested fix). End with a verdict: PASS or BLOCKED. Reply with the counts and the BLOCK list. Never open anything in Victor's apps (he is asleep).
