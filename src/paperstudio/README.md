# Paper Studio kit

Remotion components for the Paper Studio look (rules: `CREATORS/Styles/paper-studio/SKILL.md`; source of truth: the approved ep04 storyboard `Made By AI/ep04 jcode/storyboard/index.html`). Everything is frame-driven (`useCurrentFrame` + `interpolate` with bezier easing), no springs, no CSS animation. Coordinates are 1080x1920 reel pixels.

```tsx
import { theme, Ground, CrtPass, PaperCard, KineticCaption, words } from "../paperstudio";
```

Timing convention: every `at` / `enter.at` is a frame relative to the enclosing `<Sequence>`. Leave it undefined to draw the element already at rest. `enter` = `{ at, dur?=14, from?: "bottom"|"top"|"left"|"right"|"scale"|"fade", dist?=60, fade?=true }`, `exit` the same with `to`.

Assets live in `public/paperstudio/` and are exposed as `LOGO.Cursor`, `SHOT.claude`, `TERM.swarm`, `PHOTO.human` etc. (see `theme.ts`).

## Components

| Export | What | Key props |
|---|---|---|
| `theme` | colours, shadows, grid, caption sizes, safe zone `{x0:65,x1:1015,y0:269,y1:1248}`, hook band | |
| `EASE`, `prog(f,a,b,ease)`, `mix`, `mixColor`, `enterState`, `drift(f,amp,period,seed)` | motion helpers | |
| `Ground` | lit off-white + full-frame grid (135 px / 3 px) | `grid=true`, `swoosh`, `dark` (CTA ground), `swooshDrift`, `gridOpacity` |
| `CrtPass` | wrap the finished frame once: bloom on whites only, 1 px scanlines every 6 px at 3%, 8% grain, 12% vignette, r 34 corners. No fringe, no triad | `enabled`, `grain`, `bloom` |
| `PaperCard` | white card, r 14, 3/5 px edge, two-layer shadow, 0-3 sheets | `x y w h`, `sheets`, `tilt` (true = -6 deg), `tf`, `src` (capture, cover top), `scroll`, `enter`, `exit`, children |
| `TerminalCard` | capture in a white bezel with deep shadow | `x y w h`, `src` or `title` (jcode/worker/helper/boss/swarm), `tiltY`, `tiltX`, `tf`, `scroll`, `dim`, `enter`, `exit` |
| `TerminalStrip` | wide strip of captures panning right to left inside one frame; pills ride above panes and pop as they arrive | `x y w h`, `panes: {src,label?}[]`, `speed` px/frame, `panStart`, `paneW`, `gap` |
| `LogoChip` | physical logo button (rim 11% of the diameter) + lowercase label; overshoot-free pop | `cx cy name`, `r=44`, `label` (string/false), `at`, `dark`, `grey` |
| `LogoChipLine` | chips popping onto a thin black line with a cast shadow | `y`, `chips: {name,x,at}[]`, `lineAt`, `x0`, `x1` |
| `LogoDisc`, `InlineChip` | the bare button; inline version for captions/rows | `name`, `r` |
| `Cutout` | hand photo floating with the skill's shadow stack; slides in from an edge | `kind` human/robot or `src`, `x y w h`, `from`, `at`, `dur`, `drift` |
| `HandsScene` | both hands in the reference layout + the 7 px bracket drawing node to node | `at`, `bracketAt` (null = none), `dy`, `drift` |
| `WirePath` | solid line drawing on via dash offset, optional arrowhead riding the tip | `d`, `w=7` (secondary 4), `at`, `dur`, `p`, `arrow` |
| `WireNode` | hollow node r 15 / 6 px ring, pops | `cx cy`, `r`, `ring`, `at` |
| `DashedArrow` | 14/12 dashed flow arrow drawing on, filled head | `d`, `at`, `dur`, `w=4` |
| `KineticCaption` | (2026-10-31) each word eases in over 10 frames with one soft ease-out (opacity, 7 px rise, 6 px blur to 0, grey to black); a word takes its full slot at once (fast words never overlap) and only the line glides: re-centring and new lines ease over 8 frames | `lines: CapWord[][]`, `y`, `x=100`, `w=880`, `align`, `anchor` ("bottom" grows upward), `scale` (draw size, x/y/w stay frame px; use instead of a CSS scale wrapper), `settle`, `rise`, `blur`, `reflow`, `exit` |
| `words(text, at, step, style)`, `phrase(t, at, s)` | build `CapWord`s; `CapWord = {t, s?: reg/bi/bold/big/huge/bar, at, w?}` (`w` for node tokens such as `<InlineChip/>`) | |
| `IconList` | the four black icons, one row per beat | `x y`, `rows: {icon,text,at}[]`, `rowH=80`, `scroll` |
| `SparkleList` | sparkle star pops, words land like captions | `x y`, `rows: CapWord[][]` |
| `StatRow` | counter ticks to the value, bold label, chip at the end | `y`, `value`, `suffix`, `label`, `chip`, `at`, `countDur` |
| `RaceBars` | bars fill to their value, the number lands bold | `y`, `rows: {name,valueText,fill,trackW,at,dur}[]`, `result` |
| `ShatterOverlay` | seeded crack web drawing outward over ~10 frames, clipped to the card | `x y w h`, `ox oy`, `seed`, `at`, `dur` |
| `BlurBreak` | whole-frame blur + grey vignette (wrap the content) | `at`, `dur=8`, `max=16`, `mode` inout/in/out |
| `IconObject` | glossy 3D object (harness icon) on a contact shadow, pops | `cx cy`, `s`, `src`, `at`, `float` |
| `GuideMock` | guide page mock on a wide contact shadow | `x y w h`, `rot`, `enter` |
| `Pill` | boss / worker / main.rs pill (x is the centre) | `x y text`, `light`, `mono`, `at` |
| `HookOverlay` | the shared hook overlay in band y 290-440 | `text` |

