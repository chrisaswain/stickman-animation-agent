#!/usr/bin/env node

/**
 * Render & Assembly Pipeline
 * ==========================
 * Full render and assembly process for Stickman Animation Agent videos.
 *
 * Steps:
 *   1. Render each scene HTML to MP4 via HyperFrames (headless Chrome)
 *   2. Concatenate per-scene WAV files with inter-scene silence
 *   3. Mix background music under narration (if music exists)
 *   4. Concatenate scene MP4 segments into combined video
 *   5. Mux final video + audio into output MP4
 *   6. (Optional) Re-render at 1080x1920 for vertical version
 *
 * Usage:
 *   node src/render/pipeline.js --project projects/my-video/ --template whiteboard
 *
 * Reads video-project.json for config. Updates step status on completion.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

const LANDSCAPE = { width: 1920, height: 1080 };
const VERTICAL = { width: 1080, height: 1920 };
const DEFAULT_FPS = 30;
const INTER_SCENE_SILENCE_SEC = 0.5;
const MUSIC_DUCK_DB = -18;
const AAC_BITRATE = '192k';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] [render:${step}] ${message}`);
}

function logError(step, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.error(`[${timestamp}] [render:${step}] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

function writeJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Shell execution
// ---------------------------------------------------------------------------

/**
 * Run a shell command via execSync with proper error handling.
 * Returns stdout as a string. Throws on non-zero exit code.
 */
