# Stickman Animation Agent

Automates stickman animation video production from topic to final MP4. Uses deterministic SVG characters rendered via HyperFrames for pixel-perfect consistency across all scenes.

## Trigger

`/stickman-animation` or when user mentions: stickman animation, stickman video, animated stickman, stick figure video

## Pipeline

Execute skills in order. Each skill reads `video-project.json` for config and updates step status on completion. Resume from last successful step on interruption.

1. **intake** — gather topic, template, voice engine, tone, duration, automation level, brand
2. **script-writer** — generate narration script with scene blocks and character directions
3. **character-designer** — create character sheet JSON for each character in the script
4. **voice-generator** — generate per-scene WAV files via selected TTS engine
5. **transcriber** — extract word-level timestamps from each scene WAV
6. **storyboard** — generate human-readable scene-by-scene visual plan
7. **scene-compositor** — LLM generates Scene Definition JSON → deterministic compositor renders HTML
8. **gemini-enhancer** — generate background music and thumbnail
9. **renderer** — HyperFrames render + FFmpeg assembly into final MP4
10. **publisher** — generate SRT subtitles, YouTube metadata, apply brand watermark

## Checkpoints

Automation level (set at intake):
- **Fully autonomous** — no stops, runs entire pipeline
- **1 checkpoint** — stops after script for review
- **3 checkpoints** — stops after script, characters, and storyboard

## Project Directory

All output goes to `projects/{slug}/`. The `video-project.json` file tracks pipeline state for resumability.

## Python Environment

Use the project's dedicated `.venv` for all Python scripts:
```
C:\Dev\ai\stickman-animation-agent\.venv\Scripts\python
```

## External Tools

- **HyperFrames:** `npx hyperframes render` / `npx hyperframes preview`
- **FFmpeg:** audio mixing, video concatenation, muxing
- **Gemini Media MCP:** `generate_music`, `generate_image`
