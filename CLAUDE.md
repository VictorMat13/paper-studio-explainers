# Paper Studio explainers: instructions for Claude Code

## First: is setup done?

Check whether `.setup-complete` exists in this folder.

- **If it does not exist, run the setup walkthrough in `SETUP.md` now**, before anything else, even if the user asked for something different. Tell them in one line that setup comes first, then lead them through it one step at a time, checking each step. Create `.setup-complete` when it passes.
- Never ask for an API key in chat and never print one. Keys go in `.env`, typed by the user.

## Before you build anything

1. Read `skills/paper-studio/SKILL.md` and `skills/explainer-videos/SKILL.md` in full.
2. Study every video in `reference-videos/` frame by frame: extract frames with ffmpeg (`ffmpeg -i <video> -vf fps=2 out/ref/%04d.jpg`) and look at them. Match the references, not your own defaults.
3. Read the worked example: `episodes/ep08-github/` (script, storyboard, builder contract, style notes) and its code in `src/ptp08/`. The kit is `src/paperstudio/` (start with its `README.md`).

## Rules that do not bend

- Order of work: 5 hooks, stop for a pick; script, stop for approval; storyboard; build on a provisional timeline while the voice is generated; word timings; regenerate the timeline; stills; previews; finals.
- Voice comes from the user's own clone through `tools/voice.py`. Natural speed only: never speed up, time-stretch or pitch-shift a voice take. Tighten silence with clean cuts.
- Render one thing at a time, always with `--concurrency=1`. Never run two renders together.
- Readable content stays inside the Instagram safe box: x 65 to 1015, y 269 to 1248.
- Real official logos and real captures only. Only verified numbers on screen.
- No em dashes or en dashes in any on-screen text, script or caption. No "follow me" asks; the CTA is "Comment KEYWORD and I'll send you ...".
- Show stills before rendering a full video, and watch every render end to end before calling it done.
- A new episode gets its own `episodes/<name>/` folder and `src/ptp<NN>/` code folder, copied from ep08. Do not edit the kit's existing exports; add new files.
