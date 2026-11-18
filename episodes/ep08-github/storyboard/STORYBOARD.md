# Ep08 storyboard: What GitHub actually is, for people building with AI (Paper Studio), R1 provisional

Three hooks and three bodies, every hook paired with every body: 9 Instagram videos (A B C AB AC BA BC CA CB, first letter = hook, second = body) and the YouTube Shorts cut of each. Script and fact sheet: `../SCRIPT.md`. Style: `<repo>/skills/paper-studio/SKILL.md` (every rule applies: ground and 135 px grid, one light top left, floating shadows, captions, camera system, no empty frames, safe box). Reference reel (dark style, for the sequence of ideas only, never its footage or look): `../reference/jesserurka what is github (DfVpRJEmVAI).mp4` and `../reference/contact-sheet-1fps.jpg`.

Shot lines use the ep07 tool format: `**ID** · f a-b (n) · beat X · anchor "first words" · spoken text`, then one bullet with what is on screen. Frame ranges are provisional (3.1 words per second from the first word); INFRA's timeline tool replaces them with the voice word timings and splits anything over 45 frames into parts (.1, .2): put a visible change at every part boundary.

## Shared hook overlay

Band y 290-440, Inter 800 56 px, two lines, centred, #111, the same on every version, from frame 0 until the body's first shot:

> How to use GitHub
> when you build with AI

## Numbers allowed on screen (from the fact sheet)

