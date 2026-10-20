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

    // List latest profiles, with optional status and substring search.
    const statusFilter = url.searchParams.get('status');
    const searchTerm = (url.searchParams.get('search') || '').trim().slice(0, 80);
    const dateView = url.searchParams.get('date_view') || '';
    const dateDay = url.searchParams.get('date_day') || '';
    const dateSort = url.searchParams.get('date_sort') === 'oldest' ? 'ASC' : 'DESC';
    const visibleProfileFilter = `COALESCE(json_extract(p.data, '$.deleted'), 0) = 0
      AND NOT (
        p.status = 'archived'
        AND COALESCE(json_extract(p.data, '$.name'), '') = ''
        AND COALESCE(json_array_length(json_extract(p.data, '$.links')), 0) = 0
      )`;
    const filters = [`p.status != 'deleted'`, visibleProfileFilter];
    const bindings: string[] = [];
    if (statusFilter) {
      filters.push('p.status = ?');
      bindings.push(statusFilter);
    }
    if (searchTerm) {
      filters.push(`(
        instr(lower(p.id), lower(?)) > 0
        OR instr(lower(COALESCE(json_extract(p.data, '$.name'), '')), lower(?)) > 0
      )`);
      bindings.push(searchTerm, searchTerm);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateDay)) {
      filters.push("date(datetime(p.created_at, '+8 hours')) = ?");
      bindings.push(dateDay);
    }
    if (dateView === 'today') filters.push("date(datetime(p.created_at, '+8 hours')) = date(datetime('now', '+8 hours'))");
    else if (dateView === 'yesterday') filters.push("date(datetime(p.created_at, '+8 hours')) = date(datetime('now', '+8 hours', '-1 day'))");
    else if (dateView === '7') filters.push("datetime(p.created_at, '+8 hours') >= datetime('now', '+8 hours', '-7 days')");
    else if (dateView === '30') filters.push("datetime(p.created_at, '+8 hours') >= datetime('now', '+8 hours', '-30 days')");
    else if (dateView === 'month') filters.push("strftime('%Y-%m', datetime(p.created_at, '+8 hours')) = strftime('%Y-%m', datetime('now', '+8 hours'))");
    else if (dateView === 'year') filters.push("strftime('%Y', datetime(p.created_at, '+8 hours')) = strftime('%Y', datetime('now', '+8 hours'))");

    const query = `SELECT p.id, p.seq, p.status, p.tier, p.template,
      COALESCE(json_extract(p.data, '$.name'), '') AS name, p.updated_at, p.created_at,
      date(datetime(p.created_at, '+8 hours')) AS created_day,
      p.retailer_id AS reseller_id, r.name AS reseller_name FROM profiles p
      LEFT JOIN retailers r ON r.id = p.retailer_id
      WHERE ${filters.join(' AND ')}
      ORDER BY p.created_at ${dateSort}, p.seq DESC LIMIT 500`;
    const prepared = env.DB.prepare(query);
    const stmt = bindings.length ? prepared.bind(...bindings) : prepared;

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
      is_new?: boolean;
      profile: ProfileData & { reseller_id?: number | null };
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
    const saveProfileData = async (profileId: string) => {
      const { reseller_id: _adminResellerId, ...profileData } = body.profile;
      return JSON.stringify(await storeProfileImages(env, profileId, profileData));
    };

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
      const resellerId = Number(body.profile.reseller_id) || null;

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
            retailer_id = ?,
            status = ?,
            updated_at = datetime('now'),
            activated_at = CASE WHEN activated_at IS NULL AND ? = 'active' THEN datetime('now') ELSE activated_at END
        WHERE id = ?
      `).bind(dataJson, nextVersion, template, tier, resellerId, status, status, id).run();

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
          const resellerId = Number(body.profile.reseller_id) || null;
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
                retailer_id = ?,
                status = ?,
                updated_at = datetime('now'),
                activated_at = CASE WHEN ? = 'active' THEN datetime('now') ELSE activated_at END
            WHERE id = ?
          `).bind(dataJson, nextVersion, template, tier, resellerId, status, status, id).run();

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
    const resellerId = Number(body.profile.reseller_id) || null;

    await env.DB.prepare(`
      INSERT INTO profiles (id, seq, status, tier, template, data, retailer_id, version, activated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(id, nextSeq, status, tier, template, dataJson, resellerId).run();

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

// DELETE: Remove profile content while retaining its ID as an archived reservation.
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const idParam = new URL(request.url).searchParams.get('id');
  const id = idParam ? normalizeId(idParam) : '';
  if (!id) {
    return new Response(JSON.stringify({ error: 'Profile ID is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }

  try {
    const profile = await env.DB.prepare('SELECT version FROM profiles WHERE id = ? LIMIT 1')
      .bind(id).first<{ version: number }>();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
      });
    }

    if (env.R2_STORAGE) {
      for (const prefix of [`photos/${id}-`, `logos/${id}-`, `backgrounds/${id}-`, `qr/${id}-`, `qr/${id}.`]) {
        let cursor: string | undefined;
        do {
          const page = await env.R2_STORAGE.list({ prefix, cursor });
          if (page.objects.length) await env.R2_STORAGE.delete(page.objects.map(object => object.key));
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
      }
    }

    const tombstone = JSON.stringify({ schema: 1, deleted: true, template: 'clean-white', name: '', links: [] });
    const nextVersion = (profile.version || 1) + 1;
    await env.DB.prepare('DELETE FROM edit_requests WHERE profile_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM profile_versions WHERE profile_id = ?').bind(id).run();
    await env.DB.prepare(`
      UPDATE profiles
      SET data = ?, status = 'archived', version = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(tombstone, nextVersion, id).run();
    await env.DB.prepare(`
      INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
      VALUES (?, ?, ?, 'admin', 'Profile deleted; ID retained as reserved')
    `).bind(id, nextVersion, tombstone).run();

    return new Response(JSON.stringify({ success: true, id, status: 'archived', reserved: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Could not delete profile.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getNoCacheHeaders() }
    });
  }
};
