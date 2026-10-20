import { PortalEnv, jsonResponse, requireInternalToken } from '../../_lib/portal';

export const onRequestGet: PagesFunction<PortalEnv> = async ({ request, env }) => {
  if (!requireInternalToken(request, env)) return jsonResponse({ error: 'Not authorized.' }, 401);
  try {
    const result = await env.PORTAL_DB.prepare(`
      SELECT req_uid, status, created_at, updated_at, expires_at, approved_at, published_at, data
      FROM portal_requests ORDER BY created_at DESC LIMIT 300
    `).all<{ req_uid: string; status: string; created_at: string; updated_at: string; expires_at: string; approved_at: string | null; published_at: string | null; data: string }>();
    const requests = result.results.map(row => {
      const data = JSON.parse(row.data) as { name?: string; company?: string };
      return {
        req_uid: row.req_uid,
        status: row.status,
        name: data.name || '',
        company: data.company || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
        expires_at: row.expires_at,
        approved_at: row.approved_at,
        published_at: row.published_at
      };
    });
    return jsonResponse({ requests });
  } catch {
    return jsonResponse({ error: 'Could not load requests.' }, 503);
  }
};