v1 (the tag), 225M+ (developers, GitHub Octoverse 2026, Body C only), 'one step back', '1 copy' / 'one laptop' pills (Body C), a clock winding back one hour (Body C), '1 2 3 4' step numbers (Body B). Nothing else: no star or fork counts, no follower counts, no 93%, no dates. Short commit hashes on commit cards are generic mono strings (7 hex characters, never a real repo's), commit messages are plain ('save progress', 'add login page', 'add dark mode').

## The shared visual language (so the same thing looks the same in all nine videos)

- **Commit card**: the kit's `Commit` / `CommitStrip` look: small white paper card (about 340 x 128), mono 7-character hash top left, a one-line message, a small dark avatar dot; thickness edge and the floating shadow. A commit card that "shows the snapshot" enlarges to about 520 x 400 and shows the file tree inside.
- **Timeline wire**: 7 px black wire, hollow nodes r 15 with a 6 px ring (`WireNode`), one node per commit card, cards hanging under their nodes; branches fork off at 30 deg and curve back with a merge node. The wire casts a soft shadow so it reads as raised.
- **Project folder card / app card**: white paper card with a mono file tree (index.html, package.json, src/App.jsx, src/List.jsx, styles.css, mono 38 px+); the "app" is a plain to-do list mock (three rows with ticks) in a `DeviceFrame` phone when it needs to be an app, with no brand and no colour.
- **Terminal card**: `TerminalCard` white bezel with a Claude Code style prompt line (a '>' prompt, mono 38 px+, black on the dark terminal face), typing on the spoken words; mono result lines with a black tick. No real screenshots of anyone's repo.
- **Word chips**: white button chips with black Inter 800 lowercase words (commit, push, clone, branch, merge, tag): the same chip component everywhere (builders: one local helper copied from BodyA's folder once BA ships it, or the kit's text chip if it has one).
- **GitHub slab**: a heavy charcoal slab with the official white Invertocat and 'github' under it (the kit's heavy chip treatment). **GitHub chip / Git chip / Claude chip**: `LogoChip` with the official SVGs from `storyboard/assets/logos/`.
- **Laptop**: ep06's `laptop.png` cut-out (black screen; inset content drawn on the screen with the corners from ep06's COMPLETION-ASSETS.md). **Eraser**: ep07's `eraser.png`. **Scissors**: ep06's `scissors.png` (blades straddle the wire, open, close, the cut opens behind the tips). **Robot**: ep06's `robot.png` (sprites and the CTA hero). **Paper tag**: new `paper-tag.png`. **Instant camera**: new `instant-camera.png`.
- Captions: `KineticCaption` on the real words (connectors 56-60 px, bold italic key phrase 90-96 px, black bar 62-66 px, text-only beats 110-130 px), in the camera `hud`.

## Assets (`storyboard/assets/`, written by the ASSETS agent; drawn fallbacks until they land)

- Logos (`logos/`, official SVGs from the web, SOURCES.md with the URL per file): `github.svg` (the Invertocat mark, from github.com/logos), `git.svg` (the official Git logo from git-scm.com/downloads/logos, by Jason Long), plus the kit's `claude.svg` copied in. Note per logo whether it needs the normal 58% fill or almost no padding.
- Photo cut-outs (`photos/`, generated on white, original, no brand marks, background removed, cropped to opaque bounds, lit from the top left): `instant-camera.png` (a photoreal white instant camera, three-quarter view, a blank print half out of its slot), `paper-tag.png` (a plain photoreal cardboard tag on a short string, blank face, slight 3D lean), `guide-mock-github.png` (the guide mock in the ep06/ep07 style with the title 'GitHub with Claude Code: the exact prompts'). Reused unchanged from ep06: `robot.png`, `laptop.png`, `scissors.png`; from ep07: `eraser.png`.
- Drawn solid objects (IconObject style, black ink with thickness and shadow, no line art): the clock chip, the magnifier, the person icon chip, the wrench icon chip, the keyboard icon, the coin icon, the tick chip, the 1 2 3 4 step strip.

## Hand-offs (every hook into every body)

Each hook ends at the camera identity pose with its main objects shrinking and flipping onto the body's first card at (540, 890), full size on the hook's last frame; that card is fully visible on the body's frame 0. Because every hook runs in front of every body, each hook builder branches its hand-off on `bodyOf(variant)` from the start and imports each body's first-card component (the body builder exports it from `beats/Body<X>/firstCard.tsx` as `FirstCard`, drawn exactly as the body's frame 0 draws it, taking the body-local frame `t` so `t=0` is frame 0). The body builder owns the card's look; hook builders match it; until a body's `firstCard.tsx` exists, the hook builder draws a stand-in from this storyboard and swaps the import in before its final stills.

- BodyA frame 0: the GitHub-on-Git stack card (A01a).
- BodyB frame 0: the Claude Code terminal card with the blinking cursor and the 1 2 3 4 strip (B01a).
- BodyC frame 0: the laptop with one app card on its screen and the '1 copy' pill, the text beat above it (C01a).

## Versions

### A: H1 the reel's hook kept close + Body A what it actually is

Provisional total: 2133 frames (71.1 s) at 3.1 words per second. The real frames come from the voice word timings (INFRA regenerates the timeline). In the combos this hook runs in front of the other two bodies and this body behind the other two hooks (see Hand-offs).
#### Hook group `HA` (H1 the reel's hook kept close)

**HA1** · f 0-38 (39) · beat HA · anchor "What actually is" · What actually is GitHub,
- A heavy charcoal GitHub slab (the official Invertocat mark in white, 'github' label under it) lands centre-low in the hook box with its thick bottom edge and a soft shadow; a white paper card behind it leans 6 deg. Camera push 4%. First frame already shows the slab mid-drop, never empty paper.

**HA2** · f 39-77 (39) · beat HA · anchor "and why does" · and why does everyone
- Three robot sprites (assets robot.png, our mascot) pop onto the paper in a row under the slab, each at a small laptop cut-out (laptop.png), one per spoken word; the slab tilts 8 deg in 3D. Camera tracks slightly left as the row fills.

**HA3** · f 78-116 (39) · beat HA · anchor "building with AI" · building with AI keep
- Claude chips pop beside each laptop (one per word); the robots' heads tilt towards the slab. A 7 px wire draws under the row, node to node.

**HA4** · f 117-135 (19) · beat HA · anchor "mentioning it" · mentioning it?
- Black chat bubbles pop out of the three robots one after another, each reading GitHub (ChatStack, white Inter 700); the slab bobs once. HAND-OFF (the pause after 'it?'): the slab and the robot row shrink and flip onto the body's first card at (540, 890), full size on the last hook frame; which card depends on bodyOf(variant) (see Hand-offs).

#### Body group `BodyA` (Body A what it actually is)
Body starts at f 148 (12 frames of pause after the hook; the hand-off target: the GitHub-on-Git stack card).

**A01a** · f 148-186 (39) · beat A01 · anchor "GitHub runs on" · GitHub runs on Git,
- FIRST CARD (the hand-off target, fully visible on frame 0): a white paper card (820 x 520, thickness, two sheets peeking right) with the GitHub chip sitting on top of a Git chip (official Git logo), a short 7 px wire between them, labels 'github' / 'git'. Caption 'runs on Git' bold italic. Camera identity, hold drifts.

**A02a** · f 187-263 (77) · beat A02 · anchor "the version control" · the version control tool almost every developer uses.
- A row of robot sprites (SpriteGrid, 6 x 2) fills under the card one per spoken word, each with a tiny Git chip; a black bar caption 'almost every developer'. Camera pulls back to 0.9 for the row.

**A03a** · f 264-302 (39) · beat A03 · anchor "Here's how it" · Here's how it works.
- Text-only beat: 'Here's how it works.' at 120 px on paper, the card and row slide off left. Camera back to identity.

**A04a** · f 303-399 (97) · beat A04 · anchor "Every time you" · Every time you save your progress, that's called a commit.
- The project folder card (white card with a file tree: index.html, package.json, src/App.jsx, styles.css, mono 38 px) stands left; a photoreal instant camera cut-out (instant-camera.png) slides in from the right and clicks on 'save' (shutter flash on the card, not neon); a commit card (mono short hash, 'save progress', avatar dot) prints out of the camera on 'commit' and lands on the paper. Zoom 1.2 on the print.

**A05a** · f 400-486 (87) · beat A05 · anchor "It's a snapshot" · It's a snapshot of every file in your project,
- The commit card enlarges to show the same file tree inside it (a photo of the folder); each file line ticks one per spoken word. Zoom 1.3 on the print.

**A05b** · f 487-544 (58) · beat A05 · anchor "linked to the" · linked to the one before it.
- A second, slightly older commit card slides in from the left; a 7 px wire draws from it to the new one, hollow nodes at both ends (WireNode). Camera tracks the wire tip.

**A06a** · f 545-621 (77) · beat A06 · anchor "Line them up" · Line them up, and that's your app's timeline.
- CommitStrip: five commit cards line up left to right on one long wire with a node each (one lands per spoken word), the wire extends off the right edge; caption 'timeline' bold italic 96 px. Camera pull back to 0.9 as the line grows.

**A07a** · f 622-679 (58) · beat A07 · anchor "So when a" · So when a prompt breaks something,
- A black chat bubble 'add dark mode' pops above the last commit card; that card gets a crack web (ShatterOverlay) and tilts. Hold drifts, zoom 1.15 on the crack.

**A07b** · f 680-795 (116) · beat A07 · anchor "you tell Claude" · you tell Claude to go back to the last version that worked.
- A Claude chip and a terminal card (TerminalCard, white bezel) pop in under the wire; the prompt types 'go back to the last version that worked' as the words are said; a hollow ring marker slides back along the wire two nodes and lands on an intact card, which lifts; the cracked card fades to grey. Camera follows the marker (follow, 4 frames lag).

**A08a** · f 796-872 (77) · beat A08 · anchor "But that timeline" · But that timeline only lives on your laptop.
- The laptop cut-out (laptop.png) rises from below; the whole wire with its cards shrinks into the laptop's screen (an inset of the timeline on the screen). Camera tracks down onto the laptop.

**A08b** · f 873-920 (48) · beat A08 · anchor "If that dies" · If that dies, it's gone.
- The laptop screen goes dark grey, a crack web runs over it (ShatterOverlay), and the laptop sinks 60 px with the tiny timeline crumbling to dust on 'gone'. Hold drifts.

**A09a** · f 921-978 (58) · beat A09 · anchor "So you push" · So you push it to GitHub,
- A 7 px dashed arrow draws upward from the laptop to a charcoal GitHub slab that drops in at the top of the safe box; commit cards fly up along the arrow (one per word) and stack under the slab. Camera follows the cards up.

**A09b** · f 979-1036 (58) · beat A09 · anchor "and the whole" · and the whole history lives online.
- The timeline wire redraws inside a white card under the GitHub slab, all five cards back on it; a white pill with an ink rim reading 'online' sets down on the card. Zoom 1.15 on the card.

**A10a** · f 1037-1142 (106) · beat A10 · anchor "Grabbing a tool" · Grabbing a tool from there does the same thing in reverse.
- The dashed arrow flips direction (a second arrow draws down from the GitHub card to a second laptop that rises at the bottom right); a small tool card (a repo card with a wrench icon chip) sits in the GitHub card. Camera tracks down the arrow.

**A10b** · f 1143-1219 (77) · beat A10 · anchor "Cloning copies its" · Cloning copies its entire timeline onto your computer.
- The GitHub card's wire and cards duplicate (copies peel off, one per word) and travel down the arrow into the second laptop's screen; a 'clone' word chip pops. Camera follows the copies.

**A11a** · f 1220-1335 (116) · beat A11 · anchor "Want to try" · Want to try a new feature without risking the version that works?
- Back on the timeline card: a tick chip pops on the last node ('works'); a second wire starts to fork off the last node at 30 deg but stops short (a dashed stub) with a hollow node at its tip. Zoom 1.2 on the fork point.

**A11b** · f 1336-1422 (87) · beat A11 · anchor "Make a branch" · Make a branch, a second timeline that splits off.
- The branch wire draws solid along the diagonal with two new commit cards of its own (one per spoken 'branch' / 'timeline'); a 'branch' word chip pops at the fork. Camera tracks the branch tip.

**A12a** · f 1423-1519 (97) · beat A12 · anchor "If it turns" · If it turns out well, you merge it back in.
- The branch wire curves back into the main wire; a merge node pops where they meet, a 'merge' word chip beside it, the merged card lands on the main line. Camera follows the curve.

**A12b** · f 1520-1567 (48) · beat A12 · anchor "If not, you" · If not, you delete it.
- Scissors cut-out (scissors.png from ep06) comes in from the right, blades straddle the branch wire, open and close, the cut opens behind the tips, and the cut-off branch with its cards drops off the bottom. Hold drifts.

**A13a** · f 1568-1741 (174) · beat A13 · anchor "And when a" · And when a version is solid, tag it, like v1, so you can come back to it anytime.
- A photoreal paper tag (paper-tag.png, blank cardboard tag on a string) swings down onto the last main node and reads 'v1' in Inter 800; the node ring thickens; a curved dashed arrow from the end of the wire back to the tag ('come back'). Zoom 1.35 on the tag.

**A14a** · f 1742-1876 (135) · beat A14 · anchor "If you're new" · If you're new to building with AI, just tell Claude to commit and push.
- The Claude chip and the terminal card come forward; the prompt types 'commit and push'; two word chips 'commit' and 'push' pop on a short wire above the terminal. Camera back towards identity.

**A14b** · f 1877-1934 (58) · beat A14 · anchor "It runs the" · It runs the commands for you.
- Inside the terminal, two mono lines appear with a tick each (git commit, git push) as they are said; the robot (robot.png) rises at the right of the terminal and nods. Zoom 1.1.

**A15a** · f 1935-2089 (155) · beat A15 · anchor "Comment COMMIT and" · Comment COMMIT and I'll send you the exact prompts to set up GitHub with Claude Code.
- CTA: the robot (robot.png) rises centre with its contact shadow, blinks, tilts its head; a white paper speech bubble pops out with COMMIT (200 px); 'Comment' above (70 px); the promise caption under it; the guide mock (guide-mock-github.png) turns in at the bottom (PageTurn). One hit on COMMIT. YouTube cut: the bubble reads SUBSCRIBE, no comment, keyword, guide or DM anywhere.

**A15x** · f 2093-2132 (40) · beat CTA · (tail hold, no words)
- The CTA scene holds and drifts; the robot blinks once more. Nothing new on the CTA.

### B: H2 fear of loss + Body B the routine

Provisional total: 2096 frames (69.9 s) at 3.1 words per second. The real frames come from the voice word timings (INFRA regenerates the timeline). In the combos this hook runs in front of the other two bodies and this body behind the other two hooks (see Hand-offs).
#### Hook group `HB` (H2 fear of loss)

**HB1** · f 0-57 (58) · beat HB · anchor "If you're building" · If you're building apps with AI
- The laptop cut-out (laptop.png) rises from below with the floating shadow; a phone mock (DeviceFrame) stands on its right showing a plain to-do app card (three rows, a tick each, black ink, no brand); a Claude chip pops on the laptop's lid. Camera push 4%.

**HB2** · f 58-105 (48) · beat HB · anchor "and you're not" · and you're not using GitHub,
- A GitHub chip pops onto a wire above the laptop and goes grey; a thick black strike bar draws across it left to right (the bar really crosses the chip). Camera tracks right onto the chip.

**HB3** · f 106-134 (29) · beat HB · anchor "one bad prompt" · one bad prompt
- A black chat bubble pops from the laptop reading 'add dark mode' (ChatBubble); the phone mock's app card shows a crack web (ShatterOverlay, black ink) spreading from the corner. Hold drifts.

**HB4** · f 135-192 (58) · beat HB · anchor "can wipe out" · can wipe out everything you made.
- The eraser cut-out (eraser.png from ep07) sweeps across the phone and the file cards behind it left to right; everything it passes fades to pale grey paper and crumbles (one card per word). HAND-OFF (the pause after 'made.'): the laptop and the grey remains shrink and flip onto the body's first card at (540, 890), full size on the last hook frame; which card depends on bodyOf(variant).

#### Body group `BodyB` (Body B the routine)
Body starts at f 205 (12 frames of pause after the hook; the hand-off target: the Claude Code terminal card).

**B01a** · f 205-243 (39) · beat B01 · anchor "Here's the exact" · Here's the exact routine.
- FIRST CARD (the hand-off target, fully visible on frame 0): a terminal card (TerminalCard, white bezel, 860 x 560) showing an empty Claude Code prompt line with a blinking cursor and a title bar; a Claude chip on its top left corner; a numbered paper strip (1 2 3 4, hollow nodes on a wire) under it. Caption 'exact routine' bold italic. Camera identity.

**B01b** · f 244-398 (155) · beat B01 · anchor "Before you build" · Before you build anything, tell Claude to set up Git and connect the project to GitHub.
- The prompt types 'set up git and connect this project to GitHub' as the words are said; a Git chip and a GitHub chip pop onto the wire beside the terminal, a 7 px wire draws between them. Zoom 1.15 on the typing; node 1 fills.

**B02a** · f 399-504 (106) · beat B02 · anchor "It creates the" · It creates the repo and saves the first version for you.
- A repo card (white card, GitHub chip, 'my-app' in mono, a file tree) pops above the terminal; a first commit card prints under it on a new wire. Camera tracks up to the repo card.

**B03a** · f 505-581 (77) · beat B03 · anchor "Then, every time" · Then, every time something works, you say commit.
- The prompt types 'commit'; the phone mock (DeviceFrame, the to-do app) on the left gets a tick; a commit card pops onto the wire next to the first one. Node 2 fills. Camera tracks right along the wire.

**B03b** · f 582-716 (135) · beat B03 · anchor "That stores a" · That stores a snapshot of your whole project with a note on what changed.
- The new commit card enlarges: the file tree inside it (one line per spoken word) and a note line 'add login page' in mono. Zoom 1.3 on the card.

**B04a** · f 717-803 (87) · beat B04 · anchor "Next, say push" · Next, say push, and that save lands on GitHub,
- The prompt types 'push'; the commit card flies up a 7 px dashed arrow into a charcoal GitHub slab at the top of the safe box and lands in a card under it. Node 3 fills. Camera follows the card up.

**B04b** · f 804-890 (87) · beat B04 · anchor "so your work" · so your work survives even if your laptop doesn't.
- The laptop cut-out (laptop.png) at the bottom cracks (ShatterOverlay) and sinks below the paper; the GitHub card with the commit stays, a white pill with an ink rim reading 'safe' sets down on it. Hold drifts.

**B05a** · f 891-987 (97) · beat B05 · anchor "When a prompt" · When a prompt breaks your app, don't argue with it.
- A chat bubble 'add dark mode' pops; the phone mock's app card cracks; two more bubbles 'fix it' and 'no, fix it properly' stack up and a thick black bar strikes through both on 'argue'. Zoom 1.15.

**B05b** · f 988-1142 (155) · beat B05 · anchor "Tell Claude to" · Tell Claude to go back to the last commit that worked, and you're there in seconds.
- The prompt types 'go back to the last commit that worked'; a hollow ring marker slides back one node on the wire; the cracked app card is swapped for a clean one (slides in from the left, the cracked one slides out); a small clock chip ticks three seconds. Camera follows the marker.

**B06a** · f 1143-1239 (97) · beat B06 · anchor "Want to test" · Want to test a risky idea? Ask for a branch.
- The prompt types 'make a branch for dark mode'; a branch wire forks off the last node at 30 deg with a 'branch' word chip at the fork. Node 4 fills. Zoom 1.2 on the fork.

**B06b** · f 1240-1355 (116) · beat B06 · anchor "Claude builds it" · Claude builds it on the side, and what already works stays untouched.
- Two commit cards land on the branch wire (the robot sprite types beside them); the main wire's last node gets a tick chip ('works') and does not move; a 'untouched' pill sets down on the main line. Camera tracks the branch.

**B07a** · f 1356-1471 (116) · beat B07 · anchor "If you like" · If you like the result, merge it back into the main version.
- The branch curves back into the main wire; a merge node pops with a 'merge' word chip; the dark-mode card lands on the main line. Camera follows the curve.

**B07b** · f 1472-1568 (97) · beat B07 · anchor "If you don't" · If you don't, delete the branch and nothing else changes.
- Scissors (scissors.png) straddle the branch wire, open, close, the cut opens, the cut-off branch drops off the bottom; the main wire and its tick stay exactly where they were (the camera holds on them). Hold drifts.

**B08a** · f 1569-1752 (184) · beat B08 · anchor "And when a" · And when a version is ready to show people, tag it v1, so you can always find it again.
- The paper tag (paper-tag.png) swings onto the last main node reading 'v1'; three person icon chips pop at the right ('people'); a drawn magnifier passes over the wire and stops on the tag. Zoom 1.35 on the tag.

**B09a** · f 1753-1791 (39) · beat B09 · anchor "That's the whole" · That's the whole habit.
- Text-only beat: 'That's the whole habit.' at 120 px; the numbered strip (1 2 3 4, all filled) slides up under it. Camera back to identity.

**B09b** · f 1792-1897 (106) · beat B09 · anchor "Commit, push, branch" · Commit, push, branch and tag, and the AI types every command.
- Four word chips pop one per spoken word onto a wire ('commit', 'push', 'branch', 'tag'); under them the terminal card shows four mono lines typing (git commit, git push, git switch -c, git tag v1) with a tick each; the robot nods beside the terminal. Zoom 1.1.

**B10a** · f 1898-2052 (155) · beat B10 · anchor "Comment COMMIT and" · Comment COMMIT and I'll send you the exact prompts to set up GitHub with Claude Code.
- CTA: the robot (robot.png) rises centre with its contact shadow, blinks, tilts its head; a white paper speech bubble pops out with COMMIT (200 px); 'Comment' above (70 px); the promise caption under it; the guide mock (guide-mock-github.png) turns in at the bottom (PageTurn). One hit on COMMIT. YouTube cut: the bubble reads SUBSCRIBE, no comment, keyword, guide or DM anywhere.

**B10x** · f 2056-2095 (40) · beat CTA · (tail hold, no words)
- The CTA scene holds and drifts; the robot blinks once more. Nothing new on the CTA.

### C: H3 the words + Body C what goes wrong without it

Provisional total: 1933 frames (64.4 s) at 3.1 words per second. The real frames come from the voice word timings (INFRA regenerates the timeline). In the combos this hook runs in front of the other two bodies and this body behind the other two hooks (see Hand-offs).
#### Hook group `HC` (H3 the words)

**HC1** · f 0-38 (39) · beat HC · anchor "Everyone building with" · Everyone building with AI
- Three robot sprites at small laptops pop into a row (one per word), a Claude chip on each lid, on a 7 px wire that draws under them. Camera push 4%.

**HC2** · f 39-96 (58) · beat HC · anchor "keeps saying commit" · keeps saying commit, push and branch.
- Black chat bubbles pop from the robots on the spoken words: 'commit', 'push', 'branch' (ChatStack); each word also lands as a white word chip (white button, black Inter 800) on a second wire above the row. Camera tracks along the chips.

**HC3** · f 97-144 (48) · beat HC · anchor "This is what" · This is what those words
- The three word chips slide to the centre and enlarge (110 px type), the robots shrink back; a hollow node pops under each chip. Camera pull back to 0.94 then settles.

**HC4** · f 145-163 (19) · beat HC · anchor "actually mean" · actually mean.
- The three chips flip over in 3D to show a tiny solid icon each (an instant camera for commit, an up arrow for push, a forked wire for branch). HAND-OFF (the pause after 'mean.'): the chips shrink and flip onto the body's first card at (540, 890), full size on the last hook frame; which card depends on bodyOf(variant).

#### Body group `BodyC` (Body C what goes wrong without it)
Body starts at f 176 (12 frames of pause after the hook; the hand-off target: the laptop with one app card on its screen).

**C01a** · f 176-204 (29) · beat C01 · anchor "Here's the problem" · Here's the problem.
- FIRST CARD (the hand-off target, fully visible on frame 0): the laptop cut-out (laptop.png) centre with a single app card (the to-do app, white, with its file tree peeking behind) on its screen, a white pill with an ink rim reading '1 copy' on the lid; the text beat 'Here's the problem.' at 110 px above it. Camera identity, hold drifts.

**C01b** · f 205-388 (184) · beat C01 · anchor "Most people building" · Most people building with AI have one copy of their app, on one laptop, and every request rewrites it.
- A row of robot sprites pops behind the laptop (one per word for 'most people'); on 'one copy' / 'one laptop' the pill and a 'one laptop' pill bob; chat bubbles pop in sequence ('add a login', 'change the colours', 'add dark mode') and each one reshuffles the file tree lines on the app card. Zoom 1.2 on the screen.

**C02a** · f 389-553 (165) · beat C02 · anchor "So a prompt" · So a prompt breaks something, and there's no way back to the version from an hour ago.
- The app card cracks (ShatterOverlay); a clock chip pops beside the laptop and winds back one hour; a dashed-outline ghost card appears behind the app and fades to nothing; a thick black bar strikes across the ghost ('no way back'). Camera tracks to the clock.

**C03a** · f 554-659 (106) · beat C03 · anchor "Or the laptop" · Or the laptop dies, and the whole project goes with it.
- The laptop screen goes dark grey, a crack web runs over the lid, and the laptop sinks below the paper taking the app card and file tree with it (they tilt and slide down together). Hold drifts, slight pull back.

**C04a** · f 660-688 (29) · beat C04 · anchor "GitHub fixes both" · GitHub fixes both.
- A charcoal GitHub slab drops in centre with its thick bottom edge; two white pills 'broken prompt' and 'dead laptop' pop either side and get a black tick each. Camera push 6%.

**C04b** · f 689-853 (165) · beat C04 · anchor "Every commit is" · Every commit is a snapshot of your entire project, so a bad prompt is one step back.
- A timeline wire with five commit cards draws under the slab (CommitStrip), each card showing a tiny file tree; a chat bubble 'add dark mode' pops and the last card cracks; a hollow ring marker steps back exactly one node ('one step back') and the cracked card fades. Camera follows the marker.

**C05a** · f 854-969 (116) · beat C05 · anchor "Push sends that" · Push sends that history online, so a dead computer costs you nothing.
- A 7 px dashed arrow draws up from a laptop cut-out at the bottom to the GitHub slab; the commit cards fly up along it and stack in a white card under the slab; the laptop below cracks and sinks while the cards stay; a 'nothing' pill with a struck-through coin icon sets down. Camera follows the cards up.

**C06a** · f 970-1134 (165) · beat C06 · anchor "And when a" · And when a version is solid, tag it v1, so you can always get back to it.
- The paper tag (paper-tag.png) swings onto the last node reading 'v1'; a curved dashed arrow draws from the wire's end back to the tag. Zoom 1.35 on the tag.

**C07a** · f 1135-1250 (116) · beat C07 · anchor "A branch gives" · A branch gives a risky idea its own copy to play in.
- A branch wire forks off the last node at 30 deg; a second small app card pops on the branch with a chat bubble 'try dark mode'; a 'branch' word chip at the fork. Camera tracks the branch tip.

**C07b** · f 1251-1405 (155) · beat C07 · anchor "If it works" · If it works out, you merge it in, and if it flops, you throw it away.
- Part 1: the branch curves back into the main wire with a merge node and a 'merge' chip. Part 2 (from 'and if it flops'): a second branch forks, the scissors (scissors.png) straddle it, open, close, and the cut-off piece drops off the bottom. Camera follows each action.

**C08a** · f 1406-1473 (68) · beat C08 · anchor "You don't type" · You don't type any of this yourself.
- The terminal card (TerminalCard, white bezel) rises; the robot (robot.png) sits at its keyboard side and types (small arm bob); a 'you' person chip with a struck-through keyboard icon pops at the left. Camera back towards identity.

**C08b** · f 1474-1608 (135) · beat C08 · anchor "Tell Claude to" · Tell Claude to commit, push or make a branch, and it runs the commands.
- A Claude chip pops on the terminal; the prompt types 'commit, push, make a branch'; three mono lines appear below with a tick each (git commit, git push, git switch -c idea) on the spoken words. Zoom 1.15 on the terminal.

**C09a** · f 1609-1734 (126) · beat C09 · anchor "It's free, and" · It's free, and over two hundred and twenty-five million developers work this way.
- A white pill 'free' with an ink rim stamps onto a GitHub card; a 130 px black counter stamps up to 225M+ beside it while a SpriteGrid of robot sprites fills under it (one per spoken word); a GitHub chip lands at the end of the row with a tiny blip. Pull back to 0.9 for the grid.

**C10a** · f 1735-1889 (155) · beat C10 · anchor "Comment COMMIT and" · Comment COMMIT and I'll send you the exact prompts to set up GitHub with Claude Code.
- CTA: the robot (robot.png) rises centre with its contact shadow, blinks, tilts its head; a white paper speech bubble pops out with COMMIT (200 px); 'Comment' above (70 px); the promise caption under it; the guide mock (guide-mock-github.png) turns in at the bottom (PageTurn). One hit on COMMIT. YouTube cut: the bubble reads SUBSCRIBE, no comment, keyword, guide or DM anywhere.

**C10x** · f 1893-1932 (40) · beat CTA · (tail hold, no words)
- The CTA scene holds and drifts; the robot blinks once more. Nothing new on the CTA.
