# Stickman Animation SVG Style Guide

This document defines the exact visual specifications for generating SVG illustrations in the stickman-animation-agent. The compositor MUST read this guide and any reference SVGs in `references/` before generating any scene illustrations.

## Core Aesthetic

Bean-body characters with expressive faces on warm parchment — hand-drawn, imperfect, personality-rich. Every illustration should look like a skilled animator sketched it on a whiteboard in real-time. The style works for **entertainment, comedy, storytelling, educational content, and any topic** where expressive stickman characters drive the narrative.

- **Near-monochrome**: black ink on parchment does 95% of the work. Power comes from line weight variation and hatching density, not color
- **Red accents are OPTIONAL and RARE**: max 1-2 per entire video, not per scene. Most scenes should be pure monochrome
- **One concept per scene**: each illustration communicates a single idea clearly
- **Generous whitespace**: don't crowd the frame — breathing room is part of the style
- **Visual metaphors over abstract symbols**: always show a concrete, recognizable object
- **Every figure has clothing**: no bare stick outlines — clothing communicates character, era, and role
- **Exaggerated poses for entertainment**: comedy and storytelling demand bigger gestures, wider stances, and more dramatic body language than educational content

---

## SVG Path Rules

### Stroke Properties
All illustration paths MUST use these stroke properties:
```xml
stroke="#1A1A1A"
stroke-linecap="round"
stroke-linejoin="round"
fill="none"
```

### Stroke Widths
| Element | Width |
|---|---|
| Major outlines (head, body, large objects) | 3.5-5px |
| Secondary outlines (arms, legs, props) | 2.5-3.5px |
| Detail lines (facial features, small props) | 2-2.5px |
| Cross-hatching | 1.5-2px |
| Ground shadow / surface lines | 1.5px |

### Path Commands
- Use cubic bezier curves (`C` commands) for ALL paths — never perfectly straight lines
- Control points should be offset 2-5px from mathematical perfection to create organic feel
- Example — a "straight" horizontal line from (10,50) to (200,50):
  ```
  BAD:  M10,50 L200,50
  GOOD: M10,50 C50,48 150,52 200,50
  ```
- For circles, use path approximations — never `<circle>` or `<ellipse>`:
  ```
  BAD:  <circle cx="100" cy="50" r="40"/>
  GOOD: <path d="M60,50 C60,28 78,10 100,10 C122,10 140,28 140,50 C140,72 122,90 100,90 C78,90 60,72 60,50 Z"/>
  ```
  Then add slight irregularity: offset 2-3 control points by 2-4px.

### Fill Rules
- **Default**: `fill="none"` (outline-only) for most elements
- **Solid fill**: `fill="#1A1A1A"` only for small dots (eyes, bullet points)
- **Pattern fill**: Use `url(#crosshatch)` for clothing, wood grain, shading
- **White fill**: `fill="#E5DDD0"` (parchment color) for head circles so the face area is clean

---

## Two-Tier Character System

Every video has characters at two detail levels. The compositor decides which tier each character gets based on their narrative role.

### Tier 1 — Standard Characters
Regular people, supporting characters, audience members, bystanders. Used for most figures in a scene.

### Tier 2 — Featured/Protagonist Characters
Main characters, recurring characters, authority figures, anyone the audience should focus on. 30-40% larger than Tier 1, with significantly more detail.

### Genre-Specific Tier 2 Examples
| Genre | Tier 2 Features |
|---|---|
| **Comedy/Entertainment** | Exaggerated proportions, oversized head reactions, dynamic action poses, costume details (hat, cape, tie) |
| **Storytelling** | Character-specific clothing, distinguishing accessories, richer hair detail |
| **Educational** | Lab coat or blazer, glasses, clipboard or pointer, pen in pocket |
| **Historical** | Period-appropriate clothing (armor, toga, Victorian dress, etc.), era-specific props |
| **Business** | Suit jacket with lapels, tie, briefcase or portfolio |
| **Generic authority** | Slightly elevated platform, teaching gesture, more detailed clothing than Tier 1 |

---

## Character Anatomy

### Tier 1 Proportions
```
Total height:  ~220px (standard standing figure)
Head:          ~80px diameter (intentionally large — 1:2.5 head-to-body ratio)
Neck:          ~15px
Torso:         Bean/capsule shape — 60px tall x 35-40px wide (NOT a single line)
Arms:          ~70px each, can bend at elbows
Legs:          ~75px each, slightly angled outward
Hands:         Mitten shape (~15x12px) with 3-4 finger bumps
Feet:          Shoe shapes (~20x10px rounded forms)
```

### Tier 2 Proportions
```
Total height:  ~300px (30-40% larger than Tier 1)
Head:          ~100px diameter
Neck:          ~18px
Torso:         Bean shape — 80px tall x 50px wide, wider shoulders
Arms:          ~90px each, more dynamic poses
Legs:          ~95px each
Hands:         Full fingers — 5 visible digits with knuckle suggestion
Feet:          Detailed footwear (sneakers with soles, boots, sandals with straps)
```

### Bean Torso (MANDATORY — No Single-Line Torsos)

The torso is a closed bean/capsule shape, NOT a single stick line. This is the single biggest difference from basic stick figures.

**Tier 1 bean torso:**
```xml
<!-- Bean torso — closed shape, filled with clothing pattern -->
<path class="torso" d="M82,100 C78,98 76,102 78,108 L80,155 C85,162 115,162 120,155 L122,108 C124,102 122,98 118,100 Z"
  stroke="#1A1A1A" stroke-width="3" fill="url(#crosshatch)" stroke-linecap="round"/>
```

**Tier 2 bean torso (wider, more defined shoulders):**
```xml
<!-- Broader torso for protagonist/featured characters -->
<path class="torso" d="M72,125 C65,122 62,128 65,136 L70,200 C78,210 142,210 150,200 L155,136 C158,128 155,122 148,125 Z"
  stroke="#1A1A1A" stroke-width="3.5" fill="url(#crosshatch-light)" stroke-linecap="round"/>
```

### Head Detail
```xml
<!-- Head outline — slightly imperfect circle, filled with parchment -->
<path class="head" d="M60,50 C60,27 79,8 102,9 C124,10 142,29 141,51 C140,73 121,91 99,91 C77,91 59,73 60,50 Z"
  stroke="#1A1A1A" stroke-width="4" fill="#E5DDD0" stroke-linecap="round"/>

<!-- Eyes — small solid dots -->
<circle class="left-eye" cx="85" cy="45" r="3.5" fill="#1A1A1A"/>
<circle class="right-eye" cx="115" cy="45" r="3.5" fill="#1A1A1A"/>

<!-- EYEBROWS — ALWAYS present, primary expression tool -->
<path class="left-brow" d="M78,34 C85,31 93,32 97,35"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path class="right-brow" d="M107,35 C111,32 119,31 126,34"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>

<!-- Mouth — single curved path -->
<path class="mouth" d="M85,65 C92,72 108,72 115,65"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
```

