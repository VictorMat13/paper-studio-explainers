# CAMERA GUIDE: ep04 JCode camera pass (Paper Studio)

Victor, 2026-10-31: "I need smoother zoom-ins. I need some zoom-ins and stuff like that, and tracking and stuff on the animations ... and then make the captions smoother as well."

This guide is for the beat builders. The kit side is done (`C/src/paperstudio/Camera.tsx`, the new `KineticCaption`); you apply the per-shot plan below to your beat files. Sources: the Liam cinematic-camera rig (`~/.claude/skills/liam-remotion-graphics/reference/upstream/cinematic-camera.md`), the Victor-approved fish8 "very clean" reference (`.../examples/fish8-live-wire-smooth/`), and the promptible camera rules.

C = `<repo>`, E = this episode folder.

## 1. What changed in the kit

- **`Camera`** (new): one world under a virtual camera. Keyframes `{ f, x, y, zoom, rot? }`, bezier moves (`EASE.cam`, in-out cubic family, no springs, no overshoot), zoom interpolated in log space, holds by repeated keys, a lag-smoothed `follow`, adaptive motion blur only on fast moves, a screen-space `hud` layer, and its own ground with a gently parallaxing grid that never scales.
- **`KineticCaption`** (smoother, same API): each word eases in over 10 frames with one soft ease-out (opacity, 7 px rise, 6 px blur to 0, grey to black). A word takes its full slot the instant it starts, so fast words never overlap; only the line glides: centred lines re-centre over 8 frames and a new line lifts a bottom-anchored block over 8 frames. New `scale` prop draws the caption bigger at full sharpness (x, y, w stay frame px). Word spacing is now a uniform 0.32 em (before, the second word got 0.28 em and every later word about 0.56 em because of a padding bug).
- `theme.caption.settle` 7 -> 10 (the other "lands like a caption" helpers in the kit and the beats read it, so they get smoother too), plus `theme.caption.reflow / rise / blur`. `EASE.cam`, `EASE.drift`, `EASE.soft` added.
- Already verified: both tsconfigs type-check, and ep04 stills with the new captions (`E/dispatch/stills/camcap-f*.png`, `camcapH2-f150.png`) render correctly with the current beats. Nothing else in the beats changed: until you apply this plan the reel renders exactly as before apart from the smoother captions.

## 2. The grammar (non-negotiable)

1. **Hold, move, hold.** The action happens during holds; the camera moves to the action between them. Moves take 14-24 frames (`camPath().to(at, pose, dur)` defaults to 18). Never move and reveal at the same instant: start the move 2-4 frames before the word, land as the thing lands.
2. **Zoom in on every key reveal** (the stat, the crack, the $0, the keyword), **track anything that travels** (cards flying, counters, bars, helpers), **pull back for "big picture" lines** (lists, the whole system, a summary).
3. **Every hold drifts.** A hold is never frozen: `.push(until, 0.02-0.06)` (sine in-out) or `breathe={2}`. This is also how a split part (S16a | S16b) gets its visible change: a new push or a small step move at the part boundary, instead of the old 1.5% scale creeps.
4. **One primary action per beat.** One camera idea per shot; do not stack a zoom, a pan and a rotation on the same word.
5. **Smooth, not busy.** Max zoom about 1.5 in the body (a detail reveal), 1.08 in hooks (see 4.3). Pull-backs no lower than 0.88. Rotation at most 1.5 degrees and only on big moments. No whip pans faster than about 60 px/frame on screen; if a still shows a smeared mess, lengthen the move.
6. **The camera moves content, never the frame.** Ground grid stays (0.15 parallax), the shell's single `CrtPass` and the hook overlay sit outside every camera. Captions sit in the `hud` (screen space) unless the plan says otherwise.

## 3. Kit API

