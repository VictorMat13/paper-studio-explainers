# AGENT ASSETS (Opus 5.5): ep08 logos and cut-outs

Read `DISPATCH.md`, the "Assets" and "shared visual language" sections of `E/storyboard/STORYBOARD.md`, `E7/dispatch/AGENT-ASSETS.md` + `E7/dispatch/COMPLETION-ASSETS.md` and `E6/dispatch/COMPLETION-ASSETS.md` (how the cut-outs were generated with the Fish Audio image tools, cut out with `cutout2.swift`, checked and sheeted; where the laptop screen corners are), and the "Objects and depth" + "Logo chips" sections of the Paper Studio skill.

## Logos (`E/storyboard/assets/logos/`, official only, SVG)

- `github.svg`: the GitHub Invertocat mark (the official mark from https://github.com/logos; the "GitHub Mark" SVG). Note it needs the normal 58% fill in a chip and reads as a white mark on the charcoal slab.
- `git.svg`: the official Git logo (Jason Long's mark from https://git-scm.com/downloads/logos; the orange diamond mark; use the full-colour version, it is the official one).
- `claude.svg`: copy the kit's (`C/src/paperstudio/` or `E7/storyboard/assets/logos/claude.svg`).
- Write the source URL for every file into `logos/SOURCES.md`. No third-party redraws, no icon packs. For each logo note whether it needs almost no padding in a chip (dense marks) or the normal 58% fill.

## Photo cut-outs (`E/storyboard/assets/photos/`)

Generate on white, photoreal, original (no brand marks, no text), background removed, cropped to opaque bounds, lit from the top left:

| File | What |
|---|---|
| `instant-camera.png` | a photoreal white instant camera, three-quarter view, a blank white print half out of its front slot, no logo, no text |
| `paper-tag.png` | a plain photoreal kraft cardboard tag (rounded rectangle, a reinforced hole) on a short natural string, blank face (the builders write v1 on it), slight 3D lean, no text |
| `guide-mock-github.png` | the guide mock in the ep06/ep07 style (`guide-mock-crash.png`, `guide-mock-graphify.png`) with the title "GitHub with Claude Code: the exact prompts" and a clean cover |

Reuse: copy ep06's `robot.png`, `laptop.png`, `scissors.png` and ep07's `eraser.png` into this folder unchanged (same files, so the robot and laptop match the earlier episodes; copy the laptop screen corner note into your completion note).

Use the Fish Audio image tools (as ep06/ep07 did; the team has 153k package credits) or Higgsfield if it has credits; 2-3 candidates per object, keep the best. Build `_cutouts-sheet.jpg` (every cut-out on the paper ground with the skill's floating shadow) so the orchestrator can review the set in one image.

## Report

`E/dispatch/COMPLETION-ASSETS.md`: every file with pixel size, source (logos) or generator and prompt (photos), the sheet path, credits spent, anything that differs from the storyboard. Builders read it for exact filenames. Write it as soon as the logos and the reused files are in place (a first version), then update it when the generated cut-outs land, so builders can start on the logos right away.
