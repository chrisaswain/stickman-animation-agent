#!/usr/bin/env node

/**
 * Gemini Enhancer — Music & Thumbnail Generation
 * ================================================
 * Integrates with Gemini Media MCP tools (Lyria for music, Imagen for
 * thumbnails) to enhance stickman animation videos.
 *
 * MCP tools cannot be called directly from Node.js, so this module
 * generates optimized prompts and writes an enhance-plan.json that
 * the agent skill reads to make the actual MCP calls.
 *
 * Usage:
 *   node src/enhance/gemini-enhancer.js --project projects/my-video/
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TONE_GENRE_MAP = {
  humorous: 'upbeat quirky',
  educational: 'calm ambient',
  dramatic: 'cinematic orchestral',
  absurd: 'chaotic playful',
};

const TEMPLATE_STYLE_MAP = {
  whiteboard: 'warm parchment background, dark ink stickman, hand-drawn style',
  'classic-stickman': 'black background, white stickman, high contrast neon accents',
  'comic-panel': 'white background, bold panel borders, comic style',
};

const DEFAULTS = {
  tone: 'educational',
  template: 'whiteboard',
  duration: 60,
  title: 'Stickman Animation',
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] [enhance:${step}] ${message}`);
}

function logError(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.error(`[${timestamp}] [enhance:${step}] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  try { return JSON.parse(raw); }
  catch (err) { throw new Error(`Invalid JSON in ${filePath}: ${err.message}`); }
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, 'utf-8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// ---------------------------------------------------------------------------
// Context extraction
// ---------------------------------------------------------------------------

/** Load project metadata from video-project.json with safe defaults. */
function loadProjectContext(projectDir) {
  const projectPath = path.join(projectDir, 'video-project.json');
  if (!fs.existsSync(projectPath)) {
    throw new Error(`video-project.json not found in ${projectDir}`);
  }
  const project = readJSON(projectPath);
  return {
    title: project.title || DEFAULTS.title,
    tone: project.tone || DEFAULTS.tone,
    duration: project.duration || project.estimatedDuration || DEFAULTS.duration,
    template: project.template || DEFAULTS.template,
    slug: project.slug || path.basename(projectDir),
    topic: project.topic || project.title || DEFAULTS.title,
  };
}