```tsx
import { Camera, camPath, zoomAt, frameRect, useCamera, KineticCaption, EASE } from "../../paperstudio";

const S05 = useShot("S05")!;
const keys = camPath({ f: 0 })                                   // identity: { x: 540, y: anchor, zoom: 1 }
  .push(S05.start, 0.03)                                          // slow drift-in while the stack sits
  .to(beatsAt - 2, zoomAt({ x: 540, y: 600 }, 1.15, "hook"), 14)  // push in ON the crack (it stays put)
  .push(S07.start, 0.02)
  .to(S07.start, { x: 540, y: 854, zoom: 1 }, 18)                 // pull back
  .keys;

<Camera
  box="hook"                                   // "body" (default) = safe box, "hook" = y 460-1248 under the band
  keys={keys}
  follow={[{ from: a, to: b, target: (fr) => cardCentre(fr), lag: 4, ramp: 8, weight: 1, dy: 0, axis: "xy" }]}
  ground={{ swoosh: true }}                    // default {} = paper + grid; false if your beat draws its own <Ground/>
  hud={<KineticCaption scale={1.4} anchor="bottom" y={1236} x={90} w={900} lines={lines} />}
  blur={{}}                                    // default on; false = off
  breathe={2}                                  // optional ambient drift in px
>
  {/* world content, in the same reel px you use today */}
</Camera>
```

- **Key convention.** A key's `(x, y)` is the world point placed on the anchor (centre of the box: body 540 x 758.5, hook 540 x 854). `{ f: 0 }` with no pose is the identity, so wrapping an existing scene changes nothing until you add moves. Keys inherit missing fields.
- **`camPath(start)`**: `.to(at, pose, dur = 18, ease = EASE.cam)` holds until `at` then moves; `.push(until, amount, {x?, y?})` drifts the zoom by `amount` (0.04 = +4%) from the last key; `.hold(until)`; `.cut(at, pose)` hard cut; `.keys`. Backward frames are clamped, so a re-timed shot never produces a broken key list.
- **`zoomAt(p, zoom, box)`**: zoom about world point `p` so `p` stays exactly where it is on screen. Use it for "push in on X" (the crack, the counter, the robot): nothing slides sideways, X just grows. Under it, a world y maps to `p.y + (y - p.y) * zoom`; use that to check the band and the caption (4.3).
- **`frameRect(rect, { box, margin, max })`**: the pose that fills a box with a world rect (the "zoom to the $0" kind of reveal). Pass a box that ends above your caption, e.g. `{ x0: 65, x1: 1015, y0: 290, y1: 960 }`, and give the Camera the same anchor (`anchor={boxCentre(thatBox)}`) or use `zoomAt`.
- **`follow`**: `target(fr)` must be a pure function of the (fractional) frame that returns the moving thing's world centre; lift the element's position maths out of its JSX into a function and use it for both. `lag` (frames) gives the operator feel (3-6); `weight` < 1 leans toward the target without centring it; `dy`/`dx` keep the target above the caption; `axis: "x"` for horizontal tracks (race bars, chip lines). **Key the base pose along the same path**: when a follow ends, the camera eases back to the keyed pose, so key it to where the target ends or the camera swings back (seen and fixed in the demo).
- **`hud`**: screen space, never zooms, never blurs. Put captions, pills that label the frame and anything that must stay put here.
- **Motion blur**: on frames where the camera moves faster than 5 px/frame, the world is drawn several times inside one 180-degree shutter (3 to 10 samples, adapted to the speed so copies are at most 5 px apart), sampling the world's own time too, so a card the camera tracks stays sharp while the paper smears. Above 150 px/frame it is treated as a cut and not blurred. Holds cost nothing extra. Caveat: an element with `mixBlendMode` inside the world (B2's Rust sheen uses `screen`) blends against a transparent layer on blurred frames; check that frame or keep that element in the hud.
- **`useCamera()`** inside a Camera: `{ pose, anchor, toScreen(w), toWorld(s) }` for a hud element that must sit next to a world object.
- **Captions**: replace the scale wrappers (`B1Hook/BigCaption`, `B2Diagram/parts Cap`, `B3Stats/parts BigCaption`, `B4Swarm/caption`, `H2/common`) with `<KineticCaption scale={k} .../>`: same x/y/w in frame px, same look, sharper, and the 7 px rise and 6 px blur stay true screen px. Until you migrate, the old wrappers still work (rise and blur just scale with them).

