# Renderer

Render HyperFrames HTML compositions to MP4 segments and assemble the final video with FFmpeg.

## Input

- `compositions/scene-*.html` — rendered scene compositions
- `audio/scene-*.wav` — per-scene narration audio
- `audio/music.wav` — background music (optional)
- `video-project.json` — aspect ratio config

## Process

1. **Render scenes:** For each scene HTML, run `npx hyperframes render` to produce MP4 segment
2. **Concat video:** FFmpeg concat all scene segments (`-f concat -safe 0`)
3. **Concat audio:** Concat per-scene WAVs with 0.5s inter-scene silence
4. **Mix music:** Duck background music to -18dB during narration, -6dB in pauses
5. **Mux:** Combine video + mixed audio (`-c:v copy -c:a aac -b:a 192k`)
6. **Vertical render:** If aspect ratio is "both", render vertical version after landscape

## Critical Rules

- **Never use `-shortest` flag** — causes audio cutoff
- Render landscape first, then vertical if "both" selected
- Verify output file exists and has expected duration

## Output

- `projects/{slug}/output/{slug}.mp4` (landscape)
- `projects/{slug}/output/{slug}-vertical.mp4` (if "both")
