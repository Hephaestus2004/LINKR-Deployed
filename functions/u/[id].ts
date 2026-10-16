// functions/u/[id].ts
// Core public profile handler for https://linkr-tap.site/u/:id

import { Env, ProfileRecord, ProfileData } from '../_lib/types';
import { normalizeId, isValidId } from '../_lib/ids';
import { getProfileCacheHeaders, getRedirectHeaders } from '../_lib/cache';
import { injectProfileIntoHtml, generateSystemPage } from '../_lib/templates';
import { resolveProfileMedia } from '../_lib/r2';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params, waitUntil } = context;
  const rawId = params.id as string;
  const id = normalizeId(rawId);

  if (!isValidId(id)) {
    return new Response(generateSystemPage('404', rawId), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 1. Database Lookup in D1
  let profileRecord: ProfileRecord | null = null;

  try {
    profileRecord = await env.DB
      .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProfileRecord>();

    // If not found in profiles, check vanity slugs table
    if (!profileRecord) {
      const slugRow = await env.DB
        .prepare('SELECT profile_id FROM slugs WHERE slug = ? LIMIT 1')
        .bind(id)
        .first<{ profile_id: string }>();

      if (slugRow && slugRow.profile_id) {
        profileRecord = await env.DB
          .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
          .bind(slugRow.profile_id)
          .first<ProfileRecord>();
      }
    }
  } catch (err) {
    console.error(`D1 query error for profile ${id}:`, err);
    // Graceful error fallback
    return new Response(generateSystemPage('404', id), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // If no record exists
  if (!profileRecord) {
    return new Response(generateSystemPage('404', id), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 2. Handle Status Lifecycle
  const status = profileRecord.status;

  if (status === 'unassigned' || status === 'assigned') {
    return new Response(generateSystemPage('claim', id), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (status === 'suspended') {
    return new Response(generateSystemPage('suspended', id), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (status === 'archived') {
    return new Response(generateSystemPage('archived', id), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 3. Status is ACTIVE: Parse data
  let profileData: ProfileData;
  try {
    profileData = typeof profileRecord.data === 'string'
      ? JSON.parse(profileRecord.data)
      : profileRecord.data;
  } catch {
    profileData = { schema: 1, template: 'clean-white', links: [] };
  }

  // Asynchronous Scan Tracking (non-blocking)
  waitUntil(trackScan(env, id));

  // 4. Redirect Tier Handling (302 only, NEVER 301)
  if (profileRecord.tier === 'redirect' && profileData.redirect_url) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': profileData.redirect_url,
        ...getRedirectHeaders(120)
      }
    });
  }

  // 5. Server-Inject Render (Option A)
  const templateName = profileRecord.template || profileData.template || env.DEFAULT_TEMPLATE || 'clean-white';
  const url = new URL(request.url);

  // Fetch static template shell
  const templateAssetUrl = new URL(`/t/${templateName}/index.html`, url.origin);
  let templateHtml = '';

  try {
    const fetchRes = env.ASSETS
      ? await env.ASSETS.fetch(templateAssetUrl.toString())
      : await fetch(templateAssetUrl.toString());

    if (fetchRes.ok) {
      templateHtml = await fetchRes.text();
    } else {
      // Fallback to clean-white
      const fallbackUrl = new URL('/t/clean-white/index.html', url.origin);
      const fallbackRes = env.ASSETS
        ? await env.ASSETS.fetch(fallbackUrl.toString())
        : await fetch(fallbackUrl.toString());
      templateHtml = fallbackRes.ok ? await fallbackRes.text() : '<!DOCTYPE html><html><body><h1>LINKR</h1></body></html>';
    }
  } catch (err) {
    console.error('Error fetching template HTML:', err);
    templateHtml = '<!DOCTYPE html><html><body><h1>LINKR</h1></body></html>';
  }

  const finalHtml = injectProfileIntoHtml(templateHtml, resolveProfileMedia(profileData, url.origin), request.url);

  return new Response(finalHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...getProfileCacheHeaders(300)
    }
  });
};

/**
 * Non-blocking scan event counter
 */
async function trackScan(env: Env, profileId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await env.DB.prepare(`
      INSERT INTO scan_daily (profile_id, day, count)
      VALUES (?, ?, 1)
      ON CONFLICT(profile_id, day) DO UPDATE SET count = count + 1
    `).bind(profileId, today).run();
  } catch (err) {
    console.error('Scan track error:', err);
  }
}
