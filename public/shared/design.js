// Safe, data-driven profile design presets. User input selects IDs only.

const THEME_PRESETS = Object.freeze({
  'monochrome-photo': {
    mode: 'dark',
    accent: '#ffffff',
    background: '#080808',
    profile_bg: 'rgba(10, 10, 10, .82)',
    surface: 'rgba(10, 10, 10, .78)',
    border: 'rgba(255, 255, 255, .72)',
    text: '#ffffff',
    muted: '#d0d0d0',
    action: '#ffffff'
  },
  'gold-glass': {
    mode: 'dark',
    accent: '#e8c76a',
    background: '#070906',
    profile_bg: 'rgba(8, 24, 12, .72)',
    surface: 'rgba(10, 22, 13, .62)',
    border: 'rgba(212, 175, 55, .52)',
    text: '#f8f3dc',
    muted: '#d4c995',
    action: '#e8c76a'
  },
  'gold-clean': {
    mode: 'dark',
    accent: '#d4af37',
    background: '#090a0c',
    profile_bg: '#15150f',
    surface: '#1c1b14',
    border: 'rgba(212, 175, 55, .36)',
    text: '#f8f6f0',
    muted: '#b9b19a',
    action: '#d4af37'
  }
});

const ICON_PACK_IDS = new Set(['classic', 'bold']);
const ICON_PACK_STYLE_ID = 'linkr-icon-pack-style';
const SECTION_IDS = ['identity', 'links', 'share', 'qr'];

function getSectionStyle() {
  let style = document.getElementById('linkr-section-layout-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'linkr-section-layout-style';
    style.textContent = `
      #profile-sections { display: flex; flex-direction: column; gap: 18px; }
      .profile-custom-section[hidden] { display: none !important; }
      #profile-section-identity { display: flex; flex-direction: column; gap: 18px; }
      #profile-section-identity .profile-flip { margin-bottom: 0; }
      #profile-section-qr .profile-back { display: flex; transform: none; pointer-events: auto; backface-visibility: visible; }
      #profile-section-qr .profile-back[hidden] { display: none !important; }
    `;
    document.head.appendChild(style);
  }
}

function restoreTemplateLayout() {
  const card = document.querySelector('main.card');
  const sections = document.getElementById('profile-sections');
  if (!card || !sections) return;

  const inner = card.querySelector('#profile-inner');
  const back = sections.querySelector('.profile-back');
  if (back && inner) inner.appendChild(back);

  const links = card.querySelector('#links');
  const shareList = sections.querySelector('#profile-share-list');
  const shareItem = shareList?.querySelector('li');
  if (shareItem && links) links.insertBefore(shareItem, links.firstChild);

  const identity = sections.querySelector('#profile-section-identity');
  const flip = identity?.querySelector('.profile-flip');
  if (flip) card.insertBefore(flip, sections);
  for (const selector of ['#save', '#visit-us', '#vcf-fallback']) {
    const element = identity?.querySelector(selector);
    if (element) card.insertBefore(element, sections);
  }
  if (links) card.insertBefore(links, sections);

  sections.remove();
  delete card.dataset.profileSections;
  delete document.documentElement.dataset.profileLayout;
  if (inner) inner.classList.remove('is-flipped');
  if (back) {
    back.hidden = false;
    back.setAttribute('aria-hidden', 'true');
  }
  const front = card.querySelector('.profile-front');
  if (front) {
    front.hidden = false;
    front.setAttribute('aria-hidden', 'false');
  }
  const quickActions = card.querySelector('#quick-actions');
  if (quickActions) quickActions.hidden = false;
  card.querySelectorAll('.qr-toggle').forEach(button => { button.onclick = null; });
  if (front) front.hidden = false;
}

