/**
 * Web gallery routes (SSR HTML)
 */
import { Hono } from 'hono';
import { listStyles, getStyle, getStyleVersions } from '../lib/styles';
import { layout, styleCard, stylePage, contributePage, homePage } from '../views/templates';

const web = new Hono();

/** Home / gallery */
web.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const search = c.req.query('search') || '';
  const result = listStyles({ page, limit: 24, search: search || undefined });
  
  const html = layout(
    'Glint Community — Style Gallery',
    homePage(result.styles, result.total, page, search)
  );
  return c.html(html);
});

/** Style detail page */
web.get('/styles/:author/:slug', async (c) => {
  const { author, slug } = c.req.param();
  const style = getStyle(author, slug) as any;
  
  if (!style) {
    return c.html(layout('Not Found', '<div class="container"><h1>Style not found</h1></div>'), 404);
  }

  const versions = getStyleVersions(author, slug);
  const html = layout(
    `@${author}/${slug} — Glint Community`,
    stylePage(style, versions)
  );
  return c.html(html);
});

/** Contribute page */
web.get('/contribute', async (c) => {
  return c.html(layout('Contribute — Glint Community', contributePage()));
});

export default web;
