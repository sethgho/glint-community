/**
 * Auth middleware for Hono
 */
import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/auth';

/** Require valid API token via Bearer auth */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header. Use: Bearer glint_xxx' }, 401);
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);
  
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', user);
  c.set('scopes', (user.scopes || '').split(','));
  await next();
}

/** Optional auth — sets user if token present, continues either way */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) {
      c.set('user', user);
      c.set('scopes', (user.scopes || '').split(','));
    }
  }

  await next();
}

/** Require specific scope */
export function requireScope(scope: string) {
  return async (c: Context, next: Next) => {
    const scopes: string[] = c.get('scopes') || [];
    if (!scopes.includes(scope)) {
      return c.json({ error: `Missing required scope: ${scope}` }, 403);
    }
    await next();
  };
}