function run(command, options = {}) {
  const { cwd, step = 'exec', silent = false } = options;
  if (!silent) {
    log(step, `$ ${command}`);
  }
  try {
    const result = execSync(command, {
      cwd: cwd || REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 600_000, // 10 minute timeout per command
    });
    return result.trim();
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

// ---------------------------------------------------------------------------
// Step 1: Scene Rendering — HyperFrames render to MP4 segments
// ---------------------------------------------------------------------------

/**
 * Render all scene HTML files to MP4 segments via HyperFrames.
 *
 * @param {string[]} sceneHtmlPaths  - Ordered list of scene HTML file paths
 * @param {string} outputDir         - Directory to write MP4 segments to
 * @param {object} dimensions        - { width, height }
 * @param {number} fps               - Frames per second
 * @param {string} suffix            - Optional suffix for output files (e.g. '-vertical')
 * @returns {string[]}               Ordered list of rendered MP4 paths
 */
function renderScenes(sceneHtmlPaths, outputDir, dimensions, fps, suffix = '') {
  log('scenes', `Rendering ${sceneHtmlPaths.length} scene(s) at ${dimensions.width}x${dimensions.height} @ ${fps}fps`);
  ensureDir(outputDir);

  const renderedPaths = [];

  for (let i = 0; i < sceneHtmlPaths.length; i++) {
    const htmlPath = sceneHtmlPaths[i];
    const basename = path.basename(htmlPath, '.html');
    const mp4Name = `${basename}${suffix}.mp4`;
    const mp4Path = path.join(outputDir, mp4Name);

    log('scenes', `[${i + 1}/${sceneHtmlPaths.length}] Rendering ${basename}...`);

    const cmd = [
      'npx hyperframes render',
      `--input "${htmlPath}"`,
      `--output "${mp4Path}"`,
      `--width ${dimensions.width}`,
      `--height ${dimensions.height}`,
      `--fps ${fps}`,
    ].join(' ');

    run(cmd, { step: 'scenes' });

    // Verify output exists
    if (!fs.existsSync(mp4Path)) {
      throw new Error(`HyperFrames did not produce expected output: ${mp4Path}`);
    }

    const sizeKB = Math.round(fs.statSync(mp4Path).size / 1024);
    log('scenes', `[${i + 1}/${sceneHtmlPaths.length}] Done: ${mp4Name} (${sizeKB} KB)`);
    renderedPaths.push(mp4Path);
  }

  log('scenes', `All ${sceneHtmlPaths.length} scenes rendered successfully`);
  return renderedPaths;
}

// ---------------------------------------------------------------------------
// Step 2: Audio Concatenation — combine per-scene WAVs with silence
// ---------------------------------------------------------------------------

/**
 * Generate a silent WAV file of the specified duration.
 *
 * @param {string} outputPath     - Where to write the silence WAV
 * @param {number} durationSec    - Duration in seconds
 */
function generateSilence(outputPath, durationSec) {
  const cmd = [
    'ffmpeg -y',
    `-f lavfi -i anullsrc=r=44100:cl=mono`,
    `-t ${durationSec}`,
    `-c:a pcm_s16le`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd, { step: 'audio-concat', silent: true });
}

/**
 * Concatenate per-scene WAV files with inter-scene silence.
 *
 * @param {string[]} wavPaths       - Ordered list of per-scene WAV file paths
 * @param {string} outputPath       - Where to write the combined narration WAV
 * @param {number} silenceDuration  - Seconds of silence between scenes
 * @returns {string}                Path to the concatenated narration WAV
 */
function concatenateAudio(wavPaths, outputPath, silenceDuration = INTER_SCENE_SILENCE_SEC) {
  log('audio-concat', `Concatenating ${wavPaths.length} audio file(s) with ${silenceDuration}s inter-scene silence`);

  ensureDir(path.dirname(outputPath));

  // Generate a silence segment in a temp location
  const tempDir = path.join(path.dirname(outputPath), '.render-temp');
  ensureDir(tempDir);
  const silencePath = path.join(tempDir, 'silence.wav');
  generateSilence(silencePath, silenceDuration);

  // Build the concat list file
  // Format: file 'path' for each segment, with silence between them
  const concatListPath = path.join(tempDir, 'audio-concat.txt');
  const lines = [];

  for (let i = 0; i < wavPaths.length; i++) {
    const absPath = path.resolve(wavPaths[i]);
    lines.push(`file '${absPath.replace(/\\/g, '/')}'`);

    // Add silence between scenes (not after the last scene)
    if (i < wavPaths.length - 1) {
      lines.push(`file '${path.resolve(silencePath).replace(/\\/g, '/')}'`);
    }
  }

  fs.writeFileSync(concatListPath, lines.join('\n') + '\n', 'utf-8');
  log('audio-concat', `Concat list written to ${concatListPath}`);

  // Run FFmpeg concat
  const cmd = [
    'ffmpeg -y',
    `-f concat -safe 0`,
    `-i "${concatListPath}"`,
    `-c:a pcm_s16le`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd, { step: 'audio-concat' });

  // Verify output
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Audio concatenation did not produce expected output: ${outputPath}`);
  }

  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  log('audio-concat', `Narration audio combined: ${path.basename(outputPath)} (${sizeKB} KB)`);

  return outputPath;
}

// ---------------------------------------------------------------------------
// Step 3: Music Mixing — duck background music under narration
// ---------------------------------------------------------------------------

/**
 * Mix background music with narration, ducking music under the narration track.
 *
 * If no music file exists, returns the narration path unchanged.
 *
 * @param {string} narrationPath    - Path to the combined narration WAV
 * @param {string|null} musicPath   - Path to the background music WAV (or null)
 * @param {string} outputPath       - Where to write the mixed audio WAV
 * @returns {string}                Path to the final mixed audio WAV
 */
function mixMusic(narrationPath, musicPath, outputPath) {
  // If no music file, just use narration as-is
  if (!musicPath || !fs.existsSync(musicPath)) {
    log('music-mix', 'No background music found — using narration audio only');
    // Copy narration to the expected output path so downstream steps are consistent
    fs.copyFileSync(narrationPath, outputPath);
    return outputPath;
  }

  log('music-mix', `Mixing background music (ducked to ${MUSIC_DUCK_DB}dB) with narration`);

  ensureDir(path.dirname(outputPath));

  const cmd = [
    'ffmpeg -y',
    `-i "${narrationPath}"`,
    `-i "${musicPath}"`,
    `-filter_complex`,
    `"[1:a]volume=${MUSIC_DUCK_DB}dB[music];[0:a][music]amix=inputs=2:duration=first"`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd, { step: 'music-mix' });

  // Verify output
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Music mixing did not produce expected output: ${outputPath}`);
  }

  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  log('music-mix', `Mixed audio produced: ${path.basename(outputPath)} (${sizeKB} KB)`);

  return outputPath;
}

// ---------------------------------------------------------------------------
// Step 4: Video Concatenation — combine scene MP4 segments
// ---------------------------------------------------------------------------

