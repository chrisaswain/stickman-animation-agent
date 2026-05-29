# Stickman Animation Agent

Fully automated stickman animation video pipeline. Topic → script → characters → voice → timestamps → storyboard → composition → render → final MP4 with narration, music, and subtitles.

## Architecture

**Hybrid orchestrator:** creative steps are LLM-driven (via `.claude/skills/stickman-animation/SKILL.md`), deterministic steps run through a coded Node.js orchestrator (`src/pipeline/orchestrator.js`). HyperFrames renders SVG compositions via headless Chrome for pixel-perfect consistency. Gemini Media MCP handles music/thumbnails.

```
Intake → Script → Characters → Voice → Timestamps → Storyboard → Compose → Enhance → Render → Publish
 LLM      LLM      LLM        ORCH      ORCH         LLM        Hybrid    Hybrid    ORCH     ORCH
```

Each step has optional checkpoints. Projects track step status in `video-project.json` for resumability.

### Two-Phase Scene Composition

The LLM generates a **Scene Definition JSON** (structured data, not code). A deterministic JS compositor (`src/compositor/`) translates that JSON + character sheets + template config into final HTML/SVG/GSAP compositions. This separation makes the pipeline testable and debuggable.

## Pipeline

| Step | Mode | Tool | Output |
|---|---|---|---|
| Intake | LLM | Interactive Q&A | `video-project.json` |
| Script | LLM | Claude | `scripts/narration-script.json` |
| Characters | LLM | Claude | `characters/{id}.json` |
| Voice | Orchestrator | Kokoro-82M / Gemini / ElevenLabs | `audio/scene-*.wav` |
| Timestamps | Orchestrator | faster-whisper | `timestamps/scene-*.json` |
| Storyboard | LLM | Claude | `output/storyboard.md` |
| Compose | Hybrid | Claude (JSON) + compositor (HTML) | `compositions/scene-*.html` |
| Enhance | Hybrid | gemini-enhancer.js + Gemini MCP | `audio/music.wav`, `output/thumbnail.png` |
| Render | Orchestrator | HyperFrames + FFmpeg | `output/{slug}.mp4` |
| Publish | Orchestrator | generate_subtitles.py + template | `output/{slug}.srt`, `output/metadata.txt` |

## Templates

- `whiteboard` (primary) — parchment bg, dark ink, Caveat font, draw-in animation
- `classic-stickman` — black bg, white stickmen, high contrast, Space Mono font
- `comic-panel` — white bg, panel borders, Comic Neue font

## Character System

Two-tier SVG components in `components/characters/`. Character sheets (JSON) define proportions, components, distinguishing features, and poses. The compositor reads character sheets for every scene to guarantee pixel-perfect consistency.

## Python Venv

This agent uses a dedicated Python 3.12 venv at `.venv/`. Run `bootstrap.ps1` to set up the venv, install dependencies, and create symlinks.

```powershell
.\bootstrap.ps1
```

Invoke Python scripts via:
```powershell
.venv\Scripts\python scripts\<script>.py
```

## Dependencies

| Tool | Install | Purpose |
|---|---|---|
| HyperFrames | `npm i hyperframes` | Composition + render |
| Kokoro-82M | pip (in .venv) | Default TTS (free, local) |
| faster-whisper | pip (in .venv) | Word-level timestamps |
| GSAP | CDN in HTML compositions | Animation |
| Node.js >=22 | Already installed | HyperFrames runtime |
| FFmpeg | Already installed | Audio/video assembly |
| Chrome | Already installed | Headless render |

## Project Output

Each video project lives in `projects/{slug}/` with:
- `video-project.json` — state tracker (step statuses, config, resumption)
- `scripts/` — narration script JSON
- `characters/` — character sheet JSON per character
- `audio/` — per-scene WAV + background music
- `timestamps/` — word-level timestamp JSON per scene
- `compositions/` — scene definition JSON + rendered HTML per scene
- `output/` — storyboard, final MP4, SRT, thumbnail, metadata

## Commands

- `/stickman-animation [topic]` — start or resume a video project (full autonomous pipeline)
- `node src/pipeline/orchestrator.js --project <dir>` — run all incomplete deterministic steps
- `node src/pipeline/orchestrator.js --project <dir> --step <name>` — run a single step
- `node src/pipeline/orchestrator.js --project <dir> --from <name>` — run from step onwards
- `node src/compositor/index.js --scene <json> --project <dir> --template whiteboard --output <html>` — compose a scene
- `node src/render/pipeline.js --project <dir> --template whiteboard` — render & assemble final MP4
- `node src/enhance/gemini-enhancer.js --project <dir> --template whiteboard` — generate music/thumbnail prompts
- `node tests/e2e-pipeline-test.js` — run E2E integration tests
