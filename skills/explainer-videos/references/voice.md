# Voice: your clone, settings and lessons learned

The videos are voiced by a clone of the creator's own voice. This repo ships no voice: you connect your own Fish Audio or ElevenLabs account in `SETUP.md` and every command below runs through `tools/voice.py`, which reads `.env`.

```bash
python3 tools/voice.py check                         # key, credit or quota, your voices
python3 tools/voice.py clone my-sample.wav --name "My voice"
python3 tools/voice.py say "One line of script." episodes/<ep>/voice/takes/bodyA_t1.wav
python3 tools/voice.py say --file line.txt out.wav   # long text from a file
```

## The sample decides everything

- **The delivery of the sample is the delivery you get.** The first clones for this series were made from a recording at too much gain, read "a little over the top". The result sounded like yelling and was distorted, and no setting fixed it. The clone that worked came from a calm 19 second read, peaks at -9 dBFS, nothing clipped, no noise cancellation.
- Record clean at a normal speaking level. Check peaks before cloning: `ffmpeg -i sample.wav -af astats -f null - 2>&1 | grep "Peak level"`.
- Fish Audio: 2 to 3 clips of 15 to 20 seconds each work best (at least 10 seconds). ElevenLabs: 1 to 2 minutes, no more than 3.
- Turn the provider's "enhance audio" off for a clean sample (`tools/voice.py clone` already sends `enhance_audio_quality=false` to Fish). Enhancers can make a natural read sound processed.
- Keep the file name simple. A comma in the name breaks multipart uploads from the shell.

## Generating

- **One body take and one take per hook.** Never one request for a whole video. The hooks are separate requests, so every hook can sit in front of the same body.
- Make 3 to 4 takes of each line and keep the best. Takes vary: the same request can come back clean or with tiny clicks inside vowels.
- **Natural speed only.** Never speed up, time-stretch or pitch-shift a take to hit a runtime. If the read is too slow, shorten the script or regenerate. Tighten dead air with clean cuts instead: at most about 0.24 s after a full stop, 0.14 s after a comma, no pause inside a sentence. Cut only true silence (under about -52 dB), at least 120 ms after a word ends, with short fades, and never clip a word ending.
- Measure your clone's pace on the first take (the original reads about 3.1 words per second) and size scripts to it. A 68 second video is about 200 words including the hook.
- Write numbers the way they are said ("a hundred and thirty-five"). Keep the CTA keyword lowercase in the voice text or some models spell it out letter by letter. Never put commas around the keyword: the clone pauses.

### Fish Audio notes

- Model goes in the `model` header: `s2.1-pro` is the default, `s2.1-pro-free` costs nothing under fair-use limits, `drama-3` is the most expressive and takes `[directions]` in square brackets and paired tags like `<emphasis>word</emphasis>`.
- The originals used `drama-3`. Since ep06 the direction was a mild "slightly excited, upbeat" bracket, checked against a calm take so it never tips into yelling. "[fast-paced]" does not speed it up.
- `normalize` is a text normaliser (numbers, dates), not loudness. `tools/voice.py` turns it off so your written-out numbers are read as written.
- Saved clones can come out hot (around -14 LUFS with a raised pitch). Turning the level down afterwards does not fix a raised-voice delivery; fix the sample.
- Lower `FISH_TEMPERATURE` and `FISH_TOP_P` (0.5 each, in `.env`) trim the worst outlier takes.
- WAV output tops out at 44.1 kHz.

### ElevenLabs notes

- `eleven_multilingual_v2` is the steady default. `eleven_v3` and `eleven_v4` are more expressive. `eleven_flash_v2_5` is fast and cheap for drafts.
- `ELEVENLABS_STABILITY` (default 0.5) and `ELEVENLABS_SIMILARITY` (default 0.8) in `.env` map to the voice settings. Lower stability is more expressive and less consistent between takes.
- MP3 at 192 kbps needs the Creator plan or above; the tool asks for 128 kbps and converts to WAV with ffmpeg.
- ElevenLabs also has a `with-timestamps` endpoint that returns character timings. This pipeline uses Whisper for both providers so the timing files look the same.

## Checking and delivering

- **Whisper-check every word** against the script: `python3 tools/word_timings.py take.wav take.words.json`. Hallucinated repeats at the end of a file are common; cut everything after the last real word.
- Whisper merges or misspells product names ("Prompt to Post" can come back as "Prompt2Post"). Fix the words file by hand before building the timeline.
- Never re-run Whisper on audio that has not changed. The timings shift a little each run and the cuts move.
- Check level and peaks before anyone hears a take: `ffmpeg -i take.wav -af loudnorm=print_format=summary -f null -`.
- Deliver the voiceover at -16 LUFS, -1.5 dBTP: `ffmpeg -i in.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 out.wav`.
- Trim the start so the first frame is a word, not a breath.
- On a Mac, open audio with `open -a "QuickTime Player" file.wav`. A plain `open` launches Apple Music.

## Where the files go

- Takes: `episodes/<ep>/voice/takes/`
- Final voiceovers: `episodes/<ep>/voice/` and a copy in `public/ptp<NN>/vo/<variant>.wav` (what the Remotion comp plays)
- Word timings: `episodes/<ep>/timing/words_<variant>.json`

`episodes/ep08-github/tools/assemble_vo_ep08.py` is the real assembler from ep08: it picks the takes, applies the pause rules, joins every hook to every body, levels the result and writes the timings. Copy and adapt it for a new episode. Its picks and names are ep08's.

Voice and voiceover folders are in `.gitignore`. Do not commit your voice.
