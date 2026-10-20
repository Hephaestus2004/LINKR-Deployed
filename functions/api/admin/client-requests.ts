import { Env, ProfileData } from '../../_lib/types';
import { generateRandomId } from '../../_lib/ids';
import { validateProfile } from '../../_lib/validate';
import { getNoCacheHeaders } from '../../_lib/cache';
import { storeProfileImages } from '../../_lib/r2';

const ALLOWED_LINK_TYPES = new Set(['phone', 'email', 'website', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'github', 'messenger', 'whatsapp', 'telegram', 'viber', 'custom']);
const ALLOWED_TEMPLATES = new Set(['clean-white', 'glass-dark', 'luxury-gold', 'bold-pop']);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...getNoCacheHeaders() }
});

function portalConfig(env: Env): { base: string; token: string } | null {
  if (!env.CLIENT_PORTAL_URL || !env.CLIENT_PORTAL_API_TOKEN) return null;
  try {
    const url = new URL(env.CLIENT_PORTAL_URL);
    if (url.protocol !== 'https:' || url.hostname !== 'edit-my-profile.linkr-tap.site') return null;
    return { base: url.origin, token: env.CLIENT_PORTAL_API_TOKEN };
  } catch { return null; }
}

async function portalFetch(config: { base: string; token: string }, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${config.base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.token}`, ...(init?.headers || {}) },
    cache: 'no-store'
  });
}

function validatePromotionInput(profile: ProfileData): string[] {
  const errors: string[] = [];
  const safeText = (value: unknown, max: number, label: string, required = false) => {
    if (typeof value !== 'string') { if (required) errors.push(`${label} is required.`); return; }
    if (value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) errors.push(`${label} contains invalid text.`);
    if (required && !value.trim()) errors.push(`${label} is required.`);
  };
  if (!ALLOWED_TEMPLATES.has(profile.template)) errors.push('Template is not supported.');
  safeText(profile.name, 60, 'Name', true);
  safeText(profile.company || '', 80, 'Company');
  safeText(profile.title || '', 80, 'Job title');
  safeText(profile.bio || '', 300, 'Bio');
  safeText(profile.location || '', 120, 'Location');
  if (profile.profile_mode !== 'standard' && profile.profile_mode !== 'logo_only') errors.push('Profile mode is not supported.');
  if (!Array.isArray(profile.links) || profile.links.length < 1 || profile.links.length > 15) errors.push('The approved profile must have between 1 and 15 links.');
  else profile.links.forEach((link, index) => {
    if (!ALLOWED_LINK_TYPES.has(link.type)) errors.push(`Link ${index + 1} type is not supported.`);
    safeText(link.value, 400, `Link ${index + 1}`, true);
    safeText(link.label || '', 60, `Link ${index + 1} label`);
    if (link.type === 'phone' || (link.type === 'whatsapp' && /^\+?[0-9()\s.-]+$/.test(link.value))) {
      const digits = link.value.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 18) errors.push(`Link ${index + 1} phone number is invalid.`);
    } else if (link.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link.value)) errors.push(`Link ${index + 1} email address is invalid.`);
    } else if (link.type === 'telegram' && /^@?[A-Za-z0-9_]{3,32}$/.test(link.value)) {
      // Validated Telegram handle; the renderer turns it into a Telegram URL.
    } else if (link.type !== 'phone') {
      try {
        const url = new URL(/^https?:\/\//i.test(link.value) ? link.value : `https://${link.value}`);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) errors.push(`Link ${index + 1} URL is not allowed.`);
      } catch { errors.push(`Link ${index + 1} URL is invalid.`); }
    }
  });
  if (profile.title_link) {
    try {
      const url = new URL(/^https?:\/\//i.test(profile.title_link) ? profile.title_link : `https://${profile.title_link}`);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) errors.push('Title link URL is not allowed.');
    } catch { errors.push('Title link URL is invalid.'); }
  }
  if (profile.theme?.accent && !/^#[0-9a-f]{6}$/i.test(profile.theme.accent)) errors.push('Theme color is invalid.');
  return errors;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const config = portalConfig(env);
  if (!config) return json({ error: 'The isolated client editor is not configured.' }, 503);
  const query = new URL(request.url).searchParams;
  const reqUid = query.get('req_uid');
  const assetKey = query.get('asset');
  if (assetKey && reqUid && /^req-[A-Z0-9]{10}$/.test(reqUid)) {
    try {
      const response = await portalFetch(config, `/api/internal/requests/${reqUid}/asset?key=${encodeURIComponent(assetKey)}`);
      return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...getNoCacheHeaders() } });
    } catch { return json({ error: 'The approved request asset could not be loaded.' }, 502); }
  }
  const path = reqUid
    ? `/api/internal/requests/${encodeURIComponent(reqUid)}`
    : '/api/internal/requests';
  try {
    const response = await portalFetch(config, path);
    return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...getNoCacheHeaders() } });
  } catch { return json({ error: 'The client editor could not be reached.' }, 502); }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const config = portalConfig(env);
  if (!config) return json({ error: 'The isolated client editor is not configured.' }, 503);
  let body: { action?: string; req_uid?: string };
  try { body = await request.json() as typeof body; } catch { return json({ error: 'Invalid JSON request.' }, 400); }

  try {
    if (body.action === 'invite') {
      const response = await portalFetch(config, '/api/internal/invites', { method: 'POST' });
      return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...getNoCacheHeaders() } });
    }
    if (!body.req_uid || !/^req-[A-Z0-9]{10}$/.test(body.req_uid)) return json({ error: 'Request reference is invalid.' }, 422);
    if (body.action === 'approve' || body.action === 'reject') {
      const response = await portalFetch(config, `/api/internal/requests/${body.req_uid}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: body.action })
      });
      return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...getNoCacheHeaders() } });
    }
    if (body.action !== 'publish') return json({ error: 'Action must be invite, approve, reject, or publish.' }, 422);

    const alreadyPublished = await env.DB.prepare(`SELECT profile_id FROM client_request_publications WHERE req_uid = ? LIMIT 1`)
      .bind(body.req_uid).first<{ profile_id: string }>();
    if (alreadyPublished) return json({ success: true, id: alreadyPublished.profile_id, already_published: true, url: `https://linkr-tap.site/u/${alreadyPublished.profile_id}` });

    const detailResponse = await portalFetch(config, `/api/internal/requests/${body.req_uid}`);
    if (!detailResponse.ok) return json({ error: 'Could not load the approved request.' }, detailResponse.status);
    const detail = await detailResponse.json() as { status: string; approved_snapshot?: ProfileData; approved_hash?: string | null };
    if (detail.status !== 'approved' || !detail.approved_snapshot || !detail.approved_hash) return json({ error: 'Approve this request before publishing.' }, 409);

    const snapshotString = JSON.stringify(detail.approved_snapshot);
    const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshotString)));
    const localHash = [...hashBytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (localHash !== detail.approved_hash) return json({ error: 'Approved snapshot integrity check failed.' }, 409);

    const profile = { ...detail.approved_snapshot } as ProfileData;
    for (const field of ['photo', 'company_logo', 'background_image'] as const) {
      const reference = profile[field];
      if (!reference?.startsWith('r2:')) continue;
      const key = reference.slice(3);
      const assetResponse = await portalFetch(config, `/api/internal/requests/${body.req_uid}/asset?key=${encodeURIComponent(key)}`);
      if (!assetResponse.ok) return json({ error: `Could not retrieve the approved ${field} image.` }, 422);
      const asset = await assetResponse.json() as { mime: string; base64: string };
      if (!/^image\/(webp|png|jpeg)$/.test(asset.mime) || !/^[A-Za-z0-9+/]+=*$/.test(asset.base64)) return json({ error: `Approved ${field} image is invalid.` }, 422);
      const bytes = Uint8Array.from(atob(asset.base64), character => character.charCodeAt(0));
      const signature = [...bytes.subarray(0, 12)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      const validImage = asset.mime === 'image/png' ? signature.startsWith('89504e470d0a1a0a')
        : asset.mime === 'image/jpeg' ? signature.startsWith('ffd8ff')
          : signature.startsWith('52494646') && signature.slice(16, 24) === '57454250';
      if (!bytes.length || bytes.length > 500 * 1024 || !validImage) return json({ error: `Approved ${field} image failed production validation.` }, 422);
      profile[field] = `data:${asset.mime};base64,${asset.base64}`;
    }

    const validation = validateProfile(profile, 'full');
    if (!validation.valid) return json({ error: 'The approved profile failed production validation.', details: validation.errors }, 422);
    const promotionErrors = validatePromotionInput(profile);
    if (promotionErrors.length) return json({ error: 'The approved profile failed production validation.', details: promotionErrors }, 422);
    const template = profile.template;

    let id = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRandomId();
      const collision = await env.DB.prepare('SELECT id FROM profiles WHERE id = ?').bind(candidate).first();
      if (!collision) { id = candidate; break; }
    }
    if (!id) return json({ error: 'Could not allocate a profile ID. Try again.' }, 503);

    const stored = await storeProfileImages(env, id, profile);
    const data = JSON.stringify(stored);
    const maxSeq = await env.DB.prepare('SELECT COALESCE(MAX(seq), 0) as max_seq FROM profiles').first<{ max_seq: number }>();
    const seq = (maxSeq?.max_seq || 0) + 1;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO profiles (id, seq, status, tier, template, data, retailer_id, version, activated_at)
        VALUES (?, ?, 'active', 'full', ?, ?, NULL, 1, datetime('now'))`).bind(id, seq, template, data),
      env.DB.prepare(`INSERT INTO profile_versions (profile_id, version, data, changed_by, reason)
        VALUES (?, 1, ?, 'admin', ?)`).bind(id, data, `Approved client request ${body.req_uid}`),
      env.DB.prepare(`INSERT INTO client_request_publications (req_uid, profile_id, approval_hash) VALUES (?, ?, ?)`)
        .bind(body.req_uid, id, detail.approved_hash)
    ]);

    const markPublished = await portalFetch(config, `/api/internal/requests/${body.req_uid}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'published' })
    });
    if (!markPublished.ok) return json({ success: true, id, url: `https://linkr-tap.site/u/${id}`, warning: 'Profile is live; portal status sync needs retry.' }, 201);
    return json({ success: true, id, url: `https://linkr-tap.site/u/${id}` }, 201);
  } catch {
    return json({ error: 'The client request could not be processed.' }, 503);
  }
};
