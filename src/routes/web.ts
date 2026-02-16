/**
 * Web gallery routes (SSR HTML)
 */
import { Hono } from 'hono';
import { listStyles, getStyle, getStyleVersions } from '../lib/styles';
import { layout, styleCard, stylePage, contributePage, homePage, dashboardPage, tokensPage } from '../views/templates';
import { optionalSession, requireSession } from '../middleware/session';
import { listTokens, createApiToken, revokeToken } from '../lib/auth';

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
      description: style.description || `${style.name} emotion style for Glint Tidbyt display`,
      url: `https://glint.sethgholson.com/styles/${author}/${slug}`,
      image: `https://glint.sethgholson.com/api/styles/${author}/${slug}/emotions/happy?version=${style.version}`,
    },
    user
  );
  return c.html(html);
});

/** Contribute page */
web.get('/contribute', async (c) => {
  const user = c.get('sessionUser');
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

export default web;
