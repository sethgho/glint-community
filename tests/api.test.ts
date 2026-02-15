import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';

function resetTestDir() {
  const dir = join(import.meta.dir, '.test-data-api-' + Math.random().toString(36).slice(2));
  process.env.GLINT_DB_PATH = join(dir, 'test.db');
  process.env.GLINT_UPLOADS_DIR = join(dir, 'uploads');
  return dir;
}
let TEST_DIR = resetTestDir();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import apiAuth from '../src/routes/api-auth';
import apiStyles from '../src/routes/api-styles';
import web from '../src/routes/web';
import { closeDb, getDb } from '../src/db/schema';
import { upsertUser, createApiToken } from '../src/lib/auth';
import { REQUIRED_EMOTIONS } from '../src/lib/package-spec';

function createApp() {
  const app = new Hono();
  app.use('/api/*', cors());
  app.route('/api/auth', apiAuth);
  app.route('/api/styles', apiStyles);
  app.route('/', web);
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  return app;
}

let app: Hono;

beforeEach(() => {
  closeDb();
  TEST_DIR = resetTestDir();
  mkdirSync(TEST_DIR, { recursive: true });
  app = createApp();
});

afterEach(() => {
  closeDb();
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('API Health', () => {
  it('returns ok', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

describe('API Auth', () => {
  it('returns 401 without token', async () => {
    const res = await app.request('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user info with valid token', async () => {
    const user = upsertUser(123, 'testdev', 'Test Dev', null);
    const { token } = createApiToken(user.id, 'test');

    const res = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('testdev');
  });

  it('creates and lists tokens', async () => {
    const user = upsertUser(123, 'testdev', null, null);
    const { token } = createApiToken(user.id, 'bootstrap');

    // Create new token
    const createRes = await app.request('/api/auth/tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ci-token' }),
    });
    expect(createRes.status).toBe(200);
    const created = await createRes.json() as any;
    expect(created.token).toBeTruthy();

    // List tokens
    const listRes = await app.request('/api/auth/tokens', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listed = await listRes.json() as any;
    expect(listed.tokens.length).toBeGreaterThanOrEqual(2);
  });
});

describe('API Styles', () => {
  function makeFormData() {
    const form = new FormData();
    const manifest = {
      specVersion: '1.0',
      name: 'test-style',
      version: '1.0.0',
      description: 'A test style for CI',
      emotions: [...REQUIRED_EMOTIONS],
      files: {},
    };
    form.append('manifest', JSON.stringify(manifest));
    
    for (const emotion of REQUIRED_EMOTIONS) {
      const blob = new Blob([Buffer.alloc(100)], { type: 'image/png' });
      form.append(emotion, blob, `${emotion}.png`);
    }
    return form;
  }

  it('lists styles (empty)', async () => {
    const res = await app.request('/api/styles');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.styles).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('publishes a style', async () => {
    const user = upsertUser(123, 'publisher', null, null);
    const { token } = createApiToken(user.id, 'pub');

    const res = await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: makeFormData(),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.install).toContain('@publisher/test-style');
  });

  it('retrieves a published style', async () => {
    const user = upsertUser(123, 'publisher', null, null);
    const { token } = createApiToken(user.id, 'pub');

    await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: makeFormData(),
    });

    const res = await app.request('/api/styles/publisher/test-style');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.slug).toBe('test-style');
    expect(body.emotions).toHaveLength(10);
  });

  it('downloads a style', async () => {
    const user = upsertUser(123, 'publisher', null, null);
    const { token } = createApiToken(user.id, 'pub');

    await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: makeFormData(),
    });

    const res = await app.request('/api/styles/publisher/test-style/download');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.emotions).toHaveLength(10);
    expect(body.install).toContain('glint style install');
  });

  it('rejects publish without auth', async () => {
    const res = await app.request('/api/styles', {
      method: 'POST',
      body: makeFormData(),
    });
    expect(res.status).toBe(401);
  });

  it('rejects invalid manifest', async () => {
    const user = upsertUser(123, 'publisher', null, null);
    const { token } = createApiToken(user.id, 'pub');

    const form = new FormData();
    form.append('manifest', JSON.stringify({ specVersion: '999' }));

    const res = await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    expect(res.status).toBe(400);
  });

  it('searches styles', async () => {
    const user = upsertUser(123, 'publisher', null, null);
    const { token } = createApiToken(user.id, 'pub');

    // Publish two styles
    const form1 = makeFormData();
    await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form1,
    });

    const res = await app.request('/api/styles?search=test');
    const body = await res.json() as any;
    expect(body.styles.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Web Pages', () => {
  it('serves home page', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Glint Community');
    expect(html).toContain('Style Gallery');
  });

  it('serves contribute page', async () => {
    const res = await app.request('/contribute');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Create & Share');
    expect(html).toContain('glint-style.json');
  });

  it('serves style detail page', async () => {
    const user = upsertUser(123, 'webtest', null, null);
    const { token } = createApiToken(user.id, 'web');

    // Publish a style first
    const form = new FormData();
    form.append('manifest', JSON.stringify({
      specVersion: '1.0',
      name: 'web-style',
      version: '1.0.0',
      description: 'For web test',
      emotions: [...REQUIRED_EMOTIONS],
      files: {},
    }));
    for (const emotion of REQUIRED_EMOTIONS) {
      form.append(emotion, new Blob([Buffer.alloc(100)], { type: 'image/png' }));
    }

    const pubRes = await app.request('/api/styles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    expect(pubRes.status).toBe(201);

    const res = await app.request('/styles/webtest/web-style');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('@webtest/web-style');
    expect(html).toContain('glint style install');
  });

  it('returns 404 for missing style', async () => {
    const res = await app.request('/styles/nobody/nothing');
    expect(res.status).toBe(404);
  });
});
