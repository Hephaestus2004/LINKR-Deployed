const linkTypes = [
  ['phone', 'Phone'], ['email', 'Email'], ['website', 'Website'], ['facebook', 'Facebook'],
  ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'], ['messenger', 'Messenger'], ['whatsapp', 'WhatsApp'], ['telegram', 'Telegram'],
  ['viber', 'Viber'], ['custom', 'Custom link']
];

const state = { photo: null, company_logo: null, background_image: null, phase: 'info' };
const byId = id => document.getElementById(id);

function addLinkRow(link = {}) {
  const row = document.createElement('div');
  row.className = 'link-row';
  const type = document.createElement('select');
  type.className = 'link-type';
  type.setAttribute('aria-label', 'Link type');
  for (const [value, label] of linkTypes) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (link.type === value) option.selected = true;
    type.appendChild(option);
  }
  const value = document.createElement('input');
  value.className = 'link-value';
  value.placeholder = 'Number, email, handle, or URL';
  value.maxLength = 400;
  value.value = typeof link.value === 'string' ? link.value : '';
  value.setAttribute('aria-label', 'Link value');
  const label = document.createElement('input');
  label.className = 'link-label';
  label.placeholder = 'Label (optional)';
  label.maxLength = 60;
  label.value = typeof link.label === 'string' ? link.label : '';
  label.setAttribute('aria-label', 'Custom link label');
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = '×';
  remove.setAttribute('aria-label', 'Remove link');
  remove.addEventListener('click', () => {
    if (byId('link-fields').children.length > 1) row.remove();
  });
  row.append(type, value, label, remove);
  byId('link-fields').appendChild(row);
}

function collectInfo() {
  const links = [...document.querySelectorAll('.link-row')].map(row => ({
    type: row.querySelector('.link-type').value,
    value: row.querySelector('.link-value').value.trim(),
    label: row.querySelector('.link-label').value.trim()
  })).filter(link => link.value);
  return {
    name: byId('name').value.trim(),
    company: byId('company').value.trim(),
    title: byId('title').value.trim(),
    title_link: byId('title-link').value.trim(),
    bio: byId('bio').value.trim(),
    location: byId('location').value.trim(),
    links,
    photo: state.photo,
    company_logo: state.company_logo,
    background_image: state.background_image
  };
}

