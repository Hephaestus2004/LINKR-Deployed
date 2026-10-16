// functions/vcard/[id].ts
// Server-generated .vcf endpoint for reliable Save Contact in mobile and in-app browsers

import { Env, ProfileRecord, ProfileData } from '../_lib/types';
import { normalizeId, isValidId } from '../_lib/ids';

function escapeVCard(value: string = ''): string {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const rawId = params.id as string;
  const id = normalizeId(rawId);

  if (!isValidId(id)) {
    return new Response('Invalid profile ID', { status: 400 });
  }

  try {
    const record = await env.DB
      .prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1')
      .bind(id)
      .first<ProfileRecord>();

    if (!record || record.status !== 'active') {
      return new Response('Profile not available', { status: 404 });
    }

    const profile: ProfileData = typeof record.data === 'string'
      ? JSON.parse(record.data)
      : record.data;

    const name = (profile.name || '').trim();
    if (!name) {
      return new Response('Profile does not have a contact name', { status: 400 });
    }

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
    const phone = links.find(l => l.type === 'phone');
    if (phone) lines.push('TEL;TYPE=CELL:' + String(phone.value).replace(/\s+/g, ''));

    const email = links.find(l => l.type === 'email');
    if (email) lines.push('EMAIL:' + String(email.value).trim());

    const website = links.find(l => l.type === 'website');
    if (website) lines.push('URL:' + website.value);

    if (profile.location) {
      lines.push('ADR;TYPE=WORK:;;' + escapeVCard(profile.location) + ';;;;');
    }

    lines.push('END:VCARD');
    const vcfContent = lines.join('\r\n') + '\r\n';

    const safeFilename = (name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'contact') + '.vcf';

    return new Response(vcfContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'public, max-age=600'
      }
    });
  } catch (err: any) {
    return new Response('Error generating contact card', { status: 500 });
  }
};
