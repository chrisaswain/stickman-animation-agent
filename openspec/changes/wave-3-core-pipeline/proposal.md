# Proposal: Wave 3 — Core Pipeline (Schema & Presets)

## Problem

Wave 1 delivered SKILL.md files defining the 11-step pipeline, and Wave 2 delivered 78 SVG character/prop components. However, the pipeline skills reference two data artifacts that do not exist yet:

1. **Scene Definition JSON Schema** -- the scene-compositor SKILL.md describes Phase A as "generate scene-definition JSON" but there is no formal schema to validate that output. Without a schema, the LLM has no contract to follow and the compositor has no validation gate.

2. **Character presets** -- the character-designer SKILL.md describes generating character sheets per project, but common archetypes (narrator, everyman, villain) are rebuilt from scratch every time. A preset library eliminates redundant work and ensures consistent quality.

## Solution

### Scene Definition JSON Schema

Create `src/compositor/scene-schema.json` -- a JSON Schema (draft 2020-12) that formally defines the Scene Definition JSON structure. This schema:

- Validates all fields the compositor expects (sceneId, type, duration, background, camera, characters, props, timeline, speechBubbles, textOverlays)
- Enforces enums for scene types, camera actions, entrance methods, facing directions, bubble positions, and text styles
- Uses `$defs` for reusable sub-schemas (position, cameraMove, characterPlacement, etc.)
- Sets sensible constraints (duration 0.5-120s, camera scale 0.1-5.0, speech text max 200 chars)
- Marks required vs optional fields matching what the compositor actually needs

The compositor will validate incoming scene JSON against this schema before rendering. The LLM prompt for Phase A includes this schema as a contract.

### Character Presets

Create 4 character preset files in `character-library/presets/`:

| Preset | Role | Tier | Torso | Hair | Distinguishing |
|---|---|---|---|---|---|
| `narrator-male` | Generic male narrator | 1 | t-shirt | short-tufts | glasses |
| `narrator-female` | Generic female narrator | 1 | polo | ponytail | -- |
| `everyman` | Relatable average person | 1 | hoodie | medium-wavy | -- |
| `villain` | Antagonist/obstacle | 2 | suit | short-neat | pinstripe pattern, stern expression |

Each preset follows the character sheet schema from the character-designer SKILL.md, extended with `defaultHands` and `defaultFeet` fields. Presets can be copied into a project's `characters/` directory and customized per-video.

## Relationship to Prior Waves

- **Wave 1** (initial-scaffold): Created SKILL.md files, AGENT.md, project structure, references
- **Wave 2** (character-system): Created 78 SVG components that these presets reference
- **Wave 3** (this): Adds the data contracts (schema) and reusable data (presets) that bridge skills to the compositor

## Success Criteria

- Scene schema validates the example scene JSON from scene-compositor SKILL.md without errors
- All 4 character presets reference only SVG components that exist in `components/characters/`
- Schema catches invalid scenes (wrong enum, missing required field, out-of-range values)
