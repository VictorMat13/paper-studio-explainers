# Setup walkthrough

This file is the script Claude Code follows the first time you open this folder. You can also read it yourself and do the steps by hand.

**Claude: how to run this walkthrough**

- Run it whenever `.setup-complete` is missing from the repo root, before any other work, even if the user's first message is about something else. Say in one line that setup comes first and takes about 15 minutes.
- Go one step at a time. Explain the step in two or three plain sentences, do the part you can do yourself, tell the user exactly what they need to do (with the link), then wait. Do not dump the whole guide.
- Check every step with the command given before moving on. If a check fails, fix it with the user before continuing.
- **Never ask the user to paste an API key into the chat, and never print one.** They paste keys into `.env` themselves, in their editor. You only run `python3 tools/voice.py check`, which never shows the key.
- Skip steps that are already done (check first). When every step passes, create `.setup-complete` containing today's date and the provider they chose.

---

## Step 1. Check the basics

You need Node.js 18 or newer, ffmpeg, Python 3.9 or newer, and git.

```bash
node -v && ffmpeg -version | head -1 && python3 --version && git --version
```

Missing something on a Mac: install Homebrew from https://brew.sh, then `brew install node ffmpeg python git`. On Windows use WSL or install Node from https://nodejs.org and ffmpeg from https://ffmpeg.org.

## Step 2. Install the project and prove the graphics work

```bash
npm install
npx remotion still src/ptp08/entry.tsx GithubEp08 out/test.png --frame=400 --concurrency=1
```

Open `out/test.png`. You should see a white instant camera and a `my-app` file card on off-white grid paper. If you do, Remotion works on this machine. The first run downloads a headless Chrome, so it takes a minute or two.

To browse everything live: `npm run dev` opens Remotion Studio. The kit demo is `npx remotion studio src/paperstudio/entry.tsx`.

## Step 3. Install the skills

The repo carries three Claude Code skills in `skills/`. Link them so Claude can use them from any folder:

```bash
bash install.sh
```

This links `paper-studio`, `explainer-videos` and `paper-studio-setup` into `~/.claude/skills/` and creates `.env` from `.env.example`. Inside this folder Claude finds everything through `CLAUDE.md` even without the links.

## Step 4. Pick your voice provider

The videos are voiced by a clone of your own voice. Two providers are supported. Pick one; you can switch later by changing one line in `.env`.

| | Fish Audio | ElevenLabs |
|---|---|---|
| Used for the original videos | Yes | Tested, not used for finals |
| Clone sample | 2 to 3 clean clips of 15 to 20 seconds (at least 10 seconds) | 1 to 2 minutes of clean audio |
| Cost model | Pay as you go API credit, separate from the app subscription. A free model exists. | Monthly plan with a character quota. Instant cloning needs Starter or above. |
| Default model here | `s2.1-pro` | `eleven_multilingual_v2` |
| Most expressive model | `drama-3` (takes `[directions]` in brackets) | `eleven_v4` or `eleven_v3` |

If you have no preference, start with Fish Audio: the pipeline docs and lessons in `skills/explainer-videos/references/voice.md` were written against it.

## Step 5a. Connect Fish Audio

1. Make an account at https://fish.audio.
2. Create an API key at https://fish.audio/app/api-keys/ (or https://fish.audio/app/developers/get-started/ and click "Get your API key"). The key is shown once, so copy it straight away.
3. Add API credit at https://fish.audio/app/developers/billing/. API credit is separate from a Fish plan subscription; a new account has none, and paid models answer with error 402 until you add some. To try it at no cost, set `FISH_MODEL=s2.1-pro-free` in `.env`.
4. Open `.env` in your editor and set:
   ```
   VOICE_PROVIDER=fish
   FISH_API_KEY=your key here
   ```
5. Check it:
   ```bash
   python3 tools/voice.py check
   ```
   You should see "Fish Audio key works.", your credit, and your voices.

## Step 5b. Connect ElevenLabs

1. Make an account at https://elevenlabs.io and choose a plan that includes Instant Voice Cloning (Starter or above).
2. Create an API key at https://elevenlabs.io/app/api/api-keys. If you restrict the key, turn on **Text to Speech**, **Voices (read)**, **User (read)**, and, to clone from this repo's tool, **Voices (write)**. An unrestricted key also works.
3. Open `.env` in your editor and set:
   ```
   VOICE_PROVIDER=elevenlabs
   ELEVENLABS_API_KEY=your key here
   ```
