# Channel Branding

Create and manage persistent brand profiles for YouTube channels.

## V1 Scope

Watermark overlay applied by FFmpeg after final mux. To enable:

1. Create a brand directory: `brands/{brand-name}/`
2. Add `brand.json` with watermark config:
```json
{
  "name": "My Channel",
  "watermark": {
    "logo": "logo.png",
    "position": "bottom-right",
    "margin": 30,
    "scale": 0.08,
    "opacity": 0.7
  }
}
```
3. Drop your `logo.png` (transparent PNG recommended) in the brand directory
4. Set `"brand": "{brand-name}"` in `video-project.json`

### Watermark Options
| Field | Default | Description |
|---|---|---|
| `logo` | (required) | Logo filename relative to brand directory |
| `position` | `bottom-right` | `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` |
| `margin` | `30` | Pixels from edge |
| `scale` | `0.08` | Scale factor relative to logo's native size |
| `opacity` | `0.7` | 0.0 (invisible) to 1.0 (fully opaque) |

Non-fatal: if brand config, logo, or FFmpeg fails, the pipeline continues without watermark.

## V1.5 Scope (Deferred)

Full brand profile creation and management:

### Create Brand
1. Claude generates 3-5 channel name ideas based on niche
2. User picks one or provides their own
3. Claude generates description, tagline, color scheme
4. Gemini generates logo (1:1) and banner (16:9)
5. Saves to `brands/{name}/`

### Brand Profile Structure
```
brands/{name}/
├── brand.json           # Name, description, tagline, colors, font, tone
├── logo.png             # Generated via Gemini
├── banner.png           # 16:9 banner
├── character-sheet.json # Default narrator character
└── templates.json       # Template palette/font overrides
```

### Reuse
When a brand is selected at intake, its character-sheet.json becomes the default narrator and its palette overrides the template palette.
