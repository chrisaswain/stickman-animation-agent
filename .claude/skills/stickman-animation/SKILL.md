# Stickman Animation

Create a stickman animation video from a topic. Orchestrates all 10 pipeline steps with checkpoints and resumability.

## Trigger

`/stickman-animation [topic]`

## Initial Setup

1. **Check for existing project.** Look for `video-project.json` in the most recently mentioned project directory, or scan `projects/` for one. If found, jump to **Resume** below.
2. **No existing project** — start from **Intake**.

## Resume

Read `video-project.json` and find the first step with status != `complete`. Continue from that step. Always re-read the file before deciding what to do — it is the single source of truth.

## Pipeline Steps

### Step 1: Intake (LLM)

Gather project details interactively or from the topic argument.

| Parameter | Options | Default |
|---|---|---|
| Topic | Free text | required |
| Template | whiteboard, classic-stickman, comic-panel | whiteboard |
| Voice engine | kokoro, gemini, elevenlabs | kokoro |
| Tone | humorous, educational, dramatic, absurd | educational |
| Duration | short (1-2min), medium (3-5min), long (5-10min) | medium |
| Aspect ratio | landscape, vertical, both | landscape |
| Automation | autonomous, 1-checkpoint, 3-checkpoints | ask user |
| Brand | existing brand name or skip | skip |

Create `projects/{slug}/video-project.json`:
```json
{
  "title": "...",
  "slug": "...",
  "topic": "...",
  "created": "...",
  "config": {
    "template": "whiteboard",
    "voice": "kokoro",
    "tone": "educational",
    "duration": "medium",
    "aspect": "landscape",
    "automation": "autonomous",
    "brand": null
  },
  "steps": { "intake": { "status": "complete" } },
  "lastStep": "intake"
}
```

### Step 2: Script (LLM)

Follow `skills/script-writer/SKILL.md`. Generate `scripts/narration-script.json`.

**Checkpoint:** If automation is `1-checkpoint` or `3-checkpoints`, present the script for review before continuing.

### Step 3: Characters (LLM)

Follow `skills/character-designer/SKILL.md`. Generate `characters/{id}.json` for each character.

**Checkpoint:** If automation is `3-checkpoints`, present character sheets for review.

### Step 4-5: Voice + Timestamps (Orchestrator)

Hand off to the coded orchestrator for these deterministic steps:

```bash
node src/pipeline/orchestrator.js --project projects/{slug}/ --step voice
node src/pipeline/orchestrator.js --project projects/{slug}/ --step timestamps
```

Or run both in sequence:
```bash
node src/pipeline/orchestrator.js --project projects/{slug}/ --from voice
```

The orchestrator will stop at `compose` since compose Phase A hasn't been done yet.

**If voice step fails:** Check that `.venv` exists and kokoro is installed. Run `bootstrap.ps1` if needed.

### Step 6: Storyboard (LLM)

Follow `skills/storyboard/SKILL.md`. Generate `output/storyboard.md`.

**Checkpoint:** If automation is `3-checkpoints`, present storyboard for review.

### Step 7: Compose (Hybrid)

**Phase A (LLM):** Follow `skills/scene-compositor/SKILL.md` Phase A. For each scene, generate `compositions/scene-{NN}.json` (Scene Definition JSON).

**Phase B (Orchestrator):** Run the deterministic compositor:
```bash
node src/pipeline/orchestrator.js --project projects/{slug}/ --step compose
```

This runs `src/compositor/index.js` per scene JSON, producing `compositions/scene-{NN}.html`.

### Step 8: Enhance (Hybrid)

**Prompt generation (Orchestrator):**
```bash
node src/pipeline/orchestrator.js --project projects/{slug}/ --step enhance
```

This generates `enhance/enhance-plan.json` with optimized prompts.

**MCP calls (LLM):** Follow `skills/gemini-enhancer/SKILL.md` Steps 2-4:
1. Read `enhance/music-prompt.txt`
2. Call `mcp__gemini-media__generate_music` with the prompt
3. Poll `mcp__gemini-media__video_status` until complete
4. Call `mcp__gemini-media__download_video` to save `audio/music.wav`
5. Read `enhance/thumbnail-prompt.txt`
6. Call `mcp__gemini-media__generate_image` with the prompt and `aspectRatio: "16:9"`
7. Save thumbnail to `output/thumbnail.png`

All enhancement is **non-fatal**. If Gemini quota is exceeded or generation fails, mark items as `skipped` and continue.

After MCP calls:
```bash
node src/enhance/gemini-enhancer.js --project projects/{slug}/ --complete
```

### Step 9-10: Render + Publish (Orchestrator)

```bash
node src/pipeline/orchestrator.js --project projects/{slug}/ --from render
```

This runs:
- **render**: HyperFrames scene rendering + FFmpeg assembly → `output/{slug}.mp4`
- **publish**: SRT subtitle generation + YouTube metadata template → `output/{slug}.srt` + `output/metadata.txt`

### Done

Report all output files:
- `output/{slug}.mp4` — final video (landscape)
- `output/{slug}-vertical.mp4` — vertical version (if aspect is "both")
- `output/{slug}.srt` — subtitles
- `output/thumbnail.png` — YouTube thumbnail (if generated)
- `output/metadata.txt` — title, description, tags template
- `output/storyboard.md` — visual plan

## Checkpoint Behavior

| Automation Level | Stops After |
|---|---|
| autonomous | Never |
| 1-checkpoint | Script |
| 3-checkpoints | Script, Characters, Storyboard |

At each checkpoint, present the output and ask: "Ready to continue, or would you like changes?"

## Error Recovery

The orchestrator validates prerequisites before each step and provides specific hints:
- "Missing narration-script.json — run the script-writer skill first"
- "No scene WAV files — run the voice step first"

If a step fails, the status is set to `error` in `video-project.json`. Re-running the orchestrator or this skill will retry the failed step.

## Python Environment

All Python scripts run via the project venv:
```
C:\Dev\ai\stickman-animation-agent\.venv\Scripts\python.exe
```

If the venv doesn't exist, run `bootstrap.ps1` first.

## Key Paths

| Path | Purpose |
|---|---|
| `src/pipeline/orchestrator.js` | Deterministic step runner |
| `src/compositor/index.js` | Scene JSON → HTML compositor |
| `src/render/pipeline.js` | Render + FFmpeg assembly |
| `src/enhance/gemini-enhancer.js` | Enhancement prompt generator |
| `scripts/kokoro_tts.py` | Kokoro TTS wrapper |
| `scripts/whisper_transcribe.py` | Timestamp extraction |
| `scripts/generate_subtitles.py` | SRT subtitle generation |
