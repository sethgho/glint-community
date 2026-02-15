import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';

function resetTestDir() {
  const dir = join(import.meta.dir, '.test-data-db-' + Math.random().toString(36).slice(2));
  process.env.GLINT_DB_PATH = join(dir, 'test.db');
  process.env.GLINT_UPLOADS_DIR = join(dir, 'uploads');
  return dir;
}
let TEST_DIR = resetTestDir();

// Import after setting env
import { getDb, closeDb } from '../src/db/schema';
import { upsertUser, createApiToken, verifyToken, hashToken, listTokens, revokeToken } from '../src/lib/auth';
import { publishStyle, listStyles, getStyle, yankStyle } from '../src/lib/styles';
import { REQUIRED_EMOTIONS } from '../src/lib/package-spec';

beforeEach(() => {
  closeDb();
  TEST_DIR = resetTestDir();
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('Database', () => {
  it('creates tables on init', () => {
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const names = tables.map(t => t.name);
    expect(names).toContain('users');
    expect(names).toContain('styles');
    expect(names).toContain('api_tokens');
    expect(names).toContain('style_emotions');
    expect(names).toContain('style_reports');
  });
});

describe('Auth', () => {
  it('creates and retrieves user', () => {
    const user = upsertUser(12345, 'testuser', 'Test User', 'https://example.com/avatar.png');
    expect(user.username).toBe('testuser');
    expect(user.github_id).toBe(12345);

    // Upsert same user updates
    const updated = upsertUser(12345, 'testuser-new', 'Updated Name', null);
    expect(updated.id).toBe(user.id);
  });

  it('creates and verifies API tokens', () => {
    const user = upsertUser(12345, 'testuser', null, null);
    const { token, id } = createApiToken(user.id, 'test-token');
    
    expect(token.startsWith('glint_')).toBe(true);
    expect(id).toBeTruthy();

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified.username).toBe('testuser');
  });

  it('rejects invalid tokens', () => {
    const result = verifyToken('glint_invalid_token_here');
    expect(result).toBeNull();
  });

  it('lists and revokes tokens', () => {
    const user = upsertUser(12345, 'testuser', null, null);
    const { token: t1, id: id1 } = createApiToken(user.id, 'token-1');
    const { token: t2, id: id2 } = createApiToken(user.id, 'token-2');

    const tokens = listTokens(user.id);
    expect(tokens).toHaveLength(2);

    const revoked = revokeToken(id1, user.id);
    expect(revoked).toBe(true);
    expect(verifyToken(t1)).toBeNull();
    expect(verifyToken(t2)).not.toBeNull();
  });
});

describe('Styles', () => {
  function makePng(): Buffer {
    // Minimal valid-ish buffer (tests don't validate image content)
    return Buffer.alloc(100, 0);
  }

  it('publishes and retrieves a style', () => {
    const user = upsertUser(99, 'artist', 'Art Person', null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) {
      emotions.set(e, makePng());
    }

    const { id } = publishStyle(user.id, {
      name: 'pixel-vibes',
      slug: 'pixel-vibes',
      version: '1.0.0',
      description: 'Pixel art vibes',
      emotions,
    });

    expect(id).toBeTruthy();

    const style = getStyle('artist', 'pixel-vibes');
    expect(style).not.toBeNull();
    expect(style!.version).toBe('1.0.0');
    expect(style!.emotions).toHaveLength(10);
  });

  it('prevents duplicate versions', () => {
    const user = upsertUser(99, 'artist', null, null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) emotions.set(e, makePng());

    publishStyle(user.id, { name: 'dupe', slug: 'dupe', version: '1.0.0', description: 'Test', emotions });
    
    expect(() => {
      publishStyle(user.id, { name: 'dupe', slug: 'dupe', version: '1.0.0', description: 'Test 2', emotions });
    }).toThrow('already exists');
  });

  it('lists styles with pagination', () => {
    const user = upsertUser(99, 'artist', null, null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) emotions.set(e, makePng());

    for (let i = 0; i < 5; i++) {
      publishStyle(user.id, {
        name: `style-${i}`,
        slug: `style-${i}`,
        version: '1.0.0',
        description: `Style number ${i}`,
        emotions,
      });
    }

    const result = listStyles({ page: 1, limit: 3 });
    expect(result.styles).toHaveLength(3);
    expect(result.total).toBe(5);
  });

  it('searches styles', () => {
    const user = upsertUser(99, 'artist', null, null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) emotions.set(e, makePng());

    publishStyle(user.id, { name: 'neon-cyber', slug: 'neon-cyber', version: '1.0.0', description: 'Neon cyberpunk', emotions });
    publishStyle(user.id, { name: 'retro-pixel', slug: 'retro-pixel', version: '1.0.0', description: 'Retro pixel art', emotions });

    const neon = listStyles({ search: 'neon' });
    expect(neon.styles).toHaveLength(1);

    const pixel = listStyles({ search: 'pixel' });
    expect(pixel.styles).toHaveLength(1);
  });

  it('yanks a style', () => {
    const user = upsertUser(99, 'artist', null, null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) emotions.set(e, makePng());

    const { id } = publishStyle(user.id, { name: 'bye', slug: 'bye', version: '1.0.0', description: 'Goodbye', emotions });
    
    const yanked = yankStyle(id, user.id);
    expect(yanked).toBe(true);

    const style = getStyle('artist', 'bye');
    expect(style).toBeNull();
  });

  it('filters by author', () => {
    const user1 = upsertUser(1, 'alice', null, null);
    const user2 = upsertUser(2, 'bob', null, null);
    const emotions = new Map<string, Buffer>();
    for (const e of REQUIRED_EMOTIONS) emotions.set(e, makePng());

    publishStyle(user1.id, { name: 'alice-style', slug: 'alice-style', version: '1.0.0', description: 'By alice', emotions });
    publishStyle(user2.id, { name: 'bob-style', slug: 'bob-style', version: '1.0.0', description: 'By bob', emotions });

    const aliceOnly = listStyles({ author: 'alice' });
    expect(aliceOnly.styles).toHaveLength(1);
    expect((aliceOnly.styles[0] as any).author).toBe('alice');
  });
});
