#!/usr/bin/env python3
"""Voice tool for Paper Studio explainers. Works with Fish Audio or ElevenLabs. Python 3.9+, no packages to install.

  python3 tools/voice.py check                        test your key, show your credit and your voices
  python3 tools/voice.py clone sample.wav --name Me   make a voice clone from a recording and save its id to .env
  python3 tools/voice.py say "Hello there." out.wav   speak a line with your clone
  python3 tools/voice.py say --file line.txt out.wav  same, text read from a file

Settings come from .env at the repo root (copy .env.example). Real environment variables win over .env.
The provider is VOICE_PROVIDER=fish or VOICE_PROVIDER=elevenlabs. Never commit .env.
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
FISH = "https://api.fish.audio"
ELEVEN = "https://api.elevenlabs.io"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip("\"'")
    env.update({k: v for k, v in os.environ.items() if k.startswith(("VOICE_", "FISH_", "ELEVENLABS_"))})
    return env


def save_env(key, value):
    lines = ENV_FILE.read_text().splitlines() if ENV_FILE.exists() else []
    for i, line in enumerate(lines):
        if line.split("=", 1)[0].strip() == key:
            lines[i] = f"{key}={value}"
            break
    else:
        lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(lines) + "\n")


def die(msg):
    raise SystemExit("\n" + msg + "\n")


def need(env, key, how):
    if not env.get(key):
        die(f"{key} is missing from .env. {how}")
    return env[key]


class ApiError(Exception):
    def __init__(self, code, body):
        super().__init__(f"HTTP {code}")
        self.code, self.body = code, body


def http(method, url, headers, data=None, timeout=600, soft=False):
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    for attempt in range(12):
        try:
            return urllib.request.urlopen(req, timeout=timeout).read()
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:500]
            if e.code == 429 and attempt < 11:  # too many requests at once: wait and try again
                time.sleep(10)
                continue
            if soft:
                raise ApiError(e.code, body)
            hint = {
                401: "The API key was rejected. Copy it again from the provider's site into .env (no quotes, no spaces).",
                402: "The account has no API credit for this model. Add credit on the provider's billing page, or switch to a free model.",
                403: "The key is not allowed to do this. Check the key's permissions on the provider's site.",
            }.get(e.code, "")
            die(f"HTTP {e.code} from {url}\n{body}\n{hint}")
        except urllib.error.URLError as e:
            die(f"Could not reach {url}: {e.reason}")


def multipart(fields, files):
    """fields: [(name, text)], files: [(name, path)] -> (body, content type)"""
    boundary = uuid.uuid4().hex
    out = []
    for name, value in fields:
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, path in files:
        p = Path(path)
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="sample{p.suffix}"\r\n'
                   f'Content-Type: application/octet-stream\r\n\r\n'.encode() + p.read_bytes() + b"\r\n")
    out.append(f"--{boundary}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={boundary}"


def to_wav(src, dst):
    """provider audio -> 44.1 kHz mono wav (needs ffmpeg)"""
    r = subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(src), "-ar", "44100", "-ac", "1", str(dst)])
    if r.returncode != 0:
        die("ffmpeg could not convert the audio. Install ffmpeg (brew install ffmpeg) and try again.")


# ---------- Fish Audio ----------

def fish_headers(env, extra=None):
    h = {"Authorization": "Bearer " + need(env, "FISH_API_KEY", "Create one at https://fish.audio/app/api-keys/ and paste it in.")}
    h.update(extra or {})
    return h


def fish_check(env):
    voices = json.loads(http("GET", FISH + "/model?self=true&page_size=20", fish_headers(env)))
    print("Fish Audio key works.")
    try:
        wallet = json.loads(http("GET", FISH + "/wallet/self/api-credit", fish_headers(env)))
        print(f"API credit: {wallet.get('credit')}")
        if float(wallet.get("credit") or 0) <= 0:
            print("  No API credit. Paid models (s2.1-pro, drama-3) will return 402 until you add some at")
            print("  https://fish.audio/app/developers/billing/  The free model s2.1-pro-free works without credit.")
    except SystemExit:
        print("(could not read the credit balance; the key itself is fine)")
    items = voices.get("items", [])
    print(f"Your voices ({voices.get('total', len(items))}):")
    for v in items:
        mark = "  <- in .env" if v.get("_id") == env.get("FISH_VOICE_ID") else ""
        print(f"  {v.get('_id')}  {v.get('title')}  [{v.get('state')}]{mark}")
    if not items:
        print("  none yet. Make one: python3 tools/voice.py clone <your recording> --name \"My voice\"")
    if env.get("FISH_VOICE_ID") and not any(v.get("_id") == env["FISH_VOICE_ID"] for v in items):
        print(f"Note: FISH_VOICE_ID={env['FISH_VOICE_ID']} is not in the first 20 of your own voices. Check the id.")
    print(f"Model: {env.get('FISH_MODEL') or 's2.1-pro (default)'}")


def fish_clone(env, sample, name, transcript):
    fields = [("type", "tts"), ("title", name), ("train_mode", "fast"), ("visibility", "private"),
              # false keeps your real delivery; the enhancer can make a calm read sound processed
              ("enhance_audio_quality", "false")]
    if transcript:
        fields.append(("texts", Path(transcript).read_text().strip()))
    body, ctype = multipart(fields, [("voices", sample)])
    res = json.loads(http("POST", FISH + "/model", fish_headers(env, {"Content-Type": ctype}), body))
    vid = res.get("_id")
    if not vid:
        die(f"Fish did not return a voice id: {res}")
    save_env("FISH_VOICE_ID", vid)
    print(f"Voice created: {vid} (state: {res.get('state')}). Saved to .env as FISH_VOICE_ID.")


def fish_say(env, text, out):
    model = env.get("FISH_MODEL") or "s2.1-pro"
    body = {"text": text, "reference_id": need(env, "FISH_VOICE_ID", "Run the clone command first, or paste a voice id from fish.audio."),
            "format": "wav", "sample_rate": 44100, "latency": "normal",
            # Fish's normalize is a text normalizer (numbers, dates), not loudness
            "normalize": False,
            "temperature": float(env.get("FISH_TEMPERATURE") or 0.7), "top_p": float(env.get("FISH_TOP_P") or 0.7)}
    audio = http("POST", FISH + "/v1/tts", fish_headers(env, {"Content-Type": "application/json", "model": model}),
                 json.dumps(body).encode())
    Path(out).write_bytes(audio)
    print(f"{len(audio)} bytes -> {out}  (Fish Audio, {model})")


# ---------- ElevenLabs ----------

def el_headers(env, extra=None):
    h = {"xi-api-key": need(env, "ELEVENLABS_API_KEY", "Create one at https://elevenlabs.io/app/api/api-keys and paste it in.")}
    h.update(extra or {})
    return h


def el_check(env):
    # A key can be limited to some permissions. Text to Speech is the only one a render needs;
    # Voices (read) and User (read) let this check list your voices and show your quota.
    ok = False
    try:
        sub = json.loads(http("GET", ELEVEN + "/v1/user/subscription", el_headers(env), soft=True))
        ok = True
        print("ElevenLabs key works.")
        print(f"Plan: {sub.get('tier')}  characters used: {sub.get('character_count')} of {sub.get('character_limit')}")
        if sub.get("can_use_instant_voice_cloning") is False:
            print("  This plan cannot make instant voice clones. Upgrade to a plan that includes it (Starter or above).")
    except ApiError as e:
        if "missing_permissions" in e.body:
            print("The key is valid but has no User (read) permission, so the quota can't be shown. That is fine.")
            ok = True
        else:
            die(f"HTTP {e.code} from ElevenLabs\n{e.body}\nThe API key was rejected. Copy it again from "
                "https://elevenlabs.io/app/api/api-keys into .env (no quotes, no spaces).")
    try:
        voices = json.loads(http("GET", ELEVEN + "/v2/voices?page_size=50&voice_type=personal", el_headers(env), soft=True))
        items = voices.get("voices", [])
        print(f"Your voices ({len(items)}):")
        for v in items:
            mark = "  <- in .env" if v.get("voice_id") == env.get("ELEVENLABS_VOICE_ID") else ""
            print(f"  {v.get('voice_id')}  {v.get('name')}  [{v.get('category')}]{mark}")
        if not items:
            print('  none yet. Make one: python3 tools/voice.py clone <your recording> --name "My voice"')
    except ApiError as e:
        if "missing_permissions" in e.body:
            print("The key has no Voices (read) permission, so your voices can't be listed here.")
            print("  Either edit the key and turn on Voices (read), or copy your voice id from the Voices page into .env.")
        else:
            die(f"HTTP {e.code} from ElevenLabs\n{e.body}")
    if ok and not env.get("ELEVENLABS_VOICE_ID"):
        print("ELEVENLABS_VOICE_ID is empty. Clone a voice or paste an id into .env before generating.")
    print(f"Model: {env.get('ELEVENLABS_MODEL') or 'eleven_multilingual_v2 (default)'}")


def el_clone(env, sample, name, transcript):
    body, ctype = multipart([("name", name)], [("files", sample)])
    res = json.loads(http("POST", ELEVEN + "/v1/voices/add", el_headers(env, {"Content-Type": ctype}), body))
    vid = res.get("voice_id")
    if not vid:
        die(f"ElevenLabs did not return a voice id: {res}")
    save_env("ELEVENLABS_VOICE_ID", vid)
    print(f"Voice created: {vid}. Saved to .env as ELEVENLABS_VOICE_ID.")
    if res.get("requires_verification"):
        print("ElevenLabs wants you to verify this voice on their site before it can be used.")


def el_say(env, text, out):
    model = env.get("ELEVENLABS_MODEL") or "eleven_multilingual_v2"
    voice = need(env, "ELEVENLABS_VOICE_ID", "Run the clone command first, or paste a voice id from elevenlabs.io.")
    fmt = env.get("ELEVENLABS_OUTPUT_FORMAT") or "mp3_44100_128"
    body = {"text": text, "model_id": model,
            "voice_settings": {"stability": float(env.get("ELEVENLABS_STABILITY") or 0.5),
                               "similarity_boost": float(env.get("ELEVENLABS_SIMILARITY") or 0.8)}}
    url = f"{ELEVEN}/v1/text-to-speech/{urllib.parse.quote(voice)}?output_format={fmt}"
    audio = http("POST", url, el_headers(env, {"Content-Type": "application/json"}), json.dumps(body).encode())
    out = Path(out)
    if out.suffix.lower() == ".wav" and not fmt.startswith("wav"):
        tmp = out.with_suffix(".provider." + fmt.split("_")[0])
        tmp.write_bytes(audio)
        to_wav(tmp, out)
        tmp.unlink()
    else:
        out.write_bytes(audio)
    print(f"{len(audio)} bytes -> {out}  (ElevenLabs, {model})")


PROVIDERS = {"fish": (fish_check, fish_clone, fish_say), "elevenlabs": (el_check, el_clone, el_say)}


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print(__doc__)
        return
    env = load_env()
    provider = (env.get("VOICE_PROVIDER") or "").lower()
    if provider not in PROVIDERS:
        die("Set VOICE_PROVIDER=fish or VOICE_PROVIDER=elevenlabs in .env (copy .env.example to .env first).")
    check, clone, say = PROVIDERS[provider]
    cmd, rest = args[0], args[1:]

    def opt(flag):
        if flag in rest:
            i = rest.index(flag)
            value = rest[i + 1]
            del rest[i:i + 2]
            return value
        return None

    if cmd == "check":
        check(env)
    elif cmd == "clone":
        name, transcript = opt("--name") or "My voice", opt("--transcript")
        if not rest or not Path(rest[0]).exists():
            die("Usage: voice.py clone <recording.wav|mp3|m4a> --name \"My voice\" [--transcript words.txt]")
        clone(env, rest[0], name, transcript)
    elif cmd == "say":
        text_file = opt("--file")
        if text_file:
            text, out = Path(text_file).read_text().strip(), (rest[0] if rest else None)
        else:
            text, out = (rest[0] if rest else None), (rest[1] if len(rest) > 1 else None)
        if not text or not out:
            die('Usage: voice.py say "<text>" out.wav   or   voice.py say --file line.txt out.wav')
        say(env, text, out)
    else:
        die(f"Unknown command '{cmd}'. Run voice.py --help.")


if __name__ == "__main__":
    main()