/**
 * Concatenate MP4 scene segments into a single combined video.
 *
 * @param {string[]} mp4Paths    - Ordered list of scene MP4 paths
 * @param {string} outputPath    - Where to write the combined video
 * @returns {string}             Path to the combined video
 */
function concatenateVideo(mp4Paths, outputPath) {
  log('video-concat', `Concatenating ${mp4Paths.length} video segment(s)`);

  ensureDir(path.dirname(outputPath));

  // Build the concat list file
  const tempDir = path.join(path.dirname(outputPath), '.render-temp');
  ensureDir(tempDir);
  const concatListPath = path.join(tempDir, 'video-concat.txt');
  const lines = [];

  for (const mp4Path of mp4Paths) {
    const absPath = path.resolve(mp4Path);
    lines.push(`file '${absPath.replace(/\\/g, '/')}'`);
  }

  fs.writeFileSync(concatListPath, lines.join('\n') + '\n', 'utf-8');
  log('video-concat', `Concat list written to ${concatListPath}`);

  const cmd = [
    'ffmpeg -y',
    `-f concat -safe 0`,
    `-i "${concatListPath}"`,
    `-c copy`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd, { step: 'video-concat' });

  // Verify output
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Video concatenation did not produce expected output: ${outputPath}`);
  }

  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
  log('video-concat', `Combined video: ${path.basename(outputPath)} (${sizeKB} KB)`);

  return outputPath;
}

// ---------------------------------------------------------------------------
// Step 5: Final Mux — combine video + audio
// ---------------------------------------------------------------------------

/**
 * Mux combined video with mixed audio into the final output MP4.
 * NEVER uses -shortest flag (causes audio cutoff).
 *
 * @param {string} videoPath    - Path to combined video MP4
 * @param {string} audioPath    - Path to mixed audio WAV
 * @param {string} outputPath   - Where to write the final MP4
 * @returns {string}            Path to the final MP4
 */
function muxFinal(videoPath, audioPath, outputPath) {
  log('mux', `Muxing video + audio into final output`);

  ensureDir(path.dirname(outputPath));

  // NOTE: -shortest is intentionally NOT used — it causes audio cutoff
  const cmd = [
    'ffmpeg -y',
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-c:v copy`,
    `-c:a aac`,
    `-b:a ${AAC_BITRATE}`,
    `-map 0:v`,
    `-map 1:a`,
    `"${outputPath}"`,
  ].join(' ');

  run(cmd, { step: 'mux' });

  // Verify output
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Final mux did not produce expected output: ${outputPath}`);
  }

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
  log('mux', `Final video: ${path.basename(outputPath)} (${sizeMB} MB)`);

  return outputPath;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Remove the temporary render directory.
 */
function cleanupTemp(projectDir) {
  const tempDir = path.join(projectDir, 'output', '.render-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    log('cleanup', `Removed temp directory: ${tempDir}`);
  }
}

// ---------------------------------------------------------------------------
// File Discovery
// ---------------------------------------------------------------------------

/**
 * Find all scene HTML composition files in order.
 * Expects filenames like scene-01.html, scene-02.html, etc.
 */
function findSceneHtmlFiles(projectDir) {
  const compositionsDir = path.join(projectDir, 'compositions');

  if (!fs.existsSync(compositionsDir)) {
    throw new Error(`Compositions directory not found: ${compositionsDir}`);
  }

  const files = fs.readdirSync(compositionsDir)
    .filter(f => f.match(/^scene-\d{2,3}\.html$/))
    .sort()
    .map(f => path.join(compositionsDir, f));

  if (files.length === 0) {
    throw new Error(`No scene HTML files found in ${compositionsDir}. Expected files like scene-01.html, scene-02.html`);
  }

  return files;
}

/**
 * Find all per-scene WAV audio files in order.
 * Expects filenames like scene-01.wav, scene-02.wav, etc.
 */
function findSceneWavFiles(projectDir) {
  const audioDir = path.join(projectDir, 'audio');

  if (!fs.existsSync(audioDir)) {
    throw new Error(`Audio directory not found: ${audioDir}`);
  }

  const files = fs.readdirSync(audioDir)
    .filter(f => f.match(/^scene-\d{2,3}\.wav$/))
    .sort()
    .map(f => path.join(audioDir, f));

  if (files.length === 0) {
    throw new Error(`No scene WAV files found in ${audioDir}. Expected files like scene-01.wav, scene-02.wav`);
  }

  return files;
}

/**
 * Find the background music file if it exists.
 * Returns the path or null.
 */
function findMusicFile(projectDir) {
  const musicPath = path.join(projectDir, 'audio', 'music.wav');
  if (fs.existsSync(musicPath)) {
    return musicPath;
  }
  // Also check for music.mp3
  const musicMp3 = path.join(projectDir, 'audio', 'music.mp3');
  if (fs.existsSync(musicMp3)) {
    return musicMp3;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Project State Management
// ---------------------------------------------------------------------------

/**
 * Update a step's status in video-project.json.
 *
 * @param {string} projectJsonPath  - Path to video-project.json
 * @param {string} stepName         - Pipeline step name (e.g. 'render')
 * @param {string} status           - Status value: 'pending' | 'in-progress' | 'complete' | 'error'
 * @param {object} [extras]         - Optional extra fields to merge into the step entry
 */
function updateStepStatus(projectJsonPath, stepName, status, extras = {}) {
  const project = readJSON(projectJsonPath);

  if (!project.steps) {
    project.steps = {};
  }

  project.steps[stepName] = {
    ...(project.steps[stepName] || {}),
    status,
    updatedAt: new Date().toISOString(),
    ...extras,
  };

  writeJSON(projectJsonPath, project);
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

/**
 * Execute the full render and assembly pipeline for a project.
 *
 * @param {object} options
 * @param {string} options.projectDir    - Absolute path to the project directory
 * @param {string} options.templateName  - Template name (default: 'whiteboard')
 * @returns {object}  { landscapePath, verticalPath?, sceneCount, duration }
 */
export async function renderPipeline(options) {
  const {
    projectDir,
    templateName = 'whiteboard',
  } = options;

  const resolvedProjectDir = path.resolve(projectDir);
  const projectJsonPath = path.join(resolvedProjectDir, 'video-project.json');

  // ---- Load project config ----
  log('init', `Loading project: ${resolvedProjectDir}`);

  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(`video-project.json not found in ${resolvedProjectDir}`);
  }

  const project = readJSON(projectJsonPath);
  const slug = project.slug || path.basename(resolvedProjectDir);
  const aspectRatio = project.aspectRatio || project.aspect_ratio || 'landscape';
  const fps = project.fps || DEFAULT_FPS;

  log('init', `Project: "${project.title || slug}" | Aspect: ${aspectRatio} | FPS: ${fps}`);

  // Mark render step as in-progress
  updateStepStatus(projectJsonPath, 'render', 'in-progress');

  try {
    // ---- Discover files ----
    const sceneHtmlFiles = findSceneHtmlFiles(resolvedProjectDir);
    const sceneWavFiles = findSceneWavFiles(resolvedProjectDir);
    const musicFile = findMusicFile(resolvedProjectDir);

    log('init', `Found ${sceneHtmlFiles.length} scene HTML file(s)`);
    log('init', `Found ${sceneWavFiles.length} scene WAV file(s)`);
    log('init', musicFile ? `Found background music: ${path.basename(musicFile)}` : 'No background music found');

    // Validate scene count match
    if (sceneHtmlFiles.length !== sceneWavFiles.length) {
      log('init', `WARNING: Scene count mismatch — ${sceneHtmlFiles.length} HTML files vs ${sceneWavFiles.length} WAV files`);
    }

    const outputDir = path.join(resolvedProjectDir, 'output');
    ensureDir(outputDir);

    // ---- LANDSCAPE RENDER ----
    log('pipeline', '=== Starting landscape render ===');

    // Step 1: Render scenes to MP4 segments
    const sceneMp4Paths = renderScenes(
      sceneHtmlFiles,
      outputDir,
      LANDSCAPE,
      fps,
    );

    // Step 2: Concatenate audio
    const narrationPath = path.join(outputDir, 'narration.wav');
    concatenateAudio(sceneWavFiles, narrationPath);

    // Step 3: Mix music
    const mixedAudioPath = path.join(outputDir, 'mixed-audio.wav');
    mixMusic(narrationPath, musicFile, mixedAudioPath);

    // Step 4: Concatenate video segments
    const combinedVideoPath = path.join(outputDir, 'combined.mp4');
    concatenateVideo(sceneMp4Paths, combinedVideoPath);

    // Step 5: Final mux
    const landscapePath = path.join(outputDir, `${slug}.mp4`);
    muxFinal(combinedVideoPath, mixedAudioPath, landscapePath);

    log('pipeline', `=== Landscape render complete: ${landscapePath} ===`);

    // ---- VERTICAL RENDER (if aspect ratio is "both") ----
    let verticalPath = null;

    if (aspectRatio === 'both') {
      log('pipeline', '=== Starting vertical render ===');

      // Step 6a: Re-render scenes at vertical dimensions
      const verticalMp4Paths = renderScenes(
        sceneHtmlFiles,
        outputDir,
        VERTICAL,
        fps,
        '-vertical',
      );

      // Step 6b: Concatenate vertical video segments
      const combinedVerticalPath = path.join(outputDir, 'combined-vertical.mp4');
      concatenateVideo(verticalMp4Paths, combinedVerticalPath);

      // Step 6c: Mux vertical video + same mixed audio
      verticalPath = path.join(outputDir, `${slug}-vertical.mp4`);
      muxFinal(combinedVerticalPath, mixedAudioPath, verticalPath);

      log('pipeline', `=== Vertical render complete: ${verticalPath} ===`);
    }

    // ---- Cleanup temp files ----
    cleanupTemp(resolvedProjectDir);

    // ---- Update project status ----
    const result = {
      landscapePath,
      verticalPath,
      sceneCount: sceneHtmlFiles.length,
    };

    updateStepStatus(projectJsonPath, 'render', 'complete', {
      output: {
        landscape: landscapePath,
        vertical: verticalPath,
      },
      sceneCount: sceneHtmlFiles.length,
    });

    log('pipeline', '=== Render pipeline complete ===');
    log('pipeline', `  Landscape: ${landscapePath}`);
    if (verticalPath) {
      log('pipeline', `  Vertical:  ${verticalPath}`);
    }
    log('pipeline', `  Scenes:    ${sceneHtmlFiles.length}`);

    return result;

  } catch (err) {
    // Mark step as error
    updateStepStatus(projectJsonPath, 'render', 'error', {
      error: err.message,
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      project: { type: 'string', short: 'p' },
      template: { type: 'string', short: 't', default: 'whiteboard' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help || !values.project) {
    console.log(`
