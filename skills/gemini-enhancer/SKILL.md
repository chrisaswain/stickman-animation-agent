# Gemini Enhancer

Generate background music and thumbnail using Gemini Media MCP tools.

## Prerequisites

- Run the enhancer JS first to generate prompts:
  ```
  node src/enhance/gemini-enhancer.js --project projects/{slug}/
  ```
  This produces `enhance/enhance-plan.json` with optimized prompts for both music and thumbnail.

## Workflow

### Step 1: Generate Prompts

Run the enhancer to produce the enhance plan:
```
node src/enhance/gemini-enhancer.js --project projects/{slug}/
```

Read the plan:
```
projects/{slug}/enhance/enhance-plan.json
```

### Step 2: Generate Music

1. Read the music prompt from `enhance/music-prompt.txt`
2. Call `mcp__gemini-media__generate_music` with the prompt
3. The tool returns an operation name — save it
4. Poll `mcp__gemini-media__video_status` with the operation name until `state` is `SUCCEEDED`
   - Poll every 10-15 seconds
   - If `FAILED`, log the error and skip music (non-fatal)
   - If quota exceeded, log and skip (non-fatal)
5. Call `mcp__gemini-media__download_video` with the operation name and save to `projects/{slug}/audio/music.wav`
6. Update the enhance plan status:
   ```
   node src/enhance/gemini-enhancer.js --project projects/{slug}/ --update-status music complete
   ```

### Step 3: Generate Thumbnail

1. Read the thumbnail prompt from `enhance/thumbnail-prompt.txt`
2. Call `mcp__gemini-media__generate_image` with the prompt and `aspectRatio: "16:9"`
3. Save the returned image to `projects/{slug}/output/thumbnail.png`
4. Update the enhance plan status:
   ```
   node src/enhance/gemini-enhancer.js --project projects/{slug}/ --update-status thumbnail complete
   ```

### Step 4: Complete Enhancement

After both music and thumbnail are done (or skipped):
```
node src/enhance/gemini-enhancer.js --project projects/{slug}/ --complete
```

This marks the `enhance` step as `complete` in `video-project.json`.

## Error Handling

All enhancement steps are **non-fatal**. If Gemini quota is exceeded or a generation fails:
1. Log the error
2. Mark the specific item as `skipped` in the enhance plan
3. Continue the pipeline — the video renders fine without music or a custom thumbnail

## Input

- `video-project.json` — tone, template, topic
- `narration-script.json` — for music mood matching (optional)

## V1.5 Scope (Deferred)

### Hero Shots
For storyboard-flagged scenes, use `generate_video` or `animate_image`.
Must be framed within animation context (TV screen, dream sequence) or post-processed with sketch filter.

### Sound Effects
Use `generate_audio` for whoosh, pop, ding cues.