## Camera (2026-10-31)

`Camera.tsx`: one world under a virtual camera (Liam cinematic-camera rig + the fish8 "very clean" rules). Full guide and the ep04 per-shot plan: `skills/paper-studio/references/camera-guide-ep04.md` (originally ep04 jcode/dispatch/CAMERA-GUIDE.md).

```tsx
const keys = camPath({ f: 0 })                         // identity
  .push(S05.start, 0.03)                               // slow drift-in during the hold
  .to(beatsAt - 2, zoomAt({ x: 540, y: 600 }, 1.18, "hook"), 16)   // push in on the crack, crack stays put
  .to(S07.start, { x: 540, y: 854, zoom: 1 }, 18)      // pull back
  .keys;
<Camera box="hook" keys={keys} follow={[{ from, to, target: (fr) => cardCentre(fr), lag: 4 }]} hud={<KineticCaption scale={1.4} ... />}>
  {/* world content in reel px */}
</Camera>
```

| Export | What |
|---|---|
| `Camera` | `keys`, `follow`, `box` ("body" safe box / "hook" under the band; sets the anchor), `ground` (paper + grid, grid parallax 0.15, never scales; `false` if the beat draws its own), `hud` (screen space), `blur` (adaptive camera motion blur on fast moves, samples world time too so tracked things stay sharp; `false` = off), `breathe`, `showSafe` |
| `camPath(start)` | key builder: `.push(until, amount)`, `.to(at, pose, dur=18, ease)`, `.hold(until)`, `.cut(at, pose)`, `.keys` |
| `zoomAt(p, zoom, box)` | pose that zooms about world point p, keeping p fixed on screen |
| `frameRect(rect, {box, margin, max})` | pose that frames a world rect inside a box |
| `useCamera()` | `{ pose, anchor, toScreen, toWorld }` inside a Camera |
| `camAt`, `camAtKeys`, `camSpeed`, `camTransform`, `toScreen`, `toWorld`, `CAM_BOX`, `pushIn` | pure helpers |

`EASE` gained `cam` (moves), `drift` (push-ins), `soft` (caption words); `theme.caption` gained `reflow`, `rise`, `blur` and `settle` went 7 -> 10.

## Demo, type-check, stills

- Demo composition `PaperStudioDemo` (440 frames, 1080x1920, 30 fps) in `entry.tsx` / `Demo.tsx`; frames 280-439 are the camera section (push-in, zoom to a detail, tracking follow, pull-back, new captions in the HUD).
- `npx tsc --noEmit -p src/paperstudio/tsconfig.json`
- `zsh src/paperstudio/demo-stills.sh demo 30 70 107` (takes an flock on `/tmp/victor-remotion-render.lock`, waits for other renders and 20% free memory, bundles once, concurrency 1) writes `src/paperstudio/stills/demo-f<frame>.png`.