### Expressions (Eyebrows Are Primary)

Eyebrows MUST always be present on every figure. They are the #1 tool for conveying emotion — more important than mouth shape.

| Expression | Eyebrows | Mouth | SVG Brow Example |
|---|---|---|---|
| Neutral | Relaxed, slightly arched | Gentle upward curve | `M78,34 C85,31 93,32 97,35` (gentle arch) |
| Happy | Relaxed, slightly raised | Wide upward curve | `M78,32 C85,29 93,30 97,33` (lifted) |
| Sad | Inner ends angled UP (worry lines) | Downward curve | `M78,38 C85,33 93,32 97,30` (inner high, outer low) |
| Confused | One raised high, one level | Wavy/uneven line | Left: `M78,30 C85,26 93,28 97,32` Right: `M107,36 C111,35 119,35 126,36` |
| Surprised | Both raised HIGH | Small open circle (O shape) | `M78,28 C85,24 93,25 97,29` (both high) |
| Angry/Determined | Angled DOWN sharply toward center | Tight frown or set jaw | `M78,30 C85,33 93,35 97,38` (sharp inward angle) |
| Thinking | One slightly raised, slight furrow | Slight frown, hand on chin | `M78,33 C85,30 93,31 97,34` + `M107,35 C111,33 119,34 126,37` |
| Peaceful | Relaxed, gentle | Gentle smile, eyes as curved lines (not dots) | Same as neutral brows |

### Entertainment-Specific Expressions

These expressions go beyond educational — they are essential for comedy, storytelling, and reaction scenes.

| Expression | Eyebrows | Eyes | Mouth | Use Case |
|---|---|---|---|---|
| **Smirk** | One raised high, one flat | Normal dots, one slightly squinted | Asymmetric — one corner raised, other flat: `M85,65 C92,63 108,68 115,60` | Sarcasm, smugness, "I told you so" |
| **Crying** | Inner ends high (worry), outer ends drooping | Dots + 2-3 teardrop paths below each eye | Wide downward curve, mouth open: `M85,68 C92,60 108,60 115,68` with open fill | Sadness, comedy overreaction, frustration |
| **Sleeping** | Relaxed, slightly lowered | Replaced with curved lines (closed): `M80,45 C88,42 92,42 97,45` | Slightly open, slack: `M90,68 C95,70 105,70 110,68` | Sleep scenes, boredom, passed out |
| **Shocked/Jaw Drop** | Both raised VERY high | Large dots (r="4.5") | Wide open oval: `M85,62 C88,75 112,75 115,62 C112,80 88,80 85,62 Z` fill="#E5DDD0" | Reveals, comedy beats, disbelief |
| **Mischievous** | Both angled down slightly, asymmetric | Normal dots, slight squint | Toothy grin — zigzag line: `M85,65 C88,70 92,62 97,70 103,62 108,70 112,62 115,65` | Scheming, pranks, "evil genius" |
| **Exhausted** | Drooping outward, low | Half-lidded (curved lines halfway): `M80,44 C85,42 92,42 97,44` | Flat line, slightly wavy: `M88,68 C95,67 105,69 112,68` | Post-action, morning scenes, overworked |
| **Love-struck** | Raised, gentle arch | Replace dots with small hearts: `M82,42 C82,38 88,38 85,44 C82,38 78,38 82,42 Z` (two of them) | Dreamy smile, wide: `M82,65 C92,75 108,75 118,65` | Crush, admiration, comedy romance |

**Teardrop SVG (for crying expression):**
```xml
<!-- Teardrops — 2-3 per eye, staggered positions -->
<path class="tear" d="M82,52 C82,55 80,60 82,62 C84,60 84,55 82,52 Z"
  stroke="#1A1A1A" stroke-width="1.5" fill="#1A1A1A" opacity="0.5"/>
<path class="tear" d="M78,56 C78,59 76,64 78,66 C80,64 80,59 78,56 Z"
  stroke="#1A1A1A" stroke-width="1.5" fill="#1A1A1A" opacity="0.35"/>
```

### Hair

Hair is an identity marker — it helps distinguish characters from each other.

- **Tier 1 short hair**: 2-4 scribbly curved lines from top of head, 15-25px long
- **Tier 1 long hair**: Outline shape from top of head past chin, partial crosshatch fill
- **Tier 1 ponytail**: Hair shape gathered at back, single flowing line down
- **Tier 2 flowing hair**: Multiple wavy parallel lines from crown to shoulders, center part line, individual strand curves
- **Tier 2 beard**: Jawline-to-chin outline filled with crosshatch-light, multiple short curves showing texture
- **Bald/simple**: Just the head circle (Tier 1 only — Tier 2 always has distinguishing hair/headwear)

**Tier 2 flowing hair + beard example:**
```xml
<!-- Shoulder-length wavy hair with center part -->
<path class="hair-left" d="M65,30 C60,50 55,75 58,100 C62,105 68,95 72,80"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path class="hair-right" d="M135,30 C140,50 145,75 142,100 C138,105 132,95 128,80"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path class="hair-part" d="M100,5 C100,15 100,25 100,30"
  stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round"/>
<!-- Additional strand lines for fullness -->
<path d="M70,35 C65,55 62,75 65,90" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.6"/>
<path d="M130,35 C135,55 138,75 135,90" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.6"/>

<!-- Full beard with crosshatch texture -->
<path class="beard" d="M75,70 C72,85 80,105 100,112 C120,105 128,85 125,70"
  stroke="#1A1A1A" stroke-width="2.5" fill="url(#crosshatch-light)" stroke-linecap="round"/>
```

### Hands

Hands are expressive and must be visible (never omitted). Tier 1 gets mitten hands, Tier 2 gets full fingers.

**Tier 1 mitten hand (closed path with finger bumps):**
```xml
<!-- Open mitten hand, palm facing viewer -->
<path class="hand" d="M0,0 C-2,-8 2,-15 6,-12 C8,-15 12,-16 14,-12 C16,-15 20,-14 20,-10 C22,-12 25,-10 23,-6 L20,0 C15,4 5,4 0,0 Z"
  stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
```

**Tier 2 full-finger hand:**
```xml
<!-- Open hand with 5 visible fingers -->
<path class="hand" d="M0,5 L0,-5 C0,-10 3,-15 5,-12 L5,-18 C5,-22 8,-24 10,-20 L10,-22 C10,-26 13,-27 15,-22 L15,-18 C15,-22 18,-23 20,-18 L20,-10 C22,-14 25,-12 23,-6 L20,5 C15,8 5,8 0,5 Z"
  stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
```

**Hand gesture variants** (apply to either tier via transform):
| Gesture | Description | Use case |
|---|---|---|
| Open palm | Fingers spread, palm out | Teaching, offering, welcoming |
| Pointing | Index finger extended, others curled | Directing attention, emphasis |
| Holding | Fingers wrapped around object outline | Carrying props (phone, coffee, book) |
| Clasped | Both hands overlapping at center | Waiting, contemplation |
| Raised | Arm up, open hand above head | Question, celebration, surrender |
| Facepalm | Hand covering face, fingers spread over forehead | Frustration, disbelief, comedy |
| Thumbs up | Fist with thumb extended upward | Approval, "nailed it" |
| Wave | Open hand, fingers together, tilted | Greeting, goodbye |

