PAPER STUDIO EXPLAINERS
=======================

WHAT IT IS
Victor Matevski's faceless 9:16 explainer video format. Physical objects on lit
grid paper, photoreal cut-outs, real logos, word-by-word captions and a smooth
camera, built in Remotion by Claude Code and voiced by an AI clone of your own
voice (Fish Audio or ElevenLabs).

No voice is included. You connect your own during setup.

WHAT'S INSIDE
- SETUP.md              the step-by-step setup (Claude runs it with you)
- CLAUDE.md             instructions Claude Code loads on its own
- skills/               the style guide, the video format, the setup skill
- reference-videos/     finished videos and covers. STUDY THESE FIRST.
- src/paperstudio/      the Remotion kit
- src/ptp08/            a complete episode as the worked example
- episodes/ep08-github/ that episode's script, storyboard, docs and tools
- tools/                voice.py, word_timings.py, repeat_check.py, qa.sh

SETUP
1. Install Node.js 18 or newer, ffmpeg, Python 3.9 or newer, git and Claude Code
   (npm install -g @anthropic-ai/claude-code).
2. git clone https://github.com/VictorMat13/paper-studio-explainers.git
   cd paper-studio-explainers
3. bash install.sh
   (runs npm install, links the skills into ~/.claude/skills, creates .env)
4. claude
   Claude reads CLAUDE.md, sees that setup is not finished, and walks you through
   the rest one step at a time:
     a. render a test still to prove the graphics work
     b. pick Fish Audio or ElevenLabs
     c. create your API key and paste it into .env yourself
        Fish Audio:  https://fish.audio/app/api-keys/
                     add API credit: https://fish.audio/app/developers/billing/
        ElevenLabs:  https://elevenlabs.io/app/api/api-keys
     d. python3 tools/voice.py check
     e. record a clean, calm sample and clone it:
        python3 tools/voice.py clone my-sample.wav --name "My voice"
     f. python3 tools/voice.py say "This is my cloned voice." out/test.wav
     g. install Whisper for word timings (pip install mlx-whisper on Apple
        Silicon, pip install openai-whisper elsewhere)
   If you are already in Claude Code, say: continue the setup.

HOW TO MAKE A VIDEO WITH CLAUDE CODE
Paste this:

  Read skills/paper-studio/SKILL.md and skills/explainer-videos/SKILL.md, and
  study every video in reference-videos/ frame by frame before you write any
  code. Then write me 5 hooks for a 60 second explainer about [your topic] and
  stop for my pick.

Order of work: hooks, script, storyboard, graphics on a provisional timeline
while the voice generates, word timings, timeline regenerated, stills,
previews, finals, covers.

RENDERING
  npm run dev
  npx remotion still  src/ptp08/entry.tsx GithubEp08 out/f400.png --frame=400 --concurrency=1
  npx remotion render src/ptp08/entry.tsx GithubEp08 out/A.mp4 --props='{"variant":"A","mute":true}' --concurrency=1
Render one thing at a time. Always --concurrency=1.

RULES THAT KEEP IT LOOKING RIGHT
- Use the references. Match them, not Claude's defaults.
- One light from the top left, shadows down-right, nothing glowing, nothing empty.
- Keep readable things inside x 65 to 1015, y 269 to 1248.
- No shot over 45 frames. Something moves in every frame.
- Real logos and real captures only. Only verified numbers.
- Natural-speed voice. Never speed a take up.
- No em dashes on screen. No "follow me" asks.

CREDITS
Style and pipeline by Victor Matevski. Code is MIT. Logos, marks and page
captures belong to their owners. The finished videos and the voice in them are
Victor's, included for study only. Sources: skills/paper-studio/references/SOURCES.md
