import { PortalEnv, jsonResponse, randomToken, requireInternalToken, sha256 } from '../../_lib/portal';

export const onRequestPost: PagesFunction<PortalEnv> = async ({ request, env }) => {
  if (!requireInternalToken(request, env)) return jsonResponse({ error: 'Not authorized.' }, 401);

  const token = randomToken();
  const inviteId = crypto.randomUUID();
  try {
    await env.PORTAL_DB.prepare(`
      INSERT INTO portal_invites (id, token_hash, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `).bind(inviteId, await sha256(token)).run();
    const inviteUrl = new URL(`/i/${token}`, request.url).toString();
    return jsonResponse({ invite_url: inviteUrl, expires_in_days: 7 }, 201);
  } catch {
    return jsonResponse({ error: 'Could not create invitation.' }, 503);
  }
};
