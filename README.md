# Paper Studio explainers

> **Start here:** clone the repo, run `bash install.sh`, then type `claude` in the folder. Claude Code reads [`CLAUDE.md`](CLAUDE.md) and walks you through the rest step by step: installing, connecting Fish Audio or ElevenLabs, cloning your voice and making your first video. The full walkthrough is [`SETUP.md`](SETUP.md).

Paper Studio is Victor Matevski's faceless 9:16 explainer format: physical objects on a lit sheet of grid paper, photoreal cut-outs with soft shadows, real logos in white button chips, word-by-word captions, a smooth tracking camera and a light CRT pass. The videos are built in Remotion by Claude Code and voiced by an AI clone of the creator's own voice.

This repo is the whole system: the style guide, the production pipeline, the Remotion kit, one complete episode as a worked example, the tools, and finished videos to study.

**Your voice is not included, and neither is Victor's.** You connect your own Fish Audio or ElevenLabs account during setup.

## What's inside

| Path | What it is |
|---|---|
| [`SETUP.md`](SETUP.md) | The step-by-step setup. Claude runs it with you on first launch. |
| [`CLAUDE.md`](CLAUDE.md) | Instructions Claude Code loads on its own in this folder. |
| [`skills/paper-studio/`](skills/paper-studio) | The style: ground and grid, objects and depth, captions, camera, motion, sound, covers, hard rules. |
| [`skills/explainer-videos/`](skills/explainer-videos) | The format: episode shape, script rules, order of work, pipeline commands, voice lessons. |
| [`skills/paper-studio-setup/`](skills/paper-studio-setup) | The setup skill (connect Fish Audio or ElevenLabs, clone your voice). |
| [`reference-videos/`](reference-videos) | Finished videos and covers. **Study these before building anything.** |
| [`src/paperstudio/`](src/paperstudio) | The Remotion kit: ground, CRT pass, paper cards, logo chips, cut-outs, captions, camera, lists, graphs and more. Its [`README.md`](src/paperstudio/README.md) documents every component. |
| [`src/ptp08/`](src/ptp08) | The worked example: episode 8, "What actually is GitHub", 3 hooks x 3 bodies, with covers. |
| [`episodes/ep08-github/`](episodes/ep08-github) | That episode's script, storyboard, builder docs, word timings and tools. |
| [`tools/`](tools) | `voice.py` (check, clone, say for either provider), `word_timings.py`, `repeat_check.py`, `qa.sh`. |
| [`public/`](public) | Assets the compositions use: logos, photo cut-outs, page captures. |

## Setup in short

You need Node.js 18+, ffmpeg, Python 3.9+, git and [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/VictorMat13/paper-studio-explainers.git
cd paper-studio-explainers
bash install.sh        # npm install, links the skills, creates .env
claude                 # Claude walks you through the rest
```

The walkthrough covers:

1. Checking the basics and rendering a test still.
2. Choosing a voice provider.
3. Creating the API key and adding it to `.env` (you paste it yourself; Claude never sees it).
4. Recording a clean sample and cloning your voice.
5. A first test line in your voice, and word timings with Whisper.

Voice commands once you are set up:

```bash
python3 tools/voice.py check                           # is my key working, what voices do I have
python3 tools/voice.py clone my-sample.wav --name "Me" # make my clone, save its id to .env
python3 tools/voice.py say "Hello there." out/test.wav # speak a line with it
```

Switch between Fish Audio and ElevenLabs by changing `VOICE_PROVIDER` in `.env`.

## Run the example

```bash
npm run dev                                   # Remotion Studio with the episode and the kit demos
npx remotion still  src/ptp08/entry.tsx GithubEp08 out/f400.png --frame=400 --concurrency=1
npx remotion render src/ptp08/entry.tsx GithubEp08 out/A.mp4 --props='{"variant":"A","mute":true}' --concurrency=1
```

Variants: `A B C AB AC BA BC CA CB` (hook letter first: `AB` is hook A on body B) and the YouTube Shorts cut of each (`AYT` and so on). The example renders silent because its voiceover is not shipped. The finished versions with voice, music and sound are in `reference-videos/`.

Render one thing at a time, always with `--concurrency=1`.

## Make a video

Start Claude Code in this folder and paste:

> Read skills/paper-studio/SKILL.md and skills/explainer-videos/SKILL.md, and study every video in reference-videos/ frame by frame before you write any code. Then write me 5 hooks for a 60 second explainer about [your topic] and stop for my pick.

From there the order is always the same:

1. Hooks, then you pick.
2. Script, then you approve it.
3. Storyboard.
4. Graphics built on a provisional timeline while your voice is generated.
5. Word timings, timeline regenerated so every cut lands on a word.
6. Stills, previews, fixes.
7. Final renders, one per hook, for Instagram and for YouTube Shorts.
8. Covers.

`skills/explainer-videos/references/pipeline.md` has the command for every step.

## Rules that keep it looking right

- Use the references. Claude only nails the look when it studies the finished videos first.
- One light from the top left; every shadow falls down-right. Nothing glows, nothing is neon, nothing is empty.
- Solid grid, 135 px cells, 3 px lines. No colour fringe on the CRT pass.
- Fill the Instagram safe box (x 65 to 1015, y 269 to 1248) and keep readable things inside it.
- 30 fps, no shot over 45 frames, something moving in every frame, no springs or overshoot.
- Real official logos and real captures only. Only verified numbers on screen.
- Natural-speed voice. Never speed a take up; tighten silence with clean cuts.
- No em dashes in on-screen text. No "follow me" asks.

## What is not here

- Any voice, voiceover file or API key.
- Other people's reference footage. [`skills/paper-studio/references/SOURCES.md`](skills/paper-studio/references/SOURCES.md) links to it and explains what was learned from it.
- Music and sound effects. Bring your own licensed tracks.
- Posting and DM automation. That part is your own stack.

## Related

- The CRT style used for episodes 1 to 3: https://github.com/VictorMat13/crt-remotion

## License

Code is MIT ([`LICENSE`](LICENSE)). Logos, product marks and page captures belong to their owners. The finished videos in `reference-videos/` and the voice in them are Victor Matevski's, included for study only.
