// functions/api/edit-request.ts
// Customer profile edit request intake endpoint

import { Env, ProfileRecord } from '../_lib/types';
import { normalizeId } from '../_lib/ids';
import { getNoCacheHeaders } from '../_lib/cache';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      profile_id: string;
      contact: string;
      notes?: string;
      requested_changes: any;
    };

    const id = normalizeId(body.profile_id);

    if (!id || !body.requested_changes) {
      return new Response(JSON.stringify({ error: 'profile_id and requested_changes are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const record = await env.DB
      .prepare('SELECT id, status FROM profiles WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProfileRecord>();

    if (!record) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const payload = JSON.stringify({
      contact: body.contact || '',
      notes: body.notes || '',
      changes: body.requested_changes
    });

    const res = await env.DB.prepare(`
      INSERT INTO edit_requests (profile_id, payload, status)
      VALUES (?, ?, 'open')
    `).bind(id, payload).run();

    return new Response(JSON.stringify({
      success: true,
      ticket_id: res.meta.last_row_id,
      message: 'Edit request submitted successfully. Turnaround is within 24 hours.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error creating edit request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
