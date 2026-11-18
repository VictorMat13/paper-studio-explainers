# AGENT COVERS (Opus 5.5): one Reel cover (thumbnail) per hook, Paper Studio style

Victor (2026-11-07, 02:10 CT): "can we make a thumbnail for them, something to do with the hook that will grab insane attention, has the same style and is styled super neat, auto approve." So: three covers, one per hook (A, B, C); every combo video uses its hook's cover. No approval gate; build through.

Read `DISPATCH.md`, `SCRIPT.md` (the three hooks), `storyboard/STORYBOARD.md` (shared visual language, assets), `STYLE-UPLIFT.md`, `<repo>/skills/paper-studio/SKILL.md` (ground and grid, CRT pass, objects and depth, logo chips, captions, hard rules), `C/src/paperstudio/README.md`, and the hook builders' plans `PLAN-HA.md`, `PLAN-HB.md`, `PLAN-HC.md` (so the cover uses the same hero objects as the hook's first seconds). Assets in `E/storyboard/assets/` (official `logos/github.svg`, `github-white.svg`, `git.svg`, `claude.svg`; `photos/` robot, laptop, scissors, eraser, instant-camera, paper-tag).

## The three covers

Each is a 1080x1920 still in the Paper Studio look (lit paper ground, 135 px grid, one top-left light, floating shadows, one CRT pass), built as a poster: one huge hero object group, one headline, nothing else. The headline is the hook's idea in 3-6 words, Inter 800, 120-150 px, black, centred, with one bold italic key word; a thin black highlight bar under the key word is fine. No follow ask, no keyword, no numbers outside the storyboard list, no em or en dashes, no "Breaking".

| Cover | Headline (edit for fit, keep the idea) | Hero |
|---|---|---|
| A (hook "What actually is GitHub") | "What actually IS GitHub?" | the charcoal GitHub slab (white Invertocat) huge and tilted 10 deg in 3D, centre; three robots at laptops below looking up at it with black speech bubbles reading "GitHub"; a big black "?" on a paper card leaning on the slab |
| B (hook "one bad prompt can wipe out everything") | "One bad prompt wiped it ALL" | the laptop big, its screen cracked (ShatterOverlay) and the to-do app card half erased by the photoreal eraser mid-sweep, grey crumbs on the paper; a black chat bubble "add dark mode" above |
| C (hook "commit, push and branch") | "commit. push. branch. explained" | three huge white word chips on a thick wire with hollow nodes, each with its icon chip (instant camera, up arrow, forked wire) flipped half over; a robot peeking from behind the middle chip |

Make the hero fill the middle 60% of the frame height; keep the headline and the hero inside the Instagram safe box (x 65-1015, y 269-1248) because the grid crops Reel covers to 4:5 and the profile shows 3:4: check that the headline and the hero also read in a centred 1080x1350 crop and a centred 1080x1440 crop.

## Build

- A Remotion still composition in `C/src/ptp08/covers/` (own folder; do not edit the shell or any beat): `GithubEp08Cover` with prop `{ hook: "A" | "B" | "C" }`, registered in `C/src/ptp08/covers/entry.tsx` (not in the shell's `entry.tsx`), kit `Ground`, `CrtPass`, `LogoChip`, `PaperCard`, `Cutout`, `ChatBubble`, `WirePath`, `WireNode`, `ShatterOverlay`, `KineticCaption` or plain Inter. Reuse the hook builders' helpers only by import if they are already exported; otherwise build local ones.
- Render with `npx remotion still` through the shared lock (`/tmp/victor-remotion-render.lock`, directory or flocked file; take it the way `E/dispatch/_ptp-lib.sh` does; one render at a time, the builders are using it, wait your turn). Output `E/graphics/finals/covers/<hook words> (cover A, 9x16).png` and `.jpg` (quality 95) for A, B, C, hook words as in `AGENT-FINAL.md` step 6, plus `covers/_contact-sheet.jpg` with the three side by side and their 4:5 crops.
- Iterate on the stills until they are "super neat": aligned to an 8 px grid, consistent radii and shadows, nothing cut off, headline never touching the hero, the hero big. Check each at 25% size (the grid thumbnail test): the headline must still read and the hero must still be recognisable.

## Report

`E/dispatch/COMPLETION-COVERS.md`: the three files, the headline used, what the hero is, the crop check, anything off. Never open anything in Victor's apps (he is asleep); no Playwright MCP; no em or en dashes. Reply with the three paths.
