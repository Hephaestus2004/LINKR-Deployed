import { PortalEnv, clearSessionCookie, jsonResponse, setSessionCookie, sha256, randomToken } from '../_lib/portal';

export const onRequestGet: PagesFunction<PortalEnv> = async ({ params, env, request }) => {
  const token = String(params.token || '');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    return new Response('This invitation link is invalid or expired.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
    });
  }

  try {
    const tokenHash = await sha256(token);
    const invite = await env.PORTAL_DB.prepare(`
      SELECT id, status FROM portal_invites
      WHERE token_hash = ? AND status IN ('open', 'submitted') AND expires_at > datetime('now')
      LIMIT 1
    `).bind(tokenHash).first<{ id: string; status: string }>();
    if (!invite) {
      return new Response('This invitation link is invalid or expired.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': clearSessionCookie() }
      });
    }

    const session = randomToken();
    const sessionHash = await sha256(session);
    await env.PORTAL_DB.prepare(`
      UPDATE portal_invites SET session_hash = ?
      WHERE id = ? AND status IN ('open', 'submitted') AND expires_at > datetime('now')
    `).bind(sessionHash, invite.id).run();

    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/', request.url).toString(),
        'Set-Cookie': setSessionCookie(session),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer'
      }
    });
  } catch {
    return jsonResponse({ error: 'Invitation could not be verified.' }, 503);
  }
};
