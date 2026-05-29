# Stickman Animation Agent

Fully automated stickman animation video pipeline. Topic → script → characters → voice → timestamps → storyboard → composition → render → final MP4 with narration, music, and subtitles.

## Architecture

HyperFrames-primary hybrid: deterministic SVG characters rendered via headless Chrome (pixel-perfect consistency) + Gemini Media MCP for music/thumbnails.

```
Intake → Script → Characters → Voice → Timestamps → Storyboard → Compose → Enhance → Render → Publish
```

Each step has optional checkpoints. Projects track step status in `video-project.json` for resumability.

### Two-Phase Scene Composition

The LLM generates a **Scene Definition JSON** (structured data, not code). A deterministic JS compositor (`src/compositor/`) translates that JSON + character sheets + template config into final HTML/SVG/GSAP compositions. This separation makes the pipeline testable and debuggable.

## Pipeline

| Step | Tool | Output |
|---|---|---|
| Intake | Interactive Q&A | `video-project.json` |
| Script | Claude | `scripts/narration-script.json` |
| Characters | Claude | `characters/{id}.json` |
| Voice | Kokoro-82M / Coqui / ElevenLabs / Gemini | `audio/scene-*.wav` |
| Timestamps | faster-whisper | `timestamps/scene-*.json` |
| Storyboard | Claude | `output/storyboard.md` |
| Compose | Claude (JSON) + compositor (HTML) | `compositions/scene-*.html` |
| Enhance | Gemini Media MCP | `audio/music.wav`, `output/thumbnail.png` |
| Render | HyperFrames + FFmpeg | `output/{slug}.mp4` |
| Publish | Claude | `output/{slug}.srt`, `output/metadata.txt` |

## Templates

- `whiteboard` (primary) — parchment bg, dark ink, Caveat font, draw-in animation
- `classic-stickman` (V1.5) — black bg, white stickmen, high contrast
- `comic-panel` (V1.5) — white bg, panel borders, speech bubbles

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

- `/stickman-animation` — start or resume a video project
