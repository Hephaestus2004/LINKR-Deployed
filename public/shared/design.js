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
    packStyle.textContent = `html[data-icon-pack="bold"] .qr-toggle svg,
      html[data-icon-pack="bold"] .quick-actions svg,
      html[data-icon-pack="bold"] .links svg,
      html[data-icon-pack="bold"] .save svg,
      html[data-icon-pack="bold"] .copy-link svg { stroke-width: 2.6; }`;
  } else if (packStyle) {
    packStyle.remove();
  }
}
