// public/shared/links.js
// Centralized SVG icons, normalizers, and link type definitions

export const ICONS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  tiktok: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.1.1 15 2.2a13.4 13.4 0 0 0-6 0C5.9.1 4.7.5 4.7.5A5 5 0 0 0 4.6 4a5.4 5.4 0 0 0-1.4 3.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 9 18v4"/><path d="M9 18c-3.7 1.7-3.7-1.7-5.2-2"/>',
  messenger: '<path d="M12 3a9 9 0 0 0-9 8.7A8.6 8.6 0 0 0 5.8 18L4 21l3.5-1.8A9.4 9.4 0 0 0 12 21c5 0 9-4 9-9s-4-9-9-9Z"/><path d="m7 15 3-3 2 2 4-4-3 3-2-2-4 4Z"/>',
  whatsapp: '<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L4 20l.9-3.7A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.5 8.3c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c.5 1 1.3 1.8 2.3 2.3l.6-.5c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5 0 .3 0 .5-.4.7-.4.3-1 .4-1.5.2-2.1-.7-3.8-2.4-4.9-4.9-.2-.6-.1-1.2.2-1.7Z"/>',
  telegram: '<path d="m21 3-3.2 18-6.1-5.1-3.5 2.7.9-5.1L21 3Z"/><path d="m9.1 13.5 8.4-7.3-6.8 8.4"/>',
  viber: '<path d="M18.4 5.6C15.3 2.8 8.7 2.8 5.6 5.6c-2.3 2.1-2.5 5.7-1.7 8.7.5 1.7 1.5 3.1 3 4.1l-.4 2.5 2.5-.9c2.9 1.1 6.4.9 8.8-.8 2.7-1.9 3.2-5.3 2.8-8.4-.2-2.2-.8-3.9-2.2-5.2Z"/><path d="M8.3 8.1c.3-.3.6-.3.9-.1l1.3 1c.3.2.3.5.2.8l-.5.8c.5 1 1.3 1.8 2.4 2.3l.8-.5c.3-.2.6-.1.8.1l1 1.3c.2.3.2.6-.1.9-.5.5-1.1.7-1.7.5-2.8-.7-5.2-3-5.9-5.8-.2-.5.1-1 .8-1.3Z"/>',
  website: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  custom: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  save: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6"/><path d="M9 12h12"/>'
};

export const digits = value => String(value || '').replace(/\D/g, '');

export const internationalDigits = value => {
  const num = digits(value);
  return num.startsWith('0') ? '63' + num.slice(1) : num;
};

export const normalizeUrl = value => {
  if (!value) return '';
  const str = String(value).trim();
  return /^https?:\/\//i.test(str) ? str : 'https://' + str;
};

export const TYPES = {
  phone: {
    label: 'Phone',
    icon: 'phone',
    href: value => 'tel:' + String(value).replace(/\s+/g, '')
  },
  email: {
    label: 'Email',
    icon: 'email',
    href: value => 'mailto:' + String(value).trim()
  },
  website: {
    label: 'Website',
    icon: 'website',
    href: normalizeUrl
  },
  facebook: {
    label: 'Facebook',
    icon: 'facebook',
    href: normalizeUrl
  },
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    href: normalizeUrl
  },
  tiktok: {
    label: 'TikTok',
    icon: 'tiktok',
    href: normalizeUrl
  },
  youtube: {
    label: 'YouTube',
    icon: 'youtube',
    href: normalizeUrl
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'linkedin',
    href: normalizeUrl
  },
  github: {
    label: 'GitHub',
    icon: 'github',
    href: normalizeUrl
  },
  messenger: {
    label: 'Messenger',
    icon: 'messenger',
    href: normalizeUrl
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'whatsapp',
    href: value => /^https?:\/\//i.test(value)
      ? value
      : 'https://wa.me/' + internationalDigits(value)
  },
  telegram: {
    label: 'Telegram',
    icon: 'telegram',
    href: value => /^https?:\/\//i.test(value)
      ? value
      : 'https://t.me/' + String(value).replace(/^@/, '')
  },
  viber: {
    label: 'Viber',
    icon: 'viber',
    href: value => 'viber://chat?number=%2B' + internationalDigits(value)
  },
  location: {
    label: 'Location',
    icon: 'location',
    href: value => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(value)
  },
  custom: {
    label: 'Link',
    icon: 'custom',
    href: normalizeUrl
  }
};

// Priority order for quick actions from 03_DATA_SCHEMA.md Section 1.3
export const QUICK_ACTION_PRIORITY = [
  'phone',
  'email',
  'messenger',
  'facebook',
  'whatsapp',
  'viber',
  'telegram',
  'instagram',
  'website',
  'linkedin',
  'tiktok',
  'youtube',
  'github',
  'custom'
];

/**
 * Extracts quick actions and remaining links based on template max_quick_actions
 */
export function partitionLinks(links = [], maxQuickActions = 4) {
  if (!Array.isArray(links)) return { quickActions: [], remainingLinks: [] };

  const availableByType = new Map();
  links.forEach(link => {
    if (!availableByType.has(link.type)) {
      availableByType.set(link.type, []);
    }
    availableByType.get(link.type).push(link);
  });

  const quickActions = [];
  const quickActionSet = new Set();

  for (const type of QUICK_ACTION_PRIORITY) {
    if (quickActions.length >= maxQuickActions) break;
    const matching = availableByType.get(type);
    if (matching && matching.length > 0) {
      const selected = matching[0];
      quickActions.push(selected);
      quickActionSet.add(selected);
    }
  }

  const remainingLinks = links.filter(link => !quickActionSet.has(link));
  return { quickActions, remainingLinks };
}
