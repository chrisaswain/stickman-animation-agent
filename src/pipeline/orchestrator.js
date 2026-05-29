#!/usr/bin/env node

/**
 * Pipeline Orchestrator
 * =====================
 * Deterministic step runner for the Stickman Animation Agent pipeline.
 * Handles: voice, timestamps, compose (Phase B), enhance, render, publish.
 * Creative steps (intake, script, characters, storyboard, compose Phase A)
 * are handled by the LLM-driven SKILL.md.
 *
 * Usage:
 *   node src/pipeline/orchestrator.js --project projects/my-video/
 *   node src/pipeline/orchestrator.js --project projects/my-video/ --step voice
 *   node src/pipeline/orchestrator.js --project projects/my-video/ --from timestamps
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

const DETERMINISTIC_STEPS = [
  'voice',
  'timestamps',
  'compose',
  'enhance',
  'render',
  'publish',
];

const STEP_PREREQUISITES = {
  voice: {
    files: [{ path: 'scripts/narration-script.json', hint: 'Run the script-writer skill first' }],
  },
  timestamps: {
    pattern: { dir: 'audio', glob: /^scene-\d{2,3}\.wav$/, hint: 'Run the voice step first' },
  },
  compose: {
    pattern: { dir: 'compositions', glob: /^scene-\d{2,3}\.json$/, hint: 'Run compose Phase A (scene-compositor skill) first' },
  },
  enhance: {
    files: [{ path: 'video-project.json', hint: 'Run intake first' }],
  },
  render: {
    pattern: { dir: 'compositions', glob: /^scene-\d{2,3}\.html$/, hint: 'Run the compose step first' },
    files: [{ path: 'audio', isDir: true, hint: 'Run the voice step first' }],
  },
  publish: {
    files: [],
  },
};

const PYTHON_EXE = path.join(REPO_ROOT, '.venv', 'Scripts', 'python.exe');
const PYTHON_FALLBACK = 'python';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] [orchestrator:${step}] ${message}`);
}

function logError(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.error(`[${timestamp}] [orchestrator:${step}] ERROR: ${message}`);
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
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// ---------------------------------------------------------------------------
// Shell execution
// ---------------------------------------------------------------------------

function run(command, options = {}) {
  const { cwd, step = 'exec', silent = false, timeout = 600_000 } = options;
  if (!silent) log(step, `$ ${command}`);
  try {
    return execSync(command, {
      cwd: cwd || REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : '';
    const stdout = err.stdout ? err.stdout.toString().trim() : '';
    throw new Error(
      `Command failed (exit ${err.status}):\n  $ ${command}\n` +
      (stderr ? `  stderr: ${stderr}\n` : '') +
      (stdout ? `  stdout: ${stdout}\n` : '')
    );
  }
}

function getPython() {
  return fs.existsSync(PYTHON_EXE) ? `"${PYTHON_EXE}"` : PYTHON_FALLBACK;
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

function updateStepStatus(projectDir, stepName, status, extras = {}) {
  const projectJsonPath = path.join(projectDir, 'video-project.json');
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
  project.lastStep = stepName;
  writeJSON(projectJsonPath, project);
}

function getStepStatus(projectDir, stepName) {
  const projectJsonPath = path.join(projectDir, 'video-project.json');
  if (!fs.existsSync(projectJsonPath)) return null;
  const project = readJSON(projectJsonPath);
  const step = project.steps?.[stepName];
  if (!step) return null;
  return typeof step === 'string' ? step : step.status;
}

// ---------------------------------------------------------------------------
// Prerequisite validation
// ---------------------------------------------------------------------------

function validatePrerequisites(projectDir, stepName) {
  const prereqs = STEP_PREREQUISITES[stepName];
  if (!prereqs) return { valid: true };

  if (prereqs.files) {
    for (const fileReq of prereqs.files) {
      const fullPath = path.join(projectDir, fileReq.path);
      if (fileReq.isDir) {
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
          return { valid: false, error: `Missing directory: ${fileReq.path}`, hint: fileReq.hint };
        }
      } else {
        if (!fs.existsSync(fullPath)) {
          return { valid: false, error: `Missing file: ${fileReq.path}`, hint: fileReq.hint };
        }
      }
    }
  }

  if (prereqs.pattern) {
    const { dir, glob: pattern, hint } = prereqs.pattern;
    const dirPath = path.join(projectDir, dir);
    if (!fs.existsSync(dirPath)) {
      return { valid: false, error: `Missing directory: ${dir}/`, hint };
    }
    const matches = fs.readdirSync(dirPath).filter(f => pattern.test(f));
    if (matches.length === 0) {
      return { valid: false, error: `No matching files in ${dir}/ (expected pattern: ${pattern})`, hint };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Step implementations
// ---------------------------------------------------------------------------

export function runVoice(projectDir) {
  const stepName = 'voice';
  log(stepName, '=== Starting voice generation ===');

  const prereq = validatePrerequisites(projectDir, stepName);
  if (!prereq.valid) {
    return { success: false, error: prereq.error, hint: prereq.hint };
  }

  updateStepStatus(projectDir, stepName, 'in-progress');

  try {
    const scriptPath = path.join(projectDir, 'scripts', 'narration-script.json');
    const audioDir = path.join(projectDir, 'audio');
    ensureDir(audioDir);

    const python = getPython();
    const ttsScript = path.join(REPO_ROOT, 'scripts', 'kokoro_tts.py');

    if (!fs.existsSync(ttsScript)) {
      throw new Error(`TTS script not found: ${ttsScript}`);
    }

    const cmd = [
      python,
      `"${ttsScript}"`,
      `--script "${scriptPath}"`,
      `--output "${audioDir}"`,
    ].join(' ');

    const output = run(cmd, { step: stepName });
    log(stepName, output);

    const wavCount = fs.readdirSync(audioDir).filter(f => /^scene-\d{2,3}\.wav$/.test(f)).length;
    log(stepName, `=== Voice generation complete: ${wavCount} scene(s) ===`);

    updateStepStatus(projectDir, stepName, 'complete', { sceneCount: wavCount });
    return { success: true, output: `Generated ${wavCount} scene WAV files` };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

export function runTimestamps(projectDir) {
  const stepName = 'timestamps';
  log(stepName, '=== Starting timestamp extraction ===');

  const prereq = validatePrerequisites(projectDir, stepName);
  if (!prereq.valid) {
    return { success: false, error: prereq.error, hint: prereq.hint };
  }

  updateStepStatus(projectDir, stepName, 'in-progress');

  try {
    const audioDir = path.join(projectDir, 'audio');
    const tsDir = path.join(projectDir, 'timestamps');
    ensureDir(tsDir);

    const python = getPython();
    const whisperScript = path.join(REPO_ROOT, 'scripts', 'whisper_transcribe.py');

    if (!fs.existsSync(whisperScript)) {
      throw new Error(`Whisper script not found: ${whisperScript}`);
    }

    const cmd = [
      python,
      `"${whisperScript}"`,
      `--audio-dir "${audioDir}"`,
      `--output "${tsDir}"`,
    ].join(' ');

    const output = run(cmd, { step: stepName });
    log(stepName, output);

    const tsCount = fs.readdirSync(tsDir).filter(f => /^scene-\d{2,3}\.json$/.test(f)).length;
    log(stepName, `=== Timestamp extraction complete: ${tsCount} scene(s) ===`);

    updateStepStatus(projectDir, stepName, 'complete', { sceneCount: tsCount });
    return { success: true, output: `Extracted timestamps for ${tsCount} scenes` };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

export function runCompose(projectDir) {
  const stepName = 'compose';
  log(stepName, '=== Starting composition Phase B (HTML rendering) ===');

  const prereq = validatePrerequisites(projectDir, stepName);
  if (!prereq.valid) {
    return { success: false, error: prereq.error, hint: prereq.hint };
  }

  updateStepStatus(projectDir, stepName, 'in-progress');

  try {
    const compositionsDir = path.join(projectDir, 'compositions');
    const compositorPath = path.join(REPO_ROOT, 'src', 'compositor', 'index.js');

    if (!fs.existsSync(compositorPath)) {
      throw new Error(`Compositor not found: ${compositorPath}`);
    }

    const projectJsonPath = path.join(projectDir, 'video-project.json');
    const project = readJSON(projectJsonPath);
    const template = project.config?.template || 'whiteboard';

    const sceneJsons = fs.readdirSync(compositionsDir)
      .filter(f => /^scene-\d{2,3}\.json$/.test(f))
      .sort();

    log(stepName, `Compositing ${sceneJsons.length} scene(s) with template: ${template}`);

    for (let i = 0; i < sceneJsons.length; i++) {
      const jsonFile = sceneJsons[i];
      const basename = path.basename(jsonFile, '.json');
      const jsonPath = path.join(compositionsDir, jsonFile);
      const htmlPath = path.join(compositionsDir, `${basename}.html`);

      log(stepName, `[${i + 1}/${sceneJsons.length}] Compositing ${basename}...`);

      const cmd = [
        'node',
        `"${compositorPath}"`,
        `--scene "${jsonPath}"`,
        `--project "${projectDir}"`,
        `--template ${template}`,
        `--output "${htmlPath}"`,
      ].join(' ');

      run(cmd, { step: stepName });

      if (!fs.existsSync(htmlPath)) {
        throw new Error(`Compositor did not produce output: ${htmlPath}`);
      }
    }

    log(stepName, `=== Composition Phase B complete: ${sceneJsons.length} scene(s) ===`);
    updateStepStatus(projectDir, stepName, 'complete', { sceneCount: sceneJsons.length });
    return { success: true, output: `Composed ${sceneJsons.length} scenes to HTML` };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

export async function runEnhance(projectDir) {
  const stepName = 'enhance';
  log(stepName, '=== Starting enhancement (prompt generation) ===');

  const prereq = validatePrerequisites(projectDir, stepName);
  if (!prereq.valid) {
    return { success: false, error: prereq.error, hint: prereq.hint };
  }

  try {
    const { enhance } = await import(
      `file:///${path.join(REPO_ROOT, 'src', 'enhance', 'gemini-enhancer.js').replace(/\\/g, '/')}`
    );

    const projectJsonPath = path.join(projectDir, 'video-project.json');
    const project = readJSON(projectJsonPath);
    const template = project.config?.template || 'whiteboard';

    await enhance({ projectDir, template });

    log(stepName, '=== Enhancement prompts ready for MCP calls ===');
    return { success: true, output: 'Enhancement prompts generated — MCP calls handled by skill' };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

export async function runRender(projectDir) {
  const stepName = 'render';
  log(stepName, '=== Starting render pipeline ===');

  const prereq = validatePrerequisites(projectDir, stepName);
  if (!prereq.valid) {
    return { success: false, error: prereq.error, hint: prereq.hint };
  }

  try {
    const { renderPipeline } = await import(
      `file:///${path.join(REPO_ROOT, 'src', 'render', 'pipeline.js').replace(/\\/g, '/')}`
    );

    const projectJsonPath = path.join(projectDir, 'video-project.json');
    const project = readJSON(projectJsonPath);
    const template = project.config?.template || 'whiteboard';

    const result = await renderPipeline({ projectDir, templateName: template });

    log(stepName, `=== Render complete: ${result.landscapePath} ===`);
    return { success: true, output: `Rendered ${result.sceneCount} scenes → ${result.landscapePath}` };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

export function runPublish(projectDir) {
  const stepName = 'publish';
  log(stepName, '=== Starting publish step ===');

  updateStepStatus(projectDir, stepName, 'in-progress');

  try {
    const projectJsonPath = path.join(projectDir, 'video-project.json');
    const project = readJSON(projectJsonPath);
    const slug = project.slug || path.basename(projectDir);
    const outputDir = path.join(projectDir, 'output');
    ensureDir(outputDir);

    const videoPath = path.join(outputDir, `${slug}.mp4`);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found: ${videoPath} — run the render step first`);
    }

    // 1. Generate subtitles (non-fatal)
    let srtPath = null;
    const timestampsDir = path.join(projectDir, 'timestamps');
    const subtitleScript = path.join(REPO_ROOT, 'scripts', 'generate_subtitles.py');

    if (fs.existsSync(timestampsDir) && fs.existsSync(subtitleScript)) {
      const tsFiles = fs.readdirSync(timestampsDir).filter(f => /^scene-\d{2,3}\.json$/.test(f));
      if (tsFiles.length > 0) {
        const python = getPython();
        srtPath = path.join(outputDir, `${slug}.srt`);

        try {
          const cmd = [
            python,
            `"${subtitleScript}"`,
            `--timestamps-dir "${timestampsDir}"`,
            `--output "${srtPath}"`,
            `--pause 0.5`,
          ].join(' ');

          run(cmd, { step: stepName });
          log(stepName, `Subtitles generated: ${srtPath}`);
        } catch (err) {
          log(stepName, `Subtitle generation failed (non-fatal): ${err.message}`);
          srtPath = null;
        }
      }
    }

    // 2. Generate metadata template
    const metadataPath = path.join(outputDir, 'metadata.txt');
    const title = project.title || slug;
    const topic = project.topic || title;
    const tone = project.config?.tone || project.tone || 'educational';
    const thumbnailExists = fs.existsSync(path.join(outputDir, 'thumbnail.png'));

    const metadata = [
      `Title: ${title}`,
      ``,
      `Description:`,
      `${title} — an animated stickman explainer about ${topic}.`,
      ``,
      `Tags: stickman animation, ${topic}, ${tone}, explainer, animated`,
      ``,
      `Files:`,
      `  Video:     output/${slug}.mp4`,
      srtPath ? `  Subtitles: output/${slug}.srt` : null,
      thumbnailExists ? `  Thumbnail: output/thumbnail.png` : null,
      ``,
      `Note: Edit description and tags before uploading to YouTube.`,
    ].filter(Boolean).join('\n');

    fs.writeFileSync(metadataPath, metadata + '\n', 'utf-8');
    log(stepName, `Metadata template written: ${metadataPath}`);

    log(stepName, '=== Publish step complete ===');
    updateStepStatus(projectDir, stepName, 'complete', {
      subtitles: srtPath ? `output/${slug}.srt` : null,
      metadata: 'output/metadata.txt',
    });

    return {
      success: true,
      output: `Published: metadata.txt${srtPath ? ' + ' + slug + '.srt' : ''}`,
    };
  } catch (err) {
    updateStepStatus(projectDir, stepName, 'error', { error: err.message });
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Step dispatch
// ---------------------------------------------------------------------------

const STEP_FUNCTIONS = {
  voice: runVoice,
  timestamps: runTimestamps,
  compose: runCompose,
  enhance: runEnhance,
  render: runRender,
  publish: runPublish,
};

async function runStep(stepName, projectDir) {
  const fn = STEP_FUNCTIONS[stepName];
  if (!fn) throw new Error(`Unknown step: ${stepName}`);
  return fn(projectDir);
}

/**
 * Run multiple deterministic steps in sequence.
 * Stops on the first failure.
 */
