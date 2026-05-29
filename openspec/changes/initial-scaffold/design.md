# Design: Stickman Animation Agent — Initial Scaffold

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                       │
│  /stickman-animation → AGENT.md → skill pipeline        │
├─────────────────────────────────────────────────────────┤
│  Skills (sequential pipeline with checkpoints):         │
│  intake → script → characters → voice → timestamps      │
│  → storyboard → compose → enhance → render → publish    │
├─────────────────────────────────────────────────────────┤
│  Scene Compositor (two-phase):                          │
│  LLM → scene-definition.json → compositor.js → HTML     │
├─────────────────────────────────────────────────────────┤
│  Rendering:                                             │
│  HyperFrames (headless Chrome) → FFmpeg assembly        │
├─────────────────────────────────────────────────────────┤
│  External Services:                                     │
│  Kokoro TTS | Gemini Media (music, thumbnail)           │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Project State (`video-project.json`)
Tracks pipeline progress for resumability. Each step has status: pending | in-progress | complete | error.

### 2. Character Sheet System
JSON files defining character proportions, SVG components, distinguishing features, and named poses. The compositor reads these to assemble identical characters across all scenes.

### 3. Two-Phase Scene Compositor
- **Phase A (LLM):** Generates `scene-definition.json` — structured data describing characters, positions, camera, timeline events, speech bubbles
- **Phase B (JS):** `src/compositor/index.js` reads the JSON + character sheets + template config → outputs final HTML with embedded SVG and GSAP timeline

### 4. Animation Function Library
Reusable animation presets referenced by name in scene definitions:
- draw-in, walk-cycle, expression-change, camera-zoom, camera-pan
- speech-bubble-in, squash-stretch, point-gesture, wave, facepalm, celebrate
- enter-draw-in, enter-fade, exit-fade

### 5. Template System
Each template defines: background, palette, typography, animation defaults, voice preference, scene type compositions. V1 ships whiteboard only.

## File Flow

```
topic (user input)
  → video-project.json (intake config + step tracking)
  → scripts/narration-script.json (scene blocks with directions)
  → characters/{id}.json (character sheets)
  → audio/scene-{NN}.wav (TTS output)
  → timestamps/scene-{NN}.json (word-level timing)
  → output/storyboard.md (visual plan)
  → compositions/scene-{NN}.json (scene definitions from LLM)
  → compositions/scene-{NN}.html (rendered by compositor)
  → audio/music.wav (Gemini Lyria)
  → output/thumbnail.png (Gemini Imagen)
  → output/{slug}.mp4 (final video)
  → output/{slug}.srt (subtitles)
  → output/metadata.txt (YouTube metadata)
```

## Dependencies

- **npm:** hyperframes
- **pip:** kokoro, soundfile, torch, faster-whisper, sounddevice, numpy
- **system:** Node.js 22+, FFmpeg, Chrome, Python 3.12
- **MCP:** gemini-media (generate_music, generate_image)

## Build Order (Waves)

### Wave 1: Foundation
- Directory structure, CLAUDE.md, AGENT.md, package.json, bootstrap.ps1
- Git repo + GitHub remote
- OpenSpec documents

### Wave 2: Character & Template System
- Port SVG components from video-explainer whiteboard-sketch
- Create new entertainment SVGs (running, jumping, facepalm, props)
- Whiteboard template config
- SVG style guide + animation principles reference docs

### Wave 3: Core Pipeline Skills
- intake, script-writer, character-designer, voice-generator, transcriber, storyboard

### Wave 4: Compositor & Renderer
- Scene Definition JSON schema
- Deterministic JS compositor (src/compositor/)
- HyperFrames render + FFmpeg assembly pipeline
- Publisher skill (SRT, metadata)

### Wave 5: Enhancement & Polish
- Gemini enhancer (music + thumbnail)
- Channel branding (simple watermark)
- E2E integration test

### Wave 6 (V1.5): Additional Templates
- Classic-stickman template
- Comic-panel template
- Veo hero shots with visual framing
