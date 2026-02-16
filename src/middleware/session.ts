/**
 * Session middleware for web OAuth flow
 * Uses signed cookies backed by in-memory session store
 */
import type { Context, Next } from 'hono';
import { createHash, randomBytes, createHmac } from 'crypto';

interface Session {
  userId: string;
  user: any;
  createdAt: number;
}

// In-memory session store (simple, clears on restart)
const sessions = new Map<string, Session>();

const SESSION_COOKIE = 'glint_session';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.GITHUB_CLIENT_SECRET || 'dev-secret';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function sign(value: string): string {
  const sig = createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  if (sign(value) === signed) return value;
  return null;
}

export function createSession(user: any): string {
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId: user.id, user, createdAt: Date.now() });
  return sessionId;
}

export function destroySession(sessionId: string) {
  sessions.delete(sessionId);
}

function getSessionFromCookie(c: Context): Session | null {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (!cookie) return null;
  const sessionId = unsign(cookie);
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  // Check expiry
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

function getCookie(c: Context, name: string): string | undefined {
  const header = c.req.header('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setSessionCookie(c: Context, sessionId: string) {
  const signed = sign(sessionId);
  c.header('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(signed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${isSecure(c) ? '; Secure' : ''}`);
}

export function clearSessionCookie(c: Context) {
  c.header('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function isSecure(c: Context): boolean {
  return c.req.header('x-forwarded-proto') === 'https' || c.req.url.startsWith('https');
}

/** Attach user to context if logged in */
export async function optionalSession(c: Context, next: Next) {
  const session = getSessionFromCookie(c);
  if (session) {
    c.set('sessionUser', session.user);
  }
  await next();
}

/** Require login, redirect if not */
export async function requireSession(c: Context, next: Next) {
  const session = getSessionFromCookie(c);
  if (!session) {
    return c.redirect('/api/auth/login');
  }
  c.set('sessionUser', session.user);
  await next();
}

// CSRF state store (short-lived)
const stateStore = new Map<string, number>();

export function createOAuthState(): string {
  const state = randomBytes(16).toString('hex');
  stateStore.set(state, Date.now());
  // Clean old states
  for (const [k, v] of stateStore) {
    if (Date.now() - v > 600_000) stateStore.delete(k); // 10 min expiry
  }
  return state;
}

export function validateOAuthState(state: string): boolean {
  const ts = stateStore.get(state);
  if (!ts) return false;
  stateStore.delete(state);
  return Date.now() - ts < 600_000;
}
