/**
 * Animation Function Library for the Stickman Animation Agent compositor.
 *
 * Each exported function accepts an event object (from the scene-definition
 * timeline) and template animation defaults, and returns a GSAP code string
 * that will be embedded in a <script> tag inside the composed HTML.
 *
 * Conventions:
 *  - `tl` is the master GSAP timeline variable available in the HTML scope.
 *  - Selectors use the pattern  #char-{id}  for character root groups,
 *    .camera-wrapper  for camera transforms, and  #speech-{index}  for bubbles.
 *  - draw-in animations rely on all <path> elements having a pre-calculated
 *    stroke-dasharray/stroke-dashoffset set by the compositor's init block.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the CSS selector for a timeline event target.
 *
 * Target strings follow the pattern:
 *   "bob"              -> "#char-bob"
 *   "bob.head"         -> "#char-bob [data-part='head']"
 *   "bob.arm_right"    -> "#char-bob [data-part='arm_right']"
 *   "bob.expression"   -> "#char-bob [data-part='expression']"
 *   "camera"           -> ".camera-wrapper"
 *   "speech-0"         -> "#speech-0"
 *   "prop-laptop"      -> "#prop-laptop"
 */
function resolveSelector(target) {
  if (!target) return '';
  if (target === 'camera') return '.camera-wrapper';
  if (target.startsWith('speech-')) return `#${target}`;
  if (target.startsWith('prop-')) return `#${target}`;

  const dotIdx = target.indexOf('.');
  if (dotIdx === -1) return `#char-${target}`;

  const charId = target.substring(0, dotIdx);
  const part = target.substring(dotIdx + 1);
  return `#char-${charId} [data-part='${part}']`;
}

/**
 * Return a safe ease string. Falls back to template default.
 */
function ease(event, templateDefaults, fallback) {
  return event.ease || fallback || templateDefaults.drawInEase || 'power2.inOut';
}

/**
 * Safe duration with fallback.
 */
function dur(event, fallback) {
  return typeof event.duration === 'number' ? event.duration : fallback;
}

/**
 * Position string for the timeline — the time offset in seconds.
 */
function pos(event) {
  return typeof event.time === 'number' ? event.time : '+=0';
}

// ---------------------------------------------------------------------------
// Character Entrance / Exit
// ---------------------------------------------------------------------------

/**
 * enter-draw-in — The signature whiteboard effect.
 * All <path> elements inside the character group animate stroke-dashoffset
 * from their full length to 0, with a stagger.
 */
export function enterDrawIn(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, defaults.drawInDuration || 1.5);
  const e = ease(event, defaults, 'power2.inOut');
  const stagger = event.stagger || defaults.staggerDelay || 0.04;
  // Target only structural body paths + active expression, skip hidden expression groups
  // Use single quotes inside selectors to avoid breaking the outer double-quoted JS string
  const bodyPaths = `${sel} [data-part]:not([data-expression]) path`;
  const activeFacePaths = `${sel} [data-expression][style*='display: block'] path`;
  const bodyCircles = `${sel} [data-part]:not([data-expression]) circle`;
  const activeFaceCircles = `${sel} [data-expression][style*='display: block'] circle`;
  return [
    `tl.set("${sel}", { opacity: 1 }, ${pos(event)});`,
    `tl.to("${bodyPaths}", { strokeDashoffset: 0, duration: ${d}, ease: "${e}", stagger: ${stagger} }, ${pos(event)});`,
    `tl.to("${activeFacePaths}", { strokeDashoffset: 0, duration: ${d * 0.6}, ease: "${e}", stagger: ${stagger} }, ${pos(event)} + ${d * 0.3});`,
    `tl.to("${bodyCircles}", { opacity: 1, duration: ${d * 0.4}, ease: "${e}" }, ${pos(event)} + ${d * 0.6});`,
    `tl.to("${activeFaceCircles}", { opacity: 1, duration: ${d * 0.3}, ease: "${e}" }, ${pos(event)} + ${d * 0.6});`,
  ].join('\n');
}

