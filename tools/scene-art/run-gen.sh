#!/usr/bin/env bash
# Usage: run-gen.sh <promptfile> <outdir> <outname>
export PATH=$HOME/.local/node/bin:$PATH
P=$(cat "$1"); mkdir -p "$2"
codex exec --skip-git-repo-check --sandbox workspace-write --json -C "$2" -o "$2/$3.last.txt" "Use your built-in image generation tool (the newest GPT Image model available to you) to generate exactly one image, landscape orientation, the widest landscape size available, from this prompt:

$P

Save the generated PNG in the current directory as $3.png. Do not write code, do not call any external API or network service yourself, and do not generate more than one image. When done, reply with the saved file path, its pixel dimensions, and the image model name if you know it." < /dev/null > "$2/$3.log.jsonl" 2>&1
echo "EXIT=$?" >> "$2/$3.log.jsonl"
# The sandbox blocks Codex from copying out of its own folder, so copy the newest generated image here.
TID=$(grep -o '"thread_id":"[^"]*"' "$2/$3.log.jsonl" | head -1 | cut -d'"' -f4)
IMG=$(ls -t "$HOME/.codex/generated_images/$TID/"*.png 2>/dev/null | head -1)
[ -n "$IMG" ] && cp "$IMG" "$2/$3.png" && echo "COPIED=$2/$3.png" >> "$2/$3.log.jsonl"
