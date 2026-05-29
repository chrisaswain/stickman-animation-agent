# Wave 5: Enhancement & Polish — Tasks

## Tasks

- [x] Create `src/enhance/gemini-enhancer.js` with music + thumbnail prompt generation
  - [x] Tone-to-genre mapping (humorous/educational/dramatic/absurd)
  - [x] Template-to-style mapping (whiteboard/classic-stickman/comic-panel)
  - [x] Read video-project.json and narration script for context
  - [x] Write music-prompt.txt, thumbnail-prompt.txt, enhance-plan.json
  - [x] CLI with --project, --template, --music-only, --thumbnail-only flags
  - [x] Update video-project.json step status
- [x] Create `src/enhance/package.json` module metadata
- [x] Create `tests/e2e-pipeline-test.js` with 6 integration tests
  - [x] Character sheet loading (everyman.json)
  - [x] Scene schema validation
  - [x] Compositor execution (HTML output verification)
  - [x] Render pipeline module loading
  - [x] Gemini enhancer module loading
  - [x] File discovery pattern matching
- [x] Create `tests/package.json` module metadata
- [x] Fix root package.json: add `"type": "module"` and `engines` field
- [x] Update project CLAUDE.md with command documentation
- [x] Register `/stickman-animation` in workspace CLAUDE.md task routing
- [x] Create OpenSpec proposal and tasks documents
- [x] All 6 E2E tests passing
