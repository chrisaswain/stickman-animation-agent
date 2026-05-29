# Scene Compositor

Two-phase scene composition: LLM generates structured Scene Definition JSON, then a deterministic JS compositor renders final HTML/SVG/GSAP.

## Input

- `narration-script.json` — scene directions
- `characters/{id}.json` — character sheets
- `timestamps/scene-*.json` — word-level timing
- `templates/{template}/template.json` — visual config
- `references/svg-style-guide.md` — SVG rules
- `references/animation-principles.md` — animation library

## Phase A: Scene Definition (LLM)

Generate `compositions/scene-{NN}.json` for each scene:

```json
{
  "sceneId": "03",
  "type": "dialogue",
  "background": "whiteboard/parchment",
  "camera": {
    "initial": { "x": 0, "y": 0, "scale": 1.0 },
    "moves": [{ "time": 3.5, "action": "zoom", "target": "bob.head", "scale": 1.5, "duration": 0.8 }]
  },
  "characters": [
    { "id": "bob", "pose": "pointing", "position": { "x": 200, "y": 400 }, "expression": "excited",
      "enter": { "time": 0.5, "method": "draw-in", "duration": 1.5 } }
  ],
  "props": [
    { "id": "laptop", "position": { "x": 350, "y": 420 }, "enter": { "time": 2.0, "method": "draw-in" } }
  ],
  "timeline": [
    { "time": 0.5, "target": "bob", "action": "enter-draw-in", "duration": 1.5 },
    { "time": 2.1, "target": "bob.arm_right", "action": "point-up", "duration": 0.5 },
    { "time": 4.0, "target": "bob.expression", "action": "change", "to": "surprised" }
  ],
  "speechBubbles": [
    { "speaker": "bob", "text": "Wait, what?!", "time": 4.0, "duration": 2.0 }
  ]
}
```

## Phase B: HTML Render (Deterministic)

Run `src/compositor/index.js` which:
1. Reads scene-definition.json
2. Loads character sheet → assembles SVG from components
3. Applies template palette, background, typography
4. Maps timeline events to GSAP calls using the animation function library
5. Outputs `compositions/scene-{NN}.html`

## Animation Function Library

Available actions for the `timeline` array:
- `enter-draw-in` / `enter-fade` / `exit-fade` — character entrance/exit
- `draw-in` — SVG stroke-dashoffset animation
- `walk-cycle` — alternating leg SVGs
- `expression-change` — swap expression SVG
- `camera-zoom` / `camera-pan` — camera wrapper transforms
- `speech-bubble-in` — bubble draw-in + text fade
- `squash-stretch` — comedic scale animation
- `point-gesture` / `wave` / `facepalm` / `celebrate` — arm presets