/**
 * enter-fade — Simple opacity fade-in.
 */
export function enterFade(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 0.6);
  const e = ease(event, defaults, 'power1.out');
  return `tl.fromTo("${sel}", { opacity: 0 }, { opacity: 1, duration: ${d}, ease: "${e}" }, ${pos(event)});`;
}

/**
 * exit-fade — Opacity fade-out.
 */
export function exitFade(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, defaults.fadeOutDuration || 0.4);
  const e = ease(event, defaults, 'power1.in');
  return `tl.to("${sel}", { opacity: 0, duration: ${d}, ease: "${e}" }, ${pos(event)});`;
}

/**
 * exit-draw-out — Reverse draw-in; strokes retract.
 */
export function exitDrawOut(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, defaults.drawInDuration || 1.5);
  const e = ease(event, defaults, 'power2.inOut');
  const stagger = event.stagger || defaults.staggerDelay || 0.08;
  return [
    `tl.to("${sel} circle", { opacity: 0, duration: ${d * 0.3}, ease: "${e}" }, ${pos(event)});`,
    `tl.to("${sel} path", { strokeDashoffset: function(i, el) { return el.getTotalLength(); }, duration: ${d}, ease: "${e}", stagger: ${stagger} }, ${pos(event)});`,
    `tl.set("${sel}", { opacity: 0 }, ${pos(event)} + ${d});`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Body Animations
// ---------------------------------------------------------------------------

/**
 * draw-in — Generic SVG draw-in for any element (props, UI, etc.).
 */
export function drawIn(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, defaults.drawInDuration || 1.5);
  const e = ease(event, defaults, 'power2.inOut');
  const stagger = event.stagger || 0.05;
  return [
    `tl.set("${sel}", { opacity: 1 }, ${pos(event)});`,
    `tl.to("${sel} path", { strokeDashoffset: 0, duration: ${d}, ease: "${e}", stagger: ${stagger} }, ${pos(event)});`
  ].join('\n');
}

/**
 * walk-cycle — Alternating leg positions using yoyo repeat.
 * The actual visual swap happens via toggling visibility of walk-frame groups.
 */
export function walkCycle(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 2.0);
  const stepPeriod = event.stepPeriod || 0.7;
  const repeatCount = Math.max(1, Math.round(d / stepPeriod));
  const distance = event.distance || 200;
  return [
    `// Walk cycle for ${event.target}`,
    `tl.to("${sel}", { x: "+=${distance}", duration: ${d}, ease: "none" }, ${pos(event)});`,
    `tl.to("${sel} [data-part='legs']", { scaleX: -1, duration: ${stepPeriod / 2}, ease: "steps(1)", yoyo: true, repeat: ${repeatCount}, transformOrigin: "center center" }, ${pos(event)});`,
    `tl.to("${sel} [data-part='arm_left']", { rotation: 15, duration: ${stepPeriod / 2}, ease: "sine.inOut", yoyo: true, repeat: ${repeatCount}, transformOrigin: "top center" }, ${pos(event)});`,
    `tl.to("${sel} [data-part='arm_right']", { rotation: -15, duration: ${stepPeriod / 2}, ease: "sine.inOut", yoyo: true, repeat: ${repeatCount}, transformOrigin: "top center" }, ${pos(event)});`
  ].join('\n');
}

/**
 * expression-change — Swap the expression component.
 * Uses GSAP set to instantly hide the current expression and show the new one.
 */