## 4. ep04 integration rules

### 4.1 Structure
- One `Camera` per scene inside your beat (B1: hook scene, body scene; B2: hands, blocks, Rust; B3: stats, memory + sessions; B4: best part, helpers, strip, swarm, price, CTA; one per hook). Delete the beat's own `<Ground/>` for that scene and let the Camera draw it (`ground={{ swoosh: true }}` in B3 stats), or pass `ground={false}` and keep yours under the Camera.
- Remove the ad-hoc scale wrappers that fake a camera (`CAM_ORIGIN` scales in B3, the 1.5% split-part creep in B2, `push` wrappers in B4 and the hooks, `hookKit`'s stepping camera) and express them as keys, so there is exactly one camera transform per scene.
- Frozen copies (`FrozenB2Exit` in B3, `FrozenB3` in B4) render your beat under `Freeze`, camera included, so they keep matching what was on screen. Nothing to do.

### 4.2 Boundaries and hand-offs (no empty frames, no jumps)
- **Every group starts and ends at the identity pose** unless the boundary is a blur break. The next group's first frame (or its frozen copy of yours) must match. Concretely: be back at `{ zoom: 1 }` and the box centre by `groupEnd - 2`.
- **Hooks**: the hand-off shrinks your main object onto `HANDOFF_POINT` in screen px. Be at identity by the hand-off start (`ho` in `handoff()`) and keep the shrinking object in the world, or move it into the hud. Never let the camera move during `ho..end`.
- **Blur breaks** (S20, S37, S57): the camera may keep drifting into the blur (it reads as a lens push) but must not cut inside it.
- **Cuts**: a hard scene change inside a group may also cut the camera (`.cut()`), but prefer starting the new scene already mid-move (open tight on something already moving).

### 4.3 Safe zone, the hook band and the caption block
- Readable things stay inside x 65-1015, y 269-1248 at every camera position. Grounds, swooshes and the hand arms may bleed.
- **Hooks are already full** (Victor's R1 notes: fill y 460-1240), so zoom room is small: the topmost world content must map below y 440 and the bottom content above the caption top. With `zoomAt(p, z, "hook")` a world y maps to `p.y + (y - p.y) * z`. Rule of thumb: about a point at y 700-760, zoom up to 1.06 keeps both clear; bigger zooms (up to about 1.25) only when the neighbours have left (Codex card gone, fan folded) and the framed object sits mid-frame. Prefer lateral tracking (focal x shifts of 60-100 px) in hooks.
- **Body**: captions are in the hud. Before a zoom, find your caption block's top on screen (B1 body 942, B2 about 1010-1112, B3 300 top / 970-1032 bottom, B4 880-1100) and keep the zoomed world out of it: frame into the box above the caption, or zoom about a point high enough that `p.y + (bottom - p.y) * z` stays above it. If a still shows a card under the caption, lower the zoom (never drop below the minimum the plan gives).
- Hand cut-outs: pull-backs below about 0.9 reveal the photos' cropped arm ends (B2 already scales them to 0.85 for that reason). Do not pull back past 0.95 on the hands scene.

### 4.4 Performance
- Blurred move frames cost 3-10x a hold frame. A 70 s reel with about 60 moves of 18 frames adds roughly 1000 heavier frames; expect a full render to take about 1.5-2x longer. If a render is too slow, pass `blur={{ samples: 6 }}`.

## 5. Per-shot camera plan

Frames are the main variant's (group-local in parentheses where it helps); always derive them in code from `useShot` and the spoken words (`wordAt`), never hard-code. "Push" = `.push()` drift; "move" = `.to()`; "follow" = `follow` entry. Poses are world px (today's layout coordinates). Zooms are starting values: verify with stills and adjust within the limits.

### B1Hook: H1 hook (main only, `box="hook"`) and the body opening S08-S11

| Shot | Words (main frame) | Camera | Notes |
|---|---|---|---|
| S01 | Cursor@2 | Open already moving: start at `zoomAt({x: 330, y: 620}, 1.04, "hook")` (on the Cursor chip and the stack's top left), push to 1.06 by the end of S01. | First frame shows content. The chips' top edge (y 456: line y 520, r 64) maps to 620 + (456 - 620) * 1.06 = 446, just under the band; do not go higher than 1.06 or zoom about a lower point. |
| S02a/b | Codex@47 | Track along the chip line: move (16 f, start 2 f before "Codex") to focal x 540 at the same zoom; S02b boundary: push +2%. | The lateral track follows the line extending. Optionally `follow` the line tip x (`axis: "x"`, weight 0.4, lag 5). |
| S03a/b | Claude@99 | Move (16 f) to focal x 700; S03b boundary push +2%. | Card swap to Claude Max reads as the camera arriving. |
| S04a/b | One@152 | **Pull back** to identity over 18 f from S04.start as the line slides out and the stack lifts; S04b push +2%. | Big picture for the caption block that starts building. |
| S05 | beats@206 | **Push in on the crack**: move 14 f starting at beats-2 to `zoomAt(crackCentre, 1.15, "hook")`, crackCentre = the stack card's centre at that frame (about 540, 610). | The "beats all of them" crack is the reveal. Card bottom must stay above the caption top (about 860-980 here): if not, 1.10. |
| S06 | and made it@234 | Hold the zoom while the stack starts falling; `follow` the falling stack (`axis: "y"`, weight 0.35, lag 4) from S06.start to S07.start + 8 so the camera dips with it. | The fall is fast; a partial follow sells it without losing the caption. |
| S07a/b | free@251 | Ease back to identity (move 18 f from S07.start); S07b push +2% as the vignette rises. | Must be at identity by S08.start: the waiting GitHub card hands into S08. |
| S08 | JCode@321 | Identity at the cut, then push +4% about the card's centre (`zoomAt({540, 836}, 1.04)`) while the card grows; tiny follow on the JCode chip pop is not needed. | H2-H6 also start here: their hand-off lands on S08's card centre at identity, so S08 must begin exactly at identity in every variant. |
| S09 | and there's@346 | Hard cut to the big GitHub card (already in the beat): `.cut(S09.start, zoomAt({540, 600}, 1.0))`, then push +3% to S10. | Replaces today's `1 + 0.03 * push` card scale. |
| S10 | you need to know first@378 | **Zoom into the repo card's header** (the README / star row the captures show) on "know": move 16 f to `zoomAt({540, 470}, 1.18)`, hold with push +2% to group end. B2 opens with a cut to the hands, so S10 may end zoomed (the one exception to 4.2). | Caption at y 942 stays clear (card bottom 900 maps to 470 + 430 * 1.18 = 977: use 1.12 if the still shows overlap). |

### B2Diagram: hands, harness, heavy blocks, Rust (`box="body"`)

| Shot | Words (main frame) | Camera | Notes |
|---|---|---|---|
| S12a/b | Every coding agent@416 | Open at 1.0 as the hands slide in; push +3% (S12a), S12b boundary: step move (14 f) 2% toward the gap (`zoomAt({545, 420}, 1.05)`). | The hands' own entrance is the action. |
| S13 | middle layer@462 | **Zoom into the fingertips gap** as the bracket draws: move 16 f starting at middle-3 to a pose that puts the gap at screen y about 520: `{ x: 545, y: 420 - (520 - 758.5) / 1.3, zoom: 1.3 }`. Push +2% through S13. | The bracket's top node (470, 290) must stay inside the safe box (check). Caption under the hands: if the wrists run under it, 1.22 minimum. |
| S14 | and the AI@501 | Hold zoomed, push +2%. | |
| S15 | That's the part handling@534 | **Pull back** (move 20 f from S15.start) to `{ zoom: 0.96 }` centred, as the scene tilts down for the icon list. | Big picture. Not below 0.95 (arm crop). |
| S16a/b/c | prompts@579 tools@600 memory@619 sessions@642 | **Track down the icon list**: one step move per row word (12 f each, starting 2 f before the word) moving the focal y down 74 px (the row height at k 1.35) from row 1 (about 600) so the newest row sits a little above the centre; zoom 1.0. Part boundaries land on these steps. | The rows are at x 300, y 548 + i * 74 * 1.35. Keep the header caption (top) in the hud. |
| S17a/b | harness@701 | Move 16 f (start harness-6) to `zoomAt({540, 1166}, 1.25)` = **push in on the harness icon** as the dashed arrow lands; S17b push +2%. | The icon (cx 540, cy 1166, s 136) is the reveal. Caption capH at 1112 is in the hud: check the icon does not grow under it; if it does, use `frameRect` of the icon into `{y0: 600, y1: 1080}`. |
| S18a/b | and most apps you're paying for@722 | Cut to the blocks scene at 1.0 (the hands leave), then **track the slabs dropping** left to right: three step moves (10 f each) on the chip words, focal x 205 -> 540 -> 875 at zoom 1.12 about y 570 (`zoomAt({x, 570}, 1.12)` with x per slab). | The line is at y 570, slabs 270 px; labels must stay inside x 65-1015 (at 1.12 an edge slab label sits about 30 px further out: check). |
| S19a/b | big and heavy@795 | Pull back to identity (move 14 f on "big"), then on "heavy" a **downward push** with the sag: `follow` the middle slab's top (`axis: "y"`, weight 0.5, lag 3) while the line sags, plus push +3%. Optional 0.8 degree rotation on "heavy" settling back by the break. | The sag is the action; the camera "feels" the weight. |
| S20 | (blur break) | Keep the S19 drift going into the blur; no cut. | |
| S21a/b | JCode rebuilt that whole thing@838 | Clear the blur at 1.0, then **track the card assembling**: as the four parts snap in (one per word: rebuilt, that, whole, thing), step the focal 30-40 px toward each part (quadrants of CARD 160,330,760,630), zoom 1.06. | Small steps, the card is the hero; caption at 1022 in the hud. |
| S22a/b | from scratch@906 in Rust@938 | Pull back to 1.0 on "from scratch" while the sheen sweeps, then **push in on the Rust chip** stamp: move 12 f from Rust-3 to `zoomAt({880, 370}, 1.12)` (the card's top right corner), hold with push +2%, be at identity by groupEnd - 2 (B3 shows a frozen copy that lifts out). | The frozen copy reproduces the zoom automatically, so ending zoomed is also fine as long as B3's first frame matches; identity is the safer choice. |

### B3Stats: stats, memory, sessions (`box="body"`, stats `ground={{ swoosh: true }}`)

| Shot | Words (main frame) | Camera | Notes |
|---|---|---|---|
| S23a/b | Every extra session uses@960 | Open at `zoomAt({540, 382}, 1.12)` on the counter as it starts ticking (grey 1x), push +2% to S24. | Counter (BigCounter) at y 382, label at 292 (top caption is part of the stat, keep it in the world but check it stays below 269). |
| S24a/b | 20@1011 times less memory@1027 | **Follow the counter to 20x**: hold on the counter while it counts, then on "20" a quick push +6% about the number (12 f); S24b on "less memory" pull back to 1.0 so "less memory than" lands in frame. | Victor's "follow the counter to 20x". |
| S25 | than Claude Code@1063 | Small **track right** to the Claude chip at the end of the row (focal x +60, 14 f), push +2%. | The chip pop is the payoff of the row. |
| S26a/b/c | And it opens in@1088 14 milliseconds@1132 | Move down (20 f, from "opens"-4) to the race bars: focal y about 890, zoom 1.1. On "14": push in on the JCode bar's "14 ms" (`zoomAt({300, 846}, 1.18)`, 12 f). S26c: hold, push +2%. | Race rows y 846 and 936, h 70. Three parts = three visible camera states. |
| S27a/b | Codex needs almost a second@1188 | **Track the Codex race bar**: `follow` its fill tip (`axis: "x"`, weight 0.6, lag 5, target x = bar start + fill width) from Codex-2 to land (883 ms); then pull back to 1.0 as the result bars wipe in (63x). | Victor's "track the race bars". Value label "883 ms" must stay inside x 1015 at the end: the pull-back handles it. |
| S30a/b | It keeps notes on your projects@1257 | The terminal slides in from the left: `follow` its centre (`memRect(fr)`, lag 4, weight 0.7) for the first 14 f, then hold at 1.04; on "notes" (1285) a **push toward the notes card** (`zoomAt({794, 797}, 1.1)`, 14 f). | Notes card x 598, y 652, w 392, h 290. |
| S32a/b | so it remembers how you work@1320 | **Zoom into the "7 memories" panel**: on "remembers" (1334) move 16 f to `zoomAt({730, 475}, 1.35)` (the panel inside the hero capture; the capture's own region zoom is already pushing there, so the two add up: check the panel stays inside x 1015 and is crisp). Hold with push +2% through S32b. | Victor's "zoom into the 7 memories panel". Bottom caption (970) must clear the hero card: 560 h card bottom 854 maps to 475 + 379 * 1.35 = 987, so 1.3 if the still shows overlap. |
| S34 | You can run a bunch@1380 | Pull back to identity (move 16 f from S34.start) as the hero shrinks to the centre. | |
| S35 | of agents at once@1412 | **Pull back across the fanned session cards**: move 20 f from S35.start to `{ zoom: 0.92 }` centred on the fan (540, 685), so the fan reads as many. | Victor's "pull back across the fanned session cards". Captions top (300) and bottom (1032) in the hud. |
| S36a/b | without your laptop slowing down@1445 | Push +4% back toward 1.0 about the RAM meter (`zoomAt({540, 954}, 1.0 -> 1.04)`) as "10.4 MB" lands; S36b hold. End at identity by groupEnd - 2 (B4's S37 blurs out of a frozen copy, so either way it matches). | |

### B4Swarm: best part, helpers, strip, swarm, price, CTA (`box="body"`)

| Shot | Words (main frame) | Camera | Notes |
|---|---|---|---|
| S37 | (blur break) | Drift only. | |
| S38 | And the best part?@1509 | Text-only beat: push in slowly about the caption (`zoomAt({540, 700}, 1.0 -> 1.06)` over the shot, `EASE.drift`). The caption here IS the world (it is the visual). | A drift, not a move. |
| S39a/b | One agent can bring in@1551 | Cut to the boss card at 1.04 about its centre (540, 740), push +2%; on "bring" (1583) pull back to 1.0 as the wires and nodes appear. | |
| S40 | its own helpers@1596 | **Follow the helper cards flying out**: `follow` the mean centre of the three helper cards while they travel from the boss foot to their slots (target = average of their animated rects), lag 4, weight 0.6, `dy: -60` so the boss stays in frame; land at a slight pull-back 0.97. | Victor's "follow the helper cards flying out". Helpers at y 1036-1232 must stay inside y 1248 at 0.97 (they map higher). |
| S41a/b | It becomes the boss@1635 | The cards merge into the wide strip: hold at 1.0 during the merge, then on "boss" (1666) push in on the boss pill + pane (`zoomAt({330, 420}, 1.12)`, 14 f). | Pills ride at the strip's top (y about 420). |
| S42 | the rest do the work@1690 | **Track with the strip's pan** (`follow` axis x, weight 0.4, target = the pane under the "worker" pill), zoom 1.06. Be at 1.0 by S43.start. | The strip pans right to left inside its frame; the camera leans with it. |
| S43a/b | all in one codebase@1730 | Three tilted terminals drop: hold at 1.0; when the wires reach the folder (lineAt) **push in on the folder** (`zoomAt({540, 1030}, 1.15)`, 14 f); S43b on "codebase" pull back to 1.0 (16 f) for the full picture. | Folder cx 540, cy 1030; the bar caption at 1098 is in the hud, so 1030 + 50 * 1.15 stays above it; check the bar. |
| S49a/b | The tool itself is free@1796 | **Zoom to the $0**: on "free" (1838) move 14 f to `zoomAt({540, 540}, 1.25)` (the $0 on the price card), push +2%; S49b already zoomed. | Victor's "zoom to the $0". The card's empty lower half rises under the caption line (about 1003): if the still shows it, 1.18. |
| S50 | You sign in with@1850 | Pull back to 1.0 (16 f) as the sign-in slots open. | |
| S51 | the Claude or@1888 | **Track to the Claude slot** (`zoomAt({360, 860}, 1.1)`, 12 f on "Claude") as its chip clicks in. | Slots at y about 860. |
| S52a/b | ChatGPT plan you already have@1914 | Track across to the ChatGPT slot (focal x 720 at 1.1, 12 f on "ChatGPT"); on "plan" pull back to 1.0 for the whole card + "you already have" bar. | A lateral track left to right across the two slots. |
| S57 | (blur break) | Drift only. | |
| S58a/b | Comment code@1991 / 2020 | Robot rises at 1.0; on "code" (bubble pops) **push in on the robot and bubble**: `zoomAt({420, 700}, 1.08)` (12 f), hold with push +2%. | Victor's "push in on the robot as the bubble pops". "CODE" text (x 180-900) stays inside the safe box at 1.08; the bubble's own edge may cross x 1015 (it is not text). |
| S59-S61 | and I'll send you the exact steps to set it up@2041 | Ease back to 1.0 on "and I'll" (16 f) so the side caption (cx 765) has room; push +2% across S60-S61 about (540, 760). | The side caption is in the hud. |
| S62 | (hold) | Breathe only (`breathe={2}`), no move: a clean end hold. | |

### Hooks (`box="hook"`, all start content on frame 0, all end at identity before `ho`)

Shared: every hook opens already moving (a small push from 1.04 to 1.06 about the opening object), uses lateral tracks rather than big zooms, and is back at identity by the hand-off start. The shell's overlay band y 290-440 must stay empty at every camera position.

**H2 "Speed proof" (Codex vs JCode stopwatches; Codex 100,462 420x530, JCode 560,462 420x530)**

| Shot | Words (H2 frame) | Camera |
|---|---|---|
| H2.1 | Codex takes almost@2 | Open on the Codex stopwatch: `zoomAt({310, 727}, 1.06, "hook")` plus focal x shifted 70 px toward it (lateral lean), push +2% while the needle starts. |
| H2.2a/b | a full second to load@32 | **Follow the Codex needle's sweep**: hold on Codex, push +3% across H2.2a; at H2.2b (54) small step push +2% as it reaches 883 ms. |
| H2.3a/b | This free coding agent@80 | **Track across to the JCode card** (move 18 f from "This"-2, focal x 770, same zoom); if the Codex card has exited by then, zoom to 1.12 about the JCode card centre (770, 727). |
| H2.4a/b | shows up in 14 milliseconds@127 | On "14" (147) **push in on the 14 ms stamp** (+5%, 10 f); H2.4b: pull back to identity (16 f) and hold before `ho`. |

**H3 "Memory proof" (RAM card 100,468 880x486)**

| Shot | Words (H3 frame) | Camera |
|---|---|---|
| H3.1 | This free coding agent runs on@2 | Open at 1.04 on the Claude row (about 540, 560), **track the Claude bar filling** left to right: `follow` its fill tip x (`axis: "x"`, weight 0.4, lag 5) while it fills 20 cells. |
| H3.2 | 20 times less memory@47 | On "20" move 14 f to the JCode row (focal y +60), then on "times" (58) **push in on the 20x** (`zoomAt({820, 860}, 1.08, "hook")`, 12 f). |
| H3.3 | than Claude Code@88 | Small step toward the Claude chip on "Claude" (97), then back to identity (14 f) before `ho`. |

**H4 "Hidden layer" (editor sheet 100,462 880x548; dark layer underneath)**

| Shot | Words (H4 frame) | Camera |
|---|---|---|
| H4.1 | Every coding agent you pay for@2 | Open at 1.04 on the code lines (about 420, 640), push +2% (the caret blinks: micro-motion). |
| H4.2 | has a hidden layer@46 | **Track the peeling corner**: `follow` the peel corner (from 980, 462 moving down-left) with weight 0.35, lag 4; on "hidden" (58) push +3%. |
| H4.3a/b | and one developer just rebuilt it@83 | **Pull back** to identity (18 f) to show the whole tangled layer; on "rebuilt" (130) push in about the hub node (540, 736) +5% as it rewires clean. |
| H4.4a/b | from scratch for free@146 | Hold, push +2%; small step toward the "rebuilt in Rust" tag (bottom right) on "free" (176), then identity before `ho`. |

**H5 "Same model, better results" (AI chip 540,532 r 72; cards 100/560, 650, 420x350; caption 1026)**

| Shot | Words (H5 frame) | Camera |
|---|---|---|
| H5.1 | The same AI can get@2 | Open at identity with a slow push to 1.04 about (540, 700): the chip top stays below 440 only up to about 1.06 here, so no more. |
| H5.2 | better or worse at coding@32 | **Track left to the rising card on "better"** (34): focal x 450 (a 90 px lean), 14 f; **track right on "worse"** (50): focal x 630, 14 f. Zoom 1.05 about y 700. |
| H5.3 | depending on one part@71 | Back to centre (14 f) as the cards merge; on "part" (101) push +4% about the merged card centre (540, 789). |
| H5.4a/b | most people never think about@109 | Hold with push +2%; the ring pulse is the action; identity before `ho`. |

**H6 "AI that hires a team" (agent card 320,772 440x262; fan above it y 578-702; caption 1046)**

| Shot | Words (H6 frame) | Camera |
|---|---|---|
| H6.1 | One AI agent@2 | Open tight on the agent card: `zoomAt({540, 880}, 1.08, "hook")`, push +2%. |
| H6.2 | can now bring in@29 | **Pull back** to identity (16 f) as the wires spring out of the card's top node. |
| H6.3 | its own team of coders@50 | **Follow the helpers flying out**: `follow` the mean of the four fan cards while they fly (lag 4, weight 0.5) and land at 0.97 so the whole fan reads (outer cards at cx 222 / 858 stay inside the safe box). |
| H6.4 | and the tool behind it@91 | Fan folds back into the agent: push in with it (`zoomAt({540, 828}, 1.06)`, 16 f) as the agent grows into the hero. |
| H6.5 | costs nothing@130 | On "costs" push +3% toward the $0 chip corner (top right of the agent card); identity before `ho`. |

## 6. Builder checklist (per beat)

1. Wrap each scene in one `Camera`, move the beat's ground into it (or `ground={false}`), move captions into `hud` with `KineticCaption scale`, delete the old fake-camera scale wrappers.
2. Build the keys with `camPath` from `useShot` / `wordAt` frames as in the table. Type-check: `npx tsc --noEmit -p src/ptp04/tsconfig.json`.
3. Stills through the lock (`E/dispatch/ptp-stills.sh`, about 8 per round): for every camera destination take the frame where the move lands, one mid-move frame (to see the blur), and the group's first and last frames. Hooks: also `ho` and `end - 1`. Use `showSafe` on the Camera while checking, then remove it.
4. Check on every still: band 290-440 empty (hooks), readable text inside x 65-1015 / y 269-1248, caption block clear of the world, no near-empty frame, boundary frames identical to the neighbour group.
5. Write what you changed and the still paths into your completion note.

## 7. Demo and stills

- Kit demo `PaperStudioDemo` frames 280-439 (`C/src/paperstudio/Demo.tsx`, `CameraPart`): push-in during a hold, zoom to the $0 detail (`frameRect`), tracking follow of a card flying across the board (camera base keyed along the same path, lag 4), pull-back to the whole board, new captions in the hud.
- Stills: `C/src/paperstudio/stills/cam5-f344..f404.png` (tracking + pull-back, final), `cam4-f292.png` (push-in, a word mid-entry), `cam4-f332.png` (zoomed on the $0 detail), `cam4-f430.png` (end hold), `cam3-f316.png` (mid-zoom motion blur), plus earlier rounds `cam`, `cam2`, `cam3` showing the fixes (ghosting -> adaptive samples, tracked card smearing -> world-time sampling, swing-back after a follow -> keyed base path).
