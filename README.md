# Stickman Animation Agent

Fully automated stickman animation video pipeline for Claude Code CLI. Transforms a topic into a complete narrated video with consistent characters, synced animation, background music, and subtitles.

## How It Works

```
Topic → Script → Characters → Voice → Timestamps → Storyboard → Compose → Enhance → Render → Publish
```

**Primary engine:** HyperFrames (HTML/SVG/GSAP rendered via headless Chrome) — deterministic SVG characters guarantee pixel-perfect consistency across all scenes.

**Secondary engine:** Gemini Media MCP — background music (Lyria) and thumbnails (Imagen).

### Two-Phase Scene Composition

Unlike approaches that ask AI to generate raw code, this agent uses a **two-phase architecture**:

1. **LLM generates Scene Definition JSON** — structured data describing characters, positions, camera moves, and timeline events
2. **Deterministic compositor renders HTML** — a JS function translates the JSON into final SVG/GSAP compositions

This makes the pipeline testable, debuggable, and robust.

## Setup

```powershell
# Clone
git clone https://github.com/chrisaswain/stickman-animation-agent.git
cd stickman-animation-agent

# Bootstrap (creates venv, installs deps, sets up symlinks)
.\bootstrap.ps1
```

### Requirements

- Python 3.12+
- Node.js 22+
- FFmpeg
- Chrome (for headless rendering)
- CUDA toolkit (optional, for GPU-accelerated Whisper)

## Usage

In Claude Code CLI:

```
/stickman-animation Why procrastination is killing your dreams
```

Or with options:

```
/stickman-animation --tone humorous --duration short --voice kokoro --auto
```

## Templates

| Template | Style | Status |
|---|---|---|
| `whiteboard` | Parchment bg, dark ink, Caveat font, draw-in animation | V1 |
| `classic-stickman` | Black bg, white stickmen, high contrast | V1.5 |
| `comic-panel` | White bg, panel borders, speech bubbles | V1.5 |

## Character System

Characters are defined as JSON sheets specifying proportions, SVG components, distinguishing features, and named poses. The compositor reads these sheets for every scene, guaranteeing the same character looks identical throughout the video.

Two-tier system:
- **Tier 1:** Standard characters (basic anatomy + expressions)
- **Tier 2:** Featured characters (additional detail — clothing patterns, accessories, hairstyles)

## Voice Engines

| Engine | Quality | Cost | Local |
|---|---|---|---|
| Kokoro-82M (default) | 4.5 MOS | Free | Yes |
| Coqui XTTS v2 | Higher | Free | Yes |
| Gemini TTS | Good | Free (quota) | No |
| ElevenLabs V3 | Best | Freemium | No |

## Project Output

Each video produces:
- Final MP4 (landscape and/or vertical)
- SRT subtitles
- YouTube thumbnail
- YouTube metadata (title, description, tags)

## License

MIT