export function expressionChange(event, defaults) {
  const charId = event.target.split('.')[0];
  const toExpression = event.to || 'neutral';
  const d = dur(event, defaults.expressionChangeDuration || 0.2);
  return [
    `// Expression change: ${charId} -> ${toExpression}`,
    `tl.to("#char-${charId} [data-part='expression']", { opacity: 0, duration: ${d / 2} }, ${pos(event)});`,
    `tl.add(function() {`,
    `  document.querySelectorAll("#char-${charId} [data-expression]").forEach(function(el) { el.style.display = "none"; });`,
    `  var target = document.querySelector("#char-${charId} [data-expression='${toExpression}']");`,
    `  if (target) { target.style.display = "block"; }`,
    `}, ${pos(event)} + ${d / 2});`,
    `tl.to("#char-${charId} [data-part='expression']", { opacity: 1, duration: ${d / 2} }, ${pos(event)} + ${d / 2});`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

/**
 * camera-zoom — Scale the camera wrapper around a focal point.
 */
export function cameraZoom(event, defaults) {
  const sel = '.camera-wrapper';
  const scale = event.scale || 1.5;
  const d = dur(event, defaults.cameraMoveDefault || 0.8);
  const e = ease(event, defaults, 'power2.inOut');

  // If a target element is specified, calculate the transform-origin to zoom towards it
  if (event.focalTarget) {
    const focalSel = resolveSelector(event.focalTarget);
    return [
      `// Camera zoom to ${event.focalTarget} at scale ${scale}`,
      `tl.add(function() {`,
      `  var el = document.querySelector("${focalSel}");`,
      `  if (el) {`,
      `    var bbox = el.getBoundingClientRect();`,
      `    var wrapper = document.querySelector("${sel}");`,
      `    wrapper.style.transformOrigin = (bbox.x + bbox.width/2) + "px " + (bbox.y + bbox.height/2) + "px";`,
      `  }`,
      `}, ${pos(event)});`,
      `tl.to("${sel}", { scale: ${scale}, duration: ${d}, ease: "${e}" }, ${pos(event)});`
    ].join('\n');
  }

  return `tl.to("${sel}", { scale: ${scale}, duration: ${d}, ease: "${e}" }, ${pos(event)});`;
}

/**
 * camera-pan — Translate the camera wrapper.
 */
export function cameraPan(event, defaults) {
  const sel = '.camera-wrapper';
  const d = dur(event, defaults.cameraMoveDefault || 0.8);
  const e = ease(event, defaults, 'power2.inOut');
  const x = event.x || 0;
  const y = event.y || 0;
  return `tl.to("${sel}", { x: ${x}, y: ${y}, duration: ${d}, ease: "${e}" }, ${pos(event)});`;
}

/**
 * camera-shake — Rapid oscillation for impact/surprise.
 */
export function cameraShake(event, defaults) {
  const sel = '.camera-wrapper';
  const d = dur(event, 0.5);
  const intensity = event.intensity || 8;
  const shakeCount = event.shakeCount || 5;
  return [
    `// Camera shake — intensity ${intensity}`,
    `tl.to("${sel}", { x: "+=${intensity}", duration: ${d / (shakeCount * 2)}, ease: "none", yoyo: true, repeat: ${shakeCount * 2 - 1} }, ${pos(event)});`,
    `tl.to("${sel}", { y: "+=${intensity * 0.6}", duration: ${d / (shakeCount * 2) * 1.1}, ease: "none", yoyo: true, repeat: ${shakeCount * 2 - 1} }, ${pos(event)});`
  ].join('\n');
}

/**
 * camera-reset — Return to default view (scale 1, translate 0,0).
 */
export function cameraReset(event, defaults) {
  const sel = '.camera-wrapper';
  const d = dur(event, defaults.cameraMoveDefault || 0.8);
  const e = ease(event, defaults, 'power2.inOut');
  return `tl.to("${sel}", { x: 0, y: 0, scale: 1, duration: ${d}, ease: "${e}" }, ${pos(event)});`;
}

// ---------------------------------------------------------------------------
// Speech / Props / UI
// ---------------------------------------------------------------------------

/**
 * speech-bubble-in — Draw in the bubble path, then fade in text.
 */
export function speechBubbleIn(event, defaults) {
  const idx = typeof event.bubbleIndex === 'number' ? event.bubbleIndex : 0;
  const sel = `#speech-${idx}`;
  const d = dur(event, defaults.speechBubbleInDuration || 0.3);
  const holdDuration = event.holdDuration || event.duration || 2.0;
  const e = ease(event, defaults, 'power1.out');
  return [
    `// Speech bubble ${idx} — draw in + text fade`,
    `tl.set("${sel}", { opacity: 1 }, ${pos(event)});`,
    `tl.to("${sel} path", { strokeDashoffset: 0, duration: ${d}, ease: "${e}" }, ${pos(event)});`,
    `tl.to("${sel} .bubble-text", { opacity: 1, duration: ${d * 0.8}, ease: "${e}" }, ${pos(event)} + ${d * 0.5});`,
    `// Hold, then fade out`,
    `tl.to("${sel}", { opacity: 0, duration: 0.2, ease: "power1.in" }, ${pos(event)} + ${d + holdDuration});`
  ].join('\n');
}

/**
 * prop-draw-in — Same mechanic as character draw-in, for props.
 */
export function propDrawIn(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, defaults.drawInDuration || 1.0);
  const e = ease(event, defaults, 'power2.inOut');
  return [
    `tl.set("${sel}", { opacity: 1 }, ${pos(event)});`,
    `tl.to("${sel} path", { strokeDashoffset: 0, duration: ${d}, ease: "${e}", stagger: 0.05 }, ${pos(event)});`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Gesture Presets
// ---------------------------------------------------------------------------

/**
 * point-gesture — Arm extends to point.
 */
export function pointGesture(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 0.4);
  const e = ease(event, defaults, 'power1.out');
  const direction = event.direction || 'up';
  const rotation = direction === 'up' ? -45 : direction === 'down' ? 30 : direction === 'forward' ? -15 : 0;
  return [
    `// Point gesture — ${direction}`,
    `tl.to("${sel}", { rotation: ${rotation}, duration: ${d}, ease: "${e}", transformOrigin: "top center" }, ${pos(event)});`
  ].join('\n');
}

/**
 * wave — Arm waves back and forth.
 */
export function wave(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 1.2);
  const repeatCount = event.repeatCount || 2;
  return [
    `// Wave gesture`,
    `tl.to("${sel}", { rotation: -30, duration: ${d / (repeatCount * 2 + 1)}, ease: "sine.inOut", yoyo: true, repeat: ${repeatCount * 2}, transformOrigin: "top center" }, ${pos(event)});`
  ].join('\n');
}

/**
 * facepalm — Hand moves to face.
 */
export function facepalm(event, defaults) {
  const charId = event.target.split('.')[0] || event.target;
  const d = dur(event, 0.6);
  const e = ease(event, defaults, 'power2.out');
  return [
    `// Facepalm — ${charId}`,
    `tl.to("#char-${charId} [data-part='arm_right']", { rotation: -120, y: -20, duration: ${d * 0.7}, ease: "${e}", transformOrigin: "top center" }, ${pos(event)});`,
    `tl.to("#char-${charId} [data-part='hand_right']", { y: -40, duration: ${d * 0.7}, ease: "${e}" }, ${pos(event)});`,
    `// Hold the facepalm pose`,
    `tl.to("#char-${charId} [data-part='arm_right']", { rotation: 0, y: 0, duration: ${d * 0.5}, ease: "power1.inOut", transformOrigin: "top center" }, ${pos(event)} + ${d + 1.5});`
  ].join('\n');
}

/**
 * celebrate — Both arms up with a bounce.
 */
export function celebrate(event, defaults) {
  const charId = event.target.split('.')[0] || event.target;
  const d = dur(event, 0.8);
  const e = ease(event, defaults, 'back.out(1.7)');
  return [
    `// Celebrate — ${charId}`,
    `tl.to("#char-${charId} [data-part='arm_left']", { rotation: -150, duration: ${d}, ease: "${e}", transformOrigin: "top center" }, ${pos(event)});`,
    `tl.to("#char-${charId} [data-part='arm_right']", { rotation: 150, duration: ${d}, ease: "${e}", transformOrigin: "top center" }, ${pos(event)});`,
    `tl.to("#char-${charId}", { y: "-=12", duration: ${d * 0.4}, ease: "power1.out", yoyo: true, repeat: 1 }, ${pos(event)});`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Comedic Timing
// ---------------------------------------------------------------------------

/**
 * squash-stretch — Exaggerated impact animation.
 */
export function squashStretch(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 0.3);
  return [
    `// Squash-stretch comedic beat`,
    `tl.to("${sel}", { scaleX: 1.15, scaleY: 0.85, duration: ${d * 0.3}, ease: "power2.in", transformOrigin: "center bottom" }, ${pos(event)});`,
    `tl.to("${sel}", { scaleX: 0.92, scaleY: 1.1, duration: ${d * 0.3}, ease: "power2.out", transformOrigin: "center bottom" }, ${pos(event)} + ${d * 0.3});`,
    `tl.to("${sel}", { scaleX: 1, scaleY: 1, duration: ${d * 0.4}, ease: "bounce.out", transformOrigin: "center bottom" }, ${pos(event)} + ${d * 0.6});`
  ].join('\n');
}

/**
 * head-shake — Quick disagreement motion.
 */
export function headShake(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 0.6);
  return [
    `// Head shake`,
    `tl.to("${sel}", { rotation: 8, duration: ${d / 5}, ease: "sine.inOut", yoyo: true, repeat: 4, transformOrigin: "center bottom" }, ${pos(event)});`
  ].join('\n');
}

/**
 * text-reveal — Per-word opacity stagger synced to word timestamps.
 */
export function textReveal(event, defaults) {
  const sel = resolveSelector(event.target);
  const d = dur(event, 2.0);
  const wordCount = event.wordCount || 10;
  const stagger = d / Math.max(1, wordCount);
  return [
    `// Text reveal — word by word`,
    `tl.to("${sel} .word", { opacity: 1, duration: 0.15, stagger: ${stagger}, ease: "none" }, ${pos(event)});`
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Action dispatcher
// ---------------------------------------------------------------------------

/**
 * Map of action name -> animation function.
 */
const ACTION_MAP = {
  'enter-draw-in': enterDrawIn,
  'enter-fade': enterFade,
  'exit-fade': exitFade,
  'exit-draw-out': exitDrawOut,
  'draw-in': drawIn,
  'walk-cycle': walkCycle,
  'expression-change': expressionChange,
  'camera-zoom': cameraZoom,
  'camera-pan': cameraPan,
  'camera-shake': cameraShake,
  'camera-reset': cameraReset,
  'speech-bubble-in': speechBubbleIn,
  'prop-draw-in': propDrawIn,
  'squash-stretch': squashStretch,
  'point-gesture': pointGesture,
  'wave': wave,
  'facepalm': facepalm,
  'celebrate': celebrate,
  'head-shake': headShake,
  'text-reveal': textReveal,
};

/**
 * Generate a GSAP code snippet for a single timeline event.
 *
 * @param {object} event   - Timeline event from scene definition
 * @param {object} defaults - Animation defaults from the merged template config
 * @returns {string}        GSAP code string to embed, or a comment if the action is unknown
 */
export function generateAnimation(event, defaults) {
  const fn = ACTION_MAP[event.action];
  if (!fn) {
    return `// WARNING: Unknown animation action "${event.action}" at time ${event.time}`;
  }
  return fn(event, defaults);
}

/**
 * List all supported action names.
 */
export function supportedActions() {
  return Object.keys(ACTION_MAP);
}

export default { generateAnimation, supportedActions, resolveSelector };
