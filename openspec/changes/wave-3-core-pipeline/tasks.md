# Tasks: Wave 3 — Core Pipeline (Schema & Presets)

## Scene Definition JSON Schema

- [x] Create `src/compositor/scene-schema.json` with JSON Schema draft 2020-12
- [x] Define top-level required fields: sceneId, type, duration, background, characters, timeline
- [x] Define top-level optional fields: camera, props, speechBubbles, textOverlays
- [x] Define `sceneId` pattern (zero-padded 2-3 digits)
- [x] Define `type` enum: action, dialogue, reaction, establishing, montage, closeup, title-card, transition
- [x] Define `camera` object with `initial` (position + scale) and `moves` array
- [x] Define camera move actions enum: zoom, pan, shake, reset
- [x] Define `characterPlacement` with id, pose, position, expression, facing, enter
- [x] Define `facing` enum: left, right, front
- [x] Define `enterAnimation` with time, method (draw-in, fade), duration
- [x] Define `propPlacement` with id, position, scale, enter
- [x] Define `timelineEvent` with time, target, action, duration, to, scale
- [x] Define `speechBubble` with speaker, text, time, duration, position (auto, above, left, right)
- [x] Define `textOverlay` with text, position, time, duration, style (heading, body, caption)
- [x] Add sensible min/max constraints (duration, scale, text length)
- [x] Use `$defs` for shared sub-schemas (position, cameraMove, enterAnimation, etc.)
- [x] Set `additionalProperties: false` on all objects to catch typos

## Character Presets

- [x] Create `character-library/presets/narrator-male.json` — tier 1, t-shirt, short-tufts, glasses
- [x] Create `character-library/presets/narrator-female.json` — tier 1, polo, ponytail
- [x] Create `character-library/presets/everyman.json` — tier 1, hoodie, medium-wavy
- [x] Create `character-library/presets/villain.json` — tier 2, suit, short-neat, pinstripe, stern
- [x] All presets include 5 standard poses: standing, pointing, walking, presenting, thinking
- [x] Villain preset includes extra poses: menacing, laughing
- [x] Everyman preset includes extra pose: shrugging
- [x] All presets include defaultHands and defaultFeet fields

## OpenSpec Documents

- [x] Create `openspec/changes/wave-3-core-pipeline/proposal.md`
- [x] Create `openspec/changes/wave-3-core-pipeline/tasks.md`