### Body and Limbs

Arms and legs attach to the bean torso at shoulder/hip points, NOT at a single center line.

```xml
<!-- Arms — from shoulder area of bean torso, can bend at elbows -->
<path class="left-arm" d="M82,108 C68,118 55,135 45,150"
  stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
<path class="right-arm" d="M118,108 C132,118 145,135 155,150"
  stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>

<!-- Legs — from hip area of bean torso -->
<path class="left-leg" d="M90,160 C85,185 78,215 72,240"
  stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
<path class="right-leg" d="M110,160 C115,185 122,215 128,240"
  stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>

<!-- Feet — shoe shapes, not line endpoints -->
<path class="left-foot" d="M72,240 C65,242 58,244 55,242 C52,239 56,236 62,237 L72,240"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path class="right-foot" d="M128,240 C135,242 142,244 145,242 C148,239 144,236 138,237 L128,240"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
```

---

## Entertainment-Specific Body Components

These body poses go beyond standing/walking — they support action, comedy, and physical storytelling.

### Running Legs

Mid-stride running pose with exaggerated forward/back extension. One knee high, one leg trailing.

```xml
<!-- Running legs — left knee up, right trailing back -->
<g class="legs-running">
  <!-- Left leg (forward, knee up) -->
  <path class="left-leg" d="M95,160 C88,155 82,140 78,130 C80,135 88,148 98,155"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Left lower leg (shin forward) -->
  <path class="left-shin" d="M78,130 C82,138 90,148 100,152"
    stroke="#1A1A1A" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <!-- Right leg (trailing back) -->
  <path class="right-leg" d="M105,160 C115,170 128,190 140,210"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Right lower leg (kicked back) -->
  <path class="right-shin" d="M140,210 C135,218 128,228 120,235"
    stroke="#1A1A1A" stroke-width="2.8" fill="none" stroke-linecap="round"/>
</g>
```

**Running shoe feet** — sneaker shape with sole line and lace dots:
```xml
<!-- Running shoe — more detailed than standing shoe -->
<path class="running-shoe" d="M0,0 C-5,2 -12,4 -16,2 C-20,-1 -18,-6 -12,-6 L2,-4 C5,-3 6,-1 4,0 Z"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<!-- Sole line -->
<path d="M-14,-5 C-8,-4 0,-4 4,-3" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.6"/>
<!-- Lace dots -->
<circle cx="-4" cy="-3" r="1" fill="#1A1A1A"/>
<circle cx="-8" cy="-3" r="1" fill="#1A1A1A"/>
```

### Jumping Legs

Both legs off the ground. Two variants: joyful jump and action leap.

```xml
<!-- Joyful jump — legs tucked, arms up (pair with raised arms) -->
<g class="legs-jumping-joy">
  <path class="left-leg" d="M90,160 C82,172 70,178 65,172 C62,168 68,162 78,165"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="right-leg" d="M110,160 C118,172 130,178 135,172 C138,168 132,162 122,165"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>

<!-- Action leap — one leg forward, one back (superhero/dynamic) -->
<g class="legs-jumping-action">
  <path class="left-leg" d="M95,160 C85,155 72,145 60,140"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="right-leg" d="M105,160 C118,175 132,195 145,210"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>
```

**Jump shadow** — oval ground shadow to indicate airborne:
```xml
<!-- Ground shadow for jumping figures — squished oval beneath -->
<path class="jump-shadow" d="M70,250 C85,247 115,247 130,250 C115,253 85,253 70,250 Z"
  stroke="none" fill="#1A1A1A" opacity="0.15"/>
```

### Crossed Arms

Arms folded across the chest — skepticism, defiance, waiting, cool confidence.

```xml
<!-- Crossed arms over torso -->
<g class="arms-crossed">
  <!-- Left arm crossing over to right -->
  <path class="left-arm" d="M82,108 C78,115 85,125 100,128 C112,130 125,125 130,118"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Right arm crossing over to left -->
  <path class="right-arm" d="M118,108 C122,115 115,125 100,128 C88,130 75,125 70,118"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Hands tucked (mitten bumps visible at elbows) -->
  <path class="left-hand" d="M130,118 C133,115 135,118 132,121"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
  <path class="right-hand" d="M70,118 C67,115 65,118 68,121"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
</g>
```

### Facepalm Arms

One hand covering the face, other arm hanging or on hip.

```xml
<!-- Facepalm — right hand on face, left arm hanging -->
<g class="arms-facepalm">
  <!-- Right arm up to face -->
  <path class="right-arm" d="M118,108 C125,100 120,85 110,70 C105,65 100,62 95,60"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Hand spread across forehead/eyes -->
  <path class="right-hand" d="M88,55 C92,50 100,48 108,50 C112,52 110,60 105,62 C100,64 92,62 88,58 Z"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
  <!-- Left arm hanging limply -->
  <path class="left-arm" d="M82,108 C72,120 65,140 62,160"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>
```

### Celebrating Arms

Both arms raised above head — victory, excitement, touchdown.

```xml
<!-- Celebrating — both arms up, slight V shape -->
<g class="arms-celebrating">
  <path class="left-arm" d="M82,108 C72,95 60,70 52,45 C48,35 50,25 55,20"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path class="right-arm" d="M118,108 C128,95 140,70 148,45 C152,35 150,25 145,20"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Open hands at top -->
  <path class="left-hand" d="M55,20 C50,15 48,10 52,8 C56,6 60,10 58,16 L55,20"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
  <path class="right-hand" d="M145,20 C150,15 152,10 148,8 C144,6 140,10 142,16 L145,20"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
</g>
```

**Celebration sparkle lines** (draw around celebrating character):
```xml
<!-- Sparkle/excitement lines — 4-6 short radiating dashes around head/hands -->
<path d="M45,10 L38,2" stroke="#1A1A1A" stroke-width="2" fill="none" opacity="0.5"/>
<path d="M155,10 L162,2" stroke="#1A1A1A" stroke-width="2" fill="none" opacity="0.5"/>
<path d="M50,30 L40,28" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
<path d="M150,30 L160,28" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
```

---

## Entertainment Props

Props for everyday, modern, and comedic scenes. All props follow the same hand-drawn aesthetic: cubic beziers, slight irregularity, material textures.

### Phone (Smartphone)

