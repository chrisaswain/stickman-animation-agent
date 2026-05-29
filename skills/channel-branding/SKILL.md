# Channel Branding

Create and manage persistent brand profiles for YouTube channels.

## V1 Scope

Simple watermark: brand logo path specified in `video-project.json`, applied by FFmpeg during render.

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
