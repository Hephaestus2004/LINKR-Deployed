// public/shared/vcard.js
// vCard 3.0 builder, Android Intent, and Save Contact logic

import { TYPES, normalizeUrl } from './links.js';

export const escapeVCard = value => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

export function buildVCard(profile) {
  const name = (profile.name || '').trim();
  if (!name) return '';

  const parts = name.split(/\s+/);
  const family = parts.length > 1 ? parts.pop() : '';
  const given = parts.join(' ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(family)};${escapeVCard(given)};;;`,
    `FN:${escapeVCard(name)}`
  ];

  if (profile.company) lines.push('ORG:' + escapeVCard(profile.company));
  if (profile.title) lines.push('TITLE:' + escapeVCard(profile.title));

  const links = Array.isArray(profile.links) ? profile.links : [];

  const phoneLink = links.find(l => l.type === 'phone');
  if (phoneLink) {
    lines.push('TEL;TYPE=CELL:' + String(phoneLink.value).replace(/\s+/g, ''));
  }

  const emailLink = links.find(l => l.type === 'email');
  if (emailLink) {
    lines.push('EMAIL:' + String(emailLink.value).trim());
  }

  const websiteLink = links.find(l => l.type === 'website');
  if (websiteLink) {
    lines.push('URL:' + normalizeUrl(websiteLink.value));
  }

  links.forEach(link => {
    if (['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'github'].includes(link.type)) {
      lines.push('URL:' + normalizeUrl(link.value));
    } else if (link.type === 'whatsapp') {
      lines.push('URL:' + TYPES.whatsapp.href(link.value));
    } else if (link.type === 'telegram') {
      lines.push('URL:' + TYPES.telegram.href(link.value));
    } else if (link.type === 'viber') {
      lines.push('URL:' + TYPES.viber.href(link.value));
    } else if (link.type === 'location') {
      lines.push('ADR;TYPE=WORK:;;' + escapeVCard(link.value) + ';;;;');
    }
  });

  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

export function buildAndroidIntent(profile) {
  const name = (profile.name || '').trim();
  const links = Array.isArray(profile.links) ? profile.links : [];
  const phone = (links.find(l => l.type === 'phone') || {}).value || '';
  const email = (links.find(l => l.type === 'email') || {}).value || '';
  const website = (links.find(l => l.type === 'website') || {}).value || '';

  const extras = [];
  const add = (key, val) => {
    if (val) extras.push(`S.${key}=${encodeURIComponent(val)}`);
  };

  add('name', name);
  if (phone) add('phone', phone.replace(/\s+/g, ''));
  if (email) add('email', email);
  if (profile.title) add('job_title', profile.title);
  if (profile.location) add('postal', profile.location);
  if (website) add('notes', normalizeUrl(website));

  return 'intent:#Intent;action=android.intent.action.INSERT;' +
    'type=vnd.android.cursor.dir/contact;' + extras.join(';') + ';end';
}

export function triggerVCardDownload(profile) {
  if (profile.vcard) {
    window.location.href = profile.vcard;
    return;
  }

  const vcfData = buildVCard(profile);
  if (!vcfData) return;

  const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const cleanName = (profile.name || 'contact')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '_');
  link.download = `${cleanName}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

export function setupSaveContact(saveBtn, fallbackBtn, profile) {
  if (!saveBtn) return;

  // Save contact requires a name per schema
  if (!profile.name || profile.profile_mode === 'logo_only') {
    saveBtn.hidden = true;
    if (fallbackBtn) fallbackBtn.hidden = true;
    return;
  }

  saveBtn.hidden = false;

  const ua = navigator.userAgent;
  const isAndroidChrome =
    /Android/.test(ua) && /Chrome\//.test(ua) &&
    !/SamsungBrowser|OPR\/|EdgA|Firefox|FBAN|FBAV|Instagram|Line\//.test(ua);

  saveBtn.onclick = () => {
    if (isAndroidChrome) {
      window.location.href = buildAndroidIntent(profile);
      if (fallbackBtn) fallbackBtn.hidden = false;
    } else {
      triggerVCardDownload(profile);
    }
  };

  if (fallbackBtn) {
    fallbackBtn.onclick = (e) => {
      e.preventDefault();
      triggerVCardDownload(profile);
    };
  }
}
