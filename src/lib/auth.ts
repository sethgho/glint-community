/**
 * Authentication utilities
 * - GitHub OAuth (Device Flow)
 * - API token generation and verification
 */
import { createHash, randomBytes } from 'crypto';
import { getDb } from '../db/schema';
import { nanoid } from 'nanoid';

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return `glint_${randomBytes(32).toString('hex')}`;
}

export function upsertUser(githubId: number, username: string, displayName: string | null, avatarUrl: string | null) {
  const db = getDb();
  const id = nanoid();
  
  const existing = db.query('SELECT * FROM users WHERE github_id = ?').get(githubId) as any;
  if (existing) {
    db.query("UPDATE users SET username = ?, display_name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
      .run(username, displayName, avatarUrl, existing.id);
    return { ...existing, username, display_name: displayName, avatar_url: avatarUrl };
  }

  db.query('INSERT INTO users (id, github_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)')
    .run(id, githubId, username, displayName, avatarUrl);
  
  return { id, github_id: githubId, username, display_name: displayName, avatar_url: avatarUrl };
}

export function createApiToken(userId: string, name: string, scopes = 'publish,read'): { token: string; id: string } {
  const db = getDb();
  const token = generateToken();
  const id = nanoid();
  const hash = hashToken(token);

  db.query('INSERT INTO api_tokens (id, user_id, name, token_hash, scopes) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, name, hash, scopes);

  return { token, id };
}

export function verifyToken(token: string): any | null {
  const db = getDb();
  const hash = hashToken(token);
  
  const row = db.query(`
    SELECT u.*, t.scopes, t.id as token_id
    FROM api_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token_hash = ? AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))
  `).get(hash) as any;

  if (row) {
    db.query("UPDATE api_tokens SET last_used_at = datetime('now') WHERE id = ?").run(row.token_id);
  }

  return row || null;
}

export function listTokens(userId: string) {
  const db = getDb();
  return db.query('SELECT id, name, scopes, last_used_at, created_at FROM api_tokens WHERE user_id = ?').all(userId);
}

export function revokeToken(tokenId: string, userId: string): boolean {
  const db = getDb();
  const result = db.query('DELETE FROM api_tokens WHERE id = ? AND user_id = ?').run(tokenId, userId);
  return (result as any).changes > 0;
}

export async function startDeviceFlow() {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'read:user' }),
  });
  return res.json();
}

export async function pollDeviceFlow(deviceCode: string) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  return res.json();
}

export async function getGitHubUser(accessToken: string) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
