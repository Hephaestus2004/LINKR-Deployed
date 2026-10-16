// public/shared/parse.js
// client.txt v2 parser and serializer adhering to 03_DATA_SCHEMA.md

const KNOWN_KEYS = new Set([
  'template', 'profile_mode', 'redirect_url',
  'name', 'company', 'title', 'title_link', 'bio', 'location', 'photo', 'company_logo', 'qr_code',
  'show_name', 'show_title', 'show_bio', 'show_photo', 'show_company_logo',
  'theme', 'accent', 'background', 'profile_bg', 'surface', 'border', 'text', 'muted', 'action',
  'phone', 'email', 'website', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'github',
  'messenger', 'whatsapp', 'telegram', 'viber', 'vcard',
  'retailer', 'order'
]);

/**
 * Parses client.txt format string into a Profile JSON Object and collects warnings.
 */
export function parseClientText(text) {
  const warnings = [];
  const items = [];

  const lines = String(text || '').split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine || rawLine.startsWith('#')) continue;

    const separator = rawLine.indexOf(':');
    if (separator < 0) {
      warnings.push(`Line ${idx + 1}: Missing colon separator in line: "${rawLine}"`);
      continue;
    }

    const key = rawLine.slice(0, separator).trim().toLowerCase();
    let value = rawLine.slice(separator + 1).trim();
    let label = '';

    const bar = value.lastIndexOf(' | ');
    if (bar > -1) {
      label = value.slice(bar + 3).trim();
      value = value.slice(0, bar).trim();
    }

    if (!KNOWN_KEYS.has(key) && !key.startsWith('link_')) {
      warnings.push(`Line ${idx + 1}: Unknown key "${key}". Check for spelling mistakes.`);
    }

    items.push({ key, value, label });
  }

  const get = (key) => (items.find(i => i.key === key) || {}).value || '';
  const isEnabled = (key, fallback = true) => {
    const val = get(key);
    return val ? !['false', 'no', '0', 'off'].includes(val.toLowerCase()) : fallback;
  };

  const links = [];
  items.forEach(item => {
    if (['phone', 'email', 'website', 'facebook', 'instagram', 'tiktok', 'youtube',
      'linkedin', 'github', 'messenger', 'whatsapp', 'telegram', 'viber'].includes(item.key)) {
      links.push({
        type: item.key,
        value: item.value,
        label: item.label || undefined
      });
    } else if (item.key.startsWith('link_')) {
      // link_1: Label | https://... or link_1: https://... | Label
      const label = item.label || item.value;
      const value = item.label ? item.value : item.label || item.value;
      links.push({
        type: 'custom',
        label: item.label || 'Link',
        value: item.value
      });
    } else if (item.key === 'location' && item.value) {
      links.push({
        type: 'location',
        value: item.value,
        label: item.label || 'Location'
      });
    }
  });

  const profile = {
    schema: 1,
    template: get('template') || 'clean-white',
    profile_mode: (get('profile_mode').toLowerCase() === 'logo_only' || get('profile_mode').toLowerCase() === 'logo-only') ? 'logo_only' : 'standard',
    name: get('name'),
    company: get('company'),
    title: get('title'),
    title_link: get('title_link') || null,
    bio: get('bio'),
    location: get('location'),
    photo: get('photo') || null,
    company_logo: get('company_logo') || null,
    qr_code: get('qr_code') || null,
    vcard: get('vcard') || null,
    show: {
      name: isEnabled('show_name', true),
      title: isEnabled('show_title', true),
      bio: isEnabled('show_bio', true),
      photo: isEnabled('show_photo', true),
      company_logo: isEnabled('show_company_logo', true)
    },
    theme: {
      mode: (get('theme').toLowerCase() === 'dark' ? 'dark' : 'light'),
      accent: get('accent') || null,
      background: get('background') || null,
      profile_bg: get('profile_bg') || null,
      surface: get('surface') || null,
      border: get('border') || null,
      text: get('text') || null,
      muted: get('muted') || null,
      action: get('action') || null
    },
    links,
    redirect_url: get('redirect_url') || null,
    retailer: get('retailer') || undefined,
    order: get('order') || undefined
  };

  return { profile, warnings };
}

/**
 * Serializes Profile JSON object back into client.txt format
 */
export function serializeClientText(profile, options = {}) {
  const lines = [
    `# LINKR profile data generated for ${profile.name || 'unnamed'}`,
    `template: ${profile.template || 'clean-white'}`
  ];

  if (profile.profile_mode && profile.profile_mode !== 'standard') {
    lines.push(`profile_mode: ${profile.profile_mode}`);
  }
  if (profile.redirect_url) {
    lines.push(`redirect_url: ${profile.redirect_url}`);
  }

  if (profile.name) lines.push(`name: ${profile.name}`);
  if (profile.company) lines.push(`company: ${profile.company}`);
  if (profile.title) lines.push(`title: ${profile.title}`);
  if (profile.title_link) lines.push(`title_link: ${profile.title_link}`);
  if (profile.bio) lines.push(`bio: ${profile.bio}`);
  if (profile.location) lines.push(`location: ${profile.location}`);
  if (profile.photo) lines.push(`photo: ${profile.photo}`);
  if (profile.company_logo) lines.push(`company_logo: ${profile.company_logo}`);
  if (profile.qr_code) lines.push(`qr_code: ${profile.qr_code}`);

  if (profile.show) {
    if (profile.show.name === false) lines.push('show_name: false');
    if (profile.show.title === false) lines.push('show_title: false');
    if (profile.show.bio === false) lines.push('show_bio: false');
    if (profile.show.photo === false) lines.push('show_photo: false');
    if (profile.show.company_logo === false) lines.push('show_company_logo: false');
  }

  if (profile.theme) {
    if (profile.theme.mode) lines.push(`theme: ${profile.theme.mode}`);
    if (profile.theme.accent) lines.push(`accent: ${profile.theme.accent}`);
    if (profile.theme.background) lines.push(`background: ${profile.theme.background}`);
    if (profile.theme.profile_bg) lines.push(`profile_bg: ${profile.theme.profile_bg}`);
    if (profile.theme.surface) lines.push(`surface: ${profile.theme.surface}`);
    if (profile.theme.border) lines.push(`border: ${profile.theme.border}`);
    if (profile.theme.text) lines.push(`text: ${profile.theme.text}`);
    if (profile.theme.muted) lines.push(`muted: ${profile.theme.muted}`);
    if (profile.theme.action) lines.push(`action: ${profile.theme.action}`);
  }

  if (Array.isArray(profile.links)) {
    let customIndex = 1;
    profile.links.forEach(link => {
      if (link.type === 'custom') {
        const labelPart = link.label ? ` | ${link.label}` : '';
        lines.push(`link_${customIndex++}: ${link.value}${labelPart}`);
      } else {
        const labelPart = link.label ? ` | ${link.label}` : '';
        lines.push(`${link.type}: ${link.value}${labelPart}`);
      }
    });
  }

  if (options.includeAdmin) {
    if (profile.retailer) lines.push(`retailer: ${profile.retailer}`);
    if (profile.order) lines.push(`order: ${profile.order}`);
  }

  return lines.join('\n') + '\n';
}
