const ICONS = {
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
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  ,share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>'
};

const digits = value => value.replace(/\D/g, '');
const internationalDigits = value => {
  const number = digits(value);
  return number.startsWith('0') ? '63' + number.slice(1) : number;
};
const url = value => /^https?:\/\//i.test(value) ? value : 'https://' + value;
const getValue = (items, key) => (items.find(item => item.key === key) || {}).value || '';
const isEnabled = (items, key, fallback = true) => {
  const value = getValue(items, key);
  return value ? !['false', 'no', '0', 'off'].includes(value.toLowerCase()) : fallback;
};

function applyCustomization(items) {
  const root = document.documentElement;
  const theme = getValue(items, 'theme').toLowerCase();
  root.dataset.theme = theme === 'dark' ? 'dark' : 'light';

  [
    ['accent', '--accent'],
    ['background', '--bg'],
    ['profile_bg', '--profile-bg'],
    ['surface', '--surface'],
    ['border', '--border'],
    ['text', '--text'],
    ['muted', '--muted'],
    ['action', '--action']
  ].forEach(([key, variable]) => {
    const value = getValue(items, key);
    if (value && CSS.supports('color', value)) root.style.setProperty(variable, value);
  });
}

function applyProfileMode(items) {
  const front = document.querySelector('.profile-front');
  const mode = getValue(items, 'profile_mode').toLowerCase();
  const logoOnly = mode === 'logo_only' || mode === 'logo-only';
  front.classList.toggle('logo-only', logoOnly);

  [
    ['name', 'name'],
    ['title', 'title'],
    ['bio', 'bio'],
    ['photo', 'photo'],
    ['company_logo', 'company-logo']
  ].forEach(([key, id]) => {
    const element = document.getElementById(id);
    const defaultVisible = key === 'company_logo' || key === 'name' || key === 'title' || key === 'photo';
    const visible = logoOnly
      ? key === 'company_logo'
      : isEnabled(items, `show_${key}`, defaultVisible);
    if (element) element.hidden = !visible;
  });

  if (logoOnly) {
    document.querySelector('.profile-main').hidden = true;
  } else {
    document.querySelector('.profile-main').hidden = false;
  }
}

function setupProfileFlip() {
  const inner = document.getElementById('profile-inner');
  const buttons = document.querySelectorAll('.qr-toggle');
  if (!inner || !buttons.length) return;

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const flipped = inner.classList.toggle('is-flipped');
      buttons.forEach(toggle => {
        toggle.setAttribute('aria-pressed', String(flipped));
        toggle.setAttribute('aria-label', flipped ? 'Show profile' : 'Show QR code');
      });
      document.querySelector('.profile-front').setAttribute('aria-hidden', String(flipped));
      document.querySelector('.profile-back').setAttribute('aria-hidden', String(!flipped));
    });
  });
}

setupProfileFlip();

const TYPES = {
  phone: { label: 'Phone', icon: 'phone', href: value => 'tel:' + value.replace(/\s+/g, '') },
  email: { label: 'Email', icon: 'email', href: value => 'mailto:' + value },
  facebook: { label: 'Facebook', icon: 'facebook', href: url },
  instagram: { label: 'Instagram', icon: 'instagram', href: url },
  tiktok: { label: 'TikTok', icon: 'tiktok', href: url },
  youtube: { label: 'YouTube', icon: 'youtube', href: url },
  linkedin: { label: 'LinkedIn', icon: 'linkedin', href: url },
  github: { label: 'GitHub', icon: 'github', href: url },
  messenger: { label: 'Messenger', icon: 'messenger', href: url },
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
      : 'https://t.me/' + value.replace(/^@/, '')
  },
  viber: { label: 'Viber', icon: 'viber', href: value => 'viber://chat?number=%2B' + internationalDigits(value) },
  website: { label: 'Website', icon: 'website', href: url },
  location: { label: 'Location', icon: 'location', href: value => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(value) }
};

function parse(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf(':');
      if (separator < 0) return null;

      const key = line.slice(0, separator).trim().toLowerCase();
      let value = line.slice(separator + 1).trim();
      let label = '';
      const bar = value.lastIndexOf(' | ');
      if (bar > -1) {
        label = value.slice(bar + 3).trim();
        value = value.slice(0, bar).trim();
      }
      return { key, value, label };
    })
    .filter(Boolean);
}