export async function runSteps(projectDir, steps) {
  const results = {};
  for (const stepName of steps) {
    log('pipeline', `--- Running step: ${stepName} ---`);
    const result = await runStep(stepName, projectDir);
    results[stepName] = result;

    if (!result.success) {
      logError('pipeline', `Step "${stepName}" failed: ${result.error}`);
      if (result.hint) logError('pipeline', `Hint: ${result.hint}`);
      break;
    }

    log('pipeline', `Step "${stepName}" succeeded: ${result.output}`);
  }
  return results;
}

/**
 * Resume mode: run all deterministic steps that aren't already complete.
 */
export async function resumePipeline(projectDir) {
  log('resume', 'Scanning for incomplete deterministic steps...');

  const pending = [];
  for (const stepName of DETERMINISTIC_STEPS) {
    const status = getStepStatus(projectDir, stepName);
    if (status !== 'complete') {
      pending.push(stepName);
    }
  }

  if (pending.length === 0) {
    log('resume', 'All deterministic steps are complete — nothing to do');
    return {};
  }

  log('resume', `Incomplete steps: ${pending.join(', ')}`);
  return runSteps(projectDir, pending);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: 'string', short: 'p' },
      step: { type: 'string', short: 's' },
      from: { type: 'string', short: 'f' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help || !values.project) {
    console.log(`
Stickman Animation Agent — Pipeline Orchestrator

Runs deterministic pipeline steps: voice, timestamps, compose, enhance, render, publish.
Creative steps (intake, script, characters, storyboard) are handled by the SKILL.md.

Usage:
  node src/pipeline/orchestrator.js --project projects/my-video/
  node src/pipeline/orchestrator.js --project projects/my-video/ --step voice
  node src/pipeline/orchestrator.js --project projects/my-video/ --from timestamps

Options:
  --project, -p     Path to the project directory (required)
  --step, -s        Run a single specific step
  --from, -f        Run all steps from the specified step onwards (re-runs even if complete)
  --help, -h        Show this help message

Deterministic steps (in order):
  voice         Generate per-scene WAV files via Kokoro TTS
  timestamps    Extract word-level timestamps via faster-whisper
  compose       Run compositor Phase B (scene JSON → HTML)
  enhance       Generate Gemini enhancement prompts
  render        HyperFrames render + FFmpeg assembly
  publish       Generate SRT subtitles + YouTube metadata template

Default (no --step or --from): resume mode — runs all incomplete steps.
`);
    process.exit(values.help ? 0 : 1);
  }

  const projectDir = path.resolve(values.project);

  if (!fs.existsSync(path.join(projectDir, 'video-project.json'))) {
    logError('cli', `video-project.json not found in ${projectDir}`);
    process.exit(1);
  }

  try {
    let results;

    if (values.step) {
      if (!STEP_FUNCTIONS[values.step]) {
        logError('cli', `Unknown step: ${values.step}. Valid steps: ${DETERMINISTIC_STEPS.join(', ')}`);
        process.exit(1);
      }
      results = await runSteps(projectDir, [values.step]);
    } else if (values.from) {
      const fromIndex = DETERMINISTIC_STEPS.indexOf(values.from);
      if (fromIndex === -1) {
        logError('cli', `Unknown step: ${values.from}. Valid steps: ${DETERMINISTIC_STEPS.join(', ')}`);
        process.exit(1);
      }
      const stepsToRun = DETERMINISTIC_STEPS.slice(fromIndex);
      results = await runSteps(projectDir, stepsToRun);
    } else {
      results = await resumePipeline(projectDir);
    }

    const failed = Object.entries(results).find(([, r]) => !r.success);
    if (failed) {
      console.log(`\nPipeline halted at step: ${failed[0]}`);
      process.exit(1);
    }

    console.log('\nAll requested steps completed successfully.');
    process.exit(0);
  } catch (err) {
    logError('cli', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

const _argv1 = process.argv[1] || '';
if (import.meta.url === `file:///${_argv1.replace(/\\/g, '/')}` ||
    _argv1.endsWith('pipeline/orchestrator.js') ||
    _argv1.endsWith('pipeline\\orchestrator.js')) {
  main();
}

export default runSteps;