4. Check it:
   ```bash
   python3 tools/voice.py check
   ```
   You should see your plan, characters used, and your voices. A key without User (read) still works; the check just can't show the quota.

## Step 6. Record your voice and clone it

The delivery of the sample is the delivery you get. A loud, clipped or over-acted sample makes a clone that sounds like it is yelling.

- Quiet room, a decent mic or your phone held 15 to 20 cm away.
- Speak the way you want the videos to sound: calm, natural, normal volume. Do not perform.
- Nothing may clip. Peaks around -9 dBFS are right. Check with:
  ```bash
  ffmpeg -i my-sample.wav -af astats -f null - 2>&1 | grep -E "Peak level|RMS level"
  ```
- Length: Fish Audio 15 to 30 seconds per clip; ElevenLabs 1 to 2 minutes.
- Name the file simply (`my-sample.wav`), with no commas in the name.

Clone it (this saves the new voice id into `.env` for you):

```bash
python3 tools/voice.py clone my-sample.wav --name "My voice"
```

Or clone on the provider's site (Fish Audio: https://fish.audio/app/voice-cloning; ElevenLabs: Voices, plus icon, Instant Voice Clone) and paste the voice id into `.env` as `FISH_VOICE_ID` or `ELEVENLABS_VOICE_ID`.

Test it:

```bash
python3 tools/voice.py say "Welcome to my first video. This is my cloned voice." out/voice-test.wav
```

Listen to `out/voice-test.wav` (on a Mac: `open -a "QuickTime Player" out/voice-test.wav`). If it sounds wrong, re-record the sample; settings rarely fix a bad sample. More in `skills/explainer-videos/references/voice.md`.

## Step 7. Word timings (the captions follow your voice)

Captions and cuts land on the real word timings of the voiceover, read with Whisper.

- Apple Silicon Mac: `python3 -m pip install mlx-whisper numpy`
- Anything else: `python3 -m pip install openai-whisper numpy`

Check it on the test line:

```bash
python3 tools/word_timings.py out/voice-test.wav out/voice-test.words.json
```

It prints each word with its start and end time.

## Step 8. Optional: the provider's MCP server

Not needed for the pipeline (the tools above use the API directly), but handy for browsing voices from inside Claude Code:

```bash
claude mcp add --transport http fish-audio https://api.fish.audio/mcp
claude mcp add --transport http elevenlabs https://api.elevenlabs.io/v1/mcp
```

Then run `/mcp` inside Claude Code and sign in. Fish bills MCP use like its web app, not from API credit.

## Step 9. Watch the references, then make your first video

1. Watch every video in `reference-videos/`. Claude only gets the look right when it studies them frame by frame first.
2. Read `README.md`, section "Make a video".
3. Start with this prompt:

> Read skills/paper-studio/SKILL.md and skills/explainer-videos/SKILL.md, and study every video in reference-videos/ frame by frame before you write any code. Then write me 5 hooks for a 60 second explainer about [your topic] and stop for my pick.

## Step 10. Mark setup as done

Claude: when steps 1 to 7 pass, write `.setup-complete` (today's date, the provider) and tell the user setup is finished and what to type next.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `HTTP 401` from the voice check | The key is wrong. Copy it again into `.env`, with no quotes or spaces around it. |
| `HTTP 402` from Fish Audio | No API credit. Add some at https://fish.audio/app/developers/billing/ or set `FISH_MODEL=s2.1-pro-free`. |
| ElevenLabs says a permission is missing | Edit the key at https://elevenlabs.io/app/api/api-keys and turn on the permission it names. |
| The render says a `vo/*.wav` file is missing | The example's voiceover is not shipped. Render with `"mute":true` (the default) or generate your own voice first. |
| A render is very slow or the machine locks up | Render one thing at a time with `--concurrency=1`. Never start two renders together. |
| Whisper mishears a product name | Fix the word in the timings JSON by hand; never re-run Whisper on audio that has not changed, because the timings shift. |
