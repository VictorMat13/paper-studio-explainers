---
name: explainer-videos
description: Use when the user asks for an explainer video, a new "Prompt to Post" episode, a faceless reel voiced by their AI voice clone, a CRT motion-graphics reel that walks through how an AI workflow or tool works, extra hook versions of one, a white-grid or black version, re-voicing one with the clone, or says "make another one like the scripting skill video". Trigger even if he only names a topic and "Prompt to Post" or "explainer" in the same breath.
---

# Explainer videos (Prompt to Post)

Faceless 9:16 reels, 55-70 s. Remotion CRT graphics, voiced by your own AI voice clone (Fish Audio or ElevenLabs, see `SETUP.md`). They teach creators how to make better content with AI. Episode 8 (GitHub, `episodes/ep08-github/` and `src/ptp08/`) is the reference build in this repo. Read it, and watch `reference-videos/`, before changing anything.

- **Episode folders:** `episodes/<name>/` in this repo, each with `SCRIPT.md`, `storyboard/`, `voice/`, `timing/`, `dispatch/`, `tools/` and `graphics/`. `episodes/ep08-github/` is the worked example.
- **Code:** `src/ptp<NN>/` for each episode, with its own `entry.tsx`, one composition and a scoped `tsconfig.json`. A new episode copies `src/ptp08/` and keeps the shell, kit and timing helpers. The shared kit is `src/paperstudio/`.
- **Tracking:** keep one row per episode and per idea wherever you track content (Notion, a sheet, a text file). The status moves along Idea, Script, Voice, Graphics, Done.
- **Commands for every step:** `references/pipeline.md`. **Voice setup, settings and known problems:** `references/voice.md`. **First-time setup:** `SETUP.md` at the repo root.

## The episode shape

1. **Hook** (3-5 s), with 4 alternate hooks rendered as separate videos.
2. **Series line**, word for word: "Welcome to Prompt to Post, the series where I teach you how to make better content with AI."
3. **Steps:** 5-8 short beats of "you do X, then Claude does Y", each with real names and numbers.
4. **Payoff:** what the viewer gets now.
5. **CTA**, word for word in this shape: "Comment <KEYWORD> and I'll send you the exact steps to build your own." Never put commas around the keyword.

## Script rules (gate: the script is approved before any voice or graphics)

- **Match the language of the previous episodes before writing a word (Victor, 2026-11-05: "make sure that we're talking the way we do in the past videos").** Read the spoken script of every shipped episode in `episodes/*/SCRIPT.md` and write in that register: "It's called X, and ...", "Here's the problem.", "And here's the clever part.", "Think of it like ...", "So now ...", "And the best part?", short declaratives, contractions, numbers spoken out. No news-anchor words: never "Breaking", "BREAKING", "just in", "alert". A hook adapted from a post or video drops that framing and keeps the fact.
- Show 5 hooks with labeled angles first, and stop for a pick. Save every hook that is kept as an idea in your tracker.
- **Talk to the viewer, a creator making their own content.** "So you can...", "you record...". Never client or agency framing.
- Spoken English: contractions, one idea per breath, numbers written the way they're said. Plain words (12-year-old test). End on the CTA.
- **Never repeat a word** in one sentence or in two sentences back to back. Run `python3 tools/repeat_check.py SCRIPT.md --only-spoken`. Fix every REPEAT line, and every NEXT line unless the word is a name or the CTA keyword.
- Name tools generically when asked to, for example "a scraping tool" instead of the product name.
- **The hook overlay is the end result** the viewer gets, for example "How to make viral scripts with AI". Every hook version uses the same overlay.
- No em dashes or en dashes anywhere. If you have your own brand voice doc, it overrides the register above.

## Graphics rules

- The look is Paper Studio: `skills/paper-studio/SKILL.md`. The builder brief is `episodes/ep08-github/dispatch/BUILDER-CONTRACT.md`; copy and adapt it. (Episodes 1 to 3 used the CRT style: https://github.com/VictorMat13/crt-remotion)
- **Instagram Reels safe zone:** text, cards and key UI stay inside x 65-1015, y 269-1248. Full-screen hook walls and backgrounds may bleed past it.
- **Every frame moves**, and no scene runs over 45 frames. The timeline script warns when one does; fix it by moving an anchor or a lead, never by ignoring the warning.
- **Each alternate hook is its own world**, never a reuse of the main hook's visuals. Each one hands off into the series ident cleanly (ep08 shrinks each hook's main object onto the body's first card).
- Build with Agent Dispatch: one Opus builder per beat or two, then a RED TEAM review, then merge.

## Order of work

script approved → storyboard → beat builds on a provisional timeline, with the voice generated in parallel (never wait for the audio to build or render; Victor 2026-11-02) → word timings → timeline regenerated → stills → full previews → QA and safe-zone veil → final renders (every hook version) → open the graphics folder → update your tracker → guide, comment-keyword automation, music, SFX and captions after the videos are approved.

## Common mistakes

| Mistake | Fix |
|---|---|
| Opening audio with plain `open` | It launches Apple Music. Use `open -a "QuickTime Player" <file>`. |
| The clone sounds like yelling or distorted | See `references/voice.md`. The sample's delivery is the delivery you get; check levels before anyone hears a take. |
| Re-running Whisper on unchanged audio | Timings shift. Merge the old word timings where the audio didn't change. |
| Whisper merges "Prompt to Post" into "Prompt2Post" | Split it into three words before running the timeline script. |
| Commas around the CTA keyword | The clone pauses. Use `<emphasis>` or a small gain lift on the keyword instead. |
| Starting on a breath | Trim the voiceover so the first frame is a word. |
| Rendering in parallel | One render at a time, always through the dispatch scripts (shared lock). |
