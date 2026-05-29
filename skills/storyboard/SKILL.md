# Storyboard

Generate a human-readable Markdown storyboard showing the scene-by-scene visual plan.

## Input

- `narration-script.json` — scene blocks
- `characters/{id}.json` — character sheets
- `timestamps/scene-*.json` — timing data

## Process

1. For each scene, describe: character positions, actions, props, camera movements, timing
2. Map narration beats to visual events using word timestamps
3. Flag any scenes that might benefit from a Gemini hero shot (V1.5)
4. Include total estimated duration

## Output

`projects/{slug}/output/storyboard.md`

## Checkpoint

If automation level is 3-checkpoints, present storyboard for user review.
