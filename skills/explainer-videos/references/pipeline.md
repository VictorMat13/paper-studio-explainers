# Pipeline commands

All paths are relative to the repo root. `E` is the episode folder (`episodes/<name>`), `NN` the episode number in `src/ptp<NN>/`. The worked example is `episodes/ep08-github` with `src/ptp08`; a new episode copies both and renames them.

## 1. Script

- Write `E/SCRIPT.md`: the hooks, then the body, one spoken line per beat, then an overlay and a caption section. See `episodes/ep08-github/SCRIPT.md`.
- Repeat check: `python3 tools/repeat_check.py "E/SCRIPT.md" --only-spoken`. Fix every REPEAT line, and every NEXT line unless the word is a name or the CTA keyword.
- Voice text: join the spoken lines, write numbers the way they are said, keep the CTA keyword lowercase.

## 2. Storyboard

- `E/storyboard/STORYBOARD.md` lists every shot: id, frame range, anchor phrase, spoken words, what is on screen. It is the source of truth for the shot list. `episodes/ep08-github/tools/gen_storyboard_ep08.py` generated ep08's.
- The storyboard page (HTML) starts from `skills/paper-studio/examples/ep04-jcode/index.html`.

## 3. Voice (setup in SETUP.md, lessons in voice.md)

- Generate takes: `python3 tools/voice.py say --file line.txt E/voice/takes/<line>_t1.wav`, 3 to 4 takes per line, one body and one take per hook.
- Check every word: `python3 tools/word_timings.py take.wav take.words.json`, compared against the script.
- Tighten pauses with clean cuts, never a speed change. Level to -16 LUFS, -1.5 dBTP.
- Copy the final voiceovers to `public/ptp<NN>/vo/<variant>.wav` and the timings to `E/timing/words_<variant>.json`.
- ep08's assembler does all of that for its own takes: `python3 episodes/ep08-github/tools/assemble_vo_ep08.py`.

## 4. Timeline

- `python3 episodes/ep08-github/tools/make_ep08_timeline.py` reads the storyboard and the word timings and writes `src/ptp08/timeline.ts` and `timeline.json`. Every shot is anchored to its first spoken words.
- Before the voice exists it writes a provisional timeline from the storyboard's frame ranges, so the builders never wait for audio. Run it again when the voice lands; the cuts snap to the words.
- Fix every "over 45 frames" warning by moving an anchor or a lead.

## 5. Build and check

All scripts are in `E/dispatch/` and share one render lock, so renders queue instead of colliding.

- Type-check: `npx tsc --noEmit -p src/ptp08/tsconfig.json`
- Stills: `VARIANT=A zsh episodes/ep08-github/dispatch/ptp-stills.sh <name> <frame> [<frame> ...]`
- Half-size silent preview: `VARIANT=A zsh episodes/ep08-github/dispatch/ptp-preview.sh <from> <to> [name]`
- Safe zone: `zsh episodes/ep08-github/dispatch/ptp-safe-veil.sh` draws a red veil over the keep-clear zones.
- Motion and frame checks: `scan_empty_frames.py`, `scan_jerk.py`, `scan_pad_edges.py` in the same folder.
- QA on a finished file: `bash tools/qa.sh <video.mp4>` (black frames, brightness dips, frozen frames).
- Straight Remotion, no scripts:
  ```bash
  npx remotion still  src/ptp08/entry.tsx GithubEp08 out/f400.png --frame=400 --concurrency=1
  npx remotion render src/ptp08/entry.tsx GithubEp08 out/A.mp4 --props='{"variant":"A","mute":true}' --concurrency=1
  ```

## 6. Final renders (one at a time)

- `zsh episodes/ep08-github/dispatch/ptp-render.sh <variant> <out.mp4>` renders with the voiceover and runs the frame QA. `MUTE=1` in front renders silent. It refuses when the voiceover for that variant is missing, which is the case for ep08 as shipped (the voice is not included), so use `MUTE=1` until you have generated your own.
- Output goes to `E/graphics/finals/`, named by the hook's opening words: `<hook words> (<version>, Instagram, 9x16).mp4` and `(..., YouTube Shorts, 9x16).mp4`.
- Covers: `src/ptp08/covers/` (one still composition, one cover per hook).
- Watch every final end to end before delivering it.
