// functions/api/claim.ts
// Claim unassigned cards with claim code

import { Env, ProfileRecord, ProfileData } from '../_lib/types';
import { normalizeId } from '../_lib/ids';
import { validateProfile } from '../_lib/validate';
import { getNoCacheHeaders } from '../_lib/cache';

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      id: string;
      claim_code: string;
      profile: ProfileData;
    };

    const id = normalizeId(body.id);
    const claimCode = String(body.claim_code || '').trim();

    if (!id || !claimCode) {
      return new Response(JSON.stringify({ error: 'Card ID and Claim Code are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const record = await env.DB
      .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProfileRecord>();

    if (!record) {
      return new Response(JSON.stringify({ error: 'Card not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    if (record.status !== 'unassigned' && record.status !== 'assigned') {
      return new Response(JSON.stringify({ error: 'Card has already been claimed or activated' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    // Verify claim code hash if record has claim_hash
    if (record.claim_hash) {
      const codeHash = await sha256(claimCode);
      if (codeHash !== record.claim_hash) {
        return new Response(JSON.stringify({ error: 'Invalid claim code' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }
    }

    // Validate Profile Data
    const validation = validateProfile(body.profile, record.tier || 'full');
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validation.errors }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const newVersion = (record.version || 1) + 1;
    const jsonStr = JSON.stringify(body.profile);

    // Save version row first
    await env.DB.prepare(`
      INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
      VALUES (?, ?, ?, 'customer-claim', 'Card claimed by customer')
    `).bind(id, newVersion, jsonStr).run();

    // Update profile
    await env.DB.prepare(`
      UPDATE profiles
      SET status = 'active',
          data = ?,
          version = ?,
          template = ?,
          updated_at = datetime('now'),
          activated_at = datetime('now')
      WHERE id = ?
    `).bind(jsonStr, newVersion, body.profile.template || 'clean-white', id).run();

    return new Response(JSON.stringify({
      success: true,
      id,
      url: `https://linkr-tap.site/u/${id}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error claiming card' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