```xml
<!-- Smartphone — rounded rectangle with screen glow line -->
<g class="phone">
  <path d="M0,0 C0,-2 2,-4 5,-4 L35,-4 C38,-4 40,-2 40,0 L40,70 C40,72 38,74 35,74 L5,74 C2,74 0,72 0,70 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Screen area -->
  <path d="M4,6 C4,5 5,4 6,4 L34,4 C35,4 36,5 36,6 L36,62 C36,63 35,64 34,64 L6,64 C5,64 4,63 4,62 Z"
    stroke="#1A1A1A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/>
  <!-- Home button / notch -->
  <path d="M16,68 C18,67 22,67 24,68" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
  <!-- Screen content lines (text/app suggestion) -->
  <path d="M8,15 C14,14 26,16 32,15" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M8,25 C16,24 24,26 32,25" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
</g>
```

### Laptop

```xml
<!-- Laptop — open, angled slightly for depth -->
<g class="laptop">
  <!-- Screen -->
  <path d="M10,0 C10,-2 12,-3 14,-3 L106,-3 C108,-3 110,-2 110,0 L110,65 L10,65 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Screen inner border -->
  <path d="M15,3 L105,3 L105,60 L15,60 Z"
    stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
  <!-- Keyboard base (perspective) -->
  <path d="M5,65 C5,66 8,68 10,68 L110,68 C112,68 115,66 115,65 L120,85 C120,87 118,88 115,88 L5,88 C2,88 0,87 0,85 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="url(#crosshatch-light)" stroke-linecap="round"/>
  <!-- Keyboard key suggestion (grid of small marks) -->
  <path d="M15,72 C25,71 35,73 45,72" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M55,72 C65,71 75,73 85,72" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M15,78 C35,77 55,79 75,78" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <!-- Screen text lines -->
  <path d="M22,15 C40,14 60,16 80,15" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M22,25 C45,24 65,26 88,25" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
</g>
```

### Clock (Wall Clock)

```xml
<!-- Wall clock — round face with hands -->
<g class="clock">
  <!-- Clock face (imperfect circle) -->
  <path d="M10,50 C10,27 28,8 52,9 C75,10 92,28 91,51 C90,73 72,91 50,91 C28,91 10,73 10,50 Z"
    stroke="#1A1A1A" stroke-width="3" fill="#E5DDD0" stroke-linecap="round"/>
  <!-- Hour markers (12, 3, 6, 9 only — minimal) -->
  <path d="M50,15 L50,22" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M50,78 L50,85" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M15,50 L22,50" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M78,50 L85,50" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <!-- Hour hand -->
  <path d="M50,50 C48,42 46,35 48,28" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Minute hand -->
  <path d="M50,50 C55,42 60,32 62,22" stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="50" cy="50" r="3" fill="#1A1A1A"/>
</g>
```

### Bed

```xml
<!-- Bed — side view with pillow and blanket -->
<g class="bed">
  <!-- Mattress/frame -->
  <path d="M0,40 C0,35 5,30 10,30 L150,30 C155,30 160,35 160,40 L160,60 C160,65 155,70 150,70 L10,70 C5,70 0,65 0,60 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Pillow (left side, puffy) -->
  <path d="M8,28 C12,18 38,18 42,28 C42,32 38,35 25,35 C12,35 8,32 8,28 Z"
    stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0" stroke-linecap="round"/>
  <!-- Blanket folds -->
  <path d="M40,32 C70,30 110,33 150,31" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M45,45 C75,43 115,46 145,44" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.35"/>
  <!-- Blanket crosshatch (partial coverage) -->
  <path d="M42,30 L150,30 L150,55 L42,55 Z" fill="url(#crosshatch-light)" stroke="none" opacity="0.3"/>
  <!-- Legs -->
  <path d="M5,70 L5,85" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M155,70 L155,85" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Headboard -->
  <path d="M0,10 C0,5 3,0 8,0 L42,0 C47,0 50,5 50,10 L50,30"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
```

### Desk

```xml
<!-- Desk — front-ish view with surface and legs -->
<g class="desk">
  <!-- Desktop surface (slight perspective) -->
  <path d="M0,0 C0,-2 3,-3 5,-3 L155,-3 C157,-3 160,-2 160,0 L160,8 L0,8 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Surface wood grain -->
  <path d="M20,1 C50,0 90,2 130,1" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.25"/>
  <path d="M10,5 C60,4 100,6 150,5" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.2"/>
  <!-- Front panel -->
  <path d="M8,8 L152,8 L152,65 L8,65 Z"
    stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Drawer -->
  <path d="M55,20 L105,20 L105,45 L55,45 Z"
    stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.6"/>
  <!-- Drawer handle -->
  <path d="M72,32 C76,30 84,30 88,32" stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Legs -->
  <path d="M8,65 L5,90" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M152,65 L155,90" stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
```

### Coffee Cup

```xml
<!-- Coffee cup — with steam wisps -->
<g class="coffee">
  <!-- Cup body -->
  <path d="M10,15 C10,12 12,10 15,10 L55,10 C58,10 60,12 60,15 L58,55 C57,60 53,63 48,63 L22,63 C17,63 13,60 12,55 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Handle -->
  <path d="M60,20 C68,18 72,25 72,35 C72,45 68,50 60,48"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Coffee level line -->
  <path d="M14,22 C22,20 38,21 48,19 C54,18 56,20 56,22"
    stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
  <!-- Steam wisps (3 wavy vertical lines) -->
  <path d="M25,5 C23,-2 27,-8 25,-15" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.3" stroke-linecap="round"/>
  <path d="M35,3 C37,-5 33,-12 35,-18" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M45,5 C43,-3 47,-10 45,-16" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.2" stroke-linecap="round"/>
</g>
```

### Thought Bubble

```xml
<!-- Thought bubble — cloud shape with trailing circles -->
<g class="thought-bubble">
  <!-- Main cloud -->
  <path d="M30,10 C15,10 5,20 8,32 C2,38 5,50 18,52 C15,60 25,68 38,65 C42,72 58,72 65,65 C78,68 88,58 85,48 C92,42 90,30 80,25 C82,15 72,8 60,10 C52,5 38,5 30,10 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="#E5DDD0" stroke-linecap="round"/>
  <!-- Trailing thought circles (from cloud down to character head) -->
  <path d="M25,68 C22,72 20,74 22,78 C24,80 28,78 26,74" stroke="#1A1A1A" stroke-width="2" fill="#E5DDD0"/>
  <path d="M18,82 C16,85 17,88 20,88 C23,88 23,85 20,83" stroke="#1A1A1A" stroke-width="1.5" fill="#E5DDD0"/>
  <circle cx="15" cy="94" r="3" stroke="#1A1A1A" stroke-width="1.5" fill="#E5DDD0"/>
</g>
```

### Speech Bubble

```xml
<!-- Speech bubble — rounded shape with pointer tail -->
<g class="speech-bubble">
  <!-- Main bubble -->
  <path d="M15,5 C5,5 0,15 0,25 C0,40 5,48 15,50 L15,55 C8,52 5,55 10,60 L25,52 C30,53 40,53 50,52 L75,52 C88,52 95,42 95,30 C95,15 88,5 75,5 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="#E5DDD0" stroke-linecap="round"/>
  <!-- Text lines inside -->
  <path d="M15,18 C30,17 55,19 70,18" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M15,28 C35,27 50,29 65,28" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M15,38 C25,37 40,39 50,38" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.4"/>
</g>
```

