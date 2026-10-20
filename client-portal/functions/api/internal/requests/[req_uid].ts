import { PortalEnv, jsonResponse, readJson, requireInternalToken, sha256 } from '../../../_lib/portal';

function validId(value: string): boolean {
  return /^req-[A-Z0-9]{10}$/.test(value);
}

export const onRequestGet: PagesFunction<PortalEnv> = async ({ params, request, env }) => {
  if (!requireInternalToken(request, env)) return jsonResponse({ error: 'Not authorized.' }, 401);
  const reqUid = String(params.req_uid || '');
  if (!validId(reqUid)) return jsonResponse({ error: 'Request not found.' }, 404);
  try {
    const row = await env.PORTAL_DB.prepare(`
      SELECT req_uid, status, data, approved_snapshot, approved_hash, created_at, updated_at,
        expires_at, approved_at, published_at
      FROM portal_requests WHERE req_uid = ? LIMIT 1
    `).bind(reqUid).first<{
      req_uid: string; status: string; data: string; approved_snapshot: string | null; approved_hash: string | null;
      created_at: string; updated_at: string; expires_at: string; approved_at: string | null; published_at: string | null;
    }>();
    if (!row) return jsonResponse({ error: 'Request not found.' }, 404);
    return jsonResponse({
      req_uid: row.req_uid,
      status: row.status,
      data: JSON.parse(row.data),
      approved_snapshot: row.approved_snapshot ? JSON.parse(row.approved_snapshot) : null,
      approved_hash: row.approved_hash,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
      approved_at: row.approved_at,
      published_at: row.published_at
    });
  } catch {
    return jsonResponse({ error: 'Could not load request.' }, 503);
  }
};

export const onRequestPost: PagesFunction<PortalEnv> = async ({ params, request, env }) => {
  if (!requireInternalToken(request, env)) return jsonResponse({ error: 'Not authorized.' }, 401);
  const reqUid = String(params.req_uid || '');
  if (!validId(reqUid)) return jsonResponse({ error: 'Request not found.' }, 404);
  try {
    const body = await readJson(request, 4096);
    const action = body.action;
    if (action !== 'approve' && action !== 'reject') return jsonResponse({ error: 'Action must be approve or reject.' }, 422);
    const row = await env.PORTAL_DB.prepare('SELECT status, data FROM portal_requests WHERE req_uid = ? LIMIT 1')
      .bind(reqUid).first<{ status: string; data: string }>();
    if (!row) return jsonResponse({ error: 'Request not found.' }, 404);
    if (row.status !== 'pending') return jsonResponse({ error: 'Only pending requests can be reviewed.' }, 409);

    if (action === 'reject') {
      await env.PORTAL_DB.prepare(`
        UPDATE portal_requests SET status = 'rejected', updated_at = datetime('now') WHERE req_uid = ? AND status = 'pending'
      `).bind(reqUid).run();
      return jsonResponse({ req_uid: reqUid, status: 'rejected' });
    }

    const hash = await sha256(row.data);
    await env.PORTAL_DB.prepare(`
      UPDATE portal_requests SET status = 'approved', approved_snapshot = data, approved_hash = ?,
        approved_at = datetime('now'), updated_at = datetime('now')
      WHERE req_uid = ? AND status = 'pending'
    `).bind(hash, reqUid).run();
    return jsonResponse({ req_uid: reqUid, status: 'approved', approved_hash: hash });
  } catch {
    return jsonResponse({ error: 'Could not update request review.' }, 503);
  }
};
