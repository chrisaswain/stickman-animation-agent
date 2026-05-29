# Wave 4: Render Pipeline — Tasks

## Tasks

- [x] Create `src/render/pipeline.js` with 6-step render pipeline
  - [x] Step 1: Scene rendering via HyperFrames (headless Chrome → MP4 segments)
  - [x] Step 2: Audio concatenation (per-scene WAVs + inter-scene silence)
  - [x] Step 3: Music mixing (duck background music under narration at -18dB)
  - [x] Step 4: Video concatenation (scene MP4 segments → combined video)
  - [x] Step 5: Final mux (video + audio → output MP4, AAC 192k)
  - [x] Step 6: Optional vertical re-render (1080x1920 for Shorts)
- [x] Project state management (update video-project.json step status)
- [x] CLI entry point with --project and --template flags
- [x] Export renderPipeline() for programmatic use by agent orchestrator
- [x] Create `src/render/package.json` module metadata
- [x] Create `references/youtube-optimization.md` with pacing, hook structure, thumbnail, title, audio guidelines
- [x] Create OpenSpec proposal and tasks documents
