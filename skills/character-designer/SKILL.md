# Character Designer

Create character sheet JSON for each character in the script. This is the key differentiator — ensures pixel-perfect character consistency across all scenes.

## Input

- `narration-script.json` — character names and roles
- `references/svg-style-guide.md` — available components
- `components/characters/` — available SVG parts

## Process

1. Extract all unique characters from the script
2. For each character, generate a character sheet JSON
3. Assign tier (1 = standard, 2 = featured with extra detail)
4. Select appropriate components from available SVGs
5. Define distinguishing features (accessories, patterns) for visual differentiation
6. Define named poses used in the script

## Output

`projects/{slug}/characters/{id}.json`:
```json
{
  "id": "bob",
  "name": "Bob",
  "tier": 1,
  "proportions": { "totalHeight": 220, "headDiameter": 80, "torsoWidth": 38 },
  "components": {
    "head": "front",
    "torso": "tshirt",
    "hair": "short-tufts",
    "defaultExpression": "neutral",
    "defaultArms": "relaxed",
    "defaultLegs": "standing"
  },
  "distinguishing": { "accessory": "glasses", "clothingPattern": "crosshatch" },
  "poses": {
    "standing": { "legs": "standing", "arms": "relaxed" },
    "pointing": { "legs": "standing", "arms": "pointing" },
    "walking": { "legs": "walking", "arms": "trailing" },
    "sleeping": { "legs": "standing", "arms": "relaxed", "expression": "sleeping" }
  }
}
```

## Checkpoint

If automation level is 3-checkpoints, present character sheets for user review.
