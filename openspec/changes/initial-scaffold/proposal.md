# Proposal: Stickman Animation Agent — Initial Scaffold

## Problem

Creating stickman animation videos currently requires a manual 10-step workflow across 6+ browser tabs and tools (DeepSeek, ElevenLabs, Meta AI, Google Flow, Gemini, CapCut). This process is slow, error-prone, and produces inconsistent characters across scenes because AI image generation creates a different stickman every time.

## Solution

Build a standalone Claude Code CLI agent that fully automates stickman animation video production with higher quality than the manual approach. Uses deterministic SVG characters rendered via HyperFrames (headless Chrome) for pixel-perfect consistency, local free TTS (Kokoro-82M), and Gemini Media MCP for music/thumbnails.

## Key Design Decision

The scene compositor uses a **two-phase architecture** (per Gemini 2.5 Pro review): the LLM generates structured Scene Definition JSON, then a deterministic JS compositor translates that into HTML/SVG/GSAP. This eliminates the brittleness of LLM-generated code.

## Scope (V1)

- Whiteboard template (parchment bg, draw-in animation)
- Full 10-step pipeline with resumability
- Character sheet system for consistency
- Gemini music + thumbnail (hero shots deferred to V1.5)
- Dedicated .venv with bootstrap script

## Success Criteria

- E2E test: topic → final MP4 with consistent characters, synced audio, smooth animation
- Same character rendered identically across 5+ scenes
- Pipeline resumes from interruption point
