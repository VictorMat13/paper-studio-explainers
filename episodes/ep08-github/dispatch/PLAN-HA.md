# PLAN: HA (hook H1 "What actually is GitHub, and why does everyone building with AI keep mentioning it?")

Builder HA (Opus 5.5), 2026-11-07 CT. Group `HA`, shots HA1-HA4, runs in front of BodyA (A, AYT), BodyB (AB, ABYT) and BodyC (AC, ACYT). Files: `C/src/ptp08/beats/HA.tsx`, `C/src/ptp08/beats/HA/` (helpers), `C/public/ptp08/HA/` (copies of `E/storyboard/assets`: github.svg, github-white.svg, git.svg, claude.svg, robot.png, laptop.png).

All frames from `timing.ts` (`useShot`, `useWords`, `useGroupShots`, `bodyOf(useVariant())`); the provisional numbers below are only for orientation. World px = reel px before the shell's 0.9 pad: the hook box (screen y 460-1240) is world y 427-1293, the overlay band (screen 290-440) is world y below 405, safe x 65-1015 on screen is world x 12-1068. Camera: kit `Camera box="hook"`, no motion blur (it carries text), max zoom 1.06, small lateral leans, identity before the hand-off and still during it.

## Objects (local helpers, `beats/HA/`)

- `GithubSlab` (slab.tsx): the heavy charcoal slab, base 180 x 200 (the contract's 180 px slab), radius 0.16w, thick bottom edge 0.05w, matte top-left sheen, the official white Invertocat (`github-white.svg`, uniform scale, 50% of the width) and the lowercase "github" label under it in Inter 700 white. Drawn larger by a uniform scale: 2.5x in HA1 (450 x 500), 1.3x in HA2-HA4 (234 x 260). Exported for anyone who wants the same slab.
- `RobotAtLaptop` (row.tsx): the robot cut-out (robot.png, 230 px tall) standing behind a small laptop cut-out (laptop.png, 220 px wide, in front), head and shoulders above the lid; a Claude chip (`LogoChip` r 34, official claude.svg) pops onto the laptop's black screen; the robot leans (rotates about the lid line) toward the slab. Kit shadow stack on both cut-outs.
- Captions: `CaptionBlocks` (ep07 rules: a word never before it is spoken, a block gone before the next one's first word, laid out at its final height), hud bottom 1284, scale 1.6.

## Shots

**HA1** "What actually is GitHub," (prov. f0-38)
- Screen: the GitHub slab (450 x 500) centre-low at (540, 790); a white paper card (760 x 520, two sheets peeking right) behind it leaning 6 deg.
- Layers: primary, the slab drops onto the paper (already mid-drop on frame 0: 60 px high, 1.06 scale) and settles by f8; secondary, the card behind turns from 0 to 6 deg as the slab lands and on "GitHub" a soft matte sheen crosses the slab face; ambient, drift on slab and card plus the camera push.
- Camera: open at zoomAt((540, 790), 1.04), push to 1.06 by the end of HA1 (top content 520 maps to 504, clear of the band).
- Caption: "What actually is **GitHub**" (bold italic on GitHub).

**HA2** "and why does everyone" (prov. f39-77)
- Screen: on "and" the slab and its card shrink to the top row (slab 1.3x at (540, 570)) and the slab tilts 8 deg in 3D (rotateY); three robots at laptops pop into a row under it at x 230 / 540 / 850, one per spoken word ("why", "does", "everyone"): the laptop pops (0.6 to 1, no overshoot), the robot rises from behind its lid 2 frames later.
- Layers: primary, the robots popping in; secondary, the slab moving up and tilting; ambient, per-robot bob and slab drift.
- Camera: move (16 f, from "and" - 2) to zoom 1.02 about (540, 860), then a small lateral follow of the newest robot (axis x, weight 0.12, lag 5): the camera tracks along the row as it fills; leans stay small because the row fills the width.
- Part boundary (if split): the third robot pops / a small camera step.
- Caption: "and why does **everyone**".

**HA3** "building with AI keep" (prov. f78-116)
- Screen: a Claude chip pops onto each laptop's screen, one per word ("building", "with", "AI"); the robots lean their heads toward the slab (left +6 deg, right -6 deg, middle lifts 6 px); a 7 px wire draws under the row (y 1128, x 80 to 1000), node to node, a hollow node popping under each laptop as the tip passes.
- Layers: primary, the chips popping; secondary, the wire drawing and the heads tilting; ambient, bob + camera push.
- Camera: push +2% about (540, 900), light follow of the wire tip (axis x, weight 0.08).
- Caption: "building with **AI**" (black bar on "building with AI" if the bold italic reads crowded). "keep" moves to the next block.

**HA4** "mentioning it?" (prov. f117-135, then the pause to the body's first frame)
- Screen: black chat bubbles (kit `ChatBubble`, white Inter 700, fs 36) pop out of the three robots one after another, each reading "GitHub": left robot's bubble rests up-left beside the slab, middle one under the slab to the right, right one up-right beside the slab (an arc around the slab, no text crossed); the slab bobs once on "it".
- Camera: push +3% about (540, 760) on "mentioning", then back to identity by the hand-off start (12 f).
- Caption: "keep **mentioning** it" (leaves 3 frames before the hand-off).

## Hand-offs (the pause after "it?", about 10-11 frames; branch on `bodyOf(useVariant())`)

HA's language is the turn: the hook's objects turn over (rotateY 0 to 55 deg, skipping edge-on) and the body's first card comes round on their back (-55 to 0 deg, scale 0.9 to 1), full size and untransformed on the last hook frame (camera at identity, captions gone), so the last hook frame IS the body's frame 0. The body's own `FirstCard` component is imported, never copied.

- **A (BodyA, GitHub-on-Git stack card, `BodyA/firstCard.tsx`)**: the slab IS GitHub, so it shrinks and flips into the GitHub chip: the robot row (robots, laptops, chips, bubbles, wire) turns over toward (540, 890) while the slab shrinks toward the card's GitHub chip slot (352, 760) and turns away; the card comes round on their back and the slab's back face, the white GitHub chip, comes round with it as a child of `FirstCard` (on top of the card's own chip and larger until it lands, so there is never a doubled chip), shrinking onto the slot; last frame `<FirstCard t={0} />` alone.
- **B (BodyB, the Claude Code terminal card, `BodyB/firstCard.tsx`)**: the three Claude chips on the laptops lift and converge into the terminal's corner Claude chip while the row and the slab turn over; the terminal card comes round on their back. Stand-in until BB ships: a TerminalCard 860 x 560 centred (540, 890) with an empty prompt and a cursor, a Claude chip on its top-left corner, the 1 2 3 4 strip under it.
- **C (BodyC, the laptop with one app card, `BodyC/firstCard.tsx`)**: the middle robot's laptop is the one that matters: the side robots and the slab turn over and away, the middle robot ducks behind its lid, and BodyC's laptop card comes round in the middle laptop's place, growing to full size. Stand-in until BC ships: the laptop cut-out centred (540, 890) with a white app card on its screen and a "1 copy" pill on the lid.

The exact choreography of B and C follows each body's real `FirstCard` once it exists (its props decide whether the flying chip / laptop can ride inside the card like in A). Verification: stills of the hand-off start, middle, last hook frame and body frame 0 for A, AB, AC, plus every 2nd frame from 8 before the hand-off to body frame 0 + 4; PSNR of the last hook frame vs body frame 0 (target >= 35 dB).

## Checks before done

Type-check `npx tsc --noEmit -p src/ptp08/tsconfig.json`; stills through `ptp-stills.sh` (6-8 per round); one half-size silent preview of the hook (variant A) with `ptp-preview.sh`, read as a 2 fps sheet, every 5th frame of the safe box enlarged, every caption swap / entrance / exit / hand-off at every 2nd frame; overlay band clear at every camera position; no text crossed; no empty frame.
