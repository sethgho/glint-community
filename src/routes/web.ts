/**
 * Web gallery routes (SSR HTML)
 */
import { Hono } from 'hono';
import { listStyles, getStyle, getStyleVersions } from '../lib/styles';
import { getDb } from '../db/schema';
import { layout, styleCard, stylePage, contributePage, homePage, dashboardPage, tokensPage } from '../views/templates';
import { optionalSession, requireSession } from '../middleware/session';
import { listTokens, createApiToken, revokeToken } from '../lib/auth';
import { nanoid } from 'nanoid';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const web = new Hono();

// Apply optional session to all routes
web.use('*', optionalSession);

/** Home / gallery */
web.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const search = c.req.query('search') || '';
  const result = listStyles({ page, limit: 24, search: search || undefined });
  const user = c.get('sessionUser');
  
  const html = layout(
    'Glint Community — Style Gallery',
    homePage(result.styles, result.total, page, search),
    undefined, user
  );
  c.header('Cache-Control', 'public, s-maxage=3600, max-age=300');
  return c.html(html);
});

/** Style detail page */
web.get('/styles/:author/:slug', async (c) => {
  const { author, slug } = c.req.param();
  const style = getStyle(author, slug) as any;
  const user = c.get('sessionUser');
  
  if (!style) {
    return c.html(layout('Not Found', '<div class="container"><h1>Style not found</h1></div>', undefined, user), 404);
  }

  const versions = getStyleVersions(author, slug);
  const html = layout(
    `@${author}/${slug} — Glint Community`,
    stylePage(style, versions),
    {
      description: style.description || `${style.name} — expressive SVG eye style for Glint`,
      url: `https://glint.sethgholson.com/styles/${author}/${slug}`,
      image: `https://glint.sethgholson.com/api/styles/${author}/${slug}/emotions/happy?version=${style.version}`,
    },
    user
  );
  c.header('Cache-Control', 'public, s-maxage=3600, max-age=300');
  return c.html(html);
});

/** Contribute page */
web.get('/contribute', async (c) => {
  const user = c.get('sessionUser');
  c.header('Cache-Control', 'public, s-maxage=86400, max-age=3600');
  return c.html(layout('Contribute — Glint Community', contributePage(), undefined, user));
});

/** Dashboard — requires login */
web.get('/dashboard', requireSession, async (c) => {
  const user = c.get('sessionUser');
  const userStyles = listStyles({ author: user.username });
  return c.html(layout('Dashboard — Glint Community', dashboardPage(user, userStyles.styles), undefined, user));
});

/** Dashboard: API Tokens */
web.get('/dashboard/tokens', requireSession, async (c) => {
  const user = c.get('sessionUser');
  const tokens = listTokens(user.id);
  const newToken = c.req.query('newToken');
  return c.html(layout('API Tokens — Glint Community', tokensPage(user, tokens, newToken || undefined), undefined, user));
});

/** Create token (POST) */
web.post('/dashboard/tokens', requireSession, async (c) => {
  const user = c.get('sessionUser');
  const body = await c.req.parseBody();
  const name = (body.name as string || '').trim();
  if (!name) {
    return c.redirect('/dashboard/tokens?error=name_required');
  }
  const { token } = createApiToken(user.id, name, 'publish,read');
  return c.redirect(`/dashboard/tokens?newToken=${encodeURIComponent(token)}`);
});

/** Revoke token (POST) */
web.post('/dashboard/tokens/:id/revoke', requireSession, async (c) => {
  const user = c.get('sessionUser');
  const tokenId = c.req.param('id');
  revokeToken(tokenId, user.id);
  return c.redirect('/dashboard/tokens');
});

/** Report a style (POST) */
web.post('/styles/:author/:slug/report', async (c) => {
  const { author, slug } = c.req.param();
  const style = getStyle(author, slug) as any;
  if (!style) return c.redirect('/');

  const body = await c.req.parseBody();
  const reason = (body.reason as string || '').trim();
  if (!reason) return c.redirect(`/styles/${author}/${slug}`);

  const details = (body.details as string || '').trim() || null;
  const user = c.get('sessionUser');
  const reporterId = user?.id || null;

  const db = getDb();
  db.query('INSERT INTO style_reports (id, style_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)')
    .run(nanoid(), style.id, reporterId, reason, details);

  const html = layout(
    'Report Submitted',
    `<div class="container" style="padding-top:8rem;padding-bottom:8rem;text-align:center;">
      <h1 style="font-size:2rem;margin-bottom:1rem;">🚩 Report Submitted</h1>
      <p style="font-size:1.1rem;color:var(--text-muted);margin-bottom:2rem;">Thanks for reporting <strong>@${escHtml(author)}/${escHtml(slug)}</strong>. We'll review it.</p>
      <a href="/styles/${escHtml(author)}/${escHtml(slug)}" class="btn btn-primary">Back to style</a>
    </div>`,
    undefined, user
  );
  return c.html(html);
});

export default web;
