# Stickman Animation Agent

Automates stickman animation video production from topic to final MP4. Uses deterministic SVG characters rendered via HyperFrames for pixel-perfect consistency across all scenes.

## Trigger

`/stickman-animation [topic]` or when user mentions: stickman animation, stickman video, animated stickman, stick figure video

## Architecture

**Hybrid orchestrator:** creative steps are LLM-driven (via SKILL.md), deterministic steps run through a coded Node.js orchestrator. This separation ensures reliable execution of fixed-I/O operations while preserving creative flexibility for content generation.

- **Skill:** `.claude/skills/stickman-animation/SKILL.md` — full workflow instructions
- **Orchestrator:** `src/pipeline/orchestrator.js` — deterministic step runner

## Pipeline

| # | Step | Mode | Description |
|---|---|---|---|
| 1 | intake | LLM | Gather topic, config, create video-project.json |
| 2 | script | LLM | Generate narration-script.json |
| 3 | characters | LLM | Create character sheet JSONs |
| 4 | voice | Orchestrator | Kokoro TTS → per-scene WAVs |
| 5 | timestamps | Orchestrator | faster-whisper → word-level JSONs |
| 6 | storyboard | LLM | Generate visual plan markdown |
| 7 | compose | Hybrid | LLM generates scene JSONs → orchestrator runs compositor |
| 8 | enhance | Hybrid | Orchestrator generates prompts → LLM calls Gemini MCP |
| 9 | render | Orchestrator | HyperFrames + FFmpeg → final MP4 |
| 10 | publish | Orchestrator | SRT subtitles + YouTube metadata |

## Orchestrator CLI

```bash
# Resume from last incomplete step
node src/pipeline/orchestrator.js --project projects/{slug}/

# Run a single step
node src/pipeline/orchestrator.js --project projects/{slug}/ --step voice

# Run from a specific step onwards
node src/pipeline/orchestrator.js --project projects/{slug}/ --from timestamps
```

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
C:\Dev\ai\stickman-animation-agent\.venv\Scripts\python.exe
```

If missing, run `bootstrap.ps1` to set up the venv.

## External Tools

- **HyperFrames:** `npx hyperframes render` / `npx hyperframes preview`
- **FFmpeg:** audio mixing, video concatenation, muxing
- **Gemini Media MCP:** `generate_music`, `generate_image`, `generate_audio`
