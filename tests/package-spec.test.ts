import { describe, it, expect } from 'bun:test';
import { validateManifest, NAME_REGEX, SEMVER_REGEX, REQUIRED_EMOTIONS } from '../src/lib/package-spec';

describe('Package Spec Validation', () => {
  const validManifest = {
    specVersion: '1.0',
    name: 'cool-eyes',
    version: '1.0.0',
    description: 'A cool eye style',
    emotions: [...REQUIRED_EMOTIONS],
    files: Object.fromEntries(REQUIRED_EMOTIONS.map(e => [`${e}.png`, 'sha256:abc123'])),
  };

  it('accepts a valid manifest', () => {
    expect(validateManifest(validManifest)).toEqual([]);
  });

  it('rejects wrong specVersion', () => {
    const errors = validateManifest({ ...validManifest, specVersion: '2.0' });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('specVersion');
  });

  it('rejects invalid names', () => {
    const badNames = ['', 'a', '-bad', 'bad-', 'UPPER', 'has spaces', 'a'.repeat(50)];
    for (const name of badNames) {
      const errors = validateManifest({ ...validManifest, name });
      expect(errors.some(e => e.field === 'name')).toBe(true);
    }
  });

  it('accepts valid names', () => {
    const goodNames = ['ab', 'cool-eyes', 'retro-8bit', 'a1b2c3'];
    for (const name of goodNames) {
      const errors = validateManifest({ ...validManifest, name });
      expect(errors.some(e => e.field === 'name')).toBe(false);
    }
  });

  it('rejects invalid versions', () => {
    const bad = ['', '1', '1.0', 'v1.0.0', 'abc'];
    for (const version of bad) {
      const errors = validateManifest({ ...validManifest, version });
      expect(errors.some(e => e.field === 'version')).toBe(true);
    }
  });

  it('accepts valid semver', () => {
    const good = ['0.0.1', '1.0.0', '10.20.30', '1.0.0-beta.1'];
    for (const version of good) {
      const errors = validateManifest({ ...validManifest, version });
      expect(errors.some(e => e.field === 'version')).toBe(false);
    }
  });

  it('requires all 10 emotions', () => {
    const errors = validateManifest({ ...validManifest, emotions: ['happy', 'sad'] });
    expect(errors.some(e => e.field === 'emotions')).toBe(true);
  });

  it('allows extra emotions beyond required 10', () => {
    const errors = validateManifest({
      ...validManifest,
      emotions: [...REQUIRED_EMOTIONS, 'smirk', 'love'],
    });
    expect(errors).toEqual([]);
  });

  it('rejects description over 200 chars', () => {
    const errors = validateManifest({ ...validManifest, description: 'x'.repeat(201) });
    expect(errors.some(e => e.field === 'description')).toBe(true);
  });

  it('rejects too many tags', () => {
    const errors = validateManifest({ ...validManifest, tags: Array(11).fill('tag') });
    expect(errors.some(e => e.field === 'tags')).toBe(true);
  });
});

describe('Regex patterns', () => {
  it('NAME_REGEX matches valid names', () => {
    expect(NAME_REGEX.test('cool-eyes')).toBe(true);
    expect(NAME_REGEX.test('ab')).toBe(true);
    expect(NAME_REGEX.test('my-style-v2')).toBe(true);
  });

  it('NAME_REGEX rejects invalid names', () => {
    expect(NAME_REGEX.test('a')).toBe(false);
    expect(NAME_REGEX.test('-bad')).toBe(false);
    expect(NAME_REGEX.test('BAD')).toBe(false);
  });

  it('SEMVER_REGEX matches valid versions', () => {
    expect(SEMVER_REGEX.test('1.0.0')).toBe(true);
    expect(SEMVER_REGEX.test('0.0.1')).toBe(true);
    expect(SEMVER_REGEX.test('1.2.3-alpha.1')).toBe(true);
  });
});
