import { PortalEnv, jsonResponse, requireInternalToken, sha256 } from '../../../../_lib/portal';

export const onRequestGet: PagesFunction<PortalEnv> = async ({ params, request, env }) => {
  if (!requireInternalToken(request, env)) return jsonResponse({ error: 'Not authorized.' }, 401);
  const reqUid = String(params.req_uid || '');
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^req-[A-Z0-9]{10}$/.test(reqUid) || !/^requests\/[0-9a-f-]{36}\/(photos|logos|backgrounds)\/[0-9a-f-]{36}\.(webp|png|jpg)$/.test(key)) {
    return jsonResponse({ error: 'Asset not found.' }, 404);
  }
  try {
    const row = await env.PORTAL_DB.prepare(`
      SELECT status, data, approved_snapshot, approved_hash FROM portal_requests WHERE req_uid = ?
        AND status IN ('pending', 'approved')
    `).bind(reqUid).first<{ status: string; data: string; approved_snapshot: string | null; approved_hash: string | null }>();
    if (!row || !env.PORTAL_UPLOADS) return jsonResponse({ error: 'Asset not found.' }, 404);
    const snapshotText = row.status === 'approved' ? row.approved_snapshot : row.data;
    if (!snapshotText) return jsonResponse({ error: 'Asset not found.' }, 404);
    if (row.status === 'approved' && (!row.approved_hash || await sha256(snapshotText) !== row.approved_hash)) return jsonResponse({ error: 'Approved snapshot integrity check failed.' }, 409);
    const snapshot = JSON.parse(snapshotText) as Record<string, unknown>;
    if (!['photo', 'company_logo', 'background_image'].some(field => snapshot[field] === `r2:${key}`)) {
      return jsonResponse({ error: 'Asset is not part of the approved snapshot.' }, 404);
    }
    const object = await env.PORTAL_UPLOADS.get(key);
    if (!object) return jsonResponse({ error: 'Asset is unavailable.' }, 404);
    const bytes = new Uint8Array(await object.arrayBuffer());
    if (bytes.length > 500 * 1024) return jsonResponse({ error: 'Asset exceeds the limit.' }, 413);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return jsonResponse({ mime: object.httpMetadata?.contentType || 'application/octet-stream', base64: btoa(binary) });
  } catch {
    return jsonResponse({ error: 'Could not retrieve approved asset.' }, 503);
  }
};