Stickman Animation Agent — Render & Assembly Pipeline

Usage:
  node src/render/pipeline.js --project projects/my-video/ --template whiteboard

Options:
  --project, -p     Path to the project directory (required)
  --template, -t    Template name (default: whiteboard)
  --help, -h        Show this help message

Pipeline steps:
  1. Render scenes    HyperFrames render each scene HTML to MP4 segment
  2. Concat audio     Combine per-scene WAVs with 0.5s inter-scene silence
  3. Mix music        Duck background music to ${MUSIC_DUCK_DB}dB under narration
  4. Concat video     Combine scene MP4 segments into single video
  5. Final mux        Combine video + audio (AAC ${AAC_BITRATE})
  6. Vertical render  If aspect ratio is "both", re-render at 1080x1920

Reads video-project.json for config (slug, aspectRatio, fps).
Updates step status in video-project.json on completion or error.
`);
    process.exit(values.help ? 0 : 1);
  }

  try {
    const result = await renderPipeline({
      projectDir: values.project,
      templateName: values.template,
    });

    console.log('\nRender pipeline finished successfully.');
    console.log(`  Output: ${result.landscapePath}`);
    if (result.verticalPath) {
      console.log(`  Vertical: ${result.verticalPath}`);
    }
    process.exit(0);
  } catch (err) {
    logError('pipeline', err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
const _argv1 = process.argv[1] || '';
if (import.meta.url === `file:///${_argv1.replace(/\\/g, '/')}` ||
    _argv1.endsWith('render/pipeline.js') ||
    _argv1.endsWith('render\\pipeline.js')) {
  main();
}

export default renderPipeline;