---

## Clothing and Shading

**MANDATORY RULE: Every figure MUST wear clothing.** No bare bean-torso outlines. Clothing communicates character identity, era, and role. The bean torso IS the clothing — fill it with the appropriate pattern.

### Cross-Hatch Pattern Definition
Include these three densities in every composition's SVG `<defs>`:
```xml
<!-- Dark clothing (jackets, dark shirts, heavy fabric) -->
<pattern id="crosshatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <path d="M0,4 L8,4" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round"/>
</pattern>
<!-- Very dark / shadow areas -->
<pattern id="crosshatch-dense" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <path d="M0,2.5 L5,2.5" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round"/>
</pattern>
<!-- Light clothing (t-shirts, light fabric, lab coats) -->
<pattern id="crosshatch-light" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <path d="M0,5 L10,5" stroke="#1A1A1A" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
</pattern>
```

### Clothing by Genre

**Modern casual (Tier 1 default):**
```xml
<!-- T-shirt — bean torso IS the shirt, filled with crosshatch -->
<path class="shirt" d="M82,100 C78,98 76,102 78,108 L80,155 C85,162 115,162 120,155 L122,108 C124,102 122,98 118,100 Z"
  stroke="#1A1A1A" stroke-width="3" fill="url(#crosshatch)" stroke-linecap="round"/>
<!-- Short sleeves -->
<path class="left-sleeve" d="M82,102 C75,108 68,118 65,125 C70,127 78,122 82,115"
  stroke="#1A1A1A" stroke-width="2.5" fill="url(#crosshatch)" stroke-linecap="round"/>
<path class="right-sleeve" d="M118,102 C125,108 132,118 135,125 C130,127 122,122 118,115"
  stroke="#1A1A1A" stroke-width="2.5" fill="url(#crosshatch)" stroke-linecap="round"/>
```

**Hoodie (casual, modern):**
```xml
<!-- Hoodie — wider bean with hood outline at neck -->
<path class="hoodie" d="M78,100 C74,98 72,102 74,108 L76,160 C82,168 118,168 124,160 L126,108 C128,102 126,98 122,100 Z"
  stroke="#1A1A1A" stroke-width="3" fill="url(#crosshatch)" stroke-linecap="round"/>
<!-- Hood at back of neck -->
<path class="hood" d="M85,96 C90,88 110,88 115,96"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<!-- Front pocket -->
<path d="M88,135 C95,133 105,133 112,135 L112,155 L88,155 Z"
  stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
```

**Lab coat / professional (Tier 2):**
```xml
<!-- Lab coat — longer bean shape, open front -->
<path class="coat" d="M70,125 C68,170 66,220 65,260 L80,262 L85,140"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path class="coat-right" d="M150,125 C152,170 154,220 155,260 L140,262 L135,140"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<!-- Lapels -->
<path d="M95,128 L100,155" stroke="#1A1A1A" stroke-width="2" fill="none"/>
<path d="M125,128 L120,155" stroke="#1A1A1A" stroke-width="2" fill="none"/>
<!-- Pocket with pen -->
<path d="M130,150 L145,150 L145,170 L130,170 Z" stroke="#1A1A1A" stroke-width="1.5" fill="none"/>
<path d="M138,145 L138,155" stroke="#1A1A1A" stroke-width="1.5" fill="none"/>
```

---

## Component Assembly

The component library at `components/characters/` provides pre-built body parts that the compositor assembles into characters. This produces consistent proportions and quality without generating every bezier coordinate from scratch.

### Component Directory

```
components/characters/
  tier1/
    heads/         (front, three-quarter-left, three-quarter-right, profile)
    torsos/        (tshirt, hoodie, polo)
    arms/          (relaxed, hanging-low, forward-holding, trailing, pointing, raised, crossed, facepalm, celebrating)
    legs/          (standing, walking, sitting, running, jumping-joy, jumping-action)
    hands/         (mitten-open, mitten-closed, pointing, holding, raised, facepalm, thumbs-up, wave)
    feet/          (standing-shoe, walking-shoe, running-shoe)
    hair/          (short-tufts, medium-wavy, ponytail, bald, long-straight)
    expressions/   (neutral, sad, focused, happy, surprised, angry, thinking, speaking,
                    smirk, crying, sleeping, shocked, mischievous, exhausted, love-struck)
  tier2/
    torsos/        (lab-coat, suit, hoodie-detailed, armor-tunic, generic-authority)
    hands/         (teaching-palm, gripping, clipboard-hold, fist, beckoning, phone-hold)
    hair/          (flowing-beard, short-neat, helmet, crown, headband)
    feet/          (formal-shoes, boots, sneakers-detailed)
    accessories/   (glasses, clipboard, cape, headphones, hat)
```

### How to Use Components

1. **Copy, don't `<use>`** — Copy the `<g>` element from each component SVG directly into the scene SVG. This avoids cross-file reference issues in rendering.

2. **Attachment points** — Each component has `data-attach-*` attributes (e.g., `data-attach-neck="0,0"`). Position each part so its attachment point aligns with the corresponding point on the connected part.

3. **Assembly order** (bottom to top for correct z-order):
   ground/shadow -> feet -> legs -> torso -> arms -> hands -> head -> hair -> expression -> accessories

4. **Positioning with transforms:**
   ```xml
   <g class="character" transform="translate(200, 50)">
     <g transform="translate(0, 170)"><!-- legs from standing.svg --></g>
     <g transform="translate(0, 0)"><!-- torso from tshirt.svg --></g>
     <g transform="translate(0, -80)"><!-- head from front.svg --></g>
     <g transform="translate(0, -130)"><!-- hair from short-tufts.svg --></g>
     <g transform="translate(0, -80)"><!-- expression from neutral.svg --></g>
     <g transform="translate(-35, 10)"><!-- left arm --></g>
     <g transform="translate(35, 10)"><!-- right arm --></g>
   </g>
   ```

5. **Mirroring** — Arms, hands, and feet are drawn for one side. For the opposite side, wrap in `<g transform="scale(-1,1)">` and adjust the translate.

6. **Scaling** — Tier 1: ~220px at default. Tier 2: ~300px. Scale the entire character group, never individual parts.

7. **Pattern definitions** — Components using `url(#crosshatch)`, `url(#crosshatch-dense)`, or `url(#crosshatch-light)` require those patterns in the scene's `<defs>` (already in composition templates).

### Tier Selection Rules

- **Tier 1**: Supporting characters, crowd, bystanders, "everyman" roles. Mitten hands, simple clothing.
- **Tier 2**: Protagonists, recurring characters, named characters, authority figures. 5-finger hands, genre-specific clothing, accessories.
- A video's main character is usually Tier 2. Everyone else is Tier 1 unless narratively significant.

### Head-Leg Pairing Rules

Walking, running, and sitting legs imply a viewing angle. The head MUST match:

