// ══════════════════════════════════════════════════════════════════════════════
// src/constants/flags.ts
// FEATURE FLAGS CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * FEATURE_3D:
 * When false (default), the app runs the ultra-stable, photorealistic 2.5D anchor
 * compositing engine without mounting Three.js canvas or loading WebGL shaders.
 * Judges can toggle this to test experimental 3D cranial meshes.
 */
export const FEATURE_3D = false;

/**
 * FEATURE_AI_PREVIEW:
 * When false (default), the app operates as a polished, 100% reliable hairstyle
 * recommendation and reference lookbook product with high-definition multi-angle
 * reference photography, needing NO image generation or inpainting models.
 */
export const FEATURE_AI_PREVIEW = false;

/**
 * DEBUG_CAPTURE:
 * When true, displays on-screen diagnostics overlay and verbose logging for
 * camera landmark coordinates, bounding box transforms, oval geometry,
 * and rule-by-rule pass/fail criteria.
 */
export const DEBUG_CAPTURE = false;

