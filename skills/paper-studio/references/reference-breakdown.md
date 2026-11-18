# Reference breakdown: InsiderForce, JCode short (enFgYQvI1dM)

78.6 s, 360x640, 30 fps. Studied at 1 fps (sheet1-3) and 3 fps (scratch grids). Times are approximate to about 0.3 s.

## Constants across the whole reel

- **Ground:** flat off-white (about #F3F3F3) with a soft dark vignette in the corners. From 30 s it gains a faint dot/cross grid and big soft grey "swoosh" ribbons that bleed off the top and bottom edges. The CTA section shifts to a slightly darker grey gradient.
- **Watermark:** "insiderforce.io" in very light grey, bold, low centre (about y 80% of frame). Never moves.
- **Kinetic captions** carry the whole script. Each word enters on its spoken syllable: light grey, about 4-6 px low and slightly right, a touch of blur, then settles into place and darkens to near-black over about 6-8 frames. Lines stack and re-centre as words land. Weights mix in one block: small regular connector words, then the key phrase in **bold italic** about 1.6x bigger ("beats all of them", "Middle Layer", "Harness", "you need to know", "most powerful"). Some phrases land in a solid black bar with white text that wipes in left to right ("free & opensource", "before anything else", "when you need it"). Some land in bold upright ("GETS GOOD", "Completely Human", "Slow Down").
- **Cards:** screenshots as crisp paper cards, radius about 12 px, a big soft drop shadow offset down-right, often a stack of 2-3 sheets behind (white edges peeking out to the right), with a slight 3D tilt.
- **Transitions:** most cuts are hard cuts on a word. Section breaks use a whole-frame Gaussian blur with a grey vignette darkening for about 6-10 frames (at 28.0, 30.2, 48.0, 60.6 s).
- **Pace:** something changes every 8-15 frames. No frame is static: cards drift and push in slowly even while text is reading.

## Beat by beat

| Time | Spoken | On screen | Technique |
|---|---|---|---|
| 0.0-1.6 | "Cursor has a price tag." | Thin black horizontal line at the top. Black Cursor chip pops onto it with label "cursor". The Cursor Pro checkout card ($20.00) floats below. | Logo chip pops with an overshoot scale, line extends right from offscreen. Card rises a few px and settles; shadow grows. |
| 1.6-3.3 | "Codex has a price tag." | Blue Codex chip pops in right of Cursor. ChatGPT Pro card ($100) replaces the Cursor card, with a stack of sheets behind it. | Card swap: new card dissolves in over the old, the stack depth increases by one sheet. Chips string along the line. |
| 3.3-5.0 | "Claude Code has a price tag." | Orange Claude spark chip. Claude Max card ("From $100", black "Try Claude" button). | Same swap. The chip row is now three marks on one line. |
| 5.0-6.3 | "One developer built something that" | The chip line slides up and out of frame. The card stack lifts. Caption starts under the cards. | Upward camera drift, captions word by word. |
| 6.3-8.0 | "beats all of them" | "beats all of them" in big bold italic. A cracked-glass web spreads across the whole card stack from the centre. | Shatter: white crack lines (Voronoi-like cells with black edges) draw outward over about 10 frames. The cards stay in place, cracked. |
| 8.0-10.0 | "and made it completely free and open source." | "and made it completely" then a black bar "free & opensource". | Black bar wipes left to right, white text revealed inside it. |
| 10.0-11.3 | "The tool is called J-Code," | Tiny GitHub repo card (1jehuang/jcode) appears in the centre, very small, then grows. | Scale-up from about 30% with a soft shadow. |
| 11.3-15.0 | "and there is one thing you need to know before anything else." | Hard cut to a big, cropped GitHub card at the top, bleeding off the right edge. Caption below, "you need to know" bold italic, black bar "before anything else". | Slow push-in on the card. Bar wipe on "before anything else". |
| 15.0-17.0 | "Every coding agent has a middle layer between you and the AI." | Photoreal human hand slides in from the left, robot hand from the right, almost touching. A black bracket line with hollow node dots draws between them. Caption "Middle Layer" bold italic. | Cut-outs slide from the edges with contact shadows. Line draws node to node (stroke-dashoffset). |
| 17.0-18.3 | (end of line) | The composition moves down the frame, leaving space at the top. | Camera tilt: the whole scene translates down about 25%. |
| 18.3-22.0 | "That layer handles your prompts, your tools, your memory, and your sessions." | "that layer handles" header, then an icon list, one row per word: Your Prompts, Your Tools, Your Memory, Your Sessions. | Each row: small black icon pops, then the label words reveal. |
| 22.0-23.0 | "It is called" | The list scrolls off the top, the scene moves back up. A dashed, looping arrow draws down from the bracket line to a small glossy teal 3D icon. | Dashed path draw with an arrowhead, icon pops with a bounce. |
| 23.0-28.0 | "a harness, and every tool you are paying for right now built that layer to be slow and heavy." | "Harness" bold italic under the icon. Small caption block below, ending "slow & heavy" in bold. | The hands keep a slow drift. |
| 28.0-28.3 | | Whole frame blurs and darkens. | Blur transition. |
| 28.3-30.0 | "J-Code rebuilt it from scratch in Rust." | Text only, mid frame: "JCode" big bold, "rebuilt it from scratch in rust", an underline draws under it. | Underline draws left to right. |
| 30.0-33.0 | "It is 20 times more memory efficient than Claude Code." | New ground: dot grid and grey swooshes. A stat row: the number counts up "10 times, 17 times, 20 times", then "more memory efficient than" and the Claude spark. | Number counter tick-up, label reveals, logo pops at the row end. |
| 33.0-35.0 | "63 times faster than Codex." | Second row under the first: counts "15, 34, 57, 63 times", "faster than", Codex mark. | Same stat row component. |
| 35.0-37.0 | "But here is where it gets good." | Rows slide up, "but here is where it" small, "GETS GOOD" huge bold caps. | Rows move up as a block to make space. |
| 37.0-40.0 | "J-Code remembers things automatically. No setup. No configuration." | Dark terminal card (the JCode TUI) floats in at the top. Sparkle bullets: "No Setup", "No Configuration". | Card slides in from the left with a slow drift. Each bullet: four-point star pops, label reveals. |
| 40.0-45.0 | "It just learns as you go and pulls up the right information when you need it." | Captions under the bullets, "Right Information" bold, black bar "when you need it". The card shows a side panel opening. | The terminal screenshot changes state under the card (two or three captures). |
| 45.0-48.0 | "You can run multiple sessions at the same time without any slowdown." | Caption moves to the top, the terminal card moves down: the JCode spinning-logo splash, then a swarm view with several agents. "Multiple Sessions" bold, "Slow Down" bold. | Layout swap: text and card trade places. |
| 48.0-48.5 | | Blur transition. | |
| 48.5-50.0 | "And the best part?" | Text only, centre. | |
| 50.0-54.0 | "Agents can bring in their own helpers. One agent runs the show. The others do the work." | A terminal card grows to fill the width, then a very wide strip of three terminal screenshots side by side pans right to left. | Long horizontal pan across a wide card. No captions here, the screen carries it. |
| 54.0-57.0 | "And they all work on the same codebase together without getting in each other's way." | Terminal cards tilted in 3D (perspective, rotated left), sliding. | 3D rotateY on cards with a perspective camera. |
| 57.0-60.6 | "You just got the most powerful free coding agent on the market." | GitHub card small at the top centre, caption below: "most powerful" bold italic, "Free Coding Agent" bold. | Card drifts up. |
| 60.6 | | Blur transition. | |
| 61.0-64.3 | "The only thing left is the guide that makes everything it writes sound completely human." | Text only, near the top: "guide that makes" bold italic, "Completely Human" bold. | |
| 64.3-69.0 | "Comment human, and I'll send you my ebook, They Will Never Know AI Wrote It." | Ground darkens to grey. "Comment" small, "HUMAN" huge bold in quotes. A 3D ebook mock lies tilted on the ground below, then "I'll send you my ebook" and the title. | The book slides in with a soft shadow. The title reveals letter-spaced then tightens. |
| 69.0-73.0 | "A simple step-by-step guide to make AI copies sound 100% human." | The book opens to a "Chapter 1" spread, rotating. Sparkle bullets "A Simple", "Step-by-Step Guide". "100% HUMAN" big. | Open-book mock rotates in 3D. |
| 73.0-78.6 | "Make sure you follow InsiderForce. The system only sends it to followers." | Crown logo mark, "FOLLOWERS" big. Ends on black. | **Not used.** Victor's rules ban the follow ask. |

## What we take into Paper Studio

1. Word-by-word grey-to-black caption reveal, mixed weights, bold italic key phrase, black highlight bar.
2. Logo chips on a line, popping in with the price card swaps.
3. Paper cards with stacked sheets and big soft shadows, slow push-ins.
4. Shatter overlay on "beats all of them".
5. Hand vs robot hand diagram with drawn bracket lines, hollow nodes and a dashed arrow to an icon.
6. Icon bullet list, sparkle bullet list.
7. Stat rows with a counting number and a competitor logo at the end.
8. Dark terminal cards on white, wide terminal strip pan, 3D tilted cards.
9. Blur transitions at section breaks, light watermark low centre.
10. CTA: keyword in big quotes over a tilted 3D mock of the guide.

What we change: their scenes often hold one composition for 3-5 s with only captions moving. Victor's rule caps scenes at 45 frames, so each long hold splits into 2-3 shots (push-in, re-crop, card swap) while keeping their look. Their follow ask is dropped.
