import { Env } from '../../_lib/types';
import { getNoCacheHeaders } from '../../_lib/cache';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
});

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
      const [resellers, recent] = await Promise.all([
      env.DB.prepare(`SELECT r.id, r.code, r.name, r.contact, r.active, r.created_at,
        COUNT(p.id) AS resale_count FROM retailers r LEFT JOIN profiles p ON p.retailer_id = r.id
        AND p.status != 'deleted' AND COALESCE(json_extract(p.data, '$.deleted'), 0) = 0
        GROUP BY r.id ORDER BY r.name COLLATE NOCASE`).all(),
      env.DB.prepare(`SELECT p.id, COALESCE(json_extract(p.data, '$.name'), '') AS client_name,
        p.tier, p.created_at, date(datetime(p.created_at, '+8 hours')) AS created_day,
        p.retailer_id AS reseller_id, r.name AS reseller_name
        FROM profiles p JOIN retailers r ON r.id = p.retailer_id
        WHERE p.status != 'deleted' AND COALESCE(json_extract(p.data, '$.deleted'), 0) = 0
        ORDER BY p.created_at DESC LIMIT 100`).all(),
    ]);
    return json({ resellers: resellers.results || [], recent_resells: recent.results || [] });
  } catch (error: any) {
    return json({ error: error.message || 'Could not load resellers.' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as { id?: number; name?: string; contact?: string };
    const name = String(body.name || '').trim().slice(0, 100);
    const contact = String(body.contact || '').trim().slice(0, 160) || null;
    if (!name) return json({ error: 'Reseller name is required.' }, 422);
    if (body.id) {
      await env.DB.prepare('UPDATE retailers SET name = ?, contact = ? WHERE id = ?').bind(name, contact, body.id).run();
      return json({ success: true, id: body.id });
    }
    const code = `R${crypto.randomUUID().replace(/-/g, '').slice(0, 9).toUpperCase()}`;
    const result = await env.DB.prepare('INSERT INTO retailers (code, name, contact) VALUES (?, ?, ?)').bind(code, name, contact).run();
    return json({ success: true, id: result.meta.last_row_id }, 201);
  } catch (error: any) {
    return json({ error: error.message || 'Could not save reseller.' }, 500);
  }
};
