/**
 * Style CRUD operations (bun:sqlite)
 */
import { getDb } from '../db/schema';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const UPLOADS_DIR = process.env.GLINT_UPLOADS_DIR || join(process.cwd(), 'data', 'uploads');

export interface PublishInput {
  name: string;
  slug: string;
  version: string;
  description: string;
  readme?: string;
  emotions: Map<string, Buffer>;
  previewGif?: Buffer;
  format?: 'svg' | 'png';
  animated?: boolean;
}

export function publishStyle(userId: string, input: PublishInput): { id: string; path: string } {
  const db = getDb();
  const id = nanoid();
  
  const existing = db.query(
    'SELECT id FROM styles WHERE user_id = ? AND slug = ? AND version = ? AND yanked_at IS NULL'
  ).get(userId, input.slug, input.version);
  
  if (existing) {
    throw new Error(`Version ${input.version} already exists for ${input.slug}`);
  }

  const user = db.query('SELECT username FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw new Error('User not found');

  const stylePath = join(UPLOADS_DIR, user.username, input.slug, input.version);
  mkdirSync(stylePath, { recursive: true });

  const format = input.format || 'png';
  const extension = format === 'svg' ? '.svg' : '.png';
  const emotionRows: { emotion: string; filePath: string; fileHash: string; fileSize: number }[] = [];
  
  for (const [emotion, buffer] of input.emotions) {
    const filePath = join(stylePath, `${emotion}${extension}`);
    writeFileSync(filePath, buffer);
    const hash = createHash('sha256').update(buffer).digest('hex');
    emotionRows.push({ emotion, filePath, fileHash: hash, fileSize: buffer.length });
  }

  let previewPath: string | null = null;
  if (input.previewGif) {
    previewPath = join(stylePath, 'preview.gif');
    writeFileSync(previewPath, input.previewGif);
  }

  if (input.readme) {
    writeFileSync(join(stylePath, 'README.md'), input.readme);
  }

  // Transaction via bun:sqlite
  const insertStyle = db.query(`
    INSERT INTO styles (id, user_id, name, slug, description, version, readme, preview_path, format, animated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmotion = db.query(`
    INSERT INTO style_emotions (id, style_id, emotion, file_path, file_hash, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertStyle.run(id, userId, input.name, input.slug, input.description, input.version, input.readme || null, previewPath, format, input.animated ? 1 : 0);
    for (const row of emotionRows) {
      insertEmotion.run(nanoid(), id, row.emotion, row.filePath, row.fileHash, row.fileSize);
    }
  });

  tx();
  return { id, path: stylePath };
}

export function listStyles(opts: { page?: number; limit?: number; search?: string; author?: string } = {}) {
  const db = getDb();
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 20, 100);
  const offset = (page - 1) * limit;

  let where = 'WHERE s.yanked_at IS NULL';
  const params: any[] = [];

  if (opts.search) {
    where += ' AND (s.name LIKE ? OR s.description LIKE ? OR s.slug LIKE ?)';
    const q = `%${opts.search}%`;
    params.push(q, q, q);
  }

  if (opts.author) {
    where += ' AND u.username = ?';
    params.push(opts.author);
  }

  const rows = db.query(`
    SELECT s.*, u.username as author, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM style_emotions WHERE style_id = s.id) as emotion_count
    FROM styles s
    JOIN users u ON s.user_id = u.id
    ${where}
    AND s.version = (
      SELECT MAX(s2.version) FROM styles s2 
      WHERE s2.user_id = s.user_id AND s2.slug = s.slug AND s2.yanked_at IS NULL
    )
    ORDER BY s.download_count DESC, s.published_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.query(`
    SELECT COUNT(DISTINCT s.user_id || '/' || s.slug) as count
    FROM styles s
    JOIN users u ON s.user_id = u.id
    ${where}
  `).get(...params) as any;

  return { styles: rows, total: total?.count || 0, page, limit };
}

export function getStyle(author: string, slug: string, version?: string) {
  const db = getDb();
  
  let style: any;
  if (version) {
    style = db.query(`
      SELECT s.*, u.username as author, u.avatar_url as author_avatar
      FROM styles s JOIN users u ON s.user_id = u.id
      WHERE u.username = ? AND s.slug = ? AND s.version = ? AND s.yanked_at IS NULL
    `).get(author, slug, version);
  } else {
    style = db.query(`
      SELECT s.*, u.username as author, u.avatar_url as author_avatar
      FROM styles s JOIN users u ON s.user_id = u.id
      WHERE u.username = ? AND s.slug = ? AND s.yanked_at IS NULL
      ORDER BY s.published_at DESC LIMIT 1
    `).get(author, slug);
  }

  if (!style) return null;

  const emotions = db.query('SELECT emotion, file_hash, file_size FROM style_emotions WHERE style_id = ?').all(style.id);
  
  return { ...style, emotions };
}

export function getStyleVersions(author: string, slug: string) {
  const db = getDb();
  return db.query(`
    SELECT s.version, s.published_at, s.yanked_at, s.download_count
    FROM styles s JOIN users u ON s.user_id = u.id
    WHERE u.username = ? AND s.slug = ?
    ORDER BY s.published_at DESC
  `).all(author, slug);
}

export function incrementDownloads(styleId: string) {
  const db = getDb();
  db.query('UPDATE styles SET download_count = download_count + 1 WHERE id = ?').run(styleId);
}

export function yankStyle(styleId: string, userId: string): boolean {
  const db = getDb();
  const result = db.query(
    "UPDATE styles SET yanked_at = datetime('now') WHERE id = ? AND user_id = ?"
  ).run(styleId, userId);
  return (result as any).changes > 0;
}

export function reportStyle(styleId: string, reporterId: string | null, reason: string, details?: string) {
  const db = getDb();
  db.query(
    'INSERT INTO style_reports (id, style_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)'
  ).run(nanoid(), styleId, reporterId, reason, details || null);
}
