/**
 * Glint Style Package Specification
 * 
 * A style package is a directory or tarball containing:
 *   - glint-style.json (manifest)
 *   - 10+ SVG or PNG files (one per emotion)
 *   - Optional: preview.gif, README.md
 * 
 * SVG is now the primary format (scales infinitely across devices).
 * PNG (64x32) is supported for legacy styles.
 */

export const REQUIRED_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised',
  'worried', 'sleepy', 'excited', 'confused', 'focused',
] as const;

export type Emotion = typeof REQUIRED_EMOTIONS[number];
export type StyleFormat = 'svg' | 'png';

export interface StyleManifest {
  /** Package format version */
  specVersion: '1.0';
  /** Style name (alphanumeric + hyphens, 2-40 chars) */
  name: string;
  /** Semver version */
  version: string;
  /** Short description (max 200 chars) */
  description: string;
  /** Author's username (set by server, ignored in upload) */
  author?: string;
  /** Emotions included in this style */
  emotions: string[];
  /** Optional extra emotions beyond the required 10 */
  extraEmotions?: string[];
  /** SHA-256 hashes of each file */
  files: Record<string, string>;
  /** Minimum glint CLI version required */
  minGlintVersion?: string;
  /** License (SPDX identifier) */
  license?: string;
  /** Tags for discoverability */
  tags?: string[];
  /** Format: 'svg' (default, recommended) or 'png' (legacy) */
  format?: StyleFormat;
  /** Whether the style includes animations (SMIL/CSS in SVGs) */
  animated?: boolean;
}

export const NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;
export const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

export const MAX_FILE_SIZE_PNG = 500 * 1024; // 500KB per emotion PNG
export const MAX_FILE_SIZE_SVG = 100 * 1024; // 100KB per emotion SVG (typically much smaller)
export const MAX_PACKAGE_SIZE = 10 * 1024 * 1024; // 10MB total
export const EXPECTED_WIDTH = 64;
export const EXPECTED_HEIGHT = 32;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateManifest(manifest: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (manifest.specVersion !== '1.0') {
    errors.push({ field: 'specVersion', message: 'Must be "1.0"' });
  }

  if (!manifest.name || !NAME_REGEX.test(manifest.name)) {
    errors.push({ field: 'name', message: 'Must be 2-40 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphen' });
  }

  if (!manifest.version || !SEMVER_REGEX.test(manifest.version)) {
    errors.push({ field: 'version', message: 'Must be valid semver (e.g., 1.0.0)' });
  }

  if (!manifest.description || manifest.description.length > 200) {
    errors.push({ field: 'description', message: 'Required, max 200 chars' });
  }

  if (!Array.isArray(manifest.emotions)) {
    errors.push({ field: 'emotions', message: 'Must be an array' });
  } else {
    const missing = REQUIRED_EMOTIONS.filter(e => !manifest.emotions.includes(e));
    if (missing.length > 0) {
      errors.push({ field: 'emotions', message: `Missing required emotions: ${missing.join(', ')}` });
    }
  }

  if (!manifest.files || typeof manifest.files !== 'object') {
    errors.push({ field: 'files', message: 'Must be an object mapping filenames to SHA-256 hashes' });
  }

  // Validate format field
  if (manifest.format && !['svg', 'png'].includes(manifest.format)) {
    errors.push({ field: 'format', message: 'Must be "svg" or "png"' });
  }

  // Validate animated field (boolean)
  if (manifest.animated !== undefined && typeof manifest.animated !== 'boolean') {
    errors.push({ field: 'animated', message: 'Must be boolean' });
  }

  if (manifest.tags && (!Array.isArray(manifest.tags) || manifest.tags.length > 10)) {
    errors.push({ field: 'tags', message: 'Must be array of max 10 tags' });
  }

  if (manifest.license && typeof manifest.license !== 'string') {
    errors.push({ field: 'license', message: 'Must be SPDX identifier string' });
  }

  return errors;
}
