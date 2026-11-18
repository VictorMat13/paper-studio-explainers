---
name: paper-studio-setup
description: First-time setup and troubleshooting for the Paper Studio explainer videos package. Use when the user has just cloned or installed the paper-studio-explainers repo, says "set this up", "how do I connect Fish Audio", "how do I connect ElevenLabs", "my voice isn't working", "clone my voice", or when `.setup-complete` is missing from the repo root. Walks them step by step through installing, connecting a voice provider (Fish Audio or ElevenLabs), cloning their voice and making a first test line.
---

# Paper Studio setup

The walkthrough lives in `SETUP.md` at the root of the paper-studio-explainers repo (this skill folder is a link into that repo: resolve it with `readlink` or look two folders up). Read `SETUP.md` in full, then lead the user through it.

How to run it:

1. Find the repo root (the folder with `SETUP.md`, `package.json` and `tools/voice.py`). If the user is somewhere else, ask them to open Claude Code in that folder.
2. Check what is already done: `node -v`, `ls node_modules`, `ls .env`, `python3 tools/voice.py check`. Skip finished steps.
3. Go one step at a time. Explain the step in two or three plain sentences, do your part, tell the user exactly what to do with the link, and wait for them.
4. Verify each step with its check command before moving on.
5. **Never ask for an API key in chat and never print one.** The user pastes keys into `.env` in their own editor. `tools/voice.py check` confirms the key without showing it.
6. When steps 1 to 7 pass, write `.setup-complete` (date and provider) and give them the first-video prompt from step 9.

Voice provider facts (checked against the providers' docs in November 2026; if a call fails, read the current docs before guessing):

- **Fish Audio.** Key: https://fish.audio/app/api-keys/. API credit is pay as you go and separate from the app subscription: https://fish.audio/app/developers/billing/. No credit means HTTP 402 on paid models; `s2.1-pro-free` needs none. TTS: `POST https://api.fish.audio/v1/tts`, `Authorization: Bearer <key>`, model in a `model` header (`s2.1-pro` default, `drama-3` most expressive, `s1` is being retired). Clone: `POST https://api.fish.audio/model` (multipart: `type=tts`, `title`, `train_mode=fast`, `voices`), the returned `_id` is the voice id. Your own voices: `GET /model?self=true`.
- **ElevenLabs.** Key: https://elevenlabs.io/app/api/api-keys. A restricted key needs Text to Speech, Voices (read), User (read), plus Voices (write) to clone through the API. TTS: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`, header `xi-api-key`. Models: `eleven_multilingual_v2` (default here), `eleven_v3`, `eleven_v4`, `eleven_flash_v2_5`. Instant clone: `POST /v1/voices/add` (multipart: `name`, `files`), needs a plan with Instant Voice Cloning. Quota: `GET /v1/user/subscription`. Voices: `GET /v2/voices`.
- Both are wrapped by `tools/voice.py` (`check`, `clone`, `say`). Switch provider with `VOICE_PROVIDER` in `.env`.