function applySectionLayout(profile) {
  const sectionsList = profile?.design?.sections;
  const card = document.querySelector('main.card');
  if (!Array.isArray(sectionsList) || !sectionsList.length || !card) {
    restoreTemplateLayout();
    return false;
  }

  const enabledIds = [...new Set(sectionsList.filter(id => SECTION_IDS.includes(id)))];
  if (!enabledIds.length) return false;

  let shell = document.getElementById('profile-sections');
  if (!shell) {
    const inner = card.querySelector('#profile-inner');
    const flip = card.querySelector('.profile-flip');
    const links = card.querySelector('#links');
    const back = card.querySelector('.profile-back');
    if (!inner || !flip || !links || !back) return false;

    shell = document.createElement('div');
    shell.id = 'profile-sections';
    const identity = document.createElement('section');
    identity.className = 'profile-custom-section';
    identity.id = 'profile-section-identity';
    const linkSection = document.createElement('section');
    linkSection.className = 'profile-custom-section';
    linkSection.id = 'profile-section-links';
    const shareSection = document.createElement('section');
    shareSection.className = 'profile-custom-section';
    shareSection.id = 'profile-section-share';
    const qrSection = document.createElement('section');
    qrSection.className = 'profile-custom-section';
    qrSection.id = 'profile-section-qr';
    const shareList = document.createElement('ul');
    shareList.className = 'links';
    shareList.id = 'profile-share-list';
    shareSection.appendChild(shareList);

    identity.appendChild(flip);
    for (const selector of ['#save', '#visit-us', '#vcf-fallback']) {
      const action = card.querySelector(selector);
      if (action) identity.appendChild(action);
    }
    linkSection.appendChild(links);
    qrSection.appendChild(back);
    shell.append(identity, linkSection, shareSection, qrSection);
    card.prepend(shell);
  }

  const links = shell.querySelector('#links');
  const shareList = shell.querySelector('#profile-share-list');
  const shareItem = links?.querySelector('.share-profile')?.closest('li');
  if (shareItem && shareList) shareList.replaceChildren(shareItem);

  const sectionNodes = new Map(SECTION_IDS.map(id => [id, shell.querySelector(`#profile-section-${id}`)]));
  for (const id of SECTION_IDS) {
    const section = sectionNodes.get(id);
    if (section) {
      section.dataset.section = id;
      section.dataset.enabled = String(enabledIds.includes(id));
      section.hidden = !enabledIds.includes(id);
    }
  }
  shell.append(...SECTION_IDS.map(id => sectionNodes.get(id)).filter(Boolean).sort((a, b) => {
    const orderA = enabledIds.indexOf(a.dataset.section);
    const orderB = enabledIds.indexOf(b.dataset.section);
    return (orderA < 0 ? SECTION_IDS.length : orderA) - (orderB < 0 ? SECTION_IDS.length : orderB);
  }));

  const qrBack = shell.querySelector('.profile-back');
  const qrToggle = card.querySelector('.profile-front .qr-toggle');
  const backToggle = qrBack?.querySelector('.qr-toggle');
  const quickActions = card.querySelector('#quick-actions');
  if (qrToggle) qrToggle.hidden = !enabledIds.includes('qr');
  if (backToggle) backToggle.hidden = !enabledIds.includes('identity');
  if (quickActions) quickActions.hidden = !enabledIds.includes('links');
  getSectionStyle();
  card.dataset.profileSections = 'true';
  document.documentElement.dataset.profileLayout = 'sections';
  return true;
}

function applySafeTheme(theme = {}) {
  const root = document.documentElement;
  if (theme.mode) root.dataset.theme = theme.mode === 'dark' ? 'dark' : 'light';
  const mapping = [
    [theme.accent, '--accent'],
    [theme.background, '--bg'],
    [theme.profile_bg, '--profile-bg'],
    [theme.surface, '--surface'],
    [theme.border, '--border'],
    [theme.text, '--text'],
    [theme.muted, '--muted'],
    [theme.action, '--action']
  ];
  mapping.forEach(([value, property]) => {
    if (value && CSS.supports('color', value)) root.style.setProperty(property, value);
  });
}

/** Apply only repository-defined design presets; arbitrary markup is never read. */
export function applyProfileDesign(profile, templateDefaults = {}) {
  const design = profile?.design && typeof profile.design === 'object' ? profile.design : {};
  const preset = THEME_PRESETS[design.themePreset] || {};
  if (Object.keys(preset).length) {
    applySafeTheme({ ...templateDefaults, ...preset, ...(profile?.theme || {}) });
  }
  const hasSectionLayout = applySectionLayout(profile);

  const root = document.documentElement;
  const backgroundImage = typeof profile?.background_image === 'string' ? profile.background_image : '';
  let safeBackgroundUrl = '';
  const mediaPath = /^\/media\/backgrounds\/[a-z0-9_-]+\.(?:webp|png|jpg)$/i;
  const uploadDataUrl = /^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/]+=*$/i;
  try {
    if (uploadDataUrl.test(backgroundImage) && backgroundImage.length <= 700 * 1024) {
      safeBackgroundUrl = backgroundImage;
    } else {
      const candidate = new URL(backgroundImage, window.location.origin);
      if (candidate.origin === window.location.origin && !candidate.search && !candidate.hash && mediaPath.test(candidate.pathname)) {
        safeBackgroundUrl = `${candidate.origin}${candidate.pathname}`;
      }
    }
  } catch {}
  document.body.style.backgroundImage = safeBackgroundUrl
    ? `linear-gradient(rgba(0, 0, 0, .38), rgba(0, 0, 0, .38)), url("${safeBackgroundUrl}")`
    : '';
  if (safeBackgroundUrl) {
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.removeProperty('background-size');
    document.body.style.removeProperty('background-position');
    document.body.style.removeProperty('background-attachment');
  }

  const iconPack = ICON_PACK_IDS.has(design.iconPack) ? design.iconPack : 'classic';
  root.dataset.iconPack = iconPack;
  let packStyle = document.getElementById(ICON_PACK_STYLE_ID);
  if (iconPack === 'bold') {
    if (!packStyle) {
      packStyle = document.createElement('style');
      packStyle.id = ICON_PACK_STYLE_ID;
      document.head.appendChild(packStyle);
    }
    packStyle.textContent = `html[data-icon-pack="bold"] .profile svg,
      html[data-icon-pack="bold"] .quick-actions svg,
      html[data-icon-pack="bold"] #save svg,
      html[data-icon-pack="bold"] #links svg,
      html[data-icon-pack="bold"] .copy-link svg { stroke-width: 2.6; }`;
  } else if (packStyle) {
    packStyle.remove();
  }
  return hasSectionLayout;
}
