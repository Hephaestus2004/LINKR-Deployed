import { PortalEnv, getInviteFromSession, jsonResponse } from '../_lib/portal';

export const onRequestGet: PagesFunction<PortalEnv> = async ({ request, env }) => {
  try {
    const invite = await getInviteFromSession(request, env);
    if (!invite) return jsonResponse({ error: 'An active invitation is required.' }, 401);

    const saved = await env.PORTAL_DB.prepare(`
      SELECT req_uid, status, created_at FROM portal_requests WHERE invite_id = ? LIMIT 1
    `).bind(invite.id).first<{ req_uid: string; status: string; created_at: string }>();

    return jsonResponse({
      active: true,
      expires_at: invite.expires_at,
      request: saved ? { req_uid: saved.req_uid, status: saved.status, created_at: saved.created_at } : null
    });
  } catch {
    return jsonResponse({ error: 'Could not load invitation status.' }, 503);
  }
};
