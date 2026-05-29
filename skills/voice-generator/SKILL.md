# Voice Generator

Generate per-scene WAV audio files from the narration script using the selected TTS engine.

## Input

- `video-project.json` — selected voice engine
- `narration-script.json` — scene narration text

## Engine Hierarchy

| Engine | Quality | Speed | Cost | Local? | Script |
|---|---|---|---|---|---|
| **Kokoro-82M** (default) | 4.5 MOS | Realtime | Free | Yes | `scripts/kokoro_tts.py` |
| **Coqui XTTS v2** | Higher | ~0.3x RT | Free | Yes | via audio-toolkit |
| **Gemini TTS** | Good | Fast | Free (quota) | No | `mcp__gemini-media__generate_audio` |
| **ElevenLabs V3** | Best | Fast | Freemium | No | ElevenLabs API |

## Process

1. For each scene, extract narration text
2. Generate WAV using selected engine
3. Save to `projects/{slug}/audio/scene-{NN}.wav`
4. Validate audio file exists and has non-zero duration

## Output

- `projects/{slug}/audio/scene-01.wav` through `scene-NN.wav`
- Updates `video-project.json` step status