## ep05 additions (2026-10-31)

New files only (`kit05.ts`, `Hero.tsx`, `Captions05.tsx`, `Army.tsx`, `Device.tsx`, `UiBits.tsx`, `Demo05.tsx`); no existing export changed. Built from the ep05 reference (InsiderForce "Everything Claude Code", `Made By AI/ep05 ecc/reference/BREAKDOWN.md`, the NEW techniques). Same rules: frame-driven, bezier easing, no springs, no CSS animation, reel px.

| Export | What | Key props |
|---|---|---|
| `PHOTO05`, `ROBOT_ASPECT` | the Paper Studio robot cut-out (`public/paperstudio/photos/robot.png`, 1134x1574) | |
| `CONDENSED`, `reveal(f, at, opts)`, `keyed(keys, f, get)`, `ghCount(n)` | Roboto Condensed face; the house grey-to-black word reveal as a style; eased key path; GitHub compact count (21.3k, 294k) | |
| `RimImage` | cut-out with a white sticker rim traced around its alpha (SVG dilate) + the float shadow stack (shadow on an untransformed wrapper, so rotate the parent and light stays top-left) | `src w h`, `rim` px, `grayscale`, `shadow` (CSS filter or false), `fit` |
| `PortraitCutout` | B&W person cut-out with the white rim and the skill's shadow stack; slides in from an edge without fading (may bleed off the edge and bottom), then a slow push and a small drift | `src x y w h`, `from` left/right/top/bottom, `at`, `dur=18`, `dist=760`, `grayscale=true`, `rim=10`, `push=0.025` (scale per 100 f), `drift=3`, `exit {at,dur,to,dist}` |
| `BrandBurst` | an official mark (default the Claude spark) as a big physical object: darker thickness edge, soft shadow down-right that does not turn, slow spin; swings along an eased path from off frame and slides off | `cx cy size`, `rot`, `spin` deg/frame (0.35), `path: {f,x,y,s?}[]`, `at` (pop), `edge=6`, `shadow` |
| `StackedCaps` | bold condensed upright caps, one word per line, each line landing on its frame grey to black (rise + blur clear); optional small kicker ("This") | `lines: {t,at,size?}[]`, `x y w`, `align`, `size=124`, `lead=0.94`, `kicker {t,at,size?}`, `font` (CONDENSED), `squeeze`, `exit` |
| `SideCaption` | small multi-line block typing in word by word beside an object; fixed layout (nothing shifts); a line can be bold or a black bar | `x y w`, `align`, `lines: {t,at,step=3,s: reg/bold/bar}[]`, `size=46`, `boldSize` |
| `UiCounter` | a number ticking inside a real UI capture: crop scaled to the box, the captured number covered by a patch in the capture's colour, counter drawn in the UI's type ("294k"), soft highlight + small swell on landing. Put it inside a `PaperCard`/`TerminalCard` face | `src srcW srcH`, `crop {x,y,w,h}` and `num {x,y,w,h}` in capture px, `w h` (face), `from to at dur=26`, `format` (ghCount), `fontSize` (capture px), `color`, `weight`, `bg`, `pulse`, `pan` |
| `ChatBubble`, `ChatStack`, `bubbleHeight(fs)` | black rounded bubble, white Inter 700, tail at the bottom corner, popping out of a source point on a short arc (scale 0.2 to 1 from the tail corner); the stack pushes older bubbles up as each new one lands | Bubble: `text x y ox oy at`, `dur=12`, `arc=70`, `tail`, `fs=40`, `dy`. Stack: `x y ox oy`, `bubbles: {text,at,tail?,dx?}[]`, `gap=26`, `fs` |
| `SpriteGrid` | the army fill: one sprite per beat into an n x m grid (row order or seeded shuffle), pops with no overshoot, `big` ones pop to 1.38 and ease back; own small shadow + seeded bob; optional counter label (mapped to `to`, e.g. 16 sprites count to 71) | `cols rows x y w h`, `src` (robot), `size=0.86`, `starts[]` or `at + rate`, `order`, `big[]`, `bigScale`, `counter {x,y,to,suffix,size,align}` |
| `LineTrack` | a long thin black line with items spaced along it (sprite + role card "one for / **role**"); the content whips sideways item to item on the camera curve with light horizontal motion blur scaled by speed, sprites lean into the move, one hold per item | `items: {src?,kicker?,role}[]`, `holds[]` (whip to item i runs from holds[i]), `whip=10`, `spacing=1080`, `y=760`, `blurMax=12`, `lineAt`, `spriteH=420`, `card=true`, `labelDelay=3` |
| `DeviceFrame`, `deviceHeight(w)` | phone mock (black bezel, rounded screen, dynamic island). Children are a full 1080x1920 frame (no Ground): they render full size, then scale down into the screen while the bezel, screen white, notch and phone shadow fade in | `x y w` (final outer phone), `at`, `dur=20`, `bezel`, `radius`, `screenBg`, `notch` |
| `Toggle` | iOS-style switch on the paper: knob slides, track fills (ink black by default) | `x y`, `w=120`, `at` (flip; null = stays off), `dur=10`, `color`, `appear`, `label` |
| `CommitStrip`, `Commit` | strip of small commit cards (mono short hash, message, avatar dot) scrolling right to left; `fold` flies every card (staggered, on an arc) into a target point, shrinking and fading | `y`, `commits: {hash,msg,tone?}[]`, `cardW=340 cardH=128 gap=26`, `speed=6`, `x0`, `at`, `fold {at,x,y,dur=14,stagger=2,scale=0.25,arc=140}`, `tilt` |
| `PageTurn` | the CTA guide with a 3D page turn: white cover, teal spine, bold title, sheets for thickness, lying on the paper with a lean; a page lifts from the right edge and turns left around the spine with shading and a moving cast shadow; the guide slides right by half its width so the open spread stays centred | `x y w h`, `at`, `dur=24`, `turns=1`, `stagger=8`, `title`, `coverSrc`, `spine`, `leanX=24 leanZ=-8`, `recenter=true`, `enter` |

