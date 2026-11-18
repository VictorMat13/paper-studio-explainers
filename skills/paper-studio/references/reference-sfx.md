# Reference SFX catalogue: InsiderForce JCode short (enFgYQvI1dM)

Written 2026-10-30 by the SFX agent (Opus 5.5).

## How this was measured

- Source: `reference/insiderforce-jcode-enFgYQvI1dM.mp4` (78.6 s, AAC 48 kHz stereo).
- Separated with demucs (htdemucs, CPU, scratch venv) into vocals, drums, bass and other. The SFX land in the drums stem (hits, thumps, clicks) and the other stem (long swooshes with a tonal shimmer). Cross-checked with the stereo side channel (L minus R, where the stereo SFX and music sit and the mono voice does not) and mlx_whisper word timings.
- Music kicks were told apart from SFX by shape: the kicks hit instantly (attack under 0.03 s), last about 0.1-0.2 s and are pure sub (120-500 Hz band 11-27 dB under the sub). The SFX thumps swell in over about 0.15 s, last about 0.3 s and carry as much 120-500 Hz as sub. Every SFX lines up with a visual event in the 3 fps grids and the breakdown.
- "Level vs voice" = loudest 50 ms RMS of the SFX (120 Hz high-pass, both measured on the separated stems) minus the voice's typical loud 50 ms RMS (80th percentile). It is a rough loudness ratio, good to about 2 dB. Sub-heavy hits read louder here than they sound.
- Timing is the sound's loudest point, about +/- 0.03 s.

## Every cue

| # | Time (s) | Type | Length (s) | Level vs voice (dB) | On screen |
|---|---|---|---|---|---|
| 1 | 0.13 | Boom: deep sub whoosh-hit, no highs | 0.46 | +3.4 | Cursor chip pops onto the line, checkout card rises |
| 2 | 0.71 | Click: tiny high tick (all energy above 2 kHz) | 0.06 | -13.5 | Cursor chip settles |
| 3 | 1.57 | Boom (instant attack, sub plus low mids) | 0.12 + tail | +4.4 | Codex chip pops, ChatGPT card swaps in |
| 4 | 2.70 | Click | 0.03 | -15.6 | Codex chip settles |
| 5 | 3.27 | Boom | 0.13 + tail | +2.1 | Claude chip pops, Claude Max card swaps in |
| 6 | 5.09 | Boom, softer, swells in | 0.29 | -5.9 | Chip line slides up out of frame, card stack lifts |
| 7 | 10.24 | Big swoosh: airy swell with a glassy tonal shimmer on top | 0.78 | -7.3 | Tiny GitHub repo card appears and grows |
| 8 | 11.20 | Thump: short soft sub whoosh | 0.26 | -5.3 | Hard cut to the big cropped GitHub card |
| 9 | 12.00 | Thump | 0.29 | -6.1 | Card shifts up, caption block starts |
| 10 | 14.78 | Big swoosh | 0.61 | -9.8 | Human hand and robot hand slide in |
| 11 | 18.27 | Thump | 0.39 | -7.7 | Camera tilt lands, "that layer handles" header and icon list start |
| 12 | 22.16 | Thump | 0.28 | -5.9 | Icon list scrolls off, scene moves back up |
| 13 | 22.90 | Pop/swish: short bright air swish | 0.24 | -8.7 | Dashed arrow reaches the teal harness icon, icon pops |
| 14 | 27.89 | Thump | 0.28 | -6.4 | Blur transition |
| 15 | 30.50 | Thump | 0.36 | -7.6 | New ground (dot grid, ribbons), stat row 1 starts |
| 16 | 32.87 | Blip: very short high tick | 0.05 | -10.4 | Claude logo pops at the end of stat row 1 |
| 17 | 35.85 | Blip: short falling high chirp | 0.14 | -11.2 | Codex mark pops at the end of stat row 2 |
| 18 | 37.67 | Big swoosh | 0.63 | -10.6 | Dark JCode terminal card floats in |
| 19 | 45.23 | Big swoosh | 0.79 | -11.6 | Layout swap: caption up, terminal card down |
| 20 | 48.59 | Thump | 0.34 | -5.4 | Blur transition |
| 21 | 49.39 | Thump | 0.26 | -5.5 | Terminal card grows to fill the width |
| 22 | 57.91 | Big swoosh | 0.62 | -10.8 | GitHub card returns small at the top |
| 23 | 60.90 | Thump | 0.29 | -5.3 | Blur transition into the CTA |
| 24 | 65.06 | CTA hit: thud-whoosh, sub plus low mids | 0.28 | -2.5 | "HUMAN" punches in, ground darkens |
| 25 | 66.22 | CTA hit, softer | 0.40 | -9.5 | Ebook mock slides in |
| 26 | 69.55 | CTA hit, softer | 0.38 | -8.9 | Book opens to the Chapter 1 spread |
| 27 | 70.92 | CTA hit, quiet | 0.29 | -14.4 | Sparkle bullets "A Simple", "Step-by-Step Guide" (approx.) |
| 28 | 73.75 | CTA hit, quiet | 0.25 | -11.9 | Crown mark, "FOLLOWERS" (the follow ask; we do not use it) |