/** Load narration script and return a concise summary for prompts. */
function loadScriptContext(projectDir) {
  const scriptPath = path.join(projectDir, 'scripts', 'narration-script.json');
  if (!fs.existsSync(scriptPath)) {
    log('context', 'No narration-script.json found — using project metadata only');
    return null;
  }
  const script = readJSON(scriptPath);
  const scenes = script.scenes || script.segments || [];
  if (scenes.length === 0) return null;

  return scenes
    .map((scene, i) => {
      const text = scene.narration || scene.description || scene.text || '';
      const truncated = text.length > 120 ? text.slice(0, 117) + '...' : text;
      return `Scene ${i + 1}: ${truncated}`;
    })
    .slice(0, 8)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildMusicPrompt(context, scriptSummary) {
  const genre = TONE_GENRE_MAP[context.tone] || TONE_GENRE_MAP[DEFAULTS.tone];
  let prompt = [
    `Create a ${context.tone} background music track for a ${context.duration}-second`,
    `animated video about ${context.topic}.`,
    `The music should be ${genre}.`,
    `No vocals, instrumental only.`,
  ].join(' ');

  if (scriptSummary) {
    prompt += `\n\nVideo content summary:\n${scriptSummary}`;
    prompt += '\n\nMatch the energy and pacing of the content described above.';
  }
  return prompt;
}

function buildThumbnailPrompt(context) {
  const style = TEMPLATE_STYLE_MAP[context.template] || TEMPLATE_STYLE_MAP[DEFAULTS.template];
  const expressionMap = {
    humorous: 'goofy surprised',
    educational: 'friendly confident',
    dramatic: 'intense determined',
    absurd: 'wild-eyed bewildered',
  };
  const expression = expressionMap[context.tone] || 'friendly';

  return [
    `YouTube thumbnail for animated stickman video: ${context.title}.`,
    `Style: ${style}.`,
    `Show a stickman character with ${expression} expression.`,
    `High contrast, bold outlines, bright colors. 16:9 aspect ratio.`,
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Project state management
// ---------------------------------------------------------------------------

function updateStepStatus(projectJsonPath, stepName, status, extras = {}) {
  if (!fs.existsSync(projectJsonPath)) {
    log('status', `Skipping status update — ${projectJsonPath} not found`);
    return;
  }
  const project = readJSON(projectJsonPath);
  if (!project.steps) project.steps = {};
  project.steps[stepName] = {
    ...(project.steps[stepName] || {}),
    status,
    updatedAt: new Date().toISOString(),
    ...extras,
  };
  writeJSON(projectJsonPath, project);
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Generate a music prompt and write it to the enhance directory.
 * @param {object} options
 * @param {string} options.projectDir  - Absolute path to the project directory
 * @param {string} [options.template]  - Template name override
 * @returns {{ prompt: string, outputPath: string, promptFile: string }}
 */
export async function generateMusic(options) {
  const { projectDir, template } = options;
  const resolvedDir = path.resolve(projectDir);
  log('music', `Generating music prompt for: ${resolvedDir}`);

  const context = loadProjectContext(resolvedDir);
  if (template) context.template = template;

  const scriptSummary = loadScriptContext(resolvedDir);
  const prompt = buildMusicPrompt(context, scriptSummary);

  const promptFile = path.join(resolvedDir, 'enhance', 'music-prompt.txt');
  writeText(promptFile, prompt);
  ensureDir(path.join(resolvedDir, 'audio'));

  log('music', `Prompt (${prompt.length} chars) written to: ${promptFile}`);
  return { prompt, outputPath: 'audio/music.wav', promptFile };
}

/**
 * Generate a thumbnail prompt and write it to the enhance directory.
 * @param {object} options
 * @param {string} options.projectDir  - Absolute path to the project directory
 * @param {string} [options.template]  - Template name override
 * @returns {{ prompt: string, outputPath: string, promptFile: string }}
 */
export async function generateThumbnail(options) {
  const { projectDir, template } = options;
  const resolvedDir = path.resolve(projectDir);
  log('thumbnail', `Generating thumbnail prompt for: ${resolvedDir}`);

  const context = loadProjectContext(resolvedDir);
  if (template) context.template = template;

  const prompt = buildThumbnailPrompt(context);

  const promptFile = path.join(resolvedDir, 'enhance', 'thumbnail-prompt.txt');
  writeText(promptFile, prompt);
  ensureDir(path.join(resolvedDir, 'output'));

  log('thumbnail', `Prompt (${prompt.length} chars) written to: ${promptFile}`);
  return { prompt, outputPath: 'output/thumbnail.png', promptFile };
}

/**
 * Run both music and thumbnail generation, producing an enhance-plan.json
 * that the agent skill can use to make the actual Gemini MCP calls.
 * @param {object} options
 * @param {string} options.projectDir  - Absolute path to the project directory
 * @param {string} [options.template]  - Template name override
 * @returns {object} The enhance plan
 */
export async function enhance(options) {
  const { projectDir, template } = options;
  const resolvedDir = path.resolve(projectDir);
  const projectJsonPath = path.join(resolvedDir, 'video-project.json');

  log('plan', '=== Starting enhance phase ===');
  log('plan', `Project: ${resolvedDir}`);
  updateStepStatus(projectJsonPath, 'enhance', 'in-progress');

  try {
    const musicResult = await generateMusic({ projectDir: resolvedDir, template });
    const thumbnailResult = await generateThumbnail({ projectDir: resolvedDir, template });

    const plan = {
      generatedAt: new Date().toISOString(),
      projectDir: resolvedDir,
      music: {
        prompt: musicResult.prompt,
        outputPath: musicResult.outputPath,
        promptFile: path.relative(resolvedDir, musicResult.promptFile),
        status: 'pending',
      },
      thumbnail: {
        prompt: thumbnailResult.prompt,
        outputPath: thumbnailResult.outputPath,
        promptFile: path.relative(resolvedDir, thumbnailResult.promptFile),
        status: 'pending',
      },
    };

    const planPath = path.join(resolvedDir, 'enhance', 'enhance-plan.json');
    writeJSON(planPath, plan);

    updateStepStatus(projectJsonPath, 'enhance', 'prompts-ready', {
      planFile: 'enhance/enhance-plan.json',
      musicPromptFile: plan.music.promptFile,
      thumbnailPromptFile: plan.thumbnail.promptFile,
    });

    log('plan', '=== Enhance phase complete — prompts ready for MCP calls ===');
    log('plan', `  Music prompt:     ${musicResult.promptFile}`);
    log('plan', `  Thumbnail prompt: ${thumbnailResult.promptFile}`);
    log('plan', `  Enhance plan:     ${planPath}`);
    return plan;

  } catch (err) {
    updateStepStatus(projectJsonPath, 'enhance', 'error', { error: err.message });
    throw err;
  }
}

/**
 * Update the status of a specific item (music or thumbnail) in the enhance plan.
 * @param {object} options
 * @param {string} options.projectDir  - Absolute path to the project directory
 * @param {string} options.item        - 'music' or 'thumbnail'
 * @param {string} options.status      - 'pending' | 'in-progress' | 'complete' | 'skipped' | 'error'
 * @param {string} [options.error]     - Error message if status is 'error'
 */
export function updatePlanStatus(options) {
  const { projectDir, item, status, error } = options;
  const resolvedDir = path.resolve(projectDir);
  const planPath = path.join(resolvedDir, 'enhance', 'enhance-plan.json');

  if (!fs.existsSync(planPath)) {
    log('status', `Enhance plan not found: ${planPath}`);
    return;
  }

  const plan = readJSON(planPath);
  if (!plan[item]) {
    log('status', `Unknown enhance item: ${item}`);
    return;
  }

  plan[item].status = status;
  plan[item].updatedAt = new Date().toISOString();
  if (error) plan[item].error = error;

  writeJSON(planPath, plan);
  log('status', `Updated ${item} status to: ${status}`);
}

/**
 * Mark the enhance step as complete in video-project.json.
 * Reads the enhance plan to determine final status of each item.
 * @param {object} options
 * @param {string} options.projectDir  - Absolute path to the project directory
 */
export function completePlan(options) {
  const { projectDir } = options;
  const resolvedDir = path.resolve(projectDir);
  const projectJsonPath = path.join(resolvedDir, 'video-project.json');
  const planPath = path.join(resolvedDir, 'enhance', 'enhance-plan.json');

  let plan = null;
  if (fs.existsSync(planPath)) {
    plan = readJSON(planPath);
  }

  const extras = {};
  if (plan) {
    extras.music = plan.music?.status || 'skipped';
    extras.thumbnail = plan.thumbnail?.status || 'skipped';
  }

  updateStepStatus(projectJsonPath, 'enhance', 'complete', extras);
  log('complete', `Enhance step marked complete (music: ${extras.music || 'n/a'}, thumbnail: ${extras.thumbnail || 'n/a'})`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: 'string', short: 'p' },
      template: { type: 'string', short: 't', default: 'whiteboard' },
      'music-only': { type: 'boolean', default: false },
      'thumbnail-only': { type: 'boolean', default: false },
      'update-status': { type: 'string' },
      complete: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help || !values.project) {
    console.log(`
Stickman Animation Agent — Gemini Enhancer

Generates prompts for Gemini Media MCP tools (Lyria music, Imagen thumbnails)
and writes an enhance-plan.json for the agent skill to execute.

Usage:
  node src/enhance/gemini-enhancer.js --project projects/my-video/

Options:
  --project, -p       Path to the project directory (required)
  --template, -t      Template name override (default: whiteboard)
  --music-only        Generate only the music prompt
  --thumbnail-only    Generate only the thumbnail prompt
  --update-status     Update plan item status: "music complete" or "thumbnail skipped"
  --complete          Mark enhance step as complete in video-project.json
  --help, -h          Show this help message

Outputs:
  {project}/enhance/music-prompt.txt       Music generation prompt
  {project}/enhance/thumbnail-prompt.txt   Thumbnail generation prompt
  {project}/enhance/enhance-plan.json      Plan for agent MCP calls
`);
    process.exit(values.help ? 0 : 1);
  }

  try {
    const opts = { projectDir: values.project, template: values.template };

    if (values.complete) {
      completePlan({ projectDir: values.project });
      console.log('\nEnhance step marked complete.');
      process.exit(0);
    }

    if (values['update-status']) {
      const parts = values['update-status'].split(/\s+/);
      if (parts.length < 2) {
        console.error('Usage: --update-status "music complete" or --update-status "thumbnail skipped"');
        process.exit(1);
      }
      updatePlanStatus({ projectDir: values.project, item: parts[0], status: parts[1] });
      console.log(`\n${parts[0]} status updated to: ${parts[1]}`);
      process.exit(0);
    }

    if (values['music-only']) {
      const result = await generateMusic(opts);
      console.log(`\nMusic prompt generated: ${result.promptFile}`);
    } else if (values['thumbnail-only']) {
      const result = await generateThumbnail(opts);
      console.log(`\nThumbnail prompt generated: ${result.promptFile}`);
    } else {
      const plan = await enhance(opts);
      console.log('\nEnhance phase complete.');
      console.log(`  Music:     ${plan.music.promptFile}`);
      console.log(`  Thumbnail: ${plan.thumbnail.promptFile}`);
      console.log(`  Plan:      enhance/enhance-plan.json`);
    }
    process.exit(0);
  } catch (err) {
    logError('cli', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
const _argv1 = process.argv[1] || '';
if (import.meta.url === `file:///${_argv1.replace(/\\/g, '/')}` ||
    _argv1.endsWith('enhance/gemini-enhancer.js') ||
    _argv1.endsWith('enhance\\gemini-enhancer.js')) {
  main();
}

export default enhance;