Demo composition `PaperStudioDemo05` (347 frames, 1080x1920, 30 fps; `Demo05.tsx`, registered next to `PaperStudioDemo` in `entry.tsx`): hook (portrait + burst + caps + side caption) 0, stars counter 45, burst + chat stack 81, army fill 119, line track 155, logo grid + toggles into the phone 215, commits folding into SKILL.md 267, page turn CTA 305. The portrait slot uses the robot in B&W until the ep05 portrait lands.

Stills: `zsh src/paperstudio/demo05-stills.sh demo05 30 73 103` (takes the shared lock `/tmp/victor-remotion-render.lock` whether it is a flocked file or a mkdir directory, waits for other renders and 20% free memory, bundles once, concurrency 1) writes `src/paperstudio/stills/demo05-f<frame>.png`.

## ep06 additions (2026-11-02)

New files only (`kit06.ts`, `Graph.tsx`, `Plans.tsx`, `Snip.tsx`, `Tokens.tsx`, `Streets.tsx`, `ScreenInset.tsx`, `Demo06.tsx`, `demo06-stills.sh`); no existing export changed. Built for ep06 Graphify (storyboard `Made By AI/ep06 graphify/storyboard/`). Same rules: frame-driven, bezier easing, no springs, no CSS animation, reel px, one light top-left.

Assets: the ep06 cut-outs live in `public/paperstudio/photos/` (`token.png`, `token-pile.png`, `scissors.png`, `map-folded.png`, `laptop.png`, `robot-dig.png`, `robot-map.png`), the README graph capture in `shots/graph-hero.png`, and `logos/graphify-mark.svg`, `logos/obsidian.svg`. `asset06(key)` returns a file's URL only when it is in the bundle (Remotion's public file list), so components draw their built-in fallback instead of failing when a file is missing. `META06` holds the measured geometry of the cut-outs (scissors pivot and blade axis, laptop screen corners).

