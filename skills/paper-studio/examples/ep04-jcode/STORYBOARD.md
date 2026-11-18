# JCode explainer storyboard (Paper Studio)

Written 2026-10-30 by the DESIGN agent (Fable 5.1). Companion to `index.html` in this folder; the two are generated from one data block, so the numbers match.

- 30 fps, 1080x1920. Main version (H1 hook + body): **2040 frames, 68.0 s, 62 shots** (58 spoken, 3 blur breaks, 1 tail hold). No shot over 45 frames.
- Frame ranges are provisional at 3.8 words per second (about 7.9 frames per word); the real voice moves them. Keep the shot order and the splits, retime the ranges from the word timings.
- Shot ids are sequential (S01-S62). "Plan" is the beat number in PLAN.md. PLAN S06 (the GitHub card) is storyboard **S08**; every hook version hands off into S08.
- Safe zone: captions, cards, logos and readable elements inside x 65-1015, y 269-1248; working box x 100-980, y 300-1190. Backgrounds and swoosh ribbons may bleed.
- Captions: centred, connector words Inter 400 at 40 px, key phrase Inter 800 italic at 64 px, bold upright at 56 px, black bar Inter 700 at 44 px white on #111, big punch words at 96 px, the CTA keyword at 128 px. Each word enters light grey (#B5B5B5), 5 px low and 7 px right with a touch of blur, and settles black over about 7 frames. Lines re-centre as they land. Nothing readable under 34 px.
- Ground: radial off-white #FAFAFA to #F3F3F3 with a soft #E4E4E4 vignette. Dot grid and grey swoosh ribbons only in the stats section (S23-S29). The CTA ground (S58-S62) is a slightly darker #EDEDED to #E2E2E2.
- Light: one source, top left. Every shadow falls down-right; the ground carries a soft top-left highlight and a 7% vignette toward the edges.
- Paper cards: white, radius 12, real thickness (hard 3 px #DCDCDC and 5 px #CFCFCF edges down-right), two-layer soft shadow (18/28/50 rgba 0 0 0 .18 and 48/70/120 rgba 0 0 0 .10), 0-2 sheets behind stepping +30/+10 px right, each with its own edge and shadow. Hero cards (pricing stack, $0 card, RAM card, stopwatch cards) lean 6 deg in perspective (rotateY -6). Page captures sit inside the card face, top-aligned, cover fit.
- Logo chips: physical buttons. White disc, rim about 11% of the diameter, the official logo on an inner white disc with a faint inner highlight, soft shadow down-right (r 44 default, inline chips r 26-32). Label under the chip in Inter 400, 36 px, lowercase. Grey treatment (S18-S19) is the logo desaturated and inverted on a grey slab with a hard edge.
- Terminal cards: a real JCode capture inside a white bezel (about 14 px at reel scale, radius ~19 outside / 5 inside) with a deep two-layer shadow (14/24/40 rgba 0 0 0 .24 and 40/60/110 rgba 0 0 0 .16), 3D tilt where the shot calls for it.
- Lines and nodes: 4 px black, hollow nodes r 13, dashed arrows 14/12 with filled heads; the whole diagram casts a soft shadow (8/12/6 rgba 0 0 0 .16 plus 3/5/2 .08) so it reads as raised wire. Motion hints (grey dashed) stay flat.
- Ground grid (Victor, round 2, after the ep03 app audit look): solid lines over the whole frame on every shot, 135 px cells (8 across), 3 px lines at rgba(78,74,72,0.30), on a lit off-white ground with a white hotspot at centre. Fewer and thicker lines than ep03 (90 px, 2.4 px).
- CRT pass (Victor, round 2): one subtle layer applied once over the whole finished 1080x1920 frame, never per element. fine neutral 1 px scanlines every 6 px at 3%; NO colour fringe and no RGB triad (Victor: no blue on the edges); a soft bloom on whites (highlights above about 67% blurred 9 px, mixed at 45%, masked by the source so black ink and captions keep their contrast); fractal grain at 8% soft-light; an extra 12% vignette; screen corners rounded at r 34 on #111. No curvature, no colour tint, no flicker, no refresh band. The storyboard has a CRT on/off toggle next to the safe-zone toggle, default on.
- Photo cut-outs (hands): photoreal, matching the reference cut-outs. They float a little above the paper: the silhouette falls down-right as a wide soft shadow (34/52/30 at 24%) plus a contact shadow (10/14/8 at 14%), with a hairline white edge. No blob shadow underneath. The harness icon and guide mock keep a contact shadow.
- SFX cue names: whoosh-soft, pop, glass-crack, swipe, blur-swell, tick, riser. One or two per shot outside the hook.
- Assets (round 2): the frames load real files from `storyboard/assets/` and fall back to a drawn stand-in with a red "fallback" badge when a file is missing; the note at the top of `index.html` lists the missing files. Paths: logos `assets/logos/{cursor,codex,claude,chatgpt,github,rust,jcode}.svg`; page captures `assets/shots/{cursor-pricing,chatgpt-pricing,claude-pricing,github-jcode,jcode-bench}.png`; terminal captures `assets/jcode/{resume-menu,swarm,file-edit,info-widgets,demo-1..4}.png` (default by card title: jcode = demo-1, worker = demo-2, helper = demo-4, boss and swarm = swarm; a shot can name its own with `img`); cut-outs `assets/photos/{hand-human,hand-robot,harness-icon,guide-mock}.png`. Still drawn, no asset needed: the AI chip (H5), the $0 chip (H6), stopwatch faces, RAM bars, the memory notes card, the four black icons, sparkles, the crack web.
- Only these numbers appear anywhere: 20x, 63x, 14 ms, 883 ms, 10.4 MB, 212.7 MB, $0, MIT, $20 (Cursor card), From $100 (Claude card). The Codex card reads "ChatGPT plan" with no price.

## Shared hook overlay

Every hook version (H1-H6) keeps the band y 290-440 clear and draws the same overlay there: "How to get a faster coding agent for free", Inter 800, 56 px, two lines, centred, #111. Body shots carry no overlay.

## Hook versions

Each hook is its own world and replaces S01-S07. The body (S08 onward) starts at the hook's last frame + 1, so the main-version frame numbers below shift by (hook length - 263) for H2-H6.

| Hook | Line | Length (frames) | Body starts at |
|---|---|---|---|
| H1 | Cursor has a price tag. Codex has a price tag. Claude Code has a price tag. One developer built something that beats all of them and made it free and open source. | 263 | f 263 |
| H2 | Codex takes almost a full second to load. This free coding agent shows up in fourteen milliseconds. | 136 | f 136 |
| H3 | This free coding agent runs on twenty times less memory than Claude Code. | 107 | f 107 |
| H4 | Every coding agent you pay for has a hidden layer, and one developer just rebuilt it from scratch for free. | 160 | f 160 |
| H5 | The same AI can get better or worse at coding depending on one part most people never think about. | 158 | f 158 |
| H6 | One AI agent can now bring in its own team of coders, and the tool behind it costs nothing. | 162 | f 162 |

### H2: Speed proof

**H2.1** · f 0-23 (24) · "Codex takes almost"
- Motion: Two stopwatch cards rise from y +60 into place (Codex left, JCode right); the Codex hand starts sweeping. Secondary: Codex chip pops on the left card. Ambient: both cards drift 3 px.
- Caption: "Codex takes almost" regular 40, last word grey.
- Placement: Codex card x 110-520 y 520-1000; JCode card x 560-970 y 520-1000; caption y 1080.
- SFX: whoosh-soft, pop
- Assets: Codex logo, JCode mark

**H2.2** · f 24-63 (40) · "a full second to load."
- Motion: Codex hand sweeps to almost a full turn, readout ticks up to 883 ms and lands. Secondary: the JCode card dims 20%. Ambient: Codex card push-in 1.02.
- Caption: "a full second" bold italic 64, "to load" regular 40.
- Placement: same; readout inside the Codex card at y 860.
- SFX: tick
- Assets: none new

**H2.3** · f 64-95 (32) · "This free coding agent"
- Motion: JCode card lifts forward (scale 1.06) and brightens, Codex card settles back and greys. Secondary: JCode chip pops. Ambient: shadows grow with the lift.
- Caption: "this free coding agent" regular 40.
- Placement: JCode card x 540-990 y 500-1010 after the lift.
- SFX: whoosh-soft, pop
- Assets: none new

**H2.4** · f 96-135 (40) · "shows up in fourteen milliseconds."
- Motion: JCode hand snaps to 14 ms in 3 frames, readout stamps. Secondary: Codex card slides left out of frame. Hand-off: in the last 8 frames the JCode card shrinks toward centre (scale to 0.3) so S08 grows from the same point.
- Caption: "shows up in" regular, "fourteen milliseconds" bold italic 64.
- Placement: caption y 1080-1200.
- SFX: pop, whoosh-soft
- Assets: none new

### H3: Memory proof

**H3.1** · f 0-44 (45) · "This free coding agent runs on"
- Motion: One wide paper card rises; inside, the Claude Code RAM bar fills left to right to 212.7 MB over 30 frames. Secondary: JCode row label appears, bar empty. Ambient: card tilt rotateX 2 deg easing to 0.
- Caption: "this free coding agent runs on" regular 40, last word grey.
- Placement: card x 150-930 y 500-960; caption y 1040.
- SFX: whoosh-soft, tick
- Assets: Claude logo, JCode mark

**H3.2** · f 45-76 (32) · "twenty times less memory"
- Motion: JCode bar fills to 10.4 MB in 6 frames and stops short; "20x" lands at the right of the card. Secondary: Claude bar dims. Ambient: card drift 3 px up.
- Caption: "twenty times less memory" bold italic 64.
- Placement: 20x at x 760-900 y 700.
- SFX: pop
- Assets: none new

**H3.3** · f 77-106 (30) · "than Claude Code."
- Motion: Claude chip pops at the end of the caption line. Hand-off: card collapses toward centre (scale to 0.3, fade) over the last 8 frames into the S08 GitHub card.
- Caption: "than" regular + Claude chip inline + "Claude Code" bold.
- Placement: caption y 1040-1160.
- SFX: pop, whoosh-soft
- Assets: none new

### H4: Hidden layer

**H4.1** · f 0-44 (45) · "Every coding agent you pay for"
- Motion: A white editor card (paid agents, three chips in its top bar) slides up into place; its top-right corner starts to curl. Secondary: the three chips pop in sequence. Ambient: card push-in 1.02.
- Caption: "every coding agent you pay for" regular 40.
- Placement: editor card x 140-940 y 500-1040; caption y 1100.
- SFX: whoosh-soft, pop
- Assets: Cursor, Codex, Claude logos

**H4.2** · f 45-76 (32) · "has a hidden layer,"
- Motion: Peel: the card lifts from the corner like paper (diagonal clip travels across) and shows a dark layer underneath with hollow nodes and a line diagram. Secondary: the four node labels fade in. Ambient: shadow of the curled sheet moves with it.
- Caption: "has a" regular, "hidden layer" bold italic 64.
- Placement: dark layer same rect as the card.
- SFX: swipe
- Assets: none new

**H4.3** · f 77-121 (45) · "and one developer just rebuilt it"
- Motion: The curled white sheet slides off right and out. Secondary: the nodes reconnect in a tighter, cleaner pattern (lines redraw). Ambient: dark layer drift 4 px.
- Caption: "and one developer just rebuilt it" regular 40.
- Placement: caption y 1100-1160.
- SFX: whoosh-soft
- Assets: none new

**H4.4** · f 122-159 (38) · "from scratch for free."
- Motion: Rust chip pops at the end of the line, black bar wipes "for free". Hand-off: the dark layer shrinks toward centre and fades into the S08 GitHub card.
- Caption: "from scratch" bold 56, "for free" black bar.
- Placement: caption y 1100-1220.
- SFX: pop, swipe
- Assets: Rust logo

### H5: Same model, better results

**H5.1** · f 0-39 (40) · "The same AI can get"
- Motion: One model chip pops at top centre; two connector lines draw down to two harness cards (left and right). Secondary: the cards rise into place. Ambient: lines wobble 2 px while drawing.
- Caption: "the same AI can get" regular 40.
- Placement: chip (540,540) r 60; cards x 120-480 and x 600-960, y 700-960; caption y 1080.
- SFX: pop, whoosh-soft
- Assets: none (generic AI chip)

**H5.2** · f 40-79 (40) · "better or worse at coding"
- Motion: Two gauge dials under the cards: left needle swings up, right needle swings down, with arrows. Secondary: left card brightens, right card dims. Ambient: cards drift 3 px apart.
- Caption: "better or worse" bold italic 64, "at coding" regular.
- Placement: gauges y 980-1060 under each card.
- SFX: tick
- Assets: none new

**H5.3** · f 80-112 (33) · "depending on one part"
- Motion: The two cards slide together into one centred card. Secondary: a dashed loop arrow draws around it. Ambient: chip drift.
- Caption: "depending on" regular, "one part" bold italic.
- Placement: centre card x 340-740 y 700-960.
- SFX: whoosh-soft
- Assets: none new

**H5.4** · f 113-157 (45) · "most people never think about."
- Motion: Hollow nodes pop on the card corners; black bar wipes "never think about". Hand-off: the card shrinks toward centre into the S08 GitHub card.
- Caption: "most people" regular, "never think about" black bar.
- Placement: caption y 1080-1200.
- SFX: pop, swipe
- Assets: none new

### H6: AI that hires a team

**H6.1** · f 0-23 (24) · "One AI agent"
- Motion: A single dark terminal card drops into the centre with a soft bounce. Secondary: a "boss" pill pops above it. Ambient: card drift 3 px.
- Caption: "one AI agent" regular 40, last word grey.
- Placement: card x 340-740 y 520-790; caption y 1100.
- SFX: whoosh-soft, pop
- Assets: JCode terminal capture

**H6.2** · f 24-55 (32) · "can now bring in"
- Motion: Dashed connectors draw out from the card bottom to four empty hollow nodes. Secondary: caption continues. Ambient: card push-in 1.02.
- Caption: "can now bring in" regular 40.
- Placement: nodes at y 900, x 160 / 420 / 660 / 920.
- SFX: whoosh-soft
- Assets: none new

**H6.3** · f 56-95 (40) · "its own team of coders,"
- Motion: Four small terminal cards pop onto the nodes one per 6 frames. Secondary: "worker" pills. Ambient: all cards drift.
- Caption: "its own" regular, "team of coders" bold italic 64.
- Placement: worker cards 200x130 centred on the nodes, y 880-1010; caption y 1080.
- SFX: pop (x4, quick)
- Assets: none new

**H6.4** · f 96-135 (40) · "and the tool behind it"
- Motion: The team collapses back into the boss card (cards fly in). Secondary: connectors retract. Ambient: card scale 1.03.
- Caption: "and the tool behind it" regular 40.
- Placement: caption y 1080.
- SFX: whoosh-soft
- Assets: none new

**H6.5** · f 136-161 (26) · "costs nothing."
- Motion: A "$0" chip pops at the card corner, black bar wipes "costs nothing". Hand-off: the card shrinks toward centre into the S08 GitHub card.
- Caption: "costs nothing" black bar.
- Placement: $0 chip at (740,520) r 56; caption y 1100.
- SFX: pop, swipe
- Assets: none new

### H1: Original hook

Drawn as S01-S07 in the main version below (263 frames).

## Main version (H1 + body)

### S01 · f 0-39 (40) · plan S01

Spoken: "Cursor has a price tag."

- Primary: Thin black line draws in from the left edge to x 260; the Cursor chip pops on it with an overshoot (scale 0 to 1.12 to 1). The Cursor checkout card rises from y +50 and settles.
- Secondary: Chip label "Cursor" fades up under the chip; the card shadow grows as it lands.
- Ambient: Card drifts up 3 px over the shot; line end breathes 2 px.
- Caption: No caption in S01-S03 (the chips and cards carry it, as in the reference). Overlay band y 290-440 shows the shared overlay.
- Placement: Chip line y 540 from x -40 to 260; Cursor chip centre (200,540) r 44, label y 596; card x 300-780 y 660-1180, no sheets.
- SFX: whoosh-soft (line), pop (chip)
- Assets: Cursor logo; UI capture Cursor Pro checkout ($20)

### S02 · f 40-79 (40) · plan S02

Spoken: "Codex has a price tag."

- Primary: Line extends to x 460, Codex chip pops. The ChatGPT plan card dissolves in over the Cursor card (crossfade 8 frames) and one sheet appears behind.
- Secondary: Cursor card fades to 0 underneath.
- Ambient: Stack drifts up 3 px; chips breathe.
- Caption: No caption.
- Placement: Codex chip (400,540); card same rect with 1 sheet (+18,+14).
- SFX: pop (chip), whoosh-soft (card swap)
- Assets: Codex logo; UI capture ChatGPT pricing (reads "ChatGPT plan", no price)

### S03 · f 80-124 (45) · plan S03

Spoken: "Claude Code has a price tag."

- Primary: Line to x 660, Claude chip pops. Claude Max card dissolves in, stack grows to two sheets.
- Secondary: ChatGPT card fades underneath.
- Ambient: Stack drifts 3 px; slight rotateY 2 deg to 0.
- Caption: No caption.
- Placement: Claude chip (600,540); card same rect with 2 sheets.
- SFX: pop, whoosh-soft
- Assets: Claude logo; UI capture Claude pricing (Max, "From $100")

### S04 · f 125-164 (40) · plan S04

Spoken: "One developer built something that"

- Primary: Chip line slides left out of frame (translateX -900, 12 frames). The card stack lifts and shrinks (scale 0.92, y to 560) to make room for captions.
- Secondary: Caption words land one by one under the stack.
- Ambient: Stack drifts up 3 px.
- Caption: "one developer built something that" regular 40, each word grey to black.
- Placement: Stack x 300-780 y 560-1040 (scaled); caption block top y 1090.
- SFX: whoosh-soft (chips exit)
- Assets: none new

### S05 · f 165-196 (32) · plan S04

Spoken: "beats all of them"

- Primary: Crack web spreads over the stack from its centre (lines draw outward over 10 frames, white wide stroke under black thin stroke).
- Secondary: "beats all of them" lands bold italic; caption block re-centres up 60 px.
- Ambient: Cracked stack shivers 2 px for 6 frames then holds with drift.
- Caption: line 1 regular; line 2 "beats all of them" bold italic 64.
- Placement: Crack origin (540,800), clipped to the stack rect; caption block top y 1030.
- SFX: glass-crack
- Assets: none new

### S06 · f 197-220 (24) · plan S05

Spoken: "and made it"

- Primary: Cracked stack drops down the frame (y +260 over the shot, easing in) and fades to 0.5.
- Secondary: Caption line 3 lands; block re-centres up again.
- Ambient: Pieces of the crack web separate 3 px.
- Caption: line 3 "and made it" regular 40.
- Placement: Stack falling through y 820-1300; caption block top y 970.
- SFX: whoosh-soft
- Assets: none new

### S07 · f 221-262 (42) · plan S05

Spoken: "free and open source."

- Primary: Black bar wipes left to right (10 frames) with "free & open source" in white.
- Secondary: The last of the cracked stack leaves the bottom of the frame.
- Ambient: Caption block drifts up 4 px; vignette darkens 3%.
- Caption: line 4 black bar "free & open source" 44 white on #111.
- Placement: Caption block top y 900; bar centred, about x 300-780.
- SFX: swipe
- Assets: none new

### S08 · f 263-286 (24) · plan S06

Spoken: "It's called JCode,"

- Primary: GitHub repo card grows from 30% at the centre to full size (spring, 14 frames).
- Secondary: JCode donut mark pops above the card; caption lands.
- Ambient: Card settles with a 2 px overshoot drift.
- Caption: "it's called" regular 40 + "JCode" bold 56.
- Placement: Card x 240-840 y 640-1000; JCode mark centre (540,560) r 56; caption y 1070.
- SFX: whoosh-soft, pop
- Assets: JCode mark (assets/logos/jcode.svg); UI capture github.com/1jehuang/jcode (assets/shots/github-jcode.png)

### S09 · f 287-318 (32) · plan S07

Spoken: "and there's one thing"

- Primary: Hard cut to the big GitHub card at the top, slow push-in scale 1.00 to 1.03 across S09-S11.
- Secondary: Caption words land under the card.
- Ambient: Card shadow softens as it pushes in.
- Caption: "and there's one thing" regular 40.
- Placement: Card x 120-960 y 300-760 (push keeps it inside x 100-980); caption y 850.
- SFX: whoosh-soft (cut)
- Assets: UI capture GitHub repo (larger crop)

### S10 · f 319-350 (32) · plan S07

Spoken: "you need to know"

- Primary: "you need to know" lands bold italic, word by word.
- Secondary: Push-in continues (1.015).
- Ambient: Caption block drifts up 2 px.
- Caption: line 2 "you need to know" bold italic 64.
- Placement: caption block y 850-1000.
- SFX: none
- Assets: none new

### S11 · f 351-374 (24) · plan S07

Spoken: "before anything else."

- Primary: Black bar wipes "before anything else" left to right.
- Secondary: Push-in ends at 1.03.
- Ambient: Card drift 2 px.
- Caption: line 3 black bar "before anything else".
- Placement: bar at y 1010, centred.
- SFX: swipe
- Assets: none new

### S12 · f 375-414 (40) · plan S08

Spoken: "Every coding agent has a"

- Primary: Hard cut. Human hand slides in from the left edge, robot hand from the right, both easing to almost touching (12 frames).
- Secondary: Contact shadows fade in under both hands; caption starts.
- Ambient: Both hands keep drifting inward 1 px per 10 frames.
- Caption: "every coding agent has a" regular 40.
- Placement: Human hand box x 90-490 y 640-1040; robot hand box x 590-990 y 560-960; caption y 1110.
- SFX: whoosh-soft (x2, hands)
- Assets: Photo cut-outs: human hand, robot hand (image tool, on white, with contact shadow)

### S13 · f 415-446 (32) · plan S09

Spoken: "middle layer between you"

- Primary: Bracket line draws between the hands (stroke-dashoffset, 14 frames): node at (470,560), right to x 560, down to (560,920), node.
- Secondary: "Middle Layer" lands bold italic.
- Ambient: Hands drift.
- Caption: line 1 regular; line 2 "Middle Layer" bold italic 64; line 3 "between you" regular (grey).
- Placement: Bracket as above; caption block y 1060.
- SFX: whoosh-soft (line draw)
- Assets: none new

### S14 · f 447-470 (24) · plan S09

Spoken: "and the AI."

- Primary: "& the AI." lands; the robot hand nudges 8 px toward the human hand.
- Secondary: Nodes pulse once (scale 1.2 to 1).
- Ambient: Whole scene drifts up 3 px, preparing the tilt.
- Caption: line 3 "between you & the AI." regular 40.
- Placement: same rects as S13.
- SFX: pop (node pulse)
- Assets: none new

### S15 · f 471-502 (32) · plan S10

Spoken: "That's the part handling"

- Primary: Camera tilt: the hands and bracket translate down to the bottom of the safe box and scale to 0.72 (14 frames), freeing the top.
- Secondary: Header "that's the part handling" lands at the top in bold italic.
- Ambient: Hands keep drifting.
- Caption: Header "that's the part handling" bold italic 56 at y 420.
- Placement: Hands scaled 0.72: human x 150-440 y 950-1240, robot x 520-810 y 900-1190; bracket scaled with them; header y 420.
- SFX: whoosh-soft (tilt)
- Assets: none new

### S16 · f 503-547 (45) · plan S11

Spoken: "your prompts, tools, memory and sessions."

- Primary: Four icon rows build one per spoken word: icon pops (overshoot), then the label reveals. Rows at y 520, 600, 680, 760.
- Secondary: Hands below drift 2 px; bracket nodes pulse on each row.
- Ambient: Header drifts up 2 px.
- Caption: Rows as caption: "Your Prompts", "Your Tools", "Your Memory", "Your Sessions" bold 44 with 48 px black icons.
- Placement: Icons at x 300; labels at x 372; rows y 520/600/680/760.
- SFX: pop (x4, one per row)
- Assets: 4 black icons (prompt, tools, memory, sessions)

### S17 · f 548-587 (40) · plan S12

Spoken: "It's known as a harness,"

- Primary: Icon list scrolls off the top; the scene slides back up to full size. A dashed looping arrow draws from the bottom node down to the harness icon (18 frames); the icon pops with a bounce.
- Secondary: "Harness" lands bold italic.
- Ambient: Hands drift.
- Caption: "it's known as a" regular 40 + "Harness" bold italic 72.
- Placement: Hands: human x 90-490 y 480-880, robot x 590-990 y 400-800; arrow from (560,760) looping to (540,950); icon centre (540,1010) 110 px; caption y 1100.
- SFX: whoosh-soft (arrow), pop (icon)
- Assets: 3D harness icon (image tool, glossy, neutral)

### S18 · f 588-632 (45) · plan S14

Spoken: "and most apps you're paying for"

- Primary: Hands exit down and out. The three paid-tool chips return on a line at y 600, but as heavy grey blocks that drop onto it one by one (6 frames apart).
- Secondary: Caption lands below.
- Ambient: Blocks settle with a 3 px bounce; line breathes.
- Caption: "and most apps you're paying for" regular 40.
- Placement: Line y 600 x 100-980; blocks 120x120 centred at x 260/540/820; labels under; caption y 980.
- SFX: pop (x3, heavy)
- Assets: Cursor, Codex, Claude logos (grey treatment)

### S19 · f 633-672 (40) · plan S14

Spoken: "built theirs big and heavy."

- Primary: The line sags under the blocks (bezier bends to y 660) and the blocks drop 40 px with it (10 frames, ease out).
- Secondary: "big & heavy" lands bold upright.
- Ambient: Blocks sway 2 px.
- Caption: line 2 "built theirs" regular + "big & heavy" bold 56.
- Placement: Sagged line through (540,660); blocks y 580-700; caption block y 980.
- SFX: whoosh-soft (sag)
- Assets: none new

### S20 · f 673-680 (8) · plan S15

No words: blur break.

- Primary: Blur transition: whole frame blurs to 16 px and the grey vignette deepens, then the next shot blurs in.
- Secondary: none
- Ambient: none
- Caption: none
- Placement: full frame
- SFX: blur-swell
- Assets: none

### S21 · f 681-720 (40) · plan S15

Spoken: "JCode rebuilt that whole thing"

- Primary: Text-only beat: "JCode" lands big, then the words follow one by one.
- Secondary: A faint JCode mark fades in behind the text at 6% opacity and drifts.
- Ambient: Text block drifts up 3 px.
- Caption: "JCode" bold 96 + "rebuilt that whole thing" regular 40, single line, centred.
- Placement: caption y 760.
- SFX: pop (JCode)
- Assets: JCode mark

### S22 · f 721-752 (32) · plan S15

Spoken: "from scratch in Rust."

- Primary: Second line lands; the Rust chip pops at the end of it; an underline draws left to right under the line (10 frames).
- Secondary: First line drifts up 20 px to make room.
- Ambient: Chip breathes.
- Caption: line 2 "from scratch in" regular + "Rust" bold 56 + Rust chip inline; underline 4 px black under line 2.
- Placement: line 2 y 870; underline y 950 x 300-780.
- SFX: pop (Rust), whoosh-soft (underline)
- Assets: Rust logo

### S23 · f 753-784 (32) · plan S16

Spoken: "Every extra session uses"

- Primary: Ground changes: dot grid fades in and the two grey swoosh ribbons slide in from the top-right and bottom-left (bleeding off frame). Row 1 label starts at x 140.
- Secondary: Counter slot appears as a grey "1x".
- Ambient: Swooshes keep drifting 4 px for the whole stats section.
- Caption: Stat row label "every extra session uses" regular 40 (grey to black); no centred caption.
- Placement: Row 1 y 640, x 140-960.
- SFX: whoosh-soft (swooshes)
- Assets: none new

### S24 · f 785-816 (32) · plan S17

Spoken: "twenty times less memory"

- Primary: Counter ticks up to "20x" in about 10 steps over 18 frames (intermediate values are motion only, not drawn here), then lands bold.
- Secondary: "less memory" reveals next to it.
- Ambient: Row drifts 2 px; grid shimmer.
- Caption: Row 1: "20x" bold 72 + "less memory" bold 40; label line above it in regular 40.
- Placement: Row 1 y 700, number x 140-310.
- SFX: tick (counter)
- Assets: none new

### S25 · f 817-840 (24) · plan S17

Spoken: "than Claude Code."

- Primary: "than" reveals and the Claude chip pops at the row end with overshoot.
- Secondary: Row settles 4 px left.
- Ambient: Swoosh drift.
- Caption: Row 1 continues: "than" regular 40 + Claude chip 64 px.
- Placement: chip at x 760-824, y 680.
- SFX: pop (Claude)
- Assets: Claude logo

### S26 · f 841-885 (45) · plan S18

Spoken: "And it opens in fourteen milliseconds."

- Primary: Row 2 builds under row 1: label "opens in", then a race bar: the JCode bar fills to 14 ms in 3 frames and stops; "14 ms" lands bold.
- Secondary: A second, empty bar track appears under it for Codex (grey).
- Ambient: Rows drift 2 px.
- Caption: Row 2: "opens in" regular 40; "14 ms" bold 56 at the JCode bar end.
- Placement: Row 2 y 820; bars x 140-900, JCode bar 80 px long; Codex track empty.
- SFX: pop (bar stop), tick
- Assets: JCode mark

### S27 · f 886-925 (40) · plan S19

Spoken: "Codex needs almost a second."

- Primary: Codex bar crawls across the track for the whole shot and lands on 883 ms at the end; the Codex chip pops at the bar end.
- Secondary: "63x faster to open" small bold label appears under the bars on the last 8 frames.
- Ambient: Rows drift.
- Caption: Row 2 continues: "883 ms" bold 56 at the Codex bar end; result label "63x faster to open" bold 36.
- Placement: Codex bar x 140-880 y 920; label y 990.
- SFX: tick (crawl), pop (chip)
- Assets: Codex logo

### S28 · f 926-957 (32) · plan S20

Spoken: "But here's where it"

- Primary: Both stat rows slide up as one block (to y 420-720, 12 frames) to make room.
- Secondary: Caption "but here's where it" lands centred below.
- Ambient: Swooshes drift; grid stays.
- Caption: "but here's where it" regular 40 centred.
- Placement: Stats block y 420-720; caption y 900.
- SFX: whoosh-soft
- Assets: none new

### S29 · f 958-983 (26) · plan S20

Spoken: "gets good."

- Primary: "GETS GOOD" punches in at scale 1.15 and settles to 1 (6 frames), huge bold caps.
- Secondary: Stats block dims to 60%.
- Ambient: Letter-spacing tightens 2 px as it settles.
- Caption: "GETS GOOD" bold 96 caps.
- Placement: y 960, centred.
- SFX: riser
- Assets: none new

### S30 · f 984-1028 (45) · plan S21

Spoken: "It keeps notes on each project"

- Primary: Hard cut back to the plain ground. The dark JCode terminal card slides in from the left (x -200 to 140, 14 frames, ease out) and keeps a slow drift right.
- Secondary: Caption lands under it.
- Ambient: Terminal cursor blinks; card push-in 1.01.
- Caption: "it keeps notes on each project" regular 40.
- Placement: Terminal x 140-940 y 320-780; caption y 870.
- SFX: whoosh-soft
- Assets: JCode terminal capture (own recording, memory note visible)

### S31 · f 1029-1060 (32) · plan S22

Spoken: "right on your computer,"

- Primary: A small white "notes.md" file card peels out of the terminal's right edge and settles at a 6 deg tilt beside it (10 frames).
- Secondary: Sparkle bullet 1 lands: "right on your computer".
- Ambient: Terminal drift; file card bobs 2 px.
- Caption: Sparkle bullet row: four-point star + "right on your computer" bold 44.
- Placement: File card x 720-980 y 560-760 rotate 6 deg; bullet at x 300 y 880.
- SFX: swipe (peel), pop (sparkle)
- Assets: memory file mock (text)

### S32 · f 1061-1084 (24) · plan S22

Spoken: "so it remembers"

- Primary: Sparkle bullet 2 starts: star pops, "so it remembers" reveals grey to black.
- Secondary: Terminal card pushes in to 1.03; the memory line inside highlights.
- Ambient: File card bobs.
- Caption: Bullet 2: "so it remembers" regular 40 (landing).
- Placement: bullet 2 at x 300 y 960.
- SFX: pop
- Assets: none new

### S33 · f 1085-1124 (40) · plan S22

Spoken: "how you like things done."

- Primary: Bullet 2 completes with "like things done" bold italic.
- Secondary: Terminal content changes state (second capture: the agent recalls a note).
- Ambient: Card drift; file card bobs.
- Caption: Bullet 2: "so it remembers how you" regular + "like things done" bold italic 56.
- Placement: bullet 2 y 960-1040 (wraps to two lines if needed, inside x 300-980).
- SFX: none
- Assets: second terminal capture

### S34 · f 1125-1164 (40) · plan S23

Spoken: "You can run a bunch"

- Primary: Layout swap: caption jumps to the top, the terminal card shrinks and moves to the centre (x 340-740 y 520-750, 12 frames). File card and bullets exit.
- Secondary: Caption lands at the top.
- Ambient: Card drift.
- Caption: "you can run a bunch" regular 40 at the top.
- Placement: Caption y 400; centre terminal x 340-740 y 520-750.
- SFX: whoosh-soft
- Assets: none new

### S35 · f 1165-1196 (32) · plan S23

Spoken: "of agents at once"

- Primary: Two more terminal cards fan out from behind the centre one to the left and right, each with a 14 deg rotateY (10 frames).
- Secondary: "agents at once" lands bold.
- Ambient: All three cards drift 2 px apart.
- Caption: line 2 "of" regular + "agents at once" bold 56.
- Placement: Left card x 100-440 y 560-790; right x 640-980 y 560-790; centre x 340-740 y 500-730.
- SFX: whoosh-soft (x2), pop
- Assets: none new

### S36 · f 1197-1236 (40) · plan S24

Spoken: "without your laptop slowing down."

- Primary: A small RAM meter card slides up under the cards; its bar stays flat at 10.4 MB while the cards keep running (cursor blinks in all three).
- Secondary: "slowing down" lands bold upright.
- Ambient: Cards drift.
- Caption: line 3 "without your laptop" regular + "slowing down" bold 56.
- Placement: Meter card x 290-790 y 860-960; caption line 3 y 1040.
- SFX: pop (meter)
- Assets: none new

### S37 · f 1237-1244 (8) · plan S25

No words: blur break.

- Primary: Blur transition.
- Secondary: none
- Ambient: none
- Caption: none
- Placement: full frame
- SFX: blur-swell
- Assets: none

### S38 · f 1245-1276 (32) · plan S25

Spoken: "And the best part?"

- Primary: Text only: words land centred, the question mark pops last.
- Secondary: Vignette lifts 3%.
- Ambient: Text drifts up 3 px.
- Caption: "and the best part?" bold italic 64.
- Placement: y 780 centred.
- SFX: none
- Assets: none

### S39 · f 1277-1316 (40) · plan S26

Spoken: "One agent can bring in"

- Primary: One terminal card drops into the centre with a soft bounce (10 frames).
- Secondary: Caption lands at the top.
- Ambient: Card drift; cursor blink.
- Caption: "one agent can bring in" regular 40 at the top.
- Placement: Caption y 340; card x 290-790 y 480-760.
- SFX: whoosh-soft
- Assets: JCode terminal capture (swarm start)

### S40 · f 1317-1340 (24) · plan S27

Spoken: "its own helpers."

- Primary: Three connector lines draw down from the card bottom to hollow nodes, and three small terminal cards pop onto them, 5 frames apart.
- Secondary: "its own helpers" lands bold italic.
- Ambient: All cards drift.
- Caption: line 2 "its own helpers" bold italic 64 at the top block.
- Placement: Lines from (540,760) to nodes at (240,920), (540,920), (840,920); helper cards 260x170 at x 110/410/710, y 940-1110.
- SFX: pop (x3)
- Assets: none new

### S41 · f 1341-1380 (40) · plan S28

Spoken: "It turns into the boss,"

- Primary: The cards merge into one wide dark terminal frame (x 100-980); inside it a 2400 px wide strip of three panes starts panning right to left. A "boss" pill pops above the left pane.
- Secondary: Caption lands below.
- Ambient: Strip pans about 4 px per frame for the whole shot.
- Caption: "it turns into the" regular + "boss" bold italic 64.
- Placement: Frame x 100-980 y 480-900 (content pans inside the frame; the card itself stays inside the safe box); pill at (300,440); caption y 980.
- SFX: whoosh-soft, pop (pill)
- Assets: Wide terminal capture (three panes, own recording)

### S42 · f 1381-1420 (40) · plan S29

Spoken: "the rest do the work,"

- Primary: Pan continues: worker panes slide into view; "worker" pills pop above each as it arrives.
- Secondary: "do the work" lands bold.
- Ambient: Pan keeps going; frame drift 2 px.
- Caption: line 2 "the rest" regular + "do the work" bold 56.
- Placement: Pills at (540,440) and (800,440); caption block y 980.
- SFX: pop (x2)
- Assets: none new

### S43 · f 1421-1452 (32) · plan S30

Spoken: "and they all build"

- Primary: Cut to three terminal cards tilted in 3D (rotateY -22 deg, perspective) staggered in depth; they slide in from the right one after another.
- Secondary: Caption lands.
- Ambient: Cards drift left 2 px per 10 frames.
- Caption: "and they all build" regular 40.
- Placement: Cards 600x330 at (160,520), (220,470), (280,420) with rotateY -22 deg; caption y 940.
- SFX: whoosh-soft (x3)
- Assets: three terminal captures

### S44 · f 1453-1476 (24) · plan S30

Spoken: "in one codebase."

- Primary: Thin lines draw from the bottom of each card to one folder chip below; black bar wipes "in one codebase".
- Secondary: Folder icon pops.
- Ambient: Cards drift.
- Caption: line 2 black bar "in one codebase".
- Placement: Folder node at (540,1060), folder icon under it; lines from each card bottom; caption block y 880, bar y 950.
- SFX: swipe, pop
- Assets: folder icon

### S45 · f 1477-1516 (40) · plan S30

Spoken: "If two of them grab"

- Primary: The front two cards stay bright, the third dims to 35%. A white file pill "main.rs" pops between them.
- Secondary: Caption lands.
- Ambient: Cards drift.
- Caption: "if two of them grab" regular 40.
- Placement: File pill at (540,880) mono 34; caption y 980.
- SFX: pop
- Assets: none new

### S46 · f 1517-1540 (24) · plan S30

Spoken: "the same file,"

- Primary: Two lines draw from the two bright cards to the file pill at the same time (8 frames).
- Secondary: "the same file" lands bold italic.
- Ambient: Pill pulses once.
- Caption: line 2 "the same file" bold italic 64.
- Placement: Lines from (500,800) and (580,750) to (540,860); caption block y 940.
- SFX: whoosh-soft
- Assets: none new

### S47 · f 1541-1572 (32) · plan S30

Spoken: "JCode gives the second"

- Primary: The second card nudges 24 px to the right and lifts 10 px (it is the one being warned); an empty black pill slides up above it.
- Secondary: Caption lands.
- Ambient: Pill bobs 2 px.
- Caption: "JCode gives the second" regular 40.
- Placement: Alert pill at (620,400); caption y 980.
- SFX: whoosh-soft
- Assets: none new

### S48 · f 1573-1602 (30) · plan S30

Spoken: "a heads up."

- Primary: The pill fills with "heads up: main.rs changed" (type-on, 8 frames); the black bar caption wipes.
- Secondary: The file pill pulses.
- Ambient: Cards drift.
- Caption: line 2 black bar "a heads up".
- Placement: Alert pill (620,392) mono 30; caption block y 940.
- SFX: pop, swipe
- Assets: none new

### S49 · f 1603-1642 (40) · plan S31

Spoken: "The tool itself is free."

- Primary: Hard cut. A white price card rises like the hook cards, with one sheet behind: JCode, "$0", MIT license badge.
- Secondary: "free" lands bold italic under it.
- Ambient: Card drift 3 px; shadow grows.
- Caption: "the tool itself is" regular + "free" bold italic 72.
- Placement: Card x 290-790 y 420-880; caption y 960.
- SFX: whoosh-soft, pop ($0)
- Assets: JCode mark

### S50 · f 1643-1674 (32) · plan S32

Spoken: "You sign in with"

- Primary: The card grows taller (height to 560) and two dashed sign-in slots unfold inside it.
- Secondary: Caption lands.
- Ambient: Card drift.
- Caption: "you sign in with" regular 40.
- Placement: Card x 290-790 y 420-980; slots inside at y 820-916; caption y 1040.
- SFX: whoosh-soft
- Assets: none new

### S51 · f 1675-1698 (24) · plan S32

Spoken: "the Claude or"

- Primary: Claude chip slides in from the left and clicks into slot 1 (overshoot).
- Secondary: Slot outline turns solid.
- Ambient: Card drift.
- Caption: line 2 "the Claude or" regular 40 with the Claude chip inline.
- Placement: slot 1 x 330-540 y 820-916.
- SFX: pop
- Assets: Claude logo

### S52 · f 1699-1738 (40) · plan S32

Spoken: "ChatGPT plan you already have."

- Primary: ChatGPT chip slides in from the right into slot 2; black bar wipes "you already have".
- Secondary: Both slots pulse once.
- Ambient: Card drift.
- Caption: line 2 "the Claude or ChatGPT plan" regular 40; line 3 black bar "you already have".
- Placement: slot 2 x 560-750; caption block y 1040-1180.
- SFX: pop, swipe
- Assets: ChatGPT logo

### S53 · f 1739-1778 (40) · plan S33

Spoken: "So you get one of"

- Primary: Cut: GitHub card small at the top centre drifts up slowly for the whole payoff (y 340 to 320 across S53-S56).
- Secondary: Caption lands.
- Ambient: Card push-in 1.01.
- Caption: "so you get one of" regular 40.
- Placement: Card x 290-790 y 340-640; caption y 740.
- SFX: whoosh-soft
- Assets: UI capture GitHub repo

### S54 · f 1779-1810 (32) · plan S33

Spoken: "the fastest coding agents"

- Primary: "the fastest coding agents" lands bold italic word by word.
- Secondary: Card drifts up 8 px.
- Ambient: Caption block re-centres.
- Caption: line 2 "the fastest coding agents" bold italic 64.
- Placement: caption block y 720.
- SFX: none
- Assets: none new

### S55 · f 1811-1834 (24) · plan S33

Spoken: "out there without"

- Primary: Line 3 lands.
- Secondary: One sheet peeks out behind the card (slides out 18 px).
- Ambient: Card drift.
- Caption: line 3 "out there without" regular 40.
- Placement: caption block y 720-900.
- SFX: none
- Assets: none new

### S56 · f 1835-1872 (38) · plan S33

Spoken: "paying a cent more."

- Primary: "a cent more" lands bold upright; a second sheet peeks out.
- Secondary: Card drifts up to y 320.
- Ambient: Block drift 2 px.
- Caption: line 3 "out there without paying" regular + "a cent more" bold 56.
- Placement: caption block y 720-920.
- SFX: pop
- Assets: none new

### S57 · f 1873-1880 (8) · plan S34

No words: blur break.

- Primary: Blur transition into the CTA; the ground darkens 6% during the blur.
- Secondary: none
- Ambient: none
- Caption: none
- Placement: full frame
- SFX: blur-swell
- Assets: none

### S58 · f 1881-1910 (30) · plan S34

Spoken: "Comment HARNESS"

- Primary: Darker grey ground. "Comment" lands small, then "HARNESS" in quotes punches in huge (scale 1.1 to 1).
- Secondary: Quote marks pop a frame after the word.
- Ambient: Word breathes 1%.
- Caption: "Comment" regular 44; "HARNESS" bold 128 in curly quotes.
- Placement: "Comment" y 440; "HARNESS" y 500-640, centred.
- SFX: riser (start), pop
- Assets: none

### S59 · f 1911-1942 (32) · plan S35

Spoken: "and I'll send you"

- Primary: The guide mock (tilted 3D page, one sheet behind) slides in from the bottom right and settles under the keyword (12 frames).
- Secondary: Caption lands under it.
- Ambient: Mock keeps a slow rotateZ drift of 1 deg.
- Caption: "I'll send you" regular 40.
- Placement: Mock x 240-840 y 680-1080 (perspective rotateX 52, rotateZ -12); caption y 1120.
- SFX: whoosh-soft
- Assets: 3D guide mock (image tool): the JCode setup guide page

### S60 · f 1943-1966 (24) · plan S35

Spoken: "the exact steps"

- Primary: The step list on the mock reveals line by line (ink darkens); "exact steps" lands bold.
- Secondary: Mock settles flat by 4 deg.
- Ambient: Keyword breathes.
- Caption: "I'll send you the" regular + "exact steps" bold 56.
- Placement: caption y 1120.
- SFX: tick (lines)
- Assets: none new

### S61 · f 1967-1998 (32) · plan S35

Spoken: "to set it up."

- Primary: Line 2 lands; the riser peaks on "up".
- Secondary: Mock sheet behind slides out 10 px.
- Ambient: Keyword breathes; mock drift.
- Caption: line 2 "to set it up" regular 40.
- Placement: caption block y 1120-1230.
- SFX: riser (peak)
- Assets: none new

### S62 · f 1999-2039 (41) · plan S35

No words: end hold.

- Primary: Hold for reading: the mock rotates slowly (rotateZ -12 to -8 deg), the keyword pulses once at 1.03.
- Secondary: The step list on the mock scrolls up 20 px.
- Ambient: Vignette breathes.
- Caption: unchanged from S61.
- Placement: unchanged.
- SFX: none (riser tail decays)
- Assets: none

## Judgment calls for the orchestrator

1. **Shot count is 62, above the 50-55 aim.** 243 spoken words at 3.8 wps with a 45-frame cap means at most 5-6 words per shot, and sentence boundaries push the count up. Merging any two neighbours breaks the cap. If Victor wants fewer shots, the only lever is a faster read (the real voice may give it).
2. **Three line breaks landed mid-phrase to respect the cap:** S13/S14 ("middle layer between you" / "and the AI."), S45-S48 (the heads-up sentence over four shots), S50-S52 (the sign-in sentence over three). Each split is a visible change (new element, line draw, chip slot), so none is a static hold.
3. **The wide terminal strip (S41-S42) pans inside a card that stays in the safe box** instead of a card that bleeds off both edges like the reference. The brief puts every card inside x 65-1015, so the content pans behind the card frame. Say the word if the bleeding strip is preferred.
4. **Counter intermediates (S24, S27).** The tick-up to 20x and the crawl to 883 ms will show in-between numbers in motion. The storyboard only draws the final values because of the numbers rule; the builders need a yes that passing values are allowed on screen.
5. **The "63x faster to open" label in S27** is a result pill under the race bars, not spoken. It is the one on-screen number without a spoken counterpart. Drop it if that reads as a label narrating the visual.
6. **Hands in S15-S16 are scaled to 0.72** so they stay inside y 1248 during the camera tilt. The reference lets them bleed; if cut-out imagery may bleed like a background, the tilt can use full-size hands.
7. **End hold S62 is 41 frames (1.4 s)** after "to set it up." so the keyword is readable. Trim it if the cut feels long.
8. **Sparkle bullets in S31-S33 carry the spoken words** ("right on your computer", "so it remembers how you like things done") rather than the PLAN's summary labels, to stay clear of the no-narrating-labels rule.
9. **The Codex pricing card** reads "ChatGPT plan" with no price per the brief; the mock copy around it lists no numbers.