| Legs | Compatible Heads | Incompatible |
|---|---|---|
| `standing` | front, three-quarter-left, three-quarter-right, profile | -- |
| `walking` | three-quarter-right, profile | front, three-quarter-left |
| `running` | three-quarter-right, profile | front, three-quarter-left |
| `sitting` | front, three-quarter-left, three-quarter-right | profile |
| `jumping-joy` | front | profile (looks awkward mid-air) |
| `jumping-action` | three-quarter-right, profile | front (action leaps need direction) |

**Walking/running figures face the direction of travel.** The walking/running legs stride toward the right, so the head must also face right (three-quarter-right or profile). A front-facing head on walking legs reads as walking toward the viewer while sliding sideways — visually confusing.

To make a character walk/run LEFT, mirror the entire character group with `transform="scale(-1,1)"` — this flips both the legs and the head together, keeping them aligned.

### Mix-and-Match Rules

- Tier 1 heads + Tier 1 torsos match at ~220px scale
- Tier 2 torsos expect ~300px scale — don't mix Tier 1 heads with Tier 2 torsos without scaling
- Any expression works with any head (same face-center origin)
- Any hair works with any head (adjust translate for head shape)
- Tier 2 hands can attach to Tier 1 arms when a character needs to hold something specific
- Only draw from scratch when no component exists — and match existing component style exactly

---

## Props and Objects

### Design Philosophy

Props must have **dimension and texture** — never flat geometric outlines. A desk should have wood grain, a laptop should have keyboard marks, a coffee cup should have steam. Props are what make a scene feel grounded and real.

### Material Textures

Apply these texture techniques to give props weight and substance:

| Material | Technique | Example |
|---|---|---|
| **Wood** | 3-5 parallel wavy lines along the grain direction, knot circles | Desks, doors, tables, staffs |
| **Metal** | Smooth outlines + white highlight gap (3-4px) on one side for sheen | Laptops, keys, crowns |
| **Stone** | Irregular bumpy outline + stipple dots or dense crosshatch | Walls, cliff faces, tombstones |
| **Fabric** | 2-4 curved fold lines + crosshatch-light fill | Blankets, curtains, clothing |
| **Glass/Liquid** | Outline-only container + partial wavy fill for liquid level | Coffee cups, beakers, bottles |
| **Paper/Parchment** | Slightly curled edges + faint horizontal lines | Books, scrolls, letters |
| **Plastic/Electronics** | Clean outlines + minimal inner detail lines for screens/buttons | Phones, laptops, keyboards |

### Common Objects Reference

```xml
<!-- Open book — with page thickness and edge detail -->
<g class="book">
  <path d="M0,30 C5,10 35,5 50,8 C65,5 95,10 100,30 L100,70 C95,55 65,50 50,53 C35,50 5,55 0,70 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M50,8 L50,53" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <!-- Page thickness on bottom edge -->
  <path d="M2,70 C2,73 5,75 5,72" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M98,70 C98,73 95,75 95,72" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
  <!-- Page lines -->
  <path d="M15,25 C25,23 38,22 45,22" stroke="#1A1A1A" stroke-width="1" opacity="0.5"/>
  <path d="M15,35 C25,33 38,32 45,32" stroke="#1A1A1A" stroke-width="1" opacity="0.5"/>
  <path d="M55,22 C65,23 78,24 85,25" stroke="#1A1A1A" stroke-width="1" opacity="0.5"/>
</g>

<!-- Heart -->
<g class="heart">
  <path d="M50,85 C50,85 10,55 10,30 C10,10 30,5 50,25 C70,5 90,10 90,30 C90,55 50,85 50,85 Z"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>

<!-- Door — with wood grain and handle -->
<g class="door">
  <path d="M10,0 C10,-2 12,-3 14,-3 L66,-3 C68,-3 70,-2 70,0 L70,100 L10,100 Z"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Wood grain -->
  <path d="M25,2 C24,25 26,55 25,95" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M40,2 C41,30 39,60 40,95" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.25"/>
  <path d="M55,2 C54,28 56,62 55,95" stroke="#1A1A1A" stroke-width="1" fill="none" opacity="0.3"/>
  <!-- Handle -->
  <path d="M58,52 C62,50 64,52 64,56 C64,60 62,62 58,60"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>

<!-- Question mark (floating above head) -->
<g class="question-mark">
  <path d="M40,5 C40,-5 60,-5 60,5 C60,15 50,18 50,30"
    stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="40" r="3" fill="#1A1A1A"/>
</g>

<!-- Arrow (pointing right) -->
<g class="arrow">
  <path d="M0,25 C30,24 60,26 90,25" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M75,15 L90,25 L75,35" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>

<!-- Light bulb -->
<g class="lightbulb">
  <path d="M35,5 C35,-15 65,-15 65,5 C65,20 55,25 55,35 L45,35 C45,25 35,20 35,5 Z"
    stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M43,35 L57,35" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M44,40 L56,40" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <!-- Rays -->
  <path d="M50,-20 L50,-30" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M25,-10 L18,-18" stroke="#1A1A1A" stroke-width="2" fill="none"/>
  <path d="M75,-10 L82,-18" stroke="#1A1A1A" stroke-width="2" fill="none"/>
</g>
```

---

## Environments & Landscapes

Environments should feel organic and extend beyond the frame — never contained boxes or geometric shapes. Terrain, rooms, and settings all bleed off-screen edges to create a sense of place larger than the visible frame.

### Ground Hatching (Under Figures)

Every standing figure MUST have ground hatching — 2-4 short organic lines beneath their feet:
```xml
<g class="ground">
  <path d="M30,240 C50,238 80,242 110,240 C140,238 160,241 170,240"
    stroke="#1A1A1A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>
  <path d="M40,245 C55,244 70,246 85,244"
    stroke="#1A1A1A" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.4"/>
  <path d="M120,244 C135,243 150,245 160,243"
    stroke="#1A1A1A" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.4"/>
</g>
```

### Outdoor Landscapes

```xml
<!-- Horizon line (curved, at 30-40% from bottom) -->
<path d="M-20,380 C200,375 500,385 700,378 C850,374 950,380 970,378"
  stroke="#1A1A1A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>

<!-- Rolling hills -->
<path d="M-20,370 C80,340 180,355 280,345 C380,335 480,350 580,340 C680,330 780,345 970,338"
  stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.4"/>

<!-- Sun (half-circle at horizon with radiating lines) -->
<path d="M800,380 C800,350 830,330 860,330 C890,330 920,350 920,380"
  stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M860,320 L860,305" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.5"/>
<path d="M830,325 L820,312" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
<path d="M890,325 L900,312" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.4"/>
```

### Indoor Environments

Suggest rooms with partial lines — don't box in the scene:

```xml
<!-- Floor line -->
<path d="M-20,500 C200,498 500,502 700,499 C850,497 970,500 980,499"
  stroke="#1A1A1A" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/>

<!-- Wall suggestion (partial vertical lines at frame edges) -->
<path d="M-10,200 C-8,300 -10,400 -10,500" stroke="#1A1A1A" stroke-width="2" fill="none" opacity="0.3"/>
<path d="M960,180 C958,280 960,400 960,500" stroke="#1A1A1A" stroke-width="2" fill="none" opacity="0.3"/>

<!-- Window with light rays -->
<path d="M780,220 L780,340 L880,340 L880,220 Z" stroke="#1A1A1A" stroke-width="2.5" fill="none" opacity="0.5"/>
<path d="M830,220 L830,340" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.3"/>
<path d="M780,280 L880,280" stroke="#1A1A1A" stroke-width="1.5" fill="none" opacity="0.3"/>
```

### Environment Checklist

- [ ] Terrain extends past viewBox edges (negative x or beyond width)
- [ ] No rectangles or boxes for natural features — only irregular paths
- [ ] Ground hatching under every standing figure
- [ ] Indoor scenes use suggestion (partial walls) not full enclosures
- [ ] Landscapes have at least 2 depth layers (foreground + background)

---

## SVG Hand-Drawn Filters

Include ALL three filter variants in every composition's SVG `<defs>`. The compositor chooses which filter to apply to each element group.

### Filter Definitions

```xml
<!-- Default: layered wobble for illustrations -->
<filter id="hand-drawn">
  <feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="2" result="fine-noise" seed="[SCENE_NUMBER]"/>
  <feTurbulence type="turbulence" baseFrequency="0.005" numOctaves="1" result="broad-noise" seed="[SCENE_NUMBER + 100]"/>
  <feDisplacementMap in="SourceGraphic" in2="fine-noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="fine-displaced"/>
  <feDisplacementMap in="fine-displaced" in2="broad-noise" scale="1.0" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<!-- Bold: more expressive wobble for large titles and headings -->
<filter id="hand-drawn-bold">
  <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="fine-noise" seed="[SCENE_NUMBER]"/>
  <feTurbulence type="turbulence" baseFrequency="0.004" numOctaves="1" result="broad-noise" seed="[SCENE_NUMBER + 100]"/>
  <feDisplacementMap in="SourceGraphic" in2="fine-noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="fine-displaced"/>
  <feDisplacementMap in="fine-displaced" in2="broad-noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<!-- Paper texture: subtle grain overlay for parchment background -->
<filter id="paper-texture" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" result="paper-noise" seed="42"/>
  <feDiffuseLighting in="paper-noise" lighting-color="#E5DDD0" surfaceScale="1.2" result="paper-lit">
    <feDistantLight azimuth="225" elevation="55"/>
  </feDiffuseLighting>
  <feComposite in="paper-lit" in2="SourceGraphic" operator="in"/>
  <feBlend in2="SourceGraphic" mode="multiply" result="textured"/>
</filter>
```

### How the layered approach works

The `hand-drawn` filter chains TWO displacement passes:
1. **Fine wobble** (`baseFrequency="0.025"`, `scale="1.8"`) — small, frequent line imperfections like a quickly-drawn pen stroke
2. **Broad drift** (`baseFrequency="0.005"`, `scale="1.0"`) — slow, organic sway that makes the whole shape feel hand-placed

The two layers combined produce more natural imperfection than a single pass. Fine wobble alone looks jittery; broad drift alone looks rubbery. Together they read as confident hand-drawing.

### When to use each filter

| Filter | Apply to | Effect |
|--------|----------|--------|
| `hand-drawn` | Main illustration `<g>` group | Default for all figures, props, environments |
| `hand-drawn-bold` | SVG text/title elements inside illustrations | More expressive wobble for hand-lettered headings |
| `paper-texture` | Full-screen background rectangle (optional) | Subtle grain on parchment — use sparingly |

### Rules

- `seed` must be deterministic — use the scene number for fine noise, scene number + 100 for broad noise
- Apply `hand-drawn` to the illustration `<g>`, NOT to HTML text elements (font handles text)
- `paper-texture` is optional — only use if the scene feels too flat/clean
- Never stack filters on nested groups (one filter per element, outermost group wins)

---

## Red Accent Rules

Red accents (`#C0392B`) are **optional and rare**. Most scenes should be pure monochrome — the power comes from line weight variation and hatching density, not color. Use red for maximum 1-2 moments in an entire video, reserved for the single most important emphasis.

When used, options:
```xml
<!-- Red underline (beneath the most critical word/title in the video) -->
<path d="M10,0 C60,3 130,-2 190,1" stroke="#C0392B" stroke-width="3" fill="none" stroke-linecap="round"/>

<!-- Red arrow (directing attention to the key revelation) -->
<path d="M0,0 C20,-2 40,2 60,0" stroke="#C0392B" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M50,-8 L60,0 L50,8" stroke="#C0392B" stroke-width="3" fill="none" stroke-linecap="round"/>
```

---

## Composition-Level SVG Structure

Every scene illustration must follow this exact structure:

```xml
<svg viewBox="0 0 [WIDTH] [HEIGHT]" xmlns="http://www.w3.org/2000/svg" class="illustration">
  <defs>
    <!-- Layered hand-drawn filter: fine wobble + broad organic drift -->
    <filter id="hand-drawn">
      <feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="2" result="fine-noise" seed="[SCENE_NUMBER]"/>
      <feTurbulence type="turbulence" baseFrequency="0.005" numOctaves="1" result="broad-noise" seed="[SCENE_NUMBER + 100]"/>
      <feDisplacementMap in="SourceGraphic" in2="fine-noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="fine-displaced"/>
      <feDisplacementMap in="fine-displaced" in2="broad-noise" scale="1.0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- Bold variant for SVG headings/titles inside illustrations -->
    <filter id="hand-drawn-bold">
      <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="fine-noise" seed="[SCENE_NUMBER]"/>
      <feTurbulence type="turbulence" baseFrequency="0.004" numOctaves="1" result="broad-noise" seed="[SCENE_NUMBER + 100]"/>
      <feDisplacementMap in="SourceGraphic" in2="fine-noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="fine-displaced"/>
      <feDisplacementMap in="fine-displaced" in2="broad-noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- Paper grain texture (optional, apply to background rect) -->
    <filter id="paper-texture" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" result="paper-noise" seed="42"/>
      <feDiffuseLighting in="paper-noise" lighting-color="#E5DDD0" surfaceScale="1.2" result="paper-lit">
        <feDistantLight azimuth="225" elevation="55"/>
      </feDiffuseLighting>
      <feComposite in="paper-lit" in2="SourceGraphic" operator="in"/>
      <feBlend in2="SourceGraphic" mode="multiply"/>
    </filter>
    <pattern id="crosshatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M0,4 L8,4" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round"/>
    </pattern>
    <pattern id="crosshatch-light" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M0,5 L10,5" stroke="#1A1A1A" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    </pattern>
  </defs>

  <g filter="url(#hand-drawn)">
    <!-- Layer 1: Major outlines — drawn first via stroke-dashoffset -->
    <g class="outline-group" opacity="0">
      <path class="head" d="..." stroke="#1A1A1A" stroke-width="4" fill="#E5DDD0" stroke-linecap="round"/>
      <path class="body" d="..." stroke="#1A1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path class="left-arm" d="..." stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="right-arm" d="..." stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="left-leg" d="..." stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="right-leg" d="..." stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Object outlines -->
    </g>

    <!-- Layer 2: Details — fade in after outlines start drawing -->
    <g class="detail-group" opacity="0">
      <circle class="left-eye" cx="..." cy="..." r="3.5" fill="#1A1A1A"/>
      <circle class="right-eye" cx="..." cy="..." r="3.5" fill="#1A1A1A"/>
      <path class="mouth" d="..." stroke="#1A1A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path class="hair" d="..." stroke="#1A1A1A" stroke-width="2.5" fill="none"/>
      <!-- Cross-hatching fills, small prop details -->
      <g class="ground">...</g>
    </g>

    <!-- Layer 3: Accents — appear last, timed to narrator emphasis -->
    <g class="accent-group" opacity="0">
      <!-- ONE red element max -->
      <path class="red-underline" d="..." stroke="#C0392B" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Labels, emphasis marks, sparkle lines -->
    </g>
  </g>
</svg>
```

