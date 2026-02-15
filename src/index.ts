/**
 * Glint Community Server
 * Hono + Bun + SQLite
 */
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import apiAuth from './routes/api-auth';
import apiStyles from './routes/api-styles';
import web from './routes/web';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));

// Static files with caching
const staticCache = async (c: any, next: any) => { await next(); c.header('Cache-Control', 'public, max-age=86400'); };
const immutableCache = async (c: any, next: any) => { await next(); c.header('Cache-Control', 'public, max-age=31536000, immutable'); };
app.use('/css/*', staticCache, serveStatic({ root: './public' }));
app.use('/js/*', staticCache, serveStatic({ root: './public' }));
app.use('/img/*', immutableCache, serveStatic({ root: './public' }));
app.use('/favicon.ico', immutableCache, serveStatic({ path: './public/favicon.ico' }));
app.use('/site.webmanifest', staticCache, serveStatic({ path: './public/site.webmanifest' }));

// API routes
app.route('/api/auth', apiAuth);
app.route('/api/styles', apiStyles);

// Web routes
app.route('/', web);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', version: '0.1.0' }));

const port = parseInt(process.env.PORT || '3000');
const hostname = process.env.HOST || '0.0.0.0';

Bun.serve({
  port,
  hostname,
  fetch: app.fetch,
});

console.log(`🔮 Glint Community running on http://${hostname}:${port}`);
