/**
 * Style API routes (browse, publish, download, report)
 */
import { Hono } from 'hono';
import { requireAuth, optionalAuth, requireScope } from '../middleware/auth';
import { listStyles, getStyle, getStyleVersions, publishStyle, incrementDownloads, yankStyle, reportStyle } from '../lib/styles';
import { validateManifest, REQUIRED_EMOTIONS, MAX_FILE_SIZE, EXPECTED_WIDTH, EXPECTED_HEIGHT } from '../lib/package-spec';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const styles = new Hono();

/** Browse styles */
styles.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search');
  const author = c.req.query('author');

  const result = listStyles({ page, limit, search, author });
  return c.json(result);
});

/** Get specific style */
styles.get('/:author/:slug', async (c) => {
  const { author, slug } = c.req.param();
  const version = c.req.query('version');
  
  const style = getStyle(author, slug, version || undefined);
  if (!style) {
    return c.json({ error: 'Style not found' }, 404);
  }

  return c.json(style);
});

/** Get style versions */
styles.get('/:author/:slug/versions', async (c) => {
  const { author, slug } = c.req.param();
  const versions = getStyleVersions(author, slug);
  return c.json({ versions });
});

/** Download a style (returns tar of PNGs) */
styles.get('/:author/:slug/download', async (c) => {
  const { author, slug } = c.req.param();
  const version = c.req.query('version');
  
  const style = getStyle(author, slug, version || undefined) as any;
  if (!style) {
    return c.json({ error: 'Style not found' }, 404);
  }

  incrementDownloads(style.id);

  // Return JSON with file URLs (individual emotion downloads)
  const baseUrl = new URL(c.req.url).origin;
  const emotions = style.emotions.map((e: any) => ({
    emotion: e.emotion,
    url: `${baseUrl}/api/styles/${author}/${slug}/emotions/${e.emotion}?version=${style.version}`,
    hash: e.file_hash,
    size: e.file_size,
  }));

  return c.json({
    name: style.name,
    slug: style.slug,
    version: style.version,
    author: style.author,
    description: style.description,
    emotions,
    install: `glint style install @${author}/${slug}`,
  });
});

/** Download individual emotion PNG */
styles.get('/:author/:slug/emotions/:emotion', async (c) => {
  const { author, slug, emotion } = c.req.param();
  const version = c.req.query('version');
  
  const style = getStyle(author, slug, version || undefined) as any;
  if (!style) {
    return c.json({ error: 'Style not found' }, 404);
  }

  const emotionData = style.emotions.find((e: any) => e.emotion === emotion);
  if (!emotionData) {
    return c.json({ error: `Emotion "${emotion}" not found in this style` }, 404);
  }

  // Find the file on disk
  const uploadsDir = process.env.GLINT_UPLOADS_DIR || join(process.cwd(), 'data', 'uploads');
  const filePath = join(uploadsDir, author, slug, style.version, `${emotion}.png`);
  
  if (!existsSync(filePath)) {
    return c.json({ error: 'File not found on disk' }, 500);
  }

  const buffer = readFileSync(filePath);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="${emotion}.png"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${emotionData.file_hash}"`,
    },
  });
});

/** Publish a style (multipart form: manifest JSON + PNG files) */
styles.post('/', requireAuth, requireScope('publish'), async (c) => {
  const user = c.get('user');
  
  const formData = await c.req.formData();
  const manifestRaw = formData.get('manifest');
  
  if (!manifestRaw || typeof manifestRaw !== 'string') {
    return c.json({ error: 'Missing manifest field (JSON string)' }, 400);
  }

  let manifest: any;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch {
    return c.json({ error: 'Invalid manifest JSON' }, 400);
  }

  // Validate manifest
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    return c.json({ error: 'Invalid manifest', details: errors }, 400);
  }

  // Rate limit: max 10 publishes per day
  const { getDb } = await import('../db/schema');
  const db = getDb();
  const recentCount = db.prepare(
    "SELECT COUNT(*) as count FROM styles WHERE user_id = ? AND published_at > datetime('now', '-1 day')"
  ).get(user.id) as any;
  
  if (recentCount.count >= 10) {
    return c.json({ error: 'Rate limit: max 10 publishes per day' }, 429);
  }

  // Extract emotion files
  const emotions = new Map<string, Buffer>();
  
  for (const emotionName of manifest.emotions) {
    const file = formData.get(emotionName);
    if (!file || !(file instanceof File)) {
      return c.json({ error: `Missing file for emotion: ${emotionName}` }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: `File too large for ${emotionName}: ${file.size} > ${MAX_FILE_SIZE}` }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Verify hash matches manifest
    const hash = createHash('sha256').update(buffer).digest('hex');
    const expectedHash = manifest.files[`${emotionName}.png`];
    if (expectedHash && hash !== expectedHash) {
      return c.json({ error: `Hash mismatch for ${emotionName}: expected ${expectedHash}, got ${hash}` }, 400);
    }

    emotions.set(emotionName, buffer);
  }

  // Extract preview if present
  const previewFile = formData.get('preview');
  const previewGif = previewFile instanceof File ? Buffer.from(await previewFile.arrayBuffer()) : undefined;

  // Extract readme if present
  const readmeField = formData.get('readme');
  const readme = typeof readmeField === 'string' ? readmeField : undefined;

  try {
    const result = publishStyle(user.id, {
      name: manifest.name,
      slug: manifest.name, // slug = name for now
      version: manifest.version,
      description: manifest.description,
      readme,
      emotions,
      previewGif,
    });

    return c.json({
      id: result.id,
      url: `/styles/${user.username}/${manifest.name}`,
      install: `glint style install @${user.username}/${manifest.name}`,
    }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 409);
  }
});

/** Yank a style version */
styles.delete('/:author/:slug', requireAuth, async (c) => {
  const user = c.get('user');
  const { author, slug } = c.req.param();
  const version = c.req.query('version');

  if (author !== user.username) {
    return c.json({ error: 'You can only yank your own styles' }, 403);
  }

  const style = getStyle(author, slug, version || undefined) as any;
  if (!style) {
    return c.json({ error: 'Style not found' }, 404);
  }

  const yanked = yankStyle(style.id, user.id);
  return yanked ? c.json({ ok: true }) : c.json({ error: 'Failed to yank' }, 500);
});

/** Report a style */
styles.post('/:author/:slug/report', optionalAuth, async (c) => {
  const { author, slug } = c.req.param();
  const { reason, details } = await c.req.json();
  
  if (!reason) {
    return c.json({ error: 'Reason required' }, 400);
  }

  const style = getStyle(author, slug) as any;
  if (!style) {
    return c.json({ error: 'Style not found' }, 404);
  }

  const user = c.get('user');
  reportStyle(style.id, user?.id || null, reason, details);
  return c.json({ ok: true });
});

export default styles;