---

## Camera Movement

Camera movement uses a `.camera-wrapper` div around all scene content. GSAP animates `scale`, `xPercent`, and `yPercent` on this wrapper to create zoom and pan effects.

### Philosophy: Every Move Needs a Reason

Camera moves are **narrative tools**, not visual filler. Never zoom or pan just to add motion — every camera change must be motivated by what the narrator is saying or what the audience needs to see next.

**Ask before adding any camera move**: "What is this move SHOWING the viewer that they couldn't see before?" If the answer is "nothing new, it just looks cool," cut the move.

### Motivated Camera Patterns

| Narrator says... | Camera does... | Why |
|---|---|---|
| "Look at this..." / introduces a detail | Zoom to that detail | Directs attention where words point |
| "But on the other side..." / contrast | Pan from element A to element B | Shows spatial relationship between ideas |
| "The whole picture..." / summary | Pull back from detail to wide | Reveals how parts connect to the whole |
| "Step 1... Step 2... Step 3..." | Pan to follow progression | Guides viewer through sequence |
| "Meanwhile..." / new subject | Cut to new framing (instant reposition) | Clean context switch, no drift |
| Character reacts emotionally | Slow zoom to face | Empathy beat — let expression land |

### Scene Type Camera Guidance

| Scene Type | Default Camera | When to Add Movement |
|---|---|---|
| Title / Title Card | Static wide | Never — titles are clean establishing shots |
| Dialogue | Static or slow zoom | Zoom to speaker face on punchline or emotional beat |
| Action | Pan to follow movement | Track running/jumping characters across frame |
| Reaction | Zoom to face | Close-up on expression for comedy or emotional beat |
| Establishing | Static wide | Never — establishing shots set the scene cleanly |
| Montage | Pan or staged cuts | Quick cuts between positions, or slow pan across montage layout |
| Closeup | Start zoomed | Already tight — minimal or no additional movement |
| Transition | Varies | Camera move IS the transition (zoom out, pan away, etc.) |
| Teaching | Static or single zoom | Zoom to prop/diagram when narrator references it |
| List | Static wide | Never — item reveals provide all the motion needed |
| Closing | Static or slow pull-back | Optional slow zoom-out to create "stepping back" feeling |

### CSS Setup

```css
.camera-wrapper {
  width: 100%;
  height: 100%;
  transform-origin: center center;
  will-change: transform;
}
```

### Rules

1. **Always reset before fade-out** — never fade out while zoomed
2. **xPercent/yPercent are inverted** — negative xPercent shifts the viewport RIGHT (showing more left content), positive shifts LEFT
3. **Max scale: 1.8** — beyond this, SVG line weights look wrong
4. **Ease: `power2.inOut`** — smooth acceleration/deceleration for all camera moves
5. **Duration: 0.8-2.0s** — camera moves should feel deliberate, never snappy
6. **transform-origin stays `center center`** — use xPercent/yPercent to target different areas
7. **Content must justify the move** — something must appear, change, or be revealed while the camera is in its new position

---

## Draw-In Animation Rules

### Path Initialization (in `<script>`, before GSAP timeline)
```javascript
// Initialize all drawable SVG paths
document.querySelectorAll('.outline-group path').forEach(p => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = len;
});
```

### Draw Order
1. `.outline-group` opacity -> 1 (instant), then paths animate `strokeDashoffset` -> 0 (staggered, 0.4-0.8s per path)
2. `.detail-group` opacity -> 1 (0.3-0.5s fade), starts ~0.3s after outlines begin
3. `.accent-group` opacity -> 1 (0.3s fade), timed to narrator emphasis phrase

### Timing Rule
Drawings BEGIN when the narrator introduces the concept, not after. The audience should see the illustration forming as they hear the explanation.

### Filled Elements
Eyes and dots use scale-pop instead of stroke-dashoffset:
```javascript
tl.from(".left-eye", { scale: 0, transformOrigin: "center", duration: 0.15, ease: "back.out(2)" }, TIME);
```

---

## Quality Checklist

Before generating an SVG illustration, verify:
- [ ] All paths use cubic bezier curves with slight irregularity
- [ ] No `<circle>`, `<rect>`, or `<ellipse>` elements (except for tiny filled dots like eyes)
- [ ] `stroke-linecap="round"` on all paths
- [ ] **Bean torso** used for every figure (no single-line torsos)
- [ ] **Every figure wears clothing** with crosshatch fills — no bare outlines
- [ ] **Eyebrows present** on every figure — expression matches scene emotion
- [ ] **Hands visible** — mitten (Tier 1) or full fingers (Tier 2), never omitted
- [ ] **Feet are shoe shapes**, not line endpoints
- [ ] Tier 2 characters are 30-40% larger with genre-appropriate detail
- [ ] Head is proportionally large (~1:2.5 ratio to body)
- [ ] Ground hatching present under standing figures
- [ ] **Props have material texture** (wood grain, metal sheen, screen lines — never flat outlines)
- [ ] **Environments bleed off-screen** — terrain extends past viewBox edges, no contained boxes
- [ ] Red accents used sparingly (most scenes should have NONE)
- [ ] Three-layer group structure (outline, detail, accent)
- [ ] viewBox dimensions are appropriate for the scene content
- [ ] Filter seed matches scene number
- [ ] Total illustration conveys the concept at a glance — no ambiguity
- [ ] **Entertainment expressions** used where appropriate (smirk, shocked, crying, etc.)
- [ ] **Action poses** match the scene energy (running, jumping, celebrating for dynamic scenes)
- [ ] **Props are scene-appropriate** (phone for modern scenes, coffee for casual, etc.)
- [ ] **Speech/thought bubbles** used for dialogue and inner-monologue scenes
