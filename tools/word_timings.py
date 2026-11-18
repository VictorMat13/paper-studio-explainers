#!/usr/bin/env python3
"""Word timings for a voiceover, read with Whisper.

  python3 tools/word_timings.py voice.wav words.json

Writes {"text": ..., "words": [{"w": "What", "s": 0.06, "e": 0.21}, ...], "duration": ...}, the shape the
episode timeline tools read (episodes/ep08-github/timing/words_*.json are real examples; those also carry
hook_end and body_start, which the episode's own assemble tool adds).

Uses mlx-whisper on Apple Silicon (pip install mlx-whisper) or openai-whisper anywhere (pip install openai-whisper).
Check every word against your script afterwards: Whisper can repeat words at the end of a file and can merge or
misspell product names. Never re-run it on audio that has not changed, because the timings shift a little each time.
"""
import json
import subprocess
import sys


def transcribe(path):
    try:
        import mlx_whisper
        return mlx_whisper.transcribe(path, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", word_timestamps=True,
                                      language="en", condition_on_previous_text=False)
    except ImportError:
        pass
    try:
        import whisper
    except ImportError:
        raise SystemExit("Install Whisper first: pip install mlx-whisper (Apple Silicon) or pip install openai-whisper")
    return whisper.load_model("small.en").transcribe(path, word_timestamps=True, language="en", condition_on_previous_text=False)


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    r = transcribe(src)
    words = [{"w": w["word"].strip(), "s": round(float(w["start"]), 2), "e": round(float(w["end"]), 2)}
             for seg in r["segments"] for w in seg.get("words", []) if w["word"].strip()]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src],
                               capture_output=True, text=True).stdout.strip() or 0)
    json.dump({"text": " ".join(w["w"] for w in words), "words": words, "duration": round(dur, 3)}, open(out, "w"), indent=1)
    for w in words:
        print(f'{w["s"]:7.2f} {w["e"]:7.2f}  {w["w"]}')
    print(f"{len(words)} words, {dur:.2f} s -> {out}")


if __name__ == "__main__":
    main()
