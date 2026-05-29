# Animation Principles & Function Library

Reference for the deterministic compositor's animation system. All animations are GSAP-based, rendered at 30fps via HyperFrames headless Chrome.

## Core Technique: SVG Draw-In

The signature "whiteboard drawing itself" effect. Every SVG path can be animated from invisible to fully drawn using `stroke-dashoffset`.

```javascript
// Calculate total path length
const length = path.getTotalLength();
// Set initial state: fully hidden
gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
// Animate: draw in over duration
gsap.to(path, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" });
```

## Animation Function Library

### Character Entrance/Exit

| Function | Description | GSAP Implementation |
|---|---|---|
| `enter-draw-in` | Character SVG paths draw in sequentially | `strokeDashoffset` stagger on all paths |
| `enter-fade` | Character fades in | `opacity: 0 → 1` |
| `exit-fade` | Character fades out | `opacity: 1 → 0` |
| `exit-draw-out` | Reverse draw-in | `strokeDashoffset` to path length |

### Body Animations

| Function | Description | Implementation |
|---|---|---|
| `walk-cycle` | Walking motion | Alternate leg SVGs via `yoyo: true, repeat: -1` |
| `point-gesture` | Arm points up/forward | Swap arm component, optional `rotation` tween |
| `wave` | Arm waves back and forth | Arm `rotation` with `yoyo: true, repeat: 2` |
| `facepalm` | Hand to face | Swap to facepalm arm component |
| `celebrate` | Both arms up | Swap to celebrating arm component + slight `y` bounce |
| `shrug` | Shoulders up, arms out | Scale torso slightly, swap arm component |

### Expression Changes

| Function | Description | Implementation |
|---|---|---|
| `expression-change` | Swap facial expression | Replace expression SVG `d` attribute or swap component |

Available expressions: neutral, happy, sad, angry, surprised, thinking, smirk, crying, sleeping, excited, confused, determined

### Camera

| Function | Description | Implementation |
|---|---|---|
| `camera-zoom` | Zoom to target | `.camera-wrapper` scale transform |
| `camera-pan` | Pan to position | `.camera-wrapper` translate transform |
| `camera-shake` | Impact/surprise shake | Rapid small `x/y` oscillation |
| `camera-reset` | Return to default view | Scale 1.0, translate 0,0 |

### Props & UI

| Function | Description | Implementation |
|---|---|---|
| `speech-bubble-in` | Speech bubble appears | Path draw-in + text `opacity` fade-up |
| `thought-bubble-in` | Thought bubble appears | Sequential circle draw-in + cloud draw-in |
| `prop-draw-in` | Prop appears | Same as character draw-in |
| `text-reveal` | Text appears word by word | Per-word `opacity` stagger synced to timestamps |

### Comedic Timing

| Function | Description | Implementation |
|---|---|---|
| `squash-stretch` | Exaggerated impact | `scaleX: 1.1, scaleY: 0.9` then bounce back |
| `head-shake` | Disagreement | Rapid `rotation` oscillation on head group |
| `double-take` | Surprised look back | Quick rotation away then snap back with expression change |
| `freeze-frame` | Dramatic pause | All animations pause, slight zoom, resume after delay |

## Timing Guidelines

- **Draw-in duration:** 1.0-2.0s for full character, 0.3-0.8s for individual parts
- **Expression change:** 0.2-0.3s (fast swap)
- **Camera moves:** 0.5-1.0s with `power2.inOut` ease
- **Walk cycle period:** 0.6-0.8s per step
- **Speech bubble:** 0.3s draw-in, hold for speech duration, 0.2s fade-out
- **Comedic beats:** 0.1-0.3s for impact, 0.5-1.0s hold for laugh

## Easing Presets

| Context | Ease |
|---|---|
| Draw-in | `power2.inOut` |
| Camera moves | `power2.inOut` |
| Entrance/exit | `power1.out` / `power1.in` |
| Comedic impact | `back.out(1.7)` |
| Bounce | `bounce.out` |
| Expression swap | `none` (instant) |

## Scene Composition Rules

1. Canvas size: 1920x1080 (landscape) or 1080x1920 (vertical)
2. Characters should occupy 40-60% of frame height
3. Leave breathing room — don't crowd the frame
4. Camera starts at default position unless establishing shot
5. Maximum 3 characters on screen simultaneously
6. Every animation must have a clear trigger (timestamp or timeline event)
7. Draw-in order: background elements → props → characters (back to front)