## Distinct types (clips in `reference-clips/`, comparison only, never used in the final)

| Type | Count | Character | Clip |
|---|---|---|---|
| Boom | 4 | Deep sub whoosh-hit, sub and low mids equal, nothing above 2 kHz. The loudest sounds in the whole reel. | `ref-boom-hook-card-swap-0.13s.wav`, `ref-boom-hook-card-swap-1.57s.wav` |
| Click | 2 | Tiny high tick, very quiet | `ref-click-chip-0.71s.wav`, `ref-click-chip-2.70s.wav` |
| Big swoosh | 5 | 0.6-0.8 s airy swell, 0.2-0.3 s rise, sub body plus a tonal shimmer | `ref-swoosh-big-entrance-10.24s.wav`, `ref-swoosh-big-entrance-14.78s.wav` |
| Thump | 9 | 0.3 s soft sub whoosh that swells in over 0.15 s | `ref-thump-transition-18.27s.wav`, `ref-thump-blur-break-27.89s.wav` |
| Pop/swish | 1 | Short bright air swish into the icon | `ref-pop-icon-22.90s.wav` |
| Blip | 2 | Very short high tick or chirp on a logo pop | `ref-blip-logo-pop-32.87s.wav`, `ref-blip-logo-pop-35.85s.wav` |
| CTA hit | 5 | Thump family, a touch brighter, falling in level after the keyword | `ref-cta-hit-keyword-65.06s.wav`, `ref-cta-hit-guide-slide-66.22s.wav` |

## Density and what stays silent

- **Hook (0-5.3 s):** 6 cues, about 1.1 per second. A boom on every chip and card swap, a faint click as two of the three chips settle.
- **End of the hook (5.3-10 s):** nothing. The crack web on "beats all of them" has **no sound at all**, and neither does the "free & opensource" bar wipe. Only the music plays.
- **Body (10-64 s):** 17 cues in 54 s, about one every 3.2 s, and only on scene changes: big swooshes when a new main visual enters (repo card, hands, terminal card, layout swap, card return), thumps on hard cuts, camera moves and every blur break, two tiny blips when a logo pops at a stat row end, one swish on the harness icon.
- **CTA (64-78 s):** 5 cues in about 10 s, the first (the keyword punch) loud, the rest falling.
- **Never a sound on:** word-by-word caption reveals, black bar wipes, the crack, the icon list rows, the counters ticking up (no tick sounds), sparkle bullets, the underline draw, text-only beats, the wide terminal pan, the 3D tilted cards, terminal screenshot state changes. No dings, no risers, no keyboard or mouse sounds.
- **Level shape:** the hook booms are the loudest thing in the reel (louder than the voice in raw RMS because they are sub-heavy; music plus SFX measure -13.0 LUFS against the voice's -14.5 LUFS over 0-5 s). Body SFX sit about 5-12 dB under the voice. Big swooshes are quieter than the thumps.

## Background music (for Victor)

- **Yes, there is music under the whole reel.** About 140 BPM, a trap-style hip-hop beat: a plucky bell or synth melody (300-1000 Hz), sixteenth-note hi-hats from about 5.2 s, 808 bass and kicks from about 10.3 s. The intro (0-5 s) is melody only. Around 64.5 s the drums and hats drop out for the CTA and the bass and melody carry on to the end.
- **Level:** low. Music (with the SFX) measures about -25 LUFS in the body against the voice at about -14.3 LUFS, so roughly 10-11 LU under the voice; in the 5-8.6 s stretch it is about 15 LU under.
- A 6 s sample with almost no SFX: `reference-clips/ref-music-bed-sample-50.5-56.5s.wav`.
