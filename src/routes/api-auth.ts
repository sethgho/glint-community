/**
 * Auth API routes (GitHub Device Flow + token management)
 */
import { Hono } from 'hono';
import { startDeviceFlow, pollDeviceFlow, getGitHubUser, upsertUser, createApiToken, listTokens, revokeToken } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

const auth = new Hono();

/** Start GitHub Device Flow */
auth.post('/device/code', async (c) => {
  try {
    const result = await startDeviceFlow();
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: 'Failed to start device flow', details: e.message }, 500);
  }
});

/** Poll for device flow completion */
auth.post('/device/token', async (c) => {
  const { device_code } = await c.req.json();
  
  if (!device_code) {
    return c.json({ error: 'device_code required' }, 400);
  }

  try {
    const result = await pollDeviceFlow(device_code);
    
    if (result.error) {
      return c.json(result, result.error === 'authorization_pending' ? 200 : 400);
    }

    if (!result.access_token) {
      return c.json({ error: 'No access token received' }, 500);
    }

    // Get GitHub user info
    const ghUser = await getGitHubUser(result.access_token);
    
    // Upsert user in our DB
    const user = upsertUser(ghUser.id, ghUser.login, ghUser.name, ghUser.avatar_url);
    
    // Create an API token for CLI use
    const { token } = createApiToken(user.id, 'cli-auto', 'publish,read');

    return c.json({
      token,
      user: {
        username: ghUser.login,
        display_name: ghUser.name,
        avatar_url: ghUser.avatar_url,
      },
    });
  } catch (e: any) {
    return c.json({ error: 'Failed to complete auth', details: e.message }, 500);
  }
});

/** Create a new API token */
auth.post('/tokens', requireAuth, async (c) => {
  const user = c.get('user');
  const { name, scopes } = await c.req.json();
  
  if (!name) {
    return c.json({ error: 'Token name required' }, 400);
  }

  const result = createApiToken(user.id, name, scopes || 'publish,read');
  return c.json({ 
    id: result.id,
    token: result.token,
    message: 'Save this token — it won\'t be shown again.',
  });
});

/** List tokens */
auth.get('/tokens', requireAuth, async (c) => {
  const user = c.get('user');
  const tokens = listTokens(user.id);
  return c.json({ tokens });
});

/** Revoke a token */
auth.delete('/tokens/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const tokenId = c.req.param('id');
  const revoked = revokeToken(tokenId, user.id);
  
  if (!revoked) {
    return c.json({ error: 'Token not found' }, 404);
  }
  return c.json({ ok: true });
});

/** Get current user info */
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  });
});

export default auth;
