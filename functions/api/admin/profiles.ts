// functions/api/admin/profiles.ts
// Admin API for Profile Management (behind Cloudflare Access)

import { Env, ProfileRecord, ProfileData, ProfileStatus } from '../../_lib/types';
import { normalizeId, generateRandomId } from '../../_lib/ids';
import { validateProfile } from '../../_lib/validate';
import { getNoCacheHeaders } from '../../_lib/cache';
import { resolveProfileMedia, storeProfileImages } from '../../_lib/r2';

// GET: List profiles or get single profile
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const idParam = url.searchParams.get('id');

  try {
    const checkIdParam = url.searchParams.get('check_id');
    if (checkIdParam) {
      const checkId = normalizeId(checkIdParam);
      const existing = await env.DB
        .prepare('SELECT id, status, tier, data FROM profiles WHERE id = ? LIMIT 1')
        .bind(checkId)
        .first<{ id: string; status: string; tier: string; data: string }>();

      if (existing) {
        let name = '';
        try {
          const d = JSON.parse(existing.data || '{}');
          name = d.name || '';
        } catch {}

        return new Response(JSON.stringify({
          exists: true,
          id: existing.id,
          status: existing.status,
          tier: existing.tier,
          name
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }

      // Check slugs
      const slugRow = await env.DB
        .prepare('SELECT profile_id FROM slugs WHERE slug = ? LIMIT 1')
        .bind(checkId)
        .first();

      if (slugRow) {
        return new Response(JSON.stringify({
          exists: true,
          is_slug: true,
          status: 'reserved'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }

      return new Response(JSON.stringify({ exists: false, id: checkId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    if (idParam) {
      const id = normalizeId(idParam);
      const profile = await env.DB
        .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
        .bind(id)
        .first<ProfileRecord>();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }

      // Fetch version history
      const versions = await env.DB
        .prepare('SELECT version, changed_by, reason, created_at FROM profile_versions WHERE profile_id = ? ORDER BY version DESC')
        .bind(id)
        .all();

      return new Response(JSON.stringify({
        profile,
        data: resolveProfileMedia(typeof profile.data === 'string' ? JSON.parse(profile.data) : profile.data, url.origin),
        versions: versions.results
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    // List latest 100 profiles
    const statusFilter = url.searchParams.get('status');
    const query = statusFilter
      ? 'SELECT id, seq, status, tier, template, updated_at, created_at FROM profiles WHERE status = ? ORDER BY seq DESC LIMIT 100'
      : 'SELECT id, seq, status, tier, template, updated_at, created_at FROM profiles ORDER BY seq DESC LIMIT 100';

    const stmt = statusFilter
      ? env.DB.prepare(query).bind(statusFilter)
      : env.DB.prepare(query);

    const list = await stmt.all();

    return new Response(JSON.stringify({ profiles: list.results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};

// POST: Create or Update Profile
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      id?: string;
      tier?: string;
      template?: string;
      status?: ProfileStatus;
      profile: ProfileData;
      reason?: string;
    };

    let id = body.id ? normalizeId(body.id) : '';
    const tier = body.tier || 'full';
    const template = body.template || body.profile?.template || 'clean-white';
    const status = body.status || 'active';

    // Validate Profile Data
    const validation = validateProfile(body.profile, tier);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validation.errors }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    const isNew = Boolean(body.is_new);
    const saveProfileData = async (profileId: string) => JSON.stringify(await storeProfileImages(env, profileId, body.profile));

    // 1. If Editing existing profile (not new)
    if (id && !isNew) {
      const existing = await env.DB
        .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
        .bind(id)
        .first<ProfileRecord>();

      if (!existing) {
        return new Response(JSON.stringify({ error: `Profile "${id}" not found to update` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }

      const nextVersion = (existing.version || 1) + 1;
      const dataJson = await saveProfileData(id);

      // Write version row
      await env.DB.prepare(`
        INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
        VALUES (?, ?, ?, 'admin', ?)
      `).bind(id, nextVersion, dataJson, body.reason || 'Admin update').run();

      // Update profile
      await env.DB.prepare(`
        UPDATE profiles
        SET data = ?,
            version = ?,
            template = ?,
            tier = ?,
            status = ?,
            updated_at = datetime('now'),
            activated_at = CASE WHEN activated_at IS NULL AND ? = 'active' THEN datetime('now') ELSE activated_at END
        WHERE id = ?
      `).bind(dataJson, nextVersion, template, tier, status, status, id).run();

      return new Response(JSON.stringify({
        success: true,
        id,
        version: nextVersion,
        url: `https://linkr-tap.site/u/${id}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    // 2. Creating New Profile
    if (id) {
      // Check if custom ID already exists in profiles
      const existing = await env.DB
        .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
        .bind(id)
        .first<ProfileRecord>();

      if (existing) {
        if (existing.status === 'unassigned' || existing.status === 'assigned') {
          // Activating an existing unassigned stock card
          const nextVersion = (existing.version || 1) + 1;
          const dataJson = await saveProfileData(id);
          await env.DB.prepare(`
            INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
            VALUES (?, ?, ?, 'admin', 'Activated from unassigned stock')
          `).bind(id, nextVersion, dataJson).run();

          await env.DB.prepare(`
            UPDATE profiles
            SET data = ?,
                version = ?,
                template = ?,
                tier = ?,
                status = 'active',
                updated_at = datetime('now'),
                activated_at = datetime('now')
            WHERE id = ?
          `).bind(dataJson, nextVersion, template, tier, id).run();

          return new Response(JSON.stringify({
            success: true,
            id,
            version: nextVersion,
            message: 'Stock card activated successfully',
            url: `https://linkr-tap.site/u/${id}`
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
          });
        }

        // Active card collision
        return new Response(JSON.stringify({
          error: `Card ID "${id}" is already active and registered. Choose a different ID or edit the existing card.`
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }

      // Check slugs
      const slugRow = await env.DB
        .prepare('SELECT profile_id FROM slugs WHERE slug = ? LIMIT 1')
        .bind(id)
        .first();

      if (slugRow) {
        return new Response(JSON.stringify({
          error: `Card ID or slug "${id}" is already reserved.`
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
        });
      }
    } else {
      // Generate new unique ID
      let attempts = 0;
      do {
        id = generateRandomId();
        const check = await env.DB
          .prepare('SELECT id FROM profiles WHERE id = ? LIMIT 1')
          .bind(id)
          .first();
        if (!check) break;
        attempts++;
      } while (attempts < 5);
    }

    const maxSeq = await env.DB
      .prepare('SELECT COALESCE(MAX(seq), 0) as max_seq FROM profiles')
      .first<{ max_seq: number }>();
    const nextSeq = (maxSeq?.max_seq || 0) + 1;
    const dataJson = await saveProfileData(id);

    await env.DB.prepare(`
      INSERT INTO profiles (id, seq, status, tier, template, data, version, activated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(id, nextSeq, status, tier, template, dataJson).run();

    await env.DB.prepare(`
      INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
      VALUES (?, 1, ?, 'admin', 'Initial creation')
    `).bind(id, dataJson).run();

    return new Response(JSON.stringify({
      success: true,
      id,
      seq: nextSeq,
      url: `https://linkr-tap.site/u/${id}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error saving profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
