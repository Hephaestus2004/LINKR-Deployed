// public/shared/ui.js
// DOM helpers, 3D flip card, Initials avatar, and sharing

import { ICONS } from './links.js';
import { applyProfileDesign } from './design.js';

/**
 * Generates an SVG Data URI initials avatar on accent background
 */
export function generateInitialsAvatar(name = '', accent = '#4f8daa') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'LR');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="100%" height="100%" rx="60" fill="${accent}"/>
    <text x="50%" y="54%" font-family="system-ui, sans-serif" font-size="44" font-weight="700" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">${initials}</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/**
 * Initializes the 3D flip card mechanics
 */
export function setupProfileFlip() {
  // Renderers call this after populating the profile; the data object is
  // available both on server-injected pages and the admin's live preview.
  const hasSectionLayout = applyProfileDesign(window.__LINKR_PROFILE__);

  const inner = document.getElementById('profile-inner');
  const buttons = document.querySelectorAll('.qr-toggle');
  const front = document.querySelector('.profile-front');
  const back = document.querySelector('.profile-back');

  if (!inner || !buttons.length) return;

  if (inner.__linkrFlipHandlers) {
    for (const [button, handler] of inner.__linkrFlipHandlers) button.removeEventListener('click', handler);
    delete inner.__linkrFlipHandlers;
  }

  if (hasSectionLayout) {
    inner.classList.remove('is-flipped');
    delete inner.dataset.flipInitialized;
    const qrSection = document.getElementById('profile-section-qr');
    const frontToggle = document.querySelector('.profile-front .qr-toggle');
    const backToggle = document.querySelector('#profile-section-qr .qr-toggle');
    const setQrView = showingQr => {
      if (!qrSection) return;
      qrSection.dataset.qrOpen = String(showingQr);
      document.querySelectorAll('#profile-sections .profile-custom-section').forEach(section => {
        section.hidden = showingQr
          ? section.dataset.section !== 'qr' || section.dataset.enabled !== 'true'
          : section.dataset.enabled !== 'true';
      });
    };
    if (frontToggle) frontToggle.onclick = () => setQrView(true);
    if (backToggle) backToggle.onclick = () => setQrView(false);
    return;
  }

  buttons.forEach(button => { button.onclick = null; });
  if (inner.dataset.flipInitialized === 'true') return;

  const handlers = [];
  buttons.forEach(button => {
    const handler = () => {
      const flipped = inner.classList.toggle('is-flipped');
      buttons.forEach(toggle => {
        toggle.setAttribute('aria-pressed', String(flipped));
        toggle.setAttribute('aria-label', flipped ? 'Show profile' : 'Show QR code');
      });
      if (front) front.setAttribute('aria-hidden', String(flipped));
      if (back) back.setAttribute('aria-hidden', String(!flipped));
    };
    button.addEventListener('click', handler);
    handlers.push([button, handler]);
  });
  inner.__linkrFlipHandlers = handlers;
  inner.dataset.flipInitialized = 'true';
}

/**
 * Shares the profile URL using Web Share or clipboard fallback
 */
export async function shareProfile(profile, currentUrl = window.location.href) {
  const name = profile.name || 'LINKR Profile';
  const company = profile.company || '';
  const shareData = {
    title: name,
    text: company ? `${name} — ${company}` : name,
    url: currentUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return 'copied';
  } catch (err) {
    console.error('Unable to copy profile link', err);
    return false;
  }
}

/**
 * Applies custom theme CSS variables with validation
 */
export function applyTheme(theme = {}) {
  const root = document.documentElement;
  if (theme.mode) {
    root.dataset.theme = theme.mode === 'dark' ? 'dark' : 'light';
  }

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

  mapping.forEach(([val, cssVar]) => {
    if (val && CSS.supports('color', val)) {
      root.style.setProperty(cssVar, val);
    }
  });
}
