# Publisher

Generate subtitles, YouTube metadata, apply brand watermark, and package final deliverables.

## Input

- `timestamps/scene-*.json` — word-level timing
- `video-project.json` — config, brand info
- `output/{slug}.mp4` — final video
- `output/thumbnail.png` — thumbnail

## Process

1. **SRT subtitles:** Generate from word-level timestamps using `scripts/generate_subtitles.py`
2. **YouTube metadata:** Generate title, description, tags via Claude
3. **Brand watermark:** If brand is configured, apply logo overlay via FFmpeg
4. **Package:** Report all output files with paths

## Output

- `projects/{slug}/output/{slug}.srt`
- `projects/{slug}/output/metadata.txt`
- Summary of all deliverables
