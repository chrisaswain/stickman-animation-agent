# Wave 5: Enhancement & Polish

## Summary

Add Gemini enhancer integration (music + thumbnail prompt generation), E2E integration tests, slash command registration, root package.json ESM fix, and CLAUDE.md command docs.

## Scope

- `src/enhance/gemini-enhancer.js` — Gemini Media MCP integration for music (Lyria) and thumbnail (Imagen) generation via prompt planning
- `src/enhance/package.json` — module metadata
- `tests/e2e-pipeline-test.js` — 6-test E2E integration suite validating character loading, schema, compositor, render pipeline, enhancer, file discovery
- `tests/package.json` — test module metadata
- `package.json` — add `"type": "module"` and `engines` field (fixes pre-existing ESM fragility)
- `CLAUDE.md` — add command documentation for all pipeline scripts
- `C:\Dev\ai\CLAUDE.md` — register `/stickman-animation` in workspace task routing

## Design Decisions

1. **Prompt planning over direct MCP calls** — Node.js scripts can't call MCP tools directly; enhancer generates optimized prompts + `enhance-plan.json` that the agent skill reads to make actual MCP calls
2. **node:test over external frameworks** — zero dependencies for testing, Node 22 built-in test runner
3. **Root ESM declaration** — fixes the fragile nested-package.json pattern where ESM resolution depended on which directory the import originated from

## Files Changed

| File | Action | Description |
|---|---|---|
| `src/enhance/gemini-enhancer.js` | New | Music + thumbnail prompt generator (317 lines) |
| `src/enhance/package.json` | New | Module metadata |
| `tests/e2e-pipeline-test.js` | New | 6-test E2E integration suite |
| `tests/package.json` | New | Test module metadata |
| `package.json` | Modified | Add `"type": "module"`, `engines` field |
| `CLAUDE.md` | Modified | Add command docs |
| `openspec/changes/wave-5-enhancement-polish/` | New | OpenSpec docs |
