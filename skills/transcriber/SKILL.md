# Transcriber

Extract word-level timestamps from each scene WAV file using faster-whisper. These timestamps drive GSAP animation keyframes in the compositor.

## Input

- `projects/{slug}/audio/scene-*.wav` — per-scene audio files

## Process

1. For each scene WAV, run faster-whisper with word-level timestamps
2. Use `scripts/whisper_transcribe.py` via the project's `.venv`
3. Output JSON with start/end times per word

## Output

`projects/{slug}/timestamps/scene-{NN}.json`:
```json
{
  "sceneId": "01",
  "duration": 5.2,
  "words": [
    { "word": "You", "start": 0.0, "end": 0.15 },
    { "word": "wake", "start": 0.15, "end": 0.35 },
    { "word": "up", "start": 0.35, "end": 0.45 }
  ]
}
```
