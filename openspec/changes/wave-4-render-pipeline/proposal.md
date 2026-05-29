# Wave 4: Render & Assembly Pipeline

## Summary

Add the render pipeline that takes composed scene HTML files and per-scene WAV audio, renders them via HyperFrames to MP4 segments, concatenates and mixes audio (narration + optional background music), and muxes the final output MP4.

## Motivation

The pipeline is the final execution stage that turns all upstream outputs (compositions, audio, music) into a deliverable video file. Without this, the agent produces HTML files but no watchable video.

## Scope

- `src/render/pipeline.js` — 6-step render pipeline (scene render, audio concat, music mix, video concat, final mux, optional vertical re-render)
- `src/render/package.json` — module metadata
- `references/youtube-optimization.md` — pacing/hook/thumbnail/audio guidelines for the script-writer and storyboard skills

## Design Decisions

1. **execSync for FFmpeg/HyperFrames** — scenes are sequential (each depends on prior render success), so async parallelism adds complexity without benefit. The 10-minute timeout per command is generous.
2. **No `-shortest` flag** — per plan requirement, this causes audio cutoff. We map video + audio streams explicitly.
3. **Music ducking at -18dB** — matches youtube-optimization.md audio guidelines. Uses FFmpeg `amix` filter.
4. **Concat via file lists** — FFmpeg's `-f concat -safe 0` approach avoids re-encoding and handles Windows paths correctly.
5. **Project state tracking** — updates `video-project.json` step status for resumability.
6. **Exported function + CLI** — `renderPipeline()` is importable by the agent orchestrator; CLI mode runs via `node src/render/pipeline.js --project ...`.

## Files Changed

| File | Action | Description |
|---|---|---|
| `src/render/pipeline.js` | New | 725-line render & assembly pipeline |
| `src/render/package.json` | New | Module metadata |
| `references/youtube-optimization.md` | New | YouTube optimization reference (pacing, hooks, thumbnails, audio) |
