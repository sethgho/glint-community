/**
 * Database schema and migrations for Glint Community
 * Uses bun:sqlite (native Bun SQLite)
 */
import { Database } from 'bun:sqlite';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let _db: Database | null = null;

function getDbPath() {
  return process.env.GLINT_DB_PATH || join(process.cwd(), 'data', 'glint-community.db');
}

export function getDb(): Database {
  if (_db) return _db;
  
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  
  _db = new Database(dbPath);
  _db.run('PRAGMA journal_mode = WAL');
  _db.run('PRAGMA foreign_keys = ON');
  
  migrate(_db);
  return _db;
}

function migrate(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      github_id INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      scopes TEXT NOT NULL DEFAULT 'publish,read',
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS styles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL,
      readme TEXT,
      preview_path TEXT,
      download_count INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      yanked_at TEXT,
      animated INTEGER DEFAULT 0,
      UNIQUE(user_id, slug, version)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS style_emotions (
      id TEXT PRIMARY KEY,
      style_id TEXT NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
      emotion TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      UNIQUE(style_id, emotion)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS style_reports (
      id TEXT PRIMARY KEY,
      style_id TEXT NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
      reporter_id TEXT REFERENCES users(id),
      reason TEXT NOT NULL,
      details TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_styles_slug ON styles(slug)');
  db.run('CREATE INDEX IF NOT EXISTS idx_styles_user ON styles(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_style_emotions_style ON style_emotions(style_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash)');
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
