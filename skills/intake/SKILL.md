# Intake

Gather project configuration from the user and create the `video-project.json` state file.

## Input

Parse the user's message or prompt interactively for:

| Parameter | Options | Default |
|---|---|---|
| Topic/script | Free text, URL, or document | required |
| Template | whiteboard | whiteboard |
| Voice engine | kokoro, coqui, elevenlabs, gemini | kokoro |
| Tone | humorous, educational, dramatic, absurd | educational |
| Duration | short (1-2min), medium (3-5min), long (5-10min) | medium |
| Aspect ratio | landscape, vertical, both | landscape |
| Automation level | autonomous, 1-checkpoint, 3-checkpoints | prompt user |
| Brand | existing brand name, new, skip | skip |

## Automation Level Prompt

If the originating prompt specifies "no review" or "fully auto," set autonomous.
If it mentions "review" or "checkpoint," set accordingly.
Otherwise, ask:

> **Automation level:**
> 1. Fully autonomous — no stops
> 2. 1 checkpoint — review script before continuing
> 3. 3 checkpoints — review script, characters, and storyboard

## Output

Creates `projects/{slug}/video-project.json`:
```json
{
  "slug": "...",
  "created": "...",
  "config": { "template": "...", "voice": "...", "tone": "...", "duration": "...", "aspect": "...", "automation": "...", "brand": null },
  "steps": { "intake": "complete", "script": "pending", ... },
  "lastStep": "intake"
}
```
