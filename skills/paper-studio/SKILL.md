---
name: paper-studio
description: The "Paper Studio" explainer style (by Victor Matevski) and its full production pipeline. Light product-launch look on an off-white grid with solid lines, photoreal cut-outs (the human hand vs robot hand) that float and cast soft shadows, real logos in white-rimmed button chips, paper cards with thickness and stacked sheets, dark terminal screenshots in white bezels, word-by-word captions with bold italic key phrases and black highlight bars, a cute robot CTA with a keyword speech bubble, a smooth tracking camera, and a light neutral CRT pass. Use it whenever the user asks for "Paper Studio", "the JCode style", "the InsiderForce style", "the hand and robot hand style", "like the JCode storyboard/video", or a storyboard or Remotion reel in that look, even if they only say "make it look like the JCode one". Covers the storyboard page, the Remotion kit, the build pipeline, sound, and the Instagram plus YouTube Shorts deliverables.
---

# Paper Studio

A faceless 9:16 explainer look, first built for ep04 (JCode, 2026-10-30/31) from the InsiderForce JCode short. Victor approved the storyboard with "I love it". The reference breakdown is in `references/reference-breakdown.md` (the reference short itself is someone else's video, so it is described there in words and linked in `references/SOURCES.md`, not included). **Watch the finished videos in `reference-videos/` at the repo root frame by frame before designing anything new.** The worked example that ships with this repo is ep08 (GitHub): `episodes/ep08-github/` (script, storyboard, builder docs, tools) with its code in `src/ptp08/`. The ep04 storyboard page is in `examples/ep04-jcode/`.

The look reads as physical objects on a lit sheet of grid paper, filmed by a smooth camera through a clean, barely-there CRT. Every rule below serves that: one light source, real objects with real shadows, crisp big type, nothing glowing or neon, nothing empty.

## Models and workflow

- Storyboards and builds run as Claude Code sub-agents on the strongest models you have (the originals used the top model for storyboards and Opus for Remotion builds, assets, voice, SFX, QA and exports). The main session orchestrates, reviews and merges.
- Agent Dispatch waves, each with a gate: storyboard (Victor approves in Chrome) → foundation in parallel (KIT, ASSETS, INFRA, VOICE) → beat builders in parallel (one per body section, one per 2-3 hooks) → watch-through fix rounds → camera pass → FINAL (silent renders, SFX timelines, exports) and YT versions.
- **Never wait for the voice to build or render the video (Victor, 2026-11-02: "We don't need to wait for the audio").** Once the script and storyboard exist, start the beat builders straight away on a provisional timeline cut from the storyboard's frame ranges, and render full silent previews of the whole video as soon as the groups exist. The graphics read their frames from `timing.ts`, so when the voice (or a re-voice) lands, INFRA regenerates the timeline from the word timings and the cuts snap to it; then re-render. The voice is reviewed by Victor in parallel, never as a gate in front of the graphics.
- Run independent work in parallel. Victor expects everything that can be generating to be generating while other parts are being made, and a full-video render running as soon as there is anything to render.
- **Watch every render end to end** before showing Victor: 2 fps contact sheets of the whole video, plus frame-exact checks at every group boundary and hand-off. Send concrete notes back to the builders.
- **2 fps thumbnails are not enough (Victor, ep06, 2026-11-02: "some of the text is getting overlaid ... the scissors are cutting through, but it's not actually cutting").** Also go through every group at every 5th frame with the safe area cropped and enlarged, and every caption swap, entrance/exit and split part at every 2nd frame, looking for: text overlapped or crossed by any object or by the next caption line (old line must be gone before the new one appears there), smeared or doubled text from camera motion blur (motion blur never on text), double-exposed scenes at blur breaks (both scenes must be heavily blurred while they cross), and physical actions that don't read as real (scissors must actually cut: blades straddle the material, open and close, the cut opens behind the tips). Builders do the same check before reporting done and list the frame ranges they checked.

## Storyboard page

One self-contained HTML page: every frame a real 1080x1920 DOM frame scaled down with `transform: scale()`, so all coordinates are reel pixels. Start from `examples/ep04-jcode/index.html` and keep its helpers (`ground`, `card`, `chip`, `hand`, `terminal`, `svg/path/node`, `IMG` with fallbacks, `crt`, `veil`). Include a safe-zone toggle and a CRT toggle. Real assets go in from round 2 (real logos, page captures, photo cut-outs), with drawn fallbacks while they arrive. Open it in a real Chrome window for review.

## Remotion kit

`src/paperstudio/` (export everything from `index.ts`; demo composition `PaperStudioDemo`): `theme`, `Ground`, `CrtPass`, `PaperCard`, `TerminalCard`, `TerminalStrip`, `LogoChip`, `LogoChipLine`, `InlineChip`, `Cutout`, `HandsScene`, `IconObject`, `GuideMock`, `WirePath`, `WireNode`, `DashedArrow`, `ShatterOverlay`, `BlurBreak`, `KineticCaption`, `IconList`, `SparkleList`, `StatRow`, `RaceBars`, `Pill`, `HookOverlay`, plus the camera system (see Camera). Episode code lives in `src/ptp<NN>/` with an INFRA shell: `timeline.ts` generated from the voice word timings, `timing.ts` helpers (`useShot`, `useWords`, `useGroupShots`), one beat file per group, one `CrtPass` over the finished frame in the root.

## Ground and grid

- Lit off-white with a bright centre: `radial-gradient(ellipse 46% 30% at 50% 46%, #FFFFFF, #F8F8F7 40%, transparent)` over `radial-gradient(ellipse 70% 60% at 50% 50%, #F4F3F2, #EAE8E6 70%, #DCD9D6)`, a soft top-left highlight and a gentle vignette.
- Grid: solid lines over the whole frame on every shot, 135 px cells (8 across), 3 px lines at `rgba(78,74,72,0.30)`. Victor asked for fewer, thicker lines than the ep03 app audit grid (90 px, 2.4 px) and rejected dotted and dense grids. The grid does not scale with the camera.
- Grey swoosh ribbons may bleed off the top and bottom in stats sections.

## CRT pass (one layer over the finished frame, never per element)

- Fine neutral scanlines: 1 px every 6 px at 3% multiply.
- Soft bloom on whites only (highlights above about 67%, blur 9 px, 45%), masked so black ink and captions keep full contrast.
- Fractal grain at 8% soft-light, a 12% vignette, screen corners rounded at r 34.
- **No colour fringe, no RGB phosphor triad**, no tint, no curvature, no flicker. Victor rejected the blue edges the channel split produced.

## Objects and depth

One light from the top left. Every shadow falls down-right.

- **Photo cut-outs** (the human and robot hands in `assets/photos/`): photoreal, generated on white and background-removed (any image model, then any background remover), then cropped to their opaque bounds. They enter big from the frame edges, arms bleeding off left and right, fingertips almost touching near the centre with the bracket wire between them. Each floats a little above the paper: `drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(10px 14px 8px rgba(0,0,0,.14)) drop-shadow(34px 52px 30px rgba(0,0,0,.24))`. No blob shadow underneath. Victor's favourite scene.
- **Logo chips**: real official logos only (`assets/logos/`), in a white button with a thick rim (about 11% of the diameter), an inner highlight and a soft shadow down-right, lowercase label below. Logos fill about 58% of the button; marks with built-in margin (the JCode halftone donut) get almost no padding or they read as a dark bead. Heavy versions: charcoal slabs with a thick bottom edge.
- **Paper cards**: white, radius 14 px, a hard 3-5 px edge for thickness, a two-layer soft shadow, 1-3 sheets peeking out to the right, optional slight 3D lean. Real page captures inside, cropped to the part that tells the story (prices change: check live pages at build time).
- **Terminal cards**: real screenshots of the tool in a white bezel with rounded corners and a deep shadow; 3D tilt or a wide pan where the beat needs it.
- **Lines and nodes**: black, 7 px main bracket, hollow nodes r 15 with a 6 px ring; dashed arrows for flows. The diagram casts a soft shadow so it reads as raised wire.
- **CTA robot**: a cute, very simple white mascot with a dark visor (generated once, cut out), rising from below with a soft contact shadow, blinking and tilting its head, as the hero of the CTA. A white paper speech bubble with the card edge and shadow pops out of it holding the keyword (about 200 px). "Comment" above (about 70 px), the promise caption beside or under it.

## Layout and captions

- **Fill the safe box.** Centre each composition in the safe area (x 65-1015, y 269-1248; hooks under the overlay, y 460-1240) and make the main visual span most of it. Victor's watch-through rejected compositions sitting small in the top half.
- Captions, Inter, centred: connector words about 56-60 px, bold italic key phrase about 90-96 px, black highlight bar text about 62-66 px, big upright words 110 px+, text-only beats 110-130 px. Never below 34 px.
- Words reveal on the real voice word timings (see Captions, motion detail).
- **5% side padding (Victor 2026-10-31, "so nothing gets cut off").** The shell wraps everything in `<PadCtx.Provider value={0.9}>`: each `Camera` draws its world and hud at 90% around the safe-box centre while the ground stays full-bleed. Any full-frame layer inside a camera (vignettes, tints) must bleed with `inset: -140`, or a faint box edge shows about 54 px in from the sides. Check stills for it.

## Camera system (added 2026-10-31)

Victor: "I need smoother zoom-ins ... and tracking and stuff on the animations", built from the Liam skill's cinematic camera (`liam-remotion-graphics`, `reference/upstream/cinematic-camera.md`, and the approved fish8 "very clean" example). Kit: `Camera`, `camPath`, `zoomAt`, `frameRect`, `useCamera` in `paperstudio/Camera.tsx`. Full API, ep04 integration rules and a worked per-shot plan: `references/camera-guide-ep04.md`.

- **Hold, move, hold.** The action happens during holds; the camera moves to the action between them in 14-24 frames (bezier ease in-out, no springs). Start the move 2-4 frames before the word and land as the thing lands.
- **Zoom in on every key reveal** (the stat, the crack, the $0, the keyword), **track anything that travels** (cards flying, counters, bars, helpers; `follow` with 3-6 frames of lag for the operator feel), **pull back for big-picture lines** (lists, the whole system).
- **Every hold drifts** (`push` 2-6%, or `breathe`); that is also the visible change at a split shot boundary.
- One camera idea per shot. Max zoom about 1.5 in the body, about 1.06-1.08 in hooks (they are already full, so hooks track sideways instead); pull-backs no lower than 0.88 (0.95 on the hands scene, or the photos' cropped arms show).
- The camera moves content, never the frame: the grid parallaxes at 0.15 and never scales, the single CRT pass and the hook overlay sit outside the camera, captions sit in the `hud` (screen space, never zoomed or blurred).
- Light motion blur only on fast camera moves (adaptive samples in a 180-degree shutter); a tracked card stays sharp while the paper smears. Blurred frames cost 3-10x, so full renders take about 1.5-2x longer.
- Every group starts and ends at the identity pose (or inside a blur break), and a hook is back at identity before its hand-off, so boundaries never jump.

## Captions, motion detail

`KineticCaption` (same API, `scale` prop instead of wrappers): each word eases in over about 10 frames (fade, 7 px rise, 6 px blur clearing, grey to black), even 0.32 em word spacing, and only the whole line glides when it re-centres; new lines slide up over 8 frames. Nothing snaps or jumps.

## Motion and transitions

- 30 fps, no shot longer than 45 frames, three motion layers in every shot (primary action, secondary update, ambient drift), bezier easing, no springs or overshoot.
- **No empty or near-empty frames, ever.** Check every group boundary frame by frame. Blur breaks blur the outgoing scene out and the incoming scene in (never blur an empty ground). Hooks hand off by shrinking their main object onto the body's first card, which is fully visible on its first frame. The first frame of every version shows content.
- Moves from the reference: logo chips popping onto a line with card swaps, a crack web over cards on a "beats them" line, cut-outs sliding in from the edges, the bracket wire drawing node to node, icon lists one row per spoken word, counting stat rows with a logo at the end (in-between counter values are fine), race bars, wide terminal pans, 3D tilted card stacks.

## Voice and timing

- **Scripts and hooks use the language of the previous episodes.** Before writing, read every shipped `ep*/SCRIPT.md` in `episodes/` and match that register (rules in the `explainer-videos` skill, Script rules). Never "Breaking" or other news-anchor words, even when the source post says it (Victor, 2026-11-05).
- Your own voice clone on Fish Audio or ElevenLabs (set up in `SETUP.md`; settings and lessons in the `explainer-videos` skill, `references/voice.md`), one body take plus one take per hook, natural speed only (never sped up), tight cuts on dead air only, and never clip a word ending (cut only true silence under about -52 dB, at least 120 ms after a word ends).
- The original clone reads at about 3.1 words per second; measure yours on the first take and plan scripts for it: a 68 s target is about 200 words including the hook.
- The timeline is generated from the word timings. Before the voice exists, build on a provisional timeline from the storyboard ranges (the timeline tool's `--provisional` mode) and keep building; regenerate from the word timings when the voice lands. When the script changes, re-cut the storyboard shot list to the new voice.
- Delivery: since ep06 (2026-11-02) Victor wants the clone **slightly excited / upbeat, not crazy**: a mild bracket direction on Drama 3, checked against a calm take so it never tips into yelling.

## Sound

- Match the reference's density and levels, not more: deep booms on each chip and card swap in the hook, big airy swooshes when a new main visual enters, soft low thumps on hard cuts and blur breaks, tiny blips when a logo lands at the end of a stat row, one hit on the CTA keyword. The crack, bar wipes, captions, counters, list rows and pans are silent. No dings, no risers. Use any clean SFX pack you own.
- Delivery: graphic silent on V1, voice on A1, every sound effect its own clip on an editor timeline per version (or mixed with ffmpeg), master under -1 dBTP, about -14 LUFS.
- The reference has a trap-style beat under the whole reel at about -10 LU under the voice, drums out for the CTA; music is Victor's call per episode. **Ask before exporting the posting finals**: Victor wants music on before anything posts. The music sits on its own MUSIC track with a 0.5 s fade at the end. Bring your own licensed track.
- **Music level: about 16 LU under voice+SFX (Victor 2026-11-06 on ep07: 12 LU under was "too loud"; 2026-11-03: 22.7 LU under was "I don't hear any music").** Set each song's clip gain from its own integrated loudness (excerpts range from -5.6 to -14.7 LUFS), then bring the whole mix to -14 to -14.5 LUFS with true peak under -1 dBTP. Let Victor hear one preview with music before exporting. For a set of videos, rotate your saved song excerpts, one song per video, every song used before any repeats, and log the table in the dispatch folder. Before reporting music done, check that it is audible: correlate the export with the excerpt and confirm the music's level, not just that the clip is on the timeline.

## Deliverables

- Every hook ships twice: **Instagram** (comment-keyword CTA) and **YouTube Shorts** (the whole CTA swapped for the clone saying "Subscribe to learn more about AI.", one saved take reused on every episode; the robot bubble says SUBSCRIBE; no comment, keyword or DM anywhere in audio, captions or picture).
- Files in `graphics/finals/`, named by the hook's opening words: `<hook words> (<version>, Instagram, 9x16).mp4` and `(..., YouTube Shorts, 9x16)`. QA: exact frame count, voice in sync, true peak under -1 dBTP, no black, frozen or empty frames.

- **Covers (every episode, Victor 2026-11-07: "make thumbnail covers ... really grab attention, different one for each video, same style").** One Remotion still composition per episode (`src/ptp<NN>/cover/`, 1080x1920, 1 frame, props `{hook, body}`), rendered through the lock with `npx remotion still` to `graphics/covers/<hook words> (<v>, cover, 9x16).png` + `.jpg`, plus a 3x3 contact sheet and a grid-size sheet (270x480 cropped to the 3:4 centre, which is how the profile grid shows it). One cover per posted video, hook text by hook, hero by body, a kicker per pair. Same Paper Studio frame as the video (ground, grid, shadows down-right, one CRT pass, no word effects): a three-line hook block at the top (number line about 170 px in the heat map red `#D94A3D`, the key line white on a black highlight bar, Inter 900, tight leading), the video's own hero object huge in the middle with a slight lean and deep shadow, a grey kicker under it. Everything readable inside the centre 1080x1350 (y 285-1635; Instagram crops covers to 3:4 in the grid and 4:5 in the feed). Check every cover at 270 px wide. Instagram covers are set in the app after the reel publishes (Edit, Cover, choose from camera roll); YouTube Shorts take a frame unless you pick one in the mobile app at upload. Worked example: `episodes/ep08-github/dispatch/AGENT-COVERS.md` and `src/ptp08/covers/`; finished covers in `reference-videos/covers/`.
- Posting is your own stack. The originals shipped with a published guide page, a comment-keyword DM automation checked end to end before the first post, and one Instagram plus one YouTube Shorts upload per slot. Finish the guide and the automation before anything posts.

## Pipeline gotchas

- Renders strictly one at a time through the render lock (`/tmp/victor-remotion-render.lock` in the shipped scripts) (it can be a directory lock or a flocked plain file; handle both).
- Orphaned headless Chrome processes (parent pid 1) left by killed renders make the queue's busy check wait forever; the ep04 `_ptp-lib.sh` ignores them. Kill orphans if the queue stalls.
- One builder's broken import breaks every bundle; type-check before rendering stills.
- For page captures from agents, use headless Chrome from the shell.

## Hard rules

- Safe zone: readable things inside x 65-1015, y 269-1248 at every camera position. Grounds, swooshes and cut-out arms may bleed.
- Hook overlay band y 290-440: the end result the viewer gets, the same on every hook version.
- Official logos and real captures only; generated images are original (no brand marks). Never reuse the reference's footage, watermark or product.
- Only verified numbers on screen. No em or en dashes in any on-screen text. No follow ask.
