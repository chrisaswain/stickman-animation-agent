# Gemini Enhancer

Generate background music and thumbnail using Gemini Media MCP tools.

## Input

- `video-project.json` — tone, template, topic
- `narration-script.json` — for music mood matching

## V1 Scope

### Background Music
Use `mcp__gemini-media__generate_music` with a prompt that matches the video's tone and genre.
- Poll `mcp__gemini-media__video_status` until complete
- Download via `mcp__gemini-media__download_video`
- Save to `projects/{slug}/audio/music.wav`

### Thumbnail
Use `mcp__gemini-media__generate_image` to create an eye-catching YouTube thumbnail.
- Aspect ratio: 16:9
- Save to `projects/{slug}/output/thumbnail.png`

## V1.5 Scope (Deferred)

### Hero Shots
For storyboard-flagged scenes, use `generate_video` or `animate_image`.
Must be framed within animation context (TV screen, dream sequence) or post-processed with sketch filter.

### Sound Effects
Use `generate_audio` for whoosh, pop, ding cues.