function previewLinkHref(link) {
  if (link.type === 'phone') return `tel:${link.value.replace(/\s+/g, '')}`;
  if (link.type === 'email') return `mailto:${link.value}`;
  if (link.type === 'whatsapp' && /^[+0-9()\s.-]+$/.test(link.value)) return `https://wa.me/${link.value.replace(/\D/g, '')}`;
  if (link.type === 'telegram' && /^@?[A-Za-z0-9_]{3,32}$/.test(link.value)) return `https://t.me/${link.value.replace(/^@/, '')}`;
  try {
    const url = new URL(/^https?:\/\//i.test(link.value) ? link.value : `https://${link.value}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function enabledSections() {
  return [...document.querySelectorAll('.section-row')]
    .filter(row => row.querySelector('.section-enabled').checked)
    .map(row => row.dataset.section);
}

function showInputError(message = '') {
  const error = byId('form-error');
  error.textContent = message;
  error.hidden = !message;
}

function setPresetAccent() {
  const accents = { 'monochrome-photo': '#ffffff', 'gold-glass': '#e8c76a', 'gold-clean': '#d4af37' };
  byId('accent').value = accents[byId('theme-preset').value] || '#6f91a5';
}

function updatePreview() {
  if (state.phase !== 'design') return;
  const info = collectInfo();
  const preset = byId('theme-preset').value;
  document.documentElement.dataset.themePreset = preset;
  document.documentElement.dataset.template = byId('template').value;
  document.documentElement.dataset.iconPack = byId('icon-pack').value;
  document.documentElement.style.setProperty('--accent', byId('accent').value);
  document.documentElement.style.setProperty('--button', byId('accent').value);

  const identity = byId('preview-identity');
  const isLogoOnly = byId('profile-mode').value === 'logo_only';
  byId('preview-logo').hidden = !info.company_logo;
  if (info.company_logo) byId('preview-logo').src = info.company_logo;
  byId('preview-photo').hidden = !info.photo || isLogoOnly;
  if (info.photo && !isLogoOnly) byId('preview-photo').src = info.photo;
  byId('preview-name').textContent = isLogoOnly ? '' : info.name;
  byId('preview-company').textContent = isLogoOnly ? '' : info.company;
  byId('preview-title').textContent = isLogoOnly ? '' : info.title;
  byId('preview-bio').textContent = isLogoOnly ? '' : info.bio;
  identity.hidden = !enabledSections().includes('identity');

  const linkSection = byId('preview-links');
  linkSection.replaceChildren();
  for (const link of info.links) {
    const anchor = document.createElement('a');
    anchor.className = 'preview-link';
    anchor.textContent = link.label || linkTypes.find(([type]) => type === link.type)?.[1] || 'Link';
    const href = previewLinkHref(link);
    if (href) {
      anchor.href = href;
      if (href.startsWith('https:')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
    }
    linkSection.appendChild(anchor);
  }
  linkSection.hidden = !enabledSections().includes('links');
  byId('preview-share').hidden = !enabledSections().includes('share');
  byId('preview-qr').hidden = !enabledSections().includes('qr');

  const sectionOrder = enabledSections();
  for (let index = 0; index < sectionOrder.length; index++) {
    const section = byId(`preview-${sectionOrder[index]}`);
    if (section) byId('preview-identity').parentElement.appendChild(section);
  }

  const bg = byId('preview-bg');
  bg.hidden = !info.background_image;
  if (info.background_image) bg.src = info.background_image;
}

function safeFormUrl(value, label) {
  if (!value) return null;
  let url;
  try { url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); }
  catch { throw new Error(`${label} must be a valid URL.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(`${label} must use a public HTTP or HTTPS URL.`);
  return url.href;
}

async function compressImage(file, maxBytes, maxSide) {
  if (!file || !/^image\/(?:png|jpeg|webp)$/i.test(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    let width = image.naturalWidth;
    let height = image.naturalHeight;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image.');
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      for (const quality of [.86, .76, .66, .56, .46, .38]) {
        const dataUrl = canvas.toDataURL('image/webp', quality);
        const size = Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * .75);
        if (dataUrl.startsWith('data:image/webp') && size <= maxBytes) return dataUrl;
      }
      width = Math.max(1, Math.round(width * .78));
      height = Math.max(1, Math.round(height * .78));
    }
    throw new Error('This image could not be compressed below its upload limit. Try a smaller image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readImages() {
  const config = [
    ['photo', 300 * 1024, 1200],
    ['company-logo', 200 * 1024, 1000],
    ['background-image', 500 * 1024, 1600]
  ];
  for (const [inputId, limit, maxSide] of config) {
    const file = byId(inputId).files?.[0];
    if (!file) continue;
    state[inputId === 'company-logo' ? 'company_logo' : inputId.replace('-', '_')] = await compressImage(file, limit, maxSide);
  }
}

function showSubmitted(request) {
  byId('request-screen').hidden = true;
  byId('design-screen').hidden = true;
  byId('submitted-screen').hidden = false;
  byId('request-reference').textContent = request.req_uid;
  byId('request-expiry').textContent = request.expires_at ? `Request retained until ${request.expires_at} UTC.` : '';
}

async function initialize() {
  const statePanel = byId('access-state');
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    const session = await response.json();
    if (!response.ok || !session.active) {
      statePanel.textContent = 'This page needs a valid private invitation link. Ask the person who invited you for a new link if yours has expired.';
      return;
    }
    statePanel.hidden = true;
    if (session.request) { showSubmitted(session.request); return; }
    byId('request-screen').hidden = false;
  } catch {
    statePanel.textContent = 'The editor could not connect. Refresh the invitation link or try again later.';
  }
}

byId('add-link').addEventListener('click', () => {
  if (byId('link-fields').children.length < 15) addLinkRow();
});
addLinkRow({ type: 'website' });

byId('profile-form').addEventListener('submit', async event => {
  event.preventDefault();
  showInputError('');
  const info = collectInfo();
  if (!info.name) return showInputError('Enter your name.');
  if (!info.links.length) return showInputError('Add at least one contact link.');
  try {
    await readImages();
    safeFormUrl(info.title_link, 'Title link');
    state.phase = 'design';
    byId('request-screen').hidden = true;
    byId('design-screen').hidden = false;
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showInputError(error.message);
  }
});

byId('back-to-info').addEventListener('click', () => {
  state.phase = 'info';
  byId('design-screen').hidden = true;
  byId('request-screen').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

for (const id of ['template', 'profile-mode', 'theme-preset', 'icon-pack', 'accent']) {
  byId(id).addEventListener('input', updatePreview);
  byId(id).addEventListener('change', updatePreview);
}
byId('theme-preset').addEventListener('change', () => { setPresetAccent(); updatePreview(); });
byId('sections-list').addEventListener('input', updatePreview);
byId('sections-list').addEventListener('click', event => {
  const button = event.target.closest('.move-up, .move-down');
  if (!button) return;
  const row = button.closest('.section-row');
  if (button.classList.contains('move-up') && row.previousElementSibling) byId('sections-list').insertBefore(row, row.previousElementSibling);
  else if (button.classList.contains('move-down') && row.nextElementSibling) byId('sections-list').insertBefore(row.nextElementSibling, row);
  updatePreview();
});

byId('submit-request').addEventListener('click', async () => {
  const error = byId('design-error');
  error.textContent = '';
  error.hidden = true;
  const sections = enabledSections();
  if (!sections.length) {
    error.textContent = 'Choose at least one page section.';
    error.hidden = false;
    return;
  }
  let payload;
  try {
    const info = collectInfo();
    payload = {
      ...info,
      title_link: safeFormUrl(info.title_link, 'Title link'),
      template: byId('template').value,
      profile_mode: byId('profile-mode').value,
      accent: byId('accent').value,
      design: {
        themePreset: byId('theme-preset').value,
        iconPack: byId('icon-pack').value,
        sections
      }
    };
  } catch (errorValue) {
    error.textContent = errorValue.message;
    error.hidden = false;
    return;
  }
  const button = byId('submit-request');
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    const response = await fetch('/api/request', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not submit the request.');
    showSubmitted(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (submitError) {
    error.textContent = submitError.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Send for review';
  }
});

setPresetAccent();
initialize();