const escapeVCard = value => value
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

function setupSave(items) {
  const get = key => (items.find(item => item.key === key) || {}).value || '';
  const name = get('name');
  if (!name) return;

  const ua = navigator.userAgent;
  const androidChrome =
    /Android/.test(ua) && /Chrome\//.test(ua) &&
    !/SamsungBrowser|OPR\/|EdgA|Firefox|FBAN|FBAV|Instagram|Line\//.test(ua);

  function buildVcf() {
    const parts = name.trim().split(/\s+/);
    const family = parts.length > 1 ? parts.pop() : '';
    const given = parts.join(' ');
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${escapeVCard(family)};${escapeVCard(given)};;;`,
      `FN:${escapeVCard(name)}`
    ];

    if (get('company')) lines.push('ORG:' + escapeVCard(get('company')));
    if (get('title')) lines.push('TITLE:' + escapeVCard(get('title')));
    if (get('phone')) lines.push('TEL;TYPE=CELL:' + get('phone').replace(/\s+/g, ''));
    if (get('email')) lines.push('EMAIL:' + get('email'));
    if (get('website')) lines.push('URL:' + url(get('website')));
    ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'].forEach(key => {
      if (get(key)) lines.push('URL:' + url(get(key)));
    });
    if (get('whatsapp')) lines.push('URL:' + TYPES.whatsapp.href(get('whatsapp')));
    if (get('telegram')) lines.push('URL:' + TYPES.telegram.href(get('telegram')));
    if (get('viber')) lines.push('URL:' + TYPES.viber.href(get('viber')));
    if (get('location')) lines.push('ADR;TYPE=WORK:;;' + escapeVCard(get('location')) + ';;;;');
    lines.push('END:VCARD');
    return lines.join('\r\n') + '\r\n';
  }

  function saveFile() {
    const staticVcf = get('vcard');
    if (staticVcf) {
      window.location.href = staticVcf;
      return;
    }

    const blob = new Blob([buildVcf()], { type: 'text/vcard;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'contact') + '.vcf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function androidIntent() {
    const extras = [];
    const add = (key, value) => {
      if (value) extras.push(`S.${key}=${encodeURIComponent(value)}`);
    };

    add('name', name);
    add('phone', get('phone').replace(/\s+/g, ''));
    add('email', get('email'));
    add('job_title', get('title'));
    add('postal', get('location'));
    add('notes', get('website') ? url(get('website')) : '');
    return 'intent:#Intent;action=android.intent.action.INSERT;' +
      'type=vnd.android.cursor.dir/contact;' + extras.join(';') + ';end';
  }

  const button = document.getElementById('save');
  const fallback = document.getElementById('vcf-fallback');
  button.hidden = false;
  button.addEventListener('click', () => {
    if (androidChrome) {
      window.location.href = androidIntent();
      fallback.hidden = false;
    } else {
      saveFile();
    }
  });

  fallback.addEventListener('click', event => {
    event.preventDefault();
    saveFile();
  });
}

function setupQuickActions(items) {
  const get = key => (items.find(item => item.key === key) || {}).value || '';
  const actions = [
    { key: 'phone', label: 'Call' },
    { key: 'email', label: 'Email' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'website', label: 'Website' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'github', label: 'GitHub' },
  ];
  const container = document.getElementById('quick-actions');

  actions.forEach(({ key, label }) => {
    const value = get(key);
    const type = TYPES[key];
    if (!value || !type) return;

    const link = document.createElement('a');
    link.className = `action-${key}`;
    link.href = type.href(value);
    link.setAttribute('aria-label', label);
    link.title = label;
    if (link.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    link.innerHTML = `<span class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[type.icon]}</svg></span><span class="action-label">${label}</span>`;
    container.appendChild(link);
  });
}

fetch('client.txt', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`Could not load client.txt: ${response.status}`);
    return response.text();
  })
  .then(text => {
    const items = parse(text);
    const list = document.getElementById('links');
    const quickActionKeys = new Set([
      'viber', 'whatsapp', 'telegram', 'email', 'facebook',
      'website', 'instagram', 'linkedin', 'github'
    ]);

    items.forEach(({ key, value, label }) => {
      if (key === 'name') {
        document.getElementById('name').textContent = value;
        const company = getValue(items, 'company');
        document.title = company ? `${value} — ${company}` : value;
        return;
      }
      if (key === 'company') {
        document.getElementById('company-logo-link').setAttribute('aria-label', value);
        return;
      }
      if (key === 'title') {
        const title = document.getElementById('title');
        const titleLink = (items.find(item => item.key === 'title_link') || {}).value || '';
        if (!titleLink) {
          title.textContent = value;
          return;
        }
        const link = document.createElement('a');
        link.href = titleLink;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = value;
        title.appendChild(link);
        return;
      }
      if (key === 'bio') {
        document.getElementById('bio').textContent = value;
        return;
      }
      if (key === 'location') {
        const location = document.getElementById('location');
        location.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.location}</svg><span></span>`;
        location.querySelector('span').textContent = value;
        return;
      }
      if (['theme', 'accent', 'background', 'profile_bg', 'surface', 'border', 'text', 'muted', 'action',
        'profile_mode', 'show_name', 'show_title', 'show_bio', 'show_photo', 'show_company_logo'].includes(key)) return;
      if (key === 'photo') {
        const image = document.getElementById('photo');
        image.src = encodeURI(value);
        image.alt = (items.find(item => item.key === 'name') || {}).value || 'Profile photo';
        image.hidden = false;
        return;
      }
      if (key === 'qr_code') {
        const qr = document.querySelector('.profile-qr');
        qr.src = encodeURI(value);
        return;
      }
      if (key === 'company_logo') {
        const logo = document.getElementById('company-logo');
        logo.src = encodeURI(value);
        logo.hidden = false;
        return;
      }
      if (key === 'title_link') {
        document.getElementById('company-logo-link').href = value;
        return;
      }
      if (key === 'phone') {
        const item = document.createElement('li');
        const share = document.createElement('button');
        share.className = 'share-profile';
        share.type = 'button';
        share.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.share}</svg><span>Share profile</span>`;
        share.addEventListener('click', async () => {
          const company = getValue(items, 'company');
          const shareData = {
            title: document.title,
            text: company ? `${name} - ${company}` : name,
            url: window.location.href
          };
          try {
            if (navigator.share) {
              await navigator.share(shareData);
              return;
            }
            await navigator.clipboard.writeText(shareData.url);
            share.querySelector('span').textContent = 'Link copied';
            setTimeout(() => { share.querySelector('span').textContent = 'Share profile'; }, 1400);
          } catch (error) {
            if (error.name !== 'AbortError') console.error('Unable to share profile.', error);
          }
        });
        item.appendChild(share);
        list.appendChild(item);
        return;
      }
      if (quickActionKeys.has(key)) return;

      const type = TYPES[key];
      if (!type || !value) return;

      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = type.href(value);
      if (link.href.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[type.icon]}</svg>`;

      const content = document.createElement('span');
      content.className = 'link-content';
      const labelText = document.createElement('span');
      labelText.className = 'link-label';
      labelText.textContent = key === 'phone' || key === 'email'
        ? value
        : label || type.label;
      content.appendChild(labelText);
      if (!['phone', 'email', 'facebook', 'viber', 'whatsapp', 'telegram'].includes(key)) {
        const valueText = document.createElement('span');
        valueText.className = 'link-value';
        valueText.textContent = value;
        content.appendChild(valueText);
      }
      link.appendChild(content);
      item.appendChild(link);

      if (key === 'phone' || key === 'email') {
        const copy = document.createElement('button');
        copy.className = 'copy-link';
        copy.type = 'button';
        copy.textContent = 'Copy';
        copy.addEventListener('click', async event => {
          event.preventDefault();
          try {
            await navigator.clipboard.writeText(value);
            copy.textContent = 'Copied';
            setTimeout(() => { copy.textContent = 'Copy'; }, 1400);
          } catch (error) {
            console.error('Unable to copy contact detail.', error);
          }
        });
        item.appendChild(copy);
      }
      list.appendChild(item);
    });

    setupSave(items);
    setupQuickActions(items);
    applyCustomization(items);
    applyProfileMode(items);
  })
  .catch(error => {
    console.error('Unable to load contact information.', error);
  });
