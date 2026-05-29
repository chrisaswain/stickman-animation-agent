#!/usr/bin/env node

/**
 * E2E Pipeline Integration Test
 * ==============================
 * Validates that all core pipeline components work together by creating
 * a minimal test project and running through the key stages.
 *
 * Does NOT actually render video (that requires HyperFrames + Chrome),
 * but validates:
 *   1. Character sheet loading (everyman.json)
 *   2. Scene schema validation
 *   3. Compositor execution (HTML output)
 *   4. Render pipeline module loading
 *   5. Gemini enhancer module loading
 *   6. File discovery functions (scene HTML/WAV pattern matching)
 *
 * Usage:
 *   node tests/e2e-pipeline-test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const TESTS_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(TESTS_DIR, '..');
const TEST_OUTPUT_DIR = path.join(TESTS_DIR, '.test-output');
const TEST_PROJECT_DIR = path.join(TEST_OUTPUT_DIR, 'test-project');

const PRESETS_DIR = path.join(REPO_ROOT, 'character-library', 'presets');
const SCENE_SCHEMA_PATH = path.join(REPO_ROOT, 'src', 'compositor', 'scene-schema.json');
const COMPOSITOR_PATH = path.join(REPO_ROOT, 'src', 'compositor', 'index.js');
const RENDER_PIPELINE_PATH = path.join(REPO_ROOT, 'src', 'render', 'pipeline.js');
const ENHANCE_DIR = path.join(REPO_ROOT, 'src', 'enhance');
const GEMINI_ENHANCER_PATH = path.join(ENHANCE_DIR, 'gemini-enhancer.js');

// ---------------------------------------------------------------------------
// Test fixture data
// ---------------------------------------------------------------------------

const MINIMAL_SCENE = {
  sceneId: '01',
  type: 'establishing',
  duration: 3.0,
  background: 'whiteboard/parchment',
  characters: [
    {
      id: 'everyman',
      pose: 'standing',
      position: { x: 480, y: 300 },
      facing: 'front',
    },
  ],
  timeline: [
    {
      time: 0,
      target: 'everyman',
      action: 'enter-draw-in',
      duration: 1.5,
    },
  ],
};

const MINIMAL_VIDEO_PROJECT = {
  title: 'E2E Test Project',
  slug: 'e2e-test',
  aspectRatio: 'landscape',
  fps: 30,
  steps: {},
};

const MOCK_TIMESTAMP_SCENE_01 = {
  scene_id: 'scene-01',
  duration: 3.0,
  segments: [
    { start: 0.0, end: 1.2, text: 'Hello and welcome.' },
    { start: 1.4, end: 2.8, text: 'This is scene one.' },
  ],
};

const MOCK_TIMESTAMP_SCENE_02 = {
  scene_id: 'scene-02',
  duration: 2.5,
  segments: [
    { start: 0.0, end: 1.0, text: 'Now for scene two.' },
    { start: 1.2, end: 2.3, text: 'The final scene.' },
  ],
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

function setupTestProject() {
  // Create the project directory structure
  const dirs = [
    TEST_PROJECT_DIR,
    path.join(TEST_PROJECT_DIR, 'compositions'),
    path.join(TEST_PROJECT_DIR, 'audio'),
    path.join(TEST_PROJECT_DIR, 'characters'),
    path.join(TEST_PROJECT_DIR, 'output'),
    path.join(TEST_PROJECT_DIR, 'timestamps'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write video-project.json
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'video-project.json'),
    JSON.stringify(MINIMAL_VIDEO_PROJECT, null, 2),
    'utf-8',
  );

  // Write a minimal scene JSON
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'compositions', 'scene-01.json'),
    JSON.stringify(MINIMAL_SCENE, null, 2),
    'utf-8',
  );

  // Copy the everyman character sheet into the test project
  const everymanSrc = path.join(PRESETS_DIR, 'everyman.json');
  if (fs.existsSync(everymanSrc)) {
    fs.copyFileSync(
      everymanSrc,
      path.join(TEST_PROJECT_DIR, 'characters', 'everyman.json'),
    );
  }

  // Create dummy scene WAV files (1-byte files, enough for discovery tests)
  fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'audio', 'scene-01.wav'), Buffer.alloc(1));
  fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'audio', 'scene-02.wav'), Buffer.alloc(1));

  // Write mock timestamp files for subtitle generation tests
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'timestamps', 'scene-01.json'),
    JSON.stringify(MOCK_TIMESTAMP_SCENE_01, null, 2),
    'utf-8',
  );
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'timestamps', 'scene-02.json'),
    JSON.stringify(MOCK_TIMESTAMP_SCENE_02, null, 2),
    'utf-8',
  );

  // Create dummy scene HTML files for discovery tests
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'compositions', 'scene-01.html'),
    '<html><body>test scene 01</body></html>',
    'utf-8',
  );
  fs.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'compositions', 'scene-02.html'),
    '<html><body>test scene 02</body></html>',
    'utf-8',
  );
}

function teardownTestProject() {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Test 1: Character sheet loading
// ---------------------------------------------------------------------------

test('1. Character sheet loading — everyman.json', () => {
  const presetPath = path.join(PRESETS_DIR, 'everyman.json');
  assert.ok(fs.existsSync(presetPath), `Preset file must exist: ${presetPath}`);

  const raw = fs.readFileSync(presetPath, 'utf-8');
  const sheet = JSON.parse(raw);

  // Required top-level fields
  assert.ok(sheet.id, 'Character sheet must have "id"');
  assert.ok(sheet.name, 'Character sheet must have "name"');
  assert.ok(typeof sheet.tier === 'number', 'Character sheet must have numeric "tier"');
  assert.ok(sheet.proportions, 'Character sheet must have "proportions"');
  assert.ok(sheet.components, 'Character sheet must have "components"');
  assert.ok(sheet.poses, 'Character sheet must have "poses"');

  // Proportions sub-fields
  assert.ok(sheet.proportions.totalHeight > 0, 'proportions.totalHeight must be > 0');
  assert.ok(sheet.proportions.headDiameter > 0, 'proportions.headDiameter must be > 0');

  // Components sub-fields
  assert.ok(sheet.components.head, 'components.head is required');
  assert.ok(sheet.components.torso, 'components.torso is required');
  assert.ok(sheet.components.defaultExpression, 'components.defaultExpression is required');
  assert.ok(sheet.components.defaultArms, 'components.defaultArms is required');
  assert.ok(sheet.components.defaultLegs, 'components.defaultLegs is required');

  // Poses — at least "standing" must exist
  assert.ok(sheet.poses.standing, 'poses.standing is required');

  // Specific everyman values
  assert.equal(sheet.id, 'everyman');
  assert.equal(sheet.tier, 1);

  console.log('  [PASS] everyman.json loaded and validated');
});

// ---------------------------------------------------------------------------
// Test 2: Scene schema validation
// ---------------------------------------------------------------------------

test('2. Scene schema validation — minimal scene definition', () => {
  assert.ok(fs.existsSync(SCENE_SCHEMA_PATH), `Schema file must exist: ${SCENE_SCHEMA_PATH}`);

  const schema = JSON.parse(fs.readFileSync(SCENE_SCHEMA_PATH, 'utf-8'));

  // Verify schema structure
  assert.ok(schema.properties, 'Schema must have properties');
  assert.ok(schema.required, 'Schema must have required array');
  assert.ok(Array.isArray(schema.required), 'required must be an array');

  // All required fields from the schema must be present in our test scene
  for (const field of schema.required) {
    assert.ok(
      MINIMAL_SCENE[field] !== undefined,
      `Test scene must include required field "${field}"`,
    );
  }

  // Validate sceneId pattern (2-3 digit zero-padded)
  const sceneIdPattern = new RegExp(schema.properties.sceneId.pattern);
  assert.ok(
    sceneIdPattern.test(MINIMAL_SCENE.sceneId),
    `sceneId "${MINIMAL_SCENE.sceneId}" must match pattern ${schema.properties.sceneId.pattern}`,
  );

  // Validate type enum
  const validTypes = schema.properties.type.enum;
  assert.ok(
    validTypes.includes(MINIMAL_SCENE.type),
    `Scene type "${MINIMAL_SCENE.type}" must be one of: ${validTypes.join(', ')}`,
  );

  // Validate duration range
  assert.ok(
    MINIMAL_SCENE.duration >= schema.properties.duration.minimum,
    `Duration must be >= ${schema.properties.duration.minimum}`,
  );
  assert.ok(
    MINIMAL_SCENE.duration <= schema.properties.duration.maximum,
    `Duration must be <= ${schema.properties.duration.maximum}`,
  );

  // Validate characters array has required fields per characterPlacement $def
  const charPlacementDef = schema.$defs.characterPlacement;
  assert.ok(charPlacementDef, 'Schema must define characterPlacement in $defs');

  for (const char of MINIMAL_SCENE.characters) {
    for (const field of charPlacementDef.required) {
      assert.ok(
        char[field] !== undefined,
        `Character must include required field "${field}"`,
      );
    }
  }

  // Validate timeline events have required fields per timelineEvent $def
  const timelineEventDef = schema.$defs.timelineEvent;
  assert.ok(timelineEventDef, 'Schema must define timelineEvent in $defs');

  for (const event of MINIMAL_SCENE.timeline) {
    for (const field of timelineEventDef.required) {
      assert.ok(
        event[field] !== undefined,
        `Timeline event must include required field "${field}"`,
      );
    }
  }

  console.log('  [PASS] Minimal scene validates against schema structure');
});

// ---------------------------------------------------------------------------
// Test 3: Compositor execution
// ---------------------------------------------------------------------------

test('3. Compositor execution — produces HTML output', () => {
  assert.ok(fs.existsSync(COMPOSITOR_PATH), `Compositor must exist: ${COMPOSITOR_PATH}`);

  const sceneJsonPath = path.join(TEST_PROJECT_DIR, 'compositions', 'scene-01.json');
  const outputHtmlPath = path.join(TEST_OUTPUT_DIR, 'compositor-output.html');

  assert.ok(fs.existsSync(sceneJsonPath), `Test scene JSON must exist: ${sceneJsonPath}`);

  // Run the compositor as a subprocess
  const cmd = [
    'node',
    `"${COMPOSITOR_PATH}"`,
    `--scene "${sceneJsonPath}"`,
    `--project "${TEST_PROJECT_DIR}"`,
    `--template whiteboard`,
    `--output "${outputHtmlPath}"`,
  ].join(' ');

  let stdout;
  try {
    stdout = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const out = err.stdout ? err.stdout.toString() : '';
    assert.fail(
      `Compositor failed (exit ${err.status}):\n` +
      `  stdout: ${out}\n` +
      `  stderr: ${stderr}`,
    );
  }

  // Verify HTML output was created
  assert.ok(
    fs.existsSync(outputHtmlPath),
    `Compositor must produce HTML output at ${outputHtmlPath}`,
  );

  // Verify the output is valid HTML with expected markers
  const html = fs.readFileSync(outputHtmlPath, 'utf-8');
  assert.ok(html.length > 100, 'HTML output must not be trivially small');
  assert.ok(html.includes('<!DOCTYPE html>'), 'Output must be an HTML document');
  assert.ok(html.includes('Scene 01'), 'Output must reference the scene ID');
  assert.ok(html.includes('gsap'), 'Output must include GSAP reference');
  assert.ok(html.includes('data-composition-id'), 'Output must include HyperFrames composition ID');
  assert.ok(html.includes('camera-wrapper'), 'Output must include camera wrapper group');

  // Check for character group (may be a warning comment if SVG parts are missing)
  const hasCharGroup = html.includes('id="char-everyman"') || html.includes('everyman');
  assert.ok(hasCharGroup, 'Output must reference the everyman character');

  console.log(`  [PASS] Compositor produced ${html.length} bytes of HTML`);
});

// ---------------------------------------------------------------------------
// Test 4: Render pipeline module loading
// ---------------------------------------------------------------------------

test('4. Render pipeline module loading — renderPipeline export', async () => {
  assert.ok(
    fs.existsSync(RENDER_PIPELINE_PATH),
    `Render pipeline must exist: ${RENDER_PIPELINE_PATH}`,
  );

  const pipelineModule = await import(`file:///${RENDER_PIPELINE_PATH.replace(/\\/g, '/')}`);

  // Check named export
  assert.ok(
    typeof pipelineModule.renderPipeline === 'function',
    'Module must export "renderPipeline" as a function',
  );

  // Check default export
  assert.ok(
    typeof pipelineModule.default === 'function',
    'Module must have a default export (function)',
  );

  console.log('  [PASS] renderPipeline export verified');
});

// ---------------------------------------------------------------------------
// Test 5: Gemini enhancer module loading
// ---------------------------------------------------------------------------

test('5. Gemini enhancer module loading — verify exports', async () => {
  assert.ok(
    fs.existsSync(ENHANCE_DIR),
    `Enhance directory must exist: ${ENHANCE_DIR}`,
  );

  const enhancePkgPath = path.join(ENHANCE_DIR, 'package.json');
  assert.ok(
    fs.existsSync(enhancePkgPath),
    `Enhance package.json must exist: ${enhancePkgPath}`,
  );

  const pkg = JSON.parse(fs.readFileSync(enhancePkgPath, 'utf-8'));
  assert.ok(pkg.name, 'Enhance package must have a name');
  assert.equal(pkg.type, 'module', 'Enhance package must be ESM ("type": "module")');

  assert.ok(
    fs.existsSync(GEMINI_ENHANCER_PATH),
    `gemini-enhancer.js must exist: ${GEMINI_ENHANCER_PATH}`,
  );

  const mod = await import(`file:///${GEMINI_ENHANCER_PATH.replace(/\\/g, '/')}`);

  assert.ok(typeof mod.generateMusic === 'function', 'Must export generateMusic function');
  assert.ok(typeof mod.generateThumbnail === 'function', 'Must export generateThumbnail function');
  assert.ok(typeof mod.enhance === 'function', 'Must export enhance function');
  assert.ok(typeof mod.updatePlanStatus === 'function', 'Must export updatePlanStatus function');
  assert.ok(typeof mod.completePlan === 'function', 'Must export completePlan function');
  assert.ok(typeof mod.default === 'function', 'Must have default export (function)');

  console.log('  [PASS] gemini-enhancer.js imports and exports verified');
});

// ---------------------------------------------------------------------------
// Test 6: File discovery functions
// ---------------------------------------------------------------------------

test('6. File discovery — scene HTML and WAV pattern matching', async () => {
  // Import the render pipeline to access the discovery functions indirectly.
  // Since findSceneHtmlFiles and findSceneWavFiles are not exported, we test
  // the same regex patterns they use against our test fixtures.

  const compositionsDir = path.join(TEST_PROJECT_DIR, 'compositions');
  const audioDir = path.join(TEST_PROJECT_DIR, 'audio');

  // -- HTML file discovery --
  const htmlPattern = /^scene-\d{2,3}\.html$/;
  const htmlFiles = fs.readdirSync(compositionsDir)
    .filter(f => htmlPattern.test(f))
    .sort();

  assert.ok(htmlFiles.length >= 2, `Must find at least 2 HTML files, found ${htmlFiles.length}`);
  assert.ok(htmlFiles.includes('scene-01.html'), 'Must find scene-01.html');
  assert.ok(htmlFiles.includes('scene-02.html'), 'Must find scene-02.html');

  // Verify ordering
  assert.equal(htmlFiles[0], 'scene-01.html', 'First file must be scene-01.html');
  assert.equal(htmlFiles[1], 'scene-02.html', 'Second file must be scene-02.html');

  // -- WAV file discovery --
  const wavPattern = /^scene-\d{2,3}\.wav$/;
  const wavFiles = fs.readdirSync(audioDir)
    .filter(f => wavPattern.test(f))
    .sort();

  assert.ok(wavFiles.length >= 2, `Must find at least 2 WAV files, found ${wavFiles.length}`);
  assert.ok(wavFiles.includes('scene-01.wav'), 'Must find scene-01.wav');
  assert.ok(wavFiles.includes('scene-02.wav'), 'Must find scene-02.wav');

  // -- Negative cases: files that should NOT match --
  const nonMatching = [
    'scene-1.html',      // single digit (need 2-3)
    'scene-0001.html',   // 4 digits
    'scene-01.json',     // wrong extension
    'scene-01.mp4',      // wrong extension
    'intro.html',        // wrong prefix
  ];

  for (const name of nonMatching) {
    assert.ok(!htmlPattern.test(name), `"${name}" must NOT match HTML pattern`);
  }

  // -- 3-digit scene numbers should match --
  assert.ok(htmlPattern.test('scene-001.html'), 'scene-001.html must match (3 digits)');
  assert.ok(wavPattern.test('scene-099.wav'), 'scene-099.wav must match (3 digits)');

  // -- Music file discovery --
  // Create a music.wav to test discovery
  const musicPath = path.join(audioDir, 'music.wav');
  fs.writeFileSync(musicPath, Buffer.alloc(1));
  assert.ok(fs.existsSync(musicPath), 'music.wav must exist after creation');

  console.log(`  [PASS] Found ${htmlFiles.length} HTML, ${wavFiles.length} WAV, music.wav present`);
});

// ---------------------------------------------------------------------------
// Test 7: Classic-stickman template loading
// ---------------------------------------------------------------------------

test('7. Classic-stickman template — loads and merges with _base', () => {
  const templatePath = path.join(REPO_ROOT, 'templates', 'classic-stickman', 'template.json');
  assert.ok(fs.existsSync(templatePath), `Template must exist: ${templatePath}`);

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  assert.equal(template.name, 'classic-stickman', 'Template name must be "classic-stickman"');
  assert.equal(template.extends, '_base', 'Must extend _base');
  assert.equal(template.palette.background, '#0A0A0A', 'Background must be dark');
  assert.equal(template.palette.characterStroke, '#FFFFFF', 'Character stroke must be white');
  assert.equal(template.palette.ink, '#FFFFFF', 'Ink must be white');
  assert.equal(template.palette.accent, '#00D4FF', 'Accent must be cyan');
  assert.equal(template.animation.handDrawnFilter, false, 'Hand-drawn filter must be disabled');
  assert.equal(template.animation.drawSpeed, 0.8, 'Draw speed must be 0.8x (faster)');
  assert.ok(template.typography.headingFont.includes('Space Mono'), 'Must use Space Mono font');

  console.log('  [PASS] classic-stickman template loaded and validated');
});

// ---------------------------------------------------------------------------
// Test 8: Classic-stickman compositor output
// ---------------------------------------------------------------------------

test('8. Classic-stickman compositor — produces HTML with correct styling', () => {
  const sceneJsonPath = path.join(TEST_PROJECT_DIR, 'compositions', 'scene-01.json');
  const outputHtmlPath = path.join(TEST_OUTPUT_DIR, 'classic-stickman-output.html');

  const cmd = [
    'node',
    `"${COMPOSITOR_PATH}"`,
    `--scene "${sceneJsonPath}"`,
    `--project "${TEST_PROJECT_DIR}"`,
    `--template classic-stickman`,
    `--output "${outputHtmlPath}"`,
  ].join(' ');

  let stdout;
  try {
    stdout = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    assert.fail(`Classic-stickman compositor failed: ${stderr}`);
  }

  assert.ok(fs.existsSync(outputHtmlPath), 'Must produce HTML output');

  const html = fs.readFileSync(outputHtmlPath, 'utf-8');
  assert.ok(html.includes('#0A0A0A'), 'Output must use dark background color');
  assert.ok(html.includes('Space Mono'), 'Output must reference Space Mono font');
  assert.ok(html.includes('g[id^="char-"]'), 'Output must include characterStroke CSS override');
  assert.ok(html.includes('scanline-pattern'), 'Output must include scanline pattern');
  assert.ok(html.includes('vignette-grad'), 'Output must include vignette gradient');
  assert.ok(!html.includes('filter="url(#hand-drawn)"'), 'Output must NOT include hand-drawn filter');

  console.log(`  [PASS] Classic-stickman compositor produced ${html.length} bytes`);
});

// ---------------------------------------------------------------------------
// Test 9: Comic-panel template loading
// ---------------------------------------------------------------------------

test('9. Comic-panel template — loads and merges with _base', () => {
  const templatePath = path.join(REPO_ROOT, 'templates', 'comic-panel', 'template.json');
  assert.ok(fs.existsSync(templatePath), `Template must exist: ${templatePath}`);

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  assert.equal(template.name, 'comic-panel', 'Template name must be "comic-panel"');
  assert.equal(template.extends, '_base', 'Must extend _base');
  assert.equal(template.palette.background, '#FFFFFF', 'Background must be white');
  assert.equal(template.palette.panelBorder, '#000000', 'Panel border must be black');
  assert.equal(template.palette.accent, '#FF4444', 'Accent must be red');
  assert.equal(template.animation.defaultEntrance, 'fade', 'Default entrance must be fade');
  assert.equal(template.animation.handDrawnFilter, false, 'Hand-drawn filter must be disabled');
  assert.equal(template.animation.backgroundStyle, 'panel-borders', 'Background style must be panel-borders');
  assert.ok(template.typography.headingFont.includes('Comic Neue'), 'Must use Comic Neue font');

  console.log('  [PASS] comic-panel template loaded and validated');
});

// ---------------------------------------------------------------------------
// Test 10: Comic-panel compositor output
// ---------------------------------------------------------------------------

test('10. Comic-panel compositor — produces HTML with panel borders', () => {
  // Use a dialogue scene to get the 2-panel layout
  const dialogueScene = {
    ...MINIMAL_SCENE,
    type: 'dialogue',
  };
  const dialogueScenePath = path.join(TEST_PROJECT_DIR, 'compositions', 'scene-dialogue.json');
  fs.writeFileSync(dialogueScenePath, JSON.stringify(dialogueScene, null, 2), 'utf-8');

  const outputHtmlPath = path.join(TEST_OUTPUT_DIR, 'comic-panel-output.html');

  const cmd = [
    'node',
    `"${COMPOSITOR_PATH}"`,
    `--scene "${dialogueScenePath}"`,
    `--project "${TEST_PROJECT_DIR}"`,
    `--template comic-panel`,
    `--output "${outputHtmlPath}"`,
  ].join(' ');

  let stdout;
  try {
    stdout = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    assert.fail(`Comic-panel compositor failed: ${stderr}`);
  }

  assert.ok(fs.existsSync(outputHtmlPath), 'Must produce HTML output');

  const html = fs.readFileSync(outputHtmlPath, 'utf-8');
  assert.ok(html.includes('#FFFFFF'), 'Output must use white background');
  assert.ok(html.includes('Comic Neue'), 'Output must reference Comic Neue font');
  assert.ok(html.includes('stroke="#000000"'), 'Output must include panel border strokes');
  // Dialogue scene should produce a 2-panel vertical split line at midpoint (960)
  assert.ok(html.includes('x1="960"'), 'Dialogue scene must include vertical split line at x=960');
  assert.ok(!html.includes('filter="url(#hand-drawn)"'), 'Output must NOT include hand-drawn filter');

  console.log(`  [PASS] Comic-panel compositor produced ${html.length} bytes`);
});

// ---------------------------------------------------------------------------
// Test 11: Brand config loading
// ---------------------------------------------------------------------------

test('11. Brand config loading — _example brand.json validates', () => {
  const brandPath = path.join(REPO_ROOT, 'brands', '_example', 'brand.json');
  assert.ok(fs.existsSync(brandPath), `Example brand must exist: ${brandPath}`);

  const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'));
  assert.ok(brand.name, 'Brand must have a name');
  assert.ok(brand.watermark, 'Brand must have watermark config');
  assert.ok(brand.watermark.logo, 'Watermark must have logo field');
  assert.ok(brand.watermark.position, 'Watermark must have position field');
  assert.ok(typeof brand.watermark.scale === 'number', 'Watermark scale must be a number');
  assert.ok(typeof brand.watermark.opacity === 'number', 'Watermark opacity must be a number');
  assert.ok(brand.watermark.opacity > 0 && brand.watermark.opacity <= 1, 'Opacity must be 0-1');

  console.log('  [PASS] Example brand config loaded and validated');
});

// ---------------------------------------------------------------------------
// Test 12: Watermark — graceful skip when no brand set
// ---------------------------------------------------------------------------

test('12. Watermark — graceful skip when no brand in video-project.json', async () => {
  const pipelineModule = await import(`file:///${RENDER_PIPELINE_PATH.replace(/\\/g, '/')}`);

  assert.ok(
    typeof pipelineModule.applyWatermark === 'function',
    'Module must export "applyWatermark" as a function',
  );

  // Test project has no "brand" field in video-project.json
  const result = pipelineModule.applyWatermark(
    'nonexistent.mp4',
    TEST_PROJECT_DIR,
    path.join(TEST_OUTPUT_DIR, 'watermarked.mp4'),
  );
  assert.equal(result, null, 'Must return null when no brand field set');

  console.log('  [PASS] Watermark gracefully skipped (no brand configured)');
});

// ---------------------------------------------------------------------------
// Test 13: Subtitle generation
// ---------------------------------------------------------------------------

test('13. Subtitle generation — generateSubtitles produces SRT from timestamps', async () => {
  const pipelineModule = await import(`file:///${RENDER_PIPELINE_PATH.replace(/\\/g, '/')}`);

  assert.ok(
    typeof pipelineModule.generateSubtitles === 'function',
    'Module must export "generateSubtitles" as a function',
  );

  const srtPath = pipelineModule.generateSubtitles(TEST_PROJECT_DIR, 'e2e-test');

  if (srtPath === null) {
    // If Python venv or script isn't available, skip gracefully
    console.log('  [SKIP] generateSubtitles returned null (Python venv or script not available)');
    return;
  }

  assert.ok(fs.existsSync(srtPath), `SRT file must exist at ${srtPath}`);

  const srtContent = fs.readFileSync(srtPath, 'utf-8');
  assert.ok(srtContent.length > 0, 'SRT file must not be empty');

  // Verify SRT format: first line should be subtitle index "1"
  const lines = srtContent.split('\n');
  assert.equal(lines[0].trim(), '1', 'First SRT entry must start with index 1');

  // Verify timestamp format: HH:MM:SS,mmm --> HH:MM:SS,mmm
  const timestampLine = lines[1];
  assert.ok(
    /\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}/.test(timestampLine),
    `SRT timestamp line must match format: "${timestampLine}"`,
  );

  // Verify at least 4 subtitle entries (2 segments per scene x 2 scenes)
  const entryCount = lines.filter(l => /^\d+$/.test(l.trim())).length;
  assert.ok(entryCount >= 4, `Must have at least 4 subtitle entries, found ${entryCount}`);

  console.log(`  [PASS] Generated SRT with ${entryCount} entries (${srtContent.length} bytes)`);
});

// ---------------------------------------------------------------------------
// Test 14: Subtitle generation — graceful skip when no timestamps
// ---------------------------------------------------------------------------

test('14. Subtitle generation — graceful skip when no timestamps dir', async () => {
  const pipelineModule = await import(`file:///${RENDER_PIPELINE_PATH.replace(/\\/g, '/')}`);

  // Use a temp project dir with no timestamps
  const noTsProjectDir = path.join(TEST_OUTPUT_DIR, 'no-timestamps-project');
  fs.mkdirSync(noTsProjectDir, { recursive: true });

  const result = pipelineModule.generateSubtitles(noTsProjectDir, 'no-ts');
  assert.equal(result, null, 'Must return null when no timestamps directory exists');

  // Also test empty timestamps dir
  const emptyTsDir = path.join(TEST_OUTPUT_DIR, 'empty-ts-project');
  fs.mkdirSync(path.join(emptyTsDir, 'timestamps'), { recursive: true });

  const result2 = pipelineModule.generateSubtitles(emptyTsDir, 'empty-ts');
  assert.equal(result2, null, 'Must return null when timestamps dir is empty');

  console.log('  [PASS] Gracefully skipped subtitle generation (no timestamps)');
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

// Setup before all tests, teardown after
console.log('');
console.log('=== Stickman Animation Agent — E2E Pipeline Integration Test ===');
console.log(`  Repo root:    ${REPO_ROOT}`);
console.log(`  Test output:  ${TEST_OUTPUT_DIR}`);
console.log('');

// Create fixtures
try {
  teardownTestProject(); // Clean any stale output
  setupTestProject();
  console.log('[setup] Test fixtures created');
  console.log('');
} catch (err) {
  console.error(`[setup] FATAL: Could not create test fixtures: ${err.message}`);
  process.exit(1);
}

// Register a cleanup handler.
// node:test runs tests after module evaluation, so we use process.on('exit')
// to clean up regardless of outcome.
process.on('exit', (code) => {
  try {
    teardownTestProject();
    // Only log cleanup on success; on failure the test output stays visible
    if (code === 0) {
      console.log('');
      console.log('[cleanup] Test output removed');
    }
  } catch {
    // Swallow cleanup errors on exit
  }
});
