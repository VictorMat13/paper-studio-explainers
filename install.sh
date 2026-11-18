#!/usr/bin/env bash
# Paper Studio explainers: one-time install. Safe to run again.
set -e
cd "$(dirname "$0")"
REPO="$(pwd)"

say() { printf '\n%s\n' "$1"; }
miss=0
for tool in node npm ffmpeg python3 git; do
  if ! command -v "$tool" >/dev/null 2>&1; then echo "Missing: $tool"; miss=1; fi
done
if [ "$miss" = 1 ]; then
  say "Install the missing tools first (Mac: brew install node ffmpeg python git), then run this again."
  exit 1
fi

say "1/3 Installing the Remotion project (npm install)..."
npm install --no-audit --no-fund

say "2/3 Linking the skills into ~/.claude/skills ..."
mkdir -p "$HOME/.claude/skills"
for s in paper-studio explainer-videos paper-studio-setup; do
  target="$HOME/.claude/skills/$s"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "  $target already exists and is not a link; left alone."
  else
    ln -sfn "$REPO/skills/$s" "$target"
    echo "  linked $s"
  fi
done

say "3/3 Creating .env ..."
if [ -f .env ]; then echo "  .env already exists; left alone."; else cp .env.example .env; echo "  created .env from .env.example"; fi

say "Done. Now start Claude Code in this folder:"
echo "    claude"
echo "It reads CLAUDE.md and walks you through the rest (voice provider, your voice clone, first video)."
echo "If you are already in Claude Code, just say: continue the setup."