| Export | What | Key props |
|---|---|---|
| `asset06(key)`, `PHOTO06`, `META06`, `hasStatic(path)` | ep06 asset URLs with a presence check; cut-out geometry (`META06.scissors {aspect,pivot,axis,open}`, `META06.laptop {aspect,quad}`, `META06.mapFolded {aspect,panels,angle}`) | keys: token, tokenPile, scissors, mapFolded, laptop, robotDig, robotMap, robot, graph, logoGraphify, logoObsidian |
| `rng(seed)`, `hash01(seed,i,k)`, `polyLen`, `polyAt`, `polyUpTo`, `polyD`, `quadMatrix3d(W,H,quad)`, `clipHalf`, `centroid` | deterministic randomness, polyline walking, the quad homography as a CSS matrix3d | |
| `KnowledgeGraph` | nodes and edges drawn node to node in the wire style (black 7 px, hollow nodes r 15 / 6 px ring, raised-wire shadow); a lit path (11 px, filled r 18 nodes, the rest dims); a re-pop ripple ("rebuilds on commit"); optional dark-faced card over the real README graph; on a dark face the wire gets a thin white casing so the black ink still reads | `x y w h`, `nodes`/`edges` (ids, 0..1 coords) or `seed`+`count` (`graphFromSeed`, BFS order so it grows outward) or the storyboard graph `GRAPH_DEFAULT` (n0..n13), `at`, `rate=3` (frames between edges), `edgeDur=6`, `draw` (edge count), `highlightPath` (ids), `highlightAt`, `highlightRate=7`, `dimOthers=0.4`, `pulseAt` (frame or frames), `pulseFrom`, `pulseSpread=12`, `card` (true or `{src, zoom, dim=0.38, saturate=0.7, objectPosition, sheets}`), `casing`, `breathe`, `enter`, `exit`, `tf` |
| `graphWalk(g, from, n, seed)` | a quick connected path of node ids for `highlightPath` | |
| `UsageMeter` | plan usage card: label, thin inset track, black bar filling from/to (or along `keys` for pulses), "limit reached" pill that pops at 100% (the bar shivers 2 px), drain back down (pill pops off), optional black stop bar | `x y w h=150`, `label="plan usage"`, `labelSize` (default max(34, 24% of h)), `from=0.2 to=1 at dur=24` or `keys: {f,v}[]`, `limit` (true = at 100%, or a frame), `limitText`, `drain {at,to=0.12,dur=12}`, `stop {at}`, `shiver`, `card=true`, `sheets`, `barH`, `enter`, `exit` |
| `PlanCard` | pricing card on paper with thickness and sheets: plan name, big price + "/ month", subline, logo chip slot, usage meter slot; price strike and swell | `x y w h`, `name`, `price`, `per`, `sub`, `chip {name,src?,r?,at?,pos:"inline"|"corner"}`, `usage` (UsageMeter fill props), `strike {at,dur}`, `emph {at,dur,scale=1.1}`, `sheets=1`, `tilt`, `enter`, `exit`, children |
| `ReportedStat` | big counter ("49x", "71.5x") counting up and holding, or landing with no in-between values (`land="pop"`); small black "reported" pill above or below; the block keeps the final width from frame one so the "x" never moves; grey start value before the count; 1.06 pulse on landing | `x` (centre) `y` (top), `value`, `from=0`, `decimals`, `prefix`, `suffix="x"`, `at`, `dur=28`, `land`, `size=150`, `suffixScale=0.62`, `pill="reported"`, `pillAt`, `pillSide`, `pillSize=36`, `pulse`, `ghost`, `exit` |
| `SnipCut` | wraps a card drawn in reel px: the scissors cut-out travels along the cut line (enters from off frame, snips, blades close at the end), a slit follows; then the two halves (clip-path half-planes) push apart, tilt and drop off the bottom, each casting its own lifting shadow | `rect {x,y,w,h}` (the card's bounds), `at` (scissors reach the line), `cutDur=14`, `line {x1,y1,x2,y2}` (start to end; default right to left through the middle) or `angle=-4`, `scissors {src, w=380, snips=3, enterAt (they slide in then wait open at the line until at), enterDur=8, exitDur=10, enterDist=760}` or false, `separate {at, dur=28, gap=26, tilt=[-9,12] (upper, lower), drop=1300, stagger=3 (frames the upper half waits after the lower one drops)}`, `edge=true` (paper edge along each cut), children |
| `Scissors` | the scissors alone with a live `opening` angle: a photo is split into two bow-tie pieces through the screw (blade + opposite handle) that turn in opposite directions so the blades really close; built-in drawn steel scissors without a photo | `src`, `w`, `opening` (deg), `aspect`, `pivot`, `axis`, `open` |
| `Token` | one gold token in 2D: the face squashed by cos(tilt) with its rim (darker copy) below; centre-anchored | `src`, `size`, `tilt` (0 face-on, 70 lying), `rot`, `thick`, `shade` |
| `TokenStack` | a vertical stack from one token cut-out: coins drop on one by one (accelerating, no bounce), seeded jitter, contact shadow; `grow` keeps it rising off the top edge; optional label under it | `x` (centre) `y` (paper), `src`, `size=150`, `count=12` or `grow`, `at`, `rate=2` (frames per coin, fractions ok), `fall=170`, `fallDur=7`, `thick` (default 9% of size), `tilt=70` (R2 storyboard's chunkier coins: `tilt={56} thick={0.19 * size}`), `seed`, `label`, `labelAt`, `exit` |
| `TokenSpill` | coins tumbling out of a source point along ballistic arcs: `pile` aims each coin at its own slot in a heap (lands lying flat, later coins on top); `drain` pours them down and off the frame; `shrink` empties the heap top first. Put it behind the source card in z so coins come out from under its edge | `ox oy ow`, `count=24`, `at`, `rate=1.5`, `mode`, `pile {x,y,w,h}`, `flight=[12,20]`, `dir=90 spread=50 speed=[5,12]`, `gravity=1.6`, `src`, `size=96`, `seed`, `shrink {at,dur,stagger}` |
| `TokenHeap` | a still heap (pile mode, already landed) | `pile`, `count`, `src`, `size`, `seed` |
| `StreetMap` | a drawn paper street map (no card): white lanes with kerbs, blocks with building footprints, a park, one avenue each way, an optional river; optional thick black route with hollow end nodes, small corner nodes popping as the tip passes, A/B tags. `palette="atlas"` uses the muted colours of `map-folded.png` (blue river, green parks, soft orange avenues) | `w h`, `cols=5 rows=7`, `seed`, `route` (grid points), `routeP` 0..1, `routeW=11`, `routeBump`, `ends`, `palette`, `river`, children (overlays in map px) |
| `StreetWalker` | a street-grid card; `walk`: the robot sprite walks every street (boustrophedon) at a steady pace with a step bob, facing its direction, leaving a grey dotted trail; `route`: one thick black route A to B draws on with corner nodes | `x y w h`, `mode`, `at dur from to` or `keys {f,p}[]` (walk progress), `sprite` (default robot), `spriteH=130`, `route=ROUTE_DEFAULT`, `routePulseAt`, `ends`, `palette`, `card`, `sheets`, `enter`, `exit` |
| `MapUnfold` | a folded paper map (concertina panels, nested 3D hinges) opening panel by panel with shading on the folds (panels turned away from the top-left light darken) and faint creases left in the paper, revealing children at full size, re-centring as it opens; can start from the `map-folded.png` cut-out cross-fading into the panels | `x y w h` (open map), `panels=4`, `at`, `dur=14`, `stagger=6`, `startAngle=172`, `zigzag` (concertina held part open: use `panels={6} startAngle={62} zigzag` to match `map-folded.png`), `folded {src,x,y,w,h,aspect}` (the panels fade up under the photo, then the photo fades off them), `xfade=8`, `lean=8`, `perspective`, `shadow`, `enter`, `exit`, children (e.g. `<StreetMap w h .../>`) |
| `ScreenInset` | composites children onto the screen of a photo cut-out (the laptop) with a matrix3d homography from four corner points, a drifting glass sheen and an inner screen edge; screen power-on; built-in drawn laptop without a photo | `x y w` (`h` from the aspect), `src` (default `asset06("laptop")` geometry in `META06.laptop`), `quad` (TL TR BR BL, fractions), `contentW=1600 contentH=1000`, `screenBg`, `sheen`, `sheenStrength=0.12`, `on {at,dur}`, `shadow`, `enter`, `exit`, children |
| `screenQuad(x,y,w,h,quad)` | the screen corners in reel px (to anchor a ring or a wire to the screen) | |

Demo composition `PaperStudioDemo06` (386 frames, 12.9 s, 1080x1920, 30 fps; `Demo06.tsx`, registered in `entry.tsx`): snip 0, meter + token heap 44, plan card leak 88, knowledge graph 120, token stacks 174, reported stats 214, map unfold 258, route + walker 306, laptop screen 346.

Stills: `zsh src/paperstudio/demo06-stills.sh demo06 19 62 158` (the shared lock `/tmp/victor-remotion-render.lock`, flocked file or mkdir directory; waits for other renders and 20% free memory; one bundle, concurrency 1) writes `src/paperstudio/stills/demo06-f<frame>.png`.

## Voxel world (ep09, 2026-11-08)

New folder `voxel/` + `VoxelDemo.tsx` only; no existing export changed and `index.ts` does not re-export it (import from `../paperstudio/voxel`, or `../../paperstudio/voxel` from a beat). A Minecraft-look world for full-screen reels, ported 1:1 from the ep09 storyboard page's three.js module (`Made By AI/ep09 minecraft/storyboard/index.html`): procedural 16 px textures (original pixels, no Mojang assets), InstancedMesh blocks, the 32 x 32 island, oak trees and stumps, cobble huts with doors and wall torches, the interior room, Steve-proportion agents with generated skins, zombies, sky / fog / sun / moon / stars / clouds, the replay-mod camera with the lens shift. A page spec renders the page's picture (frame 0 of the demo vs the page's H1.1 world: PSNR 42 dB). WebGL: every render needs `--gl=angle` (remotion.config.ts already sets it; pass it anyway). About 0.06 s per 1080x1920 frame on this Mac.

```tsx
import { VoxelWorld, SPAWN, SHELTERS, C, dayWorld, nightWorld, interior, camWide, camKeys, driftCam, crowdAgents, type WorldSpec } from "../../paperstudio/voxel";
```

Spec (`WorldSpec`, the page's `mc(spec)` shape; everything optional except `cam`; all animation inputs default to the page's still frame):

| Key | What |
|---|---|
| `terrain` | `"island"` (default) / `"interior"` / `"none"` (sky only) |
| `time` | `"day" "dawn" "dusk" "night"`, or a number 0..1 along day 0, dusk 1/3, night 2/3, dawn 1 (darken over 10 frames: `interpolate(f, [a, a + 10], [0, 2 / 3])`), or `{ from, to, t }`. Fog, stars, cloud opacity and torch light follow the night weight; the sun sets and the moon rises with the blend |
| `trees`, `treeSeed` (3), `stumps` | the page's seeded tree ring; the first `stumps` trees are stumps (counting `stumps` up re-rolls later trees: animate felling with `fell`) |
| `fell: [i]` | trees cut to stumps without touching the others |
| `fallingTree: [{ i or near: [x, z], progress, dir? }]` | trunk tips over around the stump (0-0.7), canopy blocks drop off and land with block-break particles, the trunk breaks up (0.72-0.86), the stump stays. `near` picks the nearest standing tree. Afterwards list it in `fell`. (`falling: [{ i, t }]` is the same thing) |
| `shelters: [{ x, z, door? }]` | 4 x 4 cobble huts, plank roof, door, wall torch (lit at night). `door` (alias `open`) 0 closed .. 1 open, hinged on the frame side, swings outward |
| `frames`, `farm { x, z, w, d, wheat, sway? }`, `grassTufts`, `sway` | half-built log frames, farmland + wheat, tall grass; `sway` = frame / 30 for about 2 px of sway |
| `blocks: [{ k, x, y, z, appear? }]` | extra blocks; with `appear` 0..1 a block grows from its bottom face (a wall rising row by row) |
| `torches: [[x, yOff, z]]`, `chests`, `crafting`, `furnace` | props; torches get a warm point light at night / indoors; `flicker: f` = +-3% |
| `crowd { n, cx, cz, r, seed, faceTo?, tool? }`, `faceCenter` | the seeded crowd; `crowdAgents(spec)` returns the same agents as a list to animate one by one |
| `agents: AgentSpec[]` | `{ x, z, y?, skin 0..7, grey, zombie, yaw, swing, raise (bool or 0..1), sit, lie (bool or 0..1), ghost, tool, hold, walkPhase, walkAmp, yOffset, scale, opacity, headYaw, headTilt }`; per-frame positions cost transforms only |
| `mobs: [[x, z]]`, `lying { n, cx, cz, cols, dx, dz, fall?, opacity? }` | zombies facing the centre; the grid of grey dead agents (`n` can grow per frame, `fall` drops the newest) |
| `items: [{ kind, x, y, z, big?, rotY?, rotZ?, scale?, opacity?, glow? }]` | chicken / axe / pick / sword sprites (`glow` = unlit so the chicken reads at night) |
| `puffs: [{ x, y, z, t, kind: dust / break / spawn, n?, seed?, color?, size?, spread? }]` | particles: landing dust, block bits, the white respawn column |
| `cam { target, dist 24, yaw 0, pitch 42, shift -270, fov 84 }` | replay camera (interiors shift -160) |
| `cloudDrift`, `sunArc`, `moonArc`, `moonAt` | clouds along +x in blocks; sun / moon along the east-west arc; the moon at a world point (the page's moon is above every default-pitch frame: `moonAt: skyPointAt(cam, 860, 380)`) |

Camera helpers: `camKeys(f, [{ f, cam }])` (hold, move, hold on `EASE.cam`), `lerpCam(a, b, t)` (orbit = yaw the short way, push = dist geometric, tilt = pitch, follow = target), `driftCam(cam, f, from, to, { push, orbit, tilt })`, `orbitCam`, `pushCam`, `tiltCam`, `followCam`, `projectToScreen(worldPos, cam)` (reel px, for hud wires and tags), `skyPointAt(cam, x, y)`, `discWorldPos(spec, "moon")`, `doorPos(shelter)`. `<VoxelWorld spec resolution? children? />`: `resolution={0.6667}` renders 720x1280 and scales (the page's size); `children` adds your own three.js objects (`<Agent>`, `<Door>`, `<Puff>`, meshes) to the scene.

```tsx
// 1. a static shot: the H1.1 world, holding with a slow orbit and push
const f = useCurrentFrame();
<VoxelWorld spec={{ ...SPAWN, cloudDrift: f * 0.02, cam: driftCam(SPAWN.cam, f, 0, 60, { orbit: 6, push: 0.04 }) }} />

// 2. a camera move between holds: hold the wide, push in on the farm over 18 frames, hold (drifting)
const A = camWide(18, 24), B = { target: [C, 3.3, C] as [number, number, number], dist: 9, yaw: 25, pitch: 48, shift: -220, fov: 72 };
const cam = driftCam(camKeys(f, [{ f: 0, cam: A }, { f: 20, cam: A }, { f: 38, cam: B }]), f, 38, 90, { push: 0.03 });
<VoxelWorld spec={nightWorld({ trees: 12, stumps: 12, farm: { x: C - 1, z: C - 1, w: 3, d: 3, wheat: [[C, C]] }, flicker: f, sway: f / 30, cam })} />

// 3. agents dropping in and walking, a tree falling: crowd as a list, one cluster per word, then tree 4 falls
const p = (a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.travel });
const base = dayWorld({ trees: 22, stumps: 7, crowd: { n: 14, cx: C, cz: C + 2, r: 5, seed: 21, tool: true } });
const agents = crowdAgents(base).map((a, i) => {
  const land = p(4 + i * 2, 16 + i * 2);                       // drop from 14 blocks up, eased
  const walk = p(30, 60);                                      // then everyone walks 2 blocks toward +x
  const yaw0 = a.yaw ?? 0;                                      // turn to face +x (90) over 8 frames, legs ease in and out
  return { ...a, x: a.x + 2 * walk, yaw: yaw0 + (90 - yaw0) * p(24, 32), yOffset: 14 * (1 - land), walkPhase: f * 0.07, walkAmp: 1.4 * Math.min(p(28, 32), 1 - p(58, 62)) };
});
const puffs = agents.map((a, i) => ({ kind: "dust" as const, x: a.x, y: 3, z: a.z, t: (f - (16 + i * 2)) / 12, seed: i }));
<VoxelWorld spec={{ ...base, crowd: undefined, agents, puffs, fallingTree: [{ i: 9, progress: p(40, 70) }], cam: camWide(-12, 22) }} />
```

Demo `VoxelDemo` (180 frames, 1080x1920, 30 fps; `VoxelDemo.tsx`, registered in `entry.tsx`): 0-59 SPAWN (orbit + push, tree 0 falls 14-44, day to night 50-60), 60-119 the night huts (torches lit, an agent walks into hut 0, the door shuts), 120-179 the interior (chicken in flight, agent 2 turns and steps). `VoxelSpecTest` (60 frames) renders any spec from props (`{ "spec": <storyboard specs/ID.json>, "anim": true }`). Renders: `zsh src/paperstudio/voxel/voxel-render.sh stills <name> <frames...>` / `preview <name> [from-to]` / `bench <from-to>` (shared lock, `--gl=angle`, the public symlink mirror), `COMP=VoxelSpecTest PROPS='{...}'` for the test comp.
