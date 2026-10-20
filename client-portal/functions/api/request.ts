import { PortalEnv, getInviteFromSession, jsonResponse, readJson, storeRequestImage } from '../_lib/portal';

const TEMPLATE_IDS = new Set(['clean-white', 'glass-dark', 'luxury-gold', 'bold-pop']);
const THEME_IDS = new Set(['monochrome-photo', 'gold-glass', 'gold-clean']);
const ICON_PACK_IDS = new Set(['classic', 'bold']);
const SECTION_IDS = new Set(['identity', 'links', 'share', 'qr']);
const LINK_TYPES = new Set([
  'phone', 'email', 'website', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin',
  'github', 'messenger', 'whatsapp', 'telegram', 'viber', 'custom'
]);

function textField(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== 'string') {
    if (required) throw new Error(`${label} is required.`);
    return '';
  }
  const result = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return result;
}

function normalizeLink(input: unknown, index: number): { type: string; value: string; label?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`Link ${index + 1} is invalid.`);
  const raw = input as Record<string, unknown>;
  const type = textField(raw.type, `Link ${index + 1} type`, 20, true).toLowerCase();
  if (!LINK_TYPES.has(type)) throw new Error(`Link ${index + 1} uses an unsupported type.`);
  const value = textField(raw.value, `Link ${index + 1}`, 400, true);
  const label = textField(raw.label, `Link ${index + 1} label`, 60);

  if (type === 'phone') {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 18) throw new Error(`Link ${index + 1} must be a valid phone number.`);
  } else if (type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`Link ${index + 1} must be a valid email address.`);
  } else if (type === 'whatsapp' && /^\+?[0-9()\s.-]+$/.test(value)) {
    if (value.replace(/\D/g, '').length < 7) throw new Error(`Link ${index + 1} must be a valid phone number.`);
  } else if (type === 'telegram' && /^@?[A-Za-z0-9_]{3,32}$/.test(value)) {
    // Telegram handle, not a URL.
  } else {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    let url: URL;
    try { url = new URL(candidate); } catch { throw new Error(`Link ${index + 1} must be a valid URL.`); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error(`Link ${index + 1} must use a public HTTP or HTTPS URL.`);
    }
    return { type, value: url.toString(), ...(label ? { label } : {}) };
  }
  return { type, value, ...(label ? { label } : {}) };
}

function safeSections(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > SECTION_IDS.size) throw new Error('Choose between 1 and 4 page sections.');
  const sections = value.map((item, index) => textField(item, `Section ${index + 1}`, 16, true));
  if (sections.some(section => !SECTION_IDS.has(section)) || new Set(sections).size !== sections.length) {
    throw new Error('The page layout contains an unsupported or repeated section.');
  }
  return sections;
}

export const onRequestPost: PagesFunction<PortalEnv> = async ({ request, env }) => {
  try {
    const invite = await getInviteFromSession(request, env);
    if (!invite || invite.status !== 'open') return jsonResponse({ error: 'This invitation is not available for a new request.' }, 401);

    const existing = await env.PORTAL_DB.prepare('SELECT req_uid FROM portal_requests WHERE invite_id = ? LIMIT 1')
      .bind(invite.id).first();
    if (existing) return jsonResponse({ error: 'This invitation already has a submitted request.' }, 409);

    const body = await readJson(request);
    const template = textField(body.template, 'Template', 32, true);
    if (!TEMPLATE_IDS.has(template)) return jsonResponse({ error: 'Choose a supported profile template.' }, 422);

    const designInput = body.design && typeof body.design === 'object' && !Array.isArray(body.design)
      ? body.design as Record<string, unknown>
      : {};
    const themePreset = textField(designInput.themePreset, 'Theme preset', 32, true);
    const iconPack = textField(designInput.iconPack, 'Icon pack', 24, true);
    if (!THEME_IDS.has(themePreset) || !ICON_PACK_IDS.has(iconPack)) {
      return jsonResponse({ error: 'Choose a supported theme and icon pack.' }, 422);
    }
    const sections = safeSections(designInput.sections);

    const linksInput = Array.isArray(body.links) ? body.links : [];
    if (linksInput.length < 1 || linksInput.length > 15) return jsonResponse({ error: 'Add between 1 and 15 links.' }, 422);
    const links = linksInput.map((link, index) => normalizeLink(link, index));
    const titleLink = textField(body.title_link, 'Title link', 500);
    let safeTitleLink: string | null = null;
    if (titleLink) {
      const url = new URL(/^https?:\/\//i.test(titleLink) ? titleLink : `https://${titleLink}`);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Title link must use a public HTTP or HTTPS URL.');
      safeTitleLink = url.toString();
    }

    const name = textField(body.name, 'Name', 60, true);
    const accent = typeof body.accent === 'string' && /^#[0-9a-f]{6}$/i.test(body.accent) ? body.accent : null;
    const profile = {
      schema: 1,
      template,
      profile_mode: body.profile_mode === 'logo_only' ? 'logo_only' : 'standard',
      name,
      company: textField(body.company, 'Company', 80),
      title: textField(body.title, 'Job title', 80),
      title_link: safeTitleLink,
      bio: textField(body.bio, 'Bio', 300),
      location: textField(body.location, 'Location', 120),
      design: { sections, themePreset, iconPack },
      theme: { accent, mode: template === 'clean-white' ? 'light' : 'dark' },
      links
    };

    const [photo, companyLogo, backgroundImage] = await Promise.all([
      storeRequestImage(env, invite.id, 'photo', body.photo),
      storeRequestImage(env, invite.id, 'company_logo', body.company_logo),
      storeRequestImage(env, invite.id, 'background_image', body.background_image)
    ]);
    const snapshot = JSON.stringify({
      ...profile,
      photo,
      company_logo: companyLogo,
      background_image: backgroundImage
    });
    const reqUid = `req-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;

    await env.PORTAL_DB.prepare(`
      INSERT INTO portal_requests (req_uid, invite_id, data, expires_at)
      VALUES (?, ?, ?, (SELECT expires_at FROM portal_invites WHERE id = ?))
    `).bind(reqUid, invite.id, snapshot, invite.id).run();
    await env.PORTAL_DB.prepare(`
      UPDATE portal_invites SET status = 'submitted', used_at = datetime('now')
      WHERE id = ? AND status = 'open'
    `).bind(invite.id).run();

    return jsonResponse({ req_uid: reqUid, status: 'pending', expires_at: invite.expires_at }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save the request.';
    if (message === 'Request is too large.') return jsonResponse({ error: message }, 413);
    return jsonResponse({ error: message }, 422);
  }
};
