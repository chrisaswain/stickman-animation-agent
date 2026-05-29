# Script Writer

Generate a narration script optimized for stickman visual storytelling.

## Input

- `video-project.json` — topic, tone, duration, template

## Process

1. Generate narration script as JSON with scene blocks
2. Each scene block includes: narration text, character(s), actions, emotion beats, visual description
3. Hook-first structure — first 5 seconds must grab attention
4. Short sentences with pauses for visual gags to land
5. Delivery annotations for TTS prosody: em dashes (pauses), ellipses (trailing), ALL CAPS (emphasis)
6. Target word count based on duration: short ~200, medium ~500, long ~1000

## Output

`projects/{slug}/scripts/narration-script.json`:
```json
{
  "title": "...",
  "scenes": [
    {
      "id": "01",
      "narration": "You wake up at 6 AM... full of motivation.",
      "characters": ["bob"],
      "actions": ["bob wakes up, stretches, looks determined"],
      "emotion": "hopeful",
      "visualDescription": "Bob in bed, alarm clock ringing, morning light"
    }
  ]
}
```

## Checkpoint

If automation level is 1-checkpoint or 3-checkpoints, present the script for user review before continuing.
